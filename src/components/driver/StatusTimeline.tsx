import React from 'react'
import { Clock, CheckCircle, Package, Truck, MapPin, User, XCircle } from 'lucide-react'
import type { Delivery } from '../../types'

interface StatusTimelineProps {
  delivery: Delivery
  showFullTimeline?: boolean
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ delivery, showFullTimeline = true }) => {
  const getStatusSteps = () => {
    const baseSteps = [
      {
        id: 'pending',
        label: 'Delivery Assigned',
        description: 'Delivery has been assigned to driver',
        icon: User,
        timestamp: delivery.createdAt,
        completed: true,
        active: false
      },
      {
        id: 'accepted',
        label: 'Accepted by Driver',
        description: 'Driver has accepted the delivery request',
        icon: CheckCircle,
        timestamp: delivery.acceptedAt,
        completed: delivery.status !== 'pending' && delivery.status !== 'rejected',
        active: delivery.status === 'accepted'
      },
      {
        id: 'in-transit',
        label: 'Ride Started',
        description: 'Driver is en route to pickup/delivery location',
        icon: Truck,
        timestamp: delivery.startedAt,
        completed: delivery.status === 'delivered',
        active: delivery.status === 'in-transit'
      },
      {
        id: 'delivered',
        label: 'Delivery Completed',
        description: 'Package has been successfully delivered',
        icon: Package,
        timestamp: delivery.completedAt,
        completed: delivery.status === 'delivered',
        active: false
      }
    ]

    // Handle rejected status
    if (delivery.status === 'rejected') {
      return [
        baseSteps[0],
        {
          id: 'rejected',
          label: 'Delivery Rejected',
          description: delivery.rejectionReason || 'Driver rejected the delivery request',
          icon: XCircle,
          timestamp: delivery.rejectedAt,
          completed: true,
          active: false,
          isRejected: true
        }
      ]
    }

    return baseSteps
  }

  const steps = getStatusSteps()
  const currentStepIndex = steps.findIndex(step => step.active)

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Pending'
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStepColor = (step: any, index: number) => {
    if (step.isRejected) return 'text-red-600 bg-red-100 border-red-300'
    if (step.completed) return 'text-green-600 bg-green-100 border-green-300'
    if (step.active) return 'text-blue-600 bg-blue-100 border-blue-300 animate-pulse'
    return 'text-gray-400 bg-gray-100 border-gray-300'
  }

  const getConnectorColor = (index: number) => {
    const step = steps[index]
    const nextStep = steps[index + 1]
    
    if (step?.isRejected) return 'bg-red-300'
    if (step?.completed && nextStep?.completed) return 'bg-green-300'
    if (step?.completed && nextStep?.active) return 'bg-gradient-to-b from-green-300 to-blue-300'
    if (step?.completed) return 'bg-green-300'
    return 'bg-gray-300'
  }

  if (!showFullTimeline) {
    // Compact version for cards
    const currentStep = steps.find(s => s.active) || steps.find(s => s.completed && !s.isRejected) || steps[0]
    const Icon = currentStep.icon
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`p-1 rounded-full ${getStepColor(currentStep, 0).split(' ').slice(1).join(' ')}`}>
          <Icon className={`h-3 w-3 ${getStepColor(currentStep, 0).split(' ')[0]}`} />
        </div>
        <span className="text-xs font-medium text-gray-700">{currentStep.label}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900">Delivery Status Timeline</h4>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
            delivery.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
            delivery.status === 'accepted' ? 'bg-purple-100 text-purple-800' :
            delivery.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {delivery.status.replace('-', ' ').toUpperCase()}
          </div>
        </div>
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1
          
          return (
            <div key={step.id} className="relative">
              <div className="flex items-start space-x-4">
                {/* Timeline Icon */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(step, index)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-16 ${getConnectorColor(index)}`}></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-gray-900">{step.label}</h5>
                    <span className="text-xs text-gray-500">{formatTimestamp(step.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  
                  {/* Additional Info */}
                  {step.id === 'accepted' && step.completed && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">✓ Driver confirmed and ready to start</p>
                    </div>
                  )}
                  
                  {step.id === 'in-transit' && step.active && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">🚛 Driver is currently on the way</p>
                    </div>
                  )}
                  
                  {step.id === 'delivered' && step.completed && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">✅ Package delivered successfully</p>
                      {delivery.completionNotes && (
                        <p className="text-xs text-green-600 mt-1">Note: {delivery.completionNotes}</p>
                      )}
                    </div>
                  )}
                  
                  {step.isRejected && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-700">❌ Delivery was rejected</p>
                      {delivery.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {delivery.rejectionReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Estimated Times */}
      {delivery.status !== 'delivered' && delivery.status !== 'rejected' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h6 className="text-sm font-medium text-gray-900 mb-2">Estimated Timeline</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
            {delivery.pickup?.scheduledTime && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-green-500" />
                <span>Pickup: {formatTimestamp(delivery.pickup.scheduledTime)}</span>
              </div>
            )}
            {delivery.delivery?.scheduledTime && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-red-500" />
                <span>Delivery: {formatTimestamp(delivery.delivery.scheduledTime)}</span>
              </div>
            )}
            {delivery.estimatedTime && (
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>Duration: ~{delivery.estimatedTime} minutes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusTimeline
