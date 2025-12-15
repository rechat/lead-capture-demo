"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react"

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
  query: string
  location: string
  min_price: number
  max_price: number
  bedrooms: number
  bathrooms: number
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Track Activity for Lead</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Lead ID:</strong> {leadId}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            You can now send activities for this captured lead to track their behavior and engagement.
          </p>
        </div>

        {/* Activity Type Selection */}
        <div className="space-y-2">
          <Label>Activity Type</Label>
          <Select value={selectedActivity} onValueChange={(value) => setSelectedActivity(value as ActivityType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an activity type..." />
            </SelectTrigger>
            <SelectContent>
              {activityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <div className="space-y-2">
                <Label htmlFor="search-query">Search Query</Label>
                <Input
                  id="search-query"
                  type="text"
                  value={activityData.search?.query || ""}
                  onChange={(e) => updateSearchData("query", e.target.value)}
                  placeholder="3 bedroom house"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-location">Location</Label>
                <Input
                  id="search-location"
                  type="text"
                  value={activityData.search?.location || ""}
                  onChange={(e) => updateSearchData("location", e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-price">Min Price</Label>
                <Input
                  id="min-price"
                  type="number"
                  value={activityData.search?.min_price || ""}
                  onChange={(e) => updateSearchData("min_price", parseInt(e.target.value) || 0)}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-price">Max Price</Label>
                <Input
                  id="max-price"
                  type="number"
                  value={activityData.search?.max_price || ""}
                  onChange={(e) => updateSearchData("max_price", parseInt(e.target.value) || 0)}
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={activityData.search?.bedrooms || ""}
                  onChange={(e) => updateSearchData("bedrooms", parseInt(e.target.value) || 0)}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={activityData.search?.bathrooms || ""}
                  onChange={(e) => updateSearchData("bathrooms", parseInt(e.target.value) || 0)}
                  placeholder="2"
                />
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
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting Activity...
              </>
            ) : (
              "Post Activity"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}