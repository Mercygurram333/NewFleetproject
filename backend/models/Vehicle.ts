import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  vehicleNumber: string;
  type: 'truck' | 'van' | 'motorcycle' | 'car';
  capacity: number; // in kg
  status: 'available' | 'in-use' | 'maintenance';
  assignedDriver?: mongoose.Types.ObjectId;
  location?: {
    lat: number;
    lng: number;
  };
  maintenanceSchedule?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'motorcycle', 'car'],
    required: [true, 'Vehicle type is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Vehicle capacity is required'],
    min: [1, 'Capacity must be greater than 0']
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance'],
    default: 'available'
  },
  assignedDriver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: {
    lat: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  maintenanceSchedule: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ type: 1 });

// Middleware to update status when driver is assigned/unassigned
vehicleSchema.pre('save', function(next) {
  if (this.isModified('assignedDriver')) {
    if (this.assignedDriver && this.status === 'available') {
      this.status = 'in-use';
    } else if (!this.assignedDriver && this.status === 'in-use') {
      this.status = 'available';
    }
  }
  next();
});

export default mongoose.model<IVehicle>('Vehicle', vehicleSchema);
