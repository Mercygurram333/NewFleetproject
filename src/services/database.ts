// Database Service for Fleet Management System
// This simulates a real database connection and provides CRUD operations

import type { Vehicle, Driver, Delivery } from '../types'

// Simulated database storage
class DatabaseService {
  private baseUrl = 'http://localhost:3001/api' // Backend API URL
  private isOnline = false

  constructor() {
    this.checkConnection()
  }

  // Check if backend is available
  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      this.isOnline = response.ok
    } catch (error) {
      this.isOnline = false
      console.warn('Database service offline, using local storage fallback')
    }
  }

  // Generic API request method
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isOnline) {
      throw new Error('Database service is offline')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    try {
      return await this.apiRequest<Vehicle[]>('/vehicles')
    } catch (error) {
      console.warn('Falling back to localStorage for vehicles')
      const stored = localStorage.getItem('fleet-vehicles')
      return stored ? JSON.parse(stored) : []
    }
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    try {
      return await this.apiRequest<Vehicle>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicle)
      })
    } catch (error) {
      console.warn('Falling back to localStorage for vehicle creation')
      const newVehicle: Vehicle = {
        ...vehicle,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      const vehicles = await this.getVehicles()
      vehicles.push(newVehicle)
      localStorage.setItem('fleet-vehicles', JSON.stringify(vehicles))
      return newVehicle
    }
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      return await this.apiRequest<Vehicle>(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.warn('Falling back to localStorage for vehicle update')
      const vehicles = await this.getVehicles()
      const index = vehicles.findIndex(v => v.id === id)
      if (index !== -1) {
        vehicles[index] = { ...vehicles[index], ...updates }
        localStorage.setItem('fleet-vehicles', JSON.stringify(vehicles))
        return vehicles[index]
      }
      throw new Error('Vehicle not found')
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    try {
      await this.apiRequest(`/vehicles/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.warn('Falling back to localStorage for vehicle deletion')
      const vehicles = await this.getVehicles()
      const filtered = vehicles.filter(v => v.id !== id)
      localStorage.setItem('fleet-vehicles', JSON.stringify(filtered))
    }
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    try {
      return await this.apiRequest<Driver[]>('/drivers')
    } catch (error) {
      console.warn('Falling back to localStorage for drivers')
      const stored = localStorage.getItem('fleet-drivers')
      return stored ? JSON.parse(stored) : []
    }
  }

  async createDriver(driver: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> {
    try {
      return await this.apiRequest<Driver>('/drivers', {
        method: 'POST',
        body: JSON.stringify(driver)
      })
    } catch (error) {
      console.warn('Falling back to localStorage for driver creation')
      const newDriver: Driver = {
        ...driver,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      const drivers = await this.getDrivers()
      drivers.push(newDriver)
      localStorage.setItem('fleet-drivers', JSON.stringify(drivers))
      return newDriver
    }
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    try {
      return await this.apiRequest<Driver>(`/drivers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.warn('Falling back to localStorage for driver update')
      const drivers = await this.getDrivers()
      const index = drivers.findIndex(d => d.id === id)
      if (index !== -1) {
        drivers[index] = { ...drivers[index], ...updates }
        localStorage.setItem('fleet-drivers', JSON.stringify(drivers))
        return drivers[index]
      }
      throw new Error('Driver not found')
    }
  }

  // Delivery operations
  async getDeliveries(): Promise<Delivery[]> {
    try {
      return await this.apiRequest<Delivery[]>('/deliveries')
    } catch (error) {
      console.warn('Falling back to localStorage for deliveries')
      const stored = localStorage.getItem('fleet-deliveries')
      return stored ? JSON.parse(stored) : []
    }
  }

  async createDelivery(delivery: Omit<Delivery, 'id' | 'createdAt'>): Promise<Delivery> {
    try {
      return await this.apiRequest<Delivery>('/deliveries', {
        method: 'POST',
        body: JSON.stringify(delivery)
      })
    } catch (error) {
      console.warn('Falling back to localStorage for delivery creation')
      const newDelivery: Delivery = {
        ...delivery,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      const deliveries = await this.getDeliveries()
      deliveries.push(newDelivery)
      localStorage.setItem('fleet-deliveries', JSON.stringify(deliveries))
      return newDelivery
    }
  }

  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<Delivery> {
    try {
      return await this.apiRequest<Delivery>(`/deliveries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.warn('Falling back to localStorage for delivery update')
      const deliveries = await this.getDeliveries()
      const index = deliveries.findIndex(d => d.id === id)
      if (index !== -1) {
        deliveries[index] = { ...deliveries[index], ...updates }
        localStorage.setItem('fleet-deliveries', JSON.stringify(deliveries))
        return deliveries[index]
      }
      throw new Error('Delivery not found')
    }
  }

  // Real-time operations
  async saveDriverLocation(driverId: string, location: { lat: number; lng: number }): Promise<void> {
    try {
      await this.apiRequest('/driver-locations', {
        method: 'POST',
        body: JSON.stringify({
          driverId,
          ...location,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.warn('Falling back to localStorage for driver location')
      const locations = JSON.parse(localStorage.getItem('driver-locations') || '{}')
      locations[driverId] = {
        ...location,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('driver-locations', JSON.stringify(locations))
    }
  }

  async getDriverLocations(): Promise<Record<string, { lat: number; lng: number; timestamp: string }>> {
    try {
      return await this.apiRequest<Record<string, { lat: number; lng: number; timestamp: string }>>('/driver-locations')
    } catch (error) {
      console.warn('Falling back to localStorage for driver locations')
      return JSON.parse(localStorage.getItem('driver-locations') || '{}')
    }
  }

  // Analytics operations
  async getDeliveryStats(driverId?: string): Promise<any> {
    try {
      const endpoint = driverId ? `/analytics/driver/${driverId}` : '/analytics/overview'
      return await this.apiRequest(endpoint)
    } catch (error) {
      console.warn('Falling back to local calculation for stats')
      const deliveries = await this.getDeliveries()
      const filtered = driverId ? deliveries.filter(d => d.driverId === driverId) : deliveries
      
      return {
        total: filtered.length,
        pending: filtered.filter(d => d.status === 'pending' || d.status === 'assigned').length,
        accepted: filtered.filter(d => d.status === 'accepted').length,
        inTransit: filtered.filter(d => d.status === 'in-transit').length,
        completed: filtered.filter(d => d.status === 'delivered').length,
        rejected: filtered.filter(d => d.status === 'rejected').length
      }
    }
  }

  // Sync operations
  async syncToServer(): Promise<void> {
    if (!this.isOnline) return

    try {
      // Sync vehicles
      const vehicles = JSON.parse(localStorage.getItem('fleet-vehicles') || '[]')
      if (vehicles.length > 0) {
        await this.apiRequest('/sync/vehicles', {
          method: 'POST',
          body: JSON.stringify(vehicles)
        })
      }

      // Sync drivers
      const drivers = JSON.parse(localStorage.getItem('fleet-drivers') || '[]')
      if (drivers.length > 0) {
        await this.apiRequest('/sync/drivers', {
          method: 'POST',
          body: JSON.stringify(drivers)
        })
      }

      // Sync deliveries
      const deliveries = JSON.parse(localStorage.getItem('fleet-deliveries') || '[]')
      if (deliveries.length > 0) {
        await this.apiRequest('/sync/deliveries', {
          method: 'POST',
          body: JSON.stringify(deliveries)
        })
      }

      console.log('Data synced to server successfully')
    } catch (error) {
      console.error('Failed to sync data to server:', error)
    }
  }

  async loadFromServer(): Promise<void> {
    if (!this.isOnline) return

    try {
      const [vehicles, drivers, deliveries] = await Promise.all([
        this.getVehicles(),
        this.getDrivers(),
        this.getDeliveries()
      ])

      localStorage.setItem('fleet-vehicles', JSON.stringify(vehicles))
      localStorage.setItem('fleet-drivers', JSON.stringify(drivers))
      localStorage.setItem('fleet-deliveries', JSON.stringify(deliveries))

      console.log('Data loaded from server successfully')
    } catch (error) {
      console.error('Failed to load data from server:', error)
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.isOnline
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()
export default databaseService
