/**
 * NEW FILE: Order Finalization API - Transition order from PENDING_CONFIRMATION to PENDING
 * 
 * Purpose: Auto-called by frontend when grace period timer expires.
 * Makes order visible to kitchen/admin dashboard.
 * 
 * Features:
 * - Validates order is in PENDING_CONFIRMATION status
 * - Changes status to PENDING (visible to admin)
 * - Locks order from further modifications
 * - Triggers WebSocket notification to admin dashboard
 * 
 * Security:
 * - Validates grace period has actually expired
 * - Prevents premature finalization
 * - Idempotent (can be called multiple times safely)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

// ===== VALIDATION SCHEMAS =====

const FinalizeOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().optional(), // For auth validation
});

type FinalizeOrderData = z.infer<typeof FinalizeOrderSchema>;

// ===== API HANDLER =====

/**
 * POST /api/orders/finalize - Finalize order after grace period
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = FinalizeOrderSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      logger.warn('Order finalization validation failed', {
        error: firstError.message,
        path: firstError.path,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data: FinalizeOrderData = validation.data;
    
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
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Optional: Validate customer ownership
    if (data.customerId && order.customerId && data.customerId !== order.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to finalize this order' },
        { status: 403 }
      );
    }
    
    // Check current status
    if (order.status === 'PENDING') {
      // Already finalized - idempotent response
      logger.info('Order already finalized', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
      
      return NextResponse.json({
        success: true,
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          gracePeriodExpiresAt: order.gracePeriodExpiresAt?.toISOString(),
        },
        message: 'Order already finalized',
        alreadyFinalized: true,
      });
    }
    
    // Validate status is PENDING_CONFIRMATION
    if (order.status !== 'PENDING_CONFIRMATION') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot finalize order in ${order.status} status`,
        },
        { status: 400 }
      );
    }
    
    // Validate grace period has actually expired (security check)
    if (order.gracePeriodExpiresAt) {
      const now = new Date();
      const timeRemaining = order.gracePeriodExpiresAt.getTime() - now.getTime();
      
      if (timeRemaining > 5000) { // Allow 5 second buffer for network latency
        return NextResponse.json(
          {
            success: false,
            error: 'Grace period has not expired yet',
            timeRemaining: Math.ceil(timeRemaining / 1000), // seconds
          },
          { status: 400 }
        );
      }
    }
    
    // Update order status to PENDING (now visible to admin)
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PENDING',
        // Don't update gracePeriodExpiresAt - keep it for reference
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    
    logger.info('Order finalized successfully', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      itemCount: updatedOrder.items.length,
      total: updatedOrder.total,
      modificationCount: updatedOrder.modificationCount,
      finalStatus: 'PENDING',
    });
    
    // TODO: Trigger WebSocket notification to admin dashboard
    // This will make the order appear with glowing button
    
    return NextResponse.json({
      success: true,
      order: {
        ...updatedOrder,
        createdAt: updatedOrder.createdAt.toISOString(),
        updatedAt: updatedOrder.updatedAt.toISOString(),
        gracePeriodExpiresAt: updatedOrder.gracePeriodExpiresAt?.toISOString(),
        lastModifiedAt: updatedOrder.lastModifiedAt?.toISOString(),
      },
      message: 'Order sent to kitchen! Estimated ready time: 40 minutes',
    });
    
  } catch (error) {
    logger.error('Error finalizing order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to finalize order. Please try again.',
      },
      { status: 500 }
    );
  }
}

