/**
 * NOTIFICATION MANAGER - Orchestrates all notifications
 * 
 * Handles Email + SMS notifications
 * Retry logic with exponential backoff
 * Graceful degradation if one fails
 */

import { Order, OrderStatus } from '@/types';
import { sendEmailNotification } from './email-service';
import { sendSMSNotification } from './sms-service';
import { logger } from '@/utils/logger';

/**
 * Statuses that trigger customer notifications
 */
const NOTIFY_STATUSES: OrderStatus[] = [
  'confirmed',
  'preparing',
  'ready',
  'out-for-delivery',
  'delivered',
];

/**
 * Send all notifications for an order status change
 * 
 * Returns true if at least one notification succeeds
 * Logs failures but doesn't throw (graceful degradation)
 */
export async function notifyOrderStatusChange(
  order: Order,
  newStatus: OrderStatus
): Promise<{ success: boolean; emailSent: boolean; smsSent: boolean }> {
  // Only send notifications for specific statuses
  if (!NOTIFY_STATUSES.includes(newStatus)) {
    logger.debug('Skipping notification for status', {
      orderNumber: order.orderNumber,
      status: newStatus,
    });
    return { success: true, emailSent: false, smsSent: false };
  }

  const startTime = Date.now();
  
  logger.info('Sending notifications for order status change', {
    orderNumber: order.orderNumber,
    oldStatus: order.status,
    newStatus,
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
  });

  // Send email and SMS in parallel for speed
  const [emailResult, smsResult] = await Promise.allSettled([
    sendEmailNotification(order, newStatus),
    sendSMSNotification(order, newStatus),
  ]);

  const emailSent = emailResult.status === 'fulfilled' && emailResult.value.success;
  const smsSent = smsResult.status === 'fulfilled' && smsResult.value.success;

  // Log results
  const duration = Date.now() - startTime;
  
  if (emailSent && smsSent) {
    logger.info('All notifications sent successfully', {
      orderNumber: order.orderNumber,
      status: newStatus,
      duration,
    });
  } else if (emailSent || smsSent) {
    logger.warn('Partial notification success', {
      orderNumber: order.orderNumber,
      status: newStatus,
      emailSent,
      smsSent,
      duration,
    });
  } else {
    logger.error('All notifications failed', {
      orderNumber: order.orderNumber,
      status: newStatus,
      emailError: emailResult.status === 'rejected' ? emailResult.reason : 
                  (emailResult.value.error || 'Unknown'),
      smsError: smsResult.status === 'rejected' ? smsResult.reason : 
                (smsResult.value.error || 'Unknown'),
      duration,
    });
  }

  // Success if at least one notification was sent
  return {
    success: emailSent || smsSent,
    emailSent,
    smsSent,
  };
}

/**
 * Send notification with retry logic (exponential backoff)
 * 
 * Retries up to 3 times with delays: 1s, 2s, 4s
 */
export async function notifyWithRetry(
  order: Order,
  newStatus: OrderStatus,
  maxRetries = 3
): Promise<{ success: boolean; emailSent: boolean; smsSent: boolean }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await notifyOrderStatusChange(order, newStatus);
      
      // If at least one notification succeeded, we're good
      if (result.success) {
        if (attempt > 1) {
          logger.info('Notification succeeded after retry', {
            orderNumber: order.orderNumber,
            attempt,
          });
        }
        return result;
      }
      
      lastError = 'All notifications failed';
      
    } catch (error) {
      lastError = error;
      logger.warn('Notification attempt failed', {
        orderNumber: order.orderNumber,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
    // Don't sleep on last attempt
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  logger.error('Notification failed after all retries', {
    orderNumber: order.orderNumber,
    maxRetries,
    lastError: lastError instanceof Error ? lastError.message : String(lastError),
  });
  
  return { success: false, emailSent: false, smsSent: false };
}

/**
 * Batch notify multiple orders (useful for bulk status updates)
 */
export async function notifyBatch(
  orders: Order[],
  newStatus: OrderStatus
): Promise<{ total: number; successful: number; failed: number }> {
  const results = await Promise.allSettled(
    orders.map(order => notifyOrderStatusChange(order, newStatus))
  );
  
  const successful = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;
  
  return {
    total: orders.length,
    successful,
    failed: orders.length - successful,
  };
}

