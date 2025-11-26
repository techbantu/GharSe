/**
 * SMART KITCHEN INTELLIGENCE - Kitchen Capacity Monitor
 * 
 * Purpose: Real-time tracking of kitchen capacity for dynamic pricing decisions
 * Features:
 * - Track concurrent orders being prepared
 * - Calculate utilization percentage
 * - Estimate wait times based on current load
 * - WebSocket broadcasting for real-time updates
 * - Historical load analysis
 * 
 * This is the foundation for the dynamic pricing algorithm.
 */

import { prisma } from '@/lib/prisma';

/**
 * Kitchen capacity data structure
 */
export interface KitchenCapacityData {
  currentOrders: number;
  maxCapacity: number;
  utilizationPercent: number;
  estimatedWaitMinutes: number;
  staffOnDuty: number;
  status: 'OPERATIONAL' | 'OVERWHELMED' | 'IDLE' | 'CLOSED';
  recommendation: 'ACCEPT_ORDERS' | 'SLOW_DOWN' | 'PAUSE_ORDERS';
}

/**
 * Historical load data point
 */
export interface LoadDataPoint {
  timestamp: Date;
  utilizationPercent: number;
  currentOrders: number;
  estimatedWaitMinutes: number;
}

/**
 * KitchenMonitor - Core class for capacity tracking
 * 
 * This class manages real-time kitchen capacity data and provides
 * methods to update, query, and analyze kitchen load.
 */
export class KitchenMonitor {
  private restaurantId: string;
  private maxCapacity: number;
  private basePreparationTime: number; // minutes per order

  constructor(
    restaurantId: string = 'default',
    maxCapacity: number = 15, // default: 15 concurrent orders
    basePreparationTime: number = 20 // default: 20 minutes per order
  ) {
    this.restaurantId = restaurantId;
    this.maxCapacity = maxCapacity;
    this.basePreparationTime = basePreparationTime;
  }

  /**
   * Get current kitchen capacity in real-time
   * 
   * Algorithm:
   * 1. Count orders in CONFIRMED, PREPARING, READY states
   * 2. Calculate utilization percentage
   * 3. Estimate wait time based on queue
   * 4. Determine kitchen status
   */
  async getCurrentCapacity(): Promise<KitchenCapacityData> {
    // Count active orders (orders being worked on)
    const whereClause: any = {
      status: {
        in: ['CONFIRMED', 'PREPARING', 'READY'],
      },
    };

    // If default, look for orders with no specific chef (null)
    // Otherwise filter by specific chef ID
    if (this.restaurantId === 'default') {
      whereClause.chefId = null;
    } else {
      whereClause.chefId = this.restaurantId;
    }

    const activeOrders = await prisma.order.count({
      where: whereClause,
    });

    // Calculate utilization
    const utilizationPercent = (activeOrders / this.maxCapacity) * 100;

    // Estimate wait time based on load
    // Formula: baseTime + (utilization% * 0.5 minutes)
    // At 0% util: baseTime (20 min)
    // At 100% util: baseTime + 50 min (70 min)
    const estimatedWaitMinutes = Math.round(
      this.basePreparationTime + (utilizationPercent * 0.5)
    );

    // Determine kitchen status
    let status: 'OPERATIONAL' | 'OVERWHELMED' | 'IDLE' | 'CLOSED';
    let recommendation: 'ACCEPT_ORDERS' | 'SLOW_DOWN' | 'PAUSE_ORDERS';

    if (utilizationPercent < 30) {
      status = 'IDLE';
      recommendation = 'ACCEPT_ORDERS';
    } else if (utilizationPercent < 80) {
      status = 'OPERATIONAL';
      recommendation = 'ACCEPT_ORDERS';
    } else if (utilizationPercent < 95) {
      status = 'OVERWHELMED';
      recommendation = 'SLOW_DOWN';
    } else {
      status = 'OVERWHELMED';
      recommendation = 'PAUSE_ORDERS';
    }

    // Get staff count (for now, assume 3 staff; in future, track dynamically)
    const staffOnDuty = 3;

    return {
      currentOrders: activeOrders,
      maxCapacity: this.maxCapacity,
      utilizationPercent: Math.min(100, Math.round(utilizationPercent)),
      estimatedWaitMinutes,
      staffOnDuty,
      status,
      recommendation,
    };
  }

  /**
   * Update kitchen capacity in database
   * Called when order status changes (new order, completed, cancelled)
   * 
   * @param delta - Change in active orders (+1 for new, -1 for completed)
   */
  async updateCapacity(delta: number = 0): Promise<void> {
    const capacity = await this.getCurrentCapacity();

    // Save snapshot to database for historical analysis
    await prisma.kitchenCapacity.create({
      data: {
        restaurantId: this.restaurantId,
        timestamp: new Date(),
        currentOrders: capacity.currentOrders,
        maxCapacity: capacity.maxCapacity,
        utilizationPercent: capacity.utilizationPercent,
        estimatedWaitMinutes: capacity.estimatedWaitMinutes,
        staffOnDuty: capacity.staffOnDuty,
        status: capacity.status,
      },
    });
  }

  /**
   * Get historical kitchen load for the last N hours
   * Used for:
   * - Admin dashboard graphs
   * - ML training data
   * - Pattern analysis
   */
  async getHistoricalLoad(hours: number = 12): Promise<LoadDataPoint[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const records = await prisma.kitchenCapacity.findMany({
      where: {
        restaurantId: this.restaurantId,
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        timestamp: true,
        utilizationPercent: true,
        currentOrders: true,
        estimatedWaitMinutes: true,
      },
    });

    return records;
  }

  /**
   * Get peak hours analysis
   * Returns the hours with highest utilization (for demand forecasting)
   */
  async getPeakHours(days: number = 7): Promise<{ hour: number; avgUtilization: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await prisma.kitchenCapacity.findMany({
      where: {
        restaurantId: this.restaurantId,
        timestamp: {
          gte: since,
        },
      },
      select: {
        timestamp: true,
        utilizationPercent: true,
      },
    });

    // Group by hour of day
    const hourlyData: { [hour: number]: number[] } = {};

    records.forEach(record => {
      const hour = record.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(record.utilizationPercent);
    });

    // Calculate averages
    const peakHours = Object.keys(hourlyData).map(hourStr => {
      const hour = parseInt(hourStr);
      const utilizations = hourlyData[hour];
      const avgUtilization = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;
      return { hour, avgUtilization };
    });

    // Sort by average utilization (descending)
    return peakHours.sort((a, b) => b.avgUtilization - a.avgUtilization);
  }

  /**
   * Check if kitchen can accept an order right now
   * Used before placing order to prevent overload
   */
  async canAcceptOrder(): Promise<{ canAccept: boolean; reason: string; waitTime: number }> {
    const capacity = await this.getCurrentCapacity();

    if (capacity.status === 'CLOSED') {
      return {
        canAccept: false,
        reason: 'Kitchen is currently closed',
        waitTime: 0,
      };
    }

    if (capacity.utilizationPercent >= 100) {
      return {
        canAccept: false,
        reason: 'Kitchen at maximum capacity. Please try again in 15 minutes.',
        waitTime: 15,
      };
    }

    if (capacity.utilizationPercent >= 90) {
      return {
        canAccept: true,
        reason: `High demand: Estimated ${capacity.estimatedWaitMinutes} minute wait`,
        waitTime: capacity.estimatedWaitMinutes,
      };
    }

    return {
      canAccept: true,
      reason: `Estimated ${capacity.estimatedWaitMinutes} minute wait`,
      waitTime: capacity.estimatedWaitMinutes,
    };
  }

  /**
   * Get capacity multiplier for dynamic pricing
   * Returns a value between 0.7 and 1.6
   * 
   * Used by pricing algorithm:
   * - Low utilization (< 50%): Discount to fill capacity (0.7-0.9x)
   * - Normal utilization (50-70%): Normal pricing (1.0x)
   * - High utilization (70-90%): Surge pricing (1.1-1.3x)
   * - Critical utilization (90-100%): Heavy surge (1.4-1.6x)
   */
  async getCapacityMultiplier(): Promise<number> {
    const capacity = await this.getCurrentCapacity();
    const util = capacity.utilizationPercent;

    if (util < 30) {
      // IDLE: Heavy discount to stimulate orders
      // 0-30% util → 0.70-0.85x price
      return 0.70 + (util / 30) * 0.15;
    } else if (util < 50) {
      // LOW: Light discount
      // 30-50% util → 0.85-0.95x price
      return 0.85 + ((util - 30) / 20) * 0.10;
    } else if (util < 70) {
      // NORMAL: No pricing adjustment
      // 50-70% util → 0.95-1.05x price
      return 0.95 + ((util - 50) / 20) * 0.10;
    } else if (util < 90) {
      // HIGH: Moderate surge pricing
      // 70-90% util → 1.05-1.30x price
      return 1.05 + ((util - 70) / 20) * 0.25;
    } else {
      // CRITICAL: Heavy surge pricing to reduce demand
      // 90-100% util → 1.30-1.60x price
      return 1.30 + ((util - 90) / 10) * 0.30;
    }
  }

  /**
   * Cleanup old capacity records (keep last 30 days)
   * Run this periodically via cron job
   */
  async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.kitchenCapacity.deleteMany({
      where: {
        restaurantId: this.restaurantId,
        timestamp: {
          lt: cutoff,
        },
      },
    });

    return result.count;
  }
}

/**
 * Global singleton instance for default restaurant
 * Usage: import { kitchenMonitor } from '@/lib/kitchen-monitor';
 */
export const kitchenMonitor = new KitchenMonitor();

/**
 * Helper function to track order status changes
 * Call this whenever an order changes status
 */
export async function trackOrderStatusChange(
  orderId: string,
  newStatus: string,
  oldStatus: string
): Promise<void> {
  // Update capacity when orders enter or leave active states
  const activeStates = ['CONFIRMED', 'PREPARING', 'READY'];

  const wasActive = activeStates.includes(oldStatus);
  const isActive = activeStates.includes(newStatus);

  // If entering active state
  if (isActive && !wasActive) {
    await kitchenMonitor.updateCapacity(+1);
  }

  // If leaving active state
  if (!isActive && wasActive) {
    await kitchenMonitor.updateCapacity(-1);
  }
}

/**
 * WebSocket broadcast helper
 * Call this to notify all connected clients of capacity changes
 * 
 * Note: Requires Socket.IO setup in your Next.js API routes
 */
export async function broadcastCapacityUpdate(): Promise<void> {
  const capacity = await kitchenMonitor.getCurrentCapacity();

  // If using Socket.IO (optional integration)
  // import { io } from '@/lib/socket';
  // io.emit('kitchen:capacity', capacity);

  // For now, just log it (implement WebSocket later if needed)
  console.log('[Kitchen Monitor] Capacity updated:', capacity);
}

