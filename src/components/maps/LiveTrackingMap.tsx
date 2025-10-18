import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Truck, Package, Clock, Route } from 'lucide-react'
import type { Delivery } from '../../types'

interface LiveTrackingMapProps {
  deliveries: Delivery[]
  currentLocation?: { lat: number; lng: number } | null
  driverLocations?: Record<string, { lat: number; lng: number; timestamp: string }>
  selectedDelivery?: Delivery | null
  onDeliverySelect?: (delivery: Delivery) => void
  showDrivers?: boolean
  showRoutes?: boolean
  height?: string
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  deliveries,
  currentLocation,
  driverLocations = {},
  selectedDelivery,
  onDeliverySelect,
  showDrivers = true,
  showRoutes = true,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Mock map initialization (in real app, this would be Google Maps, Leaflet, etc.)
  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Simulate map loading
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsMapLoaded(true)
      } catch (error) {
        setMapError('Failed to load map')
      }
    }

    initializeMap()
  }, [])

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500'
      case 'in-transit':
        return 'bg-blue-500'
      case 'assigned':
        return 'bg-purple-500'
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getLocationCoordinates = (delivery: Delivery) => {
    // Handle both new and legacy formats
    const pickup = delivery.pickup?.coordinates || delivery.pickupLocation || { lat: 40.7128, lng: -74.0060 }
    const dropoff = delivery.delivery?.coordinates || delivery.dropoffLocation || { lat: 40.7589, lng: -73.9851 }
    return { pickup, dropoff }
  }

  const renderMapMarkers = () => {
    const markers = []

    // Current location marker
    if (currentLocation) {
      markers.push(
        <div
          key="current-location"
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            left: '50%',
            top: '50%'
          }}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Your Location
            </div>
          </div>
        </div>
      )
    }

    // Delivery markers
    deliveries.forEach((delivery, index) => {
      const { pickup, dropoff } = getLocationCoordinates(delivery)
      const isSelected = selectedDelivery?.id === delivery.id

      // Pickup marker
      markers.push(
        <div
          key={`pickup-${delivery.id}`}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
          style={{
            left: `${20 + (index * 15)}%`,
            top: `${30 + (index * 10)}%`
          }}
          onClick={() => onDeliverySelect?.(delivery)}
        >
          <div className={`relative ${isSelected ? 'scale-125' : ''} transition-transform duration-200`}>
            <div className={`w-6 h-6 ${getDeliveryStatusColor(delivery.status)} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}>
              <Package className="h-3 w-3 text-white" />
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Pickup
            </div>
          </div>
        </div>
      )

      // Dropoff marker
      markers.push(
        <div
          key={`dropoff-${delivery.id}`}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
          style={{
            left: `${70 + (index * 10)}%`,
            top: `${60 + (index * 8)}%`
          }}
          onClick={() => onDeliverySelect?.(delivery)}
        >
          <div className={`relative ${isSelected ? 'scale-125' : ''} transition-transform duration-200`}>
            <div className={`w-6 h-6 ${getDeliveryStatusColor(delivery.status)} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}>
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Drop-off
            </div>
          </div>
        </div>
      )

      // Route line (simplified)
      if (showRoutes && delivery.status === 'in-transit') {
        markers.push(
          <svg
            key={`route-${delivery.id}`}
            className="absolute inset-0 w-full h-full pointer-events-none z-5"
            style={{ zIndex: 5 }}
          >
            <defs>
              <marker
                id={`arrowhead-${delivery.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#3B82F6"
                />
              </marker>
            </defs>
            <line
              x1={`${20 + (index * 15)}%`}
              y1={`${30 + (index * 10)}%`}
              x2={`${70 + (index * 10)}%`}
              y2={`${60 + (index * 8)}%`}
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd={`url(#arrowhead-${delivery.id})`}
              className="animate-pulse"
            />
          </svg>
        )
      }
    })

    // Driver locations
    if (showDrivers) {
      Object.entries(driverLocations).forEach(([driverId, location], index) => {
        markers.push(
          <div
            key={`driver-${driverId}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15"
            style={{
              left: `${40 + (index * 20)}%`,
              top: `${45 + (index * 15)}%`
            }}
          >
            <div className="relative">
              <div className="w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
                <Truck className="h-2.5 w-2.5 text-white" />
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Driver
              </div>
            </div>
          </div>
        )
      })
    }

    return markers
  }

  if (mapError) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-gray-200 relative overflow-hidden"
        style={{ height }}
      >
        {!isMapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Background grid pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-10 grid-rows-8 h-full w-full">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} className="border border-gray-300"></div>
                ))}
              </div>
            </div>

            {/* Map markers and routes */}
            {renderMapMarkers()}

            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-colors duration-200">
                <Navigation className="h-4 w-4 text-gray-600" />
              </button>
              <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-white transition-colors duration-200">
                <Route className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Your Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Pickup Point</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Drop-off Point</span>
                </div>
                {showDrivers && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Other Drivers</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delivery Info Panel */}
      {selectedDelivery && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">{selectedDelivery.customer.name}</h4>
              <p className="text-sm text-gray-600">{selectedDelivery.package?.description || 'Package delivery'}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(selectedDelivery.status)} text-white`}>
              {selectedDelivery.status.replace('-', ' ')}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Pickup:</p>
              <p className="text-gray-600">
                {selectedDelivery.pickup?.address || selectedDelivery.pickupLocation?.address || 'Unknown location'}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Drop-off:</p>
              <p className="text-gray-600">
                {selectedDelivery.delivery?.address || selectedDelivery.dropoffLocation?.address || 'Unknown location'}
              </p>
            </div>
          </div>

          {selectedDelivery.estimatedTime && (
            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>ETA: {selectedDelivery.estimatedTime} minutes</span>
              </div>
              {selectedDelivery.package?.weight && (
                <div className="flex items-center space-x-1">
                  <span>⚖️</span>
                  <span>{selectedDelivery.package.weight}kg</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LiveTrackingMap
