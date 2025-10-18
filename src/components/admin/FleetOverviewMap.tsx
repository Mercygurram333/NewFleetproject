import React, { useState } from 'react'
import { MapPin, Truck, Package, Users, Navigation, Filter, Eye } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'
import { useRealtimeStore } from '../../store/realtimeStore'
import LiveTrackingMap from '../maps/LiveTrackingMap'
import type { Delivery } from '../../types'

const FleetOverviewMap: React.FC = () => {
  const { deliveries, drivers, vehicles } = useAdminStore()
  const { driverLocations } = useRealtimeStore()
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showDrivers, setShowDrivers] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)

  // Filter deliveries based on selected status
  const filteredDeliveries = filterStatus === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.status === filterStatus)

  const activeDeliveries = deliveries.filter(d => 
    d.status === 'in-transit' || d.status === 'assigned'
  )

  const statusOptions = [
    { value: 'all', label: 'All Deliveries', count: deliveries.length },
    { value: 'pending', label: 'Pending', count: deliveries.filter(d => d.status === 'pending').length },
    { value: 'assigned', label: 'Assigned', count: deliveries.filter(d => d.status === 'assigned').length },
    { value: 'in-transit', label: 'In Transit', count: deliveries.filter(d => d.status === 'in-transit').length },
    { value: 'delivered', label: 'Delivered', count: deliveries.filter(d => d.status === 'delivered').length },
  ]

  const getDriverInfo = (driverId?: string) => {
    if (!driverId) return null
    return drivers.find(d => d.id === driverId)
  }

  const getVehicleInfo = (vehicleId?: string) => {
    if (!vehicleId) return null
    return vehicles.find(v => v.id === vehicleId)
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Drivers</p>
              <p className="text-2xl font-bold text-blue-900">{drivers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {drivers.filter(d => d.status === 'available').length} available
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Active Deliveries</p>
              <p className="text-2xl font-bold text-green-900">{activeDeliveries.length}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-green-600 mt-1">
            {deliveries.filter(d => d.status === 'in-transit').length} in transit
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Fleet Vehicles</p>
              <p className="text-2xl font-bold text-purple-900">{vehicles.length}</p>
            </div>
            <Truck className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-purple-600 mt-1">
            {vehicles.filter(v => v.status === 'available').length} available
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Live Tracking</p>
              <p className="text-2xl font-bold text-orange-900">{Object.keys(driverLocations).length}</p>
            </div>
            <Navigation className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-xs text-orange-600 mt-1">drivers online</p>
        </div>
      </div>

      {/* Map Controls */}
      <div className="card-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Fleet Overview Map</h3>
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
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showDrivers}
                onChange={(e) => setShowDrivers(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Drivers</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={(e) => setShowRoutes(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Routes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Enhanced Map */}
      <div className="card-elevated p-6">
        <LiveTrackingMap
          deliveries={filteredDeliveries}
          selectedDelivery={selectedDelivery}
          onDeliverySelect={setSelectedDelivery}
          driverLocations={driverLocations}
          showDrivers={showDrivers}
          showRoutes={showRoutes}
          height="600px"
        />
      </div>

      {/* Selected Delivery Details */}
      {selectedDelivery && (
        <div className="card-elevated p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Delivery Details</h4>
              <p className="text-sm text-gray-600">ID: {selectedDelivery.id}</p>
            </div>
            <button
              onClick={() => setSelectedDelivery(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Customer</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {selectedDelivery.customer.name}</p>
                <p><strong>Email:</strong> {selectedDelivery.customer.email}</p>
                <p><strong>Phone:</strong> {selectedDelivery.customer.phone}</p>
              </div>
            </div>

            {/* Package Info */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Package</h5>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Description:</strong> {selectedDelivery.package?.description || 'N/A'}</p>
                <p><strong>Weight:</strong> {selectedDelivery.package?.weight || 'N/A'} kg</p>
                <p><strong>Value:</strong> ${selectedDelivery.package?.value || 'N/A'}</p>
              </div>
            </div>

            {/* Assignment Info */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Assignment</h5>
              <div className="space-y-1 text-sm text-gray-600">
                {selectedDelivery.driverId && (
                  <>
                    <p><strong>Driver:</strong> {getDriverInfo(selectedDelivery.driverId)?.name || 'Unknown'}</p>
                    <p><strong>Vehicle:</strong> {getVehicleInfo(selectedDelivery.vehicleId)?.vehicleNumber || 'N/A'}</p>
                  </>
                )}
                <p><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    selectedDelivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedDelivery.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                    selectedDelivery.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedDelivery.status.replace('-', ' ')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h6 className="font-medium text-green-900 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Pickup Location
              </h6>
              <p className="text-sm text-green-800">
                {selectedDelivery.pickup?.address || selectedDelivery.pickupLocation?.address || 'Unknown'}
              </p>
              {selectedDelivery.pickup?.scheduledTime && (
                <p className="text-xs text-green-600 mt-1">
                  Scheduled: {new Date(selectedDelivery.pickup.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h6 className="font-medium text-red-900 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Delivery Location
              </h6>
              <p className="text-sm text-red-800">
                {selectedDelivery.delivery?.address || selectedDelivery.dropoffLocation?.address || 'Unknown'}
              </p>
              {selectedDelivery.delivery?.scheduledTime && (
                <p className="text-xs text-red-600 mt-1">
                  Scheduled: {new Date(selectedDelivery.delivery.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {selectedDelivery.package?.specialInstructions && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h6 className="font-medium text-yellow-900 mb-2">Special Instructions</h6>
              <p className="text-sm text-yellow-800">{selectedDelivery.package.specialInstructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FleetOverviewMap
