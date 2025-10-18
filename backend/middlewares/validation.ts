import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    const error = createError('Please provide name, email, password, and role', 400);
    return next(error);
  }

  if (password.length < 6) {
    const error = createError('Password must be at least 6 characters long', 400);
    return next(error);
  }

  if (!['admin', 'driver', 'customer'].includes(role)) {
    const error = createError('Role must be admin, driver, or customer', 400);
    return next(error);
  }

  // Additional validation for drivers
  if (role === 'driver' && !req.body.licenseNumber) {
    const error = createError('License number is required for drivers', 400);
    return next(error);
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = createError('Please provide email and password', 400);
    return next(error);
  }

  next();
};

export const validateVehicle = (req: Request, res: Response, next: NextFunction): void => {
  const { vehicleNumber, type, capacity } = req.body;

  if (!vehicleNumber || !type || !capacity) {
    const error = createError('Please provide vehicle number, type, and capacity', 400);
    return next(error);
  }

  if (!['truck', 'van', 'motorcycle', 'car'].includes(type)) {
    const error = createError('Vehicle type must be truck, van, motorcycle, or car', 400);
    return next(error);
  }

  if (capacity <= 0) {
    const error = createError('Capacity must be greater than 0', 400);
    return next(error);
  }

  next();
};

export const validateDelivery = (req: Request, res: Response, next: NextFunction): void => {
  const {
    pickupLocation,
    dropoffLocation,
    estimatedTime,
    scheduledAt
  } = req.body;

  if (!pickupLocation || !dropoffLocation || !estimatedTime || !scheduledAt) {
    const error = createError('Please provide pickup location, dropoff location, estimated time, and scheduled time', 400);
    return next(error);
  }

  // Validate location objects
  if (!pickupLocation.address || !pickupLocation.lat || !pickupLocation.lng) {
    const error = createError('Pickup location must include address, latitude, and longitude', 400);
    return next(error);
  }

  if (!dropoffLocation.address || !dropoffLocation.lat || !dropoffLocation.lng) {
    const error = createError('Dropoff location must include address, latitude, and longitude', 400);
    return next(error);
  }

  // Validate coordinates
  if (Math.abs(pickupLocation.lat) > 90 || Math.abs(pickupLocation.lng) > 180) {
    const error = createError('Invalid pickup location coordinates', 400);
    return next(error);
  }

  if (Math.abs(dropoffLocation.lat) > 90 || Math.abs(dropoffLocation.lng) > 180) {
    const error = createError('Invalid dropoff location coordinates', 400);
    return next(error);
  }

  if (estimatedTime <= 0) {
    const error = createError('Estimated time must be greater than 0', 400);
    return next(error);
  }

  // Validate scheduled time is in the future
  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    const error = createError('Scheduled time must be in the future', 400);
    return next(error);
  }

  next();
};

export const validateLocationUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    const error = createError('Please provide latitude and longitude', 400);
    return next(error);
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    const error = createError('Invalid coordinates', 400);
    return next(error);
  }

  next();
};
