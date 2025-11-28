import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { broadcastOrderUpdate } from '@/lib/websocket-server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  console.log('==== STATUS UPDATE REQUEST RECEIVED ====');
  console.log('[Order API] Request URL:', request.url);
  console.log('[Order API] Order ID:', id);

  try {
    const body = await request.json();
    const { status, rejectionReason } = body;

    console.log(`[Order API] Updating status for order ${id} to ${status}`);
    if (rejectionReason) {
      console.log(`[Order API] Rejection reason: ${rejectionReason}`);
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status against allowed values (including legacy frontend strings)
    const statusMap: Record<string, string> = {
      'PENDING_CONFIRMATION': 'PENDING_CONFIRMATION',
      'PENDING': 'PENDING',
      'CONFIRMED': 'CONFIRMED',
      'PREPARING': 'PREPARING',
      'READY': 'READY',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'PICKED_UP': 'DELIVERED', // Legacy frontend label mapped to DB enum
      'CANCELLED': 'CANCELLED',
      'REFUNDED': 'CANCELLED', // Legacy/typo label mapped to DB enum
    };

    // Normalize status to uppercase and convert hyphens to underscores for mapping
    const normalizedStatus = String(status).toUpperCase().replace(/-/g, '_');

    const dbStatus = statusMap[normalizedStatus];

    if (!dbStatus) {
      const allowedStatuses = Object.keys(statusMap).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status: ${status}. Must be one of: ${allowedStatuses}`,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.log(`[Order API] Updating status for order ${id} to ${dbStatus}`);

    // Build timestamp updates based on status - CRITICAL for audit trail
    const timestampUpdates: Record<string, Date | null> = {};
    const now = new Date();

    switch (dbStatus) {
      case 'CONFIRMED':
        timestampUpdates.confirmedAt = now;
        break;
      case 'PREPARING':
        timestampUpdates.preparingAt = now;
        break;
      case 'READY':
        timestampUpdates.readyAt = now;
        break;
      case 'OUT_FOR_DELIVERY':
        // No specific timestamp, but could add if needed
        break;
      case 'DELIVERED':
        timestampUpdates.deliveredAt = now;
        break;
      case 'CANCELLED':
        timestampUpdates.cancelledAt = now;
        break;
    }

    console.log(`[Order API] Setting timestamps:`, timestampUpdates);

    // CRITICAL: Include customer relation for notifications
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: dbStatus as any,
        ...timestampUpdates, // Set audit trail timestamps
        // Save rejection reason if cancelling
        ...(dbStatus === 'CANCELLED' && rejectionReason ? { rejectionReason } : {}),
      },
      include: {
        customer: true, // Include customer for notifications
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // Map DB status to OrderStatus type (e.g., PREPARING -> preparing)
    // MOVED OUTSIDE TRY BLOCK so it's accessible for both notifications and WebSocket
    const orderStatus = dbStatus.toLowerCase().replace(/_/g, '-') as any;

    // Send notifications for status changes
    try {
      console.log('[Order API] Attempting to load notification manager...');
      // Import dynamically to avoid circular dependencies
      const { notificationManager } = await import('@/lib/notifications/notification-manager');
      console.log('[Order API] Notification manager loaded successfully');
      
      // CRITICAL: Transform Prisma order to notification manager's expected format
      const transformedOrder = {
        ...updatedOrder,
        customer: {
          id: updatedOrder.customer?.id || undefined,
          name: updatedOrder.customerName,
          email: updatedOrder.customer?.email || updatedOrder.customerEmail,
          phone: updatedOrder.customer?.phone || updatedOrder.customerPhone,
          isReturningCustomer: !!updatedOrder.customer,
        },
        pricing: {
          subtotal: updatedOrder.subtotal,
          tax: updatedOrder.tax,
          deliveryFee: updatedOrder.deliveryFee,
          discount: updatedOrder.discount || 0,
          tip: updatedOrder.tip || 0,
          total: updatedOrder.total,
        },
        orderType: (updatedOrder as any).orderType || 'delivery',
        estimatedReadyTime: updatedOrder.estimatedDelivery || new Date(),
        deliveryAddress: updatedOrder.deliveryAddress ? {
          street: updatedOrder.deliveryAddress,
          city: updatedOrder.deliveryCity || '',
          zipCode: updatedOrder.deliveryZip || '',
          state: (updatedOrder as any).deliveryState || '',
          country: 'India',
        } : undefined,
        items: updatedOrder.items.map(item => ({
          id: item.id,
          menuItem: item.menuItem,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          specialInstructions: item.specialInstructions,
        })),
        contactPreference: ['email', 'sms'] as any,
        notifications: [],
      };
      
      console.log(`[Order API] 📧 Sending notifications for status: ${orderStatus}`);
      
      let notificationResult;
      if (dbStatus === 'CONFIRMED') {
        console.log('[Order API] 🎉 Sending ORDER CONFIRMATION');
        notificationResult = await notificationManager.sendOrderConfirmation(transformedOrder as any);
      } else {
        console.log(`[Order API] 🔔 Sending STATUS UPDATE to ${orderStatus}`);
        notificationResult = await notificationManager.sendStatusUpdate(transformedOrder as any, orderStatus);
      }
      
      console.log(`[Order API] ✅ Notification result:`, JSON.stringify(notificationResult, null, 2));
      
    } catch (notificationError) {
      console.error('[Order API] ❌ Failed to send notifications:', notificationError);
      // Don't fail the request, just log the error
    }

    // CRITICAL FIX: Broadcast status update via WebSocket to customer's browser
    // This ensures the customer UI updates immediately when chef confirms/updates order
    try {
      console.log(`[Order API] 📡 Broadcasting WebSocket update for order ${id} to status ${orderStatus}`);
      await broadcastOrderUpdate(id, orderStatus, {
        orderNumber: updatedOrder.orderNumber,
        previousStatus: body.previousStatus || 'unknown',
        updatedAt: new Date().toISOString(),
        // Include rejection reason for cancelled orders so customer sees why
        ...(dbStatus === 'CANCELLED' && rejectionReason ? { rejectionReason } : {}),
      });
      console.log('[Order API] ✅ WebSocket broadcast successful');
    } catch (wsError) {
      console.error('[Order API] ❌ WebSocket broadcast failed (order still updated):', wsError);
      // Don't fail the request - order is already updated in DB
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });

  } catch (error) {
    console.error('[Order API] Status update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}