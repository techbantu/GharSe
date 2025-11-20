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
    });

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
