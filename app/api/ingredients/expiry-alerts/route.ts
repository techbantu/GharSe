/**
 * SMART KITCHEN INTELLIGENCE - Ingredient Expiry Alerts API
 * 
 * Endpoint: GET /api/ingredients/expiry-alerts
 * 
 * Purpose: Get alerts for ingredients at risk of expiring
 * Returns: Categorized alerts (critical, high, medium priority)
 * 
 * Used by:
 * - Admin dashboard (waste prevention alerts)
 * - Dynamic pricing (discount items with expiring ingredients)
 * - Kitchen management (use-first recommendations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ingredientTracker, getAllIngredientsWithStatus } from '@/lib/ingredient-tracker';

/**
 * GET /api/ingredients/expiry-alerts
 * 
 * Query parameters:
 * - restaurantId: Restaurant ID (optional, defaults to 'default')
 * 
 * Example Response:
 * {
 *   "criticalAlerts": [
 *     {
 *       "ingredientName": "Chicken Breast",
 *       "hoursUntilExpiry": 2.5,
 *       "currentStock": 3.2,
 *       "unit": "kg",
 *       "affectedMenuItems": ["Butter Chicken", "Chicken Tikka"],
 *       "recommendedAction": "DISCOUNT_ITEMS",
 *       "potentialWasteCost": 850
 *     }
 *   ],
 *   "summary": {
 *     "totalAlertsCount": 5,
 *     "totalPotentialWaste": 2400,
 *     "itemsNeedingDiscount": ["butter-chicken", "chicken-tikka", "chicken-65"]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId') || 'default';

    // Get expiry risks
    const riskSummary = await ingredientTracker.getExpiryRisks();

    // Get low stock alerts (bonus information)
    const lowStockAlerts = await ingredientTracker.getLowStockAlerts();

    // Format critical alerts (< 2 hours)
    const criticalAlerts = riskSummary.criticalAlerts.map(risk => ({
      ingredientId: risk.ingredientId,
      ingredientName: risk.name,
      hoursUntilExpiry: Math.round(risk.hoursUntilExpiry * 10) / 10, // 1 decimal
      currentStock: risk.currentStock,
      unit: risk.unit,
      costPerUnit: risk.costPerUnit,
      affectedMenuItems: risk.affectedMenuItems,
      recommendedAction: risk.recommendedAction,
      potentialWasteCost: Math.round(risk.wasteCostIfExpired),
      urgencyLevel: risk.urgencyLevel,
    }));

    // Format high priority alerts (2-4 hours)
    const highPriorityAlerts = riskSummary.highPriorityAlerts.map(risk => ({
      ingredientId: risk.ingredientId,
      ingredientName: risk.name,
      hoursUntilExpiry: Math.round(risk.hoursUntilExpiry * 10) / 10,
      currentStock: risk.currentStock,
      unit: risk.unit,
      affectedMenuItems: risk.affectedMenuItems,
      recommendedAction: risk.recommendedAction,
      potentialWasteCost: Math.round(risk.wasteCostIfExpired),
      urgencyLevel: risk.urgencyLevel,
    }));

    // Format medium priority alerts (4-8 hours)
    const mediumPriorityAlerts = riskSummary.mediumPriorityAlerts.map(risk => ({
      ingredientId: risk.ingredientId,
      ingredientName: risk.name,
      hoursUntilExpiry: Math.round(risk.hoursUntilExpiry * 10) / 10,
      currentStock: risk.currentStock,
      unit: risk.unit,
      affectedMenuItems: risk.affectedMenuItems,
      recommendedAction: risk.recommendedAction,
      potentialWasteCost: Math.round(risk.wasteCostIfExpired),
      urgencyLevel: risk.urgencyLevel,
    }));

    // Calculate money saved by discounting
    const wastePrevention = await ingredientTracker.calculateWastePrevention(7);

    return NextResponse.json({
      // Categorized alerts
      criticalAlerts,
      highPriorityAlerts,
      mediumPriorityAlerts,
      
      // Low stock warnings (different concern)
      lowStockAlerts: lowStockAlerts.map(alert => ({
        ingredientId: alert.ingredientId,
        ingredientName: alert.name,
        currentStock: alert.currentStock,
        minimumStock: alert.minimumStock,
        unit: alert.unit,
        needsReorder: true,
      })),
      
      // Summary statistics
      summary: {
        totalAlertsCount:
          criticalAlerts.length +
          highPriorityAlerts.length +
          mediumPriorityAlerts.length,
        criticalCount: criticalAlerts.length,
        highPriorityCount: highPriorityAlerts.length,
        mediumPriorityCount: mediumPriorityAlerts.length,
        totalPotentialWaste: Math.round(riskSummary.totalPotentialWaste),
        itemsNeedingDiscount: riskSummary.itemsNeedingDiscount,
      },
      
      // Waste prevention impact
      wastePrevention: {
        last7Days: wastePrevention,
        moneySaved: Math.round(wastePrevention.moneySaved),
        wasteReductionPercent: Math.round(
          (wastePrevention.moneySaved / wastePrevention.totalPotentialWaste) * 100
        ),
      },
      
      // Metadata
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Ingredient Expiry API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get expiry alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingredients/expiry-alerts/action
 * 
 * Take action on an expiring ingredient
 * Actions: DISCOUNT_ITEMS, MARK_AS_USED, RESTOCK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredientId, action, quantity } = body;

    if (!ingredientId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: ingredientId, action' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'MARK_AS_USED':
        // Consume ingredient to reduce stock
        if (!quantity) {
          return NextResponse.json(
            { error: 'Quantity required for MARK_AS_USED action' },
            { status: 400 }
          );
        }
        result = await ingredientTracker.consumeIngredient(ingredientId, quantity);
        break;

      case 'DISCOUNT_ITEMS':
        // Get affected menu items and apply discounts
        const allIngredients = await getAllIngredientsWithStatus();
        const ingredient = allIngredients.find(i => i.ingredientId === ingredientId);
        
        if (!ingredient) {
          return NextResponse.json(
            { error: 'Ingredient not found' },
            { status: 404 }
          );
        }

        result = {
          affectedMenuItems: ingredient.affectedMenuItems,
          message: `Apply discounts to ${ingredient.affectedMenuItems.length} items`,
        };
        break;

      case 'RESTOCK':
        // Restock will be handled separately
        result = {
          message: 'Restock action acknowledged',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: MARK_AS_USED, DISCOUNT_ITEMS, RESTOCK' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      ingredientId,
      result,
    });
  } catch (error) {
    console.error('[Ingredient Expiry API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to execute action',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

