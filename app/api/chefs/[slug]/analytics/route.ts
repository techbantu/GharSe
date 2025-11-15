/**
 * CHEF ANALYTICS API - Performance Metrics
 * 
 * GET /api/chefs/[slug]/analytics - Get chef's performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { isMultiChefMode } from '@/lib/feature-flags';

/**
 * GET /api/chefs/[slug]/analytics - Get chef analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();

  try {
    if (!isMultiChefMode()) {
      return NextResponse.json(
        { success: false, error: 'Multi-chef mode not enabled' },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Date range
    const period = searchParams.get('period') || 'week'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Find chef
    const chef = await prisma.chef.findUnique({
      where: { slug },
      select: { id: true, businessName: true },
    });

    if (!chef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case 'day':
        fromDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        fromDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        fromDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        fromDate = new Date(now.setDate(now.getDate() - 7));
    }

    if (startDate) fromDate = new Date(startDate);
    const toDate = endDate ? new Date(endDate) : new Date();

    // Fetch analytics data
    const analytics = await prisma.chefAnalytics.findMany({
      where: {
        chefId: chef.id,
        date: {
          gte: fromDate.toISOString().split('T')[0],
          lte: toDate.toISOString().split('T')[0],
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        ordersCount: acc.ordersCount + day.ordersCount,
        revenue: acc.revenue + day.revenue,
        platformFee: acc.platformFee + day.platformFee,
        netEarnings: acc.netEarnings + day.netEarnings,
        cancelledOrders: acc.cancelledOrders + day.cancelledOrders,
      }),
      {
        ordersCount: 0,
        revenue: 0,
        platformFee: 0,
        netEarnings: 0,
        cancelledOrders: 0,
      }
    );

    // Calculate averages
    const avgOrderValue = totals.ordersCount > 0 ? totals.revenue / totals.ordersCount : 0;
    const avgRating = analytics.length > 0
      ? analytics.reduce((sum, day) => sum + (day.rating || 0), 0) / analytics.length
      : 0;
    const cancellationRate = totals.ordersCount > 0
      ? (totals.cancelledOrders / totals.ordersCount) * 100
      : 0;

    const duration = Date.now() - startTime;

    logger.info('Chef analytics fetched', {
      slug,
      chefId: chef.id,
      period,
      dataPoints: analytics.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        chef: {
          id: chef.id,
          businessName: chef.businessName,
        },
        period: {
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0],
          days: analytics.length,
        },
        totals,
        averages: {
          orderValue: Math.round(avgOrderValue * 100) / 100,
          rating: Math.round(avgRating * 10) / 10,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
        },
        daily: analytics,
      },
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch chef analytics', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

