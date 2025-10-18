export interface Vehicle {
  id: string
  vehicleNumber: string
  type: 'truck' | 'van' | 'motorcycle' | 'car'
  capacity: number
  status: 'available' | 'in-use' | 'maintenance'
  driverId?: string
  createdAt: string
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  status: 'available' | 'busy' | 'offline'
  vehicleId?: string
  rating: number
  totalTrips: number
  createdAt: string
}

export interface Delivery {
  id: string
  pickup: {
    address: string
    coordinates: { lat: number; lng: number }
    scheduledTime?: string
  }
  delivery: {
    address: string
    coordinates: { lat: number; lng: number }
    scheduledTime?: string
  }
  customer: {
    name: string
    email: string
    phone: string
  }
  package: {
    description: string
    weight: number
    value?: number
    specialInstructions?: string
  }
  vehicleId?: string
  driverId?: string
  driver?: {
    name: string
    phone: string
    vehicle: string
  }
  estimatedTime?: number // in minutes
  estimatedDelivery?: string
  status: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'started' | 'in-transit' | 'arrived' | 'delivered' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
  scheduledAt?: string
  
  // Driver action timestamps
  acceptedAt?: string
  rejectedAt?: string
  startedAt?: string
  completedAt?: string
  
  // Additional fields for driver actions
  rejectionReason?: string
  completionNotes?: string
  
  // Legacy support for existing components
  pickupLocation?: {
    address: string
    lat: number
    lng: number
  }
  dropoffLocation?: {
    address: string
    lat: number
    lng: number
  }
}
