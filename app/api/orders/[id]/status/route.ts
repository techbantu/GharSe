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
      console.log('[Order API] Attempting to load notification manager...');
      // Import dynamically to avoid circular dependencies
      const { notificationManager } = await import('@/lib/notifications/notification-manager');
      console.log('[Order API] Notification manager loaded successfully');
      
      // Map DB status to OrderStatus type (e.g., PREPARING -> preparing)
      const orderStatus = dbStatus.toLowerCase().replace(/_/g, '-') as any;
      
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