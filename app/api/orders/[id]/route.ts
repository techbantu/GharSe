/**
 * Order Detail API Route
 * 
 * Purpose: Handles operations on a specific order (get, update, cancel)
 * Uses Prisma for database operations with JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * GET /api/orders/[id]
 * Fetch a specific order by ID with full details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch the order with all details
    const order = await (prisma.order.findUnique as any)({
      where: {
        id: id,
        customerId: userId, // Ensure user can only access their own orders
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        payments: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform the order data to match the frontend interface
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      deliveryAddress: order.deliveryAddress,
      deliveryInstructions: order.deliveryNotes,
      restaurantName: 'Bantu\'s Kitchen', // You can add this to your schema if needed
      dasherName: order.dasherName || undefined,
      dasherPhone: order.dasherPhone || undefined,
      items: order.items.map((item: any) => ({
        id: item.id,
        name: item.name || item.menuItem?.name || 'Item',
        quantity: item.quantity,
        price: item.price || item.menuItem?.price || 0,
        image: item.menuItem?.image || null,
        customizations: item.customizations || undefined,
      })),
    };

    return NextResponse.json({
      success: true,
      order: transformedOrder,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order status or cancel order
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Verify order belongs to user
    const order = await (prisma.order.findUnique as any)({
      where: {
        id: id,
        customerId: userId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'cancel') {
      // Only allow cancellation if order is not already delivered or cancelled
      if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel this order' },
          { status: 400 }
        );
      }

      const updatedOrder = await (prisma.order.update as any)({
        where: { id: id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: body.reason || 'Customer requested cancellation',
        },
      });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: 'Order cancelled successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

