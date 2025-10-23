import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

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

// In-memory storage for demo (since no MongoDB)
interface Delivery {
  _id: string;
  pickup: {
    address: string;
    coordinates?: [number, number];
    scheduledTime?: Date;
  };
  delivery: {
    address: string;
    coordinates?: [number, number];
    scheduledTime?: Date;
  };
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  package?: {
    weight?: number;
    dimensions?: string;
    description?: string;
  };
  driver?: string;
  status: 'pending' | 'assigned' | 'accepted' | 'started' | 'in-transit' | 'arrived' | 'delivered' | 'rejected';
  estimatedTime?: number;
  acceptedAt?: Date;
  startedAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  notes?: string;
  rejectionReason?: string;
  createdAt: Date;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleId?: string;
  status: 'available' | 'busy' | 'offline';
}

interface Tracking {
  _id: string;
  driverId: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  timestamp: Date;
  heading?: number;
  speed?: number;
}

interface DeliveryLog {
  _id: string;
  deliveryId: string;
  driverId?: string;
  previousStatus: string;
  newStatus: string;
  location?: [number, number];
  notes?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory storage
const deliveries: Map<string, Delivery> = new Map();
const drivers: Map<string, Driver> = new Map();
const tracking: Map<string, Tracking> = new Map();
const deliveryLogs: Map<string, DeliveryLog> = new Map();

// Store active connections
const activeConnections = new Map();
const driverLocations = new Map();

// Utility functions for in-memory storage
const generateId = () => Math.random().toString(36).substr(2, 9);

const findDeliveryById = (id: string): Delivery | undefined => deliveries.get(id);
const findDriverById = (id: string): Driver | undefined => drivers.get(id);
const findTrackingByDriver = (driverId: string): Tracking[] =>
  Array.from(tracking.values()).filter(t => t.driverId === driverId);

// Initialize demo data
const initializeDemoDataOriginal = () => {
  // Demo drivers
  const demoDrivers: Driver[] = [
    {
      _id: 'driver1',
      name: 'John Smith',
      email: 'driver@fleet.com',
      phone: '+1234567890',
      status: 'available'
    },
    {
      _id: 'driver2',
      name: 'Sarah Johnson',
      email: 'sarah@fleet.com',
      phone: '+1234567891',
      status: 'available'
    }
  ];

  demoDrivers.forEach(driver => drivers.set(driver._id, driver));

  // Demo deliveries
  const demoDeliveries: Delivery[] = [
    {
      _id: 'delivery1',
      pickup: {
        address: 'Gachibowli, Hyderabad',
        coordinates: [17.440495, 78.348684]
      },
      delivery: {
        address: 'Madhapur, Hyderabad',
        coordinates: [17.448378, 78.391670]
      },
      customer: {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        phone: '+1234567892'
      },
      package: {
        weight: 2.5,
        dimensions: '30x20x10 cm',
        description: 'Electronics'
      },
      driver: 'driver1',
      status: 'in-transit',
      estimatedTime: 30,
      createdAt: new Date()
    },
    {
      _id: 'delivery2',
      pickup: {
        address: 'Hitech City, Hyderabad',
        coordinates: [17.443464, 78.499729]
      },
      delivery: {
        address: 'Secunderabad, Hyderabad',
        coordinates: [17.443464, 78.499729]
      },
      customer: {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1234567893'
      },
      package: {
        weight: 1.2,
        dimensions: '25x15x8 cm',
        description: 'Documents'
      },
      driver: 'driver2',
      status: 'started',
      estimatedTime: 25,
      createdAt: new Date()
    }
  ];

  demoDeliveries.forEach(delivery => deliveries.set(delivery._id, delivery));

  console.log('✅ Demo data initialized');
};

const initializeAuthDemoData = () => {
  const demoUsers: User[] = [
    {
      _id: 'admin1',
      name: 'Admin User',
      email: 'admin@fleet.com',
      role: 'admin',
      phone: '+1234567890',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'driver1',
      name: 'Driver User',
      email: 'driver@fleet.com',
      role: 'driver',
      phone: '+1234567891',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'customer1',
      name: 'Customer User',
      email: 'customer@fleet.com',
      role: 'customer',
      phone: '+1234567892',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    }
  ];

  const demoPasswords = [
    { email: 'admin@fleet.com', password: 'admin123' },
    { email: 'driver@fleet.com', password: 'driver123' },
    { email: 'customer@fleet.com', password: 'customer123' }
  ];

  demoUsers.forEach(user => users.set(user._id, user));
  demoPasswords.forEach(({ email, password }) => userPasswords.set(email, password));

  console.log('✅ Authentication demo data initialized');
};

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

      // Save to in-memory tracking
      const trackingId = generateId();
      tracking.set(trackingId, {
        _id: trackingId,
        driverId,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        timestamp: new Date(timestamp),
        heading,
        speed: 0
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

      const delivery = findDeliveryById(deliveryId);
      if (!delivery) {
        socket.emit('error', { message: 'Delivery not found' });
        return;
      }

      const previousStatus = delivery.status;

      // Update delivery status in memory
      delivery.status = status;
      const now = new Date(timestamp);

      switch (status) {
        case 'accepted':
          delivery.acceptedAt = now;
          break;
        case 'started':
          delivery.startedAt = now;
          break;
        case 'arrived':
          delivery.arrivedAt = now;
          break;
        case 'delivered':
          delivery.completedAt = now;
          break;
        case 'rejected':
          delivery.rejectedAt = now;
          break;
      }

      deliveries.set(deliveryId, delivery);

      // Log the status change
      const logId = generateId();
      deliveryLogs.set(logId, {
        _id: logId,
        deliveryId,
        driverId,
        previousStatus,
        newStatus: status,
        location,
        timestamp: now,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

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
      const activeDeliveries = Array.from(deliveries.values()).filter(d =>
        d.driver === driverId &&
        ['started', 'in-transit', 'arrived'].includes(d.status)
      );

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
    drivers: driverLocations.size,
    mode: 'demo' // Indicate we're running in demo mode
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

    const delivery = findDeliveryById(deliveryId);
    if (!delivery || !delivery.driver) {
      return res.status(404).json({ message: 'Delivery or driver not found' });
    }

    const trackingHistory = findTrackingByDriver(delivery.driver);

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

    const delivery = findDeliveryById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const previousStatus = delivery.status;
    const now = new Date();

    // Update delivery status in memory
    delivery.status = status;

    switch (status) {
      case 'accepted':
        delivery.acceptedAt = now;
        break;
      case 'started':
        delivery.startedAt = now;
        break;
      case 'arrived':
        delivery.arrivedAt = now;
        break;
      case 'delivered':
        delivery.completedAt = now;
        if (notes) delivery.notes = notes;
        break;
      case 'rejected':
        delivery.rejectedAt = now;
        if (notes) delivery.rejectionReason = notes;
        break;
    }

    deliveries.set(deliveryId, delivery);

    // Log the status change
    const logId = generateId();
    deliveryLogs.set(logId, {
      _id: logId,
      deliveryId,
      driverId,
      previousStatus,
      newStatus: status,
      timestamp: now
    });

    // Broadcast status change via socket
    io.emit('delivery-status-changed', {
      deliveryId,
      status,
      driverId,
      timestamp: now.toISOString()
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

// Get all deliveries (demo endpoint)
app.get('/api/deliveries', (req: Request, res: Response) => {
  const allDeliveries = Array.from(deliveries.values());
  res.json(allDeliveries);
});

// Get all drivers (demo endpoint)
app.get('/api/drivers', (req: Request, res: Response) => {
  const allDrivers = Array.from(drivers.values());
  res.json(allDrivers);
});

// Create new delivery (demo endpoint)
app.post('/api/deliveries', (req: Request, res: Response) => {
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

    // Create the delivery
    const newDelivery: Delivery = {
      _id: generateId(),
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
      driver: driverId,
      status: driverId ? 'assigned' : 'pending',
      estimatedTime: estimatedTravelTime,
      createdAt: new Date()
    };

    deliveries.set(newDelivery._id, newDelivery);

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
      delivery: newDelivery
    });

  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add authentication endpoints before API Routes section

// Authentication endpoints

// Register endpoint
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = Object.values(users).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const userId = generateId();
    const newUser: User = {
      _id: userId,
      name,
      email,
      role: role || 'customer',
      phone,
      isActive: true,
      isEmailVerified: true, // Demo mode - auto-verify
      createdAt: new Date().toISOString()
    };

    // Store password separately (in real app, this would be hashed)
    userPasswords.set(email, password);
    users.set(userId, newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = Object.values(users).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const storedPassword = userPasswords.get(email);
    if (password !== storedPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check role if specified
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid role for this account'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: user,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
app.get('/api/auth/verify-token', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any;

    // Find user
    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = Object.values(users).find(u => u.email === email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token (in real app, send email)
    const resetToken = generateId();
    passwordResetTokens.set(email, {
      token: resetToken,
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Find reset token
    let email: string | undefined;
    for (const [userEmail, resetData] of passwordResetTokens.entries()) {
      if (resetData.token === token && resetData.expires > Date.now()) {
        email = userEmail;
        break;
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    userPasswords.set(email, password);

    // Remove reset token
    passwordResetTokens.delete(email);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add missing interfaces and storage
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver' | 'customer';
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface PasswordResetToken {
  token: string;
  expires: number;
}

// In-memory storage for users and passwords
const users: Map<string, User> = new Map();
const userPasswords: Map<string, string> = new Map();
const passwordResetTokens: Map<string, PasswordResetToken> = new Map();

// Initialize demo users
const initializeAuthDemoData = () => {
  const demoUsers: User[] = [
    {
      _id: 'admin1',
      name: 'Admin User',
      email: 'admin@fleet.com',
      role: 'admin',
      phone: '+1234567890',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'driver1',
      name: 'Driver User',
      email: 'driver@fleet.com',
      role: 'driver',
      phone: '+1234567891',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'customer1',
      name: 'Customer User',
      email: 'customer@fleet.com',
      role: 'customer',
      phone: '+1234567892',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    }
  ];

  const demoPasswords = [
    { email: 'admin@fleet.com', password: 'admin123' },
    { email: 'driver@fleet.com', password: 'driver123' },
    { email: 'customer@fleet.com', password: 'customer123' }
  ];

  demoUsers.forEach(user => users.set(user._id, user));
  demoPasswords.forEach(({ email, password }) => userPasswords.set(email, password));

  console.log('✅ Authentication demo data initialized');
};

// Add to initializeDemoData function
const originalInitializeDemoData = initializeDemoData;
initializeDemoData = () => {
  originalInitializeDemoData();
  initializeAuthDemoData();
};

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

// Initialize demo data and start server
const startServer = async () => {
  try {
    // Initialize demo data
    initializeDemoData();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Fleet Management Server running on port ${PORT}`);
      console.log(`📍 Socket.IO server ready for real-time tracking`);
      console.log(`🗄️  Running in DEMO mode (in-memory storage)`);
      console.log(`🌐 CORS enabled for ${process.env.CLIENT_URL || "http://localhost:5173"}`);
      console.log(`📋 Demo accounts available:`);
      console.log(`   Admin: admin@fleet.com / admin123`);
      console.log(`   Driver: driver@fleet.com / driver123`);
      console.log(`   Customer: customer@fleet.com / customer123`);
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
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;
