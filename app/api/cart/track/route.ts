/**
 * NEW FILE: Cart Tracking API - Real-Time Inventory Reservation System
 * 
 * Purpose: Track cart changes across all users for urgency calculations
 * 
 * Features:
 * - POST: Track cart items (add/update reservations)
 * - DELETE: Release cart items (remove reservations)
 * - GET: Get urgency data for specific items
 * 
 * Security:
 * - Rate limiting: 10 requests per minute per session
 * - Session validation: All operations tied to unique session ID
 * - No PII: Only session IDs stored (privacy compliant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cartTracker } from '@/lib/cart-inventory-tracker';
import { rateLimiter, getClientIp } from '@/utils/rate-limit';

// Rate limit config: 10 requests per minute per IP
const CART_TRACK_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  route: 'POST /api/cart/track',
};

/**
 * Request schemas
 */
const trackCartSchema = z.object({
  sessionId: z.string().min(1),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })),
});

const releaseCartSchema = z.object({
  sessionId: z.string().min(1),
  itemIds: z.array(z.string()).optional(),
});

const getUrgencySchema = z.object({
  itemIds: z.array(z.string()),
});

/**
 * POST /api/cart/track
 * Track cart items for a session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimiter.check(ip, CART_TRACK_LIMIT);
    
    if (rateLimitResult.isErr()) {
      return NextResponse.json(
        { error: rateLimitResult.error.message },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { sessionId, items } = trackCartSchema.parse(body);

    // Track each item
    for (const item of items) {
      cartTracker.trackCartItem(sessionId, item.itemId, item.quantity);
    }

    // Get statistics
    const stats = cartTracker.getStats();

    return NextResponse.json({
      success: true,
      message: `Tracked ${items.length} items for session`,
      sessionId,
      itemsTracked: items.length,
      stats,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Cart Track API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track cart items' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/track
 * Release cart items for a session
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimiter.check(ip, CART_TRACK_LIMIT);
    
    if (rateLimitResult.isErr()) {
      return NextResponse.json(
        { error: rateLimitResult.error.message },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { sessionId, itemIds } = releaseCartSchema.parse(body);

    if (itemIds && itemIds.length > 0) {
      // Release specific items
      for (const itemId of itemIds) {
        cartTracker.releaseCartItem(sessionId, itemId);
      }
    } else {
      // Release all items for this session
      cartTracker.releaseAllCartItems(sessionId);
    }

    return NextResponse.json({
      success: true,
      message: itemIds 
        ? `Released ${itemIds.length} items`
        : 'Released all cart items',
      sessionId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Cart Track API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to release cart items' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cart/track?itemIds=id1,id2,id3
 * Get urgency data for specific items
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimiter.check(ip, CART_TRACK_LIMIT);
    
    if (rateLimitResult.isErr()) {
      return NextResponse.json(
        { error: rateLimitResult.error.message },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const itemIdsParam = searchParams.get('itemIds');

    if (!itemIdsParam) {
      return NextResponse.json(
        { error: 'Missing itemIds query parameter' },
        { status: 400 }
      );
    }

    const itemIds = itemIdsParam.split(',');

    // Calculate demand pressure for each item
    const urgencyData = await Promise.all(
      itemIds.map((itemId: string) => cartTracker.calculateDemandPressure(itemId))
    );

    return NextResponse.json({
      success: true,
      items: urgencyData,
      stats: cartTracker.getStats(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Cart Track API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get urgency data' },
      { status: 500 }
    );
  }
}

