/**
 * Unified Recommendation API
 *
 * Powers intelligent recommendations across the platform
 * Combines multiple cutting-edge algorithms
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  RecommendationEngine,
  RecommendationContext,
  RecommendationItem,
  BusinessType,
} from '@/lib/algorithms/recommendation-engine';
import { thompsonSampling } from '@/lib/algorithms/thompson-sampling';
import { trendingVelocity } from '@/lib/algorithms/trending-velocity';
import { affinityMining } from '@/lib/algorithms/affinity-mining';
import { collaborativeFiltering } from '@/lib/algorithms/collaborative-filtering';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/recommendations
 *
 * Query params:
 * - customerId: Optional user ID for personalization
 * - sessionId: Required session ID for A/B testing
 * - cartItems: Optional comma-separated item IDs in cart
 * - category: Optional category filter
 * - limit: Number of recommendations (default 10)
 * - businessType: Business type for configuration (default food-delivery)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const customerId = searchParams.get('customerId') || undefined;
    const sessionId = searchParams.get('sessionId') || `session-${Date.now()}`;
    const cartItemsParam = searchParams.get('cartItems');
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const businessType = (searchParams.get('businessType') || 'food-delivery') as BusinessType;

    // Parse cart items
    const cartItems = cartItemsParam ? cartItemsParam.split(',').filter(Boolean) : undefined;

    // Build context
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay =
      hour < 11 ? 'morning' : hour < 16 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

    const context: RecommendationContext = {
      customerId,
      sessionId,
      currentTime: now,
      timeOfDay,
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      cartItems,
      deviceType: 'mobile', // Could detect from user agent
    };

    // Get available menu items
    const whereClause: any = {
      isAvailable: true,
    };

    if (category) {
      whereClause.category = category;
    }

    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        chef: {
          select: {
            businessName: true,
            rating: true,
          },
        },
      },
      take: 500, // Limit for performance
    });

    // Transform to RecommendationItem format
    const items: RecommendationItem[] = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      rating: item.rating || undefined,
      ratingCount: item.ratingCount || undefined,
      tags: (item.tags as string[]) || undefined,
      preparationTime: item.preparationTime || undefined,
      popularity: item.popularity || undefined,
      metadata: {
        chefName: item.chef.businessName,
        chefRating: item.chef.rating,
        imageUrl: item.imageUrl,
      },
    }));

    // Initialize recommendation engine
    const engine = new RecommendationEngine(businessType);

    // Get recommendations
    const recommendations = await engine.recommend(items, context, limit);

    // Record impressions for Thompson Sampling
    for (const rec of recommendations) {
      thompsonSampling.recordImpression(rec.itemId).catch(console.error);
    }

    // Fetch full item details for response
    const itemIds = recommendations.map(r => r.itemId);
    const fullItems = await prisma.menuItem.findMany({
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

    const itemsMap = new Map(fullItems.map(item => [item.id, item]));

    // Build response
    const results = recommendations.map(rec => {
      const item = itemsMap.get(rec.itemId);

      return {
        ...rec,
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
      recommendations: results,
      metadata: {
        totalCandidates: items.length,
        returnedCount: results.length,
        context: {
          timeOfDay,
          hasUser: !!customerId,
          hasCart: !!cartItems && cartItems.length > 0,
          businessType,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations/feedback
 *
 * Record user interactions for learning
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, action, sessionId, customerId } = body;

    if (!itemId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record based on action type
    switch (action) {
      case 'view':
        await thompsonSampling.recordImpression(itemId);
        break;

      case 'add_to_cart':
      case 'order':
        await thompsonSampling.recordConversion(itemId);
        break;

      case 'remove_from_cart':
      case 'dismiss':
        // Could track negative feedback
        break;
    }

    // Record analytics event
    await prisma.analytics.create({
      data: {
        eventType: `recommendation_${action}`,
        eventData: { itemId, sessionId, customerId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record feedback',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
