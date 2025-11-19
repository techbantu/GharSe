/**
 * ORDER PAYMENT STATUS UPDATE API
 *
 * PUT /api/orders/[id]/payment-status
 * Updates payment status (PENDING -> PAID) for COD orders
 * Used when vendor confirms cash receipt
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';

const UpdatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  paymentReceivedAt: z.string().optional(), // ISO timestamp when cash was received
  notes: z.string().optional(), // Optional notes (e.g., "Cash received from customer")
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const orderId = id;

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdatePaymentStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment status',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { paymentStatus, paymentReceivedAt, notes } = validation.data;

    // Get the order from database
    const dbOrder = await (prisma.order.findUnique as any)({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!dbOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    const oldPaymentStatus = dbOrder.paymentStatus;

    // Update payment status in database
    const updateData: any = {
      paymentStatus,
      updatedAt: new Date(),
    };

    // Note: We track payment timestamp in the Payment table, not on Order
    // The Order.paymentStatus field is sufficient for order tracking

    const updatedDbOrder = await (prisma.order.update as any)({
      where: { id: orderId },
      data: updateData,
    });

    logger.info('Order payment status updated', {
      orderId,
      orderNumber: dbOrder.orderNumber,
      oldPaymentStatus,
      newPaymentStatus: paymentStatus,
      paymentMethod: dbOrder.paymentMethod,
      total: dbOrder.total,
      notes,
      duration: Date.now() - startTime,
    });

    // If payment status is now PAID, create a Payment record for accounting
    if (paymentStatus === 'PAID' && oldPaymentStatus !== 'PAID') {
      try {
        // Check if payment record already exists
        const existingPayment = await (prisma.payment.findFirst as any)({
          where: { orderId },
        });

        if (!existingPayment) {
          // Create payment record for COD
          await (prisma.payment.create as any)({
            data: {
              orderId,
              amount: dbOrder.total - (dbOrder.tip || 0), // Amount without tip
              netAmount: dbOrder.total - (dbOrder.tip || 0), // COD has no gateway fees
              gatewayFee: 0, // No fee for COD
              tip: dbOrder.tip || 0,
              status: 'PAID',
              paymentMethod: 'cash', // Normalize to 'cash'
              paymentGateway: 'cash', // Mark as cash payment
              paidAt: paymentReceivedAt ? new Date(paymentReceivedAt) : new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          logger.info('Payment record created for COD order', {
            orderId,
            orderNumber: dbOrder.orderNumber,
            amount: dbOrder.total,
          });
        }
      } catch (paymentError) {
        logger.error('Failed to create payment record', {
          orderId,
          orderNumber: dbOrder.orderNumber,
          error: paymentError instanceof Error ? paymentError.message : String(paymentError),
        });
        // Don't fail the whole request if payment record creation fails
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedDbOrder.id,
        orderNumber: updatedDbOrder.orderNumber,
        paymentStatus: updatedDbOrder.paymentStatus,
      },
      message: `Payment status updated to ${paymentStatus}`,
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    // CRITICAL DEBUG: Log full error details
    console.error('❌ [PAYMENT STATUS] Error updating payment status:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    logger.error('Error updating payment status', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
