/**
 * SMART KITCHEN INTELLIGENCE - Kitchen Capacity API
 * 
 * Endpoint: GET /api/kitchen/capacity
 * 
 * Purpose: Get real-time kitchen capacity and utilization
 * Returns: Current orders, max capacity, wait times, and recommendations
 * 
 * Used by:
 * - Admin dashboard (live capacity monitoring)
 * - Dynamic pricing (capacity-based price adjustments)
 * - Customer-facing order placement (wait time estimates)
 */

import { NextRequest, NextResponse } from 'next/server';
import { kitchenMonitor } from '@/lib/kitchen-monitor';

/**
 * GET /api/kitchen/capacity
 * 
 * Query parameters:
 * - restaurantId: Restaurant ID (optional, defaults to 'default')
 * 
 * Example Response:
 * {
 *   "currentOrders": 8,
 *   "maxCapacity": 15,
 *   "utilizationPercent": 53,
 *   "estimatedWaitMinutes": 22,
 *   "staffOnDuty": 3,
 *   "status": "OPERATIONAL",
 *   "recommendation": "ACCEPT_ORDERS",
 *   "timestamp": "2025-11-12T14:30:00Z"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId') || 'default';

    // Get current capacity
    const capacity = await kitchenMonitor.getCurrentCapacity();

    // Get capacity multiplier for pricing
    const capacityMultiplier = await kitchenMonitor.getCapacityMultiplier();

    // Check if we can accept orders
    const acceptanceStatus = await kitchenMonitor.canAcceptOrder();

    return NextResponse.json({
      // Basic metrics
      currentOrders: capacity.currentOrders,
      maxCapacity: capacity.maxCapacity,
      utilizationPercent: capacity.utilizationPercent,
      estimatedWaitMinutes: capacity.estimatedWaitMinutes,
      staffOnDuty: capacity.staffOnDuty,
      status: capacity.status,
      recommendation: capacity.recommendation,
      
      // Acceptance status
      canAcceptOrders: acceptanceStatus.canAccept,
      acceptanceMessage: acceptanceStatus.reason,
      
      // Pricing impact
      capacityMultiplier,
      priceAdjustment: capacityMultiplier > 1
        ? `+${Math.round((capacityMultiplier - 1) * 100)}% surge`
        : capacityMultiplier < 1
        ? `-${Math.round((1 - capacityMultiplier) * 100)}% discount`
        : 'Normal pricing',
      
      // Metadata
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Kitchen Capacity API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get kitchen capacity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kitchen/capacity/history
 * 
 * Get historical capacity data for charts
 * Query parameters:
 * - hours: Number of hours to look back (default: 12)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hours = body.hours || 12;

    const history = await kitchenMonitor.getHistoricalLoad(hours);

    // Also get peak hours analysis
    const peakHours = await kitchenMonitor.getPeakHours(7);

    return NextResponse.json({
      history: history.map(h => ({
        timestamp: h.timestamp.toISOString(),
        utilization: h.utilizationPercent,
        orders: h.currentOrders,
        waitTime: h.estimatedWaitMinutes,
      })),
      peakHours: peakHours.slice(0, 5).map(p => ({
        hour: p.hour,
        hourFormatted: `${p.hour}:00`,
        avgUtilization: Math.round(p.avgUtilization),
      })),
      timeRange: {
        from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Kitchen Capacity API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get capacity history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

