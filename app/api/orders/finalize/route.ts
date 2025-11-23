/**
 * NEW FILE: Order Finalization API
 * 
 * Purpose: Finalizes orders after grace period expires, moving them from
 * PENDING_CONFIRMATION to PENDING status (visible to kitchen).
 * 
 * Features:
 * - Validates grace period expiration
 * - Updates order status from PENDING_CONFIRMATION to PENDING
 * - Broadcasts to kitchen via WebSocket
 * - Idempotent (safe to call multiple times)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { broadcastNewOrderToAdmin } from '@/lib/websocket-server';

// ===== VALIDATION SCHEMAS =====

const FinalizeOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  customerId: z.string().optional(), // For auth validation
});

type FinalizeOrderData = z.infer<typeof FinalizeOrderSchema>;

// ===== API HANDLER =====

/**
 * POST /api/orders/finalize - Finalize an order (move to kitchen)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = FinalizeOrderSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
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
    const order = await (prisma.order.findUnique as any)({
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
    
    logger.info('Order finalization attempt', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      gracePeriodExpiresAt: order.gracePeriodExpiresAt?.toISOString(),
    });
    
    // Validate customer ownership (if customerId provided)
    if (data.customerId && order.customerId && data.customerId !== order.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to finalize this order' },
        { status: 403 }
      );
    }
    
    // Check if already finalized (idempotent)
    if (order.status !== 'PENDING_CONFIRMATION') {
      logger.info('Order already finalized', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Order already sent to kitchen',
        order,
        alreadyFinalized: true,
      });
    }
    
    // DISABLED AUTO-FINALIZATION: Order stays in PENDING_CONFIRMATION until chef manually confirms
    // Orders should only be confirmed by the chef in the Kitchen Display System
    logger.warn('Finalize endpoint called but auto-confirmation is disabled', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order awaiting kitchen confirmation. Chef will review and confirm.',
      order,
      note: 'Auto-confirmation disabled - requires manual chef approval'
    });
    
    /* COMMENTED OUT - NO AUTO-CONFIRMATION
    // Update order status to PENDING (visible to kitchen)
    const finalizedOrder = await (prisma.order.update as any)({
      where: { id: data.orderId },
      data: {
        status: 'PENDING',
        confirmedAt: new Date(), // Mark when order was confirmed/finalized
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
      orderId: finalizedOrder.id,
      orderNumber: finalizedOrder.orderNumber,
      oldStatus: 'PENDING_CONFIRMATION',
      newStatus: 'PENDING',
      itemCount: finalizedOrder.items.length,
      total: finalizedOrder.total,
    });
    
    // Broadcast to kitchen via WebSocket
    try {
      await broadcastNewOrderToAdmin({
        id: finalizedOrder.id,
        orderNumber: finalizedOrder.orderNumber,
        customer: {
          name: finalizedOrder.customerName,
          email: finalizedOrder.customerEmail,
          phone: finalizedOrder.customerPhone,
        },
        pricing: {
          total: finalizedOrder.total,
        },
        status: finalizedOrder.status,
        createdAt: finalizedOrder.createdAt,
        items: finalizedOrder.items.map((item: any) => ({
          menuItem: {
            name: item.menuItem?.name || 'Unknown Item',
          },
          quantity: item.quantity,
        })),
      });
      
      logger.info('Order broadcasted to kitchen', {
        orderId: finalizedOrder.id,
        orderNumber: finalizedOrder.orderNumber,
      });
    } catch (wsError) {
      // Don't fail finalization if WebSocket fails
      logger.error('Failed to broadcast to kitchen (order still finalized)', {
        orderId: finalizedOrder.id,
        error: wsError instanceof Error ? wsError.message : String(wsError),
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order has been sent to the kitchen',
      order: finalizedOrder,
    });
    */
    
  } catch (error) {
    logger.error('Order finalization failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to finalize order. Please try again or contact support.',
      },
      { status: 500 }
    );
  }
}
