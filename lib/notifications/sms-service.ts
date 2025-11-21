/**
 * SMS SERVICE - Production-Ready SMS Notifications via Twilio
 * 
 * Architecture: Twilio SMS for India (+91 numbers)
 * 
 * Features:
 * - Order confirmation SMS
 * - Status update SMS (critical milestones only)
 * - Cost optimization (only high-value orders or on customer request)
 * - Retry logic with exponential backoff
 * - Error tracking
 */

import { Order } from '@/types';
import { logger } from '@/utils/logger';
import { restaurantInfo } from '@/data/menuData';

// Twilio configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || restaurantInfo.contact.phone,
  enabled: process.env.TWILIO_ENABLED !== 'false', // Default enabled if credentials exist
  minOrderValue: parseFloat(process.env.SMS_MIN_ORDER_VALUE || '500'), // Only send SMS for orders >₹500
};

// SMS templates
const generateOrderConfirmationSMS = (order: Order): string => {
  const estimatedTime = new Date(order.estimatedReadyTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `✓ Order Confirmed!

${restaurantInfo.name}
Order: ${order.orderNumber}
Total: ₹${order.pricing.total.toFixed(0)}
Ready by: ${estimatedTime}

${order.orderType === 'delivery' ? 'Will be delivered to you.' : 'Ready for pickup.'}

Track: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${order.orderNumber}

Call: ${restaurantInfo.contact.phone}
- ${restaurantInfo.name}`;
};

const generateStatusUpdateSMS = (order: Order, newStatus: string): string => {
  const statusMessages: Record<string, string> = {
    confirmed: `Order ${order.orderNumber} confirmed! We're preparing your food. Ready by ${new Date(order.estimatedReadyTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}.`,
    preparing: `Your order ${order.orderNumber} is being prepared! 👨‍🍳`,
    ready: `Order ${order.orderNumber} is ready! ${order.orderType === 'delivery' ? 'Out for delivery soon.' : 'Ready for pickup.'}`,
    'out-for-delivery': `Order ${order.orderNumber} is on the way! 🛵`,
    delivered: `Order ${order.orderNumber} delivered! Enjoy your meal! 🍽️`,
  };

  const message = statusMessages[newStatus] || `Order ${order.orderNumber} status updated.`;

  return `${message}

Need help? Call ${restaurantInfo.contact.phone}
- ${restaurantInfo.name}`;
};

// Twilio client wrapper
class TwilioClient {
  private client: any = null;

  private async initClient() {
    if (!TWILIO_CONFIG.accountSid || !TWILIO_CONFIG.authToken || !TWILIO_CONFIG.phoneNumber) {
      throw new Error(
        '❌ SMS NOT CONFIGURED: Missing Twilio credentials.\n' +
        'Required environment variables:\n' +
        '- TWILIO_ACCOUNT_SID (from Twilio Console)\n' +
        '- TWILIO_AUTH_TOKEN (from Twilio Console)\n' +
        '- TWILIO_PHONE_NUMBER (your Twilio number)\n\n' +
        'Sign up: https://www.twilio.com (₹500 free credit for India)\n' +
        'Get credentials from: Console Dashboard > Account Info'
      );
    }

    if (!this.client) {
      // Dynamically import Twilio to avoid errors when not configured
      try {
        const twilio = await import('twilio');
        this.client = twilio.default(TWILIO_CONFIG.accountSid, TWILIO_CONFIG.authToken);
      } catch (error) {
        logger.error('Failed to initialize Twilio client', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error(
          '❌ Twilio client initialization failed. Make sure twilio package is installed: npm install twilio'
        );
      }
    }

    return this.client;
  }

  async sendSMS(
    to: string,
    message: string,
    retries: number = 3
  ): Promise<{ success: boolean; error?: string; sid?: string }> {
    // Validate phone number format (India)
    const phoneNumber = this.formatPhoneNumber(to);
    if (!phoneNumber) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Check if Twilio is configured before attempting to send
    try {
      await this.initClient();
    } catch (initError) {
      const errorMsg = initError instanceof Error ? initError.message : String(initError);
      // Return user-friendly error for missing API keys
      if (errorMsg.includes('Missing Twilio credentials') || errorMsg.includes('NOT CONFIGURED')) {
        return { success: false, error: 'SMS not sent — missing API key' };
      }
      if (errorMsg.includes('initialization failed')) {
        return { success: false, error: 'SMS failed — invalid configuration' };
      }
      return { success: false, error: errorMsg };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.initClient();
        
        const result = await client.messages.create({
          body: message,
          from: TWILIO_CONFIG.phoneNumber,
          to: phoneNumber,
        });

        logger.info('SMS sent successfully', {
          to: phoneNumber.substring(0, 6) + '***', // Privacy
          sid: result.sid,
          status: result.status,
          attempt,
        });

        return { success: true, sid: result.sid };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        logger.warn(`SMS send attempt ${attempt} failed`, {
          to: phoneNumber.substring(0, 6) + '***',
          error: errorMessage,
          attempt,
        });

        if (attempt === retries) {
          logger.error('SMS send failed after all retries', {
            to: phoneNumber.substring(0, 6) + '***',
            error: errorMessage,
            totalAttempts: retries,
          });
          return { success: false, error: errorMessage };
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Format phone number to E.164 format for Twilio
   * Handles India (+91) numbers
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // India number (10 digits starting with 6-9)
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    // Already in E.164 format
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }

    // Invalid format
    logger.warn('Invalid phone number format', { phone: phone.substring(0, 3) + '***' });
    return null;
  }
}

const twilioClient = new TwilioClient();

// Public API
export const smsService = {
  /**
   * Check if SMS should be sent (cost optimization)
   */
  shouldSendSMS(order: Order, customerPreference?: boolean): boolean {
    // Don't send if Twilio not configured
    if (!TWILIO_CONFIG.accountSid || !TWILIO_CONFIG.authToken) {
      logger.debug('SMS not sent: Twilio not configured');
      return false;
    }

    // Don't send if disabled
    if (!TWILIO_CONFIG.enabled) {
      logger.debug('SMS not sent: SMS service disabled');
      return false;
    }

    // Customer explicitly requested SMS
    if (customerPreference === true) {
      return true;
    }

    // Customer explicitly opted out
    if (customerPreference === false) {
      return false;
    }

    // Send SMS for high-value orders (default: >₹500)
    if (order.pricing.total >= TWILIO_CONFIG.minOrderValue) {
      return true;
    }

    logger.debug('SMS not sent: Order value below threshold', {
      orderValue: order.pricing.total,
      threshold: TWILIO_CONFIG.minOrderValue,
    });
    return false;
  },

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(
    order: Order,
    customerPreference?: boolean
  ): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
    if (!this.shouldSendSMS(order, customerPreference)) {
      return { success: true, skipped: true };
    }

    const message = generateOrderConfirmationSMS(order);
    return twilioClient.sendSMS(order.customer.phone, message);
  },

  /**
   * Send order status update SMS
   * Only sends for critical milestones to reduce SMS costs
   */
  async sendStatusUpdate(
    order: Order,
    newStatus: string,
    customerPreference?: boolean
  ): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
    // Only send SMS for these critical statuses (cost optimization)
    // Email is sent for ALL statuses, SMS only for key milestones
    const criticalStatuses = ['confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered'];
    
    if (!criticalStatuses.includes(newStatus)) {
      logger.debug('SMS skipped - not a critical status', { 
        orderNumber: order.orderNumber, 
        status: newStatus 
      });
      return { success: true, skipped: true };
    }

    if (!this.shouldSendSMS(order, customerPreference)) {
      logger.debug('SMS skipped - shouldSendSMS returned false', { 
        orderNumber: order.orderNumber, 
        status: newStatus 
      });
      return { success: true, skipped: true };
    }

    const message = generateStatusUpdateSMS(order, newStatus);
    logger.info('Sending status update SMS', { 
      orderNumber: order.orderNumber, 
      status: newStatus,
      phone: order.customer.phone.substring(0, 3) + '***'
    });
    return twilioClient.sendSMS(order.customer.phone, message);
  },

  /**
   * Test SMS configuration
   */
  async testConnection(testPhoneNumber: string): Promise<boolean> {
    try {
      const result = await twilioClient.sendSMS(
        testPhoneNumber,
        `Test message from ${restaurantInfo.name}. Your SMS service is configured correctly! 🎉`
      );
      return result.success;
    } catch (error) {
      logger.error('SMS service connection test failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },
};

export default smsService;
