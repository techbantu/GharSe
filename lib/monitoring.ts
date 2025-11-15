/**
 * MONITORING & ALERTS SYSTEM
 * 
 * Purpose: Track system health and send alerts
 * 
 * Metrics Tracked:
 * - Chef response times (order acceptance)
 * - Order acceptance rates
 * - System errors
 * - API performance
 * - Payment failures
 * 
 * Alert Channels:
 * - Email (admin)
 * - Logs (structured)
 * - External services (optional: Sentry, Datadog)
 */

import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';

// Alert thresholds
const THRESHOLDS = {
  CHEF_RESPONSE_TIME: 5 * 60 * 1000, // 5 minutes
  ORDER_ACCEPTANCE_RATE: 0.8, // 80%
  ERROR_RATE: 0.05, // 5%
  API_RESPONSE_TIME: 1000, // 1 second
  PAYMENT_FAILURE_RATE: 0.1, // 10%
} as const;

// Alert levels
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  level: AlertLevel;
  title: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
}

/**
 * Send alert (currently logs, can be extended to email/Slack/etc)
 */
async function sendAlert(alert: Alert): Promise<void> {
  const logLevel = alert.level === 'critical' ? 'error' : alert.level === 'warning' ? 'warn' : 'info';

  logger[logLevel]('ALERT: ' + alert.title, {
    message: alert.message,
    metric: alert.metric,
    value: alert.value,
    threshold: alert.threshold,
  });

  // TODO: Send email to admin
  // TODO: Send to Slack webhook
  // TODO: Send to Sentry/Datadog
}

/**
 * Monitor chef response times
 */
export async function monitorChefResponseTimes(): Promise<void> {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: new Date(Date.now() - THRESHOLDS.CHEF_RESPONSE_TIME),
        },
      },
      include: {
        chef: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (pendingOrders.length > 0) {
      await sendAlert({
        level: 'warning',
        title: 'Chef Response Time Exceeded',
        message: `${pendingOrders.length} orders pending for more than 5 minutes`,
        metric: 'chef_response_time',
        value: pendingOrders.length,
        threshold: 0,
        timestamp: new Date(),
      });

      // Log each slow chef
      for (const order of pendingOrders) {
        logger.warn('Slow chef response', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          chefName: order.chef?.businessName,
          pendingMinutes: Math.floor((Date.now() - order.createdAt.getTime()) / 60000),
        });
      }
    }
  } catch (error) {
    logger.error('Failed to monitor chef response times', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Calculate and monitor order acceptance rate
 */
export async function monitorOrderAcceptanceRate(chefId?: string): Promise<void> {
  try {
    const where: any = {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    };

    if (chefId) {
      where.chefId = chefId;
    }

    const totalOrders = await prisma.order.count({ where });

    const acceptedOrders = await prisma.order.count({
      where: {
        ...where,
        status: { notIn: ['CANCELLED', 'PENDING'] },
      },
    });

    if (totalOrders === 0) return;

    const acceptanceRate = acceptedOrders / totalOrders;

    if (acceptanceRate < THRESHOLDS.ORDER_ACCEPTANCE_RATE) {
      await sendAlert({
        level: 'warning',
        title: 'Low Order Acceptance Rate',
        message: `Acceptance rate is ${(acceptanceRate * 100).toFixed(1)}% (threshold: ${THRESHOLDS.ORDER_ACCEPTANCE_RATE * 100}%)`,
        metric: 'order_acceptance_rate',
        value: acceptanceRate,
        threshold: THRESHOLDS.ORDER_ACCEPTANCE_RATE,
        timestamp: new Date(),
      });
    }

    logger.info('Order acceptance rate monitored', {
      chefId,
      totalOrders,
      acceptedOrders,
      acceptanceRate: `${(acceptanceRate * 100).toFixed(1)}%`,
    });
  } catch (error) {
    logger.error('Failed to monitor order acceptance rate', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Monitor payment failure rate
 */
export async function monitorPaymentFailures(): Promise<void> {
  try {
    const where = {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    };

    const totalPayments = await prisma.payment.count({ where });

    const failedPayments = await prisma.payment.count({
      where: {
        ...where,
        status: 'FAILED',
      },
    });

    if (totalPayments === 0) return;

    const failureRate = failedPayments / totalPayments;

    if (failureRate > THRESHOLDS.PAYMENT_FAILURE_RATE) {
      await sendAlert({
        level: 'critical',
        title: 'High Payment Failure Rate',
        message: `Payment failure rate is ${(failureRate * 100).toFixed(1)}% (threshold: ${THRESHOLDS.PAYMENT_FAILURE_RATE * 100}%)`,
        metric: 'payment_failure_rate',
        value: failureRate,
        threshold: THRESHOLDS.PAYMENT_FAILURE_RATE,
        timestamp: new Date(),
      });
    }

    logger.info('Payment failures monitored', {
      totalPayments,
      failedPayments,
      failureRate: `${(failureRate * 100).toFixed(1)}%`,
    });
  } catch (error) {
    logger.error('Failed to monitor payment failures', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Check system health
 */
export async function checkSystemHealth(): Promise<{
  healthy: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.database = false;
    errors.push('Database connection failed');

    await sendAlert({
      level: 'critical',
      title: 'Database Connection Failed',
      message: 'Unable to connect to database',
      timestamp: new Date(),
    });
  }

  // Redis check (if enabled)
  try {
    if (process.env.REDIS_URL) {
      const { getCached } = await import('./redis-cache');
      await getCached('health-check');
      checks.redis = true;
    } else {
      checks.redis = true; // Not required
    }
  } catch (error) {
    checks.redis = false;
    errors.push('Redis connection failed');
  }

  // Check recent errors
  try {
    const recentErrors = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Order
      WHERE status = 'CANCELLED'
      AND createdAt > datetime('now', '-1 hour')
    `;

    const errorCount = recentErrors[0]?.count || 0;
    checks.errorRate = errorCount < 10;

    if (errorCount >= 10) {
      errors.push(`High error rate: ${errorCount} cancelled orders in last hour`);
    }
  } catch (error) {
    checks.errorRate = false;
    errors.push('Unable to check error rate');
  }

  const healthy = Object.values(checks).every(Boolean);

  if (!healthy) {
    logger.error('System health check failed', { checks, errors });
  }

  return { healthy, checks, errors };
}

/**
 * Run all monitoring checks
 */
export async function runMonitoring(): Promise<void> {
  logger.info('Running monitoring checks...');

  await Promise.all([
    monitorChefResponseTimes(),
    monitorOrderAcceptanceRate(),
    monitorPaymentFailures(),
    checkSystemHealth(),
  ]);

  logger.info('Monitoring checks completed');
}

/**
 * Get chef performance metrics
 */
export async function getChefMetrics(chefId: string, days: number = 7): Promise<{
  avgResponseTime: number;
  acceptanceRate: number;
  cancellationRate: number;
  totalOrders: number;
}> {
  try {
    const where = {
      chefId,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    const orders = await prisma.order.findMany({
      where,
      select: {
        status: true,
        createdAt: true,
        confirmedAt: true,
      },
    });

    const totalOrders = orders.length;

    if (totalOrders === 0) {
      return {
        avgResponseTime: 0,
        acceptanceRate: 0,
        cancellationRate: 0,
        totalOrders: 0,
      };
    }

    // Calculate average response time (time to confirm)
    const responseTimes = orders
      .filter(o => o.confirmedAt)
      .map(o => o.confirmedAt!.getTime() - o.createdAt.getTime());

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Calculate acceptance rate
    const acceptedOrders = orders.filter(o => o.status !== 'CANCELLED').length;
    const acceptanceRate = acceptedOrders / totalOrders;

    // Calculate cancellation rate
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    const cancellationRate = cancelledOrders / totalOrders;

    return {
      avgResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      totalOrders,
    };
  } catch (error) {
    logger.error('Failed to get chef metrics', {
      chefId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      avgResponseTime: 0,
      acceptanceRate: 0,
      cancellationRate: 0,
      totalOrders: 0,
    };
  }
}

/**
 * Track order failure with context for debugging
 */
export async function trackOrderFailure(context: {
  correlationId?: string;
  orderId?: string;
  userId?: string;
  error: Error;
  stage: 'validation' | 'database' | 'payment' | 'inventory' | 'notification';
  recoverable: boolean;
}): Promise<void> {
  logger.error('Order failure tracked', {
    ...context,
    errorMessage: context.error.message,
    errorStack: context.error.stack,
  });

  // If non-recoverable, send critical alert
  if (!context.recoverable) {
    await sendAlert({
      level: 'critical',
      title: 'Non-Recoverable Order Failure',
      message: `Order failed at ${context.stage}: ${context.error.message}`,
      timestamp: new Date(),
    });
  }
}

/**
 * Track successful order with metrics
 */
export async function trackOrderSuccess(context: {
  correlationId?: string;
  orderId: string;
  userId?: string;
  total: number;
  itemCount: number;
  duration: number;
}): Promise<void> {
  logger.info('Order success tracked', context);

  // Alert on slow orders (>5 seconds)
  if (context.duration > 5000) {
    await sendAlert({
      level: 'warning',
      title: 'Slow Order Creation',
      message: `Order ${context.orderId} took ${context.duration}ms to create`,
      metric: 'order_creation_time',
      value: context.duration,
      threshold: 5000,
      timestamp: new Date(),
    });
  }
}

export default {
  monitorChefResponseTimes,
  monitorOrderAcceptanceRate,
  monitorPaymentFailures,
  checkSystemHealth,
  runMonitoring,
  getChefMetrics,
  trackOrderFailure,
  trackOrderSuccess,
  THRESHOLDS,
};

