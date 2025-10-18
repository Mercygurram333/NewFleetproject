import React, { useState } from 'react'
import { MapPin, Clock, User, Phone, Package, CheckCircle, XCircle, Play, Navigation, AlertTriangle, Star } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'
import { useRealtimeStore } from '../../store/realtimeStore'
import StatusTimeline from './StatusTimeline'
import type { Delivery } from '../../types'

interface DeliveryCardProps {
  delivery: Delivery
  driverId: string
  onViewMap?: (delivery: Delivery) => void
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, driverId, onViewMap }) => {
  const { driverAcceptDelivery, driverRejectDelivery, startDeliveryRide, markDeliveryInTransit, markDeliveryArrived, completeDelivery } = useAdminStore()
  const { emitDeliveryStatusUpdate, currentUserLocation, socket } = useRealtimeStore()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showTimeline, setShowTimeline] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  // Handle both new and legacy delivery formats
  const pickupAddress = delivery.pickup?.address || delivery.pickupLocation?.address || 'Unknown pickup location'
  const dropoffAddress = delivery.delivery?.address || delivery.dropoffLocation?.address || 'Unknown delivery location'
  const packageDesc = delivery.package?.description || 'Package delivery'
  const estimatedTime = delivery.estimatedTime || 30
  const priority = delivery.priority || 'medium'

  const handleAccept = () => {
    driverAcceptDelivery(delivery.id, driverId)
    emitDeliveryStatusUpdate({
      deliveryId: delivery.id,
      status: 'accepted',
      driverId,
      timestamp: new Date().toISOString(),
      location: currentUserLocation || undefined
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    driverRejectDelivery(delivery.id, driverId, rejectReason)
    emitDeliveryStatusUpdate({
      deliveryId: delivery.id,
      status: 'rejected',
      driverId,
      timestamp: new Date().toISOString(),
      location: currentUserLocation || undefined
    })
    setShowRejectModal(false)
    setRejectReason('')
  }

  const handleStartRide = () => {
    startDeliveryRide(delivery.id, driverId)
    
    // Emit delivery status update with current location
    emitDeliveryStatusUpdate({
      deliveryId: delivery.id,
      status: 'started',
      driverId,
      timestamp: new Date().toISOString(),
      location: currentUserLocation || undefined
    })

    // Start continuous location tracking for this delivery
    if (currentUserLocation && socket) {
      // Emit initial location for this delivery
      socket.emit('delivery-location-update', {
        deliveryId: delivery.id,
        driverId,
        location: currentUserLocation,
        timestamp: new Date().toISOString(),
        status: 'started'
      })
    }

    console.log(`Started delivery ${delivery.id} - Live tracking activated`)
  }

  const handleMarkInTransit = () => {
    markDeliveryInTransit(delivery.id, driverId)
    emitDeliveryStatusUpdate({
      deliveryId: delivery.id,
      status: 'in-transit',
      driverId,
      timestamp: new Date().toISOString(),
      location: currentUserLocation || undefined
    })
  }

  const handleMarkArrived = () => {
    markDeliveryArrived(delivery.id, driverId)
    emitDeliveryStatusUpdate({
      deliveryId: delivery.id,
      status: 'arrived',
      driverId,
      timestamp: new Date().toISOString(),
      location: currentUserLocation || undefined
    })
  }

  const handleComplete = () => {
    completeDelivery(delivery.id, driverId, completionNotes)
    emitDeliveryStatusUpdate({
      deliveryId: delivery.id,
      status: 'delivered',
      driverId,
      timestamp: new Date().toISOString(),
      location: currentUserLocation || undefined
    })
    setShowCompleteModal(false)
    setCompletionNotes('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'arrived':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'started':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'assigned':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{delivery.customer.name}</h4>
              <p className="text-sm text-gray-600">{packageDesc}</p>
              <div className="flex items-center space-x-2 mt-1">
                <StatusTimeline delivery={delivery} showFullTimeline={false} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(delivery.status)}`}>
              {delivery.status.replace('-', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(priority)}`}>
              {priority.toUpperCase()} PRIORITY
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">{delivery.customer.name}</p>
              <p className="text-xs text-gray-600">{delivery.customer.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-700">{delivery.customer.phone}</p>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Pickup Location</p>
              <p className="text-sm text-green-800">{pickupAddress}</p>
              {delivery.pickup?.scheduledTime && (
                <p className="text-xs text-green-600 mt-1">
                  Scheduled: {new Date(delivery.pickup.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Delivery Location</p>
              <p className="text-sm text-red-800">{dropoffAddress}</p>
              {delivery.delivery?.scheduledTime && (
                <p className="text-xs text-red-600 mt-1">
                  Scheduled: {new Date(delivery.delivery.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">{estimatedTime} min</span>
          </div>
          {delivery.package?.weight && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">⚖️</span>
              <span className="text-gray-700">{delivery.package.weight}kg</span>
            </div>
          )}
          {delivery.package?.value && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">💰</span>
              <span className="text-gray-700">${delivery.package.value}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-700">{priority}</span>
          </div>
        </div>

        {/* Special Instructions */}
        {delivery.package?.specialInstructions && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                <p className="text-sm text-yellow-700">{delivery.package.specialInstructions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          {(delivery.status === 'pending' || delivery.status === 'assigned') && (
            <>
              <button
                onClick={handleAccept}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Accept Delivery</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </>
          )}
          
          {delivery.status === 'accepted' && (
            <button
              onClick={handleStartRide}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              <Play className="h-4 w-4" />
              <span>Start Journey</span>
            </button>
          )}
          
          {delivery.status === 'started' && (
            <button
              onClick={handleMarkInTransit}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
            >
              <Navigation className="h-4 w-4" />
              <span>Mark In Transit</span>
            </button>
          )}
          
          {delivery.status === 'in-transit' && (
            <button
              onClick={handleMarkArrived}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
            >
              <MapPin className="h-4 w-4" />
              <span>Mark Arrived</span>
            </button>
          )}
          
          {delivery.status === 'arrived' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Complete Delivery</span>
            </button>
          )}
          
          <button
            onClick={() => onViewMap?.(delivery)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
          >
            <Navigation className="h-4 w-4" />
            <span>View on Map</span>
          </button>
          
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            <Clock className="h-4 w-4" />
            <span>Timeline</span>
          </button>
        </div>

        {/* Timeline */}
        {showTimeline && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <StatusTimeline delivery={delivery} showFullTimeline={true} />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-bounce-in">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reject Delivery</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Please provide a reason for rejecting this delivery:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Reject Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-bounce-in">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Complete Delivery</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Add any completion notes (optional):</p>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Package delivered successfully..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Complete Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DeliveryCard
