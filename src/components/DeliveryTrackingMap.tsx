import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Truck, MapPin, Target } from 'lucide-react'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Hyderabad coordinates
const HYDERABAD_CENTER: [number, number] = [17.385044, 78.486671]

// Location coordinates
const LOCATIONS = {
  gachibowli: [17.440495, 78.348684] as [number, number], // Driver starting point
  madhapur: [17.448378, 78.391670] as [number, number],   // Pickup location
  secunderabad: [17.443464, 78.499729] as [number, number] // Drop location
}

// Custom marker icons
const createCustomIcon = (color: string, iconSvg: string) => {
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
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
`)

const dropIcon = createCustomIcon('#10B981', `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
`)

interface DeliveryTrackingMapProps {
  hasActiveDelivery?: boolean
  onDriverPositionUpdate?: (position: [number, number]) => void
}

// Component to handle map bounds and centering
const MapController: React.FC<{ hasActiveDelivery: boolean; driverPosition: [number, number] }> = ({ 
  hasActiveDelivery, 
  driverPosition 
}) => {
  const map = useMap()

  useEffect(() => {
    if (hasActiveDelivery) {
      // Fit bounds to show all markers
      const bounds = L.latLngBounds([
        driverPosition,
        LOCATIONS.madhapur,
        LOCATIONS.secunderabad
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      // Center on Hyderabad
      map.setView(HYDERABAD_CENTER, 12)
    }
  }, [hasActiveDelivery, driverPosition, map])

  return null
}

const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({ 
  hasActiveDelivery = false,
  onDriverPositionUpdate 
}) => {
  const [driverPosition, setDriverPosition] = useState<[number, number]>(LOCATIONS.gachibowli)
  const [routeProgress, setRouteProgress] = useState(0)
  const animationRef = useRef<number>()

  // Calculate route points (simple linear interpolation)
  const calculateRoute = () => {
    const route: [number, number][] = []
    const steps = 100
    
    // Route from pickup to drop
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const lat = LOCATIONS.madhapur[0] + (LOCATIONS.secunderabad[0] - LOCATIONS.madhapur[0]) * t
      const lng = LOCATIONS.madhapur[1] + (LOCATIONS.secunderabad[1] - LOCATIONS.madhapur[1]) * t
      route.push([lat, lng])
    }
    
    return route
  }

  const route = calculateRoute()

  // Animate driver movement along the route
  useEffect(() => {
    if (hasActiveDelivery && routeProgress < route.length - 1) {
      animationRef.current = window.setTimeout(() => {
        const newProgress = routeProgress + 1
        setRouteProgress(newProgress)
        setDriverPosition(route[newProgress])
        
        if (onDriverPositionUpdate) {
          onDriverPositionUpdate(route[newProgress])
        }
      }, 100) // Move every 100ms for smooth animation
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [hasActiveDelivery, routeProgress, route, onDriverPositionUpdate])

  // Reset animation when delivery status changes
  useEffect(() => {
    if (hasActiveDelivery) {
      setRouteProgress(0)
      setDriverPosition(LOCATIONS.gachibowli)
    }
  }, [hasActiveDelivery])

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
          
          <MapController hasActiveDelivery={hasActiveDelivery} driverPosition={driverPosition} />

          {/* Show markers only when there's an active delivery */}
          {hasActiveDelivery && (
            <>
              {/* Driver Marker */}
              <Marker position={driverPosition} icon={driverIcon} />
              
              {/* Pickup Marker */}
              <Marker position={LOCATIONS.madhapur} icon={pickupIcon} />
              
              {/* Drop Marker */}
              <Marker position={LOCATIONS.secunderabad} icon={dropIcon} />
              
              {/* Route Polyline */}
              <Polyline
                positions={[LOCATIONS.madhapur, LOCATIONS.secunderabad]}
                color="#3B82F6"
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
              
              {/* Traveled Route (from driver to current position) */}
              <Polyline
                positions={[LOCATIONS.madhapur, driverPosition]}
                color="#8B5CF6"
                weight={5}
                opacity={0.9}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 space-y-3 z-[1000]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">Driver</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">Pickup</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">Drop</span>
        </div>
      </div>

      {/* Progress Indicator (optional) */}
      {hasActiveDelivery && (
        <div className="absolute top-6 left-6 bg-white rounded-xl shadow-lg p-4 z-[1000]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700">Live Tracking Active</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Progress: {Math.round((routeProgress / route.length) * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryTrackingMap
