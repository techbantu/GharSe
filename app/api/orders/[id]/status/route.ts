import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  console.log('==== STATUS UPDATE REQUEST RECEIVED ====');
  console.log('[Order API] Request URL:', request.url);
  console.log('[Order API] Order ID:', id);

  try {
    const body = await request.json();
    const { status } = body;
    
    console.log(`[Order API] Updating status for order ${id} to ${status}`);

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

    // CRITICAL: Include customer relation for notifications
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: dbStatus as any },
      include: {
        customer: true, // Include customer for notifications
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // Send notifications for status changes
    try {
      // Import dynamically to avoid circular dependencies
      const { notificationManager } = await import('@/lib/notifications/notification-manager');
      
      // Map DB status to OrderStatus type (e.g., PREPARING -> preparing)
      const orderStatus = dbStatus.toLowerCase().replace(/_/g, '-') as any;
      
      // CRITICAL: Transform Prisma order to notification manager's expected format
      // The notification manager expects order.customer.email and order.customer.phone
      // Prisma order has customerEmail, customerPhone, and optional customer relation
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
      
      console.log(`[Order API] 📧 Preparing to send notifications for status: ${dbStatus} (${orderStatus})`);
      console.log(`[Order API] Customer email: ${transformedOrder.customer.email}`);
      console.log(`[Order API] Customer phone: ${transformedOrder.customer.phone}`);
      console.log(`[Order API] Order number: ${transformedOrder.orderNumber}`);
      
      // CRITICAL: Send ORDER CONFIRMATION when chef confirms (not just status update)
      let notificationResult;
      if (dbStatus === 'CONFIRMED') {
        // Chef just confirmed the order - send FULL confirmation email + SMS
        console.log('[Order API] 🎉 Sending ORDER CONFIRMATION (chef approved!)');
        notificationResult = await notificationManager.sendOrderConfirmation(transformedOrder as any);
      } else {
        // Regular status update for other statuses
        notificationResult = await notificationManager.sendStatusUpdate(transformedOrder as any, orderStatus);
      }
      
      console.log(`[Order API] ✅ Notification result:`, {
        overall: notificationResult.overall,
        email: notificationResult.email,
        sms: notificationResult.sms,
        orderNumber: transformedOrder.orderNumber,
        status: orderStatus,
      });
      
      if (!notificationResult.overall) {
        console.warn(`[Order API] ⚠️ All notifications failed for order ${id}`, {
          emailError: notificationResult.email?.error,
          smsError: notificationResult.sms?.error,
          emailSkipped: notificationResult.email?.skipped,
          smsSkipped: notificationResult.sms?.skipped,
        });
      } else {
        console.log(`[Order API] 🎉 Successfully sent notifications for order ${transformedOrder.orderNumber}`);
      }
    } catch (notificationError) {
      console.error('[Order API] ❌ Failed to send notifications:', {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
        orderId: id,
        orderNumber: updatedOrder.orderNumber,
        status: dbStatus,
        customerEmail: updatedOrder.customerEmail,
        customerPhone: updatedOrder.customerPhone,
      });
      // Don't fail the request, just log the error
    }

    // TODO: Emit socket event for real-time update
    // io.emit('orderStatusUpdated', updatedOrder);

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
