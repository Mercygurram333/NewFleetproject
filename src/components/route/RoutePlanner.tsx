import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Clock, Route, Zap, AlertCircle, CheckCircle, Truck, Package } from 'lucide-react'
import type { Delivery, Driver } from '../../types'

interface RouteStop {
  id: string
  type: 'pickup' | 'delivery'
  deliveryId: string
  address: string
  coordinates: { lat: number; lng: number }
  estimatedTime: number
  priority: 'low' | 'medium' | 'high'
  customerName: string
  packageDescription: string
}

interface OptimizedRoute {
  driverId: string
  stops: RouteStop[]
  totalDistance: number
  totalTime: number
  estimatedFuel: number
  efficiency: number
}

interface RoutePlannerProps {
  deliveries: Delivery[]
  drivers: Driver[]
  onRouteOptimized?: (routes: OptimizedRoute[]) => void
  className?: string
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({
  deliveries,
  drivers,
  onRouteOptimized,
  className = ''
}) => {
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [routePreferences, setRoutePreferences] = useState({
    prioritizeTime: true,
    prioritizeDistance: false,
    prioritizePriority: true,
    maxStopsPerRoute: 8,
    maxRouteTime: 480 // 8 hours in minutes
  })

  // Convert deliveries to route stops
  const convertDeliveriesToStops = (deliveries: Delivery[]): RouteStop[] => {
    const stops: RouteStop[] = []
    
    deliveries.forEach(delivery => {
      // Add pickup stop
      if (delivery.pickup) {
        stops.push({
          id: `${delivery.id}-pickup`,
          type: 'pickup',
          deliveryId: delivery.id,
          address: delivery.pickup.address,
          coordinates: delivery.pickup.coordinates,
          estimatedTime: 15, // 15 minutes for pickup
          priority: delivery.priority || 'medium',
          customerName: delivery.customer.name,
          packageDescription: delivery.package?.description || 'Package'
        })
      }

      // Add delivery stop
      if (delivery.delivery) {
        stops.push({
          id: `${delivery.id}-delivery`,
          type: 'delivery',
          deliveryId: delivery.id,
          address: delivery.delivery.address,
          coordinates: delivery.delivery.coordinates,
          estimatedTime: 10, // 10 minutes for delivery
          priority: delivery.priority || 'medium',
          customerName: delivery.customer.name,
          packageDescription: delivery.package?.description || 'Package'
        })
      }
    })

    return stops
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Optimize route using nearest neighbor with priority weighting
  const optimizeRoute = (stops: RouteStop[], startLocation: { lat: number; lng: number }): RouteStop[] => {
    if (stops.length === 0) return []

    const optimized: RouteStop[] = []
    const remaining = [...stops]
    let currentLocation = startLocation

    // Prioritize pickups first, then deliveries
    const pickups = remaining.filter(stop => stop.type === 'pickup')
    const deliveries = remaining.filter(stop => stop.type === 'delivery')

    // Process pickups first
    while (pickups.length > 0) {
      let bestIndex = 0
      let bestScore = Infinity

      pickups.forEach((stop, index) => {
        const distance = calculateDistance(currentLocation, stop.coordinates)
        const priorityWeight = stop.priority === 'high' ? 0.5 : stop.priority === 'medium' ? 1 : 1.5
        const score = distance * priorityWeight

        if (score < bestScore) {
          bestScore = score
          bestIndex = index
        }
      })

      const nextStop = pickups.splice(bestIndex, 1)[0]
      optimized.push(nextStop)
      currentLocation = nextStop.coordinates
    }

    // Then process deliveries
    while (deliveries.length > 0) {
      let bestIndex = 0
      let bestScore = Infinity

      deliveries.forEach((stop, index) => {
        const distance = calculateDistance(currentLocation, stop.coordinates)
        const priorityWeight = stop.priority === 'high' ? 0.5 : stop.priority === 'medium' ? 1 : 1.5
        const score = distance * priorityWeight

        if (score < bestScore) {
          bestScore = score
          bestIndex = index
        }
      })

      const nextStop = deliveries.splice(bestIndex, 1)[0]
      optimized.push(nextStop)
      currentLocation = nextStop.coordinates
    }

    return optimized
  }

  // Calculate route metrics
  const calculateRouteMetrics = (stops: RouteStop[], startLocation: { lat: number; lng: number }) => {
    let totalDistance = 0
    let totalTime = 0
    let currentLocation = startLocation

    stops.forEach(stop => {
      const distance = calculateDistance(currentLocation, stop.coordinates)
      totalDistance += distance
      totalTime += (distance / 40) * 60 + stop.estimatedTime // Assuming 40 km/h average speed
      currentLocation = stop.coordinates
    })

    const estimatedFuel = totalDistance * 0.08 // 8L per 100km
    const efficiency = stops.length > 0 ? (stops.length / totalTime) * 60 : 0 // Stops per hour

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime: Math.round(totalTime),
      estimatedFuel: Math.round(estimatedFuel * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100
    }
  }

  // Optimize routes for all drivers
  const optimizeAllRoutes = async () => {
    setIsOptimizing(true)

    try {
      // Filter deliveries that need routing (pending, assigned, accepted)
      const routeableDeliveries = deliveries.filter(d => 
        ['pending', 'assigned', 'accepted'].includes(d.status)
      )

      const stops = convertDeliveriesToStops(routeableDeliveries)
      const availableDrivers = drivers.filter(d => d.status === 'available')

      if (stops.length === 0 || availableDrivers.length === 0) {
        setOptimizedRoutes([])
        return
      }

      const routes: OptimizedRoute[] = []

      // Distribute stops among available drivers
      const stopsPerDriver = Math.ceil(stops.length / availableDrivers.length)

      for (let i = 0; i < availableDrivers.length; i++) {
        const driver = availableDrivers[i]
        const driverStops = stops.slice(i * stopsPerDriver, (i + 1) * stopsPerDriver)

        if (driverStops.length === 0) continue

        // Use driver's current location or default to NYC
        const startLocation = { lat: 40.7128, lng: -74.0060 }
        const optimizedStops = optimizeRoute(driverStops, startLocation)
        const metrics = calculateRouteMetrics(optimizedStops, startLocation)

        routes.push({
          driverId: driver.id,
          stops: optimizedStops,
          ...metrics
        })
      }

      setOptimizedRoutes(routes)
      onRouteOptimized?.(routes)

    } catch (error) {
      console.error('Error optimizing routes:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  useEffect(() => {
    if (deliveries.length > 0 && drivers.length > 0) {
      optimizeAllRoutes()
    }
  }, [deliveries, drivers, routePreferences])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 3) return 'text-green-600 bg-green-100'
    if (efficiency >= 2) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const filteredRoutes = selectedDriver === 'all' 
    ? optimizedRoutes 
    : optimizedRoutes.filter(route => route.driverId === selectedDriver)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Route className="h-6 w-6 text-blue-600 mr-2" />
            Route Optimization
          </h2>
          <p className="text-gray-600 mt-1">Optimize delivery routes for maximum efficiency</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Drivers</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </select>
          <button
            onClick={optimizeAllRoutes}
            disabled={isOptimizing}
            className="btn-gradient px-4 py-2 text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Re-optimize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Route Preferences */}
      <div className="card-elevated p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimization Preferences</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={routePreferences.prioritizeTime}
              onChange={(e) => setRoutePreferences(prev => ({ ...prev, prioritizeTime: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Prioritize Time</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={routePreferences.prioritizeDistance}
              onChange={(e) => setRoutePreferences(prev => ({ ...prev, prioritizeDistance: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Prioritize Distance</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={routePreferences.prioritizePriority}
              onChange={(e) => setRoutePreferences(prev => ({ ...prev, prioritizePriority: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Prioritize High Priority</span>
          </label>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Max Stops:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={routePreferences.maxStopsPerRoute}
              onChange={(e) => setRoutePreferences(prev => ({ ...prev, maxStopsPerRoute: parseInt(e.target.value) }))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Route Summary */}
      {optimizedRoutes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stats-card bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500">
            <div className="stats-icon bg-blue-500">
              <Route className="h-5 w-5 text-white" />
            </div>
            <div className="stats-value text-blue-700">{optimizedRoutes.length}</div>
            <div className="stats-label text-blue-600">Optimized Routes</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
            <div className="stats-icon bg-green-500">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="stats-value text-green-700">
              {optimizedRoutes.reduce((sum, route) => sum + route.stops.length, 0)}
            </div>
            <div className="stats-label text-green-600">Total Stops</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-purple-50 to-violet-50 border-l-4 border-purple-500">
            <div className="stats-icon bg-purple-500">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="stats-value text-purple-700">
              {Math.round(optimizedRoutes.reduce((sum, route) => sum + route.totalTime, 0) / 60)}h
            </div>
            <div className="stats-label text-purple-600">Total Time</div>
          </div>
          <div className="stats-card bg-gradient-to-br from-yellow-50 to-amber-50 border-l-4 border-yellow-500">
            <div className="stats-icon bg-yellow-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="stats-value text-yellow-700">
              {Math.round(optimizedRoutes.reduce((sum, route) => sum + route.efficiency, 0) / optimizedRoutes.length * 100) / 100}
            </div>
            <div className="stats-label text-yellow-600">Avg Efficiency</div>
          </div>
        </div>
      )}

      {/* Optimized Routes */}
      <div className="space-y-4">
        {filteredRoutes.map((route, index) => {
          const driver = drivers.find(d => d.id === route.driverId)
          
          return (
            <div key={route.driverId} className="card-elevated animate-slide-up">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        {driver?.name || `Driver ${route.driverId}`}
                      </h3>
                      <p className="text-sm text-blue-700">{route.stops.length} stops planned</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{route.totalDistance}km</p>
                      <p className="text-gray-600">Distance</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{Math.round(route.totalTime / 60)}h {route.totalTime % 60}m</p>
                      <p className="text-gray-600">Time</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{route.estimatedFuel}L</p>
                      <p className="text-gray-600">Fuel</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(route.efficiency)}`}>
                      {route.efficiency} stops/h
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {route.stops.map((stop, stopIndex) => (
                    <div key={stop.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {stopIndex + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            stop.type === 'pickup' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {stop.type === 'pickup' ? 'Pickup' : 'Delivery'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(stop.priority)}`}>
                            {stop.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">{stop.customerName}</p>
                        <p className="text-sm text-gray-600">{stop.address}</p>
                        <p className="text-xs text-gray-500">{stop.packageDescription}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{stop.estimatedTime}min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {optimizedRoutes.length === 0 && !isOptimizing && (
        <div className="card-elevated p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Route className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Routes to Optimize</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            There are no pending deliveries or available drivers to create optimized routes.
          </p>
        </div>
      )}
    </div>
  )
}

export default RoutePlanner
