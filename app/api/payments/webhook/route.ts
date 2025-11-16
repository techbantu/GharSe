/**
 * PAYMENT WEBHOOK HANDLER - Multi-Gateway Support
 * 
 * Purpose: Receives payment confirmations from Stripe/Razorpay
 * and records actual money received in the database
 * 
 * Endpoints:
 * - /api/payments/webhook?provider=stripe (Stripe webhooks)
 * - /api/payments/webhook?provider=razorpay (Razorpay webhooks)
 * 
 * Security: Verifies webhook signatures to prevent fraud
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';
import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';

// Gateway configuration
const STRIPE_CONFIG = {
  stripe: process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

const RAZORPAY_CONFIG = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
};

/**
 * Verify Razorpay webhook signature
 */
function verifyRazorpaySignature(body: string, signature: string): boolean {
  if (!RAZORPAY_CONFIG.webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_CONFIG.webhookSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Handle Razorpay Webhook
 */
async function handleRazorpayWebhook(body: any): Promise<NextResponse> {
  try {
    const event = body.event;
    const payload = body.payload.payment.entity;

    logger.info('Razorpay webhook received', {
      event,
      paymentId: payload.id,
    });

    // Handle payment captured (success)
    if (event === 'payment.captured') {
      const orderId = payload.notes?.orderId;
      
      if (!orderId) {
        logger.warn('Payment captured but no orderId in notes', {
          paymentId: payload.id,
        });
        return NextResponse.json({ received: true });
      }

      // Calculate gateway fee (Razorpay charges 2% for UPI, 2.36% for cards, etc.)
      const amount = payload.amount / 100; // Convert from paise to rupees
      const gatewayFee = amount * 0.0236; // Approximate 2.36% for cards
      const netAmount = amount - gatewayFee;

      // Record payment in database
      await (prisma.$transaction as any)(async (tx: any) => {
        // Check if payment already recorded (idempotency)
        const existingPayment = await tx.payment.findFirst({
          where: { transactionId: payload.id },
        });

        if (existingPayment) {
          logger.info('Payment already recorded (idempotent)', {
            paymentId: payload.id,
          });
          return;
        }

        // Extract payment method details from Razorpay response
        const paymentMethodDetails = payload.method || 
          (payload.wallet ? `razorpay-${payload.wallet}` : null) ||
          (payload.vpa ? 'upi' : null) ||
          'card';

        // Get order to extract tip
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { tip: true },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            orderId,
            paymentGateway: 'razorpay',
            paymentMethodDetails: paymentMethodDetails,
            paymentIntentId: payload.order_id,
            transactionId: payload.id,
            amount,
            currency: payload.currency.toUpperCase(),
            gatewayFee,
            netAmount,
            tip: order?.tip || 0,
            status: 'PAID',
            paidAt: new Date(payload.created_at * 1000),
            gatewayResponse: JSON.stringify(payload),
          },
        });

        // Update order payment status
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            updatedAt: new Date(),
          },
        });
      });

      logger.info('Razorpay payment recorded successfully', {
        orderId,
        paymentId: payload.id,
        amount,
        netAmount,
      });

      // Send payment confirmation notification
      try {
        const { notificationManager } = await import('@/lib/notifications/notification-manager');
        const order = await (prisma.order.findUnique as any)({
          where: { id: orderId },
          include: { items: { include: { menuItem: true } } },
        });
        
        if (order) {
          // Transform and send notification (fire-and-forget)
          // await notificationManager.sendPaymentConfirmation(...);
        }
      } catch (notificationError) {
        logger.error('Failed to send payment confirmation', {
          orderId,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        });
      }
    }

    // Handle payment failure
    if (event === 'payment.failed') {
      const orderId = payload.notes?.orderId;

      if (orderId) {
        await (prisma.$transaction as any)(async (tx: any) => {
          await tx.payment.create({
            data: {
              orderId,
              paymentGateway: 'razorpay',
              paymentIntentId: payload.order_id,
              transactionId: payload.id,
              amount: payload.amount / 100,
              currency: payload.currency.toUpperCase(),
              status: 'FAILED',
              failureReason: payload.error_description || 'Payment failed',
              gatewayResponse: JSON.stringify(payload),
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'FAILED',
              updatedAt: new Date(),
            },
          });
        });

        logger.warn('Razorpay payment failed', {
          orderId,
          paymentId: payload.id,
          reason: payload.error_description,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing Razorpay webhook', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe Webhook
 */
async function handleStripeWebhook(body: string, signature: string): Promise<NextResponse> {
  const stripe = STRIPE_CONFIG.stripe;
  const webhookSecret = STRIPE_CONFIG.webhookSecret;
  
  if (!stripe || !webhookSecret) {
    logger.warn('Stripe webhook called but not configured');
    return NextResponse.json(
      { error: 'Stripe webhooks not configured' },
      { status: 503 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature (prevents fraud)
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed', {
      error: err.message,
    });
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle payment success
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Extract order ID from metadata
      const orderId = paymentIntent.metadata.orderId;
      if (!orderId) {
        logger.warn('Payment succeeded but no orderId in metadata', {
          paymentIntentId: paymentIntent.id,
        });
        return NextResponse.json({ received: true });
      }

      // Calculate gateway fee (Stripe charges ~2.9% + ₹2 per transaction in India)
      const amount = paymentIntent.amount / 100; // Convert from cents/paise
      const gatewayFee = amount * 0.029 + 2; // 2.9% + ₹2
      const netAmount = amount - gatewayFee;

      // Extract payment method details from Stripe payment intent
      const paymentMethodDetails = paymentIntent.payment_method_types?.[0] || 'card';

      // Record payment in database
      await (prisma.$transaction as any)(async (tx: any) => {
        // Get order to extract tip
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { tip: true },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            orderId,
            paymentGateway: 'stripe',
            paymentMethodDetails: paymentMethodDetails,
            paymentIntentId: paymentIntent.id,
            transactionId: paymentIntent.latest_charge as string | undefined,
            amount,
            currency: paymentIntent.currency.toUpperCase(),
            gatewayFee,
            netAmount,
            tip: order?.tip || 0,
            status: 'PAID',
            paidAt: new Date(),
            gatewayResponse: JSON.stringify(paymentIntent),
          },
        });

        // Update order payment status
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            updatedAt: new Date(),
          },
        });
      });

      logger.info('Payment recorded successfully', {
        orderId,
        paymentIntentId: paymentIntent.id,
        amount,
        netAmount,
      });
    }

    // Handle payment failure
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await (prisma.$transaction as any)(async (tx: any) => {
          await tx.payment.create({
            data: {
              orderId,
              paymentGateway: 'stripe',
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'FAILED',
              failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              gatewayResponse: JSON.stringify(paymentIntent),
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'FAILED',
              updatedAt: new Date(),
            },
          });
        });

        logger.warn('Payment failed', {
          orderId,
          paymentIntentId: paymentIntent.id,
          reason: paymentIntent.last_payment_error?.message,
        });
      }
    }

    // Handle refunds
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (paymentIntentId) {
        const payment = await (prisma.payment.findFirst as any)({
          where: { paymentIntentId },
        });

        if (payment) {
          await (prisma.$transaction as any)(async (tx: any) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
              },
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'REFUNDED',
                updatedAt: new Date(),
              },
            });
          });

          logger.info('Payment refunded', {
            paymentId: payment.id,
            orderId: payment.orderId,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Error processing Stripe webhook', {
      error: error.message,
      eventType: event.type,
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Main POST Handler - Routes to appropriate gateway
 */
export async function POST(request: NextRequest) {
  // Determine which gateway webhook this is
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'stripe'; // Default to Stripe for backwards compatibility

  const body = await request.text();

  if (provider === 'razorpay') {
    // Razorpay webhook
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    if (!verifyRazorpaySignature(body, signature)) {
      logger.error('Razorpay webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    return handleRazorpayWebhook(JSON.parse(body));
  } else {
    // Stripe webhook
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    return handleStripeWebhook(body, signature);
  }
}
