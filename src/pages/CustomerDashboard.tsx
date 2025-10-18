import React, { useEffect, useState } from 'react'
import { 
  Calendar, MapPin, CreditCard, Star, Navigation, Clock, Phone, CheckCircle, Plus, Package,
  History, Bell, Filter, RefreshCw, Eye, MessageSquare, Truck, AlertCircle, Timer,
  ChevronRight, Play, Pause, RotateCcw, Search, Download, Upload, Settings
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAdminStore } from '../store/adminStore'
import { useRealtimeStore } from '../store/realtimeStore'
import UniversalMap from '../components/maps/UniversalMap'
import DeliveryRequestForm from '../components/customer/DeliveryRequestForm'
import DeliveryProgressTracker from '../components/customer/DeliveryProgressTracker'
import CustomerDeliveryTrackingMap from '../components/CustomerDeliveryTrackingMap'
import type { Delivery } from '../types'

type TabType = 'overview' | 'requests' | 'tracking' | 'history' | 'notifications'

// Enhanced Delivery Card Component for Customer
const EnhancedDeliveryCard: React.FC<{
  delivery: Delivery
  onTrackDelivery: (delivery: Delivery) => void
  onViewDetails: () => void
  liveUpdate?: any
}> = ({ delivery, onTrackDelivery, onViewDetails, liveUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'accepted': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'started': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'in-transit': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'arrived': return 'bg-green-100 text-green-800 border-green-200'
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'cancelled': case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const pickupAddress = delivery.pickup?.address || delivery.pickupLocation?.address || 'Unknown pickup'
  const deliveryAddress = delivery.delivery?.address || delivery.dropoffLocation?.address || 'Unknown delivery'
  const packageDesc = delivery.package?.description || 'Package'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h4 className="text-lg font-semibold text-gray-900">{packageDesc}</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
              {delivery.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
              <span>From: {pickupAddress}</span>
            </div>
            <div className="flex items-center">
              <Navigation className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
              <span>To: {deliveryAddress}</span>
            </div>
            {delivery.estimatedTime && (
              <div className="flex items-center">
                <Timer className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Est. {delivery.estimatedTime} minutes</span>
              </div>
            )}
          </div>

          {delivery.driver && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {delivery.driver.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Driver: {delivery.driver.name}</p>
                  <p className="text-xs text-gray-500">{delivery.driver.phone}</p>
                </div>
                {delivery.driver.vehicle && (
                  <div className="ml-auto">
                    <p className="text-xs text-gray-500">Vehicle: {delivery.driver.vehicle}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {liveUpdate && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-800 font-medium">Live tracking active</span>
                <span className="text-xs text-green-600">
                  Updated {new Date(liveUpdate.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={onViewDetails}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>Details</span>
          </button>
          
          {['started', 'in-transit', 'arrived'].includes(delivery.status) && (
            <button
              onClick={() => onTrackDelivery(delivery)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <MapPin className="h-4 w-4" />
              <span>Track Live</span>
            </button>
          )}

          {delivery.driver?.phone && (
            <button className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </button>
          )}
        </div>
      </div>

      {delivery.package.specialInstructions && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            {delivery.package.specialInstructions}
          </p>
        </div>
      )}
    </div>
  )
}

const CustomerDashboard: React.FC = () => {
  console.log('CustomerDashboard component rendering...')
  
  const { user } = useAuthStore()
  const { deliveries, drivers, initializeData } = useAdminStore()
  const { driverLocations, initializeSocket } = useRealtimeStore()
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [liveLocationUpdates, setLiveLocationUpdates] = useState<Record<string, any>>({})
  const [notifications, setNotifications] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  console.log('CustomerDashboard - User:', user)
  console.log('CustomerDashboard - Deliveries:', deliveries)
  console.log('CustomerDashboard - IsLoading:', isLoading)

  // Add loading state management
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Get customer's deliveries based on email
  const customerDeliveries = deliveries.filter(d => 
    d.customer.email === user?.email
  )

  // Filter deliveries by status
  const activeDeliveries = customerDeliveries.filter(d => 
    d.status === 'pending' || d.status === 'assigned' || d.status === 'accepted' || 
    d.status === 'started' || d.status === 'in-transit' || d.status === 'arrived'
  )
  const completedDeliveries = customerDeliveries.filter(d => d.status === 'delivered')

  useEffect(() => {
    // Initialize data and socket connection
    initializeData()
  }, [initializeData])

  useEffect(() => {
    // Initialize socket connection
    initializeSocket()
    
    // Listen for delivery live location updates
    const { socket } = useRealtimeStore.getState()
    if (socket) {
      socket.on('delivery-live-location', (data: any) => {
        const { deliveryId, location, timestamp, status } = data
        
        // Update the driver location for this delivery - check against user email
        if (user?.email && deliveries.some(d => d.id === deliveryId && d.customer.email === user.email)) {
          console.log(`Live location update for customer delivery ${deliveryId}:`, location)
          
          // Store live location updates
          setLiveLocationUpdates(prev => ({
            ...prev,
            [deliveryId]: { location, timestamp, status }
          }))
        }
      })

      socket.on('delivery-status-changed', (data: any) => {
        const { deliveryId, status, timestamp, driverName } = data
        console.log(`Delivery ${deliveryId} status changed to ${status}`)
        
        // Add notification for status change - check against user email
        if (user?.email && deliveries.some(d => d.id === deliveryId && d.customer.email === user.email)) {
          const newNotification = {
            id: Date.now().toString(),
            type: 'status-change',
            title: 'Delivery Status Updated',
            message: `Your delivery is now ${status.replace('-', ' ')}`,
            timestamp: new Date().toISOString(),
            deliveryId,
            read: false
          }
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]) // Keep last 10 notifications
        }
      })

      socket.on('driver-assigned', (data: any) => {
        const { deliveryId, driverName, driverPhone, vehicleNumber } = data
        if (user?.email && deliveries.some(d => d.id === deliveryId && d.customer.email === user.email)) {
          const newNotification = {
            id: Date.now().toString(),
            type: 'driver-assigned',
            title: 'Driver Assigned',
            message: `${driverName} has been assigned to your delivery`,
            timestamp: new Date().toISOString(),
            deliveryId,
            read: false
          }
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)])
        }
      })

      socket.on('delivery-completed', (data: any) => {
        const { deliveryId, completionTime } = data
        if (user?.email && deliveries.some(d => d.id === deliveryId && d.customer.email === user.email)) {
          const newNotification = {
            id: Date.now().toString(),
            type: 'delivery-completed',
            title: 'Delivery Completed',
            message: 'Your package has been successfully delivered!',
            timestamp: new Date().toISOString(),
            deliveryId,
            read: false
          }
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)])
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('delivery-live-location')
        socket.off('delivery-status-changed')
        socket.off('driver-assigned')
        socket.off('delivery-completed')
      }
    }
  }, [initializeSocket, user?.email, deliveries])

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'arrived':
        return 'bg-emerald-100 text-emerald-800'
      case 'in-transit':
        return 'bg-blue-100 text-blue-800'
      case 'started':
        return 'bg-indigo-100 text-indigo-800'
      case 'accepted':
        return 'bg-purple-100 text-purple-800'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper functions
  const handleRequestSubmitted = () => {
    setShowNewRequestForm(false)
    setActiveTab('overview')
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getFilteredDeliveries = () => {
    if (filterStatus === 'all') return customerDeliveries
    if (filterStatus === 'active') return activeDeliveries
    if (filterStatus === 'completed') return completedDeliveries
    return customerDeliveries.filter(d => d.status === filterStatus)
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Calendar },
    { id: 'requests' as TabType, label: 'My Requests', icon: Package, badge: customerDeliveries.length },
    { id: 'tracking' as TabType, label: 'Live Tracking', icon: MapPin, badge: activeDeliveries.length },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell, badge: unreadNotifications }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="space-y-6">
            {/* Header with New Request Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Delivery Requests</h2>
                <p className="text-gray-600">Manage and track all your delivery requests</p>
              </div>
              <button
                onClick={() => setShowNewRequestForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Request</span>
              </button>
            </div>

            {/* New Request Form Modal */}
            {showNewRequestForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Delivery Request</h3>
                    <button
                      onClick={() => setShowNewRequestForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <DeliveryRequestForm onRequestSubmitted={handleRequestSubmitted} />
                </div>
              </div>
            )}

            {/* Filter Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center space-x-4">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Requests ({customerDeliveries.length})</option>
                  <option value="active">Active ({activeDeliveries.length})</option>
                  <option value="completed">Completed ({completedDeliveries.length})</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-transit">In Transit</option>
                </select>
                <button
                  onClick={() => initializeData()}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Delivery Requests List */}
            <div className="space-y-4">
              {getFilteredDeliveries().map(delivery => (
                <EnhancedDeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  onTrackDelivery={setSelectedDelivery}
                  onViewDetails={() => setSelectedDelivery(delivery)}
                  liveUpdate={liveLocationUpdates[delivery.id]}
                />
              ))}
            </div>

            {getFilteredDeliveries().length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h4>
                <p className="text-gray-600">No delivery requests match the selected filter.</p>
              </div>
            )}
          </div>
        )
      
      case 'tracking':
        const activeDelivery = activeDeliveries.find(d => ['started', 'in-transit', 'arrived'].includes(d.status))
        
        return (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <MapPin className="h-6 w-6 mr-3 text-blue-600" />
                  Live Delivery Tracking
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time Updates</span>
                  </span>
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
                    <Package className="h-4 w-4" />
                    <span>{activeDeliveries.length} Active</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              {activeDeliveries.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {activeDelivery && (
                    <button
                      onClick={() => setSelectedDelivery(activeDelivery)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Focus Active Delivery</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View All</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('history')}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Tracking Map */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="h-[600px]">
                <CustomerDeliveryTrackingMap 
                  hasActiveDelivery={activeDeliveries.length > 0}
                  deliveryStatus={activeDelivery?.status as any || 'pending'}
                  pickupAddress={activeDelivery?.pickup?.address || activeDelivery?.pickupLocation?.address}
                  dropAddress={activeDelivery?.delivery?.address || activeDelivery?.dropoffLocation?.address}
                  driverName={activeDelivery?.driver?.name}
                  estimatedTime={activeDelivery?.estimatedTime}
                  onDriverPositionUpdate={(position) => {
                    console.log('Driver position updated:', position)
                  }}
                />
              </div>
            </div>

            {/* Selected Delivery Details */}
            {selectedDelivery && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Delivery Details
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedDelivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedDelivery.status === 'in-transit' ? 'bg-purple-100 text-purple-800' :
                    selectedDelivery.status === 'started' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedDelivery.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <DeliveryProgressTracker delivery={selectedDelivery} />
              </div>
            )}

            {/* Progress Trackers for All Active Deliveries */}
            {activeDeliveries.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Active Deliveries</h4>
                {activeDeliveries.map(delivery => (
                  <div 
                    key={delivery.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <DeliveryProgressTracker delivery={delivery} />
                  </div>
                ))}
              </div>
            )}

            {/* No Active Deliveries State */}
            {activeDeliveries.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Active Deliveries</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed mb-6">
                  You don't have any active deliveries to track at the moment.
                </p>
                <button
                  onClick={() => setShowNewRequestForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create New Request</span>
                </button>
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
                  <p className="text-2xl font-bold text-green-600">{completedDeliveries.length}</p>
                  <p className="text-sm text-gray-600">Completed Deliveries</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{customerDeliveries.length}</p>
                  <p className="text-sm text-gray-600">Total Requests</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {customerDeliveries.length > 0 ? Math.round((completedDeliveries.length / customerDeliveries.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Completed Deliveries</h4>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {completedDeliveries.map(delivery => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{delivery.package.description}</h5>
                        <p className="text-sm text-gray-600">{delivery.delivery?.address || delivery.dropoffLocation?.address}</p>
                        <p className="text-xs text-gray-500">
                          Completed: {delivery.completedAt ? new Date(delivery.completedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Delivered
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery)
                            setActiveTab('tracking')
                          }}
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

            {/* All Deliveries Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">All Deliveries Timeline</h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {customerDeliveries.slice().reverse().map((delivery, index) => (
                    <div key={delivery.id} className="flex items-start space-x-4">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        delivery.status === 'delivered' ? 'bg-green-500' :
                        delivery.status === 'in-transit' ? 'bg-blue-500' :
                        delivery.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-900">{delivery.package.description}</h5>
                          <span className="text-xs text-gray-500">
                            {new Date(delivery.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{delivery.delivery?.address || delivery.dropoffLocation?.address}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getStatusColor(delivery.status)}`}>
                          {delivery.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Notifications Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                <p className="text-gray-600">Stay updated with your delivery status</p>
              </div>
              {unreadNotifications > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    notification.read 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {notification.type === 'status-change' && <Clock className="h-4 w-4 text-blue-500" />}
                      {notification.type === 'driver-assigned' && <Truck className="h-4 w-4 text-green-500" />}
                      {notification.type === 'delivery-completed' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {notifications.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h4>
                <p className="text-gray-600">You'll receive notifications about your delivery status here.</p>
              </div>
            )}
          </div>
        )
      
      default: // overview
        return (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="stats-card animate-bounce-in bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="stats-icon bg-blue-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="stats-change positive">Total</div>
                </div>
                <div className="stats-value text-blue-700">{customerDeliveries.length}</div>
                <div className="stats-label text-blue-600">Total Orders</div>
              </div>
              <div className="stats-card animate-bounce-in bg-gradient-to-br from-yellow-50 to-amber-50 border-l-4 border-yellow-500" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="stats-icon bg-yellow-500">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="live-indicator text-yellow-500">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
                <div className="stats-value text-yellow-700">{activeDeliveries.length}</div>
                <div className="stats-label text-yellow-600">In Transit</div>
              </div>
              <div className="stats-card animate-bounce-in bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="stats-icon bg-green-500">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="stats-change positive">+{completedDeliveries.length > 0 ? Math.round((completedDeliveries.length / customerDeliveries.length) * 100) : 0}%</div>
                </div>
                <div className="stats-value text-green-700">{completedDeliveries.length}</div>
                <div className="stats-label text-green-600">Delivered</div>
              </div>
              <div className="stats-card animate-bounce-in bg-gradient-to-br from-purple-50 to-violet-50 border-l-4 border-purple-500" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="stats-icon bg-purple-500">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="live-indicator text-purple-500">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                </div>
                <div className="stats-value text-purple-700">{activeDeliveries.length}</div>
                <div className="stats-label text-purple-600">Live Tracking</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-elevated p-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 text-blue-600 mr-2" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowNewRequestForm(true)}
                    className="btn-gradient w-full h-12 text-base font-medium flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create New Delivery Request</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Track Active Deliveries</span>
                  </button>
                </div>
              </div>

              <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 text-yellow-600 mr-2" />
                  Service Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deliveries:</span>
                    <span className="font-medium text-gray-900">{customerDeliveries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium text-green-600">
                      {customerDeliveries.length > 0 ? Math.round((completedDeliveries.length / customerDeliveries.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Orders:</span>
                    <span className="font-medium text-blue-600">{activeDeliveries.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Deliveries */}
            {activeDeliveries.length > 0 && (
              <div className="card-elevated animate-slide-up">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 flex items-center">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                    Active Deliveries
                    <span className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {activeDeliveries.length}
                    </span>
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {activeDeliveries.map(delivery => (
                    <EnhancedDeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onTrackDelivery={setSelectedDelivery}
                      onViewDetails={() => setSelectedDelivery(delivery)}
                      liveUpdate={liveLocationUpdates[delivery.id]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Deliveries */}
            {completedDeliveries.length > 0 && (
              <div className="card-elevated animate-slide-up">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                  <h3 className="text-xl font-bold text-green-900 flex items-center">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-3"></div>
                    Recent Deliveries
                    <span className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {completedDeliveries.length}
                    </span>
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {completedDeliveries.slice(0, 5).map(delivery => (
                    <EnhancedDeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onTrackDelivery={setSelectedDelivery}
                      onViewDetails={() => setSelectedDelivery(delivery)}
                      liveUpdate={liveLocationUpdates[delivery.id]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {customerDeliveries.length === 0 && (
              <div className="card-elevated p-12 text-center animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Fleet Management</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed mb-6">
                  You haven't created any delivery requests yet. Get started by creating your first delivery request.
                </p>
                <button
                  onClick={() => setShowNewRequestForm(true)}
                  className="btn-gradient px-8 py-3 text-base font-medium"
                >
                  Create Your First Request
                </button>
              </div>
            )}
          </div>
        )
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Customer Dashboard...</h3>
          <p className="text-gray-600">Please wait while we load your data.</p>
        </div>
      </div>
    )
  }

  // Error state - if user is not available
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-600">Please log in again to access your dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-bold text-gradient-blue mb-2">Customer Dashboard</h1>
        <p className="text-xl text-gray-600">Track your deliveries and create new requests</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-2 border border-gray-100">
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 relative ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
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

export default CustomerDashboard
