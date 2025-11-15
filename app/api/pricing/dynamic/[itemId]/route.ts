/**
 * SMART KITCHEN INTELLIGENCE - Dynamic Pricing API
 * 
 * Endpoint: GET /api/pricing/dynamic/[itemId]
 * 
 * Purpose: Get real-time dynamic price for a menu item
 * Returns: Current price with discount/surge information and explanation
 * 
 * This API is called by:
 * - Frontend menu pages (to display dynamic prices)
 * - Shopping cart (to ensure price accuracy at checkout)
 * - Admin dashboard (to monitor pricing algorithm)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pricingEngine } from '@/lib/pricing-engine';

/**
 * GET /api/pricing/dynamic/[itemId]
 * 
 * Get dynamic price for a specific menu item
 * 
 * Example Response:
 * {
 *   "itemId": "butter-chicken",
 *   "basePrice": 299,
 *   "currentPrice": 239,
 *   "discount": 20,
 *   "reason": "Kitchen has capacity + ingredients expiring soon",
 *   "urgency": "Next 2 hours only",
 *   "savingsAmount": 60,
 *   "priceValidUntil": "2025-11-12T16:00:00Z",
 *   "confidence": 0.87
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Calculate dynamic price
    const dynamicPrice = await pricingEngine.calculatePriceForItem(itemId);

    // Return formatted response
    return NextResponse.json({
      itemId,
      basePrice: dynamicPrice.basePrice,
      currentPrice: dynamicPrice.adjustedPrice,
      discount: dynamicPrice.discount,
      reason: dynamicPrice.reason,
      urgency: dynamicPrice.urgency,
      savingsAmount: dynamicPrice.savingsAmount,
      priceValidUntil: dynamicPrice.priceValidUntil.toISOString(),
      confidence: dynamicPrice.confidence,
      
      // Additional metadata (for admin/debugging)
      details: {
        demandScore: dynamicPrice.demandScore,
        capacityScore: dynamicPrice.capacityScore,
        expiryScore: dynamicPrice.expiryScore,
        adjustmentReason: dynamicPrice.adjustmentReason,
        algorithmVersion: dynamicPrice.algorithmVersion,
      },
    });
  } catch (error) {
    console.error('[Dynamic Pricing API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate dynamic price',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pricing/dynamic/[itemId]
 * 
 * Force price recalculation (admin only)
 * Useful for testing or manual price adjustments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // TODO: Add admin authentication check here
    // const session = await getSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Recalculate price
    const dynamicPrice = await pricingEngine.calculatePriceForItem(itemId);

    return NextResponse.json({
      success: true,
      message: 'Price recalculated successfully',
      price: dynamicPrice,
    });
  } catch (error) {
    console.error('[Dynamic Pricing API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to recalculate price',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

