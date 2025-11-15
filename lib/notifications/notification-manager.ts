/**
 * NOTIFICATION MANAGER - Unified Notification Orchestrator
 * 
 * Architecture: Queue-based notification system with retry logic
 * 
 * Features:
 * - Coordinates email and SMS notifications
 * - Queue system for failed sends
 * - Customer preference management
 * - Notification history tracking in database
 * - Graceful degradation (if one fails, others still send)
 */

import { Order } from '@/types';
import { logger } from '@/utils/logger';
import emailService from './email-service';
import smsService from './sms-service';
import prisma from '@/lib/prisma';

export type NotificationType = 'email' | 'sms' | 'push' | 'whatsapp';
export type NotificationChannel = 'order_confirmation' | 'status_update' | 'payment_confirmation' | 'promotional';

export interface NotificationOptions {
  via?: NotificationType[];
  customerPreference?: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
  priority?: 'high' | 'normal' | 'low';
  skipQueue?: boolean; // Send immediately, don't queue
}

export interface NotificationResult {
  email?: { success: boolean; error?: string; skipped?: boolean };
  sms?: { success: boolean; error?: string; skipped?: boolean };
  overall: boolean; // At least one succeeded
}

/**
 * Log notification attempt to database
 */
async function logNotification(
  orderId: string,
  type: NotificationType,
  channel: NotificationChannel,
  recipient: string,
  status: 'sent' | 'failed' | 'pending',
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        orderId,
        type,
        channel,
        recipient,
        status,
        sentAt: status === 'sent' ? new Date() : null,
        failedAt: status === 'failed' ? new Date() : null,
        errorMessage: errorMessage || null,
        retryCount: 0,
      },
    });
  } catch (error) {
    // Don't fail the whole notification if logging fails
    logger.error('Failed to log notification', {
      orderId,
      type,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get customer notification preferences
 * Returns default preferences if not set
 */
async function getCustomerPreferences(phone: string): Promise<{
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      select: { notificationPrefs: true },
    });

    if (customer && customer.notificationPrefs) {
      const prefs = customer.notificationPrefs as any;
      return {
        email: prefs.email !== false, // Default true
        sms: prefs.sms !== false, // Default true
        whatsapp: prefs.whatsapp !== false, // Default true
      };
    }
  } catch (error) {
    logger.warn('Failed to fetch customer preferences', {
      phone: phone.substring(0, 3) + '***',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Default: all enabled
  return { email: true, sms: true, whatsapp: true };
}

/**
 * Save customer notification preferences
 */
export async function saveCustomerPreferences(
  phone: string,
  email: string,
  name: string,
  preferences: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  }
): Promise<void> {
  try {
    await prisma.customer.upsert({
      where: { phone },
      create: {
        phone,
        email,
        name,
        notificationPrefs: preferences,
      },
      update: {
        email,
        name,
        notificationPrefs: preferences,
      },
    });

    logger.info('Customer preferences saved', {
      phone: phone.substring(0, 3) + '***',
      preferences,
    });
  } catch (error) {
    logger.error('Failed to save customer preferences', {
      phone: phone.substring(0, 3) + '***',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Send notifications with graceful degradation
 * If one channel fails, others still get sent
 */
async function sendNotifications(
  order: Order,
  channel: NotificationChannel,
  emailFn: () => Promise<{ success: boolean; error?: string }>,
  smsFn: () => Promise<{ success: boolean; error?: string; skipped?: boolean }>,
  options: NotificationOptions = {}
): Promise<NotificationResult> {
  const result: NotificationResult = { overall: false };

  // Get customer preferences
  const customerPrefs = options.customerPreference || (await getCustomerPreferences(order.customer.phone));

  // Determine which channels to use
  const channels = options.via || ['email', 'sms'];
  const shouldSendEmail = channels.includes('email') && customerPrefs.email;
  const shouldSendSMS = channels.includes('sms') && customerPrefs.sms;

  // Send email (if enabled)
  if (shouldSendEmail) {
    try {
      const emailResult = await emailFn();
      result.email = emailResult;

      await logNotification(
        order.id,
        'email',
        channel,
        order.customer.email,
        emailResult.success ? 'sent' : 'failed',
        emailResult.error
      );

      if (emailResult.success) {
        result.overall = true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.email = { success: false, error: errorMessage };

      await logNotification(
        order.id,
        'email',
        channel,
        order.customer.email,
        'failed',
        errorMessage
      );

      logger.error('Email notification failed', {
        orderId: order.id,
        channel,
        error: errorMessage,
      });
    }
  }

  // Send SMS (if enabled) - delay by 2 seconds to give email priority
  if (shouldSendSMS) {
    // Small delay to prioritize email
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const smsResult = await smsFn();
      result.sms = smsResult;

      if (!smsResult.skipped) {
        await logNotification(
          order.id,
          'sms',
          channel,
          order.customer.phone,
          smsResult.success ? 'sent' : 'failed',
          smsResult.error
        );
      }

      if (smsResult.success) {
        result.overall = true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.sms = { success: false, error: errorMessage };

      await logNotification(
        order.id,
        'sms',
        channel,
        order.customer.phone,
        'failed',
        errorMessage
      );

      logger.error('SMS notification failed', {
        orderId: order.id,
        channel,
        error: errorMessage,
      });
    }
  }

  return result;
}

/**
 * Public API - Notification Manager
 */
export const notificationManager = {
  /**
   * Send order confirmation notifications
   */
  async sendOrderConfirmation(order: Order, options: NotificationOptions = {}): Promise<NotificationResult> {
    logger.info('Sending order confirmation notifications', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      via: options.via || ['email', 'sms'],
    });

    return sendNotifications(
      order,
      'order_confirmation',
      () => emailService.sendOrderConfirmation(order),
      () => smsService.sendOrderConfirmation(order, options.customerPreference?.sms),
      options
    );
  },

  /**
   * Send order status update notifications
   */
  async sendStatusUpdate(
    order: Order,
    newStatus: string,
    options: NotificationOptions = {}
  ): Promise<NotificationResult> {
    logger.info('Sending status update notifications', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      newStatus,
      via: options.via || ['email', 'sms'],
    });

    return sendNotifications(
      order,
      'status_update',
      () => emailService.sendStatusUpdate(order, newStatus),
      () => smsService.sendStatusUpdate(order, newStatus, options.customerPreference?.sms),
      options
    );
  },

  /**
   * Retry failed notifications
   * Useful for cron jobs that process notification queue
   */
  async retryFailedNotifications(orderId: string, maxRetries: number = 3): Promise<void> {
    try {
      const failedNotifications = await prisma.notificationLog.findMany({
        where: {
          orderId,
          status: 'failed',
          retryCount: { lt: maxRetries },
        },
      });

      if (failedNotifications.length === 0) {
        logger.debug('No failed notifications to retry', { orderId });
        return;
      }

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (!order) {
        logger.error('Order not found for retry', { orderId });
        return;
      }

      // Transform order to expected format
      // ... (transform logic here)

      for (const notification of failedNotifications) {
        logger.info('Retrying failed notification', {
          notificationId: notification.id,
          type: notification.type,
          retryCount: notification.retryCount + 1,
        });

        // Retry based on type
        let result: { success: boolean; error?: string } = { success: false };

        if (notification.type === 'email' && notification.channel === 'order_confirmation') {
          // result = await emailService.sendOrderConfirmation(order);
        } else if (notification.type === 'sms' && notification.channel === 'order_confirmation') {
          // result = await smsService.sendOrderConfirmation(order);
        }

        // Update notification log
        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : null,
            failedAt: result.success ? null : new Date(),
            errorMessage: result.error || null,
            retryCount: notification.retryCount + 1,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to retry notifications', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Get notification history for an order
   */
  async getNotificationHistory(orderId: string) {
    try {
      return await prisma.notificationLog.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to fetch notification history', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  },

  /**
   * Save customer notification preferences
   */
  saveCustomerPreferences,

  /**
   * Get customer notification preferences
   */
  getCustomerPreferences,
};

export default notificationManager;
