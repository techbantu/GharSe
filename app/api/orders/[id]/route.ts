/**
 * NEW FILE: Single Order API Route
 * 
 * Purpose: Handles operations on a specific order (get, update status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Order, OrderStatus } from '@/types';
import { getOrderById, updateOrder } from '@/lib/order-storage';

/**
 * GET /api/orders/[id] - Get order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = getOrderById(id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, order });
    
  } catch (error) {
    console.error('Order retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id] - Update order status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;
    
    // Validate status if provided
    if (status) {
      const validStatuses: OrderStatus[] = [
        'pending', 'confirmed', 'preparing', 'ready',
        'out-for-delivery', 'delivered', 'picked-up', 'cancelled', 'refunded'
      ];
      
      if (!validStatuses.includes(status as OrderStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }
    
    // Update order using shared storage
    const updates: Partial<Order> = {};
    if (status) updates.status = status as OrderStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    
    const updatedOrder = updateOrder(id, updates);
    
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // In production: Update database, send notifications, etc.
    
    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Order updated successfully' 
    });
    
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

