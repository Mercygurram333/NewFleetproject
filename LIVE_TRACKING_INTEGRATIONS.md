# 🗺️ Live Tracking Integration Options

## 1. 🌍 **Google Maps Integration** (Recommended)

### Features:
- Real-time GPS tracking with high accuracy
- Turn-by-turn navigation
- Traffic-aware routing
- Street view integration
- Geocoding and reverse geocoding

### Implementation:

```typescript
// GoogleMapsTracker.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface GoogleMapsTrackerProps {
  deliveries: Delivery[]
  driverLocation: { lat: number; lng: number } | null
  onLocationUpdate: (location: { lat: number; lng: number }) => void
}

const GoogleMapsTracker: React.FC<GoogleMapsTrackerProps> = ({
  deliveries,
  driverLocation,
  onLocationUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['geometry', 'places']
    })

    loader.load().then(() => {
      if (mapRef.current) {
        const googleMap = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 },
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        })

        const dirService = new google.maps.DirectionsService()
        const dirRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#4285f4',
            strokeWeight: 4
          }
        })

        dirRenderer.setMap(googleMap)
        
        setMap(googleMap)
        setDirectionsService(dirService)
        setDirectionsRenderer(dirRenderer)
      }
    })
  }, [])

  // Real-time location tracking
  useEffect(() => {
    if (!map) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        onLocationUpdate(newLocation)
        
        // Update driver marker
        new google.maps.Marker({
          position: newLocation,
          map: map,
          title: 'Driver Location',
          icon: {
            url: '/driver-icon.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        })
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [map, onLocationUpdate])

  return <div ref={mapRef} className="w-full h-96 rounded-lg" />
}

export default GoogleMapsTracker
```

### Setup:
```bash
npm install @googlemaps/js-api-loader
```

---

## 2. 🌐 **Mapbox Integration** (High Performance)

### Features:
- Vector-based maps with smooth animations
- Offline map support
- Custom styling and themes
- 3D terrain visualization
- Advanced routing algorithms

### Implementation:

```typescript
// MapboxTracker.tsx
import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN!

const MapboxTracker: React.FC<MapboxTrackerProps> = ({
  deliveries,
  driverLocation,
  onLocationUpdate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [lng, setLng] = useState(-74.0060)
  const [lat, setLat] = useState(40.7128)
  const [zoom, setZoom] = useState(13)

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: 0
    })

    // Add real-time location tracking
    map.current.on('load', () => {
      // Add driver location source
      map.current!.addSource('driver-location', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }
      })

      // Add driver marker
      map.current!.addLayer({
        id: 'driver-marker',
        type: 'symbol',
        source: 'driver-location',
        layout: {
          'icon-image': 'car-15',
          'icon-size': 2,
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map'
        }
      })

      // Start location tracking
      startLocationTracking()
    })
  }, [])

  const startLocationTracking = () => {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords
        
        // Update map source
        const source = map.current!.getSource('driver-location') as mapboxgl.GeoJSONSource
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          properties: {
            bearing: heading || 0
          }
        })

        // Center map on driver
        map.current!.flyTo({
          center: [longitude, latitude],
          zoom: 16
        })

        onLocationUpdate({ lat: latitude, lng: longitude })
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  return <div ref={mapContainer} className="w-full h-96 rounded-lg" />
}
```

### Setup:
```bash
npm install mapbox-gl @types/mapbox-gl
```

---

## 3. 📡 **WebRTC P2P Tracking** (Ultra Low Latency)

### Features:
- Direct peer-to-peer communication
- Ultra-low latency updates
- No server bandwidth usage
- Real-time video/audio streaming
- End-to-end encryption

### Implementation:

```typescript
// WebRTCTracker.tsx
import React, { useEffect, useRef, useState } from 'react'

class WebRTCLocationTracker {
  private peerConnection: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
  private onLocationReceived: (location: any) => void

  constructor(onLocationReceived: (location: any) => void) {
    this.onLocationReceived = onLocationReceived
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })
    
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    // Create data channel for location sharing
    this.dataChannel = this.peerConnection.createDataChannel('location', {
      ordered: true
    })

    this.dataChannel.onopen = () => {
      console.log('WebRTC Data Channel opened')
      this.startLocationSharing()
    }

    this.dataChannel.onmessage = (event) => {
      const locationData = JSON.parse(event.data)
      this.onLocationReceived(locationData)
    }

    // Handle incoming data channels
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      channel.onmessage = (event) => {
        const locationData = JSON.parse(event.data)
        this.onLocationReceived(locationData)
      }
    }
  }

  private startLocationSharing() {
    navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        }

        if (this.dataChannel && this.dataChannel.readyState === 'open') {
          this.dataChannel.send(JSON.stringify(locationData))
        }
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 }
    )
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer)
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }
}

const WebRTCTracker: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([])
  const trackerRef = useRef<WebRTCLocationTracker | null>(null)

  useEffect(() => {
    trackerRef.current = new WebRTCLocationTracker((location) => {
      setLocations(prev => [...prev.slice(-10), location])
    })

    return () => {
      if (trackerRef.current) {
        // Cleanup WebRTC connections
      }
    }
  }, [])

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">WebRTC Live Tracking</h3>
      <div className="space-y-2">
        {locations.map((loc, index) => (
          <div key={index} className="p-2 bg-gray-100 rounded">
            Lat: {loc.lat.toFixed(6)}, Lng: {loc.lng.toFixed(6)}
            <br />
            Speed: {loc.speed || 0} m/s, Accuracy: {loc.accuracy}m
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 4. 🛰️ **GPS Device Integration** (Hardware-based)

### Features:
- Hardware GPS devices
- Cellular/LoRaWAN connectivity
- Battery-powered operation
- Geofencing capabilities
- Tamper detection

### Implementation:

```typescript
// GPSDeviceTracker.tsx
import React, { useEffect, useState } from 'react'

interface GPSDevice {
  deviceId: string
  imei: string
  lastLocation: {
    lat: number
    lng: number
    timestamp: string
    speed: number
    heading: number
    altitude: number
  }
  battery: number
  signal: number
}

class GPSDeviceManager {
  private devices: Map<string, GPSDevice> = new Map()
  private websocket: WebSocket | null = null

  constructor() {
    this.connectToGPSServer()
  }

  private connectToGPSServer() {
    // Connect to GPS tracking server (e.g., Traccar, GPS Gate)
    this.websocket = new WebSocket('ws://localhost:8082/api/socket')
    
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'position') {
        this.updateDeviceLocation(data.deviceId, {
          lat: data.latitude,
          lng: data.longitude,
          timestamp: data.deviceTime,
          speed: data.speed || 0,
          heading: data.course || 0,
          altitude: data.altitude || 0
        })
      }
    }
  }

  private updateDeviceLocation(deviceId: string, location: any) {
    const device = this.devices.get(deviceId)
    if (device) {
      device.lastLocation = location
      this.devices.set(deviceId, device)
    }
  }

  getDeviceLocation(deviceId: string): GPSDevice | null {
    return this.devices.get(deviceId) || null
  }

  getAllDevices(): GPSDevice[] {
    return Array.from(this.devices.values())
  }
}

const GPSDeviceTracker: React.FC = () => {
  const [devices, setDevices] = useState<GPSDevice[]>([])
  const [manager] = useState(() => new GPSDeviceManager())

  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(manager.getAllDevices())
    }, 1000)

    return () => clearInterval(interval)
  }, [manager])

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">GPS Device Tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map(device => (
          <div key={device.deviceId} className="p-4 border rounded-lg">
            <h4 className="font-semibold">Device: {device.deviceId}</h4>
            <p>IMEI: {device.imei}</p>
            <p>Location: {device.lastLocation.lat.toFixed(6)}, {device.lastLocation.lng.toFixed(6)}</p>
            <p>Speed: {device.lastLocation.speed} km/h</p>
            <p>Battery: {device.battery}%</p>
            <p>Signal: {device.signal}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. 🌊 **Server-Sent Events (SSE)** (Simple & Reliable)

### Features:
- One-way server-to-client streaming
- Automatic reconnection
- Built-in browser support
- Lower overhead than WebSockets
- Perfect for location updates

### Implementation:

```typescript
// SSETracker.tsx
import React, { useEffect, useState } from 'react'

interface LocationUpdate {
  driverId: string
  lat: number
  lng: number
  timestamp: string
  speed?: number
  heading?: number
}

const SSETracker: React.FC = () => {
  const [locations, setLocations] = useState<LocationUpdate[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/live-tracking/stream')
    
    eventSource.onopen = () => {
      setConnectionStatus('connected')
      console.log('SSE connection opened')
    }

    eventSource.onmessage = (event) => {
      const locationUpdate: LocationUpdate = JSON.parse(event.data)
      setLocations(prev => [...prev.slice(-50), locationUpdate])
    }

    eventSource.onerror = (error) => {
      setConnectionStatus('disconnected')
      console.error('SSE error:', error)
    }

    // Send location updates to server
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetch('/api/live-tracking/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverId: 'current-driver',
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              speed: position.coords.speed,
              heading: position.coords.heading
            })
          })
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      )
    }

    // Send location every 5 seconds
    const locationInterval = setInterval(sendLocation, 5000)
    sendLocation() // Send immediately

    return () => {
      eventSource.close()
      clearInterval(locationInterval)
    }
  }, [])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">SSE Live Tracking</h3>
        <div className={`px-3 py-1 rounded-full text-sm ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {connectionStatus}
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {locations.map((loc, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Driver: {loc.driverId}</p>
                <p className="text-sm text-gray-600">
                  {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                </p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{new Date(loc.timestamp).toLocaleTimeString()}</p>
                {loc.speed && <p>{loc.speed.toFixed(1)} m/s</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Backend SSE Server:
```javascript
// sse-server.js
app.get('/api/live-tracking/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  const clientId = Date.now()
  clients.set(clientId, res)

  req.on('close', () => {
    clients.delete(clientId)
  })
})

app.post('/api/live-tracking/update', (req, res) => {
  const locationUpdate = req.body
  
  // Broadcast to all connected clients
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(locationUpdate)}\n\n`)
  })
  
  res.json({ success: true })
})
```

---

## 6. 📱 **Progressive Web App (PWA) Integration**

### Features:
- Background location tracking
- Push notifications
- Offline functionality
- App-like experience
- Device integration

### Implementation:

```typescript
// PWATracker.tsx
import React, { useEffect, useState } from 'react'

class PWALocationService {
  private registration: ServiceWorkerRegistration | null = null

  async initialize() {
    if ('serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.register('/sw.js')
      
      // Request notification permission
      if ('Notification' in window) {
        await Notification.requestPermission()
      }
    }
  }

  async startBackgroundTracking() {
    if (this.registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register background sync
      await this.registration.sync.register('location-sync')
    }
  }

  async sendNotification(title: string, body: string) {
    if (this.registration) {
      await this.registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      })
    }
  }
}

const PWATracker: React.FC = () => {
  const [service] = useState(() => new PWALocationService())
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    service.initialize()
  }, [service])

  const startTracking = async () => {
    await service.startBackgroundTracking()
    setIsTracking(true)
    
    // Send notification
    await service.sendNotification(
      'Live Tracking Started',
      'Your location is now being tracked for deliveries'
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">PWA Live Tracking</h3>
      <button
        onClick={startTracking}
        disabled={isTracking}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isTracking ? 'Tracking Active' : 'Start Background Tracking'}
      </button>
    </div>
  )
}
```

---

## 🚀 **Recommendation Matrix**

| Integration | Accuracy | Performance | Cost | Complexity | Best For |
|-------------|----------|-------------|------|------------|----------|
| **Google Maps** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 💰💰💰 | ⭐⭐⭐ | Production apps |
| **Mapbox** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰💰 | ⭐⭐⭐⭐ | Custom styling |
| **WebRTC** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 💰 | ⭐⭐⭐⭐⭐ | Real-time P2P |
| **GPS Device** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 💰💰💰💰 | ⭐⭐ | Fleet vehicles |
| **SSE** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 💰 | ⭐⭐ | Simple streaming |
| **PWA** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 💰 | ⭐⭐⭐ | Mobile apps |

Choose the integration that best fits your requirements for accuracy, performance, budget, and complexity!
