import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Truck, MapPin, Target, User, Package } from 'lucide-react'
import type { Delivery, Driver } from '../types'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Hyderabad coordinates
const HYDERABAD_CENTER: [number, number] = [17.385044, 78.486671]

// Location coordinates for demo
const LOCATIONS = {
  gachibowli: [17.440495, 78.348684] as [number, number],
  madhapur: [17.448378, 78.391670] as [number, number],
  secunderabad: [17.443464, 78.499729] as [number, number],
  hitech: [17.448500, 78.381389] as [number, number],
  banjara: [17.413056, 78.447222] as [number, number],
}

// Custom marker icons
const createCustomIcon = (color: string, iconSvg: string, size: number = 40) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const driverIcon = createCustomIcon('#8B5CF6', `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
`)

const pickupIcon = createCustomIcon('#EF4444', `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
`, 35)

const dropIcon = createCustomIcon('#10B981', `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
`, 35)

interface AdminDeliveryTrackingMapProps {
  deliveries: Delivery[]
  drivers: Driver[]
  selectedDelivery?: Delivery | null
  onDeliverySelect?: (delivery: Delivery | null) => void
  showAllDrivers?: boolean
}

// Component to handle map bounds and centering
const MapController: React.FC<{ 
  deliveries: Delivery[]
  selectedDelivery?: Delivery | null
}> = ({ deliveries, selectedDelivery }) => {
  const map = useMap()

  useEffect(() => {
    if (selectedDelivery) {
      // Focus on selected delivery
      const pickup = selectedDelivery.pickup || selectedDelivery.pickupLocation
      const delivery = selectedDelivery.delivery || selectedDelivery.dropoffLocation
      
      if (pickup?.coordinates && delivery?.coordinates) {
        const bounds = L.latLngBounds([
          [pickup.coordinates.lat, pickup.coordinates.lng],
          [delivery.coordinates.lat, delivery.coordinates.lng]
        ])
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } else if (deliveries.length > 0) {
      // Fit all deliveries
      const points: [number, number][] = []
      deliveries.forEach(d => {
        const pickup = d.pickup || d.pickupLocation
        const delivery = d.delivery || d.dropoffLocation
        if (pickup?.coordinates) {
          points.push([pickup.coordinates.lat, pickup.coordinates.lng])
        }
        if (delivery?.coordinates) {
          points.push([delivery.coordinates.lat, delivery.coordinates.lng])
        }
      })
      
      if (points.length > 0) {
        const bounds = L.latLngBounds(points)
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } else {
      // Center on Hyderabad
      map.setView(HYDERABAD_CENTER, 12)
    }
  }, [deliveries, selectedDelivery, map])

  return null
}

// Get demo position for delivery based on index
const getDemoPosition = (index: number, status: string): [number, number] => {
  const locations = [LOCATIONS.gachibowli, LOCATIONS.madhapur, LOCATIONS.hitech, LOCATIONS.banjara, LOCATIONS.secunderabad]
  const baseLocation = locations[index % locations.length]
  
  // Add slight offset based on status for animation effect
  const offset = status === 'in-transit' ? 0.002 : 0
  return [baseLocation[0] + offset, baseLocation[1] + offset]
}

const AdminDeliveryTrackingMap: React.FC<AdminDeliveryTrackingMapProps> = ({ 
  deliveries,
  drivers,
  selectedDelivery,
  onDeliverySelect,
  showAllDrivers = true
}) => {
  const [driverPositions, setDriverPositions] = useState<Map<string, [number, number]>>(new Map())

  // Simulate driver movement for active deliveries
  useEffect(() => {
    const activeDeliveries = deliveries.filter(d => 
      ['started', 'in-transit'].includes(d.status)
    )

    if (activeDeliveries.length === 0) return

    const interval = setInterval(() => {
      setDriverPositions(prev => {
        const newPositions = new Map(prev)
        activeDeliveries.forEach((delivery, index) => {
          const currentPos = prev.get(delivery.id) || getDemoPosition(index, delivery.status)
          // Slight random movement for demo
          const newPos: [number, number] = [
            currentPos[0] + (Math.random() - 0.5) * 0.001,
            currentPos[1] + (Math.random() - 0.5) * 0.001
          ]
          newPositions.set(delivery.id, newPos)
        })
        return newPositions
      })
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [deliveries])

  // Initialize driver positions
  useEffect(() => {
    const initialPositions = new Map<string, [number, number]>()
    deliveries.forEach((delivery, index) => {
      if (['started', 'in-transit', 'arrived'].includes(delivery.status)) {
        initialPositions.set(delivery.id, getDemoPosition(index, delivery.status))
      }
    })
    setDriverPositions(initialPositions)
  }, [deliveries])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return '#10B981'
      case 'in-transit': return '#3B82F6'
      case 'arrived': return '#F59E0B'
      case 'assigned': return '#6366F1'
      default: return '#6B7280'
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl">
        <MapContainer
          center={HYDERABAD_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            deliveries={deliveries}
            selectedDelivery={selectedDelivery}
          />

          {/* Render delivery markers and routes */}
          {deliveries.map((delivery, index) => {
            const pickup = delivery.pickup || delivery.pickupLocation
            const deliveryLoc = delivery.delivery || delivery.dropoffLocation
            const driverPos = driverPositions.get(delivery.id)
            const isSelected = selectedDelivery?.id === delivery.id

            // Use demo positions if coordinates not available
            const pickupPos: [number, number] = pickup?.coordinates 
              ? [pickup.coordinates.lat, pickup.coordinates.lng]
              : getDemoPosition(index * 2, 'pickup')
            
            const dropPos: [number, number] = deliveryLoc?.coordinates
              ? [deliveryLoc.coordinates.lat, deliveryLoc.coordinates.lng]
              : getDemoPosition(index * 2 + 1, 'drop')

            return (
              <React.Fragment key={delivery.id}>
                {/* Pickup Marker */}
                <Marker position={pickupPos} icon={pickupIcon}>
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold text-sm">Pickup Location</p>
                      <p className="text-xs text-gray-600">{pickup?.address || 'Pickup Address'}</p>
                      <p className="text-xs text-blue-600 mt-1">Customer: {delivery.customer.name}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Drop Marker */}
                <Marker position={dropPos} icon={dropIcon}>
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold text-sm">Drop Location</p>
                      <p className="text-xs text-gray-600">{deliveryLoc?.address || 'Delivery Address'}</p>
                      <p className="text-xs text-green-600 mt-1">Status: {delivery.status}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Driver Marker (for active deliveries) */}
                {driverPos && ['started', 'in-transit', 'arrived'].includes(delivery.status) && (
                  <Marker position={driverPos} icon={driverIcon}>
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold text-sm">Driver Location</p>
                        {delivery.driver && (
                          <>
                            <p className="text-xs text-gray-600">{delivery.driver.name}</p>
                            <p className="text-xs text-gray-500">{delivery.driver.phone}</p>
                          </>
                        )}
                        <p className="text-xs text-purple-600 mt-1">Status: {delivery.status}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Polyline */}
                <Polyline
                  positions={[pickupPos, dropPos]}
                  color={isSelected ? '#3B82F6' : getStatusColor(delivery.status)}
                  weight={isSelected ? 4 : 3}
                  opacity={isSelected ? 0.9 : 0.6}
                  dashArray={delivery.status === 'assigned' ? '10, 10' : undefined}
                />

                {/* Traveled Route (from pickup to driver position) */}
                {driverPos && delivery.status === 'in-transit' && (
                  <Polyline
                    positions={[pickupPos, driverPos]}
                    color="#8B5CF6"
                    weight={4}
                    opacity={0.9}
                  />
                )}
              </React.Fragment>
            )
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 space-y-3 z-[1000]">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Driver</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Pickup</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Drop</span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Route Status:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-green-500"></div>
              <span className="text-xs text-gray-600">Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-blue-500"></div>
              <span className="text-xs text-gray-600">In Transit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-indigo-500 opacity-60" style={{ borderTop: '1px dashed #6366F1' }}></div>
              <span className="text-xs text-gray-600">Assigned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Overview Stats */}
      <div className="absolute top-6 left-6 bg-white rounded-xl shadow-lg p-4 z-[1000] max-w-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-700">Fleet Overview</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Total Deliveries:</span>
            <span className="text-sm font-bold text-gray-900">{deliveries.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">In Transit:</span>
            <span className="text-sm font-bold text-blue-600">
              {deliveries.filter(d => d.status === 'in-transit').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Started:</span>
            <span className="text-sm font-bold text-green-600">
              {deliveries.filter(d => d.status === 'started').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Assigned:</span>
            <span className="text-sm font-bold text-indigo-600">
              {deliveries.filter(d => d.status === 'assigned').length}
            </span>
          </div>
        </div>

        {selectedDelivery && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Selected Delivery:</p>
            <p className="text-sm font-medium text-gray-900">{selectedDelivery.customer.name}</p>
            <p className="text-xs text-blue-600">{selectedDelivery.status.toUpperCase()}</p>
          </div>
        )}
      </div>

      {/* No Deliveries Message */}
      {deliveries.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 z-[1000] text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
          <p className="text-sm text-gray-600">
            All deliveries are currently completed or pending assignment
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminDeliveryTrackingMap
