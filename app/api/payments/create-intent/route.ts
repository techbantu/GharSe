/**
 * PAYMENT INTENT API - Multi-Gateway Support
 * 
 * Purpose: Creates payment intents for secure online payments
 * Primary: Razorpay (for India)
 * Secondary: Stripe (for international)
 * 
 * Architecture:
 * - Gateway selection based on currency
 * - Unified response format
 * - Comprehensive error handling
 * 
 * Security: Server-side only, never exposes secret keys to client
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';

// Gateway configuration
const RAZORPAY_CONFIG = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
};

const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  enabled: !!process.env.STRIPE_SECRET_KEY,
};

// Initialize Stripe
const stripe = STRIPE_CONFIG.enabled ? new Stripe(STRIPE_CONFIG.secretKey!) : null;

// Initialize Razorpay (lazy load)
let Razorpay: any = null;
const getRazorpay = async () => {
  if (!RAZORPAY_CONFIG.enabled) {
    throw new Error(
      '❌ RAZORPAY NOT CONFIGURED: Missing API keys.\n' +
      'Required environment variables:\n' +
      '- RAZORPAY_KEY_ID (from Razorpay Dashboard)\n' +
      '- RAZORPAY_KEY_SECRET (from Razorpay Dashboard)\n\n' +
      'Sign up: https://razorpay.com\n' +
      'Get keys from: Dashboard > Settings > API Keys\n\n' +
      'Alternative: Enable COD_ENABLED=true for Cash on Delivery'
    );
  }

  if (!Razorpay) {
    try {
      const razorpayModule = await import('razorpay');
      Razorpay = new razorpayModule.default({
        key_id: RAZORPAY_CONFIG.keyId!,
        key_secret: RAZORPAY_CONFIG.keySecret!,
      });
    } catch (error) {
      logger.error('Failed to initialize Razorpay', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        '❌ Razorpay initialization failed. Make sure razorpay package is installed: npm install razorpay'
      );
    }
  }
  return Razorpay;
};

/**
 * Create Razorpay Order
 */
async function createRazorpayOrder(amount: number, currency: string, metadata: any) {
  const razorpay = await getRazorpay();
  
  if (!razorpay) {
    throw new Error('Razorpay not initialized');
  }

  try {
    // Amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: metadata.orderId || `order_${Date.now()}`,
      notes: {
        orderId: metadata.orderId,
        customerEmail: metadata.customerEmail,
        customerPhone: metadata.customerPhone,
      },
    });

    logger.info('Razorpay order created', {
      razorpayOrderId: order.id,
      orderId: metadata.orderId,
      amount: amountInPaise,
      currency,
    });

    // Save payment record to database
    await (prisma.payment.create as any)({
      data: {
        orderId: metadata.orderId,
        paymentGateway: 'razorpay',
        paymentIntentId: order.id,
        amount: amountInPaise,
        currency,
        status: 'PENDING',
        gatewayResponse: JSON.stringify(order),
      },
    });

    return {
      success: true,
      provider: 'razorpay',
      orderId: order.id,
      amount: amountInPaise,
      currency,
      key: RAZORPAY_CONFIG.keyId,
    };
  } catch (error) {
    logger.error('Razorpay order creation failed', {
      error: error instanceof Error ? error.message : String(error),
      orderId: metadata.orderId,
    });
    throw error;
  }
}

/**
 * Create Stripe Payment Intent
 */
async function createStripeIntent(amount: number, currency: string, metadata: any) {
  if (!stripe) {
    throw new Error(
      '❌ STRIPE NOT CONFIGURED: Missing API keys.\n' +
      'Required environment variables:\n' +
      '- STRIPE_SECRET_KEY (from Stripe Dashboard)\n' +
      '- STRIPE_PUBLIC_KEY (for client-side)\n\n' +
      'Sign up: https://stripe.com\n' +
      'Get keys from: Dashboard > Developers > API keys\n\n' +
      'Alternative: Use Razorpay for India or enable COD_ENABLED=true'
    );
  }

  try {
    // Amount in smallest currency unit (paise for INR - 100 paise = 1 rupee)
    const amountInPaise = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: currency.toLowerCase(),
      metadata: {
        orderId: metadata.orderId || '',
        customerEmail: metadata.customerEmail || '',
        customerPhone: metadata.customerPhone || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Stripe payment intent created', {
      paymentIntentId: paymentIntent.id,
      orderId: metadata.orderId,
      amount: amountInPaise,
      currency,
    });

    // Save payment record to database
    await (prisma.payment.create as any)({
      data: {
        orderId: metadata.orderId,
        paymentGateway: 'stripe',
        paymentIntentId: paymentIntent.id,
        amount: amountInPaise,
        currency,
        status: 'PENDING',
        gatewayResponse: JSON.stringify({
          id: paymentIntent.id,
          status: paymentIntent.status,
        }),
      },
    });

    return {
      success: true,
      provider: 'stripe',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    logger.error('Stripe payment intent creation failed', {
      error: error instanceof Error ? error.message : String(error),
      orderId: metadata.orderId,
    });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { amount, currency = 'INR', metadata = {}, provider } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount',
        },
        { status: 400 }
      );
    }

    if (!metadata.orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 }
      );
    }

    // Determine which gateway to use
    const shouldUseRazorpay =
      provider === 'razorpay' ||
      (currency.toUpperCase() === 'INR' && RAZORPAY_CONFIG.enabled);

    const shouldUseStripe =
      provider === 'stripe' ||
      (!shouldUseRazorpay && STRIPE_CONFIG.enabled);

    // Check if any payment gateway is configured
    if (!RAZORPAY_CONFIG.enabled && !STRIPE_CONFIG.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment processing is not configured. Please use cash on delivery.',
        },
        { status: 503 }
      );
    }

    // Create payment intent with appropriate gateway
    let result;

    if (shouldUseRazorpay) {
      result = await createRazorpayOrder(amount, currency, metadata);
    } else if (shouldUseStripe) {
      result = await createStripeIntent(amount, currency, metadata);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No suitable payment gateway available for this transaction',
        },
        { status: 503 }
      );
    }

    const duration = Date.now() - startTime;

    logger.info('Payment intent created', {
      provider: result.provider,
      orderId: metadata.orderId,
      amount,
      currency,
      duration,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Payment intent creation failed', {
      error: error.message || String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Payment processing failed',
      },
      { status: 500 }
    );
  }
}
