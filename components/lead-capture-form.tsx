"use client"

import { useEffect } from "react"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { submitLeadCapture } from "@/lib/actions"
import { ActivityTracker } from "@/components/activity-tracker"
import { Loader2, CheckCircle, AlertCircle, X, Plus, Minus } from "lucide-react"

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

const defaultFormData: LeadFormData = {
  leadChannel: "54a57918-ad9b-4adb-a35a-9232bf78d734",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  tags: ["website_inquiry"],
  leadSource: "real_estate_website",
  note: "",
  address: {},
  refererUrl: "",
  assignees: [],
}

const defaultAssignee: Assignee = {
  email: "",
  phone_number: "",
  first_name: "",
  last_name: "",
  mls: "",
  mls_id: "",
}

// ---------- helpers ----------
/**
 * Encode arbitrary Unicode text to URL-safe Base64
 */
function encodeToBase64Url(input: string) {
  // Encode to UTF-8 bytes
  const utf8Bytes = new TextEncoder().encode(input)
  // Convert bytes to binary string
  let binary = ""
  utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)))
  // Standard Base64
  const base64 = btoa(binary)
  // URL-safe Base64 (RFC 4648 §5)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Decode URL-safe Base64 back to Unicode text
 */
function decodeFromBase64Url(input: string) {
  // Restore padding and convert to standard Base64
  const pad = (4 - (input.length % 4)) % 4
  const base64 = (input + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/")
  // Decode Base64 to binary string
  const binary = atob(base64)
  // Convert binary string to UTF-8 bytes
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  // Decode UTF-8 bytes to string
  return new TextDecoder().decode(bytes)
}
// --------------------------------

export function LeadCaptureForm() {
  const [formData, setFormData] = useState<LeadFormData>(defaultFormData)
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [responseData, setResponseData] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [showActivityTracker, setShowActivityTracker] = useState(false)
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null)

  // ---------- load data from hash on mount ----------
  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
    if (hash) {
      try {
        const json = decodeFromBase64Url(hash)
        const parsed = JSON.parse(json)
        setFormData({ ...defaultFormData, ...parsed })
      } catch (err) {
        console.error("Failed to restore state from hash:", err)
      }
    }
    setIsInitialized(true)
  }, [])
  // ---------------------------------------------------

  // ---------- keep hash in sync with formData ----------
  useEffect(() => {
    // Don't update URL until we've loaded initial data
    if (!isInitialized) return

    try {
      const encoded = encodeToBase64Url(JSON.stringify(formData))
      history.replaceState(null, "", `${window.location.pathname}#${encoded}`)
    } catch (err) {
      console.error("Failed to encode state to hash:", err)
    }
  }, [formData, isInitialized])
  // ------------------------------------------------------

  const handleInputChange = (field: keyof Omit<LeadFormData, "tags" | "assignees" | "address">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value || null,
      },
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const addAssignee = () => {
    setFormData((prev) => ({
      ...prev,
      assignees: [...prev.assignees, { ...defaultAssignee }],
    }))
  }

  const removeAssignee = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.filter((_, i) => i !== index),
    }))
  }

  const updateAssignee = (index: number, field: keyof Assignee, value: string) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.map((assignee, i) => (i === index ? { ...assignee, [field]: value } : assignee)),
    }))
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
        
        // Extract lead ID from response to enable activity tracking
        const leadId = result.data?.response?.data?.id || result.data?.response?.id || result.data?.id || result.data?.lead_id
        if (leadId) {
          setCapturedLeadId(leadId)
        }
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
    setFormData(defaultFormData)
    setSubmitStatus("idle")
    setResponseData(null)
    setShowActivityTracker(false)
    setCapturedLeadId(null)
    window.history.replaceState(null, "", window.location.pathname)
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Lead Capture API Test</CardTitle>
        <p className="text-sm text-gray-600 text-center">
          All fields are optional. Form data is automatically saved to the URL for easy sharing.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Configuration */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">API Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="leadChannel">Lead Channel ID</Label>
              <Input
                id="leadChannel"
                type="text"
                value={formData.leadChannel}
                onChange={(e) => handleInputChange("leadChannel", e.target.value)}
                placeholder="Your Lead Channel ID"
              />
              <p className="text-sm text-gray-500">
                This serves as both the endpoint identifier and authentication key
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Address</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddress(!showAddress)}
                >
                  <Plus className={`h-4 w-4 mr-1 ${showAddress ? 'rotate-45' : ''}`} />
                  {showAddress ? 'Hide Address' : 'Add Address'}
                </Button>
              </div>
              
              {showAddress && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="building">Building</Label>
                      <Input
                        id="building"
                        type="text"
                        value={formData.address.building || ""}
                        onChange={(e) => handleAddressChange("building", e.target.value)}
                        placeholder="Apt, Suite, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="house_num">House Number</Label>
                      <Input
                        id="house_num"
                        type="text"
                        value={formData.address.house_num || ""}
                        onChange={(e) => handleAddressChange("house_num", e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="predir">Pre-directional</Label>
                      <Input
                        id="predir"
                        type="text"
                        value={formData.address.predir || ""}
                        onChange={(e) => handleAddressChange("predir", e.target.value)}
                        placeholder="N, South, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Street Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.address.name || ""}
                        onChange={(e) => handleAddressChange("name", e.target.value)}
                        placeholder="Main"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suftype">Street Type</Label>
                      <Input
                        id="suftype"
                        type="text"
                        value={formData.address.suftype || ""}
                        onChange={(e) => handleAddressChange("suftype", e.target.value)}
                        placeholder="St, Ave, Blvd"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sufdir">Post-directional</Label>
                      <Input
                        id="sufdir"
                        type="text"
                        value={formData.address.sufdir || ""}
                        onChange={(e) => handleAddressChange("sufdir", e.target.value)}
                        placeholder="NE, SW, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        type="text"
                        value={formData.address.unit || ""}
                        onChange={(e) => handleAddressChange("unit", e.target.value)}
                        placeholder="#5, Apt 2B"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.address.city || ""}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.address.state || ""}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                        placeholder="CA or California"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postal Code</Label>
                      <Input
                        id="postcode"
                        type="text"
                        value={formData.address.postcode || ""}
                        onChange={(e) => handleAddressChange("postcode", e.target.value)}
                        placeholder="94102"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        type="text"
                        value={formData.address.county || ""}
                        onChange={(e) => handleAddressChange("county", e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.address.country || ""}
                        onChange={(e) => handleAddressChange("country", e.target.value)}
                        placeholder="United States"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="line1">Address Line 1</Label>
                      <Input
                        id="line1"
                        type="text"
                        value={formData.address.line1 || ""}
                        onChange={(e) => handleAddressChange("line1", e.target.value)}
                        placeholder="123 Main St #5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="line2">Address Line 2</Label>
                      <Input
                        id="line2"
                        type="text"
                        value={formData.address.line2 || ""}
                        onChange={(e) => handleAddressChange("line2", e.target.value)}
                        placeholder="San Francisco, CA 94102"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full">Full Address</Label>
                    <Input
                      id="full"
                      type="text"
                      value={formData.address.full || ""}
                      onChange={(e) => handleAddressChange("full", e.target.value)}
                      placeholder="123 Main St #5, San Francisco, CA 94102"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lead Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Lead Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
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
            </div>
          </div>

          {/* Assignees */}
          <div className="border-b pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assignees</h3>
              <Button type="button" onClick={addAssignee} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Assignee
              </Button>
            </div>
            {formData.assignees.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No assignees added</p>
            ) : (
              <div className="space-y-4">
                {formData.assignees.map((assignee, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Assignee {index + 1}</h4>
                      <Button type="button" onClick={() => removeAssignee(index)} variant="outline" size="sm">
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`assignee-firstName-${index}`}>First Name</Label>
                        <Input
                          id={`assignee-firstName-${index}`}
                          type="text"
                          value={assignee.first_name}
                          onChange={(e) => updateAssignee(index, "first_name", e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`assignee-lastName-${index}`}>Last Name</Label>
                        <Input
                          id={`assignee-lastName-${index}`}
                          type="text"
                          value={assignee.last_name}
                          onChange={(e) => updateAssignee(index, "last_name", e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`assignee-email-${index}`}>Email</Label>
                        <Input
                          id={`assignee-email-${index}`}
                          type="email"
                          value={assignee.email}
                          onChange={(e) => updateAssignee(index, "email", e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`assignee-phone-${index}`}>Phone Number</Label>
                        <Input
                          id={`assignee-phone-${index}`}
                          type="tel"
                          value={assignee.phone_number}
                          onChange={(e) => updateAssignee(index, "phone_number", e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`assignee-mls-${index}`}>MLS</Label>
                        <Input
                          id={`assignee-mls-${index}`}
                          type="text"
                          value={assignee.mls}
                          onChange={(e) => updateAssignee(index, "mls", e.target.value)}
                          placeholder="MLS name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`assignee-mlsId-${index}`}>MLS ID</Label>
                        <Input
                          id={`assignee-mlsId-${index}`}
                          type="text"
                          value={assignee.mls_id}
                          onChange={(e) => updateAssignee(index, "mls_id", e.target.value)}
                          placeholder="MLS ID"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h3>
            <div className="space-y-4">
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
              {capturedLeadId && (
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Ready to track activities!</p>
                    <p className="text-xs text-blue-700">Lead ID: {capturedLeadId}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowActivityTracker(true)}
                    variant="outline"
                    size="sm"
                    className="bg-blue-100 border-blue-300 hover:bg-blue-200"
                  >
                    Track Activity
                  </Button>
                </div>
              )}
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
      
      {/* Activity Tracker */}
      {showActivityTracker && capturedLeadId && (
        <CardContent className="pt-0">
          <div className="border-t pt-6">
            <ActivityTracker 
              leadId={capturedLeadId}
              onClose={() => setShowActivityTracker(false)}
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
