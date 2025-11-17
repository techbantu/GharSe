/**
 * Complete the Meal API
 *
 * Suggests items that go well with current cart using affinity mining
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { affinityMining } from '@/lib/algorithms/affinity-mining';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/complete-meal
 *
 * Query params:
 * - cartItems: Comma-separated item IDs in cart (required)
 * - limit: Number of suggestions (default 5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const cartItemsParam = searchParams.get('cartItems');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!cartItemsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart items required',
        },
        { status: 400 }
      );
    }

    const cartItemIds = cartItemsParam.split(',').filter(Boolean);

    // Get affinity suggestions
    const suggestions = await affinityMining.getCompleteMealSuggestions(cartItemIds);

    // Fetch full item details
    const itemIds = suggestions.map(s => s.itemId);
    const items = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        isAvailable: true,
      },
      include: {
        chef: {
          select: {
            businessName: true,
            rating: true,
          },
        },
      },
    });

    const itemsMap = new Map(items.map(item => [item.id, item]));

    // Build response
    const results = suggestions
      .map(suggestion => {
        const item = itemsMap.get(suggestion.itemId);

        if (!item) return null;

        return {
          score: suggestion.score,
          confidence: suggestion.rules[0]?.confidence || 0,
          lift: suggestion.rules[0]?.lift || 0,
          reason:
            suggestion.rules.length > 0
              ? `${Math.round(suggestion.rules[0].confidence * 100)}% of customers add this`
              : 'Popular combination',
          item: {
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.price,
            imageUrl: item.imageUrl,
            rating: item.rating,
            ratingCount: item.ratingCount,
            preparationTime: item.preparationTime,
            isVegetarian: item.isVegetarian,
            isVegan: item.isVegan,
            spiceLevel: item.spiceLevel,
            chef: {
              businessName: item.chef.businessName,
              rating: item.chef.rating,
            },
          },
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      suggestions: results,
      metadata: {
        cartItemCount: cartItemIds.length,
        suggestionsFound: results.length,
      },
    });
  } catch (error: any) {
    console.error('Error generating meal suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
