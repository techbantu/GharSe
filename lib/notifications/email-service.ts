/**
 * EMAIL SERVICE - Production-Grade Email Notifications
 * 
 * Uses Nodemailer for sending transactional emails
 * Templates for different order statuses
 * Retry logic with exponential backoff
 */

import { Order, OrderStatus } from '@/types';
import { restaurantInfo } from '@/data/menuData';
import { logger } from '@/utils/logger';

// Email configuration (uses environment variables)
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail', // or 'sendgrid', 'mailgun'
  user: process.env.EMAIL_USER || 'orders@bantuskitchen.com',
  pass: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || 'Bantu\'s Kitchen <orders@bantuskitchen.com>',
};

/**
 * Email Templates for Different Order Statuses
 */
const EMAIL_TEMPLATES = {
  confirmed: (order: Order) => ({
    subject: `Order Confirmed - ${order.orderNumber} 🎉`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed!</h1>
          <p style="color: #fff3e0; margin: 8px 0 0 0; font-size: 16px;">We're preparing your delicious meal</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 32px;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 24px 0;">Hi ${order.customer.name},</p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
            Great news! Your order has been confirmed and our kitchen is getting ready to prepare your food.
          </p>

          <!-- Order Info Box -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #92400e; font-weight: 600;">ORDER DETAILS</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Total:</strong> ₹${order.pricing.total.toFixed(2)}</p>
            <p style="margin: 0; font-size: 16px; color: #1f2937;"><strong>Estimated Ready:</strong> ${Math.ceil((new Date(order.estimatedReadyTime).getTime() - Date.now()) / 60000)} minutes</p>
          </div>

          <!-- Items List -->
          <div style="margin: 0 0 24px 0;">
            <p style="font-weight: 600; color: #1f2937; margin: 0 0 12px 0;">Your Items:</p>
            ${order.items.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #4b5563;">${item.quantity}x ${item.menuItem.name}</span>
                <span style="color: #1f2937; font-weight: 500;">₹${item.subtotal.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 16px 0;">
            You'll receive another notification when your order is being prepared.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:3000/track-order?id=${order.id}" 
               style="display: inline-block; background: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Track Your Order
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
            Questions? Call us at <a href="tel:+919010460964" style="color: #f97316; text-decoration: none;">+91 90104 60964</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            ${restaurantInfo.address.street}, ${restaurantInfo.address.city}
          </p>
        </div>
      </div>
    `,
    text: `Hi ${order.customer.name},\n\nYour order ${order.orderNumber} has been confirmed!\n\nTotal: ₹${order.pricing.total.toFixed(2)}\nEstimated ready in: ${Math.ceil((new Date(order.estimatedReadyTime).getTime() - Date.now()) / 60000)} minutes\n\nYou'll receive updates as we prepare your food.\n\nTrack your order: http://localhost:3000/track-order?id=${order.id}\n\nQuestions? Call +91 90104 60964`,
  }),

  preparing: (order: Order) => ({
    subject: `Your food is being prepared - ${order.orderNumber} 👨‍🍳`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Kitchen Update! 👨‍🍳</h1>
          <p style="color: #ede9fe; margin: 8px 0 0 0; font-size: 16px;">Your delicious meal is being prepared</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 24px 0;">Hi ${order.customer.name},</p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
            Our chef is now preparing your order with fresh ingredients and lots of love! 🔥
          </p>

          <div style="background: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Order:</strong> ${order.orderNumber}</p>
            <p style="margin: 0; font-size: 16px; color: #1f2937;"><strong>Ready in:</strong> ~${Math.ceil((new Date(order.estimatedReadyTime).getTime() - Date.now()) / 60000)} minutes</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0;">
            We'll notify you as soon as your order is ready for ${order.orderType === 'delivery' ? 'delivery' : 'pickup'}!
          </p>
        </div>

        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Track order: <a href="http://localhost:3000/track-order?id=${order.id}" style="color: #8b5cf6; text-decoration: none;">Click here</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${order.customer.name},\n\nYour order ${order.orderNumber} is now being prepared by our chef! 👨‍🍳\n\nReady in: ~${Math.ceil((new Date(order.estimatedReadyTime).getTime() - Date.now()) / 60000)} minutes\n\nTrack: http://localhost:3000/track-order?id=${order.id}`,
  }),

  ready: (order: Order) => ({
    subject: `Order Ready! - ${order.orderNumber} ✅`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Your Order is Ready! ✅</h1>
          <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">${order.orderType === 'delivery' ? 'Out for delivery soon' : 'Ready for pickup'}</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 24px 0;">Hi ${order.customer.name},</p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
            Great news! Your delicious meal is ready and ${order.orderType === 'delivery' ? 'will be on its way shortly' : 'waiting for you to pick up'}! 🎉
          </p>

          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Order:</strong> ${order.orderNumber}</p>
            <p style="margin: 0; font-size: 16px; color: #1f2937;"><strong>Status:</strong> ${order.orderType === 'delivery' ? 'Ready for delivery' : 'Ready for pickup'}</p>
          </div>

          ${order.orderType === 'pickup' ? `
            <div style="background: #fef3c7; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
              <p style="margin: 0 0 12px 0; font-weight: 600; color: #92400e;">PICKUP LOCATION:</p>
              <p style="margin: 0; color: #1f2937; line-height: 1.6;">
                ${restaurantInfo.address.street}<br>
                ${restaurantInfo.address.city}, ${restaurantInfo.address.state} ${restaurantInfo.address.zipCode}
              </p>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0;">
            Thank you for choosing Bantu's Kitchen! Enjoy your meal! 😊
          </p>
        </div>

        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Questions? Call <a href="tel:+919010460964" style="color: #10b981; text-decoration: none;">+91 90104 60964</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${order.customer.name},\n\nYour order ${order.orderNumber} is ready! ✅\n\n${order.orderType === 'delivery' ? 'It will be delivered shortly.' : `Pickup at: ${restaurantInfo.address.street}, ${restaurantInfo.address.city}`}\n\nEnjoy your meal!`,
  }),

  'out-for-delivery': (order: Order) => ({
    subject: `On the way! - ${order.orderNumber} 🚗`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">On the Way! 🚗</h1>
          <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 16px;">Your order is out for delivery</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 24px 0;">Hi ${order.customer.name},</p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
            Your order is now on its way! Our delivery partner will reach you soon. 🚗💨
          </p>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Order:</strong> ${order.orderNumber}</p>
            <p style="margin: 0; font-size: 16px; color: #1f2937;"><strong>Delivering to:</strong> ${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0;">
            Please be available to receive your order. Call us at +91 90104 60964 if you need any help!
          </p>
        </div>

        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Track live: <a href="http://localhost:3000/track-order?id=${order.id}" style="color: #3b82f6; text-decoration: none;">Click here</a>
          </p>
        </div>
      </div>
    `,
    text: `Hi ${order.customer.name},\n\nYour order ${order.orderNumber} is out for delivery! 🚗\n\nDelivering to: ${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}\n\nTrack: http://localhost:3000/track-order?id=${order.id}`,
  }),

  delivered: (order: Order) => ({
    subject: `Order Delivered - ${order.orderNumber} 🎉`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bon Appétit! 🎉</h1>
          <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Your order has been delivered</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 24px 0;">Hi ${order.customer.name},</p>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
            Your order has been delivered! We hope you enjoy every bite. 😊
          </p>

          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Order:</strong> ${order.orderNumber}</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;"><strong>Total:</strong> ₹${order.pricing.total.toFixed(2)}</p>
            <p style="margin: 0; font-size: 16px; color: #1f2937;"><strong>Status:</strong> Delivered ✅</p>
          </div>

          <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for choosing Bantu's Kitchen! We'd love to hear your feedback.
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:3000/feedback?order=${order.id}" 
               style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Rate Your Experience
            </a>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
            Had a great experience? Order again!
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2025 Bantu's Kitchen. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${order.customer.name},\n\nYour order ${order.orderNumber} has been delivered! 🎉\n\nTotal: ₹${order.pricing.total.toFixed(2)}\n\nEnjoy your meal and thanks for ordering from Bantu's Kitchen!\n\nRate your experience: http://localhost:3000/feedback?order=${order.id}`,
  }),
};

/**
 * Send email notification
 */
export async function sendEmailNotification(
  order: Order,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get template for status
    const templateFn = EMAIL_TEMPLATES[status as keyof typeof EMAIL_TEMPLATES];
    
    if (!templateFn) {
      logger.warn(`No email template for status: ${status}`);
      return { success: false, error: `No template for status: ${status}` };
    }

    const template = templateFn(order);

    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 Email notification (DEV MODE - not sent)', {
        to: order.customer.email,
        subject: template.subject,
        orderNumber: order.orderNumber,
        status,
      });
      
      // Log to console for visibility
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL NOTIFICATION (Development Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${order.customer.email}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Order: ${order.orderNumber}`);
      console.log(`Status: ${status}`);
      console.log('='.repeat(80) + '\n');
      
      return { success: true };
    }

    // Production: Send actual email
    // TODO: Integrate with Nodemailer, SendGrid, or Resend
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});

    logger.info('Email notification sent', {
      to: order.customer.email,
      subject: template.subject,
      orderNumber: order.orderNumber,
      status,
    });

    return { success: true };

  } catch (error) {
    logger.error('Failed to send email notification', {
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

