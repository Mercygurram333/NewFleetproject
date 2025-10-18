import mongoose from 'mongoose';
import DeliveryLog, { IDeliveryLog } from '../models/DeliveryLog';

interface LogDeliveryEventParams {
  deliveryId: string;
  driverId: string;
  action: IDeliveryLog['action'];
  location?: {
    lat: number;
    lng: number;
  };
  metadata?: IDeliveryLog['metadata'];
  systemGenerated?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

interface DeliveryAnalytics {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  averageDeliveryTime: number;
  averageDistance: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  locationUpdates: number;
}

export class DeliveryLogger {
  /**
   * Log a delivery event
   */
  static async logEvent(params: LogDeliveryEventParams): Promise<IDeliveryLog | null> {
    try {
      const {
        deliveryId,
        driverId,
        action,
        location,
        metadata = {},
        systemGenerated = false,
        ipAddress,
        userAgent
      } = params;

      const logEntry = new DeliveryLog({
        deliveryId: new mongoose.Types.ObjectId(deliveryId),
        driverId: new mongoose.Types.ObjectId(driverId),
        action,
        timestamp: new Date(),
        location: location ? {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        } : undefined,
        metadata,
        systemGenerated,
        ipAddress,
        userAgent
      });

      const savedLog = await logEntry.save();
      console.log(`📝 Logged delivery event: ${action} for delivery ${deliveryId}`);
      
      return savedLog;
    } catch (error) {
      console.error('Error logging delivery event:', error);
      return null;
    }
  }

  /**
   * Log delivery status change
   */
  static async logStatusChange(
    deliveryId: string,
    driverId: string,
    previousStatus: string,
    newStatus: string,
    location?: { lat: number; lng: number },
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IDeliveryLog | null> {
    return this.logEvent({
      deliveryId,
      driverId,
      action: newStatus as IDeliveryLog['action'],
      location,
      metadata: {
        previousStatus,
        newStatus,
        notes
      },
      systemGenerated: false,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log location update
   */
  static async logLocationUpdate(
    deliveryId: string,
    driverId: string,
    location: { lat: number; lng: number },
    speed?: number,
    heading?: number,
    systemGenerated: boolean = true
  ): Promise<IDeliveryLog | null> {
    return this.logEvent({
      deliveryId,
      driverId,
      action: 'location-update',
      location,
      metadata: {
        speed,
        heading
      },
      systemGenerated
    });
  }

  /**
   * Get delivery timeline
   */
  static async getDeliveryTimeline(deliveryId: string): Promise<IDeliveryLog[]> {
    try {
      const timeline = await DeliveryLog.find({
        deliveryId: new mongoose.Types.ObjectId(deliveryId)
      })
      .sort({ timestamp: 1 })
      .populate('driverId', 'name email')
      .lean();

      return timeline;
    } catch (error) {
      console.error('Error fetching delivery timeline:', error);
      return [];
    }
  }

  /**
   * Get driver activity logs
   */
  static async getDriverActivity(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<IDeliveryLog[]> {
    try {
      const query: any = {
        driverId: new mongoose.Types.ObjectId(driverId)
      };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const activity = await DeliveryLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('deliveryId', 'customer.name pickup.address delivery.address')
        .lean();

      return activity;
    } catch (error) {
      console.error('Error fetching driver activity:', error);
      return [];
    }
  }

  /**
   * Get delivery analytics
   */
  static async getDeliveryAnalytics(
    startDate?: Date,
    endDate?: Date,
    driverId?: string
  ): Promise<DeliveryAnalytics> {
    try {
      const matchConditions: any = {};

      if (startDate || endDate) {
        matchConditions.timestamp = {};
        if (startDate) matchConditions.timestamp.$gte = startDate;
        if (endDate) matchConditions.timestamp.$lte = endDate;
      }

      if (driverId) {
        matchConditions.driverId = new mongoose.Types.ObjectId(driverId);
      }

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            eventsByAction: {
              $push: '$action'
            },
            deliveries: { $addToSet: '$deliveryId' }
          }
        }
      ];

      const [result] = await DeliveryLog.aggregate(pipeline);

      if (!result) {
        return {
          totalEvents: 0,
          eventsByAction: {},
          averageDeliveryTime: 0,
          averageDistance: 0,
          completionRate: 0,
          onTimeDeliveryRate: 0,
          locationUpdates: 0
        };
      }

      // Count events by action
      const eventsByAction: Record<string, number> = {};
      result.eventsByAction.forEach((action: string) => {
        eventsByAction[action] = (eventsByAction[action] || 0) + 1;
      });

      // Calculate completion rate
      const totalDeliveries = result.deliveries.length;
      const completedDeliveries = eventsByAction.delivered || 0;
      const completionRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

      // Get detailed delivery metrics
      const deliveryMetrics = await this.calculateDeliveryMetrics(matchConditions);

      return {
        totalEvents: result.totalEvents,
        eventsByAction,
        averageDeliveryTime: deliveryMetrics.averageDeliveryTime,
        averageDistance: deliveryMetrics.averageDistance,
        completionRate,
        onTimeDeliveryRate: deliveryMetrics.onTimeDeliveryRate,
        locationUpdates: eventsByAction['location-update'] || 0
      };
    } catch (error) {
      console.error('Error calculating delivery analytics:', error);
      return {
        totalEvents: 0,
        eventsByAction: {},
        averageDeliveryTime: 0,
        averageDistance: 0,
        completionRate: 0,
        onTimeDeliveryRate: 0,
        locationUpdates: 0
      };
    }
  }

  /**
   * Calculate detailed delivery metrics
   */
  private static async calculateDeliveryMetrics(matchConditions: any) {
    try {
      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: '$deliveryId',
            events: { $push: '$$ROOT' }
          }
        },
        {
          $project: {
            deliveryId: '$_id',
            startTime: {
              $min: {
                $map: {
                  input: {
                    $filter: {
                      input: '$events',
                      cond: { $eq: ['$$this.action', 'started'] }
                    }
                  },
                  as: 'event',
                  in: '$$event.timestamp'
                }
              }
            },
            endTime: {
              $min: {
                $map: {
                  input: {
                    $filter: {
                      input: '$events',
                      cond: { $eq: ['$$this.action', 'delivered'] }
                    }
                  },
                  as: 'event',
                  in: '$$event.timestamp'
                }
              }
            },
            totalDistance: {
              $sum: {
                $map: {
                  input: '$events',
                  as: 'event',
                  in: { $ifNull: ['$$event.metadata.distance', 0] }
                }
              }
            }
          }
        },
        {
          $project: {
            deliveryId: 1,
            deliveryTime: {
              $cond: {
                if: { $and: ['$startTime', '$endTime'] },
                then: { $subtract: ['$endTime', '$startTime'] },
                else: null
              }
            },
            totalDistance: 1
          }
        },
        {
          $group: {
            _id: null,
            averageDeliveryTime: { $avg: '$deliveryTime' },
            averageDistance: { $avg: '$totalDistance' },
            completedDeliveries: { $sum: { $cond: [{ $ne: ['$deliveryTime', null] }, 1, 0] } },
            totalDeliveries: { $sum: 1 }
          }
        }
      ];

      const [result] = await DeliveryLog.aggregate(pipeline);

      if (!result) {
        return {
          averageDeliveryTime: 0,
          averageDistance: 0,
          onTimeDeliveryRate: 0
        };
      }

      // Convert milliseconds to minutes
      const averageDeliveryTime = result.averageDeliveryTime ? result.averageDeliveryTime / (1000 * 60) : 0;
      const onTimeDeliveryRate = result.totalDeliveries > 0 ? (result.completedDeliveries / result.totalDeliveries) * 100 : 0;

      return {
        averageDeliveryTime: Math.round(averageDeliveryTime),
        averageDistance: Math.round(result.averageDistance * 100) / 100,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating delivery metrics:', error);
      return {
        averageDeliveryTime: 0,
        averageDistance: 0,
        onTimeDeliveryRate: 0
      };
    }
  }

  /**
   * Get location history for a delivery
   */
  static async getLocationHistory(
    deliveryId: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<Array<{ timestamp: Date; location: { lat: number; lng: number }; speed?: number; heading?: number }>> {
    try {
      const query: any = {
        deliveryId: new mongoose.Types.ObjectId(deliveryId),
        action: 'location-update',
        location: { $exists: true }
      };

      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = startTime;
        if (endTime) query.timestamp.$lte = endTime;
      }

      const locationLogs = await DeliveryLog.find(query)
        .sort({ timestamp: 1 })
        .select('timestamp location metadata.speed metadata.heading')
        .lean();

      return locationLogs.map(log => ({
        timestamp: log.timestamp,
        location: {
          lat: log.location!.coordinates[1],
          lng: log.location!.coordinates[0]
        },
        speed: log.metadata?.speed,
        heading: log.metadata?.heading
      }));
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  /**
   * Clean up old logs (for data retention)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await DeliveryLog.deleteMany({
        timestamp: { $lt: cutoffDate },
        action: 'location-update' // Only clean up location updates, keep important events
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old location logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }
  }

  /**
   * Get real-time delivery statistics
   */
  static async getRealTimeStats(): Promise<{
    activeDeliveries: number;
    driversOnline: number;
    averageSpeed: number;
    totalDistanceToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pipeline = [
        {
          $match: {
            timestamp: { $gte: today },
            action: 'location-update'
          }
        },
        {
          $group: {
            _id: '$driverId',
            lastUpdate: { $max: '$timestamp' },
            totalDistance: { $sum: { $ifNull: ['$metadata.distance', 0] } },
            averageSpeed: { $avg: { $ifNull: ['$metadata.speed', 0] } },
            deliveries: { $addToSet: '$deliveryId' }
          }
        },
        {
          $group: {
            _id: null,
            activeDrivers: { $sum: 1 },
            totalDistance: { $sum: '$totalDistance' },
            averageSpeed: { $avg: '$averageSpeed' },
            activeDeliveries: { $sum: { $size: '$deliveries' } }
          }
        }
      ];

      const [result] = await DeliveryLog.aggregate(pipeline);

      if (!result) {
        return {
          activeDeliveries: 0,
          driversOnline: 0,
          averageSpeed: 0,
          totalDistanceToday: 0
        };
      }

      return {
        activeDeliveries: result.activeDeliveries || 0,
        driversOnline: result.activeDrivers || 0,
        averageSpeed: Math.round(result.averageSpeed || 0),
        totalDistanceToday: Math.round(result.totalDistance * 100) / 100 || 0
      };
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      return {
        activeDeliveries: 0,
        driversOnline: 0,
        averageSpeed: 0,
        totalDistanceToday: 0
      };
    }
  }
}

export default DeliveryLogger;
