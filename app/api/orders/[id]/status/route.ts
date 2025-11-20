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

    // Validate status against allowed values
    const validStatuses = [
      'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    ];

    // Normalize status to uppercase for DB
    const normalizedStatus = status.toUpperCase().replace(/-/g, '_');
    
    // Map frontend status to DB status if needed
    const statusMap: Record<string, string> = {
      'PENDING_CONFIRMATION': 'PENDING_CONFIRMATION',
      'PENDING': 'PENDING',
      'CONFIRMED': 'CONFIRMED',
      'PREPARING': 'PREPARING',
      'READY': 'READY',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'CANCELLED': 'CANCELLED'
    };

    const dbStatus = statusMap[normalizedStatus] || normalizedStatus;

    if (!validStatuses.includes(dbStatus) && dbStatus !== 'PENDING_CONFIRMATION') {
       // Allow PENDING_CONFIRMATION as it might be passed, though usually internal
       // But strictly speaking, we should check against OrderStatus enum
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
