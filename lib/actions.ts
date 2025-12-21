interface Assignee {
  email: string
  phone_number: string
  first_name: string
  last_name: string
  mls: string
  mls_id: string
}

interface Address {
  street_number?: string | null
  street_name?: string | null
  city?: string | null
  state_code?: string | null
  postal_code?: string | null
  street_suffix?: string | null
  unit_number?: string | null
  country?: string | null
  direction?: string | null
  street_dir_prefix?: string | null
  street_dir_suffix?: string | null
  street_address?: string | null
  full_address?: string | null
}

interface Listing {
  price?: number | null
  mls_number?: string | null
  cover_image_url?: string | null
  property: {
    address: Address
  }
}

interface LeadFormData {
  leadChannel: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  tags: string[]
  leadSource: string
  note: string
  listing: Listing
  refererUrl: string
  assignees: Assignee[]
}

export async function submitLeadCapture(formData: LeadFormData) {
  const endpoint = `https://api.rechat.com/leads/channels/${formData.leadChannel}/webhook`

  try {
    const payload: Record<string, any> = {}

    if (formData.firstName) payload.first_name = formData.firstName
    if (formData.lastName) payload.last_name = formData.lastName
    if (formData.email) payload.email = formData.email
    if (formData.phoneNumber) payload.phone_number = formData.phoneNumber
    if (formData.tags && formData.tags.length > 0) payload.tag = formData.tags
    if (formData.leadSource) payload.lead_source = formData.leadSource
    if (formData.note) payload.note = formData.note

    // Build listing object if any listing data exists
    if (formData.listing) {
      const listingData: Record<string, any> = {}

      if (formData.listing.price) listingData.price = formData.listing.price
      if (formData.listing.mls_number) listingData.mls_number = formData.listing.mls_number
      if (formData.listing.cover_image_url) listingData.cover_image_url = formData.listing.cover_image_url

      // Only include non-null address fields
      if (formData.listing.property?.address && Object.keys(formData.listing.property.address).length > 0) {
        const addressFields = Object.fromEntries(
          Object.entries(formData.listing.property.address).filter(([_, value]) => value !== null && value !== "")
        )
        if (Object.keys(addressFields).length > 0) {
          listingData.property = {
            address: addressFields
          }
        }
      }

      if (Object.keys(listingData).length > 0) {
        payload.listing = listingData
      }
    }

    if (formData.refererUrl) payload.referer_url = formData.refererUrl
    if (formData.assignees && formData.assignees.length > 0) {
      // Filter out empty assignees
      const validAssignees = formData.assignees.filter(
        (assignee) => assignee.email || assignee.phone_number || assignee.first_name || assignee.last_name,
      )
      if (validAssignees.length > 0) {
        payload.assignees = validAssignees
      }
    }

    console.log("Submitting to endpoint:", endpoint)
    console.log("Payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    // Handle 204 No Content response (successful submission with no body)
    if (response.status === 204) {
      return {
        success: true,
        data: {
          status: "success",
          message: "Lead submitted successfully",
          statusCode: 204,
          endpoint: endpoint,
          payload: payload,
        },
      }
    }

    // For other status codes, try to parse response
    let responseData
    const responseText = await response.text()
    console.log("Response text:", responseText)

    if (responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        responseData = { rawResponse: responseText }
      }
    } else {
      responseData = { message: "Empty response body" }
    }

    if (response.ok) {
      return {
        success: true,
        data: {
          status: "success",
          message: "Lead submitted successfully",
          statusCode: response.status,
          response: responseData,
          endpoint: endpoint,
          payload: payload,
        },
      }
    } else {
      return {
        success: false,
        error: `Submission failed with status ${response.status}: ${JSON.stringify(responseData)}`,
      }
    }
  } catch (error: any) {
    console.error("Submission error:", error)
    return {
      success: false,
      error: `Submission failed: ${error.message}`,
      details: {
        endpoint: endpoint,
        error: error.toString(),
      },
    }
  }
}
