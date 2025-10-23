/**
 * Enhanced Delivery Map Component
 * Displays delivery routes with accurate geocoded coordinates
 * Auto-fits bounds for long-distance deliveries
 * Shows real-time driver location
 */

import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Truck, MapPin, Target, Navigation, AlertTriangle } from 'lucide-react'
import type { Delivery } from '../../types'
import { useRealtimeStore } from '../../store/realtimeStore'
import { getMapBounds, calculateDistance, formatCoordinates } from '../../services/geocodingService'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color: string, IconComponent: any) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          ${getIconPath(IconComponent)}
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

const getIconPath = (IconComponent: any) => {
  if (IconComponent === Truck) {
    return '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'
  } else if (IconComponent === MapPin) {
    return '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
  } else if (IconComponent === Target) {
    return '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
  }
  return ''
}

const driverIcon = createCustomIcon('#8B5CF6', Truck)
const pickupIcon = createCustomIcon('#EF4444', MapPin)
const dropIcon = createCustomIcon('#10B981', Target)

interface EnhancedDeliveryMapProps {
  delivery: Delivery
  showRoute?: boolean
  showDriverLocation?: boolean
  height?: string
}

// Component to auto-fit map bounds
const MapBoundsController: React.FC<{
  pickup: { lat: number; lng: number }
  drop: { lat: number; lng: number }
  driver?: { lat: number; lng: number }
}> = ({ pickup, drop, driver }) => {
  const map = useMap()

  useEffect(() => {
    const locations = [pickup, drop]
    if (driver) {
      locations.push(driver)
    }

    const bounds = getMapBounds(locations)
    if (bounds) {
      map.fitBounds([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ], {
        padding: [50, 50],
        maxZoom: 13
      })
    }
  }, [pickup, drop, driver, map])

  return null
}

const EnhancedDeliveryMap: React.FC<EnhancedDeliveryMapProps> = ({
  delivery,
  showRoute = true,
  showDriverLocation = true,
  height = '500px'
}) => {
  const { driverLocations } = useRealtimeStore()
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Get pickup and drop coordinates
  const pickupCoords = delivery.pickup?.coordinates
  const dropCoords = delivery.delivery?.coordinates

  // Validate coordinates
  useEffect(() => {
    const errors: string[] = []

    if (!pickupCoords || !pickupCoords.lat || !pickupCoords.lng) {
      errors.push('Pickup location coordinates are missing')
    }

    if (!dropCoords || !dropCoords.lat || !dropCoords.lng) {
      errors.push('Drop location coordinates are missing')
    }

    // Check if both markers are in the same location (potential geocoding error)
    if (pickupCoords && dropCoords) {
      const distance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        dropCoords.lat,
        dropCoords.lng
      )

      if (distance < 1) {
        errors.push('⚠️ Pickup and drop locations are very close (<1km). Please verify addresses.')
      }

      setRouteDistance(distance)
    }

    setValidationErrors(errors)
  }, [pickupCoords, dropCoords])

  // Update driver position from real-time store
  useEffect(() => {
    if (delivery.driverId && driverLocations[delivery.driverId]) {
      const location = driverLocations[delivery.driverId]
      setDriverPosition([location.lat, location.lng])
    }
  }, [driverLocations, delivery.driverId])

  // Show error if coordinates are invalid
  if (validationErrors.length > 0) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6" style={{ height }}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Map Display Error</h3>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">• {error}</li>
              ))}
            </ul>
            <p className="text-sm text-red-600 mt-3">
              Please ensure addresses are geocoded correctly before viewing the map.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!pickupCoords || !dropCoords) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  const pickupLatLng: [number, number] = [pickupCoords.lat, pickupCoords.lng]
  const dropLatLng: [number, number] = [dropCoords.lat, dropCoords.lng]

  return (
    <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer
        center={pickupLatLng}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds */}
        <MapBoundsController
          pickup={pickupCoords}
          drop={dropCoords}
          driver={driverPosition ? { lat: driverPosition[0], lng: driverPosition[1] } : undefined}
        />

        {/* Pickup Marker */}
        <Marker position={pickupLatLng} icon={pickupIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-red-700 mb-1">Pickup Location</h3>
              <p className="text-sm text-gray-700">{delivery.pickup.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCoordinates(pickupCoords.lat, pickupCoords.lng)}
              </p>
              {delivery.pickup.scheduledTime && (
                <p className="text-xs text-gray-600 mt-1">
                  Scheduled: {new Date(delivery.pickup.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Drop Marker */}
        <Marker position={dropLatLng} icon={dropIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-green-700 mb-1">Drop Location</h3>
              <p className="text-sm text-gray-700">{delivery.delivery.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCoordinates(dropCoords.lat, dropCoords.lng)}
              </p>
              {delivery.delivery.scheduledTime && (
                <p className="text-xs text-gray-600 mt-1">
                  Scheduled: {new Date(delivery.delivery.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Driver Marker (if available and delivery is active) */}
        {showDriverLocation && driverPosition && ['started', 'in-transit', 'arrived'].includes(delivery.status) && (
          <Marker position={driverPosition} icon={driverIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-purple-700 mb-1">Driver Location</h3>
                <p className="text-sm text-gray-700">{delivery.driver?.name || 'Driver'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCoordinates(driverPosition[0], driverPosition[1])}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Status: {delivery.status.replace('-', ' ').toUpperCase()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {showRoute && (
          <>
            {/* Route from pickup to drop */}
            <Polyline
              positions={[pickupLatLng, dropLatLng]}
              color="#3B82F6"
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
            />

            {/* Traveled route (if driver is active) */}
            {driverPosition && ['started', 'in-transit'].includes(delivery.status) && (
              <Polyline
                positions={[pickupLatLng, driverPosition]}
                color="#8B5CF6"
                weight={5}
                opacity={0.9}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-[1000]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Pickup</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Drop</span>
        </div>
        {showDriverLocation && driverPosition && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Driver</span>
          </div>
        )}
      </div>

      {/* Distance Info */}
      {routeDistance && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-semibold text-gray-900">{routeDistance} km</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Indicator */}
      {showDriverLocation && driverPosition && ['started', 'in-transit'].includes(delivery.status) && (
        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-lg shadow-lg px-3 py-2 z-[1000]">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">Live Tracking Active</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedDeliveryMap
