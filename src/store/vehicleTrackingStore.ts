import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VehicleLocation {
  id: string
  vehicleId: string
  driverId: string
  latitude: number
  longitude: number
  timestamp: string
  speed: number
  heading: number
  accuracy: number
}

export interface VehicleStatus {
  id: string
  vehicleId: string
  status: 'Active' | 'Idle' | 'On Delivery' | 'Maintenance' | 'Offline'
  lastUpdate: string
  currentDeliveryId?: string
  estimatedArrival?: string
  route?: {
    origin: { lat: number; lng: number }
    destination: { lat: number; lng: number }
    waypoints: { lat: number; lng: number }[]
    distance: string
    duration: string
  }
}

export interface VehicleTrackingState {
  vehicleLocations: Record<string, VehicleLocation>
  vehicleStatuses: Record<string, VehicleStatus>
  selectedVehicleId: string | null
  isTracking: boolean
  searchQuery: string
  statusFilter: string
  
  // Actions
  updateVehicleLocation: (location: VehicleLocation) => void
  updateVehicleStatus: (status: VehicleStatus) => void
  setSelectedVehicle: (vehicleId: string | null) => void
  setTracking: (isTracking: boolean) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (filter: string) => void
  getVehiclesByStatus: (status: string) => VehicleStatus[]
  searchVehicles: (query: string) => VehicleStatus[]
  simulateVehicleMovement: (vehicleId: string) => void
  startSimulation: () => void
  stopSimulation: () => void
}

// Simulation intervals storage
let simulationIntervals: Record<string, NodeJS.Timeout> = {}

export const useVehicleTrackingStore = create<VehicleTrackingState>()(
  persist(
    (set, get) => ({
      vehicleLocations: {},
      vehicleStatuses: {},
      selectedVehicleId: null,
      isTracking: false,
      searchQuery: '',
      statusFilter: 'all',

      updateVehicleLocation: (location) => {
        set((state) => ({
          vehicleLocations: {
            ...state.vehicleLocations,
            [location.vehicleId]: location
          }
        }))
      },

      updateVehicleStatus: (status) => {
        set((state) => ({
          vehicleStatuses: {
            ...state.vehicleStatuses,
            [status.vehicleId]: status
          }
        }))
      },

      setSelectedVehicle: (vehicleId) => {
        set({ selectedVehicleId: vehicleId })
      },

      setTracking: (isTracking) => {
        set({ isTracking })
        if (isTracking) {
          get().startSimulation()
        } else {
          get().stopSimulation()
        }
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      setStatusFilter: (filter) => {
        set({ statusFilter: filter })
      },

      getVehiclesByStatus: (status) => {
        const { vehicleStatuses } = get()
        return Object.values(vehicleStatuses).filter(vehicle => 
          status === 'all' || vehicle.status === status
        )
      },

      searchVehicles: (query) => {
        const { vehicleStatuses } = get()
        if (!query) return Object.values(vehicleStatuses)
        
        return Object.values(vehicleStatuses).filter(vehicle =>
          vehicle.vehicleId.toLowerCase().includes(query.toLowerCase()) ||
          vehicle.id.toLowerCase().includes(query.toLowerCase())
        )
      },

      simulateVehicleMovement: (vehicleId) => {
        const { vehicleLocations, updateVehicleLocation } = get()
        const currentLocation = vehicleLocations[vehicleId]
        
        if (!currentLocation) return

        // Simulate movement with random GPS coordinates
        const latVariation = (Math.random() - 0.5) * 0.001 // ~100m variation
        const lngVariation = (Math.random() - 0.5) * 0.001
        const speedVariation = Math.random() * 20 + 30 // 30-50 km/h
        const headingVariation = Math.random() * 360

        const newLocation: VehicleLocation = {
          ...currentLocation,
          latitude: currentLocation.latitude + latVariation,
          longitude: currentLocation.longitude + lngVariation,
          speed: speedVariation,
          heading: headingVariation,
          timestamp: new Date().toISOString(),
          accuracy: Math.random() * 10 + 5 // 5-15m accuracy
        }

        updateVehicleLocation(newLocation)
      },

      startSimulation: () => {
        const { vehicleStatuses, simulateVehicleMovement } = get()
        
        // Clear existing intervals
        Object.values(simulationIntervals).forEach(clearInterval)
        simulationIntervals = {}

        // Start simulation for active vehicles
        Object.values(vehicleStatuses).forEach(vehicle => {
          if (vehicle.status === 'Active' || vehicle.status === 'On Delivery') {
            simulationIntervals[vehicle.vehicleId] = setInterval(() => {
              simulateVehicleMovement(vehicle.vehicleId)
            }, 3000) // Update every 3 seconds
          }
        })
      },

      stopSimulation: () => {
        Object.values(simulationIntervals).forEach(clearInterval)
        simulationIntervals = {}
      }
    }),
    {
      name: 'vehicle-tracking-storage',
      partialize: (state) => ({
        vehicleLocations: state.vehicleLocations,
        vehicleStatuses: state.vehicleStatuses
      })
    }
  )
)

// Initialize with sample data
export const initializeVehicleTracking = () => {
  const store = useVehicleTrackingStore.getState()
  
  // Sample vehicle locations (Mumbai area)
  const sampleLocations: VehicleLocation[] = [
    {
      id: '1',
      vehicleId: 'VH001',
      driverId: 'DR001',
      latitude: 19.0760,
      longitude: 72.8777,
      timestamp: new Date().toISOString(),
      speed: 45,
      heading: 90,
      accuracy: 8
    },
    {
      id: '2',
      vehicleId: 'VH002',
      driverId: 'DR002',
      latitude: 19.0896,
      longitude: 72.8656,
      timestamp: new Date().toISOString(),
      speed: 32,
      heading: 180,
      accuracy: 6
    },
    {
      id: '3',
      vehicleId: 'VH003',
      driverId: 'DR003',
      latitude: 19.0544,
      longitude: 72.8324,
      timestamp: new Date().toISOString(),
      speed: 0,
      heading: 0,
      accuracy: 5
    }
  ]

  // Sample vehicle statuses
  const sampleStatuses: VehicleStatus[] = [
    {
      id: '1',
      vehicleId: 'VH001',
      status: 'On Delivery',
      lastUpdate: new Date().toISOString(),
      currentDeliveryId: 'DEL001',
      estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(),
      route: {
        origin: { lat: 19.0760, lng: 72.8777 },
        destination: { lat: 19.0896, lng: 72.8656 },
        waypoints: [],
        distance: '5.2 km',
        duration: '18 mins'
      }
    },
    {
      id: '2',
      vehicleId: 'VH002',
      status: 'Active',
      lastUpdate: new Date().toISOString()
    },
    {
      id: '3',
      vehicleId: 'VH003',
      status: 'Idle',
      lastUpdate: new Date().toISOString()
    }
  ]

  // Initialize data if empty
  if (Object.keys(store.vehicleLocations).length === 0) {
    sampleLocations.forEach(location => store.updateVehicleLocation(location))
    sampleStatuses.forEach(status => store.updateVehicleStatus(status))
  }
}
