import mongoose from 'mongoose';
import Delivery from '../models/Delivery';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface ScheduleConflict {
  conflictingDeliveryId: string;
  conflictType: 'pickup' | 'delivery' | 'travel';
  timeOverlap: {
    start: Date;
    end: Date;
  };
}

export class ScheduleValidator {
  private static readonly TRAVEL_TIME_BUFFER = 30; // minutes
  private static readonly PICKUP_DURATION = 15; // minutes
  private static readonly DELIVERY_DURATION = 10; // minutes

  /**
   * Validates if a new delivery can be scheduled for a driver without conflicts
   */
  static async validateDeliverySchedule(
    driverId: string,
    pickupTime: Date,
    deliveryTime: Date,
    estimatedTravelTime: number = 30
  ): Promise<{ isValid: boolean; conflicts: ScheduleConflict[] }> {
    try {
      // Get all active deliveries for the driver
      const existingDeliveries = await Delivery.find({
        driver: new mongoose.Types.ObjectId(driverId),
        status: { $in: ['assigned', 'accepted', 'started', 'in-transit'] },
        $or: [
          { 'pickup.scheduledTime': { $exists: true } },
          { 'delivery.scheduledTime': { $exists: true } }
        ]
      }).sort({ 'pickup.scheduledTime': 1 });

      const conflicts: ScheduleConflict[] = [];

      // Create time slots for the new delivery
      const newPickupSlot: TimeSlot = {
        start: new Date(pickupTime.getTime() - this.TRAVEL_TIME_BUFFER * 60000),
        end: new Date(pickupTime.getTime() + this.PICKUP_DURATION * 60000)
      };

      const newDeliverySlot: TimeSlot = {
        start: new Date(deliveryTime.getTime() - this.TRAVEL_TIME_BUFFER * 60000),
        end: new Date(deliveryTime.getTime() + this.DELIVERY_DURATION * 60000)
      };

      // Check conflicts with existing deliveries
      for (const existing of existingDeliveries) {
        // Check pickup conflicts
        if (existing.pickup?.scheduledTime) {
          const existingPickupSlot: TimeSlot = {
            start: new Date(existing.pickup.scheduledTime.getTime() - this.TRAVEL_TIME_BUFFER * 60000),
            end: new Date(existing.pickup.scheduledTime.getTime() + this.PICKUP_DURATION * 60000)
          };

          const pickupConflict = this.checkTimeSlotOverlap(newPickupSlot, existingPickupSlot);
          if (pickupConflict) {
            conflicts.push({
              conflictingDeliveryId: existing._id.toString(),
              conflictType: 'pickup',
              timeOverlap: pickupConflict
            });
          }

          // Check if new delivery conflicts with existing pickup
          const deliveryPickupConflict = this.checkTimeSlotOverlap(newDeliverySlot, existingPickupSlot);
          if (deliveryPickupConflict) {
            conflicts.push({
              conflictingDeliveryId: existing._id.toString(),
              conflictType: 'pickup',
              timeOverlap: deliveryPickupConflict
            });
          }
        }

        // Check delivery conflicts
        if (existing.delivery?.scheduledTime) {
          const existingDeliverySlot: TimeSlot = {
            start: new Date(existing.delivery.scheduledTime.getTime() - this.TRAVEL_TIME_BUFFER * 60000),
            end: new Date(existing.delivery.scheduledTime.getTime() + this.DELIVERY_DURATION * 60000)
          };

          const deliveryConflict = this.checkTimeSlotOverlap(newDeliverySlot, existingDeliverySlot);
          if (deliveryConflict) {
            conflicts.push({
              conflictingDeliveryId: existing._id.toString(),
              conflictType: 'delivery',
              timeOverlap: deliveryConflict
            });
          }

          // Check if new pickup conflicts with existing delivery
          const pickupDeliveryConflict = this.checkTimeSlotOverlap(newPickupSlot, existingDeliverySlot);
          if (pickupDeliveryConflict) {
            conflicts.push({
              conflictingDeliveryId: existing._id.toString(),
              conflictType: 'delivery',
              timeOverlap: pickupDeliveryConflict
            });
          }
        }
      }

      // Validate travel time between pickup and delivery
      const travelTimeValid = this.validateTravelTime(pickupTime, deliveryTime, estimatedTravelTime);
      if (!travelTimeValid) {
        conflicts.push({
          conflictingDeliveryId: 'self',
          conflictType: 'travel',
          timeOverlap: {
            start: pickupTime,
            end: deliveryTime
          }
        });
      }

      return {
        isValid: conflicts.length === 0,
        conflicts
      };

    } catch (error) {
      console.error('Error validating delivery schedule:', error);
      return {
        isValid: false,
        conflicts: []
      };
    }
  }

  /**
   * Suggests alternative time slots for a delivery
   */
  static async suggestAlternativeTimeSlots(
    driverId: string,
    preferredPickupTime: Date,
    estimatedTravelTime: number = 30,
    maxSuggestions: number = 5
  ): Promise<{ pickupTime: Date; deliveryTime: Date }[]> {
    try {
      const suggestions: { pickupTime: Date; deliveryTime: Date }[] = [];
      const timeIncrements = [0, 30, 60, 90, 120, 180, 240]; // minutes

      for (const increment of timeIncrements) {
        if (suggestions.length >= maxSuggestions) break;

        const adjustedPickupTime = new Date(preferredPickupTime.getTime() + increment * 60000);
        const adjustedDeliveryTime = new Date(adjustedPickupTime.getTime() + estimatedTravelTime * 60000);

        const validation = await this.validateDeliverySchedule(
          driverId,
          adjustedPickupTime,
          adjustedDeliveryTime,
          estimatedTravelTime
        );

        if (validation.isValid) {
          suggestions.push({
            pickupTime: adjustedPickupTime,
            deliveryTime: adjustedDeliveryTime
          });
        }
      }

      return suggestions;

    } catch (error) {
      console.error('Error suggesting alternative time slots:', error);
      return [];
    }
  }

  /**
   * Gets driver availability for a specific date
   */
  static async getDriverAvailability(
    driverId: string,
    date: Date
  ): Promise<{ busySlots: TimeSlot[]; availableSlots: TimeSlot[] }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const deliveries = await Delivery.find({
        driver: new mongoose.Types.ObjectId(driverId),
        status: { $in: ['assigned', 'accepted', 'started', 'in-transit'] },
        $or: [
          {
            'pickup.scheduledTime': {
              $gte: startOfDay,
              $lte: endOfDay
            }
          },
          {
            'delivery.scheduledTime': {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        ]
      }).sort({ 'pickup.scheduledTime': 1 });

      const busySlots: TimeSlot[] = [];

      // Create busy slots from existing deliveries
      deliveries.forEach(delivery => {
        if (delivery.pickup?.scheduledTime) {
          busySlots.push({
            start: new Date(delivery.pickup.scheduledTime.getTime() - this.TRAVEL_TIME_BUFFER * 60000),
            end: new Date(delivery.pickup.scheduledTime.getTime() + this.PICKUP_DURATION * 60000)
          });
        }

        if (delivery.delivery?.scheduledTime) {
          busySlots.push({
            start: new Date(delivery.delivery.scheduledTime.getTime() - this.TRAVEL_TIME_BUFFER * 60000),
            end: new Date(delivery.delivery.scheduledTime.getTime() + this.DELIVERY_DURATION * 60000)
          });
        }
      });

      // Merge overlapping busy slots
      const mergedBusySlots = this.mergeOverlappingSlots(busySlots);

      // Generate available slots (working hours: 8 AM to 8 PM)
      const workStart = new Date(date);
      workStart.setHours(8, 0, 0, 0);
      
      const workEnd = new Date(date);
      workEnd.setHours(20, 0, 0, 0);

      const availableSlots = this.generateAvailableSlots(workStart, workEnd, mergedBusySlots);

      return {
        busySlots: mergedBusySlots,
        availableSlots
      };

    } catch (error) {
      console.error('Error getting driver availability:', error);
      return { busySlots: [], availableSlots: [] };
    }
  }

  /**
   * Validates workload limits for a driver
   */
  static async validateWorkloadLimits(
    driverId: string,
    date: Date
  ): Promise<{ isWithinLimits: boolean; currentWorkload: number; maxWorkload: number }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const deliveryCount = await Delivery.countDocuments({
        driver: new mongoose.Types.ObjectId(driverId),
        status: { $in: ['assigned', 'accepted', 'started', 'in-transit'] },
        $or: [
          {
            'pickup.scheduledTime': {
              $gte: startOfDay,
              $lte: endOfDay
            }
          },
          {
            'delivery.scheduledTime': {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        ]
      });

      const maxDeliveriesPerDay = 12; // Configurable limit

      return {
        isWithinLimits: deliveryCount < maxDeliveriesPerDay,
        currentWorkload: deliveryCount,
        maxWorkload: maxDeliveriesPerDay
      };

    } catch (error) {
      console.error('Error validating workload limits:', error);
      return {
        isWithinLimits: false,
        currentWorkload: 0,
        maxWorkload: 12
      };
    }
  }

  // Helper methods

  private static checkTimeSlotOverlap(slot1: TimeSlot, slot2: TimeSlot): TimeSlot | null {
    const overlapStart = new Date(Math.max(slot1.start.getTime(), slot2.start.getTime()));
    const overlapEnd = new Date(Math.min(slot1.end.getTime(), slot2.end.getTime()));

    if (overlapStart < overlapEnd) {
      return {
        start: overlapStart,
        end: overlapEnd
      };
    }

    return null;
  }

  private static validateTravelTime(pickupTime: Date, deliveryTime: Date, estimatedTravelTime: number): boolean {
    const actualTravelTime = (deliveryTime.getTime() - pickupTime.getTime()) / (1000 * 60); // minutes
    const minRequiredTime = estimatedTravelTime + this.PICKUP_DURATION;
    
    return actualTravelTime >= minRequiredTime;
  }

  private static mergeOverlappingSlots(slots: TimeSlot[]): TimeSlot[] {
    if (slots.length === 0) return [];

    const sorted = slots.sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: TimeSlot[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        // Overlapping slots, merge them
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      } else {
        // Non-overlapping slot, add it
        merged.push(current);
      }
    }

    return merged;
  }

  private static generateAvailableSlots(
    workStart: Date,
    workEnd: Date,
    busySlots: TimeSlot[]
  ): TimeSlot[] {
    const availableSlots: TimeSlot[] = [];
    let currentTime = new Date(workStart);

    for (const busySlot of busySlots) {
      if (currentTime < busySlot.start) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(busySlot.start)
        });
      }
      currentTime = new Date(Math.max(currentTime.getTime(), busySlot.end.getTime()));
    }

    // Add final available slot if there's time left
    if (currentTime < workEnd) {
      availableSlots.push({
        start: new Date(currentTime),
        end: new Date(workEnd)
      });
    }

    // Filter out slots that are too short (less than 30 minutes)
    return availableSlots.filter(slot => 
      (slot.end.getTime() - slot.start.getTime()) >= 30 * 60000
    );
  }
}

export default ScheduleValidator;
