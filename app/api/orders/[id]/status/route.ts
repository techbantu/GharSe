import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status } = await request.json();

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

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: dbStatus as any },
      include: {
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
      
      // Map DB status to OrderStatus type
      const orderStatus = dbStatus.toLowerCase().replace(/_/g, '-') as any;
      
      // Send notification based on status
      await notificationManager.sendOrderStatusUpdate(updatedOrder as any, orderStatus);
      
      console.log(`[Order API] Sent notifications for status: ${dbStatus}`);
    } catch (notificationError) {
      console.error('[Order API] Failed to send notifications:', notificationError);
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
