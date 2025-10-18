import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vehicle, Driver, Delivery } from '../types'

interface AdminState {
  vehicles: Vehicle[]
  drivers: Driver[]
  deliveries: Delivery[]
  
  // Vehicle actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  deleteVehicle: (id: string) => void
  
  // Driver actions
  addDriver: (driver: Omit<Driver, 'id' | 'createdAt' | 'rating' | 'totalTrips'>) => void
  updateDriver: (id: string, updates: Partial<Driver>) => void
  deleteDriver: (id: string) => void
  
  // Delivery actions
  addDelivery: (delivery: Omit<Delivery, 'id' | 'createdAt'>) => void
  updateDelivery: (id: string, updates: Partial<Delivery>) => void
  deleteDelivery: (id: string) => void
  acceptDeliveryRequest: (deliveryId: string, driverId: string, vehicleId: string) => { success: boolean; error?: string }
  driverAcceptDelivery: (deliveryId: string, driverId: string) => void
  driverRejectDelivery: (deliveryId: string, driverId: string, reason?: string) => void
  startDeliveryRide: (deliveryId: string, driverId: string) => void
  markDeliveryInTransit: (deliveryId: string, driverId: string) => void
  markDeliveryArrived: (deliveryId: string, driverId: string) => void
  completeDelivery: (deliveryId: string, driverId: string, completionNotes?: string) => void
  
  // Scheduling validation functions
  checkDriverAvailability: (driverId: string, scheduledTime: string, deliveryId?: string) => {
    available: boolean
    conflicts: Array<{
      id: string
      scheduledTime?: string
      estimatedTime?: number
      customer: string
    }>
  }
  checkVehicleAvailability: (vehicleId: string, scheduledTime: string, deliveryId?: string) => {
    available: boolean
    conflicts: Array<{
      id: string
      scheduledTime?: string
      estimatedTime?: number
      customer: string
    }>
  }
  validateDeliveryScheduling: (deliveryData: Partial<Delivery>, deliveryId?: string) => {
    valid: boolean
    errors: string[]
  }
  
  // Initialize data
  initializeData: () => void
  
  // Utility functions
  getAvailableVehicles: () => Vehicle[]
  getAvailableDrivers: () => Driver[]
  getPendingDeliveries: () => Delivery[]
  getDriverDeliveries: (driverId: string) => Delivery[]
  getDeliveryStats: (driverId?: string) => {
    total: number
    pending: number
    accepted: number
    started: number
    inTransit: number
    arrived: number
    completed: number
    rejected: number
  }
}

// Dummy data
const initialVehicles: Vehicle[] = [
  {
    id: '1',
    vehicleNumber: 'FL-001',
    type: 'truck',
    capacity: 1000,
    status: 'available',
    createdAt: '2024-10-15T10:00:00Z'
  },
  {
    id: '2',
    vehicleNumber: 'FL-002',
    type: 'van',
    capacity: 500,
    status: 'in-use',
    driverId: '1',
    createdAt: '2024-10-14T09:00:00Z'
  },
  {
    id: '3',
    vehicleNumber: 'FL-003',
    type: 'motorcycle',
    capacity: 50,
    status: 'available',
    createdAt: '2024-10-13T08:00:00Z'
  }
]

const initialDrivers: Driver[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@fleet.com',
    phone: '+1-555-0101',
    licenseNumber: 'DL123456789',
    status: 'available',
    vehicleId: '1',
    rating: 4.8,
    totalTrips: 156,
    createdAt: '2024-10-01T10:00:00Z'
  },
  {
    id: '4',
    name: 'Mercy Gurrani',
    email: 'mercygurrani64@gmail.com',
    phone: '+1-555-0104',
    licenseNumber: 'DL987654321',
    status: 'available',
    vehicleId: '2',
    rating: 4.9,
    totalTrips: 89,
    createdAt: '2024-10-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@fleet.com',
    phone: '+1-555-0102',
    licenseNumber: 'DL987654321',
    status: 'available',
    rating: 4.9,
    totalTrips: 98,
    createdAt: '2024-10-02T11:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike.wilson@fleet.com',
    phone: '+1-555-0103',
    licenseNumber: 'DL456789123',
    status: 'offline',
    rating: 4.6,
    totalTrips: 67,
    createdAt: '2024-10-03T12:00:00Z'
  }
]

const initialDeliveries: Delivery[] = [
  {
    id: '1',
    pickup: {
      address: '123 Main St, Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      scheduledTime: '2024-10-17T09:00:00Z'
    },
    delivery: {
      address: '456 Oak Ave, Uptown',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      scheduledTime: '2024-10-17T10:00:00Z'
    },
    customer: {
      name: 'Alice Brown',
      email: 'alice.brown@email.com',
      phone: '+1-555-0201'
    },
    package: {
      description: 'Electronics Package',
      weight: 2.5,
      value: 299,
      specialInstructions: 'Handle with care - fragile items'
    },
    vehicleId: '2',
    driverId: '1',
    estimatedTime: 45,
    status: 'assigned',
    priority: 'high',
    createdAt: '2024-10-17T08:00:00Z',
    scheduledAt: '2024-10-17T09:00:00Z',
    // Legacy support
    pickupLocation: {
      address: '123 Main St, Downtown',
      lat: 40.7128,
      lng: -74.0060
    },
    dropoffLocation: {
      address: '456 Oak Ave, Uptown',
      lat: 40.7589,
      lng: -73.9851
    }
  },
  {
    id: '2',
    pickup: {
      address: '789 Pine St, Midtown',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      scheduledTime: '2024-10-17T14:00:00Z'
    },
    delivery: {
      address: '321 Elm St, Brooklyn',
      coordinates: { lat: 40.6782, lng: -73.9442 },
      scheduledTime: '2024-10-17T15:30:00Z'
    },
    customer: {
      name: 'Bob Davis',
      email: 'bob.davis@email.com',
      phone: '+1-555-0202'
    },
    package: {
      description: 'Office Supplies',
      weight: 5.2,
      value: 150
    },
    vehicleId: '1',
    driverId: '4',
    estimatedTime: 60,
    status: 'assigned',
    priority: 'medium',
    createdAt: '2024-10-17T10:00:00Z',
    scheduledAt: '2024-10-17T14:00:00Z',
    // Legacy support
    pickupLocation: {
      address: '789 Pine St, Midtown',
      lat: 40.7505,
      lng: -73.9934
    },
    dropoffLocation: {
      address: '321 Elm St, Brooklyn',
      lat: 40.6782,
      lng: -73.9442
    }
  },
  {
    id: '5',
    pickup: {
      address: 'Central Park West',
      coordinates: { lat: 40.7829, lng: -73.9654 },
      scheduledTime: '2024-10-17T16:00:00Z'
    },
    delivery: {
      address: 'Times Square',
      coordinates: { lat: 40.7580, lng: -73.9855 },
      scheduledTime: '2024-10-17T17:00:00Z'
    },
    customer: {
      name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      phone: '+1-555-0205'
    },
    package: {
      description: 'Important Documents',
      weight: 0.5,
      value: 1000,
      specialInstructions: 'Urgent delivery - signature required'
    },
    driverId: '4',
    estimatedTime: 25,
    status: 'accepted',
    priority: 'high',
    createdAt: '2024-10-17T15:30:00Z',
    scheduledAt: '2024-10-17T16:00:00Z',
    acceptedAt: '2024-10-17T15:35:00Z'
  },
  {
    id: '3',
    pickup: {
      address: 'Downtown Office Complex',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      scheduledTime: '2024-10-17T15:00:00Z'
    },
    delivery: {
      address: 'Airport Terminal 2',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      scheduledTime: '2024-10-17T16:30:00Z'
    },
    customer: {
      name: 'John Smith',
      email: 'john.smith@fleet.com',
      phone: '+1-555-0101'
    },
    package: {
      description: 'Business Documents',
      weight: 1.0,
      value: 500
    },
    vehicleId: '1',
    driverId: '2',
    estimatedTime: 35,
    status: 'assigned',
    priority: 'high',
    createdAt: '2024-10-17T11:00:00Z',
    scheduledAt: '2024-10-17T15:00:00Z',
    // Legacy support
    pickupLocation: {
      address: 'Downtown Office Complex',
      lat: 40.7128,
      lng: -74.0060
    },
    dropoffLocation: {
      address: 'Airport Terminal 2',
      lat: 40.7589,
      lng: -73.9851
    }
  },
  {
    id: '4',
    pickup: {
      address: 'Shopping Mall',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      scheduledTime: '2024-10-16T16:00:00Z'
    },
    delivery: {
      address: 'Brooklyn Heights',
      coordinates: { lat: 40.6782, lng: -73.9442 },
      scheduledTime: '2024-10-16T17:00:00Z'
    },
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@fleet.com',
      phone: '+1-555-0102'
    },
    package: {
      description: 'Retail Purchase',
      weight: 3.0,
      value: 200
    },
    vehicleId: '3',
    driverId: '1',
    estimatedTime: 25,
    status: 'delivered',
    priority: 'medium',
    createdAt: '2024-10-16T14:00:00Z',
    scheduledAt: '2024-10-16T16:00:00Z',
    completedAt: '2024-10-16T17:15:00Z',
    // Legacy support
    pickupLocation: {
      address: 'Shopping Mall',
      lat: 40.7505,
      lng: -73.9934
    },
    dropoffLocation: {
      address: 'Brooklyn Heights',
      lat: 40.6782,
      lng: -73.9442
    }
  },
  {
    id: '6',
    pickup: {
      address: 'Tech Hub Downtown',
      coordinates: { lat: 40.7410, lng: -74.0014 },
      scheduledTime: '2024-10-17T18:00:00Z'
    },
    delivery: {
      address: 'Residential Complex',
      coordinates: { lat: 40.7282, lng: -73.7949 },
      scheduledTime: '2024-10-17T19:30:00Z'
    },
    customer: {
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1-555-0206'
    },
    package: {
      description: 'Laptop Computer',
      weight: 2.8,
      value: 1200,
      specialInstructions: 'Fragile - Handle with extreme care'
    },
    driverId: '4',
    estimatedTime: 45,
    status: 'in-transit',
    priority: 'high',
    createdAt: '2024-10-17T17:00:00Z',
    scheduledAt: '2024-10-17T18:00:00Z',
    acceptedAt: '2024-10-17T17:05:00Z',
    startedAt: '2024-10-17T17:45:00Z'
  }
]

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
        vehicles: [],
        drivers: [],
        deliveries: [],
  
  // Vehicle actions
  addVehicle: (vehicleData) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    set((state) => ({
      vehicles: [...state.vehicles, newVehicle]
    }))
  },
  
  updateVehicle: (id, updates) => {
    set((state) => ({
      vehicles: state.vehicles.map(vehicle =>
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      )
    }))
  },
  
  deleteVehicle: (id) => {
    set((state) => ({
      vehicles: state.vehicles.filter(vehicle => vehicle.id !== id)
    }))
  },
  
  // Driver actions
  addDriver: (driverData) => {
    const newDriver: Driver = {
      ...driverData,
      id: Date.now().toString(),
      rating: 5.0,
      totalTrips: 0,
      createdAt: new Date().toISOString()
    }
    set((state) => ({
      drivers: [...state.drivers, newDriver]
    }))
  },
  
  updateDriver: (id, updates) => {
    set((state) => ({
      drivers: state.drivers.map(driver =>
        driver.id === id ? { ...driver, ...updates } : driver
      )
    }))
  },
  
  deleteDriver: (id) => {
    set((state) => ({
      drivers: state.drivers.filter(driver => driver.id !== id)
    }))
  },
  
  // Delivery actions
  addDelivery: (deliveryData) => {
    const newDelivery: Delivery = {
      ...deliveryData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    set((state) => ({
      deliveries: [...state.deliveries, newDelivery]
    }))
  },
  
  updateDelivery: (id, updates) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === id ? { ...delivery, ...updates } : delivery
      )
    }))
  },
  
  deleteDelivery: (id) => {
    set((state) => ({
      deliveries: state.deliveries.filter(delivery => delivery.id !== id)
    }))
  },
  
  // Scheduling validation functions
  checkDriverAvailability: (driverId: string, scheduledTime: string, deliveryId?: string) => {
    const { deliveries } = get()
    const scheduledDate = new Date(scheduledTime)
    
    // Check if driver has any conflicting assignments
    const conflicts = deliveries.filter(delivery => {
      if (deliveryId && delivery.id === deliveryId) return false // Exclude current delivery when updating
      if (delivery.driverId !== driverId) return false
      if (!['assigned', 'accepted', 'started', 'in-transit'].includes(delivery.status)) return false
      
      const deliveryStart = new Date(delivery.pickup?.scheduledTime || delivery.scheduledAt || delivery.createdAt)
      const deliveryEnd = new Date(deliveryStart.getTime() + (delivery.estimatedTime || 60) * 60000) // Add estimated time in minutes
      
      // Check for time overlap (with 30 minute buffer)
      const bufferTime = 30 * 60000 // 30 minutes in milliseconds
      const requestStart = new Date(scheduledDate.getTime() - bufferTime)
      const requestEnd = new Date(scheduledDate.getTime() + bufferTime)
      
      return (requestStart < deliveryEnd && requestEnd > deliveryStart)
    })
    
    return {
      available: conflicts.length === 0,
      conflicts: conflicts.map(d => ({
        id: d.id,
        scheduledTime: d.pickup?.scheduledTime || d.scheduledAt,
        estimatedTime: d.estimatedTime,
        customer: d.customer.name
      }))
    }
  },

  checkVehicleAvailability: (vehicleId: string, scheduledTime: string, deliveryId?: string) => {
    const { deliveries } = get()
    const scheduledDate = new Date(scheduledTime)
    
    // Check if vehicle has any conflicting assignments
    const conflicts = deliveries.filter(delivery => {
      if (deliveryId && delivery.id === deliveryId) return false // Exclude current delivery when updating
      if (delivery.vehicleId !== vehicleId) return false
      if (!['assigned', 'accepted', 'started', 'in-transit'].includes(delivery.status)) return false
      
      const deliveryStart = new Date(delivery.pickup?.scheduledTime || delivery.scheduledAt || delivery.createdAt)
      const deliveryEnd = new Date(deliveryStart.getTime() + (delivery.estimatedTime || 60) * 60000)
      
      // Check for time overlap (with 15 minute buffer for vehicle turnaround)
      const bufferTime = 15 * 60000 // 15 minutes in milliseconds
      const requestStart = new Date(scheduledDate.getTime() - bufferTime)
      const requestEnd = new Date(scheduledDate.getTime() + bufferTime)
      
      return (requestStart < deliveryEnd && requestEnd > deliveryStart)
    })
    
    return {
      available: conflicts.length === 0,
      conflicts: conflicts.map(d => ({
        id: d.id,
        scheduledTime: d.pickup?.scheduledTime || d.scheduledAt,
        estimatedTime: d.estimatedTime,
        customer: d.customer.name
      }))
    }
  },

  validateDeliveryScheduling: (deliveryData: Partial<Delivery>, deliveryId?: string) => {
    const { vehicles, drivers } = get()
    const scheduledTime = deliveryData.pickup?.scheduledTime || deliveryData.scheduledAt
    
    if (!scheduledTime) {
      return { valid: false, errors: ['Scheduled time is required'] }
    }

    const errors: string[] = []
    
    // Check driver availability if specified
    if (deliveryData.driverId) {
      const driver = drivers.find(d => d.id === deliveryData.driverId)
      if (!driver) {
        errors.push('Selected driver not found')
      } else if (driver.status === 'offline') {
        errors.push('Selected driver is offline')
      } else {
        const driverCheck = get().checkDriverAvailability(deliveryData.driverId, scheduledTime, deliveryId)
        if (!driverCheck.available) {
          errors.push(`Driver is not available at scheduled time. Conflicts: ${driverCheck.conflicts.length}`)
        }
      }
    }
    
    // Check vehicle availability if specified
    if (deliveryData.vehicleId) {
      const vehicle = vehicles.find(v => v.id === deliveryData.vehicleId)
      if (!vehicle) {
        errors.push('Selected vehicle not found')
      } else if (vehicle.status === 'maintenance') {
        errors.push('Selected vehicle is under maintenance')
      } else {
        const vehicleCheck = get().checkVehicleAvailability(deliveryData.vehicleId, scheduledTime, deliveryId)
        if (!vehicleCheck.available) {
          errors.push(`Vehicle is not available at scheduled time. Conflicts: ${vehicleCheck.conflicts.length}`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Enhanced accept delivery request with scheduling validation
  acceptDeliveryRequest: (deliveryId, driverId, vehicleId) => {
    const { drivers, vehicles, deliveries } = get()
    const delivery = deliveries.find(d => d.id === deliveryId)
    const driver = drivers.find(d => d.id === driverId)
    const vehicle = vehicles.find(v => v.id === vehicleId)
    
    if (!delivery || !driver || !vehicle) {
      console.error('Delivery, driver, or vehicle not found')
      return { success: false, error: 'Invalid delivery, driver, or vehicle' }
    }

    // Validate scheduling
    const validation = get().validateDeliveryScheduling({
      ...delivery,
      driverId,
      vehicleId
    }, deliveryId)

    if (!validation.valid) {
      console.error('Scheduling validation failed:', validation.errors)
      return { success: false, error: validation.errors.join(', ') }
    }
    
    set((state) => ({
      deliveries: state.deliveries.map(d =>
        d.id === deliveryId 
          ? { 
              ...d, 
              status: 'assigned' as const,
              driverId,
              vehicleId,
              driver: {
                name: driver.name,
                phone: driver.phone,
                vehicle: vehicle.vehicleNumber
              }
            }
          : d
      ),
      drivers: state.drivers.map(d =>
        d.id === driverId ? { ...d, status: 'busy' as const, vehicleId } : d
      ),
      vehicles: state.vehicles.map(v =>
        v.id === vehicleId ? { ...v, status: 'in-use' as const, driverId } : v
      )
    }))

    return { success: true }
  },
  
  // Initialize with sample data if empty
  initializeData: () => {
    const { vehicles, drivers, deliveries } = get()
    if (vehicles.length === 0 && drivers.length === 0 && deliveries.length === 0) {
      set({
        vehicles: initialVehicles,
        drivers: initialDrivers,
        deliveries: initialDeliveries
      })
    }
  },

  // Utility functions
  getAvailableVehicles: () => {
    return get().vehicles.filter(vehicle => vehicle.status === 'available')
  },
  
  getAvailableDrivers: () => {
    return get().drivers.filter(driver => driver.status === 'available')
  },
  
  getPendingDeliveries: () => {
    return get().deliveries.filter(delivery => delivery.status === 'pending')
  },

  // Driver-specific delivery actions
  driverAcceptDelivery: (deliveryId, driverId) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === deliveryId && delivery.driverId === driverId
          ? { 
              ...delivery, 
              status: 'accepted' as const,
              acceptedAt: new Date().toISOString()
            }
          : delivery
      )
    }))
  },

  driverRejectDelivery: (deliveryId, driverId, reason) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === deliveryId && delivery.driverId === driverId
          ? { 
              ...delivery, 
              status: 'rejected' as const,
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason
            }
          : delivery
      )
    }))
  },

  startDeliveryRide: (deliveryId, driverId) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === deliveryId && delivery.driverId === driverId
          ? { 
              ...delivery, 
              status: 'started' as const,
              startedAt: new Date().toISOString()
            }
          : delivery
      )
    }))
  },

  markDeliveryInTransit: (deliveryId, driverId) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === deliveryId && delivery.driverId === driverId
          ? { 
              ...delivery, 
              status: 'in-transit' as const
            }
          : delivery
      )
    }))
  },

  markDeliveryArrived: (deliveryId, driverId) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === deliveryId && delivery.driverId === driverId
          ? { 
              ...delivery, 
              status: 'arrived' as const
            }
          : delivery
      )
    }))
  },

  completeDelivery: (deliveryId, driverId, completionNotes) => {
    set((state) => ({
      deliveries: state.deliveries.map(delivery =>
        delivery.id === deliveryId && delivery.driverId === driverId
          ? { 
              ...delivery, 
              status: 'delivered' as const,
              completedAt: new Date().toISOString(),
              completionNotes
            }
          : delivery
      ),
      drivers: state.drivers.map(driver =>
        driver.id === driverId 
          ? { ...driver, totalTrips: driver.totalTrips + 1 }
          : driver
      )
    }))
  },

  getDriverDeliveries: (driverId) => {
    return get().deliveries.filter(delivery => delivery.driverId === driverId)
  },

  getDeliveryStats: (driverId) => {
    const deliveries = driverId 
      ? get().deliveries.filter(d => d.driverId === driverId)
      : get().deliveries
    
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending' || d.status === 'assigned').length,
      accepted: deliveries.filter(d => d.status === 'accepted').length,
      started: deliveries.filter(d => d.status === 'started').length,
      inTransit: deliveries.filter(d => d.status === 'in-transit').length,
      arrived: deliveries.filter(d => d.status === 'arrived').length,
      completed: deliveries.filter(d => d.status === 'delivered').length,
      rejected: deliveries.filter(d => d.status === 'rejected').length
    }
  }
}),
{
  name: 'fleet-admin-storage',
  version: 1,
}
)
)
