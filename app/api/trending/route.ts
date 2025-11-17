/**
 * Trending Items API
 *
 * Returns items with high velocity (rising fast)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { trendingVelocity } from '@/lib/algorithms/trending-velocity';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/trending
 *
 * Query params:
 * - category: Optional category filter
 * - window: Time window in hours (default 6)
 * - limit: Number of results (default 10)
 * - minPercentChange: Minimum percent change to include (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') || undefined;
    const windowHours = parseInt(searchParams.get('window') || '6');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minPercentChange = parseInt(searchParams.get('minPercentChange') || '10');

    let trending;

    if (category) {
      trending = await trendingVelocity.getCategoryTrending(category, limit * 2, windowHours);
    } else {
      trending = await trendingVelocity.getGlobalTrending(limit * 2, windowHours);
    }

    // Filter by minimum percent change
    trending = trending.filter(item => item.percentChange >= minPercentChange);

    // Limit results
    trending = trending.slice(0, limit);

    // Fetch full item details
    const itemIds = trending.map(t => t.itemId);
    const items = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
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
    const results = trending.map(trendItem => {
      const item = itemsMap.get(trendItem.itemId);

      return {
        ...trendItem,
        item: item
          ? {
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
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      trending: results,
      metadata: {
        windowHours,
        totalFound: results.length,
        category: category || 'all',
      },
    });
  } catch (error: any) {
    console.error('Error fetching trending items:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending items',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
