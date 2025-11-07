/**
 * ORDER STATUS UPDATE API
 * 
 * PUT /api/orders/[id]/status
 * Updates order status and triggers notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderStatus } from '@/types';
import { logger } from '@/utils/logger';
import { getOrders, updateOrderStatus } from '@/lib/order-storage';
import { notifyOrderStatusChange } from '@/lib/notifications/notification-manager';

const UpdateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out-for-delivery',
    'delivered',
    'picked-up',
    'cancelled',
    'refunded',
  ]),
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
    const validation = UpdateStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }
    
    const { status } = validation.data;
    
    // Get the order
    const orders = getOrders({});
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }
    
    const oldStatus = order.status;
    
    // Update status
    const updated = updateOrderStatus(orderId, status);
    
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order status',
        },
        { status: 500 }
      );
    }
    
    logger.info('Order status updated', {
      orderId,
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      duration: Date.now() - startTime,
    });
    
    // Send notifications (async, don't wait)
    // Using a "fire and forget" pattern so we don't slow down the API
    notifyOrderStatusChange(updated, status).catch(error => {
      logger.error('Notification failed (fire-and-forget)', {
        orderId,
        orderNumber: order.orderNumber,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
    });
    
    return NextResponse.json({
      success: true,
      order: updated,
      message: `Order status updated to ${status}`,
      notificationsSent: true, // Optimistic response
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error updating order status', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

