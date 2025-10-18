import mongoose, { Document, Schema } from 'mongoose';

export interface IDelivery extends Document {
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoffLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  customer: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  vehicle?: mongoose.Types.ObjectId;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  actualTime?: number; // in minutes
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  route?: {
    distance: number; // in km
    duration: number; // in minutes
    waypoints: Array<{
      lat: number;
      lng: number;
      timestamp: Date;
    }>;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>({
  pickupLocation: {
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true
    },
    lat: {
      type: Number,
      required: [true, 'Pickup latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      required: [true, 'Pickup longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  dropoffLocation: {
    address: {
      type: String,
      required: [true, 'Dropoff address is required'],
      trim: true
    },
    lat: {
      type: Number,
      required: [true, 'Dropoff latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      required: [true, 'Dropoff longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: [1, 'Estimated time must be greater than 0']
  },
  actualTime: {
    type: Number,
    min: [0, 'Actual time cannot be negative']
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  route: {
    distance: {
      type: Number,
      min: [0, 'Distance cannot be negative']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    waypoints: [{
      lat: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
deliverySchema.index({ customer: 1 });
deliverySchema.index({ driver: 1 });
deliverySchema.index({ vehicle: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ scheduledAt: 1 });
deliverySchema.index({ priority: 1 });
deliverySchema.index({ createdAt: -1 });

// Compound indexes for common queries
deliverySchema.index({ driver: 1, status: 1 });
deliverySchema.index({ customer: 1, status: 1 });
deliverySchema.index({ status: 1, scheduledAt: 1 });

// Middleware to update timestamps based on status changes
deliverySchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'in-transit':
        if (!this.startedAt) {
          this.startedAt = now;
        }
        break;
      case 'delivered':
        if (!this.completedAt) {
          this.completedAt = now;
          // Calculate actual time if started
          if (this.startedAt) {
            this.actualTime = Math.round((now.getTime() - this.startedAt.getTime()) / (1000 * 60));
          }
        }
        break;
    }
  }
  next();
});

export default mongoose.model<IDelivery>('Delivery', deliverySchema);
