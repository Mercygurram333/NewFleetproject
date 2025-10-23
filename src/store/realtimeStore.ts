import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Socket } from 'socket.io-client'
import type { VehicleLocation } from './vehicleTrackingStore'

interface DriverLocation {
  driverId: string
  lat: number
  lng: number
  timestamp: string
  heading?: number
}

interface DeliveryUpdate {
  deliveryId: string
  status: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'started' | 'in-transit' | 'arrived' | 'delivered' | 'cancelled'
  driverId: string
  timestamp: string
  location?: {
    lat: number
    lng: number
  }
}

interface RealtimeState {
  socket: Socket | null
  isConnected: boolean
  driverLocations: Record<string, DriverLocation>
  currentUserLocation: { lat: number; lng: number } | null
  
  // Actions
  initializeSocket: () => void
  initializeMockSocket: () => void
  disconnectSocket: () => void
  updateDriverLocation: (location: DriverLocation) => void
  emitLocationUpdate: (driverId: string, location: { lat: number; lng: number }) => void
  emitDeliveryLocationUpdate: (deliveryId: string, driverId: string, location: { lat: number; lng: number }, status: string) => void
  emitDeliveryStatusUpdate: (update: DeliveryUpdate) => void
  setCurrentUserLocation: (location: { lat: number; lng: number }) => void
  
  // Geolocation
  startLocationTracking: (driverId: string) => void
  stopLocationTracking: () => void
}

let watchId: number | null = null

export const useRealtimeStore = create<RealtimeState>()(
  persist(
    (set, get) => ({
  socket: null,
  isConnected: false,
  driverLocations: {},
  currentUserLocation: null,

  initializeSocket: async () => {
    try {
      // Try to connect to real backend first
      const { io } = await import('socket.io-client')
      const realSocket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000
      })

      realSocket.on('connect', () => {
        console.log('✅ Connected to real backend server')
        set({ socket: realSocket, isConnected: true })
        
        // Listen for location updates from other drivers
        realSocket.on('location-update', (data: DriverLocation) => {
          console.log('📍 Received location update:', data)
          get().updateDriverLocation(data)
        })

        // Listen for delivery status changes
        realSocket.on('delivery-status-changed', (data: any) => {
          console.log('📦 Delivery status changed:', data)
        })

        // Listen for delivery live location updates
        realSocket.on('delivery-live-location', (data: any) => {
          console.log('🚚 Live delivery location update:', data)
        })
      })

      realSocket.on('connect_error', (error: any) => {
        console.warn('Failed to connect to backend, using mock socket:', error.message)
        get().initializeMockSocket()
      })

      realSocket.on('disconnect', () => {
        console.log('Disconnected from backend server')
        set({ isConnected: false })
      })

    } catch (error) {
      console.warn('Socket.io not available, using mock socket:', error)
      get().initializeMockSocket()
    }
  },

  initializeMockSocket: () => {
    // Fallback mock socket for demo purposes
    const mockSocket = {
      connected: true,
      on: (event: string, _callback: Function) => {
        console.log(`Mock: Listening for ${event}`)
      },
      emit: (event: string, data: any) => {
        console.log(`Mock: Emitting ${event}:`, data)
      },
      disconnect: () => {
        console.log('Mock socket disconnected')
      }
    } as any

    set({ 
      socket: mockSocket, 
      isConnected: true 
    })

    // Simulate receiving driver location updates
    const simulateUpdates = () => {
      const mockDrivers = ['1', '2', '3']
      mockDrivers.forEach(driverId => {
        // Simulate random location updates around NYC
        const baseLocation = { lat: 40.7128, lng: -74.0060 }
        const randomLocation = {
          driverId,
          lat: baseLocation.lat + (Math.random() - 0.5) * 0.01,
          lng: baseLocation.lng + (Math.random() - 0.5) * 0.01,
          timestamp: new Date().toISOString(),
          heading: Math.random() * 360
        }
        
        get().updateDriverLocation(randomLocation)
      })
    }

    // Update every 5 seconds for demo
    setInterval(simulateUpdates, 5000)
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },

  updateDriverLocation: (location: DriverLocation) => {
    set(state => ({
      driverLocations: {
        ...state.driverLocations,
        [location.driverId]: location
      }
    }))
  },

  emitLocationUpdate: (driverId: string, location: { lat: number; lng: number }) => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.emit('driver-location-update', {
        driverId,
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date().toISOString(),
        heading: 0 // Could be calculated from movement
      })
    }
  },

  emitDeliveryLocationUpdate: (deliveryId: string, driverId: string, location: { lat: number; lng: number }, status: string) => {
    const { socket } = get()
    if (socket && socket.connected) {
      socket.emit('delivery-location-update', {
        deliveryId,
        driverId,
        location,
        timestamp: new Date().toISOString(),
        status
      })
      console.log(`Emitted delivery location update for delivery ${deliveryId}`)
    }
  },

  emitDeliveryStatusUpdate: (update: DeliveryUpdate) => {
    const { socket } = get()
    if (socket) {
      socket.emit('delivery-status-update', update)
      console.log('Delivery status update emitted:', update)
    }
  },

  setCurrentUserLocation: (location: { lat: number; lng: number }) => {
    set({ currentUserLocation: location })
  },

  startLocationTracking: (driverId: string) => {
    console.log(`🚀 Starting GPS tracking for driver ${driverId}`)
    
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.')
      // Use fallback location (Hyderabad, India)
      const fallbackLocation = { lat: 17.385044, lng: 78.486671 }
      get().setCurrentUserLocation(fallbackLocation)
      get().emitLocationUpdate(driverId, fallbackLocation)
      return
    }

    const options = {
      enableHighAccuracy: true, // Use GPS for accurate location
      timeout: 15000, // Wait up to 15 seconds
      maximumAge: 0 // Don't use cached location
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        console.log(`📍 Initial GPS location obtained: [${location.lat}, ${location.lng}]`)
        console.log(`   Accuracy: ${position.coords.accuracy}m`)
        
        get().setCurrentUserLocation(location)
        get().emitLocationUpdate(driverId, location)
      },
      (error) => {
        console.warn('❌ Initial GPS location failed:', error.message)
        console.warn('   Error code:', error.code)
        
        // Use fallback location (Hyderabad, India)
        const fallbackLocation = { lat: 17.385044, lng: 78.486671 }
        console.log(`🔄 Using fallback location: [${fallbackLocation.lat}, ${fallbackLocation.lng}]`)
        
        get().setCurrentUserLocation(fallbackLocation)
        get().emitLocationUpdate(driverId, fallbackLocation)
      },
      options
    )

    // Watch position changes for continuous tracking
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        const accuracy = position.coords.accuracy
        const speed = position.coords.speed || 0
        const heading = position.coords.heading || 0
        
        console.log(`📍 GPS Update: [${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}]`)
        console.log(`   Accuracy: ${accuracy.toFixed(2)}m | Speed: ${speed.toFixed(2)}m/s`)
        
        get().setCurrentUserLocation(location)
        
        // Emit location with additional GPS data
        const { socket } = get()
        if (socket && socket.connected) {
          socket.emit('driver-location-update', {
            driverId,
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date().toISOString(),
            heading,
            speed,
            accuracy
          })
          
          // Also emit driver-active-location for backward compatibility
          socket.emit('driver-active-location', {
            driverId,
            location,
            timestamp: new Date().toISOString(),
            heading,
            speed,
            accuracy
          })
        }
      },
      (error) => {
        console.warn('⚠️ GPS tracking error:', error.message)
        console.warn('   Error code:', error.code)
        
        // Continue with last known location or fallback
        const currentLocation = get().currentUserLocation
        if (!currentLocation) {
          const fallbackLocation = { lat: 17.385044, lng: 78.486671 }
          console.log(`🔄 Using fallback location after error`)
          get().setCurrentUserLocation(fallbackLocation)
          get().emitLocationUpdate(driverId, fallbackLocation)
        }
      },
      options
    )
  },

  stopLocationTracking: () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }
}),
{
  name: 'fleet-realtime-storage',
  version: 1,
  partialize: (state) => ({
    driverLocations: state.driverLocations,
    currentUserLocation: state.currentUserLocation,
  }),
}
)
)

// Auto-initialize socket when store is created
setTimeout(() => {
  useRealtimeStore.getState().initializeSocket()
}, 100)
