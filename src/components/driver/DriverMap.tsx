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
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

interface DriverMapProps {
  driverId: string
  deliveries: Delivery[]
  currentLocation: { lat: number; lng: number } | null
}

const DriverMap: React.FC<DriverMapProps> = ({ 
  driverId, 
  deliveries, 
  currentLocation 
}) => {
  // Default center (New York City)
  const defaultCenter: [number, number] = currentLocation 
    ? [currentLocation.lat, currentLocation.lng] 
    : [40.7128, -74.0060]
  const defaultZoom = 13

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending':
      case 'assigned':
        return '#fbbf24' // yellow
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

  // Filter deliveries to show only active ones (pending, assigned, in-transit)
  const activeDeliveries = deliveries.filter(d => 
    d.status === 'pending' || d.status === 'assigned' || d.status === 'in-transit'
  )

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
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
        
        {/* Driver's current location */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={driverIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-blue-700">Your Location</h3>
                <p className="text-sm">Current position</p>
                <p className="text-xs text-gray-600">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Active deliveries */}
        {activeDeliveries.map((delivery) => {
          const routeColor = getStatusColor(delivery.status)
          const routeWeight = getPriorityWeight(delivery.priority)
          const routeOpacity = delivery.status === 'in-transit' ? 0.8 : 0.6
          const dashArray = delivery.status === 'pending' || delivery.status === 'assigned' ? '10, 10' : undefined

          return (
            <React.Fragment key={delivery.id}>
              {/* Pickup Marker */}
              <Marker
                position={[delivery.pickupLocation.lat, delivery.pickupLocation.lng]}
                icon={pickupIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-green-700">Pickup</h3>
                    <p className="text-sm">{delivery.pickupLocation.address}</p>
                    <p className="text-sm font-medium">Customer: {delivery.customer.name}</p>
                    <p className="text-xs text-gray-600">
                      Status: <span className="capitalize">{delivery.status.replace('-', ' ')}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Priority: <span className="capitalize">{delivery.priority}</span>
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Dropoff Marker */}
              <Marker
                position={[delivery.dropoffLocation.lat, delivery.dropoffLocation.lng]}
                icon={dropoffIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-red-700">Drop-off</h3>
                    <p className="text-sm">{delivery.dropoffLocation.address}</p>
                    <p className="text-sm font-medium">Customer: {delivery.customer.name}</p>
                    <p className="text-xs text-gray-600">
                      Estimated Time: {delivery.estimatedTime} minutes
                    </p>
                    <p className="text-xs text-gray-600">
                      Phone: {delivery.customer.phone}
                    </p>
                  </div>
                </Popup>
              </Marker>

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
              />
            </React.Fragment>
          )
        })}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10 text-xs">
        <h4 className="font-semibold mb-2">Map Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
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
              <div className="w-4 h-0.5 bg-yellow-500"></div>
              <span>Pending/Assigned</span>
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

      {/* Status Info */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-10 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Active Deliveries:</span>
            <span className="font-medium">{activeDeliveries.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">In Transit:</span>
            <span className="font-medium text-blue-600">
              {activeDeliveries.filter(d => d.status === 'in-transit').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pending:</span>
            <span className="font-medium text-yellow-600">
              {activeDeliveries.filter(d => d.status === 'pending' || d.status === 'assigned').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverMap
