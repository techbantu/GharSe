import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

const REJECTION_REASONS: Record<string, string> = {
  'out-of-stock': 'Item(s) Out of Stock',
  'kitchen-closed': 'Kitchen is Currently Closed',
  'too-busy': 'Kitchen Too Busy',
  'delivery-unavailable': 'Delivery Unavailable to Your Area',
  'payment-issue': 'Payment Issue',
  'other': 'Unable to Fulfill Order'
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  console.log('==== ORDER REJECTION REQUEST ====');
  console.log('[Reject API] Order ID:', id);

  try {
    const body = await request.json();
    const { reason } = body;
    
    console.log(`[Reject API] Rejecting order ${id} with reason: ${reason}`);

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Verify reason is valid
    if (!REJECTION_REASONS[reason]) {
      return NextResponse.json(
        { success: false, error: 'Invalid rejection reason' },
        { status: 400 }
      );
    }

    // Update order status to CANCELLED and add rejection reason
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        rejectionReason: REJECTION_REASONS[reason]
      },
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // Send rejection notification email
    try {
      const { notificationManager } = await import('@/lib/notifications/notification-manager');
      
      // Transform order for notification
      const transformedOrder = {
        ...updatedOrder,
        customer: {
          id: updatedOrder.customer?.id || undefined,
          name: updatedOrder.customerName,
          email: updatedOrder.customer?.email || updatedOrder.customerEmail,
          phone: updatedOrder.customer?.phone || updatedOrder.customerPhone,
        },
        pricing: {
          subtotal: updatedOrder.subtotal,
          tax: updatedOrder.tax,
          deliveryFee: updatedOrder.deliveryFee,
          discount: updatedOrder.discount || 0,
          tip: updatedOrder.tip || 0,
          total: updatedOrder.total,
        },
        orderType: 'delivery' as const,
        items: updatedOrder.items.map((item: any) => ({
          menuItem: {
            name: item.menuItem.name,
            price: item.price
          },
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        rejectionReason: REJECTION_REASONS[reason]
      };

      // Send order rejection email
      await notificationManager.sendOrderRejection(transformedOrder);
      
      logger.info('Order rejection notification sent', {
        orderId: id,
        reason: REJECTION_REASONS[reason],
        customerEmail: transformedOrder.customer.email
      });
    } catch (notificationError) {
      // Don't fail the rejection if notification fails
      logger.error('Failed to send order rejection notification', {
        orderId: id,
        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
      });
    }

    logger.info('Order rejected successfully', {
      orderId: id,
      reason: REJECTION_REASONS[reason],
    });

    return NextResponse.json({
      success: true,
      message: 'Order rejected successfully',
      order: updatedOrder
    });

  } catch (error) {
    logger.error('Error rejecting order', {
      orderId: id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject order',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}




