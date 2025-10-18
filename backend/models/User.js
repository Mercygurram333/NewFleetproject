const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for Fleet Management System
 * Supports role-based authentication (admin, driver, customer)
 * Includes secure password hashing and validation
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'customer'],
    default: 'customer',
    required: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  // Driver-specific fields
  licenseNumber: {
    type: String,
    trim: true
  },
  vehicleAssigned: {
    type: String,
    trim: true
  },
  // Customer-specific fields
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  // Admin-specific fields
  permissions: [{
    type: String,
    enum: ['fleet_management', 'user_management', 'reports', 'settings']
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-save middleware to hash password before saving to database
 * Only runs when password is modified or user is new
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12 (recommended for production)
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to check if provided password matches hashed password
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Compare provided password with hashed password in database
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance method to generate password reset token
 * @returns {string} - Reset token
 */
userSchema.methods.generateResetToken = function() {
  // Generate random token (in production, use crypto.randomBytes)
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  // Set token and expiration (1 hour from now)
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

/**
 * Instance method to generate email verification token
 * @returns {string} - Verification token
 */
userSchema.methods.generateVerificationToken = function() {
  // Generate random token
  const verificationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
  
  // Set token and expiration (24 hours from now)
  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

/**
 * Static method to find user by email (including password for authentication)
 * @param {string} email - User email
 * @returns {Promise<Object>} - User object with password
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

/**
 * Virtual property to get full name
 */
userSchema.virtual('fullName').get(function() {
  return this.name;
});

/**
 * Virtual property to check if user is admin
 */
userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

/**
 * Virtual property to check if user is driver
 */
userSchema.virtual('isDriver').get(function() {
  return this.role === 'driver';
});

/**
 * Virtual property to check if user is customer
 */
userSchema.virtual('isCustomer').get(function() {
  return this.role === 'customer';
});

/**
 * Index for faster email lookups
 */
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

/**
 * Transform function to remove sensitive data when converting to JSON
 */
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  
  return userObject;
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
