import React from 'react'
import { Truck, Navigation, Clock, User } from 'lucide-react'
import type { VehicleLocation, VehicleStatus } from '../../store/vehicleTrackingStore'

interface VehicleMarkerProps {
  location: VehicleLocation
  status: VehicleStatus
  isSelected: boolean
  onClick: () => void
  driverName?: string
}

const VehicleMarker: React.FC<VehicleMarkerProps> = ({
  location,
  status,
  isSelected,
  onClick,
  driverName = 'Unknown Driver'
}) => {
  const getStatusColor = (vehicleStatus: string) => {
    switch (vehicleStatus) {
      case 'Active':
        return 'bg-green-500 border-green-600'
      case 'On Delivery':
        return 'bg-blue-500 border-blue-600'
      case 'Idle':
        return 'bg-yellow-500 border-yellow-600'
      case 'Maintenance':
        return 'bg-red-500 border-red-600'
      case 'Offline':
        return 'bg-gray-500 border-gray-600'
      default:
        return 'bg-gray-500 border-gray-600'
    }
  }

  const getStatusIcon = (vehicleStatus: string) => {
    switch (vehicleStatus) {
      case 'Active':
        return <Navigation className="h-3 w-3 text-white" />
      case 'On Delivery':
        return <Truck className="h-3 w-3 text-white" />
      case 'Idle':
        return <Clock className="h-3 w-3 text-white" />
      default:
        return <Truck className="h-3 w-3 text-white" />
    }
  }

  return (
    <div className="relative">
      {/* Vehicle Marker */}
      <div
        onClick={onClick}
        className={`
          relative cursor-pointer transform transition-all duration-200 hover:scale-110
          ${isSelected ? 'scale-125 z-50' : 'z-10'}
        `}
      >
        {/* Main Marker Circle */}
        <div
          className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg
            ${getStatusColor(status.status)}
            ${isSelected ? 'ring-4 ring-white ring-opacity-50' : ''}
          `}
        >
          {getStatusIcon(status.status)}
        </div>

        {/* Direction Indicator */}
        {location.speed > 0 && (
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1"
            style={{
              transform: `translate(-50%, -4px) rotate(${location.heading}deg)`
            }}
          >
            <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
          </div>
        )}

        {/* Speed Indicator */}
        {location.speed > 0 && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
              {Math.round(location.speed)} km/h
            </div>
          </div>
        )}
      </div>

      {/* Expanded Info Panel (when selected) */}
      {isSelected && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status).split(' ')[0]}`}></div>
                <h3 className="font-semibold text-gray-900">{status.vehicleId}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                status.status === 'Active' ? 'bg-green-100 text-green-800' :
                status.status === 'On Delivery' ? 'bg-blue-100 text-blue-800' :
                status.status === 'Idle' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status.status}
              </span>
            </div>

            {/* Driver Info */}
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{driverName}</span>
            </div>

            {/* Location Info */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="font-medium">{Math.round(location.speed)} km/h</span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-medium">±{Math.round(location.accuracy)}m</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span className="font-medium">
                  {new Date(location.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Route Info (if on delivery) */}
            {status.status === 'On Delivery' && status.route && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">Route Details</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">{status.route.distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{status.route.duration}</span>
                  </div>
                  {status.estimatedArrival && (
                    <div className="flex justify-between">
                      <span>ETA:</span>
                      <span className="font-medium">
                        {new Date(status.estimatedArrival).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Info */}
            {status.currentDeliveryId && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Delivery: {status.currentDeliveryId}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Arrow pointing to marker */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleMarker
