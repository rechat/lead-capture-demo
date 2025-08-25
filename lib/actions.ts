"use server"

interface Assignee {
  email: string
  phone_number: string
  first_name: string
  last_name: string
  mls: string
  mls_id: string
}

interface Address {
  building?: string | null
  house_num?: string | null
  predir?: string | null
  qual?: string | null
  pretype?: string | null
  name?: string | null
  suftype?: string | null
  sufdir?: string | null
  ruralroute?: string | null
  extra?: string | null
  city?: string | null
  state?: string | null
  county?: string | null
  country?: string | null
  postcode?: string | null
  box?: string | null
  unit?: string | null
  line1?: string | null
  line2?: string | null
  full?: string | null
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
  address: Address
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
    if (formData.address && Object.keys(formData.address).length > 0) {
      // Only include non-null address fields
      const addressFields = Object.fromEntries(
        Object.entries(formData.address).filter(([_, value]) => value !== null && value !== "")
      )
      if (Object.keys(addressFields).length > 0) {
        payload.address = addressFields
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
