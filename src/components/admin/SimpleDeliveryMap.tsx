import React from 'react'
import { MapPin, Navigation, Package, Clock } from 'lucide-react'
import type { Delivery } from '../../types'

interface SimpleDeliveryMapProps {
  deliveries: Delivery[]
  selectedDelivery: Delivery | null
  onDeliverySelect: (delivery: Delivery | null) => void
}

const SimpleDeliveryMap: React.FC<SimpleDeliveryMapProps> = ({ 
  deliveries, 
  selectedDelivery, 
  onDeliverySelect 
}) => {
  const getStatusColor = (status: Delivery['status']) => {
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

  const getPriorityColor = (priority?: Delivery['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      case 'low':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-green-50">
      {/* Simulated Map Background */}
      <div className="relative h-full w-full overflow-auto">
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-20 grid-rows-15 h-full w-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div key={i} className="border border-gray-200"></div>
            ))}
          </div>
        </div>

        {/* Delivery Markers */}
        <div className="relative h-full w-full p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto">
            {deliveries.map((delivery, index) => {
              const pickupAddress = delivery.pickup?.address || delivery.pickupLocation?.address || 'Unknown pickup'
              const deliveryAddress = delivery.delivery?.address || delivery.dropoffLocation?.address || 'Unknown delivery'
              const isSelected = selectedDelivery?.id === delivery.id

              return (
                <div
                  key={delivery.id}
                  onClick={() => onDeliverySelect(delivery)}
                  className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                    isSelected ? 'scale-105 shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    position: 'absolute',
                    left: `${(index % 5) * 18 + 5}%`,
                    top: `${Math.floor(index / 5) * 25 + 10}%`,
                    zIndex: isSelected ? 20 : 10
                  }}
                >
                  <div className={`bg-white rounded-lg p-3 border-2 ${
                    isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                  } ${getPriorityColor(delivery.priority)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Package className="h-5 w-5 text-gray-600" />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                        {delivery.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="font-medium text-gray-900 truncate">
                        {delivery.customer.name}
                      </div>
                      
                      <div className="flex items-center text-green-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{pickupAddress}</span>
                      </div>
                      
                      <div className="flex items-center text-red-600">
                        <Navigation className="h-3 w-3 mr-1" />
                        <span className="truncate">{deliveryAddress}</span>
                      </div>
                      
                      {delivery.estimatedTime && (
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{delivery.estimatedTime}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-30 text-xs">
          <h4 className="font-semibold mb-2">Status Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Accepted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span>Started</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>In Transit</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>Arrived</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        {/* Selected Delivery Info */}
        {selectedDelivery && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-30 max-w-xs">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">Selected Delivery</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeliverySelect(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Customer:</span> {selectedDelivery.customer.name}
              </div>
              <div>
                <span className="font-medium">From:</span> {
                  selectedDelivery.pickup?.address || 
                  selectedDelivery.pickupLocation?.address || 
                  'Unknown pickup'
                }
              </div>
              <div>
                <span className="font-medium">To:</span> {
                  selectedDelivery.delivery?.address || 
                  selectedDelivery.dropoffLocation?.address || 
                  'Unknown delivery'
                }
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDelivery.status)}`}>
                  {selectedDelivery.status.replace('-', ' ')}
                </span>
              </div>
              <div>
                <span className="font-medium">Priority:</span>{' '}
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  selectedDelivery.priority === 'high' ? 'bg-red-100 text-red-800' :
                  selectedDelivery.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedDelivery.priority || 'medium'}
                </span>
              </div>
              {selectedDelivery.estimatedTime && (
                <div>
                  <span className="font-medium">ETA:</span> {selectedDelivery.estimatedTime} minutes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {deliveries.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Deliveries</h3>
              <p className="text-gray-400">Create a delivery to see it on the map</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleDeliveryMap
