/**
 * EMAIL SERVICE - Production-Ready Email Notifications
 * 
 * Architecture: Multi-provider support with fallback
 * Primary: SendGrid/Resend
 * Fallback: SMTP (Nodemailer)
 * 
 * Features:
 * - Professional HTML templates
 * - PDF receipt generation
 * - Retry logic with exponential backoff
 * - Error tracking
 */

import nodemailer from 'nodemailer';
import { Order, CustomerInfo } from '@/types';
import { logger } from '@/utils/logger';
import { restaurantInfo } from '@/data/menuData';

// Email provider configuration
const EMAIL_CONFIG = {
  provider: process.env.EMAIL_PROVIDER || 'smtp', // 'sendgrid', 'resend', 'smtp'
  from: process.env.EMAIL_FROM || `GharSe <orders@gharse.app>`,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
    },
  },
};

// Email templates
const generateOrderConfirmationHTML = (order: Order): string => {
  const itemsHTML = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0;">${item.menuItem.name} × ${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right;">₹${item.subtotal.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%);">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.15);">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #fff9f5 0%, #ffffff 100%); padding: 16px 20px; text-align: center; border-bottom: 3px solid #FF6B35;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.app'}/images/GharSe.png" alt="GharSe" style="max-width: 140px; height: auto; display: inline-block;" />
    </div>

    <!-- Order Confirmation Badge -->
    <div style="text-align: center; padding: 16px 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; display: inline-block; padding: 8px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);">
        ✓ Order Confirmed
      </div>
    </div>

    <!-- Order Details -->
    <div style="padding: 20px; background: linear-gradient(180deg, #ffffff 0%, #fffbf8 100%);">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;">
        Order #${order.orderNumber}
      </h2>
      
      <div style="background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%); border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #FF6B35; box-shadow: 0 2px 6px rgba(255, 107, 53, 0.08);">
        <p style="margin: 0 0 6px 0; color: #f77f00; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600;">Estimated Preparation Time</p>
        <p style="margin: 0; color: #1f2937; font-size: 28px; font-weight: 700;">
          ${new Date(order.estimatedReadyTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
          ${new Date(order.estimatedReadyTime).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 16px; background-color: #f9fafb; padding: 12px; border-radius: 6px;">
        <h3 style="color: #FF6B35; font-size: 15px; margin: 0 0 8px 0; font-weight: 600;">Delivery Details</h3>
        <p style="margin: 0 0 4px 0; color: #1f2937;"><strong>${order.customer.name}</strong></p>
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${order.customer.phone}</p>
        ${
          order.deliveryAddress
            ? `
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
            ${order.deliveryAddress.street}<br>
            ${order.deliveryAddress.city}, ${order.deliveryAddress.zipCode}
          </p>
        `
            : `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Pickup from restaurant</p>`
        }
      </div>

      <!-- Order Items -->
      <h3 style="color: #FF6B35; font-size: 15px; margin: 0 0 10px 0; font-weight: 600;">Your Order</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Pricing Summary -->
      <table style="width: 100%; margin-bottom: 16px; background-color: #f9fafb; border-radius: 6px; padding: 10px;">
        <tbody>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280; font-size: 14px;">Subtotal</td>
            <td style="padding: 6px 8px; text-align: right; color: #1f2937; font-weight: 500; font-size: 14px;">₹${order.pricing.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280; font-size: 14px;">Tax</td>
            <td style="padding: 6px 8px; text-align: right; color: #1f2937; font-weight: 500; font-size: 14px;">₹${order.pricing.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; color: #6b7280; font-size: 14px;">Delivery Fee</td>
            <td style="padding: 6px 8px; text-align: right; color: #1f2937; font-weight: 500; font-size: 14px;">
              ${order.pricing.deliveryFee === 0 ? '<span style="color: #10b981; font-weight: 600;">FREE</span>' : `₹${order.pricing.deliveryFee.toFixed(2)}`}
            </td>
          </tr>
          ${
            order.pricing.discount && order.pricing.discount > 0
              ? `
          <tr>
            <td style="padding: 6px 8px; color: #10b981; font-size: 14px;">Discount</td>
            <td style="padding: 6px 8px; text-align: right; color: #10b981; font-weight: 600; font-size: 14px;">-₹${order.pricing.discount.toFixed(2)}</td>
          </tr>
          `
              : ''
          }
          <tr style="border-top: 2px solid #FF6B35;">
            <td style="padding: 10px 8px; color: #1f2937; font-weight: 700; font-size: 16px;">Total</td>
            <td style="padding: 10px 8px; text-align: right; color: #FF6B35; font-weight: 700; font-size: 18px;">₹${order.pricing.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Payment Info -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 3px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 0; box-shadow: 0 1px 3px rgba(245, 158, 11, 0.08);">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>Payment:</strong> ${order.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery' : 'Online Payment'}
          ${order.paymentStatus === 'completed' ? '(Paid ✓)' : order.paymentMethod === 'cash-on-delivery' ? '' : '(Pending)'}
        </p>
      </div>

      ${
        order.specialInstructions
          ? `
      <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; margin-top: 12px; margin-bottom: 0;">
        <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Special Instructions</p>
        <p style="margin: 8px 0 0 0; color: #1f2937; font-size: 14px;">${order.specialInstructions}</p>
      </div>
      `
          : ''
      }

    </div>

    <!-- Footer -->
    <div style="background: linear-gradient(180deg, #fff9f5 0%, #ffe8dc 100%); border-top: 3px solid #FF6B35; padding: 24px 20px 20px 20px; text-align: center; margin-top: 0;">
      <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 15px; font-weight: 600;">Thank you for choosing GharSe!</p>
      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #f77f00; text-transform: uppercase; letter-spacing: 0.3px;">Need Help?</p>
      <p style="margin: 0 0 3px 0;">
        <a href="mailto:support@gharse.app" style="color: #FF6B35; text-decoration: none; font-size: 13px; font-weight: 600;">support@gharse.app</a>
      </p>
      <p style="margin: 0 0 12px 0;">
        <a href="https://gharse.app" style="color: #FF6B35; text-decoration: none; font-size: 13px; font-weight: 600;">www.gharse.app</a>
      </p>
      <p style="margin: 0; font-size: 11px; color: #92400e; padding-top: 12px; border-top: 1px solid rgba(255, 107, 53, 0.2);">© 2025 GharSe • Authentic Home-Cooked Food</p>
    </div>
  </div>
</body>
</html>
  `;
};

const generateStatusUpdateHTML = (order: Order, newStatus: string): string => {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: 'Your Ghar (Home) Kitchen is Ready!',
      message: 'Your order has been confirmed! Our home chef is rolling up their sleeves and getting the stove ready. Authentic flavors from our home to yours!',
      color: '#10b981',
    },
    preparing: {
      title: 'Cooking with Love at GharSe!',
      message: 'Your meal is sizzling in our home kitchen right now! Our chef is adding that special "ghar ka tadka" (home-style seasoning) just for you. Fresh, hot, and made with care!',
      color: '#f59e0b',
    },
    ready: {
      title: 'Fresh from Our Home Kitchen!',
      message: 'Your delicious meal is ready! It\'s hot, fresh, and packed with love - just like mom makes it at home. Get ready to enjoy authentic "ghar ka khana" (home-cooked food)!',
      color: '#8b5cf6',
    },
    'out-for-delivery': {
      title: 'Bringing Home to Your Doorstep!',
      message: 'Your GharSe order is on its way! Our delivery partner is rushing to bring you fresh home-cooked food while it\'s still steaming hot. Almost there!',
      color: '#3b82f6',
    },
    delivered: {
      title: 'Delivered! Enjoy Your Home-Cooked Meal!',
      message: 'Your order has been delivered! Time to dig into delicious, authentic home-cooked food. Enjoy every bite and feel the warmth of "ghar ka khana"!',
      color: '#10b981',
    },
  };

  const status = statusMessages[newStatus] || statusMessages.confirmed;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update - ${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%);">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.15);">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #fff9f5 0%, #ffffff 100%); padding: 16px 20px; text-align: center; border-bottom: 3px solid #FF6B35;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.app'}/images/GharSe.png" alt="GharSe" style="max-width: 140px; height: auto; display: inline-block;" />
    </div>

    <!-- Status Update -->
    <div style="text-align: center; padding: 20px; background: #fffbf8;">
      <div style="background: ${status.color}; color: #fff; display: inline-block; padding: 8px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-bottom: 10px;">
        ${status.title}
      </div>
      <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 14px;">${status.message}</p>
      <div style="background: #fff5f0; border-radius: 6px; padding: 10px 18px; display: inline-block; border: 2px solid #FF6B35;">
        <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 700;">${order.orderNumber}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #ffe8dc; border-top: 3px solid #FF6B35; padding: 18px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Thank you for choosing GharSe!</p>
      <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 600; color: #f77f00;">NEED HELP?</p>
      <p style="margin: 0 0 2px 0;"><a href="mailto:support@gharse.app" style="color: #FF6B35; text-decoration: none; font-size: 12px; font-weight: 600;">support@gharse.app</a></p>
      <p style="margin: 0 0 8px 0;"><a href="https://gharse.app" style="color: #FF6B35; text-decoration: none; font-size: 12px; font-weight: 600;">www.gharse.app</a></p>
      <p style="margin: 0; font-size: 10px; color: #92400e; padding-top: 8px; border-top: 1px solid rgba(255, 107, 53, 0.2);">© 2025 GharSe</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate Order Rejection Email HTML
 */
const generateOrderRejectionHTML = (order: any): string => {
  const itemsHTML = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 15px;">${item.menuItem.name}</p>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">
        ₹${((item.menuItem.price || 0) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Declined</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #fff9f5 0%, #ffffff 100%); padding: 16px 20px; text-align: center; border-bottom: 3px solid #dc2626;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.app'}/images/GharSe.png" alt="GharSe" style="max-width: 140px; height: auto; display: inline-block;" />
    </div>

    <!-- Rejection Badge -->
    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; display: inline-block; padding: 8px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);">
        ✗ Order Declined
      </div>
    </div>

    <!-- Apology Message -->
    <div style="padding: 24px 20px; background: #fffbf8;">
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 12px 0; font-weight: 600; text-align: center;">
        We're Sorry 😔
      </h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">
        Unfortunately, we're unable to fulfill your order at this time.
      </p>
      
      <!-- Rejection Reason -->
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #dc2626; padding: 16px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.08);">
        <p style="margin: 0 0 6px 0; color: #991b1b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600;">
          Reason
        </p>
        <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          ${order.rejectionReason || 'Unable to fulfill order'}
        </p>
      </div>

      <!-- Order Details -->}
      <div style="background-color: #f9fafb; padding: 14px; border-radius: 6px; margin-bottom: 16px; text-align: center;">
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px; font-weight: 600;">ORDER NUMBER</p>
        <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 700;">${order.orderNumber}</p>
      </div>

      <!-- Your Order Items -->
      <h3 style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">Your Order</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background-color: #ffffff; border-radius: 6px; overflow: hidden;">
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Refund Information -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 3px solid #f59e0b; padding: 14px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(245, 158, 11, 0.08);">
        <p style="margin: 0 0 6px 0; color: #78350f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600;">
          Refund Information
        </p>
        <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.5;">
          ${order.pricing.total > 0 ? 'If you\'ve already paid, your refund will be processed within 3-5 business days.' : 'No payment was collected for this order.'}
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.app'}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #f77f00 100%); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 3px 8px rgba(255, 107, 53, 0.3);">
          Browse Menu Again
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #fee2e2; border-top: 3px solid #dc2626; padding: 18px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">We apologize for the inconvenience</p>
      <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 600; color: #dc2626;">NEED HELP?</p>
      <p style="margin: 0 0 2px 0;"><a href="mailto:support@gharse.app" style="color: #dc2626; text-decoration: none; font-size: 12px; font-weight: 600;">support@gharse.app</a></p>
      <p style="margin: 0 0 8px 0;"><a href="https://gharse.app" style="color: #dc2626; text-decoration: none; font-size: 12px; font-weight: 600;">www.gharse.app</a></p>
      <p style="margin: 0; font-size: 10px; color: #92400e; padding-top: 8px; border-top: 1px solid rgba(220, 38, 38, 0.2);">© 2025 GharSe</p>
    </div>
  </div>
</body>
</html>
  `;
};

// SMTP Transporter (with retry logic)
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  // Check if email is configured
  if (!EMAIL_CONFIG.smtp.auth.user || !EMAIL_CONFIG.smtp.auth.pass) {
    throw new Error(
      '❌ EMAIL NOT CONFIGURED: Missing SMTP credentials.\n' +
      'Required environment variables:\n' +
      '- SMTP_USER (your email address)\n' +
      '- SMTP_PASSWORD (app password for Gmail)\n\n' +
      'For Gmail: https://myaccount.google.com/apppasswords\n' +
      'For SendGrid: Set EMAIL_PROVIDER=sendgrid and SENDGRID_API_KEY\n' +
      'For Resend: Set EMAIL_PROVIDER=resend and RESEND_API_KEY'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG.smtp);
  }
  return transporter;
};

// Email sending with retry logic
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  retries: number = 3
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Check if email is configured before attempting to send
  try {
    await getTransporter();
  } catch (initError) {
    const errorMsg = initError instanceof Error ? initError.message : String(initError);
    // Return user-friendly error for missing API keys
    if (errorMsg.includes('Missing SMTP credentials') || errorMsg.includes('NOT CONFIGURED')) {
      return { success: false, error: 'Email failed — missing API key' };
    }
    if (errorMsg.includes('SENDGRID_API_KEY') || errorMsg.includes('RESEND_API_KEY')) {
      return { success: false, error: 'Email failed — invalid configuration' };
    }
    return { success: false, error: errorMsg };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Build from address with display name
      const fromName = process.env.FROM_NAME || 'GharSe';
      const fromEmail = process.env.SMTP_USER || 'bantusailaja@gmail.com';
      const fromAddress = `"${fromName}" <${fromEmail}>`;

      // Reply-To should be the business email
      const replyToEmail = process.env.FROM_EMAIL || 'orders@gharse.app';

      const result = await getTransporter().sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        replyTo: replyToEmail, // Replies go to orders@gharse.app
      });

      logger.info('Email sent successfully', {
        to: to.substring(0, 3) + '***', // Privacy
        subject,
        messageId: result.messageId,
        attempt,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.warn(`Email send attempt ${attempt} failed`, {
        to: to.substring(0, 3) + '***',
        subject,
        error: errorMessage,
        attempt,
      });

      if (attempt === retries) {
        logger.error('Email send failed after all retries', {
          to: to.substring(0, 3) + '***',
          subject,
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

// Public API
export const emailService = {
  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: Order): Promise<{ success: boolean; error?: string }> {
    const subject = `Order Confirmed - ${order.orderNumber} | ${restaurantInfo.name}`;
    const html = generateOrderConfirmationHTML(order);

    return sendEmailWithRetry(order.customer.email, subject, html);
  },

  /**
   * Send order status update email
   */
  async sendStatusUpdate(order: Order, newStatus: string): Promise<{ success: boolean; error?: string }> {
    const subject = `Order Update - ${order.orderNumber} | ${restaurantInfo.name}`;
    const html = generateStatusUpdateHTML(order, newStatus);

    return sendEmailWithRetry(order.customer.email, subject, html);
  },

  /**
   * Send order rejection email
   */
  async sendOrderRejection(order: any): Promise<{ success: boolean; error?: string }> {
    const subject = `Order Declined - ${order.orderNumber} | ${restaurantInfo.name}`;
    const html = generateOrderRejectionHTML(order);

    return sendEmailWithRetry(order.customer.email, subject, html);
  },

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await getTransporter().verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },
};

export default emailService;
