import React, { useEffect, useState } from 'react'
import { 
  MapPin, Clock, CheckCircle, AlertCircle, Navigation, Truck, BarChart3, Bell, Filter, Calendar, Package,
  Play, Square, History, Award, Star, TrendingUp, Route, Timer, Target, Zap, Trophy, Medal,
  ChevronRight, RefreshCw, Eye, Phone, MessageSquare, Flag, CheckCircle2, XCircle, Pause
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAdminStore } from '../store/adminStore'
import { useRealtimeStore } from '../store/realtimeStore'
import UniversalMap from '../components/maps/UniversalMap'
import DriverAnalytics from '../components/driver/DriverAnalytics'
import DeliveryCard from '../components/driver/DeliveryCard'
import DeliveryTrackingMap from '../components/DeliveryTrackingMap'
import type { Delivery } from '../types'

type TabType = 'overview' | 'deliveries' | 'map' | 'history' | 'performance'

// Enhanced Delivery Card Component
const EnhancedDeliveryCard: React.FC<{
  delivery: Delivery
  driverId: string
  onViewMap: (delivery: Delivery) => void
  onStartRide: (deliveryId: string) => void
  onEndRide: (deliveryId: string) => void
  onMarkInTransit: (deliveryId: string) => void
  onMarkArrived: (deliveryId: string) => void
}> = ({ delivery, driverId, onViewMap, onStartRide, onEndRide, onMarkInTransit, onMarkArrived }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'started': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'in-transit': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'arrived': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionButtons = () => {
    switch (delivery.status) {
      case 'assigned':
      case 'accepted':
        return (
          <button
            onClick={() => onStartRide(delivery.id)}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Play className="h-4 w-4" />
            <span>Start Ride</span>
          </button>
        )
      case 'started':
        return (
          <button
            onClick={() => onMarkInTransit(delivery.id)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Navigation className="h-4 w-4" />
            <span>In Transit</span>
          </button>
        )
      case 'in-transit':
        return (
          <button
            onClick={() => onMarkArrived(delivery.id)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <Flag className="h-4 w-4" />
            <span>Mark Arrived</span>
          </button>
        )
      case 'arrived':
        return (
          <button
            onClick={() => onEndRide(delivery.id)}
            className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete</span>
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="font-semibold text-gray-900">{delivery.customer.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
              {delivery.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <MapPin className="h-4 w-4 inline mr-1" />
            {delivery.delivery.address}
          </p>
          {delivery.estimatedTime && (
            <p className="text-sm text-gray-500">
              <Timer className="h-4 w-4 inline mr-1" />
              Est. {delivery.estimatedTime} minutes
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => onViewMap(delivery)}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </button>
          {getActionButtons()}
        </div>
      </div>
      
      {delivery.package.specialInstructions && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            {delivery.package.specialInstructions}
          </p>
        </div>
      )}
    </div>
  )
}

const DriverDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const { getDriverDeliveries, drivers, getDeliveryStats, initializeData } = useAdminStore()
  const { startLocationTracking, stopLocationTracking, currentUserLocation, driverLocations, initializeSocket } = useRealtimeStore()
  const [isTracking, setIsTracking] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(true)

  // Get current driver
  let currentDriver = drivers.find(d => d.email === user?.email)
  
  // If driver not found, create one for the current user
  const { addDriver } = useAdminStore()
  
  useEffect(() => {
    if (user?.email && !currentDriver) {
      const newDriver = {
        name: user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: user.email,
        phone: '+1-555-0100',
        licenseNumber: 'DL' + Date.now().toString().slice(-8),
        status: 'available' as const,
        rating: 5.0,
        totalTrips: 0
      }
      addDriver(newDriver)
    }
  }, [user?.email, currentDriver, addDriver])
  
  // Re-fetch driver after potential creation
  currentDriver = drivers.find(d => d.email === user?.email)
  
  const driverDeliveries = currentDriver ? getDriverDeliveries(currentDriver.id) : []
  const stats = currentDriver ? getDeliveryStats(currentDriver.id) : null

  // Enhanced delivery actions
  const { 
    driverAcceptDelivery, 
    driverRejectDelivery, 
    startDeliveryRide, 
    markDeliveryInTransit, 
    markDeliveryArrived, 
    completeDelivery 
  } = useAdminStore()

  // Performance calculation
  const calculatePerformance = () => {
    if (!currentDriver || !stats) return { score: 0, badges: [] }
    
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    const onTimeRate = 85 // Mock data - would be calculated from actual delivery times
    const customerRating = currentDriver.rating
    
    const score = Math.round((completionRate * 0.4 + onTimeRate * 0.3 + customerRating * 20 * 0.3))
    
    const badges = []
    if (completionRate >= 95) badges.push({ name: 'Reliable', icon: Trophy, color: 'gold' })
    if (stats.completed >= 50) badges.push({ name: 'Experienced', icon: Award, color: 'blue' })
    if (customerRating >= 4.8) badges.push({ name: 'Top Rated', icon: Star, color: 'yellow' })
    if (onTimeRate >= 90) badges.push({ name: 'Punctual', icon: Timer, color: 'green' })
    
    return { score, badges, completionRate, onTimeRate }
  }

  const performance = calculatePerformance()

  // Get active delivery (started or in-transit)
  const activeDelivery = driverDeliveries.find(d => 
    ['started', 'in-transit'].includes(d.status) && 
    (!activeDeliveryId || d.id === activeDeliveryId)
  )

  // Enhanced delivery status handling
  const handleStartRide = (deliveryId: string) => {
    if (!currentDriver) return
    startDeliveryRide(deliveryId, currentDriver.id)
    setActiveDeliveryId(deliveryId)
    setSelectedDelivery(driverDeliveries.find(d => d.id === deliveryId) || null)
    setActiveTab('map')
  }

  const handleEndRide = (deliveryId: string) => {
    if (!currentDriver) return
    completeDelivery(deliveryId, currentDriver.id, 'Delivery completed successfully')
    setActiveDeliveryId(null)
  }

  const handleMarkInTransit = (deliveryId: string) => {
    if (!currentDriver) return
    markDeliveryInTransit(deliveryId, currentDriver.id)
  }

  const handleMarkArrived = (deliveryId: string) => {
    if (!currentDriver) return
    markDeliveryArrived(deliveryId, currentDriver.id)
  }

  // Filter deliveries by status
  const filteredDeliveries = filterStatus === 'all' 
    ? driverDeliveries 
    : driverDeliveries.filter(d => {
        if (filterStatus === 'pending') return d.status === 'pending' || d.status === 'assigned'
        return d.status === filterStatus
      })

  const pendingDeliveries = driverDeliveries.filter(d => d.status === 'pending' || d.status === 'assigned')
  const acceptedDeliveries = driverDeliveries.filter(d => d.status === 'accepted')
  const startedDeliveries = driverDeliveries.filter(d => d.status === 'started')
  const inTransitDeliveries = driverDeliveries.filter(d => d.status === 'in-transit')
  const arrivedDeliveries = driverDeliveries.filter(d => d.status === 'arrived')
  const completedDeliveries = driverDeliveries.filter(d => d.status === 'delivered')
  const rejectedDeliveries = driverDeliveries.filter(d => d.status === 'rejected')

  useEffect(() => {
    // Initialize data if empty
    initializeData()
  }, [initializeData])

  useEffect(() => {
    // Initialize socket connection
    initializeSocket()
  }, [initializeSocket])
    
  useEffect(() => {
    // Start location tracking when driver is available
    if (currentDriver && !isTracking) {
      console.log(`🚀 Starting location tracking for driver ${currentDriver.id}`)
      startLocationTracking(currentDriver.id)
      setIsTracking(true)
    }

    return () => {
      if (isTracking) {
        console.log('🛑 Stopping location tracking')
        stopLocationTracking()
        setIsTracking(false)
      }
    }
  }, [currentDriver, startLocationTracking, stopLocationTracking, isTracking])

  const handleToggleTracking = () => {
    if (!currentDriver) return
    
    if (isTracking) {
      stopLocationTracking()
      setIsTracking(false)
    } else {
      startLocationTracking(currentDriver.id)
      setIsTracking(true)
    }
  }

  const handleViewOnMap = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setActiveTab('map')
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'deliveries' as TabType, label: 'My Deliveries', icon: Truck, badge: pendingDeliveries.length },
    { id: 'map' as TabType, label: 'Live Tracking', icon: MapPin, badge: activeDelivery ? 1 : 0 },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'performance' as TabType, label: 'Performance', icon: Award, badge: performance.badges.length }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Deliveries', count: driverDeliveries.length },
    { value: 'pending', label: 'Pending', count: pendingDeliveries.length },
    { value: 'accepted', label: 'Accepted', count: acceptedDeliveries.length },
    { value: 'started', label: 'Started', count: startedDeliveries.length },
    { value: 'in-transit', label: 'In Transit', count: inTransitDeliveries.length },
    { value: 'arrived', label: 'Arrived', count: arrivedDeliveries.length },
    { value: 'delivered', label: 'Completed', count: completedDeliveries.length },
    { value: 'rejected', label: 'Rejected', count: rejectedDeliveries.length }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${performance.completionRate || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{(performance.completionRate || 0).toFixed(1)}% completion rate</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                </div>
                {pendingDeliveries.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-yellow-600">Action required</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Navigation className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{stats?.inTransit || 0}</p>
                    <p className="text-sm text-gray-500">In Transit</p>
                  </div>
                </div>
                {activeDelivery && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-blue-600">Active delivery</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{currentDriver?.rating?.toFixed(1) || '5.0'}</p>
                    <p className="text-sm text-gray-500">Rating</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= (currentDriver?.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Badges */}
            {performance.badges.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Performance Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  {performance.badges.map((badge, index) => {
                    const Icon = badge.icon
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                          badge.color === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                          badge.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          badge.color === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{badge.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Active Delivery Alert */}
            {activeDelivery && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-600" />
                    Active Delivery
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {activeDelivery.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-medium text-gray-900">{activeDelivery.customer.name}</p>
                    <p className="text-sm text-gray-600 mt-2 mb-1">Destination</p>
                    <p className="font-medium text-gray-900">{activeDelivery.delivery.address}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleViewOnMap(activeDelivery)}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>View on Map</span>
                    </button>
                    {activeDelivery.status === 'started' && (
                      <button
                        onClick={() => handleMarkInTransit(activeDelivery.id)}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Navigation className="h-4 w-4" />
                        <span>Mark In Transit</span>
                      </button>
                    )}
                    {activeDelivery.status === 'in-transit' && (
                      <button
                        onClick={() => handleMarkArrived(activeDelivery.id)}
                        className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Flag className="h-4 w-4" />
                        <span>Mark Arrived</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Deliveries */}
            {driverDeliveries.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Deliveries</h3>
                  <button
                    onClick={() => setActiveTab('deliveries')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {driverDeliveries.slice(0, 3).map(delivery => (
                    <EnhancedDeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      driverId={currentDriver?.id || ''}
                      onViewMap={handleViewOnMap}
                      onStartRide={handleStartRide}
                      onEndRide={handleEndRide}
                      onMarkInTransit={handleMarkInTransit}
                      onMarkArrived={handleMarkArrived}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No deliveries state */}
            {driverDeliveries.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Deliveries Assigned</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                  You don't have any deliveries assigned at the moment. Check back later or contact your dispatcher.
                </p>
                <div className="mt-8">
                  <div className="inline-flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Ready for assignments</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        
      case 'deliveries':
        return (
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="card-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900">My Deliveries</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.count})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleToggleTracking}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isTracking 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Deliveries List */}
            <div className="space-y-4">
              {filteredDeliveries.map(delivery => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  driverId={currentDriver?.id || ''}
                  onViewMap={handleViewOnMap}
                />
              ))}
            </div>

            {filteredDeliveries.length === 0 && (
              <div className="card-elevated p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No deliveries found</h4>
                <p className="text-gray-600">No deliveries match the selected filter.</p>
              </div>
            )}
          </div>
        )
        
      case 'map':
        return (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full mr-3"></div>
                  Live Delivery Tracking
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Tracking {isTracking ? 'Active' : 'Inactive'}</span>
                  </span>
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
                    <Navigation className="h-4 w-4" />
                    <span>{driverDeliveries.length} Deliveries</span>
                  </div>
                  {startedDeliveries.length > 0 && (
                    <div className="flex items-center space-x-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span>{startedDeliveries.length} Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleToggleTracking}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                    isTracking 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
                </button>

                {startedDeliveries.length > 0 && (
                  <button
                    onClick={() => setSelectedDelivery(startedDeliveries[0])}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-200 transition-colors duration-200"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Focus Active Delivery</span>
                  </button>
                )}

                {currentUserLocation && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {currentUserLocation.lat.toFixed(4)}, {currentUserLocation.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Tracking Map */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="h-[600px]">
                <DeliveryTrackingMap 
                  hasActiveDelivery={startedDeliveries.length > 0}
                  onDriverPositionUpdate={(position) => {
                    // Update driver position in real-time store if needed
                    console.log('Driver position updated:', position)
                  }}
                />
              </div>
            </div>

            {/* Active Delivery Details */}
            {activeDelivery && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-600" />
                    Active Delivery Details
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {activeDelivery.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-medium text-gray-900">{activeDelivery.customer.name}</p>
                    <p className="text-sm text-gray-600 mt-3 mb-1">Pickup Location</p>
                    <p className="font-medium text-gray-900">{activeDelivery.pickup.address}</p>
                    <p className="text-sm text-gray-600 mt-3 mb-1">Delivery Address</p>
                    <p className="font-medium text-gray-900">{activeDelivery.delivery.address}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {activeDelivery.status === 'started' && (
                      <button
                        onClick={() => handleMarkInTransit(activeDelivery.id)}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Navigation className="h-5 w-5" />
                        <span>Mark In Transit</span>
                      </button>
                    )}
                    {activeDelivery.status === 'in-transit' && (
                      <button
                        onClick={() => handleMarkArrived(activeDelivery.id)}
                        className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Flag className="h-5 w-5" />
                        <span>Mark Arrived</span>
                      </button>
                    )}
                    {activeDelivery.status === 'arrived' && (
                      <button
                        onClick={() => handleEndRide(activeDelivery.id)}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Complete Delivery</span>
                      </button>
                    )}
                    {activeDelivery.package.specialInstructions && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          {activeDelivery.package.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'history':
        return (
          <div className="space-y-6">
            {/* History Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <History className="h-5 w-5 mr-2 text-blue-600" />
                Delivery History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
                  <p className="text-sm text-gray-600">Total Completed</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{(performance.completionRate || 0).toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">Completed Deliveries</h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {completedDeliveries.slice(0, 10).map(delivery => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{delivery.customer.name}</h5>
                        <p className="text-sm text-gray-600">{delivery.delivery.address}</p>
                        <p className="text-xs text-gray-500">
                          Completed: {delivery.completedAt ? new Date(delivery.completedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Delivered
                        </span>
                        <button
                          onClick={() => handleViewOnMap(delivery)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {completedDeliveries.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed deliveries yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'performance':
        return (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                Performance Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">{performance.score}</span>
                  </div>
                  <p className="font-medium text-gray-900">Performance Score</p>
                  <p className="text-sm text-gray-500">Out of 100</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-white">{(performance.completionRate || 0).toFixed(0)}%</span>
                  </div>
                  <p className="font-medium text-gray-900">Completion Rate</p>
                  <p className="text-sm text-gray-500">Deliveries completed</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-white">{performance.onTimeRate}%</span>
                  </div>
                  <p className="font-medium text-gray-900">On-Time Rate</p>
                  <p className="text-sm text-gray-500">Punctual deliveries</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-white">{currentDriver?.rating.toFixed(1)}</span>
                  </div>
                  <p className="font-medium text-gray-900">Customer Rating</p>
                  <p className="text-sm text-gray-500">Average rating</p>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Achievements & Badges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performance.badges.map((badge, index) => {
                  const Icon = badge.icon
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        badge.color === 'gold' ? 'bg-yellow-50 border-yellow-200' :
                        badge.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                        badge.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                        badge.color === 'green' ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          badge.color === 'gold' ? 'bg-yellow-100' :
                          badge.color === 'blue' ? 'bg-blue-100' :
                          badge.color === 'yellow' ? 'bg-yellow-100' :
                          badge.color === 'green' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            badge.color === 'gold' ? 'text-yellow-600' :
                            badge.color === 'blue' ? 'text-blue-600' :
                            badge.color === 'yellow' ? 'text-yellow-600' :
                            badge.color === 'green' ? 'text-green-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{badge.name}</p>
                          <p className="text-sm text-gray-500">Achievement unlocked</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {performance.badges.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Medal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Complete more deliveries to earn badges!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Route Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Route className="h-5 w-5 mr-2 text-green-600" />
                Route Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
                  <p className="text-sm text-gray-600">Total Trips</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">42</p>
                  <p className="text-sm text-gray-600">Avg Time (min)</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">156</p>
                  <p className="text-sm text-gray-600">Miles Driven</p>
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  if (!currentDriver) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Setting up your driver profile...</h3>
          <p className="text-gray-600">Please wait while we initialize your account.</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-gradient-blue">Driver Dashboard</h1>
          <p className="text-xl text-gray-600 mt-2">Welcome back, {currentDriver.name}</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Truck className="h-4 w-4" />
              <span>Vehicle: {currentDriver.vehicleId ? `Assigned` : 'Not assigned'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4" />
              <span>Rating: {currentDriver.rating.toFixed(1)}/5.0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`live-indicator ${isTracking ? 'text-green-500' : 'text-gray-400'}`}>
                <Navigation className="h-6 w-6" />
              </div>
              <div>
                <p className={`font-medium ${isTracking ? 'text-green-700' : 'text-gray-600'}`}>
                  {isTracking ? 'Live Tracking Active' : 'Tracking Inactive'}
                </p>
                <p className="text-xs text-gray-500">
                  {isTracking ? 'Location being shared' : 'Click to start tracking'}
                </p>
              </div>
            </div>
          </div>
          {pendingDeliveries.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">{pendingDeliveries.length} New</p>
                  <p className="text-xs text-orange-600">Pending deliveries</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card-elevated p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 relative ${
                  activeTab === tab.id
                    ? 'btn-gradient shadow-colored text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default DriverDashboard
