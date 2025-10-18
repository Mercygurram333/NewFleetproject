import mongoose, { Document, Schema } from 'mongoose';

export interface ITracking extends Document {
  driverId: mongoose.Types.ObjectId;
  deliveryId?: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  heading?: number; // Direction in degrees (0-360)
  speed?: number; // Speed in km/h
  accuracy?: number; // GPS accuracy in meters
  timestamp: Date;
  createdAt: Date;
}

const trackingSchema = new Schema<ITracking>({
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver reference is required']
  },
  deliveryId: {
    type: Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords: number[]) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;    // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  },
  heading: {
    type: Number,
    min: [0, 'Heading must be between 0 and 360'],
    max: [360, 'Heading must be between 0 and 360']
  },
  speed: {
    type: Number,
    min: [0, 'Speed cannot be negative']
  },
  accuracy: {
    type: Number,
    min: [0, 'Accuracy cannot be negative']
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for better query performance
trackingSchema.index({ deliveryId: 1, timestamp: -1 });
trackingSchema.index({ driverId: 1, timestamp: -1 });
trackingSchema.index({ timestamp: -1 });

// Compound index for real-time queries
trackingSchema.index({ deliveryId: 1, driverId: 1, timestamp: -1 });

// TTL index to automatically delete old tracking data after 30 days
trackingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Geospatial index for location-based queries
trackingSchema.index({ location: '2dsphere' });

export default mongoose.model<ITracking>('Tracking', trackingSchema);
