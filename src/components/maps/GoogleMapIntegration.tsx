import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Truck, Package, Zap, AlertCircle } from 'lucide-react'
import type { Delivery, Driver } from '../../types'

interface GoogleMapIntegrationProps {
  deliveries: Delivery[]
  drivers?: Driver[]
  driverLocations?: Record<string, { lat: number; lng: number; timestamp: string }>
  selectedDelivery?: Delivery | null
  onDeliverySelect?: (delivery: Delivery | null) => void
  currentLocation?: { lat: number; lng: number } | null
  showDrivers?: boolean
  showRoutes?: boolean
  height?: string
  className?: string
  mapType?: 'admin' | 'driver' | 'customer'
  apiKey?: string
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GoogleMapIntegration: React.FC<GoogleMapIntegrationProps> = ({
  deliveries,
  drivers = [],
  driverLocations = {},
  selectedDelivery,
  onDeliverySelect,
  currentLocation,
  showDrivers = true,
  showRoutes = true,
  height = '400px',
  className = '',
  mapType = 'admin',
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routesRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Google Maps API
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key not provided. Using fallback map.')
      return
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`
    script.async = true
    script.defer = true
    
    window.initGoogleMaps = () => {
      setIsLoaded(true)
    }
    
    script.onload = window.initGoogleMaps
    script.onerror = () => {
      setError('Failed to load Google Maps API')
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [apiKey])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return

    const defaultCenter = currentLocation || { lat: 40.7128, lng: -74.0060 } // NYC default

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: defaultCenter,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true
    })

    // Add traffic layer for better route planning
    const trafficLayer = new window.google.maps.TrafficLayer()
    trafficLayer.setMap(mapInstanceRef.current)

  }, [isLoaded, currentLocation])

  // Update markers and routes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google) return

    // Clear existing markers and routes
    markersRef.current.forEach(marker => marker.setMap(null))
    routesRef.current.forEach(route => route.setMap(null))
    markersRef.current = []
    routesRef.current = []

    // Add delivery markers
    deliveries.forEach(delivery => {
      addDeliveryMarkers(delivery)
    })

    // Add driver markers
    if (showDrivers) {
      Object.entries(driverLocations).forEach(([driverId, location]) => {
        addDriverMarker(driverId, location)
      })
    }

    // Add current location marker
    if (currentLocation) {
      addCurrentLocationMarker(currentLocation)
    }

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition())
      })
      mapInstanceRef.current.fitBounds(bounds)
    }

  }, [isLoaded, deliveries, driverLocations, currentLocation, showDrivers, showRoutes])

  const addDeliveryMarkers = (delivery: Delivery) => {
    if (!window.google || !mapInstanceRef.current) return

    const pickup = delivery.pickup || delivery.pickupLocation
    const dropoff = delivery.delivery || delivery.dropoffLocation

    // Pickup marker
    if (pickup) {
      const pickupLatLng = new window.google.maps.LatLng(
        pickup.coordinates?.lat || (pickup as any).lat || 0,
        pickup.coordinates?.lng || (pickup as any).lng || 0
      )

      const pickupMarker = new window.google.maps.Marker({
        position: pickupLatLng,
        map: mapInstanceRef.current,
        title: `Pickup: ${delivery.customer.name}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getStatusColor(delivery.status),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })

      const pickupInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-sm">
            <h3 class="font-semibold text-gray-900">${delivery.customer.name}</h3>
            <p class="text-sm text-gray-600 mt-1">Pickup: ${pickup.address}</p>
            <p class="text-sm text-gray-600">Status: ${delivery.status}</p>
            <div class="mt-2">
              <span class="px-2 py-1 text-xs rounded-full" style="background-color: ${getStatusColor(delivery.status)}20; color: ${getStatusColor(delivery.status)}">
                ${delivery.status.toUpperCase()}
              </span>
            </div>
          </div>
        `
      })

      pickupMarker.addListener('click', () => {
        pickupInfoWindow.open(mapInstanceRef.current, pickupMarker)
        onDeliverySelect?.(delivery)
      })

      markersRef.current.push(pickupMarker)
    }

    // Delivery marker
    if (dropoff) {
      const dropoffLatLng = new window.google.maps.LatLng(
        dropoff.coordinates?.lat || (dropoff as any).lat || 0,
        dropoff.coordinates?.lng || (dropoff as any).lng || 0
      )

      const dropoffMarker = new window.google.maps.Marker({
        position: dropoffLatLng,
        map: mapInstanceRef.current,
        title: `Delivery: ${delivery.customer.name}`,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: getStatusColor(delivery.status),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })

      const dropoffInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-sm">
            <h3 class="font-semibold text-gray-900">${delivery.customer.name}</h3>
            <p class="text-sm text-gray-600 mt-1">Delivery: ${dropoff.address}</p>
            <p class="text-sm text-gray-600">Package: ${delivery.package?.description || 'Package'}</p>
            <div class="mt-2">
              <span class="px-2 py-1 text-xs rounded-full" style="background-color: ${getStatusColor(delivery.status)}20; color: ${getStatusColor(delivery.status)}">
                ${delivery.status.toUpperCase()}
              </span>
            </div>
          </div>
        `
      })

      dropoffMarker.addListener('click', () => {
        dropoffInfoWindow.open(mapInstanceRef.current, dropoffMarker)
        onDeliverySelect?.(delivery)
      })

      markersRef.current.push(dropoffMarker)
    }

    // Add route between pickup and delivery
    if (showRoutes && pickup && dropoff) {
      const directionsService = new window.google.maps.DirectionsService()
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: getStatusColor(delivery.status),
          strokeOpacity: delivery.status === 'in-transit' ? 1.0 : 0.6,
          strokeWeight: delivery.status === 'in-transit' ? 4 : 2
        }
      })

      directionsService.route({
        origin: new window.google.maps.LatLng(
          pickup.coordinates?.lat || (pickup as any).lat || 0,
          pickup.coordinates?.lng || (pickup as any).lng || 0
        ),
        destination: new window.google.maps.LatLng(
          dropoff.coordinates?.lat || (dropoff as any).lat || 0,
          dropoff.coordinates?.lng || (dropoff as any).lng || 0
        ),
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result)
          directionsRenderer.setMap(mapInstanceRef.current)
          routesRef.current.push(directionsRenderer)
        }
      })
    }
  }

  const addDriverMarker = (driverId: string, location: { lat: number; lng: number; timestamp: string }) => {
    if (!window.google || !mapInstanceRef.current) return

    const driver = drivers.find(d => d.id === driverId)
    const driverLatLng = new window.google.maps.LatLng(location.lat, location.lng)

    const driverMarker = new window.google.maps.Marker({
      position: driverLatLng,
      map: mapInstanceRef.current,
      title: `Driver: ${driver?.name || driverId}`,
      icon: {
        path: 'M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759   c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z   M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.284   v4.805l-2.73-0.351V14.188L15.741,21.284z M13.011,37.94V27.579l2.73,0.351v8.125L13.011,37.94z M14.568,40.882l2.218-3.336   h13.424l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.35v10.048L31.321,35.805z',
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 0.8,
        anchor: new window.google.maps.Point(23, 44)
      },
      animation: window.google.maps.Animation.BOUNCE
    })

    // Stop bouncing after 2 seconds
    setTimeout(() => {
      driverMarker.setAnimation(null)
    }, 2000)

    const driverInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-3 max-w-sm">
          <h3 class="font-semibold text-blue-900">${driver?.name || `Driver ${driverId}`}</h3>
          <p class="text-sm text-blue-600 mt-1">Status: ${driver?.status || 'Active'}</p>
          <p class="text-sm text-gray-600">Last update: ${new Date(location.timestamp).toLocaleTimeString()}</p>
          <div class="mt-2 flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-green-600">Live Tracking</span>
          </div>
        </div>
      `
    })

    driverMarker.addListener('click', () => {
      driverInfoWindow.open(mapInstanceRef.current, driverMarker)
    })

    markersRef.current.push(driverMarker)
  }

  const addCurrentLocationMarker = (location: { lat: number; lng: number }) => {
    if (!window.google || !mapInstanceRef.current) return

    const currentLatLng = new window.google.maps.LatLng(location.lat, location.lng)

    const currentMarker = new window.google.maps.Marker({
      position: currentLatLng,
      map: mapInstanceRef.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    })

    // Add pulsing circle around current location
    const pulseCircle = new window.google.maps.Circle({
      strokeColor: '#EF4444',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#EF4444',
      fillOpacity: 0.2,
      map: mapInstanceRef.current,
      center: currentLatLng,
      radius: 100
    })

    markersRef.current.push(currentMarker)
    routesRef.current.push(pulseCircle)
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered': return '#10B981'
      case 'arrived': return '#059669'
      case 'in-transit': return '#3B82F6'
      case 'started': return '#6366F1'
      case 'accepted': return '#8B5CF6'
      case 'assigned':
      case 'pending': return '#F59E0B'
      case 'rejected': return '#EF4444'
      default: return '#6B7280'
    }
  }

  // Fallback to UniversalMap if Google Maps fails to load
  if (error || !apiKey) {
    const UniversalMap = React.lazy(() => import('./UniversalMap'))
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center h-64">Loading map...</div>}>
        <UniversalMap
          deliveries={deliveries}
          drivers={drivers}
          driverLocations={driverLocations}
          selectedDelivery={selectedDelivery}
          onDeliverySelect={onDeliverySelect}
          currentLocation={currentLocation}
          showDrivers={showDrivers}
          showRoutes={showRoutes}
          height={height}
          className={className}
          mapType={mapType}
        />
      </React.Suspense>
    )
  }

  return (
    <div className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            {mapType === 'admin' && <><Package className="h-4 w-4" /> Admin View</>}
            {mapType === 'driver' && <><Truck className="h-4 w-4" /> Driver View</>}
            {mapType === 'customer' && <><MapPin className="h-4 w-4" /> Customer View</>}
          </div>
        </div>

        {/* Live indicator */}
        {showDrivers && Object.keys(driverLocations).length > 0 && (
          <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm">
            <Zap className="h-4 w-4 animate-pulse" />
            <span>Live Tracking</span>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Delivered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>In Transit</span>
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

      {/* Google Map Container */}
      <div 
        ref={mapRef}
        style={{ height }}
        className="w-full"
      />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoogleMapIntegration
