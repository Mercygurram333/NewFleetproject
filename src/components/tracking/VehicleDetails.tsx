import React from 'react'
import { 
  Truck, User, MapPin, Clock, Navigation, Phone, 
  Calendar, Gauge, Wifi, Battery, AlertCircle 
} from 'lucide-react'
import type { VehicleLocation, VehicleStatus } from '../../store/vehicleTrackingStore'

interface VehicleDetailsProps {
  vehicleId: string
  location: VehicleLocation
  status: VehicleStatus
  driverName?: string
  driverPhone?: string
  onClose: () => void
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicleId,
  location,
  status,
  driverName = 'Unknown Driver',
  driverPhone,
  onClose
}) => {
  const getStatusColor = (vehicleStatus: string) => {
    switch (vehicleStatus) {
      case 'Active':
        return 'text-green-600 bg-green-100'
      case 'On Delivery':
        return 'text-blue-600 bg-blue-100'
      case 'Idle':
        return 'text-yellow-600 bg-yellow-100'
      case 'Maintenance':
        return 'text-red-600 bg-red-100'
      case 'Offline':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W')
    return `${Math.abs(coord).toFixed(6)}° ${direction}`
  }

  const getSignalStrength = (accuracy: number) => {
    if (accuracy <= 5) return { strength: 'Excellent', color: 'text-green-600', bars: 4 }
    if (accuracy <= 10) return { strength: 'Good', color: 'text-blue-600', bars: 3 }
    if (accuracy <= 20) return { strength: 'Fair', color: 'text-yellow-600', bars: 2 }
    return { strength: 'Poor', color: 'text-red-600', bars: 1 }
  }

  const signal = getSignalStrength(location.accuracy)

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{vehicleId}</h2>
              <p className="text-blue-100">Vehicle Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
              {status.status}
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Updated {new Date(status.lastUpdate).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className={`flex items-center space-x-1 ${signal.color}`}>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">{signal.strength}</span>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Driver Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{driverName}</span>
            </div>
            {driverPhone && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phone:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{driverPhone}</span>
                  <button className="text-green-600 hover:text-green-700">
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location & Movement */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Location & Movement
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Latitude</label>
              <p className="font-mono text-sm font-medium">{formatCoordinate(location.latitude, 'lat')}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Longitude</label>
              <p className="font-mono text-sm font-medium">{formatCoordinate(location.longitude, 'lng')}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Speed</label>
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-gray-500" />
                <p className="font-medium">{Math.round(location.speed)} km/h</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Heading</label>
              <div className="flex items-center space-x-2">
                <Navigation className="h-4 w-4 text-gray-500" />
                <p className="font-medium">{Math.round(location.heading)}°</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Accuracy</label>
              <p className="font-medium">±{Math.round(location.accuracy)}m</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Last Update</label>
              <p className="font-medium">{new Date(location.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Route Information (if on delivery) */}
        {status.status === 'On Delivery' && status.route && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-blue-600" />
              Current Route
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Distance</label>
                  <p className="font-medium text-blue-900">{status.route.distance}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Duration</label>
                  <p className="font-medium text-blue-900">{status.route.duration}</p>
                </div>
              </div>
              
              {status.estimatedArrival && (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Estimated Arrival</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {new Date(status.estimatedArrival).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              {status.currentDeliveryId && (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Delivery ID</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-blue-600">
                      {status.currentDeliveryId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Battery className="h-5 w-5 mr-2 text-blue-600" />
            System Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">GPS Signal</label>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`w-1 h-3 rounded ${
                        bar <= signal.bars ? signal.color.replace('text-', 'bg-') : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-sm font-medium ${signal.color}`}>{signal.strength}</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Connection</label>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Center on Map</span>
          </button>
          {driverPhone && (
            <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Call Driver</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VehicleDetails
