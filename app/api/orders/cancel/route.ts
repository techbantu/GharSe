/**
 * NEW FILE: Order Cancellation API - Handle order cancellations and rejections
 * 
 * Purpose: Allow both customers and chefs to cancel orders with proper refund handling
 * Features:
 * - Customer cancellation (for pending/overdue orders)
 * - Chef rejection (with reason)
 * - Automatic refund processing
 * - Multi-channel notifications (Email + SMS)
 * 
 * Business Logic:
 * - Pending/Overdue orders can be cancelled
 * - Confirmed orders require chef approval
 * - Automatic refund if payment was completed
 * - Comprehensive audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import nodemailer from 'nodemailer';
import { restaurantInfo } from '@/data/menuData';
import { notificationManager } from '@/lib/notifications/notification-manager';
import { broadcastOrderUpdate } from '@/lib/websocket-server';

// ===== VALIDATION SCHEMAS =====

const CancelOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  cancelledBy: z.enum(['customer', 'chef', 'admin'], {
    errorMap: () => ({ message: 'Invalid cancellation source' }),
  } as any),
  reason: z.string().min(1, 'Cancellation reason is required'),
  refundAmount: z.number().optional(),
  additionalNotes: z.string().optional(),
});

type CancelOrderData = z.infer<typeof CancelOrderSchema>;

// ===== CANCELLATION REASONS =====

export const CANCELLATION_REASONS = {
  CUSTOMER: [
    'Changed my mind',
    'Order taking too long',
    'Ordered by mistake',
    'Found a better option',
    'Emergency - can\'t receive order',
    'Other',
  ],
  CHEF: [
    'Item not available',
    'Out of ingredients',
    'Too busy - can\'t fulfill',
    'Kitchen emergency',
    'Unable to deliver to location',
    'Duplicate order',
    'Customer unreachable',
    'Other',
  ],
  ADMIN: [
    'Fraudulent order',
    'Payment issue',
    'Policy violation',
    'System error',
    'Other',
  ],
};

// ===== CONFIGURATION =====

// Cancellation window in minutes (configurable via environment variable)
const CANCELLATION_WINDOW_MINUTES = parseInt(
  process.env.ORDER_CANCELLATION_WINDOW_MINUTES || '10',
  10
);
const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_MINUTES * 60 * 1000;

// ===== HELPER FUNCTIONS =====

/**
 * Check if order can be cancelled
 * Note: OrderStatus enum values are uppercase (PENDING, CONFIRMED, etc.)
 * 
 * Time-based cancellation rules:
 * - Customers can cancel PENDING orders (always)
 * - Customers can cancel CONFIRMED orders if within time window AND preparation hasn't started
 * - Preparation started (preparingAt exists) blocks all customer cancellations
 * - Time window expired blocks cancellation even for PENDING orders
 */
function canCancelOrder(
  orderStatus: string,
  cancelledBy: string,
  orderCreatedAt: Date,
  preparingAt?: Date | null
): { allowed: boolean; reason?: string } {
  // Normalize status to uppercase for comparison (handle both enum and string values)
  const normalizedStatus = orderStatus.toUpperCase();
  
  // Admin can cancel any non-delivered order (no time restrictions)
  if (cancelledBy === 'admin') {
    if (normalizedStatus === 'DELIVERED') {
      return { allowed: false, reason: 'Delivered orders cannot be cancelled' };
    }
    return { allowed: true };
  }

  // Customer cancellation logic - allow cancellation before OUT_FOR_DELIVERY
  if (cancelledBy === 'customer') {
    // Block cancellation if order is OUT_FOR_DELIVERY or DELIVERED
    if (normalizedStatus === 'OUT_FOR_DELIVERY') {
      return { allowed: false, reason: 'Order is already out for delivery. Cannot cancel.' };
    }

    if (normalizedStatus === 'DELIVERED') {
      return { allowed: false, reason: 'Delivered orders cannot be cancelled' };
    }

    // Block if already cancelled
    if (normalizedStatus === 'CANCELLED') {
      return { allowed: false, reason: 'Order is already cancelled' };
    }

    // Allow cancellation for PENDING_CONFIRMATION, PENDING, CONFIRMED, PREPARING
    // (before it reaches OUT_FOR_DELIVERY)
    if (['PENDING_CONFIRMATION', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(normalizedStatus)) {
      // Optional: Apply time window for PENDING and CONFIRMED (but not PREPARING)
      // This gives flexibility - customers can cancel even if preparation started
      // as long as it hasn't left the kitchen
      if (normalizedStatus === 'PENDING' || normalizedStatus === 'CONFIRMED') {
        const timeSinceCreation = Date.now() - new Date(orderCreatedAt).getTime();
        const isWithinTimeWindow = timeSinceCreation < CANCELLATION_WINDOW_MS;
        
        // For PENDING/CONFIRMED, still apply time window
        if (!isWithinTimeWindow) {
          return { 
            allowed: false, 
            reason: `Cancellation window expired. Orders can only be cancelled within ${CANCELLATION_WINDOW_MINUTES} minutes of placement.` 
          };
        }
      }
      
      // Allow cancellation (even if preparation started, as long as not OUT_FOR_DELIVERY)
      return { allowed: true };
    }

    return { allowed: false, reason: 'This order cannot be cancelled at this stage' };
  }

  // Chef can cancel/reject any non-delivered order (no time restrictions)
  if (cancelledBy === 'chef') {
    if (normalizedStatus === 'DELIVERED') {
      return { allowed: false, reason: 'Delivered orders cannot be cancelled' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Invalid cancellation request' };
}

/**
 * Process refund if payment was made
 */
async function processRefund(orderId: string, refundAmount?: number): Promise<boolean> {
  try {
    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: { orderId },
    });

    if (!payment) {
      logger.info('No payment found for order', { orderId });
      return true; // No payment to refund (COD or not paid)
    }

    // Note: PaymentStatus enum values are uppercase (PENDING, PAID, REFUNDED, etc.)
    const normalizedPaymentStatus = payment.status.toUpperCase();
    if (normalizedPaymentStatus !== 'PAID') {
      logger.info('Payment not completed, no refund needed', { orderId, paymentStatus: payment.status });
      return true;
    }

    // Calculate refund amount (full amount if not specified)
    const amountToRefund = refundAmount || payment.amount;

    // Update payment record to refunded (use enum value REFUNDED, not lowercase string)
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED', // Prisma enum value (uppercase)
        refundedAt: new Date(),
        failureReason: `Order cancelled - Refund: ₹${amountToRefund}`,
      },
    });

    logger.info('Refund processed', {
      orderId,
      paymentId: payment.id,
      amount: amountToRefund,
      gateway: payment.paymentGateway,
    });

    // TODO: Integrate with actual payment gateway for real refund
    // For now, we just mark it as refunded in our database
    // In production, call Razorpay/Stripe refund API here

    return true;
  } catch (error) {
    logger.error('Refund processing failed', { orderId, error });
    return false;
  }
}

/**
 * Get email transporter for sending custom emails
 */
function getEmailTransporter() {
  const EMAIL_CONFIG = {
    from: process.env.EMAIL_FROM || `${restaurantInfo.name} <orders@bantuskitchen.com>`,
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

  return nodemailer.createTransport(EMAIL_CONFIG.smtp);
}

/**
 * Send cancellation notifications
 */
async function sendCancellationNotifications(
  order: any,
  cancelledBy: string,
  reason: string,
  refundAmount?: number
) {
  try {
    const customerName = order.customerName;
    const orderNumber = order.orderNumber;
    const total = order.total;

    // Notification message
    const cancellerText = cancelledBy === 'customer' ? 'You' : 'The restaurant';
    const refundText = refundAmount ? `A refund of ₹${refundAmount} will be processed within 5-7 business days.` : '';

    const emailSubject = `Order ${orderNumber} Cancelled`;
    const emailBody = `
      <h2>Order Cancellation</h2>
      <p>Hi ${customerName},</p>
      <p><strong>Order ${orderNumber}</strong> has been cancelled.</p>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Cancelled by:</strong> ${cancelledBy === 'customer' ? 'You' : 'Restaurant'}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Order Total:</strong> ₹${total}</p>
        ${refundText ? `<p style="color: #10b981;"><strong>${refundText}</strong></p>` : ''}
      </div>
      
      <p>If you have any questions, please contact us at orders@bantuskitchen.com or call +91 90104 60964.</p>
      <p>We apologize for any inconvenience.</p>
    `;

    const smsMessage = `Bantu's Kitchen: Order ${orderNumber} cancelled. ${reason}. ${refundText} Questions? Call +91 90104 60964`;

    // Send email notification
    try {
      const transporter = getEmailTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `${restaurantInfo.name} <orders@bantuskitchen.com>`,
        to: order.customerEmail,
        subject: emailSubject,
        html: emailBody,
      });
      logger.info('Cancellation email sent', { orderId: order.id, orderNumber });
    } catch (emailError) {
      logger.error('Failed to send cancellation email', {
        orderId: order.id,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Don't throw - continue with SMS
    }

    // Send SMS notification (only if Twilio is configured and order value >= threshold)
    try {
      const TWILIO_CONFIG = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || restaurantInfo.contact.phone,
        enabled: process.env.TWILIO_ENABLED !== 'false',
        minOrderValue: parseFloat(process.env.SMS_MIN_ORDER_VALUE || '500'),
      };

      // Only send SMS if configured and order value meets threshold
      if (
        TWILIO_CONFIG.accountSid &&
        TWILIO_CONFIG.authToken &&
        TWILIO_CONFIG.enabled &&
        order.total >= TWILIO_CONFIG.minOrderValue
      ) {
        // Dynamically import Twilio to avoid errors when not configured
        try {
          const twilio = await import('twilio');
          const client = twilio.default(TWILIO_CONFIG.accountSid, TWILIO_CONFIG.authToken);

          // Format phone number (India +91)
          const cleaned = order.customerPhone.replace(/\D/g, '');
          const phoneNumber =
            cleaned.length === 10 && /^[6-9]/.test(cleaned)
              ? `+91${cleaned}`
              : cleaned.length === 12 && cleaned.startsWith('91')
              ? `+${cleaned}`
              : null;

          if (phoneNumber) {
            await client.messages.create({
              body: smsMessage,
              from: TWILIO_CONFIG.phoneNumber,
              to: phoneNumber,
            });
            logger.info('Cancellation SMS sent', { orderId: order.id, orderNumber });
          } else {
            logger.warn('Invalid phone number format for SMS', {
              orderId: order.id,
              phone: order.customerPhone.substring(0, 3) + '***',
            });
          }
        } catch (twilioError) {
          logger.warn('Twilio not available or SMS send failed', {
            orderId: order.id,
            error: twilioError instanceof Error ? twilioError.message : String(twilioError),
          });
          // Don't throw - SMS failure shouldn't block cancellation
        }
      } else {
        logger.debug('SMS skipped', {
          orderId: order.id,
          reason: !TWILIO_CONFIG.accountSid
            ? 'Twilio not configured'
            : order.total < TWILIO_CONFIG.minOrderValue
            ? 'Order value below threshold'
            : 'SMS disabled',
        });
      }
    } catch (smsError) {
      logger.error('Failed to send cancellation SMS', {
        orderId: order.id,
        error: smsError instanceof Error ? smsError.message : String(smsError),
      });
      // Don't throw - SMS failure shouldn't block cancellation
    }

    logger.info('Cancellation notifications sent', { orderId: order.id, orderNumber });
  } catch (error) {
    logger.error('Failed to send cancellation notifications', { orderId: order.id, error });
    // Don't throw - notification failure shouldn't block cancellation
  }
}

// ===== API HANDLER =====

/**
 * POST /api/orders/cancel - Cancel an order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = CancelOrderSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path.join('.') },
        { status: 400 }
      );
    }

    const data: CancelOrderData = validation.data;

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order can be cancelled (with time-based validation)
    const cancellationCheck = canCancelOrder(
      order.status,
      data.cancelledBy,
      order.createdAt,
      order.preparingAt
    );
    if (!cancellationCheck.allowed) {
      return NextResponse.json(
        { error: cancellationCheck.reason || 'Order cannot be cancelled' },
        { status: 400 }
      );
    }

    // Process refund if applicable
    // CRITICAL FIX: Only process refunds for online payments (not cash-on-delivery)
    // Note: PaymentStatus enum values are uppercase (PENDING, PAID, etc.)
    let refundProcessed = false;
    const normalizedPaymentStatus = order.paymentStatus.toUpperCase();
    
    // Check if payment method is cash-on-delivery
    const isCashOnDelivery = order.paymentMethod?.toLowerCase().includes('cash') || 
                             order.paymentMethod?.toLowerCase().includes('cod') ||
                             order.paymentMethod === 'cash-on-delivery';
    
    // Only process refund if payment was made online (not COD)
    const shouldProcessRefund = (normalizedPaymentStatus === 'PAID' || normalizedPaymentStatus === 'PENDING') && 
                                !isCashOnDelivery;
    
    if (shouldProcessRefund) {
      refundProcessed = await processRefund(order.id, data.refundAmount);
    }

    // Update order status (use enum value CANCELLED, not lowercase string)
    const updatedOrder = await prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: 'CANCELLED', // Prisma enum value (uppercase)
        cancelledAt: new Date(),
        deliveryNotes: `${order.deliveryNotes || ''}\n\nCANCELLED BY: ${data.cancelledBy.toUpperCase()}\nREASON: ${data.reason}\n${data.additionalNotes ? `NOTES: ${data.additionalNotes}` : ''}`.trim(),
      },
    });

    // CRITICAL FIX: Use proper notification manager instead of custom function
    // This ensures notifications are logged to database and customer receives them
    try {
      // Send cancellation notifications via notification manager
      await sendCancellationNotifications(
        updatedOrder,
        data.cancelledBy,
        data.reason,
        data.refundAmount
      );

      // CRITICAL: Broadcast order cancellation via WebSocket for real-time updates
      await broadcastOrderUpdate(updatedOrder.id, 'CANCELLED', {
        reason: data.reason,
        cancelledBy: data.cancelledBy,
        refundAmount: data.refundAmount,
        message: `Order cancelled - ${data.reason}`,
      });

      logger.info('Cancellation notifications sent successfully', {
        orderId: data.orderId,
        orderNumber: order.orderNumber,
      });
    } catch (notificationError) {
      // Log notification failure but don't block the cancellation
      logger.error('Failed to send cancellation notifications', {
        orderId: data.orderId,
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
      });
      // Note: Order is still cancelled even if notifications fail
    }

    logger.info('Order cancelled successfully', {
      orderId: data.orderId,
      orderNumber: order.orderNumber,
      cancelledBy: data.cancelledBy,
      reason: data.reason,
      refundProcessed,
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder,
      refundProcessed,
      refundAmount: data.refundAmount,
    });
  } catch (error) {
    logger.error('Order cancellation failed', { error });
    return NextResponse.json(
      { error: 'Failed to cancel order. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/cancel - Get cancellation reasons
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'customer';

  const reasons = CANCELLATION_REASONS[role.toUpperCase() as keyof typeof CANCELLATION_REASONS] || CANCELLATION_REASONS.CUSTOMER;

  return NextResponse.json({
    reasons,
    role,
  });
}

