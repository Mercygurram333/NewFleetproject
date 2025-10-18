const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Updated port to match frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = 3001;

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Updated port to match frontend
  credentials: true
}));
app.use(express.json());

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import and use routes
const vehicleTrackingRoutes = require('./routes/vehicleTracking');
const authRoutes = require('./routes/auth');

app.use('/api/vehicles', vehicleTrackingRoutes);
app.use('/api/auth', authRoutes);

// Store active connections and driver locations
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
  socket.on('driver-location-update', (data) => {
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
    }
  });

  // Handle delivery status updates
  socket.on('delivery-status-update', (data) => {
    try {
      const { deliveryId, status, driverId, timestamp, location } = data;
      
      // Broadcast status update to all clients
      io.emit('delivery-status-changed', {
        deliveryId,
        status,
        driverId,
        timestamp,
        location
      });

      console.log(`Delivery ${deliveryId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  });

  // Handle delivery-specific location updates
  socket.on('delivery-location-update', (data) => {
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
  socket.on('driver-active-location', (data) => {
    try {
      const { driverId, location, timestamp } = data;
      
      // Broadcast location to all customers (simplified without DB lookup)
      socket.broadcast.emit('delivery-live-location', {
        deliveryId: 'active',
        driverId,
        location,
        timestamp,
        status: 'active'
      });

      console.log(`Active driver ${driverId} location broadcasted`);
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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connections: activeConnections.size,
    drivers: driverLocations.size
  });
});

// Get all driver locations
app.get('/api/locations', (req, res) => {
  const locations = Array.from(driverLocations.values());
  res.json(locations);
});

// Get specific driver location
app.get('/api/locations/:driverId', (req, res) => {
  const { driverId } = req.params;
  const location = driverLocations.get(driverId);
  
  if (location) {
    res.json(location);
  } else {
    res.status(404).json({ message: 'Driver location not found' });
  }
});

// Emergency broadcast to all drivers
app.post('/api/broadcast/emergency', (req, res) => {
  const { message, type = 'emergency' } = req.body;
  
  io.emit('emergency-broadcast', {
    message,
    type,
    timestamp: new Date().toISOString()
  });
  
  res.json({ message: 'Emergency broadcast sent', recipients: activeConnections.size });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Fleet Management Server running on port ${PORT}`);
      console.log(`📍 Socket.IO server ready for real-time tracking`);
      console.log(`🌐 CORS enabled for http://localhost:5173`);
      console.log(`🔐 Authentication system enabled`);
      console.log(`📊 MongoDB connected and ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
