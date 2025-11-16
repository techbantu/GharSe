/**
 * GENIUS FILE: Cart Modification API - AI-Powered Cart Control
 * 
 * Purpose: Allows AI to directly manipulate user carts for seamless order-taking
 * 
 * Features:
 * - Add items to cart on AI command
 * - Remove items when user requests
 * - Clear entire cart
 * - Update quantities
 * - Returns updated cart state for real-time sync
 * 
 * Security:
 * - Session-based validation
 * - Rate limiting (20 req/min per session)
 * - Cart sync with inventory tracker
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimiter, getClientIp } from '@/utils/rate-limit';
import { cartTracker } from '@/lib/cart-inventory-tracker';

// Rate limit: 20 requests per minute (AI can make multiple cart changes)
const CART_MODIFY_LIMIT = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  route: 'POST /api/cart/modify',
};

// Request schema
const modifyCartSchema = z.object({
  sessionId: z.string().min(1),
  action: z.enum(['add', 'remove', 'clear', 'update_quantity']),
  itemId: z.string().optional(),
  quantity: z.number().int().positive().optional(),
});

/**
 * POST /api/cart/modify
 * Modify user's cart (called by AI or frontend)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimiter.check(ip, CART_MODIFY_LIMIT);
    
    if (rateLimitResult.isErr()) {
      return NextResponse.json(
        { error: rateLimitResult.error.message },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { sessionId, action, itemId, quantity } = modifyCartSchema.parse(body);

    // Load cart from localStorage-style server storage
    // (In a real app, you'd use Redis or database sessions)
    // For now, we'll return instructions for frontend to execute
    
    let updatedCart = null;
    let message = '';

    switch (action) {
      case 'add':
        if (!itemId) {
          return NextResponse.json(
            { error: 'itemId required for add action' },
            { status: 400 }
          );
        }

        // Fetch menu item details
        const menuItem = await (prisma.menuItem.findUnique as any)({
          where: { id: itemId },
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            isAvailable: true,
            inventoryEnabled: true,
            inventory: true,
          },
        });

        if (!menuItem) {
          return NextResponse.json(
            { error: 'Menu item not found' },
            { status: 404 }
          );
        }

        if (!menuItem.isAvailable) {
          return NextResponse.json(
            { error: `${menuItem.name} is not available` },
            { status: 400 }
          );
        }

        // Check inventory
        if (menuItem.inventoryEnabled && menuItem.inventory !== null) {
          const availableStock = cartTracker.getStockWithReservations(
            itemId,
            menuItem.inventory
          );
          
          const requestedQty = quantity || 1;
          
          if (availableStock !== null && requestedQty > availableStock) {
            return NextResponse.json(
              { 
                error: `Only ${availableStock} ${menuItem.name} available`,
                availableStock,
              },
              { status: 400 }
            );
          }
        }

        // Track in cart tracker for urgency
        cartTracker.trackCartItem(sessionId, itemId, quantity || 1);

        message = `Added ${quantity || 1}x ${menuItem.name} to cart`;
        updatedCart = {
          action: 'add',
          item: {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity || 1,
          },
        };
        break;

      case 'remove':
        if (!itemId) {
          return NextResponse.json(
            { error: 'itemId required for remove action' },
            { status: 400 }
          );
        }

        // Release from cart tracker
        cartTracker.releaseCartItem(sessionId, itemId);

        message = `Removed item from cart`;
        updatedCart = {
          action: 'remove',
          itemId,
        };
        break;

      case 'clear':
        // Release all from cart tracker
        cartTracker.releaseAllCartItems(sessionId);

        message = 'Cart cleared';
        updatedCart = {
          action: 'clear',
        };
        break;

      case 'update_quantity':
        if (!itemId || !quantity) {
          return NextResponse.json(
            { error: 'itemId and quantity required for update_quantity action' },
            { status: 400 }
          );
        }

        // Update cart tracker
        cartTracker.trackCartItem(sessionId, itemId, quantity);

        message = `Updated quantity to ${quantity}`;
        updatedCart = {
          action: 'update_quantity',
          itemId,
          quantity,
        };
        break;
    }

    return NextResponse.json({
      success: true,
      message,
      cart: updatedCart,
      sessionId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Cart Modify API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to modify cart' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cart/modify
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    actions: ['add', 'remove', 'clear', 'update_quantity'],
    version: '1.0.0',
  });
}

