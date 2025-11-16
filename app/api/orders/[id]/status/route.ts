/**
 * ORDER STATUS UPDATE API
 * 
 * PUT /api/orders/[id]/status
 * Updates order status and triggers notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderStatus, Order } from '@/types';
import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';
import { rewardReferrerOnDelivery } from '@/lib/referral-engine';

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
    
    // Map frontend status to database enum format
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'preparing': 'PREPARING',
      'ready': 'READY',
      'out-for-delivery': 'OUT_FOR_DELIVERY',
      'delivered': 'DELIVERED',
      'picked-up': 'DELIVERED', // Map to DELIVERED since PICKED_UP doesn't exist
      'cancelled': 'CANCELLED',
      'refunded': 'CANCELLED', // Map to CANCELLED since REFUNDED doesn't exist
    };
    
    const dbStatus = statusMap[status.toLowerCase()] || status.toUpperCase();
    
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
    
    const oldStatus = dbOrder.status;
    
    // Update status in database
    const updatedDbOrder = await (prisma.order.update as any)({
      where: { id: orderId },
      data: {
        status: dbStatus as any,
        updatedAt: new Date(),
        // Update timestamps based on status
        ...(status === 'confirmed' && { confirmedAt: new Date() }),
        ...(status === 'preparing' && { preparingAt: new Date() }),
        ...(status === 'ready' && { readyAt: new Date() }),
        ...(status === 'delivered' && { deliveredAt: new Date() }),
        ...(status === 'cancelled' && { cancelledAt: new Date() }),
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    
    logger.info('Order status updated in database', {
      orderId,
      orderNumber: dbOrder.orderNumber,
      oldStatus,
      newStatus: status,
      duration: Date.now() - startTime,
    });
    
    // REFERRAL REWARD: Trigger referrer reward on delivery
    if (status === 'delivered' && dbOrder.customerId) {
      (async () => {
        try {
          const rewarded = await rewardReferrerOnDelivery(dbOrder.customerId!);
          
          if (rewarded) {
            logger.info('Referrer rewarded after delivery', {
              orderId,
              customerId: dbOrder.customerId,
            });
          }
        } catch (referralError) {
          logger.error('Failed to reward referrer on delivery', {
            orderId,
            customerId: dbOrder.customerId,
            error: referralError instanceof Error ? referralError.message : String(referralError),
          });
        }
      })();
    }
    
    // Transform to frontend format for notification
    const frontendOrder: Partial<Order> = {
      id: updatedDbOrder.id,
      orderNumber: updatedDbOrder.orderNumber,
      status: status as OrderStatus,
      customer: {
        id: updatedDbOrder.customerPhone,
        name: updatedDbOrder.customerName,
        email: updatedDbOrder.customerEmail,
        phone: updatedDbOrder.customerPhone,
      },
      pricing: {
        subtotal: updatedDbOrder.subtotal,
        tax: updatedDbOrder.tax,
        deliveryFee: updatedDbOrder.deliveryFee,
        discount: updatedDbOrder.discount,
        total: updatedDbOrder.total,
      },
      items: [],
      orderType: 'delivery',
      paymentMethod: 'cash-on-delivery',
      paymentStatus: 'pending',
      createdAt: updatedDbOrder.createdAt,
      updatedAt: updatedDbOrder.updatedAt,
      estimatedReadyTime: updatedDbOrder.estimatedDelivery || new Date(),
      contactPreference: ['email', 'sms'],
      notifications: [],
    };
    
    // Send status update notifications (async, don't block response)
    (async () => {
      try {
        const { notificationManager } = await import('@/lib/notifications/notification-manager');
        const notificationResult = await notificationManager.sendStatusUpdate(
          frontendOrder as Order,
          status
        );
        
        logger.info('Status update notifications sent', {
          orderId,
          orderNumber: dbOrder.orderNumber,
          newStatus: status,
          emailSuccess: notificationResult.email?.success,
          smsSuccess: notificationResult.sms?.success,
          smsSkipped: notificationResult.sms?.skipped,
        });
      } catch (notificationError) {
        logger.error('Failed to send status update notifications', {
          orderId,
          orderNumber: dbOrder.orderNumber,
          status,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        });
      }
    })();
    
    return NextResponse.json({
      success: true,
      order: {
        id: updatedDbOrder.id,
        orderNumber: updatedDbOrder.orderNumber,
        status: status,
      },
      message: `Order status updated to ${status}`,
      notificationsSent: true,
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

