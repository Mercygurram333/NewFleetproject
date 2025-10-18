import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Truck, Package, User, Clock, Route, Zap } from 'lucide-react'
import type { Delivery, Driver } from '../../types'

interface UniversalMapProps {
  deliveries: Delivery[]
  drivers?: Driver[]
  driverLocations?: Record<string, { lat: number; lng: number; timestamp: string }>
  selectedDelivery?: Delivery | null
  onDeliverySelect?: (delivery: Delivery | null) => void
  currentLocation?: { lat: number; lng: number } | null
  showDrivers?: boolean
  showRoutes?: boolean
  showHeatmap?: boolean
  height?: string
  className?: string
  mapType?: 'admin' | 'driver' | 'customer'
}

const UniversalMap: React.FC<UniversalMapProps> = ({
  deliveries,
  drivers = [],
  driverLocations = {},
  selectedDelivery,
  onDeliverySelect,
  currentLocation,
  showDrivers = true,
  showRoutes = true,
  showHeatmap = false,
  height = '400px',
  className = '',
  mapType = 'admin'
}) => {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
  const [zoom, setZoom] = useState(12)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Filter deliveries based on active filter
  const filteredDeliveries = deliveries.filter(delivery => {
    if (activeFilter === 'all') return true
    return delivery.status === activeFilter
  })

  // Get status color for markers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500'
      case 'arrived': return 'bg-emerald-500'
      case 'in-transit': return 'bg-blue-500'
      case 'started': return 'bg-indigo-500'
      case 'accepted': return 'bg-purple-500'
      case 'assigned':
      case 'pending': return 'bg-yellow-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500'
      case 'medium': return 'border-yellow-500'
      case 'low': return 'border-green-500'
      default: return 'border-gray-500'
    }
  }

  // Simulate map markers
  const renderDeliveryMarkers = () => {
    return filteredDeliveries.map((delivery) => {
      const isSelected = selectedDelivery?.id === delivery.id
      const pickup = delivery.pickup || delivery.pickupLocation
      const dropoff = delivery.delivery || delivery.dropoffLocation
      
      return (
        <div key={delivery.id} className="relative">
          {/* Pickup Marker */}
          {pickup && (
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
              }`}
              style={{
                left: `${((pickup.coordinates?.lng || (pickup as any).lng || 0) + 74.0060) * 800}px`,
                top: `${(40.7128 - (pickup.coordinates?.lat || (pickup as any).lat || 0)) * 600}px`
              }}
              onClick={() => onDeliverySelect?.(delivery)}
            >
              <div className={`w-8 h-8 rounded-full ${getStatusColor(delivery.status)} ${getPriorityColor(delivery.priority || 'medium')} border-2 flex items-center justify-center shadow-lg`}>
                <MapPin className="h-4 w-4 text-white" />
              </div>
              {isSelected && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 min-w-64 z-30">
                  <div className="text-sm font-semibold text-gray-900">{delivery.customer.name}</div>
                  <div className="text-xs text-gray-600 mt-1">Pickup: {pickup.address}</div>
                  <div className="text-xs text-gray-600">Status: {delivery.status}</div>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(delivery.status)} text-white`}>
                      {delivery.status.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(delivery.priority || 'medium')} text-gray-700`}>
                      {(delivery.priority || 'medium').toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dropoff Marker */}
          {dropoff && (
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
              }`}
              style={{
                left: `${((dropoff.coordinates?.lng || (dropoff as any).lng || 0) + 74.0060) * 800}px`,
                top: `${(40.7128 - (dropoff.coordinates?.lat || (dropoff as any).lat || 0)) * 600}px`
              }}
              onClick={() => onDeliverySelect?.(delivery)}
            >
              <div className={`w-8 h-8 rounded-full ${getStatusColor(delivery.status)} ${getPriorityColor(delivery.priority || 'medium')} border-2 flex items-center justify-center shadow-lg`}>
                <Package className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

          {/* Route Line */}
          {showRoutes && pickup && dropoff && (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            >
              <line
                x1={((pickup.coordinates?.lng || (pickup as any).lng || 0) + 74.0060) * 800}
                y1={(40.7128 - (pickup.coordinates?.lat || (pickup as any).lat || 0)) * 600}
                x2={((dropoff.coordinates?.lng || (dropoff as any).lng || 0) + 74.0060) * 800}
                y2={(40.7128 - (dropoff.coordinates?.lat || (dropoff as any).lat || 0)) * 600}
                stroke={delivery.status === 'in-transit' ? '#3B82F6' : '#9CA3AF'}
                strokeWidth="2"
                strokeDasharray={delivery.status === 'in-transit' ? '5,5' : '0'}
                className={delivery.status === 'in-transit' ? 'animate-pulse' : ''}
              />
            </svg>
          )}
        </div>
      )
    })
  }

  // Render driver locations
  const renderDriverMarkers = () => {
    if (!showDrivers) return null

    return Object.entries(driverLocations).map(([driverId, location]) => {
      const driver = drivers.find(d => d.id === driverId)
      
      return (
        <div
          key={driverId}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            left: `${(location.lng + 74.0060) * 800}px`,
            top: `${(40.7128 - location.lat) * 600}px`
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              {driver?.name || `Driver ${driverId}`}
            </div>
            {/* Pulse animation */}
            <div className="absolute inset-0 w-10 h-10 bg-blue-400 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>
      )
    })
  }

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Deliveries', count: deliveries.length },
    { value: 'pending', label: 'Pending', count: deliveries.filter(d => d.status === 'pending' || d.status === 'assigned').length },
    { value: 'accepted', label: 'Accepted', count: deliveries.filter(d => d.status === 'accepted').length },
    { value: 'started', label: 'Started', count: deliveries.filter(d => d.status === 'started').length },
    { value: 'in-transit', label: 'In Transit', count: deliveries.filter(d => d.status === 'in-transit').length },
    { value: 'arrived', label: 'Arrived', count: deliveries.filter(d => d.status === 'arrived').length },
    { value: 'delivered', label: 'Delivered', count: deliveries.filter(d => d.status === 'delivered').length }
  ]

  return (
    <div className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-30 space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex flex-wrap gap-1">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                  activeFilter === option.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Map Type Indicator */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            {mapType === 'admin' && <><User className="h-4 w-4" /> Admin View</>}
            {mapType === 'driver' && <><Truck className="h-4 w-4" /> Driver View</>}
            {mapType === 'customer' && <><Package className="h-4 w-4" /> Customer View</>}
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Delivered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>Arrived</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>In Transit</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span>Started</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Accepted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            {showDrivers && (
              <div className="flex items-center space-x-2">
                <Truck className="w-3 h-3 text-blue-600" />
                <span>Drivers</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        className="relative bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden"
        style={{ height }}
      >
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-20 grid-rows-15 h-full w-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div key={i} className="border border-gray-200"></div>
            ))}
          </div>
        </div>

        {/* Map Content */}
        <div className="absolute inset-0">
          {renderDeliveryMarkers()}
          {renderDriverMarkers()}
          
          {/* Current Location */}
          {currentLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-25"
              style={{
                left: `${(currentLocation.lng + 74.0060) * 800}px`,
                top: `${(40.7128 - currentLocation.lat) * 600}px`
              }}
            >
              <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping opacity-40"></div>
              </div>
            </div>
          )}
        </div>

        {/* Map Stats Overlay */}
        <div className="absolute bottom-4 left-4 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{filteredDeliveries.length}</div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{filteredDeliveries.filter(d => d.status === 'in-transit').length}</div>
                <div className="text-gray-600">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Indicator */}
        {showDrivers && Object.keys(driverLocations).length > 0 && (
          <div className="absolute bottom-4 right-4 z-30">
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm">
              <Zap className="h-4 w-4 animate-pulse" />
              <span>Live Tracking</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UniversalMap
