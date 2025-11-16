/**
 * API Route: Pending Queue Statistics
 * 
 * Purpose: Shows admin dashboard how many orders are in grace period (incoming queue)
 * Returns count and average time remaining before orders reach kitchen
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Fetch all orders in PENDING_CONFIRMATION status with future grace period
    const now = new Date();
    
    logger.info('Fetching pending queue', {
      now: now.toISOString(),
    });
    
    const pendingOrders = await (prisma.order.findMany as any)({
      where: {
        status: 'PENDING_CONFIRMATION',
        gracePeriodExpiresAt: {
          gt: now, // Only orders still in grace period
        },
      },
      select: {
        id: true,
        orderNumber: true,
        gracePeriodExpiresAt: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info('Found pending orders', {
      count: pendingOrders.length,
      orders: pendingOrders.map((o: any) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        expiresAt: o.gracePeriodExpiresAt,
      })),
    });

    // Calculate average time remaining
    const timeRemainingValues = pendingOrders.map((order: any) => {
      if (!order.gracePeriodExpiresAt) return 0;
      const remaining = order.gracePeriodExpiresAt.getTime() - now.getTime();
      return Math.max(0, Math.floor(remaining / 1000)); // seconds
    });

    const avgTimeRemainingSeconds = timeRemainingValues.length > 0
      ? Math.floor(timeRemainingValues.reduce((a: number, b: number) => a + b, 0) / timeRemainingValues.length)
      : 0;

    logger.info('Pending queue fetched', {
      count: pendingOrders.length,
      avgTimeRemainingSeconds,
    });

    return NextResponse.json({
      success: true,
      count: pendingOrders.length,
      avgTimeRemainingSeconds,
      orders: pendingOrders.map((o: any) => ({
        orderNumber: o.orderNumber,
        expiresAt: o.gracePeriodExpiresAt,
      })),
    });

  } catch (error) {
    logger.error('Failed to fetch pending queue', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pending queue',
        count: 0,
        avgTimeRemainingSeconds: 0,
      },
      { status: 500 }
    );
  }
}
