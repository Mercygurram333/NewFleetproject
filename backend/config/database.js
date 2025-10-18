const mongoose = require('mongoose');

/**
 * MongoDB Connection Configuration
 * Handles database connection with proper error handling and options
 */

// MongoDB connection string (use environment variable in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet-management';

/**
 * Connect to MongoDB database
 * @returns {Promise} - Connection promise
 */
const connectDB = async () => {
  try {
    // Connection options for better performance and reliability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    
    // Log connection status
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during MongoDB disconnection:', error);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Check if MongoDB is connected
 * @returns {boolean} - Connection status
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get connection status string
 * @returns {string} - Connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Close database connection
 * @returns {Promise} - Disconnection promise
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
};

/**
 * Drop database (use with caution - for testing only)
 * @returns {Promise} - Drop promise
 */
const dropDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }
    
    await mongoose.connection.dropDatabase();
    console.log('🗑️ Database dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping database:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  dropDatabase,
  isConnected,
  getConnectionStatus,
  MONGODB_URI
};
