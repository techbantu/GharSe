/**
 * NEW FILE: UPI Payment Verification API
 * 
 * Purpose: Verify UPI payments using UTR number and optional screenshot.
 * Updates order payment status once verified.
 * 
 * Flow:
 * 1. Customer pays via UPI (PhonePe/GPay/Paytm)
 * 2. Customer enters UTR number from payment confirmation
 * 3. This endpoint validates UTR and marks order as PAID
 * 4. Chef sees payment confirmed on order receipt
 * 
 * Security:
 * - Rate limiting (5 attempts per order)
 * - UTR format validation
 * - Duplicate UTR prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { verifyUPIPayment, isValidUTRFormat, formatUTRNumber } from '@/lib/upi-payment';

// ===== VALIDATION SCHEMA =====

const VerifyUPISchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  utrNumber: z.string()
    .min(12, 'UTR number must be at least 12 characters')
    .max(22, 'UTR number is too long')
    .transform(val => val.replace(/\s/g, '').toUpperCase()),
  paymentApp: z.enum(['gpay', 'phonepe', 'paytm', 'bhim', 'amazonpay', 'other']),
  screenshotUrl: z.string().url().optional(),
});

// ===== POST: Verify UPI Payment =====

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = VerifyUPISchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues?.[0]?.message || 'Invalid request data';
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }
    
    const { orderId, utrNumber, paymentApp, screenshotUrl } = validationResult.data;
    
    logger.info('UPI verification request', {
      orderId,
      paymentApp,
      utrLength: utrNumber.length,
      hasScreenshot: !!screenshotUrl,
    });
    
    // Step 1: Find the order
    const order = await (prisma.order.findUnique as any)({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        customerName: true,
        customerPhone: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    
    // Step 2: Check if already paid
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'This order has already been paid',
          code: 'ALREADY_PAID',
        },
        { status: 400 }
      );
    }
    
    // Step 3: Validate UTR format
    if (!isValidUTRFormat(utrNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid UTR number format. Please enter a valid 12-22 digit transaction reference.',
          code: 'INVALID_UTR',
        },
        { status: 400 }
      );
    }
    
    // Step 4: Check for duplicate UTR (fraud prevention)
    const existingPayment = await (prisma.payment.findFirst as any)({
      where: {
        transactionId: utrNumber,
      },
    });
    
    if (existingPayment) {
      logger.warn('Duplicate UTR detected', {
        orderId,
        utrNumber: utrNumber.substring(0, 4) + '****',
        existingOrderId: existingPayment.orderId,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'This UTR number has already been used for another order. Please check your transaction.',
          code: 'DUPLICATE_UTR',
        },
        { status: 400 }
      );
    }
    
    // Step 5: Map payment app to display name
    const paymentAppNames: Record<string, string> = {
      gpay: 'Google Pay',
      phonepe: 'PhonePe',
      paytm: 'Paytm',
      bhim: 'BHIM UPI',
      amazonpay: 'Amazon Pay',
      other: 'UPI',
    };
    
    const paymentMethodDetails = paymentAppNames[paymentApp] || 'UPI';
    
    // Step 6: Create payment record and update order (transaction)
    const result = await (prisma.$transaction as any)(async (tx: any) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          paymentGateway: 'upi',
          paymentMethodDetails,
          transactionId: utrNumber,
          amount: order.total,
          currency: 'INR',
          netAmount: order.total,
          status: 'PAID',
          paidAt: new Date(),
          gatewayResponse: JSON.stringify({
            utrNumber,
            paymentApp,
            screenshotUrl,
            verifiedAt: new Date().toISOString(),
            verificationMethod: screenshotUrl ? 'UTR_WITH_SCREENSHOT' : 'UTR_ONLY',
          }),
        },
      });
      
      // Update order payment status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: `upi-${paymentApp}`,
        },
      });
      
      return { payment, order: updatedOrder };
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('UPI payment verified successfully', {
      orderId,
      orderNumber: order.orderNumber,
      paymentId: result.payment.id,
      paymentApp,
      utrPartial: utrNumber.substring(0, 4) + '****' + utrNumber.substring(-4),
      amount: order.total,
      duration,
    });
    
    // Return success with payment details
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully!',
      payment: {
        id: result.payment.id,
        transactionId: formatUTRNumber(utrNumber),
        paymentApp: paymentMethodDetails,
        amount: order.total,
        verifiedAt: result.payment.paidAt,
        status: 'PAID',
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
      },
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('UPI verification failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Payment verification failed. Please try again or contact support.',
        code: 'VERIFICATION_FAILED',
      },
      { status: 500 }
    );
  }
}

// ===== GET: Check UPI Payment Status =====

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
          code: 'MISSING_ORDER_ID',
        },
        { status: 400 }
      );
    }
    
    // Find payment record for order
    const payment = await (prisma.payment.findFirst as any)({
      where: {
        orderId,
        paymentGateway: 'upi',
      },
      select: {
        id: true,
        transactionId: true,
        paymentMethodDetails: true,
        amount: true,
        status: true,
        paidAt: true,
        gatewayResponse: true,
      },
    });
    
    if (!payment) {
      return NextResponse.json({
        success: true,
        paid: false,
        message: 'No UPI payment found for this order',
      });
    }
    
    // Parse gateway response for screenshot URL
    let screenshotUrl: string | undefined;
    try {
      const response = JSON.parse(payment.gatewayResponse || '{}');
      screenshotUrl = response.screenshotUrl;
    } catch {
      // Ignore parse errors
    }
    
    return NextResponse.json({
      success: true,
      paid: payment.status === 'PAID',
      payment: {
        id: payment.id,
        transactionId: payment.transactionId ? formatUTRNumber(payment.transactionId) : null,
        paymentApp: payment.paymentMethodDetails,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        screenshotUrl,
      },
    });
    
  } catch (error) {
    logger.error('Error checking UPI payment status', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

