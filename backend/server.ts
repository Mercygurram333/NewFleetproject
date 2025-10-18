import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import models
import Delivery from './models/Delivery';
import Vehicle from './models/Vehicle';
import User from './models/User';
import Tracking from './models/Tracking';
import DeliveryLog from './models/DeliveryLog';

// Import utilities
import { ScheduleValidator } from './utils/scheduleValidator';
import { DeliveryLogger } from './services/deliveryLogger';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet-management';

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Store active connections
const activeConnections = new Map();
const driverLocations = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Store connection
  activeConnections.set(socket.id, {
    socketId: socket.id,
    connectedAt: new Date(),
    driverId: null
  });

  // Handle driver location updates
  socket.on('driver-location-update', async (data) => {
    try {
      const { driverId, lat, lng, timestamp, heading } = data;
      
      // Store location in memory
      driverLocations.set(driverId, {
        driverId,
        lat,
        lng,
        timestamp,
        heading,
        socketId: socket.id
      });

      // Save to database
      await Tracking.create({
        driverId: new mongoose.Types.ObjectId(driverId),
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        timestamp: new Date(timestamp),
        heading,
        speed: 0 // Could be calculated from previous locations
      });

      // Broadcast to all connected clients
      socket.broadcast.emit('location-update', {
        driverId,
        lat,
        lng,
        timestamp,
        heading
      });

      console.log(`Location update from driver ${driverId}:`, { lat, lng });
    } catch (error) {
      console.error('Error handling location update:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle delivery status updates
  socket.on('delivery-status-update', async (data) => {
    try {
      const { deliveryId, status, driverId, timestamp, location } = data;
      
      // Get current delivery status for logging
      const currentDelivery = await Delivery.findById(deliveryId);
      const previousStatus = currentDelivery?.status;
      
      // Update delivery status in database
      const delivery = await Delivery.findByIdAndUpdate(
        deliveryId,
        { 
          status,
          [`${status}At`]: new Date(timestamp)
        },
        { new: true }
      );

      if (delivery) {
        // Log the status change
        await DeliveryLogger.logStatusChange(
          deliveryId,
          driverId,
          previousStatus || 'unknown',
          status,
          location,
          undefined, // notes
          socket.handshake.address,
          socket.handshake.headers['user-agent']
        );

        // Broadcast status update to all clients
        io.emit('delivery-status-changed', {
          deliveryId,
          status,
          driverId,
          timestamp,
          location
        });

        console.log(`Delivery ${deliveryId} status updated to ${status}`);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      socket.emit('error', { message: 'Failed to update delivery status' });
    }
  });

  // Handle delivery-specific location updates
  socket.on('delivery-location-update', async (data) => {
    try {
      const { deliveryId, driverId, location, timestamp, status } = data;
      
      // Broadcast to customers tracking this specific delivery
      socket.broadcast.emit('delivery-live-location', {
        deliveryId,
        driverId,
        location,
        timestamp,
        status
      });

      console.log(`Live location update for delivery ${deliveryId}:`, location);
    } catch (error) {
      console.error('Error handling delivery location update:', error);
    }
  });

  // Handle active driver location for all deliveries
  socket.on('driver-active-location', async (data) => {
    try {
      const { driverId, location, timestamp } = data;
      
      // Find active deliveries for this driver
      const activeDeliveries = await Delivery.find({
        driver: new mongoose.Types.ObjectId(driverId),
        status: { $in: ['started', 'in-transit', 'arrived'] }
      });

      // Broadcast location to customers of active deliveries
      activeDeliveries.forEach(delivery => {
        socket.broadcast.emit('delivery-live-location', {
          deliveryId: delivery._id,
          driverId,
          location,
          timestamp,
          status: delivery.status
        });
      });

      console.log(`Active driver ${driverId} location broadcasted to ${activeDeliveries.length} deliveries`);
    } catch (error) {
      console.error('Error handling active driver location:', error);
    }
  });

  // Handle driver connection
  socket.on('driver-connect', (driverId) => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.driverId = driverId;
      activeConnections.set(socket.id, connection);
    }
    
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} connected`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const connection = activeConnections.get(socket.id);
    if (connection && connection.driverId) {
      // Remove driver location when they disconnect
      driverLocations.delete(connection.driverId);
      socket.leave(`driver-${connection.driverId}`);
    }
    
    activeConnections.delete(socket.id);
  });
});

// API Routes

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connections: activeConnections.size,
    drivers: driverLocations.size
  });
});

// Get all driver locations
app.get('/api/locations', (req: Request, res: Response) => {
  const locations = Array.from(driverLocations.values());
  res.json(locations);
});

// Get specific driver location
app.get('/api/locations/:driverId', (req: Request, res: Response) => {
  const { driverId } = req.params;
  const location = driverLocations.get(driverId);
  
  if (location) {
    res.json(location);
  } else {
    res.status(404).json({ message: 'Driver location not found' });
  }
});

// Get delivery tracking history
app.get('/api/deliveries/:deliveryId/tracking', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery || !delivery.driver) {
      return res.status(404).json({ message: 'Delivery or driver not found' });
    }

    const trackingHistory = await Tracking.find({
      driverId: delivery.driver,
      timestamp: {
        $gte: delivery.startedAt || delivery.createdAt,
        $lte: delivery.completedAt || new Date()
      }
    }).sort({ timestamp: 1 });

    res.json(trackingHistory);
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update delivery status (REST endpoint)
app.put('/api/deliveries/:deliveryId/status', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const { status, driverId, notes } = req.body;

    const updateData: any = { status };
    
    // Set timestamp based on status
    switch (status) {
      case 'accepted':
        updateData.acceptedAt = new Date();
        break;
      case 'started':
        updateData.startedAt = new Date();
        break;
      case 'in-transit':
        // No specific timestamp for in-transit
        break;
      case 'arrived':
        updateData.arrivedAt = new Date();
        break;
      case 'delivered':
        updateData.completedAt = new Date();
        if (notes) updateData.notes = notes;
        break;
      case 'rejected':
        updateData.rejectedAt = new Date();
        if (notes) updateData.rejectionReason = notes;
        break;
    }

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      updateData,
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Broadcast status change via socket
    io.emit('delivery-status-changed', {
      deliveryId,
      status,
      driverId,
      timestamp: new Date().toISOString()
    });

    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get active drivers
app.get('/api/drivers/active', (req: Request, res: Response) => {
  const activeDrivers = Array.from(driverLocations.keys());
  res.json(activeDrivers);
});

// Emergency broadcast to all drivers
app.post('/api/broadcast/emergency', (req: Request, res: Response) => {
  const { message, type = 'emergency' } = req.body;
  
  io.emit('emergency-broadcast', {
    message,
    type,
    timestamp: new Date().toISOString()
  });
  
  res.json({ message: 'Emergency broadcast sent', recipients: activeConnections.size });
});

// Schedule validation endpoints

// Validate delivery schedule
app.post('/api/schedule/validate', async (req: Request, res: Response) => {
  try {
    const { driverId, pickupTime, deliveryTime, estimatedTravelTime } = req.body;

    if (!driverId || !pickupTime || !deliveryTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: driverId, pickupTime, deliveryTime' 
      });
    }

    const validation = await ScheduleValidator.validateDeliverySchedule(
      driverId,
      new Date(pickupTime),
      new Date(deliveryTime),
      estimatedTravelTime
    );

    res.json(validation);
  } catch (error) {
    console.error('Error validating schedule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get alternative time slots
app.post('/api/schedule/alternatives', async (req: Request, res: Response) => {
  try {
    const { driverId, preferredPickupTime, estimatedTravelTime, maxSuggestions } = req.body;

    if (!driverId || !preferredPickupTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: driverId, preferredPickupTime' 
      });
    }

    const alternatives = await ScheduleValidator.suggestAlternativeTimeSlots(
      driverId,
      new Date(preferredPickupTime),
      estimatedTravelTime || 30,
      maxSuggestions || 5
    );

    res.json({ alternatives });
  } catch (error) {
    console.error('Error getting alternative time slots:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver availability
app.get('/api/drivers/:driverId/availability/:date', async (req: Request, res: Response) => {
  try {
    const { driverId, date } = req.params;

    const availability = await ScheduleValidator.getDriverAvailability(
      driverId,
      new Date(date)
    );

    res.json(availability);
  } catch (error) {
    console.error('Error getting driver availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check workload limits
app.get('/api/drivers/:driverId/workload/:date', async (req: Request, res: Response) => {
  try {
    const { driverId, date } = req.params;

    const workload = await ScheduleValidator.validateWorkloadLimits(
      driverId,
      new Date(date)
    );

    res.json(workload);
  } catch (error) {
    console.error('Error checking workload limits:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Enhanced delivery creation with schedule validation
app.post('/api/deliveries/create-with-validation', async (req: Request, res: Response) => {
  try {
    const { 
      pickup, 
      delivery, 
      customer, 
      package: packageInfo, 
      driverId, 
      estimatedTravelTime 
    } = req.body;

    // Validate required fields
    if (!pickup?.address || !delivery?.address || !customer?.name) {
      return res.status(400).json({ 
        message: 'Missing required delivery information' 
      });
    }

    // If driver and scheduled times are provided, validate schedule
    if (driverId && pickup.scheduledTime && delivery.scheduledTime) {
      const validation = await ScheduleValidator.validateDeliverySchedule(
        driverId,
        new Date(pickup.scheduledTime),
        new Date(delivery.scheduledTime),
        estimatedTravelTime
      );

      if (!validation.isValid) {
        // Get alternative time slots
        const alternatives = await ScheduleValidator.suggestAlternativeTimeSlots(
          driverId,
          new Date(pickup.scheduledTime),
          estimatedTravelTime || 30
        );

        return res.status(409).json({
          message: 'Schedule conflict detected',
          conflicts: validation.conflicts,
          alternatives
        });
      }

      // Check workload limits
      const workload = await ScheduleValidator.validateWorkloadLimits(
        driverId,
        new Date(pickup.scheduledTime)
      );

      if (!workload.isWithinLimits) {
        return res.status(409).json({
          message: 'Driver workload limit exceeded',
          currentWorkload: workload.currentWorkload,
          maxWorkload: workload.maxWorkload
        });
      }
    }

    // Create the delivery
    const newDelivery = await Delivery.create({
      pickup: {
        address: pickup.address,
        coordinates: pickup.coordinates,
        scheduledTime: pickup.scheduledTime ? new Date(pickup.scheduledTime) : undefined
      },
      delivery: {
        address: delivery.address,
        coordinates: delivery.coordinates,
        scheduledTime: delivery.scheduledTime ? new Date(delivery.scheduledTime) : undefined
      },
      customer,
      package: packageInfo,
      driver: driverId ? new mongoose.Types.ObjectId(driverId) : undefined,
      status: driverId ? 'assigned' : 'pending',
      estimatedTime: estimatedTravelTime,
      createdAt: new Date()
    });

    // Broadcast new delivery to relevant clients
    if (driverId) {
      io.to(`driver-${driverId}`).emit('new-delivery-assigned', {
        deliveryId: newDelivery._id,
        delivery: newDelivery
      });
    }

    io.emit('delivery-created', {
      deliveryId: newDelivery._id,
      delivery: newDelivery
    });

    res.status(201).json({
      message: 'Delivery created successfully',
      delivery: newDelivery,
      scheduleValidation: driverId ? 'validated' : 'not_required'
    });

  } catch (error) {
    console.error('Error creating delivery with validation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delivery logging and analytics endpoints

// Get delivery timeline
app.get('/api/deliveries/:deliveryId/timeline', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const timeline = await DeliveryLogger.getDeliveryTimeline(deliveryId);
    res.json(timeline);
  } catch (error) {
    console.error('Error fetching delivery timeline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver activity logs
app.get('/api/drivers/:driverId/activity', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const activity = await DeliveryLogger.getDriverActivity(
      driverId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      limit ? parseInt(limit as string) : 100
    );
    
    res.json(activity);
  } catch (error) {
    console.error('Error fetching driver activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get delivery analytics
app.get('/api/analytics/deliveries', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, driverId } = req.query;
    
    const analytics = await DeliveryLogger.getDeliveryAnalytics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      driverId as string
    );
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching delivery analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get location history for a delivery
app.get('/api/deliveries/:deliveryId/location-history', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const { startTime, endTime } = req.query;
    
    const locationHistory = await DeliveryLogger.getLocationHistory(
      deliveryId,
      startTime ? new Date(startTime as string) : undefined,
      endTime ? new Date(endTime as string) : undefined
    );
    
    res.json(locationHistory);
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get real-time delivery statistics
app.get('/api/analytics/realtime', async (req: Request, res: Response) => {
  try {
    const stats = await DeliveryLogger.getRealTimeStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manual log cleanup endpoint (admin only)
app.post('/api/admin/cleanup-logs', async (req: Request, res: Response) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const deletedCount = await DeliveryLogger.cleanupOldLogs(daysToKeep);
    
    res.json({
      message: 'Log cleanup completed',
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Fleet Management Server running on port ${PORT}`);
      console.log(`📍 Socket.IO server ready for real-time tracking`);
      console.log(`🗄️  Database connected to ${MONGODB_URI}`);
      console.log(`🌐 CORS enabled for ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;
