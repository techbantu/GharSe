/**
 * SMART KITCHEN INTELLIGENCE - Price Alert Notification Service
 * 
 * Purpose: Notify customers when prices drop significantly
 * Channels: Push notifications, email, SMS (optional)
 * 
 * Triggers:
 * - Price drops by 20%+ on favorited items
 * - Critical expiry discounts (40%+ off)
 * - Idle kitchen discounts during customer's typical order times
 */

import { prisma } from '@/lib/prisma';

interface PriceAlertData {
  customerId: string;
  menuItemId: string;
  itemName: string;
  originalPrice: number;
  newPrice: number;
  discountPercent: number;
  reason: string;
  urgency: string;
  expiresAt: Date;
}

/**
 * Check if customer should be notified about a price drop
 */
async function shouldNotifyCustomer(
  customerId: string,
  menuItemId: string
): Promise<boolean> {
  // Check if customer has this item in favorites
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { favoriteItems: true },
  });

  if (!customer) return false;

  try {
    const favorites = customer.favoriteItems ? JSON.parse(customer.favoriteItems) : [];
    return favorites.includes(menuItemId);
  } catch {
    return false;
  }
}

/**
 * Send price alert notification to customer
 */
export async function sendPriceAlert(alert: PriceAlertData): Promise<boolean> {
  try {
    // Check if customer wants notifications
    const shouldNotify = await shouldNotifyCustomer(alert.customerId, alert.menuItemId);
    
    if (!shouldNotify) {
      console.log(`Customer ${alert.customerId} not interested in ${alert.menuItemId}`);
      return false;
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: alert.customerId },
      select: {
        email: true,
        phone: true,
        name: true,
        notificationPrefs: true,
      },
    });

    if (!customer) return false;

    // Parse notification preferences
    let prefs = { email: true, sms: false, push: true };
    try {
      if (customer.notificationPrefs) {
        prefs = JSON.parse(customer.notificationPrefs);
      }
    } catch {}

    const message = generateNotificationMessage(alert);

    // Send push notification (if enabled)
    if (prefs.push) {
      await sendPushNotification(customer.email, message);
    }

    // Send email (if enabled)
    if (prefs.email) {
      await sendEmailNotification(customer.email, customer.name, alert);
    }

    // Send SMS (if enabled)
    if (prefs.sms) {
      await sendSMSNotification(customer.phone, message.short);
    }

    console.log(`✓ Price alert sent to ${customer.name} for ${alert.itemName}`);
    return true;

  } catch (error) {
    console.error('Failed to send price alert:', error);
    return false;
  }
}

/**
 * Generate notification message
 */
function generateNotificationMessage(alert: PriceAlertData) {
  const savings = alert.originalPrice - alert.newPrice;
  
  return {
    title: `${alert.discountPercent}% OFF: ${alert.itemName}!`,
    short: `${alert.itemName} is now ₹${alert.newPrice} (was ₹${alert.originalPrice}). Save ₹${savings}!`,
    long: `Great news! ${alert.itemName} just dropped to ₹${alert.newPrice} (${alert.discountPercent}% off). ${alert.reason}. ${alert.urgency}`,
    cta: 'Order Now',
    url: `/menu?item=${alert.menuItemId}`,
  };
}

/**
 * Send push notification (Web Push API)
 */
async function sendPushNotification(
  customerEmail: string,
  message: any
): Promise<void> {
  // TODO: Implement Web Push API
  // For now, log the notification
  console.log(`[PUSH] ${customerEmail}: ${message.title}`);
  
  // In production, use web-push library:
  // const webpush = require('web-push');
  // await webpush.sendNotification(subscription, JSON.stringify(message));
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  name: string,
  alert: PriceAlertData
): Promise<void> {
  // Use existing email service
  console.log(`[EMAIL] ${email}: Price alert for ${alert.itemName}`);
  
  // TODO: Integrate with existing email service
  // const { sendEmail } = require('@/lib/notifications/email-service');
  // await sendEmail({
  //   to: email,
  //   subject: `${alert.discountPercent}% OFF: ${alert.itemName}!`,
  //   template: 'price-alert',
  //   data: alert,
  // });
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(
  phone: string,
  message: string
): Promise<void> {
  console.log(`[SMS] ${phone}: ${message}`);
  
  // TODO: Integrate with Twilio
  // const { sendSMS } = require('@/lib/notifications/sms-service');
  // await sendSMS(phone, message);
}

/**
 * Batch notify all interested customers about a price drop
 */
export async function notifyPriceDrop(
  menuItemId: string,
  originalPrice: number,
  newPrice: number,
  reason: string,
  urgency: string
): Promise<number> {
  const discountPercent = Math.round(((originalPrice - newPrice) / originalPrice) * 100);

  // Only notify for significant discounts (20%+)
  if (discountPercent < 20) {
    console.log(`Discount too small (${discountPercent}%), skipping notifications`);
    return 0;
  }

  // Get menu item details
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { name: true },
  });

  if (!menuItem) return 0;

  // Get all customers who have this in favorites
  const customers = await prisma.customer.findMany({
    where: {
      accountStatus: 'ACTIVE',
    },
    select: {
      id: true,
      favoriteItems: true,
    },
  });

  let notifiedCount = 0;

  for (const customer of customers) {
    try {
      const favorites = customer.favoriteItems ? JSON.parse(customer.favoriteItems) : [];
      
      if (favorites.includes(menuItemId)) {
        const alert: PriceAlertData = {
          customerId: customer.id,
          menuItemId,
          itemName: menuItem.name,
          originalPrice,
          newPrice,
          discountPercent,
          reason,
          urgency,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        };

        const sent = await sendPriceAlert(alert);
        if (sent) notifiedCount++;
      }
    } catch (error) {
      console.error(`Failed to notify customer ${customer.id}:`, error);
    }
  }

  console.log(`✓ Notified ${notifiedCount} customers about ${menuItem.name} price drop`);
  return notifiedCount;
}

/**
 * Notify customers about idle kitchen discounts
 * This runs automatically during low-capacity periods
 */
export async function notifyIdleKitchenDiscounts(): Promise<void> {
  console.log('Checking for idle kitchen discount opportunities...');

  // Get popular items with significant discounts right now
  const popularItems = await prisma.menuItem.findMany({
    where: {
      isPopular: true,
      isAvailable: true,
    },
    take: 10,
  });

  for (const item of popularItems) {
    // Check if this item has a significant discount
    const priceResponse = await fetch(`http://localhost:3000/api/pricing/dynamic/${item.id}`);
    const priceData = await priceResponse.json();

    if (priceData.discount >= 20) {
      await notifyPriceDrop(
        item.id,
        priceData.basePrice,
        priceData.currentPrice,
        priceData.reason,
        priceData.urgency
      );
    }
  }
}

export default {
  sendPriceAlert,
  notifyPriceDrop,
  notifyIdleKitchenDiscounts,
};

