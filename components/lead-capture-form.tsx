"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { submitLeadCapture } from "@/lib/actions"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

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

export function LeadCaptureForm() {
  const [formData, setFormData] = useState<LeadFormData>({
    uniqueEndpointId: "54a57918-ad9b-4adb-a35a-9232bf78d734",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    tag: "website_inquiry",
    leadSource: "real_estate_website",
    note: "",
    address: "",
    refererUrl: "",
    mlsid: "DEMO123456",
    agentMlsid: "AGENT789",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [responseData, setResponseData] = useState<any>(null)

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")
    setResponseData(null)

    try {
      const result = await submitLeadCapture(formData)

      if (result.success) {
        setSubmitStatus("success")
        setResponseData(result.data)
      } else {
        setSubmitStatus("error")
        setErrorMessage(result.error || "Failed to submit lead")
      }
    } catch (error) {
      setSubmitStatus("error")
      setErrorMessage("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearForm = () => {
    setFormData({
      ...formData,
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      note: "",
      address: "",
      refererUrl: "",
    })
    setSubmitStatus("idle")
    setResponseData(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Lead Capture API Test</CardTitle>
        <p className="text-sm text-gray-600 text-center">
          All fields are optional. The unique endpoint ID serves as both identifier and authentication.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Configuration */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">API Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="uniqueEndpointId">Unique Endpoint ID</Label>
              <Input
                id="uniqueEndpointId"
                type="text"
                value={formData.uniqueEndpointId}
                onChange={(e) => handleInputChange("uniqueEndpointId", e.target.value)}
                placeholder="Your unique endpoint ID"
              />
              <p className="text-sm text-gray-500">
                This serves as both the endpoint identifier and authentication key
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tag">Tag</Label>
                <Input
                  id="tag"
                  type="text"
                  value={formData.tag}
                  onChange={(e) => handleInputChange("tag", e.target.value)}
                  placeholder="website_inquiry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Input
                  id="leadSource"
                  type="text"
                  value={formData.leadSource}
                  onChange={(e) => handleInputChange("leadSource", e.target.value)}
                  placeholder="real_estate_website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mlsid">MLS ID</Label>
                <Input
                  id="mlsid"
                  type="text"
                  value={formData.mlsid}
                  onChange={(e) => handleInputChange("mlsid", e.target.value)}
                  placeholder="DEMO123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentMlsid">Agent MLS ID</Label>
                <Input
                  id="agentMlsid"
                  type="text"
                  value={formData.agentMlsid}
                  onChange={(e) => handleInputChange("agentMlsid", e.target.value)}
                  placeholder="AGENT789"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refererUrl">Referer URL</Label>
                <Input
                  id="refererUrl"
                  type="url"
                  value={formData.refererUrl}
                  onChange={(e) => handleInputChange("refererUrl", e.target.value)}
                  placeholder="https://example.com/property/123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="Additional notes or message..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <span>Lead submitted successfully!</span>
              </div>
              {responseData && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <Label className="text-sm font-medium text-gray-700">API Response:</Label>
                  <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {submitStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Lead...
                </>
              ) : (
                "Submit Lead"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={clearForm} className="bg-transparent">
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
