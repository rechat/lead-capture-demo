"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, AlertCircle, X, Activity } from "lucide-react"

type ActivityType = 
  | "ContactViewedListing"
  | "ContactSharedListing" 
  | "ContactFavoritedListing"
  | "ContactRemovedFavoriteListing"
  | "ContactSignedUp"
  | "ContactLoggedIn"
  | "ContactValuedListing"
  | "ContactCreatedSearch"
  | "ContactRemovedSearch"
  | "ContactSearchedListings"

interface ListingData {
  url: string
  mls_number: string
  mls: string
  cover_image_url: string
  price: number
  property: {
    address: {
      street_address: string
    }
  }
}

interface SearchData {
  url: string
  title: string
  minimum_bedrooms: number
  maximum_bedrooms: number
  minimum_bathrooms: number
  maximum_bathrooms: number
  minimum_price: number
  maximum_price: number
  property_types: string[]
  pool: boolean
}

interface HomeValuationData {
  address: string
  estimated_value: number
  property_type: string
}

interface ActivityData {
  listing?: ListingData
  search?: SearchData
  home_valuation?: HomeValuationData
  notes?: string
}

interface ActivityTrackerProps {
  leadId: string
  onClose: () => void
}

export function ActivityTracker({ leadId, onClose }: ActivityTrackerProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | "">("")
  const [activityData, setActivityData] = useState<ActivityData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const activityOptions: { value: ActivityType; label: string; description: string }[] = [
    { value: "ContactViewedListing", label: "Viewed Listing", description: "Contact viewed a property listing" },
    { value: "ContactSharedListing", label: "Shared Listing", description: "Contact shared a property listing" },
    { value: "ContactFavoritedListing", label: "Favorited Listing", description: "Contact added a listing to favorites" },
    { value: "ContactRemovedFavoriteListing", label: "Removed Favorite", description: "Contact removed a listing from favorites" },
    { value: "ContactValuedListing", label: "Valued Home", description: "Contact used listing valuation tool" },
    { value: "ContactSignedUp", label: "Signed Up", description: "Contact signed up for an account" },
    { value: "ContactLoggedIn", label: "Logged In", description: "Contact logged into their account" },
    { value: "ContactCreatedSearch", label: "Created Search", description: "Contact created a saved search" },
    { value: "ContactRemovedSearch", label: "Removed Search", description: "Contact removed a saved search" },
    { value: "ContactSearchedListings", label: "Searched Listings", description: "Contact performed a property search" },
  ]

  const requiresListing = ["ContactViewedListing", "ContactSharedListing", "ContactFavoritedListing", "ContactRemovedFavoriteListing", "ContactValuedListing"]
  const requiresSearch = ["ContactCreatedSearch", "ContactRemovedSearch", "ContactSearchedListings"]

  const updateListingData = (field: keyof ListingData | string, value: any) => {
    setActivityData(prev => ({
      ...prev,
      listing: {
        ...prev.listing,
        [field]: field === "property" ? value : value,
      } as ListingData
    }))
  }

  const updateListingAddress = (address: string) => {
    setActivityData(prev => ({
      ...prev,
      listing: {
        ...prev.listing,
        property: {
          address: {
            street_address: address
          }
        }
      } as ListingData
    }))
  }

  const updateSearchData = (field: keyof SearchData, value: any) => {
    setActivityData(prev => ({
      ...prev,
      search: {
        ...prev.search,
        [field]: value
      } as SearchData
    }))
  }

  const updateValuationData = (field: keyof HomeValuationData, value: any) => {
    setActivityData(prev => ({
      ...prev,
      home_valuation: {
        ...prev.home_valuation,
        [field]: value
      } as HomeValuationData
    }))
  }

  const updateNotes = (notes: string) => {
    setActivityData(prev => ({
      ...prev,
      notes
    }))
  }

  const submitActivity = async () => {
    if (!selectedActivity) return

    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const payload: any = {
        action: selectedActivity
      }

      if (requiresListing.includes(selectedActivity) && activityData.listing) {
        payload.listing = activityData.listing
      }

      if (requiresSearch.includes(selectedActivity) && activityData.search) {
        payload.search = activityData.search
      }

      if (activityData.notes) {
        payload.notes = activityData.notes
      }

      const response = await fetch(`https://api.rechat.com/leads/${leadId}/timeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setSuccessMessage("Activity posted successfully!")
        
        // Reset form after success
        setTimeout(() => {
          setSelectedActivity("")
          setActivityData({})
          setSubmitStatus("idle")
        }, 2000)
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        setSubmitStatus("error")
        setErrorMessage(`Failed to post activity: ${response.status} ${errorData.message || response.statusText}`)
      }
    } catch (error: any) {
      setSubmitStatus("error")
      setErrorMessage(`Error posting activity: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full border-2 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Activity Tracker
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Lead ID:</span>
            <code className="bg-green-100 px-1 rounded text-xs">{leadId}</code>
          </div>
        </div>

        {/* Activity Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Choose Activity Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedActivity(option.value)}
                className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                  selectedActivity === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`font-medium ${
                  selectedActivity === option.value ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {option.label}
                </div>
                <div className={`text-sm mt-1 ${
                  selectedActivity === option.value ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Listing Details (for listing-related activities) */}
        {selectedActivity && requiresListing.includes(selectedActivity) && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Listing Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listing-url">Listing URL</Label>
                <Input
                  id="listing-url"
                  type="url"
                  value={activityData.listing?.url || ""}
                  onChange={(e) => updateListingData("url", e.target.value)}
                  placeholder="https://example.com/listing/123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mls-number">MLS Number</Label>
                <Input
                  id="mls-number"
                  type="text"
                  value={activityData.listing?.mls_number || ""}
                  onChange={(e) => updateListingData("mls_number", e.target.value)}
                  placeholder="5039447"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mls">MLS</Label>
                <Input
                  id="mls"
                  type="text"
                  value={activityData.listing?.mls || ""}
                  onChange={(e) => updateListingData("mls", e.target.value)}
                  placeholder="nneren"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={activityData.listing?.price || ""}
                  onChange={(e) => updateListingData("price", parseInt(e.target.value) || 0)}
                  placeholder="4750000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street-address">Street Address</Label>
                <Input
                  id="street-address"
                  type="text"
                  value={activityData.listing?.property?.address?.street_address || ""}
                  onChange={(e) => updateListingAddress(e.target.value)}
                  placeholder="25 Oakledge Drive"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cover-image">Cover Image URL</Label>
                <Input
                  id="cover-image"
                  type="url"
                  value={activityData.listing?.cover_image_url || ""}
                  onChange={(e) => updateListingData("cover_image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Details (for search-related activities) */}
        {selectedActivity && requiresSearch.includes(selectedActivity) && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Search Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="search-url">Search URL</Label>
                <Input
                  id="search-url"
                  type="url"
                  value={activityData.search?.url || ""}
                  onChange={(e) => updateSearchData("url", e.target.value)}
                  placeholder="https://example.com/search/123"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="search-title">Search Title</Label>
                <Input
                  id="search-title"
                  type="text"
                  value={activityData.search?.title || ""}
                  onChange={(e) => updateSearchData("title", e.target.value)}
                  placeholder="Downtown 3BR Condos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-bedrooms">Min Bedrooms</Label>
                <Input
                  id="min-bedrooms"
                  type="number"
                  value={activityData.search?.minimum_bedrooms || ""}
                  onChange={(e) => updateSearchData("minimum_bedrooms", parseInt(e.target.value) || 0)}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-bedrooms">Max Bedrooms</Label>
                <Input
                  id="max-bedrooms"
                  type="number"
                  value={activityData.search?.maximum_bedrooms || ""}
                  onChange={(e) => updateSearchData("maximum_bedrooms", parseInt(e.target.value) || 0)}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-bathrooms">Min Bathrooms</Label>
                <Input
                  id="min-bathrooms"
                  type="number"
                  value={activityData.search?.minimum_bathrooms || ""}
                  onChange={(e) => updateSearchData("minimum_bathrooms", parseInt(e.target.value) || 0)}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-bathrooms">Max Bathrooms</Label>
                <Input
                  id="max-bathrooms"
                  type="number"
                  value={activityData.search?.maximum_bathrooms || ""}
                  onChange={(e) => updateSearchData("maximum_bathrooms", parseInt(e.target.value) || 0)}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-price">Min Price</Label>
                <Input
                  id="min-price"
                  type="number"
                  value={activityData.search?.minimum_price || ""}
                  onChange={(e) => updateSearchData("minimum_price", parseInt(e.target.value) || 0)}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-price">Max Price</Label>
                <Input
                  id="max-price"
                  type="number"
                  value={activityData.search?.maximum_price || ""}
                  onChange={(e) => updateSearchData("maximum_price", parseInt(e.target.value) || 0)}
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-types">Property Types (comma-separated)</Label>
                <Input
                  id="property-types"
                  type="text"
                  value={activityData.search?.property_types?.join(", ") || ""}
                  onChange={(e) => updateSearchData("property_types", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  placeholder="Condominium, Townhouse"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pool">Pool Required</Label>
                <select
                  id="pool"
                  value={activityData.search?.pool ? "true" : "false"}
                  onChange={(e) => updateSearchData("pool", e.target.value === "true")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notes (optional for all activities) */}
        {selectedActivity && (
          <div className="space-y-2">
            <Label htmlFor="activity-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="activity-notes"
              value={activityData.notes || ""}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Any additional details about this activity..."
              rows={3}
            />
          </div>
        )}

        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={submitActivity} 
            disabled={!selectedActivity || isSubmitting}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Posting Activity...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Post Activity to Timeline
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
            Close Tracker
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}