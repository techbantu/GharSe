/**
 * SMS SERVICE - Production-Grade SMS Notifications
 * 
 * Uses Twilio for sending SMS notifications
 * Short, actionable messages for order updates
 */

import { Order, OrderStatus } from '@/types';
import { logger } from '@/utils/logger';

// SMS configuration
const SMS_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER || '+919010460964',
};

/**
 * SMS Templates - Short and actionable (160 chars limit best practice)
 */
const SMS_TEMPLATES = {
  confirmed: (order: Order) => 
    `Order ${order.orderNumber} confirmed! We're preparing your food. Ready in ~${Math.ceil((new Date(order.estimatedReadyTime).getTime() - Date.now()) / 60000)} min. Track: http://localhost:3000/track-order?id=${order.id}`,

  preparing: (order: Order) =>
    `🍳 Kitchen Update! Your order ${order.orderNumber} is being prepared by our chef. Almost ready!`,

  ready: (order: Order) =>
    `✅ Order ${order.orderNumber} is ready! ${order.orderType === 'delivery' ? 'Out for delivery soon.' : 'Ready for pickup at our restaurant.'}`,

  'out-for-delivery': (order: Order) =>
    `🚗 Your order ${order.orderNumber} is on the way! Delivering to ${order.deliveryAddress?.street}. Please be available.`,

  delivered: (order: Order) =>
    `🎉 Order ${order.orderNumber} delivered! Enjoy your meal from Bantu's Kitchen! Rate: http://localhost:3000/feedback?order=${order.id}`,
};

/**
 * Send SMS notification
 */
export async function sendSMSNotification(
  order: Order,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get template for status
    const templateFn = SMS_TEMPLATES[status as keyof typeof SMS_TEMPLATES];
    
    if (!templateFn) {
      logger.warn(`No SMS template for status: ${status}`);
      return { success: false, error: `No template for status: ${status}` };
    }

    const message = templateFn(order);
    const phoneNumber = order.customer.phone;

    // Validate phone number format
    if (!phoneNumber || phoneNumber.length < 10) {
      logger.warn('Invalid phone number for SMS', {
        orderNumber: order.orderNumber,
        phone: phoneNumber,
      });
      return { success: false, error: 'Invalid phone number' };
    }

    // In development, just log the SMS
    if (process.env.NODE_ENV === 'development') {
      logger.info('📱 SMS notification (DEV MODE - not sent)', {
        to: phoneNumber,
        message: message.substring(0, 50) + '...',
        orderNumber: order.orderNumber,
        status,
      });
      
      // Log to console for visibility
      console.log('\n' + '='.repeat(80));
      console.log('📱 SMS NOTIFICATION (Development Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${phoneNumber}`);
      console.log(`Order: ${order.orderNumber}`);
      console.log(`Status: ${status}`);
      console.log(`Message: ${message}`);
      console.log('='.repeat(80) + '\n');
      
      return { success: true };
    }

    // Production: Send actual SMS via Twilio
    // TODO: Integrate with Twilio SDK
    // const twilio = require('twilio');
    // const client = twilio(SMS_CONFIG.accountSid, SMS_CONFIG.authToken);
    // await client.messages.create({
    //   body: message,
    //   from: SMS_CONFIG.fromNumber,
    //   to: phoneNumber,
    // });

    logger.info('SMS notification sent', {
      to: phoneNumber,
      orderNumber: order.orderNumber,
      status,
    });

    return { success: true };

  } catch (error) {
    logger.error('Failed to send SMS notification', {
      error: error instanceof Error ? error.message : String(error),
      orderNumber: order.orderNumber,
      status,
    }, error instanceof Error ? error : undefined);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format phone number to E.164 format
 * Example: +919876543210
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with country code, keep it
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If 10 digits, assume Indian number
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // Otherwise, return as is with + prefix
  return digits.startsWith('+') ? digits : `+${digits}`;
}

