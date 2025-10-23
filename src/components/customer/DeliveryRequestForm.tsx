import React, { useState } from 'react'
import { MapPin, Package, Clock, FileText, Weight, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'
import { useAuthStore } from '../../store/authStore'
import { geocodeAddress, validateCoordinates, calculateDistance } from '../../services/geocodingService'
import type { Delivery } from '../../types'

interface DeliveryRequestFormProps {
  onRequestSubmitted: () => void
}

const DeliveryRequestForm: React.FC<DeliveryRequestFormProps> = ({ onRequestSubmitted }) => {
  const { user } = useAuthStore()
  const { addDelivery } = useAdminStore()
  
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    packageDescription: '',
    weight: '',
    specialInstructions: '',
    scheduledPickupDate: '',
    scheduledPickupTime: '',
    scheduledDeliveryDate: '',
    scheduledDeliveryTime: '',
    contactPhone: '',
    packageValue: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodedPickup, setGeocodedPickup] = useState<{ lat: number; lng: number } | null>(null)
  const [geocodedDelivery, setGeocodedDelivery] = useState<{ lat: number; lng: number } | null>(null)
  const [geocodeWarnings, setGeocodeWarnings] = useState<{ pickup?: string; delivery?: string }>({})
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required'
    }
    
    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required'
    }
    
    if (!formData.packageDescription.trim()) {
      newErrors.packageDescription = 'Package description is required'
    }
    
    if (!formData.weight.trim()) {
      newErrors.weight = 'Package weight is required'
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight'
    }
    
    if (!formData.scheduledPickupDate) {
      newErrors.scheduledPickupDate = 'Pickup date is required'
    }
    
    if (!formData.scheduledPickupTime) {
      newErrors.scheduledPickupTime = 'Pickup time is required'
    }
    
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required'
    }
    
    // Validate pickup date is not in the past
    if (formData.scheduledPickupDate) {
      const pickupDateTime = new Date(`${formData.scheduledPickupDate}T${formData.scheduledPickupTime || '00:00'}`)
      if (pickupDateTime < new Date()) {
        newErrors.scheduledPickupDate = 'Pickup date and time cannot be in the past'
      }
    }
    
    // Validate delivery date is after pickup date
    if (formData.scheduledDeliveryDate && formData.scheduledPickupDate) {
      const pickupDate = new Date(formData.scheduledPickupDate)
      const deliveryDate = new Date(formData.scheduledDeliveryDate)
      if (deliveryDate < pickupDate) {
        newErrors.scheduledDeliveryDate = 'Delivery date cannot be before pickup date'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Geocode addresses when user finishes typing
  const handleAddressBlur = async (field: 'pickup' | 'delivery', address: string) => {
    if (!address.trim()) return
    
    setIsGeocoding(true)
    setGeocodeWarnings(prev => ({ ...prev, [field]: undefined }))
    
    try {
      const result = await geocodeAddress(address)
      
      if (result.success) {
        const coords = { lat: result.data.lat, lng: result.data.lng }
        
        if (field === 'pickup') {
          setGeocodedPickup(coords)
          console.log(`✅ Pickup geocoded: ${result.data.displayName} [${coords.lat}, ${coords.lng}]`)
        } else {
          setGeocodedDelivery(coords)
          console.log(`✅ Delivery geocoded: ${result.data.displayName} [${coords.lat}, ${coords.lng}]`)
        }
        
        // Validate coordinates
        const validation = validateCoordinates(coords.lat, coords.lng)
        if (validation.warning) {
          setGeocodeWarnings(prev => ({ ...prev, [field]: validation.warning }))
        }
        
        // Calculate distance if both addresses are geocoded
        if (field === 'pickup' && geocodedDelivery) {
          const distance = calculateDistance(coords.lat, coords.lng, geocodedDelivery.lat, geocodedDelivery.lng)
          setEstimatedDistance(distance)
        } else if (field === 'delivery' && geocodedPickup) {
          const distance = calculateDistance(geocodedPickup.lat, geocodedPickup.lng, coords.lat, coords.lng)
          setEstimatedDistance(distance)
        }
      } else {
        setErrors(prev => ({
          ...prev,
          [`${field}Address`]: result.error
        }))
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setErrors(prev => ({
        ...prev,
        [`${field}Address`]: 'Failed to geocode address. Please try again.'
      }))
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    // Validate that addresses have been geocoded
    if (!geocodedPickup || !geocodedDelivery) {
      setErrors(prev => ({
        ...prev,
        general: 'Please wait for addresses to be geocoded'
      }))
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Create delivery request with geocoded coordinates
      const deliveryRequest: Omit<Delivery, 'id'> = {
        customer: {
          name: user?.email?.split('@')[0] || 'Customer',
          email: user?.email || '',
          phone: formData.contactPhone
        },
        pickup: {
          address: formData.pickupAddress,
          coordinates: geocodedPickup,
          scheduledTime: `${formData.scheduledPickupDate}T${formData.scheduledPickupTime}`
        },
        delivery: {
          address: formData.deliveryAddress,
          coordinates: geocodedDelivery,
          scheduledTime: formData.scheduledDeliveryDate && formData.scheduledDeliveryTime 
            ? `${formData.scheduledDeliveryDate}T${formData.scheduledDeliveryTime}`
            : undefined
        },
        package: {
          description: formData.packageDescription,
          weight: Number(formData.weight),
          value: formData.packageValue ? Number(formData.packageValue) : undefined,
          specialInstructions: formData.specialInstructions || undefined
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedDelivery: formData.scheduledDeliveryDate && formData.scheduledDeliveryTime 
          ? `${formData.scheduledDeliveryDate}T${formData.scheduledDeliveryTime}`
          : undefined
      }
      
      // Add to store (in real app, this would be an API call)
      addDelivery(deliveryRequest as Delivery)
      
      setIsSubmitted(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          pickupAddress: '',
          deliveryAddress: '',
          packageDescription: '',
          weight: '',
          specialInstructions: '',
          scheduledPickupDate: '',
          scheduledPickupTime: '',
          scheduledDeliveryDate: '',
          scheduledDeliveryTime: '',
          contactPhone: '',
          packageValue: ''
        })
        setIsSubmitted(false)
        onRequestSubmitted()
      }, 3000)
      
    } catch (error) {
      console.error('Error submitting delivery request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isSubmitted) {
    return (
      <div className="card-elevated p-8 text-center animate-bounce-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Request Submitted Successfully!</h3>
        <p className="text-green-700 mb-4">
          Your delivery request has been submitted and is now pending admin approval.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            You'll receive real-time updates on your request status. Check your dashboard for live tracking once approved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-elevated animate-slide-up">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <h3 className="text-xl font-bold text-blue-900 flex items-center">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
          Create New Delivery Request
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Pickup Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            Pickup Information
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Address *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.pickupAddress}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                onBlur={(e) => handleAddressBlur('pickup', e.target.value)}
                className={`form-input-enhanced pr-10 ${
                  errors.pickupAddress ? 'border-red-500' : 
                  geocodedPickup ? 'border-green-500' : ''
                }`}
                placeholder="e.g., Chennai, Tamil Nadu"
              />
              {isGeocoding && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              )}
              {geocodedPickup && !isGeocoding && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.pickupAddress && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.pickupAddress}
              </p>
            )}
            {geocodedPickup && !errors.pickupAddress && (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Location verified: {geocodedPickup.lat.toFixed(4)}, {geocodedPickup.lng.toFixed(4)}
              </p>
            )}
            {geocodeWarnings.pickup && (
              <p className="mt-1 text-xs text-yellow-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {geocodeWarnings.pickup}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date *
              </label>
              <input
                type="date"
                value={formData.scheduledPickupDate}
                onChange={(e) => handleInputChange('scheduledPickupDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`form-input-enhanced ${errors.scheduledPickupDate ? 'border-red-500' : ''}`}
              />
              {errors.scheduledPickupDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.scheduledPickupDate}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Time *
              </label>
              <input
                type="time"
                value={formData.scheduledPickupTime}
                onChange={(e) => handleInputChange('scheduledPickupTime', e.target.value)}
                className={`form-input-enhanced ${errors.scheduledPickupTime ? 'border-red-500' : ''}`}
              />
              {errors.scheduledPickupTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.scheduledPickupTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 text-green-600 mr-2" />
            Delivery Information
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                onBlur={(e) => handleAddressBlur('delivery', e.target.value)}
                className={`form-input-enhanced pr-10 ${
                  errors.deliveryAddress ? 'border-red-500' : 
                  geocodedDelivery ? 'border-green-500' : ''
                }`}
                placeholder="e.g., Hyderabad - Hitech City, Telangana"
              />
              {isGeocoding && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              )}
              {geocodedDelivery && !isGeocoding && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.deliveryAddress && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.deliveryAddress}
              </p>
            )}
            {geocodedDelivery && !errors.deliveryAddress && (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Location verified: {geocodedDelivery.lat.toFixed(4)}, {geocodedDelivery.lng.toFixed(4)}
              </p>
            )}
            {geocodeWarnings.delivery && (
              <p className="mt-1 text-xs text-yellow-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {geocodeWarnings.delivery}
              </p>
            )}
            {estimatedDistance && (
              <p className="mt-1 text-xs text-blue-600 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Estimated distance: {estimatedDistance} km
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Delivery Date
              </label>
              <input
                type="date"
                value={formData.scheduledDeliveryDate}
                onChange={(e) => handleInputChange('scheduledDeliveryDate', e.target.value)}
                min={formData.scheduledPickupDate || new Date().toISOString().split('T')[0]}
                className={`form-input-enhanced ${errors.scheduledDeliveryDate ? 'border-red-500' : ''}`}
              />
              {errors.scheduledDeliveryDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.scheduledDeliveryDate}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Delivery Time
              </label>
              <input
                type="time"
                value={formData.scheduledDeliveryTime}
                onChange={(e) => handleInputChange('scheduledDeliveryTime', e.target.value)}
                className="form-input-enhanced"
              />
            </div>
          </div>
        </div>

        {/* Package Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 text-purple-600 mr-2" />
            Package Information
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Description *
            </label>
            <input
              type="text"
              value={formData.packageDescription}
              onChange={(e) => handleInputChange('packageDescription', e.target.value)}
              className={`form-input-enhanced ${errors.packageDescription ? 'border-red-500' : ''}`}
              placeholder="Describe the package contents"
            />
            {errors.packageDescription && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.packageDescription}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className={`form-input-enhanced ${errors.weight ? 'border-red-500' : ''}`}
                placeholder="0.0"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.weight}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Value ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.packageValue}
                onChange={(e) => handleInputChange('packageValue', e.target.value)}
                className="form-input-enhanced"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              rows={3}
              className="form-input-enhanced resize-none"
              placeholder="Any special handling instructions, delivery notes, or requirements..."
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 text-orange-600 mr-2" />
            Contact Information
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone *
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              className={`form-input-enhanced ${errors.contactPhone ? 'border-red-500' : ''}`}
              placeholder="+1 (555) 123-4567"
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.contactPhone}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gradient w-full h-12 text-base font-semibold shadow-colored disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner"></div>
                <span>Submitting Request...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Submit Delivery Request</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DeliveryRequestForm
