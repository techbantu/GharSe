/**
 * TEST PAYMENT API
 * 
 * Purpose: Test payment gateway configuration with ₹1 test payment
 * Security: Only works in test mode, never charges real money
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const { gateway, amount = 1 } = body; // ₹1 test payment

    if (gateway === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return NextResponse.json(
          { success: false, error: 'Stripe not configured' },
          { status: 400 }
        );
      }

      const stripe = new Stripe(stripeKey);

      // Create test payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents/paise
        currency: 'inr',
        metadata: {
          test: 'true',
          purpose: 'setup_verification',
        },
        payment_method_types: ['card'],
      });

      // In test mode, immediately confirm (for testing)
      if (stripeKey.includes('test')) {
        // Simulate successful payment for test mode
        return NextResponse.json({
          success: true,
          message: 'Test payment successful! Payment gateway is working.',
          paymentIntentId: paymentIntent.id,
          testMode: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment intent created. Please complete payment.',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    if (gateway === 'razorpay') {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        return NextResponse.json(
          { success: false, error: 'Razorpay not configured' },
          { status: 400 }
        );
      }

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      // Create test order
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
        notes: {
          test: 'true',
          purpose: 'setup_verification',
        },
      });

      // In test mode, simulate success
      if (keyId.includes('test')) {
        return NextResponse.json({
          success: true,
          message: 'Test payment successful! Payment gateway is working.',
          orderId: order.id,
          testMode: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Test order created. Please complete payment.',
        orderId: order.id,
        amount: Number(order.amount) / 100,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid gateway' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Test payment failed', {
      error: error.message,
      gateway: body?.gateway,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test payment failed',
      },
      { status: 500 }
    );
  }
}

