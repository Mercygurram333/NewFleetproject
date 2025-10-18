import React, { useEffect, useRef, useState } from 'react'
import { Search, Filter, RefreshCw, MapPin, Layers, Maximize2 } from 'lucide-react'
import VehicleMarker from './VehicleMarker'
import VehicleDetails from './VehicleDetails'
import { useVehicleTrackingStore } from '../../store/vehicleTrackingStore'
import { useAdminStore } from '../../store/adminStore'

interface MapViewProps {
  height?: string
  showControls?: boolean
  className?: string
}

const MapView: React.FC<MapViewProps> = ({ 
  height = '500px', 
  showControls = true,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showVehicleDetails, setShowVehicleDetails] = useState(false)
  
  const {
    vehicleLocations,
    vehicleStatuses,
    selectedVehicleId,
    isTracking,
    searchQuery,
    statusFilter,
    setSelectedVehicle,
    setTracking,
    setSearchQuery,
    setStatusFilter,
    getVehiclesByStatus,
    searchVehicles
  } = useVehicleTrackingStore()

  const { drivers } = useAdminStore()

  // Initialize map (using a simple div-based map for now - can be replaced with Google Maps/Mapbox)
  useEffect(() => {
    if (mapRef.current && !mapInstance) {
      // Simple map implementation - replace with actual map library
      const map = {
        center: { lat: 19.0760, lng: 72.8777 }, // Mumbai
        zoom: 12,
        markers: []
      }
      setMapInstance(map)
    }
  }, [mapInstance])

  // Filter vehicles based on search and status
  const filteredVehicles = React.useMemo(() => {
    let vehicles = Object.values(vehicleStatuses)
    
    if (statusFilter !== 'all') {
      vehicles = getVehiclesByStatus(statusFilter)
    }
    
    if (searchQuery) {
      vehicles = searchVehicles(searchQuery)
    }
    
    return vehicles
  }, [vehicleStatuses, statusFilter, searchQuery, getVehiclesByStatus, searchVehicles])

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

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicle(selectedVehicleId === vehicleId ? null : vehicleId)
  }

  const handleToggleTracking = () => {
    setTracking(!isTracking)
  }

  const handleRefresh = () => {
    // Trigger a refresh of vehicle data
    console.log('Refreshing vehicle data...')
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const statusOptions = [
    { value: 'all', label: 'All Vehicles', count: Object.keys(vehicleStatuses).length },
    { value: 'Active', label: 'Active', count: getVehiclesByStatus('Active').length },
    { value: 'On Delivery', label: 'On Delivery', count: getVehiclesByStatus('On Delivery').length },
    { value: 'Idle', label: 'Idle', count: getVehiclesByStatus('Idle').length },
    { value: 'Maintenance', label: 'Maintenance', count: getVehiclesByStatus('Maintenance').length },
    { value: 'Offline', label: 'Offline', count: getVehiclesByStatus('Offline').length }
  ]

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vehicle ID or driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleTracking}
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
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
                <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 flex flex-wrap gap-2">
            {statusOptions.slice(1).map(option => (
              <div
                key={option.value}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}: {option.count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative" style={{ height }}>
        {/* Simple Map Background */}
        <div
          ref={mapRef}
          className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, transparent 49%, rgba(156, 163, 175, 0.1) 50%, transparent 51%)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px'
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Vehicle Markers */}
          {filteredVehicles.map(status => {
            const location = vehicleLocations[status.vehicleId]
            if (!location) return null

            // Convert lat/lng to pixel coordinates (simplified)
            const x = ((location.longitude - 72.8) * 1000) % (mapRef.current?.clientWidth || 800)
            const y = ((19.1 - location.latitude) * 1000) % (mapRef.current?.clientHeight || 600)

            return (
              <div
                key={status.vehicleId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: Math.max(50, Math.min((mapRef.current?.clientWidth || 800) - 50, Math.abs(x))),
                  top: Math.max(50, Math.min((mapRef.current?.clientHeight || 600) - 50, Math.abs(y)))
                }}
              >
                <VehicleMarker
                  location={location}
                  status={status}
                  isSelected={selectedVehicleId === status.vehicleId}
                  onClick={() => handleVehicleClick(status.vehicleId)}
                  driverName={getDriverName(status.vehicleId)}
                />
              </div>
            )
          })}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Vehicle Status</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-700">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-700">On Delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-700">Idle</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-xs text-gray-700">Offline</span>
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          {isTracking && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Tracking Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Details Panel */}
      {selectedVehicleId && showVehicleDetails && (
        <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-40">
          <VehicleDetails
            vehicleId={selectedVehicleId}
            location={vehicleLocations[selectedVehicleId]}
            status={vehicleStatuses[selectedVehicleId]}
            driverName={getDriverName(selectedVehicleId)}
            driverPhone={getDriverPhone(selectedVehicleId)}
            onClose={() => setShowVehicleDetails(false)}
          />
        </div>
      )}

      {/* Quick Actions */}
      {selectedVehicleId && !showVehicleDetails && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 flex space-x-2">
          <button
            onClick={() => setShowVehicleDetails(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            <span>Details</span>
          </button>
          <button
            onClick={() => setSelectedVehicle(null)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span>Close</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default MapView
