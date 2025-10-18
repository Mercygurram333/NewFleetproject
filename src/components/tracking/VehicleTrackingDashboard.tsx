import React, { useEffect, useState } from 'react'
import { 
  Truck, MapPin, Activity, Clock, Users, Navigation, 
  BarChart3, RefreshCw, Filter, Search, Download 
} from 'lucide-react'
import MapView from './MapView'
import VehicleDetails from './VehicleDetails'
import { useVehicleTrackingStore, initializeVehicleTracking } from '../../store/vehicleTrackingStore'
import { useAdminStore } from '../../store/adminStore'

const VehicleTrackingDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'map' | 'list' | 'analytics'>('map')
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<string | null>(null)

  const {
    vehicleLocations,
    vehicleStatuses,
    isTracking,
    searchQuery,
    statusFilter,
    setTracking,
    setSearchQuery,
    setStatusFilter,
    getVehiclesByStatus
  } = useVehicleTrackingStore()

  const { drivers, initializeData } = useAdminStore()

  // Initialize data on component mount
  useEffect(() => {
    initializeData()
    initializeVehicleTracking()
  }, [initializeData])

  // Calculate statistics
  const stats = React.useMemo(() => {
    const allVehicles = Object.values(vehicleStatuses)
    const activeVehicles = allVehicles.filter(v => v.status === 'Active' || v.status === 'On Delivery')
    const onDeliveryVehicles = allVehicles.filter(v => v.status === 'On Delivery')
    const idleVehicles = allVehicles.filter(v => v.status === 'Idle')
    
    return {
      total: allVehicles.length,
      active: activeVehicles.length,
      onDelivery: onDeliveryVehicles.length,
      idle: idleVehicles.length,
      offline: allVehicles.filter(v => v.status === 'Offline').length,
      maintenance: allVehicles.filter(v => v.status === 'Maintenance').length
    }
  }, [vehicleStatuses])

  const getDriverName = (vehicleId: string) => {
    const location = vehicleLocations[vehicleId]
    if (!location) return 'Unknown Driver'
    
    const driver = drivers.find(d => d.id === location.driverId)
    return driver?.name || 'Unknown Driver'
  }

  const getDriverPhone = (vehicleId: string) => {
    const location = vehicleLocations[vehicleId]
    if (!location) return undefined
    
    const driver = drivers.find(d => d.id === location.driverId)
    return driver?.phone
  }

  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      vehicles: Object.values(vehicleStatuses).map(status => ({
        ...status,
        location: vehicleLocations[status.vehicleId],
        driver: getDriverName(status.vehicleId)
      }))
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vehicle-tracking-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MapPin className="h-7 w-7 mr-3 text-blue-600" />
              Vehicle Tracking Dashboard
            </h2>
            <p className="text-gray-600 mt-1">Real-time monitoring and management of fleet vehicles</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setTracking(!isTracking)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isTracking 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Vehicles</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">On Delivery</p>
                <p className="text-2xl font-bold text-purple-900">{stats.onDelivery}</p>
              </div>
              <Navigation className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Idle</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.idle}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Maintenance</p>
                <p className="text-2xl font-bold text-red-900">{stats.maintenance}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Offline</p>
                <p className="text-2xl font-bold text-gray-900">{stats.offline}</p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-0">
          {activeView === 'map' && (
            <MapView height="600px" showControls={true} />
          )}

          {activeView === 'list' && (
            <div className="p-6">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="On Delivery">On Delivery</option>
                  <option value="Idle">Idle</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              {/* Vehicle List */}
              <div className="space-y-4">
                {Object.values(vehicleStatuses)
                  .filter(vehicle => {
                    if (statusFilter !== 'all' && vehicle.status !== statusFilter) return false
                    if (searchQuery && !vehicle.vehicleId.toLowerCase().includes(searchQuery.toLowerCase())) return false
                    return true
                  })
                  .map(vehicle => {
                    const location = vehicleLocations[vehicle.vehicleId]
                    const driverName = getDriverName(vehicle.vehicleId)
                    
                    return (
                      <div
                        key={vehicle.vehicleId}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedVehicleForDetails(vehicle.vehicleId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${
                              vehicle.status === 'Active' ? 'bg-green-500' :
                              vehicle.status === 'On Delivery' ? 'bg-blue-500' :
                              vehicle.status === 'Idle' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{vehicle.vehicleId}</h3>
                              <p className="text-sm text-gray-600">{driverName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{vehicle.status}</p>
                            {location && (
                              <p className="text-sm text-gray-600">{Math.round(location.speed)} km/h</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                  <div className="space-y-3">
                    {[
                      { status: 'Active', count: stats.active, color: 'bg-green-500' },
                      { status: 'On Delivery', count: stats.onDelivery, color: 'bg-blue-500' },
                      { status: 'Idle', count: stats.idle, color: 'bg-yellow-500' },
                      { status: 'Maintenance', count: stats.maintenance, color: 'bg-red-500' },
                      { status: 'Offline', count: stats.offline, color: 'bg-gray-500' }
                    ].map(item => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-gray-700">{item.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${(item.count / stats.total) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Fleet Utilization</span>
                        <span>{Math.round((stats.active + stats.onDelivery) / stats.total * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(stats.active + stats.onDelivery) / stats.total * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Active Deliveries</span>
                        <span>{Math.round(stats.onDelivery / stats.total * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${stats.onDelivery / stats.total * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Availability</span>
                        <span>{Math.round((stats.total - stats.maintenance - stats.offline) / stats.total * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(stats.total - stats.maintenance - stats.offline) / stats.total * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicleForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <VehicleDetails
              vehicleId={selectedVehicleForDetails}
              location={vehicleLocations[selectedVehicleForDetails]}
              status={vehicleStatuses[selectedVehicleForDetails]}
              driverName={getDriverName(selectedVehicleForDetails)}
              driverPhone={getDriverPhone(selectedVehicleForDetails)}
              onClose={() => setSelectedVehicleForDetails(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleTrackingDashboard
