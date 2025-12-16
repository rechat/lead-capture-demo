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
import { Loader2, CheckCircle, AlertCircle, X, Plus, Minus, ChevronDown, ChevronRight, Activity, Eye, EyeOff, History, Clock, ChevronUp } from "lucide-react"

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

interface SavedLead {
  id: string
  name: string
  email: string
  timestamp: number
  leadChannel: string
}

const defaultFormData: LeadFormData = {
  leadChannel: "54a57918-ad9b-4adb-a35a-9232bf78d734",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  tags: ["Lead"],
  leadSource: "Lead Capture Demo",
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
 * Validate UUID format (version 4 or any standard UUID)
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

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
  const [showApiResponse, setShowApiResponse] = useState(false)
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([])
  const [isApiSectionCollapsed, setIsApiSectionCollapsed] = useState(false)
  const [isLeadInfoCollapsed, setIsLeadInfoCollapsed] = useState(false)
  const [isChannelIdValid, setIsChannelIdValid] = useState(true)

  // ---------- load data from hash and localStorage on mount ----------
  useEffect(() => {
    // Load from hash
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
    
    // Load saved leads from localStorage
    try {
      const saved = localStorage.getItem('lead-capture-history')
      if (saved) {
        setSavedLeads(JSON.parse(saved))
      }
    } catch (err) {
      console.error('Failed to load lead history:', err)
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

    // Validate and collapse API section when channel ID is entered
    if (field === 'leadChannel') {
      if (value.trim()) {
        setIsChannelIdValid(isValidUUID(value.trim()))
        if (!isApiSectionCollapsed) {
          setIsApiSectionCollapsed(true)
        }
      } else {
        setIsChannelIdValid(true) // Empty is valid (no error shown)
      }
    }
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
          setShowActivityTracker(true) // Automatically show activity tracker
          saveLeadToHistory(leadId, formData) // Save to history
          setIsLeadInfoCollapsed(true) // Collapse lead info after successful submission
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
    setIsApiSectionCollapsed(false)
    setIsLeadInfoCollapsed(false)
    setIsChannelIdValid(true)
    window.history.replaceState(null, "", window.location.pathname)
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const saveLeadToHistory = (leadId: string, formData: LeadFormData) => {
    const newLead: SavedLead = {
      id: leadId,
      name: `${formData.firstName} ${formData.lastName}`.trim() || 'Unnamed Lead',
      email: formData.email || '',
      timestamp: Date.now(),
      leadChannel: formData.leadChannel
    }
    
    const updatedLeads = [newLead, ...savedLeads.filter(lead => lead.id !== leadId)].slice(0, 10) // Keep last 10 leads
    setSavedLeads(updatedLeads)
    
    try {
      localStorage.setItem('lead-capture-history', JSON.stringify(updatedLeads))
    } catch (err) {
      console.error('Failed to save lead to history:', err)
    }
  }

  const selectLeadFromHistory = (lead: SavedLead) => {
    setCapturedLeadId(lead.id)
    setShowActivityTracker(true)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center">
            Rechat Lead Capture Demo
          </CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
          {/* API Configuration */}
          <div className="border-b pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  formData.leadChannel ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <span className={`font-semibold text-sm transition-colors duration-200 ${
                    formData.leadChannel ? 'text-green-600' : 'text-blue-600'
                  }`}>1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">API Configuration</h3>
              </div>
              {formData.leadChannel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsApiSectionCollapsed(!isApiSectionCollapsed)}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-all duration-200"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    isApiSectionCollapsed ? 'rotate-0' : 'rotate-180'
                  }`} />
                  <span className="text-xs">{isApiSectionCollapsed ? 'Show' : 'Hide'}</span>
                </Button>
              )}
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isApiSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-48 opacity-100'
            }`}>
              <div className="space-y-2">
                <Input
                  id="leadChannel"
                  type="text"
                  value={formData.leadChannel}
                  onChange={(e) => handleInputChange("leadChannel", e.target.value)}
                  placeholder="Your Lead Channel ID"
                  className={!isChannelIdValid ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {!isChannelIdValid && formData.leadChannel && (
                  <p className="text-sm text-red-600">Please enter a valid UUID format</p>
                )}
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            formData.leadChannel ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="border-b pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Lead Information</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsLeadInfoCollapsed(!isLeadInfoCollapsed)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-all duration-200"
              >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  isLeadInfoCollapsed ? 'rotate-0' : 'rotate-180'
                }`} />
                <span className="text-xs">{isLeadInfoCollapsed ? 'Show' : 'Hide'}</span>
              </Button>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isLeadInfoCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            }`}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
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
                <div className="flex flex-wrap gap-2 mt-2">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Input
                  id="leadSource"
                  type="text"
                  value={formData.leadSource}
                  onChange={(e) => handleInputChange("leadSource", e.target.value)}
                  placeholder="Lead Capture Demo"
                />
              </div>
            </div>

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

            {/* Assignees */}
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Assignees</Label>
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
            </div>
          </div>
          </div>

          {/* Success Status */}
          {submitStatus === "success" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 text-green-600 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Lead submitted successfully!</span>
                  {capturedLeadId && (
                    <span className="text-sm text-green-700">
                      ID: <code className="bg-green-100 px-1 rounded text-xs">{capturedLeadId}</code>
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => setShowApiResponse(!showApiResponse)}
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:bg-green-100"
                >
                  {showApiResponse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {responseData && showApiResponse && (
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-2 rounded">
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
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            formData.leadChannel ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
          }`}>
          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              className="flex-1 h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              disabled={isSubmitting || !isChannelIdValid || !formData.leadChannel}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Lead...
                </>
              ) : (
                "Submit Lead to Rechat"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearForm} 
              className="h-12 px-6 hover:bg-gray-50"
            >
              Clear Form
            </Button>
          </div>
          </div>
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
    
    {/* Lead History Floating Window */}
    <div className="fixed top-4 right-4 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <History className="h-4 w-4" />
          Lead History ({savedLeads.length})
        </h3>
      </div>
        <div className="max-h-80 overflow-y-auto">
          {savedLeads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No leads captured yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {savedLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => selectLeadFromHistory(lead)}
                  className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(lead.timestamp).toLocaleDateString()} {new Date(lead.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Activity className="h-4 w-4 text-blue-500 ml-auto mt-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
    </div>
  )
}
