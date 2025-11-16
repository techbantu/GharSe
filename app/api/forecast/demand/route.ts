/**
 * SMART KITCHEN INTELLIGENCE - Demand Forecast API
 * 
 * Endpoint: GET /api/forecast/demand
 * 
 * Purpose: Get ML-powered demand predictions for menu items
 * Returns: Predicted orders for next 1, 3, and 6 hours per item
 * 
 * Used by:
 * - Admin dashboard (to plan kitchen staffing)
 * - Dynamic pricing (to adjust prices before surge)
 * - Inventory management (to prepare ingredients)
 */

import { NextRequest, NextResponse } from 'next/server';
import { demandForecaster } from '@/lib/ml/demand-forecaster';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/forecast/demand
 * 
 * Query parameters:
 * - itemId: Specific menu item ID (optional, defaults to all popular items)
 * - hours: Number of hours to forecast (optional, default: 6)
 * 
 * Example Response:
 * {
 *   "predictions": [
 *     {
 *       "itemId": "butter-chicken",
 *       "itemName": "Butter Chicken",
 *       "nextHourPrediction": 12,
 *       "next3HoursPrediction": 34,
 *       "peakHourPrediction": 18,
 *       "confidence": 0.82
 *     }
 *   ],
 *   "generatedAt": "2025-11-12T14:00:00Z"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    const hours = parseInt(searchParams.get('hours') || '6');

    let predictions: any[] = [];

    if (itemId) {
      // Forecast for specific item
      const menuItem = await (prisma.menuItem.findUnique as any)({
        where: { id: itemId },
        select: { id: true, name: true },
      });

      if (!menuItem) {
        return NextResponse.json(
          { error: 'Menu item not found' },
          { status: 404 }
        );
      }

      const hourlyPredictions = await demandForecaster.predictNextHours(itemId, hours);

      // Calculate peak hour
      const peakPrediction = hourlyPredictions.reduce((max: any, pred: any) =>
        pred.predictedOrders > max.predictedOrders ? pred : max
      );

      predictions.push({
        itemId: menuItem.id,
        itemName: menuItem.name,
        nextHourPrediction: hourlyPredictions[0]?.predictedOrders || 0,
        next3HoursPrediction: hourlyPredictions
          .slice(0, 3)
          .reduce((sum: number, p: any) => sum + p.predictedOrders, 0),
        next6HoursPrediction: hourlyPredictions
          .reduce((sum: number, p: any) => sum + p.predictedOrders, 0),
        peakHourPrediction: peakPrediction.predictedOrders,
        peakHourTime: peakPrediction.timestamp.toISOString(),
        confidence: hourlyPredictions[0]?.confidence || 0.5,
        hourlyBreakdown: hourlyPredictions.map(p => ({
          hour: p.timestamp.toISOString(),
          predicted: p.predictedOrders,
          confidenceInterval: p.confidenceInterval,
        })),
      });
    } else {
      // Forecast for all popular items
      const popularItems = await (prisma.menuItem.findMany as any)({
        where: {
          isPopular: true,
          isAvailable: true,
        },
        select: { id: true, name: true },
        take: 10, // Limit to top 10 for performance
      });

      for (const item of popularItems) {
        const hourlyPredictions = await demandForecaster.predictNextHours(item.id, hours);

        // Calculate peak hour
        const peakPrediction = hourlyPredictions.reduce((max: any, pred: any) =>
          pred.predictedOrders > max.predictedOrders ? pred : max
        );

        predictions.push({
          itemId: item.id,
          itemName: item.name,
          nextHourPrediction: hourlyPredictions[0]?.predictedOrders || 0,
          next3HoursPrediction: hourlyPredictions
            .slice(0, 3)
            .reduce((sum: number, p: any) => sum + p.predictedOrders, 0),
          next6HoursPrediction: hourlyPredictions
            .reduce((sum: number, p: any) => sum + p.predictedOrders, 0),
          peakHourPrediction: peakPrediction.predictedOrders,
          peakHourTime: peakPrediction.timestamp.toISOString(),
          confidence: hourlyPredictions[0]?.confidence || 0.5,
        });
      }
    }

    return NextResponse.json({
      predictions,
      generatedAt: new Date().toISOString(),
      forecastHorizon: hours,
    });
  } catch (error) {
    console.error('[Demand Forecast API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate demand forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forecast/demand/update
 * 
 * Update prediction accuracy with actual results
 * Called after an hour passes to improve model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menuItemId, timestamp, actualOrders } = body;

    if (!menuItemId || !timestamp || actualOrders === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: menuItemId, timestamp, actualOrders' },
        { status: 400 }
      );
    }

    await demandForecaster.updateWithActual(
      menuItemId,
      new Date(timestamp),
      actualOrders
    );

    return NextResponse.json({
      success: true,
      message: 'Prediction updated with actual results',
    });
  } catch (error) {
    console.error('[Demand Forecast API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update prediction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

