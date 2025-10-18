import React from 'react'
import { Clock, CheckCircle, Truck, Package, MapPin } from 'lucide-react'
import type { Delivery } from '../../types'

interface DeliveryProgressTrackerProps {
  delivery: Delivery
}

const DeliveryProgressTracker: React.FC<DeliveryProgressTrackerProps> = ({ delivery }) => {
  const getStatusSteps = () => {
    const steps = [
      {
        id: 'pending',
        label: 'Request Submitted',
        description: 'Your delivery request has been submitted',
        icon: Clock,
        color: 'blue'
      },
      {
        id: 'assigned',
        label: 'Request Accepted',
        description: 'Admin has approved and assigned a driver',
        icon: CheckCircle,
        color: 'green'
      },
      {
        id: 'in-transit',
        label: 'In Transit',
        description: 'Driver is on the way to pickup/delivery',
        icon: Truck,
        color: 'purple'
      },
      {
        id: 'delivered',
        label: 'Delivered',
        description: 'Package has been successfully delivered',
        icon: Package,
        color: 'emerald'
      }
    ]

    const statusOrder = ['pending', 'assigned', 'in-transit', 'delivered']
    const currentIndex = statusOrder.indexOf(delivery.status)

    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
      isUpcoming: index > currentIndex
    }))
  }

  const steps = getStatusSteps()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600 bg-blue-100'
      case 'assigned':
        return 'text-green-600 bg-green-100'
      case 'in-transit':
        return 'text-purple-600 bg-purple-100'
      case 'delivered':
        return 'text-emerald-600 bg-emerald-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getEstimatedTime = () => {
    if (delivery.estimatedDelivery) {
      const estimatedDate = new Date(delivery.estimatedDelivery)
      return estimatedDate.toLocaleDateString() + ' at ' + estimatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return 'To be determined'
  }

  return (
    <div className="card-elevated animate-slide-up">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-indigo-900 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
            Delivery Progress
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace('-', ' ')}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Delivery Info Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">From:</p>
              <p className="font-medium text-gray-900">{delivery.pickup.address}</p>
            </div>
            <div>
              <p className="text-gray-600">To:</p>
              <p className="font-medium text-gray-900">{delivery.delivery.address}</p>
            </div>
            <div>
              <p className="text-gray-600">Package:</p>
              <p className="font-medium text-gray-900">{delivery.package.description}</p>
            </div>
            <div>
              <p className="text-gray-600">Estimated Delivery:</p>
              <p className="font-medium text-gray-900">{getEstimatedTime()}</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.isCompleted
                        ? `bg-${step.color}-500 text-white shadow-lg`
                        : step.isCurrent
                        ? `bg-${step.color}-100 text-${step.color}-600 ring-4 ring-${step.color}-200 animate-pulse`
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-medium ${
                        step.isCompleted || step.isCurrent
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {step.isCompleted && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      step.isCompleted || step.isCurrent
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </p>

                  {/* Additional Info for Current Step */}
                  {step.isCurrent && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      {delivery.status === 'pending' && (
                        <p className="text-sm text-blue-800">
                          Your request is being reviewed by our team. You'll be notified once it's approved.
                        </p>
                      )}
                      {delivery.status === 'assigned' && delivery.driver && (
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Driver Assigned: {delivery.driver.name}</p>
                          <p>Phone: {delivery.driver.phone}</p>
                          <p>Vehicle: {delivery.driver.vehicle}</p>
                        </div>
                      )}
                      {delivery.status === 'in-transit' && (
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Your package is on the way!</p>
                          <p>Track live location on the map above.</p>
                        </div>
                      )}
                      {delivery.status === 'delivered' && (
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Delivery completed successfully!</p>
                          <p>Thank you for using our service.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-5 mt-10 w-px h-8 bg-gray-300"></div>
                )}
              </div>
            )
          })}
        </div>

        {/* Driver Info (if assigned) */}
        {delivery.driver && delivery.status !== 'pending' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              Driver Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-blue-700 font-medium">{delivery.driver.name}</p>
                <p className="text-blue-600">Driver</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">{delivery.driver.phone}</p>
                <p className="text-blue-600">Contact</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">{delivery.driver.vehicle}</p>
                <p className="text-blue-600">Vehicle</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Tracking Button */}
        {delivery.status === 'in-transit' && (
          <div className="mt-6">
            <button className="btn-gradient w-full h-10 text-sm font-medium flex items-center justify-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>View Live Tracking</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryProgressTracker
