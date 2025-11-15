/**
 * LINK ORDERS TO CUSTOMER - Auto-Link API
 * 
 * POST /api/customer/link-orders
 * 
 * Purpose: Automatically link orders to authenticated customer by email
 * This fixes orders that were placed before the customerId feature was added
 * 
 * Security: Requires valid JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractTokenFromHeader, extractTokenFromCookie, verifyToken } from '@/lib/auth-customer';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get token from header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    const token = extractTokenFromHeader(authHeader) || extractTokenFromCookie(cookieHeader);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get customer info
    const customer = await prisma.customer.findUnique({
      where: {
        id: payload.customerId,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Find orders with matching email but no customerId
    const orphanOrders = await prisma.order.findMany({
      where: {
        customerEmail: customer.email,
        customerId: null, // Orders not yet linked
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
      },
    });

    if (orphanOrders.length === 0) {
      logger.info('No orphan orders to link', { customerId: customer.id });
      return NextResponse.json({
        success: true,
        message: 'All orders already linked',
        linkedCount: 0,
      });
    }

    // Link all orders to this customer
    const result = await prisma.order.updateMany({
      where: {
        customerEmail: customer.email,
        customerId: null,
      },
      data: {
        customerId: customer.id,
      },
    });

    logger.info('Linked orders to customer', {
      customerId: customer.id,
      customerEmail: customer.email,
      linkedCount: result.count,
      orderNumbers: orphanOrders.map(o => o.orderNumber).join(', '),
    });

    return NextResponse.json({
      success: true,
      message: `Linked ${result.count} order(s) to your account`,
      linkedCount: result.count,
    });

  } catch (error: any) {
    logger.error('Error linking orders to customer', {
      error: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to link orders' },
      { status: 500 }
    );
  }
}

