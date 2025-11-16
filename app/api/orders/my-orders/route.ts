/**
 * MY ORDERS API
 * 
 * GET /api/orders/my-orders
 * 
 * Purpose: Get all orders for the authenticated customer
 * 
 * Features:
 * - Fetch customer's order history
 * - Include order details and status
 * - JWT authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractTokenFromHeader, extractTokenFromCookie, verifyToken } from '@/lib/auth-customer';

export async function GET(request: NextRequest) {
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

    // Fetch orders
    const orders = await (prisma.order.findMany as any)({
      where: {
        customerId: payload.customerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            menuItem: true, // FIXED: Was 'dish', should be 'menuItem'
          },
        },
        payments: true, // Include payment info for transaction details
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error: any) {
    console.error('❌ [My Orders API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

