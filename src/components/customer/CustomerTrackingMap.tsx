import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { Delivery } from '../../types'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [48, 48]
})

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface DriverLocation {
  driverId: string
  lat: number
  lng: number
  timestamp: string
  heading?: number
}

interface CustomerTrackingMapProps {
  deliveries: Delivery[]
  selectedDelivery: Delivery | null
  onDeliverySelect: (delivery: Delivery | null) => void
  driverLocations: Record<string, DriverLocation>
}

const CustomerTrackingMap: React.FC<CustomerTrackingMapProps> = ({ 
  deliveries, 
  selectedDelivery, 
  onDeliverySelect,
  driverLocations 
}) => {
  // Default center (New York City)
  const defaultCenter: [number, number] = [40.7128, -74.0060]
  const defaultZoom = 12

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending':
        return '#6b7280' // gray
      case 'assigned':
        return '#8b5cf6' // purple
      case 'in-transit':
        return '#3b82f6' // blue
      case 'delivered':
        return '#10b981' // green
      case 'cancelled':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  const getPriorityWeight = (priority: Delivery['priority']) => {
    switch (priority) {
      case 'high':
        return 5
      case 'medium':
        return 3
      case 'low':
        return 2
      default:
        return 2
    }
  }

  const isDeliveryActive = (delivery: Delivery) => {
    return delivery.status === 'in-transit' || delivery.status === 'assigned'
  }

  const getDriverLocation = (driverId: string) => {
    return driverLocations[driverId]
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {deliveries.map((delivery) => {
          const isSelected = selectedDelivery?.id === delivery.id
          const routeColor = getStatusColor(delivery.status)
          const routeWeight = isSelected ? getPriorityWeight(delivery.priority) + 2 : getPriorityWeight(delivery.priority)
          const routeOpacity = isSelected ? 0.9 : 0.7
          const dashArray = delivery.status === 'pending' ? '10, 10' : undefined
          const driverLocation = getDriverLocation(delivery.driverId)

          return (
            <React.Fragment key={delivery.id}>
              {/* Pickup Marker */}
              <Marker
                position={[delivery.pickupLocation.lat, delivery.pickupLocation.lng]}
                icon={pickupIcon}
                eventHandlers={{
                  click: () => onDeliverySelect(delivery),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-green-700">Pickup Location</h3>
                    <p className="text-sm">{delivery.pickupLocation.address}</p>
                    <p className="text-sm font-medium">Delivery #{delivery.id.slice(-4)}</p>
                    <p className="text-xs text-gray-600">
                      Status: <span className="capitalize font-medium">{delivery.status.replace('-', ' ')}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Priority: <span className="capitalize font-medium">{delivery.priority}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Scheduled: {new Date(delivery.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Dropoff Marker */}
              <Marker
                position={[delivery.dropoffLocation.lat, delivery.dropoffLocation.lng]}
                icon={dropoffIcon}
                eventHandlers={{
                  click: () => onDeliverySelect(delivery),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-red-700">Drop-off Location</h3>
                    <p className="text-sm">{delivery.dropoffLocation.address}</p>
                    <p className="text-sm font-medium">Delivery #{delivery.id.slice(-4)}</p>
                    <p className="text-xs text-gray-600">
                      Estimated Time: {delivery.estimatedTime} minutes
                    </p>
                    <p className="text-xs text-gray-600">
                      Customer: {delivery.customer.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Phone: {delivery.customer.phone}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Driver Location (Live Tracking) */}
              {driverLocation && isDeliveryActive(delivery) && (
                <Marker
                  position={[driverLocation.lat, driverLocation.lng]}
                  icon={driverIcon}
                  eventHandlers={{
                    click: () => onDeliverySelect(delivery),
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold text-blue-700">Driver Location</h3>
                      <p className="text-sm">Delivery #{delivery.id.slice(-4)}</p>
                      <p className="text-xs text-gray-600">
                        Last Updated: {formatTime(driverLocation.timestamp)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Status: <span className="capitalize font-medium text-blue-600">
                          {delivery.status.replace('-', ' ')}
                        </span>
                      </p>
                      <div className="mt-2 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 font-medium">Live Tracking</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Line */}
              <Polyline
                positions={[
                  [delivery.pickupLocation.lat, delivery.pickupLocation.lng],
                  [delivery.dropoffLocation.lat, delivery.dropoffLocation.lng]
                ]}
                color={routeColor}
                weight={routeWeight}
                opacity={routeOpacity}
                dashArray={dashArray}
                eventHandlers={{
                  click: () => onDeliverySelect(delivery),
                }}
              />

              {/* Driver to Pickup/Dropoff Line (if driver location available) */}
              {driverLocation && isDeliveryActive(delivery) && (
                <>
                  {delivery.status === 'assigned' && (
                    <Polyline
                      positions={[
                        [driverLocation.lat, driverLocation.lng],
                        [delivery.pickupLocation.lat, delivery.pickupLocation.lng]
                      ]}
                      color="#3b82f6"
                      weight={3}
                      opacity={0.8}
                      dashArray="5, 5"
                    />
                  )}
                  {delivery.status === 'in-transit' && (
                    <Polyline
                      positions={[
                        [driverLocation.lat, driverLocation.lng],
                        [delivery.dropoffLocation.lat, delivery.dropoffLocation.lng]
                      ]}
                      color="#3b82f6"
                      weight={3}
                      opacity={0.8}
                      dashArray="5, 5"
                    />
                  )}
                </>
              )}
            </React.Fragment>
          )
        })}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10 text-xs">
        <h4 className="font-semibold mb-2">Live Tracking Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Driver (Live Location)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Pickup Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Drop-off Location</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-gray-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-purple-500"></div>
              <span>Assigned</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>In Transit</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Delivery Info */}
      {selectedDelivery && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10 max-w-xs">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900">
              Delivery #{selectedDelivery.id.slice(-4)}
            </h4>
            <button
              onClick={() => onDeliverySelect(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">From:</span> {selectedDelivery.pickupLocation.address}
            </div>
            <div>
              <span className="font-medium">To:</span> {selectedDelivery.dropoffLocation.address}
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                selectedDelivery.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                selectedDelivery.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                selectedDelivery.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                selectedDelivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedDelivery.status.replace('-', ' ')}
              </span>
            </div>
            <div>
              <span className="font-medium">Priority:</span>{' '}
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                selectedDelivery.priority === 'high' ? 'bg-red-100 text-red-800' :
                selectedDelivery.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedDelivery.priority}
              </span>
            </div>
            <div>
              <span className="font-medium">ETA:</span> {selectedDelivery.estimatedTime} minutes
            </div>
            {getDriverLocation(selectedDelivery.driverId) && isDeliveryActive(selectedDelivery) && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-600 font-medium">Live Tracking Active</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Last update: {formatTime(getDriverLocation(selectedDelivery.driverId)!.timestamp)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Tracking Status */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg z-10 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Real-time Tracking</span>
        </div>
        <p className="text-gray-600 mt-1">
          {Object.keys(driverLocations).length} drivers online
        </p>
      </div>
    </div>
  )
}

export default CustomerTrackingMap
