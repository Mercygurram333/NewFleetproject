const express = require('express')
const router = express.Router()

// In-memory storage for vehicle locations (replace with database in production)
let vehicleLocations = new Map()
let vehicleStatuses = new Map()

// Initialize with sample data
const initializeSampleData = () => {
  // Sample vehicle locations (Mumbai area)
  const sampleLocations = [
    {
      id: '1',
      vehicleId: 'VH001',
      driverId: 'DR001',
      latitude: 19.0760,
      longitude: 72.8777,
      timestamp: new Date().toISOString(),
      speed: 45,
      heading: 90,
      accuracy: 8
    },
    {
      id: '2',
      vehicleId: 'VH002',
      driverId: 'DR002',
      latitude: 19.0896,
      longitude: 72.8656,
      timestamp: new Date().toISOString(),
      speed: 32,
      heading: 180,
      accuracy: 6
    },
    {
      id: '3',
      vehicleId: 'VH003',
      driverId: 'DR003',
      latitude: 19.0544,
      longitude: 72.8324,
      timestamp: new Date().toISOString(),
      speed: 0,
      heading: 0,
      accuracy: 5
    }
  ]

  // Sample vehicle statuses
  const sampleStatuses = [
    {
      id: '1',
      vehicleId: 'VH001',
      status: 'On Delivery',
      lastUpdate: new Date().toISOString(),
      currentDeliveryId: 'DEL001',
      estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(),
      route: {
        origin: { lat: 19.0760, lng: 72.8777 },
        destination: { lat: 19.0896, lng: 72.8656 },
        waypoints: [],
        distance: '5.2 km',
        duration: '18 mins'
      }
    },
    {
      id: '2',
      vehicleId: 'VH002',
      status: 'Active',
      lastUpdate: new Date().toISOString()
    },
    {
      id: '3',
      vehicleId: 'VH003',
      status: 'Idle',
      lastUpdate: new Date().toISOString()
    }
  ]

  // Initialize data
  sampleLocations.forEach(location => {
    vehicleLocations.set(location.vehicleId, location)
  })

  sampleStatuses.forEach(status => {
    vehicleStatuses.set(status.vehicleId, status)
  })
}

// Initialize sample data
initializeSampleData()

// GET /api/vehicles/locations - Get all vehicle locations
router.get('/locations', (req, res) => {
  try {
    const locations = Array.from(vehicleLocations.values())
    res.json({
      success: true,
      data: locations,
      count: locations.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle locations',
      error: error.message
    })
  }
})

// GET /api/vehicles/statuses - Get all vehicle statuses
router.get('/statuses', (req, res) => {
  try {
    const statuses = Array.from(vehicleStatuses.values())
    res.json({
      success: true,
      data: statuses,
      count: statuses.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle statuses',
      error: error.message
    })
  }
})

// GET /api/vehicles/:vehicleId/location - Get specific vehicle location
router.get('/:vehicleId/location', (req, res) => {
  try {
    const { vehicleId } = req.params
    const location = vehicleLocations.get(vehicleId)
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle location not found'
      })
    }

    res.json({
      success: true,
      data: location
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle location',
      error: error.message
    })
  }
})

// POST /api/vehicles/:vehicleId/location - Update vehicle location
router.post('/:vehicleId/location', (req, res) => {
  try {
    const { vehicleId } = req.params
    const { latitude, longitude, speed, heading, accuracy } = req.body

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      })
    }

    const locationUpdate = {
      id: Date.now().toString(),
      vehicleId,
      driverId: req.body.driverId || 'unknown',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed) || 0,
      heading: parseFloat(heading) || 0,
      accuracy: parseFloat(accuracy) || 10,
      timestamp: new Date().toISOString()
    }

    // Update location
    vehicleLocations.set(vehicleId, locationUpdate)

    // Emit real-time update via Socket.IO
    if (req.io) {
      req.io.emit('vehicle-location-update', locationUpdate)
    }

    res.json({
      success: true,
      message: 'Vehicle location updated successfully',
      data: locationUpdate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle location',
      error: error.message
    })
  }
})

// POST /api/vehicles/:vehicleId/status - Update vehicle status
router.post('/:vehicleId/status', (req, res) => {
  try {
    const { vehicleId } = req.params
    const { status, currentDeliveryId, estimatedArrival, route } = req.body

    // Validate status
    const validStatuses = ['Active', 'Idle', 'On Delivery', 'Maintenance', 'Offline']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      })
    }

    const statusUpdate = {
      id: Date.now().toString(),
      vehicleId,
      status,
      lastUpdate: new Date().toISOString(),
      currentDeliveryId: currentDeliveryId || null,
      estimatedArrival: estimatedArrival || null,
      route: route || null
    }

    // Update status
    vehicleStatuses.set(vehicleId, statusUpdate)

    // Emit real-time update via Socket.IO
    if (req.io) {
      req.io.emit('vehicle-status-update', statusUpdate)
    }

    res.json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: statusUpdate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle status',
      error: error.message
    })
  }
})

// GET /api/vehicles/analytics - Get vehicle analytics
router.get('/analytics', (req, res) => {
  try {
    const statuses = Array.from(vehicleStatuses.values())
    const locations = Array.from(vehicleLocations.values())

    const analytics = {
      total: statuses.length,
      byStatus: {
        active: statuses.filter(v => v.status === 'Active').length,
        idle: statuses.filter(v => v.status === 'Idle').length,
        onDelivery: statuses.filter(v => v.status === 'On Delivery').length,
        maintenance: statuses.filter(v => v.status === 'Maintenance').length,
        offline: statuses.filter(v => v.status === 'Offline').length
      },
      utilization: {
        active: Math.round((statuses.filter(v => ['Active', 'On Delivery'].includes(v.status)).length / statuses.length) * 100),
        available: Math.round((statuses.filter(v => ['Active', 'Idle'].includes(v.status)).length / statuses.length) * 100)
      },
      averageSpeed: Math.round(locations.reduce((sum, loc) => sum + loc.speed, 0) / locations.length),
      lastUpdate: new Date().toISOString()
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    })
  }
})

// POST /api/vehicles/simulate - Start/stop simulation
router.post('/simulate', (req, res) => {
  try {
    const { action } = req.body // 'start' or 'stop'
    
    if (action === 'start') {
      // Start simulation for active vehicles
      const activeVehicles = Array.from(vehicleStatuses.values())
        .filter(v => ['Active', 'On Delivery'].includes(v.status))

      activeVehicles.forEach(vehicle => {
        // Simulate movement every 3 seconds
        const interval = setInterval(() => {
          const currentLocation = vehicleLocations.get(vehicle.vehicleId)
          if (currentLocation) {
            // Simulate movement with random GPS coordinates
            const latVariation = (Math.random() - 0.5) * 0.001 // ~100m variation
            const lngVariation = (Math.random() - 0.5) * 0.001
            const speedVariation = Math.random() * 20 + 30 // 30-50 km/h
            const headingVariation = Math.random() * 360

            const newLocation = {
              ...currentLocation,
              latitude: currentLocation.latitude + latVariation,
              longitude: currentLocation.longitude + lngVariation,
              speed: speedVariation,
              heading: headingVariation,
              timestamp: new Date().toISOString(),
              accuracy: Math.random() * 10 + 5 // 5-15m accuracy
            }

            vehicleLocations.set(vehicle.vehicleId, newLocation)

            // Emit real-time update
            if (req.io) {
              req.io.emit('vehicle-location-update', newLocation)
            }
          }
        }, 3000)

        // Store interval for cleanup (in production, use proper storage)
        global.vehicleSimulationIntervals = global.vehicleSimulationIntervals || new Map()
        global.vehicleSimulationIntervals.set(vehicle.vehicleId, interval)
      })

      res.json({
        success: true,
        message: `Simulation started for ${activeVehicles.length} vehicles`
      })
    } else if (action === 'stop') {
      // Stop all simulations
      if (global.vehicleSimulationIntervals) {
        global.vehicleSimulationIntervals.forEach(interval => clearInterval(interval))
        global.vehicleSimulationIntervals.clear()
      }

      res.json({
        success: true,
        message: 'Simulation stopped for all vehicles'
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Use "start" or "stop"'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to control simulation',
      error: error.message
    })
  }
})

module.exports = router
