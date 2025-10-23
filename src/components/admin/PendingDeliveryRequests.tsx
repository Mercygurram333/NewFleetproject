import React, { useState } from 'react'
import { Package, MapPin, Clock, User, Phone, Weight, CheckCircle, X, Truck, AlertTriangle } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'
import type { Delivery } from '../../types'

const PendingDeliveryRequests: React.FC = () => {
  const { getPendingDeliveries, getAvailableDrivers, getAvailableVehicles, acceptDeliveryRequest } = useAdminStore()
  const [selectedRequest, setSelectedRequest] = useState<Delivery | null>(null)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showCapacityWarning, setShowCapacityWarning] = useState(false)
  const [capacityWarningData, setCapacityWarningData] = useState<{ vehicleCapacity: number; deliveryWeight: number } | null>(null)

  const pendingRequests = getPendingDeliveries()
  const availableDrivers = getAvailableDrivers()
  const availableVehicles = getAvailableVehicles()

  const handleAcceptRequest = async (request: Delivery) => {
    if (!selectedDriver || !selectedVehicle) {
      alert('Please select both a driver and vehicle')
      return
    }

    // Check vehicle capacity
    const selectedVehicleData = availableVehicles.find(v => v.id === selectedVehicle)
    const deliveryWeight = request.package?.weight || 0
    
    if (selectedVehicleData && deliveryWeight > selectedVehicleData.capacity) {
      setCapacityWarningData({
        vehicleCapacity: selectedVehicleData.capacity,
        deliveryWeight: deliveryWeight
      })
      setShowCapacityWarning(true)
      return
    }

    setIsAssigning(true)
    try {
      acceptDeliveryRequest(request.id, selectedDriver, selectedVehicle)
      setSelectedRequest(null)
      setSelectedDriver('')
      setSelectedVehicle('')
    } catch (error) {
      console.error('Error accepting request:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' at ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="card-elevated p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
        <p className="text-gray-600">All delivery requests have been processed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated animate-slide-up">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
          <h3 className="text-xl font-bold text-orange-900 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full mr-3"></div>
            Pending Delivery Requests
            <span className="ml-auto bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {pendingRequests.length}
            </span>
          </h3>
        </div>

        <div className="p-6">
          <div className="grid gap-6">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Package className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        {request.package?.description || 'Package Delivery'}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Pickup</p>
                            <p className="text-sm text-gray-600">{request.pickup?.address}</p>
                            {request.pickup?.scheduledTime && (
                              <p className="text-xs text-gray-500">
                                {formatDate(request.pickup.scheduledTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Delivery</p>
                            <p className="text-sm text-gray-600">{request.delivery?.address}</p>
                            {request.delivery?.scheduledTime && (
                              <p className="text-xs text-gray-500">
                                {formatDate(request.delivery.scheduledTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{request.customer.name}</p>
                          <p className="text-xs text-gray-500">{request.customer.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        <p className="text-sm text-gray-600">{request.customer.phone}</p>
                      </div>
                      
                      <div className="flex items-center">
                        <Weight className="h-4 w-4 text-gray-500 mr-2" />
                        <p className="text-sm text-gray-600">{request.package?.weight} kg</p>
                      </div>
                    </div>

                    {request.package?.specialInstructions && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions:</p>
                        <p className="text-sm text-yellow-700">{request.package.specialInstructions}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="btn-gradient px-4 py-2 text-sm font-medium"
                    >
                      Assign Driver
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Requested: {formatDate(request.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-bounce-in">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Assign Driver & Vehicle</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Driver
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="form-select-enhanced"
                >
                  <option value="">Choose a driver...</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - Rating: {driver.rating}/5 ({driver.totalTrips} trips)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => {
                    setSelectedVehicle(e.target.value)
                    // Clear capacity warning when vehicle changes
                    if (showCapacityWarning) {
                      setShowCapacityWarning(false)
                      setCapacityWarningData(null)
                    }
                  }}
                  className={`form-select-enhanced ${selectedVehicle && (() => {
                    const vehicle = availableVehicles.find(v => v.id === selectedVehicle)
                    const deliveryWeight = selectedRequest?.package?.weight || 0
                    return vehicle && deliveryWeight > vehicle.capacity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  })()}`}
                >
                  <option value="">Choose a vehicle...</option>
                  {availableVehicles.map((vehicle) => {
                    const deliveryWeight = selectedRequest?.package?.weight || 0
                    const isCapacityInsufficient = deliveryWeight > vehicle.capacity
                    return (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                        className={isCapacityInsufficient ? 'text-red-600 font-medium' : ''}
                      >
                        {vehicle.vehicleNumber} - {vehicle.type} (Capacity: {vehicle.capacity}kg)
                        {isCapacityInsufficient && ' ⚠️ Insufficient capacity'}
                      </option>
                    )
                  })}
                </select>
                {selectedVehicle && (() => {
                  const vehicle = availableVehicles.find(v => v.id === selectedVehicle)
                  const deliveryWeight = selectedRequest?.package?.weight || 0
                  return vehicle && deliveryWeight > vehicle.capacity ? (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Vehicle capacity ({vehicle.capacity}kg) is less than delivery weight ({deliveryWeight}kg)</span>
                    </p>
                  ) : null
                })()}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Request Summary</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Package:</strong> {selectedRequest.package?.description}</p>
                  <p><strong>Weight:</strong> {selectedRequest.package?.weight} kg</p>
                  <p><strong>Customer:</strong> {selectedRequest.customer.name}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAcceptRequest(selectedRequest)}
                disabled={!selectedDriver || !selectedVehicle || isAssigning || (Boolean(selectedVehicle) && (() => {
                  const vehicle = availableVehicles.find(v => v.id === selectedVehicle)
                  const deliveryWeight = selectedRequest?.package?.weight || 0
                  return vehicle ? deliveryWeight > vehicle.capacity : false
                })())}
                className="flex-1 btn-gradient px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAssigning ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Accept & Assign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Warning Modal */}
      {showCapacityWarning && capacityWarningData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-bounce-in">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">Capacity Warning</h3>
                </div>
                <button
                  onClick={() => {
                    setShowCapacityWarning(false)
                    setCapacityWarningData(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Vehicle Capacity Insufficient</h4>
                <p className="text-gray-600 text-sm mb-4">
                  The selected vehicle cannot handle this delivery.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Vehicle Capacity</p>
                    <p className="font-semibold text-red-700">{capacityWarningData.vehicleCapacity} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Delivery Weight</p>
                    <p className="font-semibold text-red-700">{capacityWarningData.deliveryWeight} kg</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-800 font-medium text-sm">
                    Shortfall: {capacityWarningData.deliveryWeight - capacityWarningData.vehicleCapacity} kg
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm font-medium">
                  💡 Please select a vehicle with higher capacity to proceed with this assignment.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => {
                  setShowCapacityWarning(false)
                  setCapacityWarningData(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingDeliveryRequests
