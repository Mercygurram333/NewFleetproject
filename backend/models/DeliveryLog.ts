import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryLog extends Document {
  deliveryId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  action: 'created' | 'assigned' | 'accepted' | 'rejected' | 'started' | 'in-transit' | 'arrived' | 'delivered' | 'cancelled' | 'location-update';
  timestamp: Date;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  metadata?: {
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    rejectionReason?: string;
    completionNotes?: string;
    estimatedArrival?: Date;
    actualArrival?: Date;
    distance?: number;
    duration?: number;
    speed?: number;
    heading?: number;
  };
  systemGenerated: boolean;
  ipAddress?: string;
  userAgent?: string;
}

const DeliveryLogSchema = new Schema<IDeliveryLog>({
  deliveryId: {
    type: Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    index: true
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['created', 'assigned', 'accepted', 'rejected', 'started', 'in-transit', 'arrived', 'delivered', 'cancelled', 'location-update'],
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  metadata: {
    previousStatus: String,
    newStatus: String,
    notes: String,
    rejectionReason: String,
    completionNotes: String,
    estimatedArrival: Date,
    actualArrival: Date,
    distance: Number,
    duration: Number,
    speed: Number,
    heading: Number
  },
  systemGenerated: {
    type: Boolean,
    default: false,
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  collection: 'delivery_logs'
});

// Indexes for efficient querying
DeliveryLogSchema.index({ deliveryId: 1, timestamp: -1 });
DeliveryLogSchema.index({ driverId: 1, timestamp: -1 });
DeliveryLogSchema.index({ action: 1, timestamp: -1 });
DeliveryLogSchema.index({ timestamp: -1 });
DeliveryLogSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
DeliveryLogSchema.index({ deliveryId: 1, action: 1, timestamp: -1 });
DeliveryLogSchema.index({ driverId: 1, action: 1, timestamp: -1 });

const DeliveryLog = mongoose.model<IDeliveryLog>('DeliveryLog', DeliveryLogSchema);

export default DeliveryLog;
