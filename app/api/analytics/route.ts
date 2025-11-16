/**
 * NEW FILE: Analytics API Route
 * 
 * Purpose: Tracks user interactions, orders, and business metrics
 * 
 * Features:
 * - Page view tracking
 * - Event tracking
 * - Conversion tracking
 * - Business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory analytics store (replace with database in production)
const analyticsData = {
  pageViews: new Map<string, number>(),
  events: [] as Array<{
    type: string;
    data: any;
    timestamp: Date;
  }>,
  conversions: [] as Array<{
    orderId: string;
    amount: number;
    timestamp: Date;
  }>,
};

/**
 * POST /api/analytics - Track events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, page } = body;
    
    // Track page view
    if (page) {
      const current = analyticsData.pageViews.get(page) || 0;
      analyticsData.pageViews.set(page, current + 1);
    }
    
    // Track event
    if (event) {
      analyticsData.events.push({
        type: event,
        data,
        timestamp: new Date(),
      });
    }
    
    // Track conversion
    if (event === 'order_completed' && data?.orderId) {
      analyticsData.conversions.push({
        orderId: data.orderId,
        amount: data.amount || 0,
        timestamp: new Date(),
      });
    }
    
    // Keep only last 1000 events (replace with database in production)
    if (analyticsData.events.length > 1000) {
      analyticsData.events = analyticsData.events.slice(-1000);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics - Get analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'dashboard') {
      // Calculate stats
      const totalPageViews = Array.from(analyticsData.pageViews.values())
        .reduce((sum: number, count: number) => sum + count, 0);
      
      const totalRevenue = analyticsData.conversions
        .reduce((sum: number, conv: any) => sum + conv.amount, 0);
      
      const totalOrders = analyticsData.conversions.length;
      
      const eventsByType = analyticsData.events.reduce((acc: any, event: any) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return NextResponse.json({
        success: true,
        data: {
          pageViews: totalPageViews,
          revenue: totalRevenue,
          orders: totalOrders,
          eventsByType,
          topPages: Array.from(analyticsData.pageViews.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([page, views]) => ({ page, views })),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      pageViews: Object.fromEntries(analyticsData.pageViews),
      eventCount: analyticsData.events.length,
      conversionCount: analyticsData.conversions.length,
    });
    
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}

