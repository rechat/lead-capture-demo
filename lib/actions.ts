"use server"

interface LeadFormData {
  uniqueEndpointId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  tag: string
  leadSource: string
  note: string
  address: string
  refererUrl: string
  mlsid: string
  agentMlsid: string
}

export async function submitLeadCapture(formData: LeadFormData) {
  const endpoint = `https://api.rechat.com/leads/channels/${formData.uniqueEndpointId}/webhook`

  try {
    const payload: Record<string, string> = {}

    if (formData.firstName) payload.first_name = formData.firstName
    if (formData.lastName) payload.last_name = formData.lastName
    if (formData.email) payload.email = formData.email
    if (formData.phoneNumber) payload.phone_number = formData.phoneNumber
    if (formData.tag) payload.tag = formData.tag
    if (formData.leadSource) payload.lead_source = formData.leadSource
    if (formData.note) payload.note = formData.note
    if (formData.address) payload.address = formData.address
    if (formData.refererUrl) payload.referer_url = formData.refererUrl
    if (formData.mlsid) payload.mlsid = formData.mlsid
    if (formData.agentMlsid) payload.agent_mlsid = formData.agentMlsid

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
