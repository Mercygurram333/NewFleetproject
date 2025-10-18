import React, { useEffect } from 'react'
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

// Custom icons for pickup and dropoff
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

interface DeliveryMapProps {
  deliveries: Delivery[]
  selectedDelivery: Delivery | null
  onDeliverySelect: (delivery: Delivery | null) => void
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ 
  deliveries, 
  selectedDelivery, 
  onDeliverySelect 
}) => {
  // Default center (New York City)
  const defaultCenter: [number, number] = [40.7128, -74.0060]
  const defaultZoom = 12

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending':
        return '#fbbf24' // yellow
      case 'assigned':
        return '#3b82f6' // blue
      case 'in-transit':
        return '#8b5cf6' // purple
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
        
        {deliveries.map((delivery) => {
          const isSelected = selectedDelivery?.id === delivery.id
          const routeColor = getStatusColor(delivery.status)
          const routeWeight = isSelected ? getPriorityWeight(delivery.priority) + 2 : getPriorityWeight(delivery.priority)
          const routeOpacity = isSelected ? 0.8 : 0.6

          return (
            <React.Fragment key={delivery.id}>
              {/* Pickup Marker */}
              {(() => {
                const pickupLocation = delivery.pickup || delivery.pickupLocation;
                const pickupLat = pickupLocation?.coordinates?.lat || (pickupLocation as any)?.lat || 40.7128;
                const pickupLng = pickupLocation?.coordinates?.lng || (pickupLocation as any)?.lng || -74.0060;
                
                return (
                  <Marker
                    position={[pickupLat, pickupLng]}
                    icon={pickupIcon}
                    eventHandlers={{
                      click: () => onDeliverySelect(delivery),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-green-700">Pickup Location</h3>
                        <p className="text-sm">{pickupLocation?.address || 'Unknown pickup'}</p>
                        <p className="text-sm font-medium">Customer: {delivery.customer.name}</p>
                        <p className="text-xs text-gray-600">
                          Status: <span className="capitalize">{delivery.status.replace('-', ' ')}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          Priority: <span className="capitalize">{delivery.priority || 'medium'}</span>
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })()}

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
                    <h3 className="font-semibold text-red-700">Dropoff Location</h3>
                    <p className="text-sm">{delivery.dropoffLocation.address}</p>
                    <p className="text-sm font-medium">Customer: {delivery.customer.name}</p>
                    <p className="text-xs text-gray-600">
                      Estimated Time: {delivery.estimatedTime} minutes
                    </p>
                    <p className="text-xs text-gray-600">
                      Scheduled: {new Date(delivery.scheduledAt).toLocaleString()}
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
                dashArray={delivery.status === 'pending' ? '10, 10' : undefined}
                eventHandlers={{
                  click: () => onDeliverySelect(delivery),
                }}
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
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Pickup Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Dropoff Location</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-yellow-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>Assigned</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-purple-500"></div>
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
            <h4 className="font-semibold text-gray-900">Selected Delivery</h4>
            <button
              onClick={() => onDeliverySelect(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Customer:</span> {selectedDelivery.customer.name}
            </div>
            <div>
              <span className="font-medium">From:</span> {selectedDelivery.pickupLocation.address}
            </div>
            <div>
              <span className="font-medium">To:</span> {selectedDelivery.dropoffLocation.address}
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                selectedDelivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                selectedDelivery.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                selectedDelivery.status === 'in-transit' ? 'bg-purple-100 text-purple-800' :
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
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryMap
