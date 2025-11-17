/**
 * FIRST ORDER DISCOUNT API ROUTE
 * 
 * Server-side endpoint for checking first order discount eligibility
 * This keeps Prisma operations server-side only (never in browser)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/first-order-discount?customerId=xxx
 * 
 * Check if customer is eligible for 20% first order discount
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    // Must be logged in to get first order discount
    if (!customerId) {
      return NextResponse.json({
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'Please log in to get your 20% first order discount',
      });
    }

    // Get customer with order count
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        totalOrders: true,
        firstOrderEligible: true,
      },
    });

    if (!customer) {
      return NextResponse.json({
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'Customer not found',
      });
    }

    // Check eligibility: Must have BOTH flags
    // 1. firstOrderEligible = true (not used yet)
    // 2. totalOrders = 0 (never completed an order)
    const isEligible = customer.firstOrderEligible && customer.totalOrders === 0;

    if (!isEligible) {
      return NextResponse.json({
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'First order discount already used',
        customerId: customer.id,
      });
    }

    // Eligible for first order discount!
    logger.info('First order discount check - eligible', {
      customerId: customer.id,
      customerEmail: customer.email,
    });

    return NextResponse.json({
      eligible: true,
      discountAmount: 0, // Calculated client-side based on subtotal
      discountPercent: 20,
      message: '🎉 Welcome! 20% off your first order automatically applied',
      customerId: customer.id,
    });

  } catch (error) {
    logger.error('Failed to check first order discount', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'Error checking discount eligibility',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/first-order-discount/mark-used
 * 
 * Mark first order discount as used (called when order completes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID required' },
        { status: 400 }
      );
    }

    // Mark discount as used
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstOrderEligible: false,
      },
    });

    logger.info('First order discount marked as used', {
      customerId,
    });

    return NextResponse.json({
      success: true,
      message: 'First order discount marked as used',
    });

  } catch (error) {
    logger.error('Failed to mark first order as used', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, message: 'Failed to mark discount as used' },
      { status: 500 }
    );
  }
}

