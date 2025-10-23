const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = 3001;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}));
app.use(express.json());

// In-memory user storage (replace with MongoDB in production)
let users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@fleet.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vHVxvS', // admin123
    role: 'admin',
    phone: '+1234567890',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Driver User',
    email: 'driver@fleet.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vHVxvS', // driver123
    role: 'driver',
    phone: '+1234567891',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Customer User',
    email: 'customer@fleet.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vHVxvS', // customer123
    role: 'customer',
    phone: '+1234567892',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  }
];

// Helper function to generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '7d', issuer: 'fleet-management-system' }
  );
};

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account has been deactivated'
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Authentication Routes

// POST /api/auth/register
app.post('/api/auth/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'driver', 'customer']).withMessage('Role must be admin, driver, or customer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'customer', phone } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || '',
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account doesn\'t exist, please create an account'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check role if provided
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This account is not registered as ${role}.`
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (in production, store this securely)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    // Simulate OTP for demo purposes
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    console.log(`Password reset email would be sent to ${email} with token: ${resetToken}`);
    console.log(`OTP for password reset: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
      resetToken, 
      otp,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // In a real app, you would validate the token against stored reset tokens
    // For demo purposes, we'll accept any token
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // For demo, just return success
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// GET /api/auth/verify-token
app.get('/api/auth/verify-token', authMiddleware, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Include vehicle tracking routes
try {
  const vehicleTrackingRoutes = require('./routes/vehicleTracking');
  app.use('/api/vehicles', vehicleTrackingRoutes);
} catch (error) {
  console.log('Vehicle tracking routes not found, skipping...');
}

// In-memory storage for real-time tracking
const driverLocations = new Map(); // Store driver locations
const deliveryLocations = new Map(); // Store delivery-specific locations
const activeDeliveries = new Map(); // Track active deliveries

// Socket.IO connection handling with comprehensive real-time tracking
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  // Send current driver locations to newly connected client
  socket.emit('initial-driver-locations', Array.from(driverLocations.values()));
  
  // Handle driver location updates
  socket.on('driver-location-update', (data) => {
    const { driverId, lat, lng, timestamp, heading, speed, accuracy } = data;
    
    // Validate location data
    if (!driverId || lat === undefined || lng === undefined) {
      console.error('❌ Invalid location data received:', data);
      return;
    }
    
    const locationData = {
      driverId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: timestamp || new Date().toISOString(),
      heading: heading || 0,
      speed: speed || 0,
      accuracy: accuracy || 0,
      socketId: socket.id
    };
    
    // Store driver location
    driverLocations.set(driverId, locationData);
    
    // Broadcast to all clients except sender
    socket.broadcast.emit('location-update', locationData);
    
    // Also emit to sender for confirmation
    socket.emit('location-update-confirmed', locationData);
    
    console.log(`📍 Driver ${driverId} location updated: [${lat}, ${lng}]`);
    
    // Update delivery-specific location if driver has active delivery
    const activeDelivery = Array.from(activeDeliveries.values())
      .find(d => d.driverId === driverId);
    
    if (activeDelivery) {
      const deliveryLocationData = {
        deliveryId: activeDelivery.deliveryId,
        driverId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timestamp: timestamp || new Date().toISOString(),
        status: activeDelivery.status,
        heading,
        speed,
        accuracy
      };
      
      deliveryLocations.set(activeDelivery.deliveryId, deliveryLocationData);
      
      // Broadcast delivery-specific location update
      io.emit('delivery-live-location', deliveryLocationData);
      
      console.log(`🚚 Delivery ${activeDelivery.deliveryId} location updated`);
    }
  });
  
  // Handle delivery status updates
  socket.on('delivery-status-update', (data) => {
    const { deliveryId, driverId, status, location, timestamp } = data;
    
    console.log(`📦 Delivery ${deliveryId} status updated to: ${status}`);
    
    // Update active deliveries tracking
    if (['started', 'in-transit', 'arrived'].includes(status)) {
      activeDeliveries.set(deliveryId, {
        deliveryId,
        driverId,
        status,
        startedAt: timestamp || new Date().toISOString()
      });
    } else if (['delivered', 'cancelled'].includes(status)) {
      activeDeliveries.delete(deliveryId);
      deliveryLocations.delete(deliveryId);
    }
    
    // Broadcast status change to all clients
    io.emit('delivery-status-changed', {
      deliveryId,
      driverId,
      status,
      location,
      timestamp: timestamp || new Date().toISOString()
    });
  });
  
  // Handle delivery location updates (specific to a delivery)
  socket.on('delivery-location-update', (data) => {
    const { deliveryId, driverId, location, timestamp, status } = data;
    
    const deliveryLocationData = {
      deliveryId,
      driverId,
      lat: location.lat,
      lng: location.lng,
      timestamp: timestamp || new Date().toISOString(),
      status: status || 'in-transit'
    };
    
    deliveryLocations.set(deliveryId, deliveryLocationData);
    
    // Broadcast to all clients
    io.emit('delivery-live-location', deliveryLocationData);
    
    console.log(`🚚 Delivery ${deliveryId} location: [${location.lat}, ${location.lng}]`);
  });
  
  // Handle driver active location (continuous tracking)
  socket.on('driver-active-location', (data) => {
    const { driverId, location, timestamp } = data;
    
    // Update driver location
    const locationData = {
      driverId,
      lat: location.lat,
      lng: location.lng,
      timestamp: timestamp || new Date().toISOString(),
      socketId: socket.id
    };
    
    driverLocations.set(driverId, locationData);
    
    // Broadcast to all clients
    socket.broadcast.emit('location-update', locationData);
  });
  
  // Handle request for all driver locations
  socket.on('request-driver-locations', () => {
    socket.emit('all-driver-locations', Array.from(driverLocations.values()));
  });
  
  // Handle request for specific delivery location
  socket.on('request-delivery-location', (deliveryId) => {
    const location = deliveryLocations.get(deliveryId);
    if (location) {
      socket.emit('delivery-location-response', location);
    }
  });
  
  // Handle driver going online/offline
  socket.on('driver-status-change', (data) => {
    const { driverId, status } = data;
    console.log(`👤 Driver ${driverId} status changed to: ${status}`);
    
    if (status === 'offline') {
      driverLocations.delete(driverId);
    }
    
    io.emit('driver-status-changed', { driverId, status });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    
    // Clean up driver location if this was a driver's socket
    for (const [driverId, location] of driverLocations.entries()) {
      if (location.socketId === socket.id) {
        console.log(`🔌 Driver ${driverId} disconnected, removing location`);
        // Don't delete immediately, keep last known location
        // driverLocations.delete(driverId);
      }
    }
  });
  
  // Heartbeat to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// API Routes for Data Persistence

// Get all deliveries
app.get('/api/deliveries', (req, res) => {
  try {
    const deliveries = Array.from(deliveriesData.values());
    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deliveries'
    });
  }
});

// Get deliveries for a specific customer
app.get('/api/deliveries/customer/:email', (req, res) => {
  try {
    const customerEmail = req.params.email;
    const customerDeliveries = Array.from(deliveriesData.values()).filter(
      delivery => delivery.customer.email === customerEmail
    );
    res.json({
      success: true,
      data: customerDeliveries
    });
  } catch (error) {
    console.error('Error fetching customer deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer deliveries'
    });
  }
});

// Get deliveries for a specific driver
app.get('/api/deliveries/driver/:driverId', (req, res) => {
  try {
    const driverId = req.params.driverId;
    const driverDeliveries = Array.from(deliveriesData.values()).filter(
      delivery => delivery.driverId === driverId
    );
    res.json({
      success: true,
      data: driverDeliveries
    });
  } catch (error) {
    console.error('Error fetching driver deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver deliveries'
    });
  }
});

// Update delivery status
app.put('/api/deliveries/:id/status', (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { status, driverId, location } = req.body;
    
    if (deliveriesData.has(deliveryId)) {
      const delivery = deliveriesData.get(deliveryId);
      delivery.status = status;
      delivery.updatedAt = new Date().toISOString();
      
      if (driverId) delivery.driverId = driverId;
      if (location) delivery.currentLocation = location;
      
      res.json({
        success: true,
        data: delivery
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery'
    });
  }
});

// Get all drivers
app.get('/api/drivers', (req, res) => {
  try {
    const drivers = Array.from(driversData.values());
    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
});

// Update driver profile
app.put('/api/drivers/:id', (req, res) => {
  try {
    const driverId = req.params.id;
    const updateData = req.body;
    
    if (driversData.has(driverId)) {
      const driver = driversData.get(driverId);
      Object.assign(driver, updateData, { updatedAt: new Date().toISOString() });
      res.json({
        success: true,
        data: driver
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fleet Management API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get user profile
app.get('/api/profile/:email', (req, res) => {
  try {
    const email = req.params.email;
    const user = users.find(u => u.email === email);
    
    if (user) {
      const { password, ...userProfile } = user;
      res.json({
        success: true,
        data: userProfile
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Update user profile
app.put('/api/profile/:email', (req, res) => {
  try {
    const email = req.params.email;
    const updateData = req.body;
    
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date().toISOString() };
      const { password, ...userProfile } = users[userIndex];
      res.json({
        success: true,
        data: userProfile
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
});

// Periodic cleanup of stale locations (older than 5 minutes)
setInterval(() => {
  const now = new Date().getTime();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [driverId, location] of driverLocations.entries()) {
    const locationTime = new Date(location.timestamp).getTime();
    if (now - locationTime > staleThreshold) {
      console.log(`🧹 Removing stale location for driver ${driverId}`);
      driverLocations.delete(driverId);
    }
  }
}, 60000); // Run every minute

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Fleet Management Server running on port ${PORT}`);
  console.log(`📍 Socket.IO server ready for real-time tracking`);
  console.log(`🌐 CORS enabled for http://localhost:5173`);
  console.log(`🔐 Authentication system enabled (In-Memory Mode)`);
  console.log(`📊 Demo users available:`);
  console.log(`   Admin: admin@fleet.com / admin123`);
  console.log(`   Driver: driver@fleet.com / driver123`);
  console.log(`   Customer: customer@fleet.com / customer123`);
});

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
