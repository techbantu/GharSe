/**
 * NEW FILE: Menu Items API - Fetch real menu data from database
 * 
 * Purpose: Replace hardcoded menu data with live database queries
 * Used by: Frequently Added items, menu search, cart suggestions
 *
 * Features:
 * - Fetch available menu items by category/chef
 * - Filter by current order items to avoid duplicates
 * - Smart pairing suggestions based on order content
 * - Support for multiple chefs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { menuItems as fallbackMenuItems } from '@/data/menuData';

/**
 * GET /api/menu - Fetch menu items with smart filtering
 *
 * Query params:
 * - excludeIds: comma-separated menu item IDs to exclude
 * - category: filter by category
 * - chefId: filter by specific chef (null for restaurant default)
 * - limit: max items to return (default 20)
 * - suggestions: if true, returns smart pairing suggestions
 * - currentOrder: JSON array of current order menuItemIds for smart suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeIds = searchParams.get('excludeIds')?.split(',').filter(Boolean) || [];
    const category = searchParams.get('category');
    const chefId = searchParams.get('chefId'); // null for restaurant default
    const limit = parseInt(searchParams.get('limit') || '100'); // Increased default limit
    const suggestions = searchParams.get('suggestions') === 'true';
    const currentOrder = searchParams.get('currentOrder');
    
    // IMPORTANT: Admin dashboard needs ALL items (including unavailable)
    // Customer-facing pages will filter unavailable items on the frontend
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true';

    let currentOrderIds: string[] = [];
    if (currentOrder) {
      try {
        currentOrderIds = JSON.parse(currentOrder);
      } catch (error) {
        console.warn('Invalid currentOrder JSON:', currentOrder);
      }
    }

    // Build where clause
    // NOTE: We now include ALL items by default. The isAvailable field is used
    // to show "Out of Stock" on customer menu, NOT to hide items.
    const where: any = {};
    
    // Only filter by availability if NOT including unavailable items
    // This is for cart/checkout flows where we need only available items
    if (!includeUnavailable && searchParams.get('availableOnly') === 'true') {
      where.isAvailable = true;
    }

    // Exclude specified IDs
    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    // Filter by category if specified
    if (category && category !== 'All') {
      where.category = category;
    }
    
    // Filter by chef (null = restaurant default menu)
    if (chefId === 'restaurant') {
      where.chefId = null;
    } else if (chefId) {
      where.chefId = chefId;
    }

    let items: any[];

    if (suggestions && currentOrderIds.length > 0) {
      // Smart suggestions based on current order
      items = await getSmartSuggestions(currentOrderIds, excludeIds, limit);
    } else {
      // Regular menu fetch
      items = await prisma.menuItem.findMany({
      where,
      orderBy: [
        { isPopular: 'desc' },
          { category: 'asc' },
          { name: 'asc' },
        ],
        take: limit,
        include: {
          chef: {
            select: {
              id: true,
              name: true,
              bio: true,
            },
          },
        },
      });
    }

    // Transform to match frontend MenuItem type
    const transformedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice,
      category: item.category,
      image: item.image,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      isDairyFree: item.isDairyFree,
      spicyLevel: item.spicyLevel,
      preparationTime: item.preparationTime,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      isNew: item.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // New if < 7 days old
      calories: item.calories,
      servingSize: item.servingSize,
      ingredients: item.ingredients ? JSON.parse(item.ingredients) : [],
      allergens: item.allergens ? JSON.parse(item.allergens) : [],
      chef: item.chef,
    }));

    return NextResponse.json({
      success: true,
      items: transformedItems,
      count: transformedItems.length,
      filters: {
        excludeIds,
        category: category || null,
        chefId: chefId || null,
        suggestions,
        currentOrderCount: currentOrderIds.length,
      },
    });

  } catch (error) {
    console.error('Menu API error:', error);
    
    // FALLBACK: Return static menu data when database is unavailable
    // This ensures the app works even when Prisma/Supabase has issues
    console.log('[Menu API] Using fallback menu data due to database error');
    
    const transformedFallback = fallbackMenuItems.map(item => ({
      ...item,
      isNew: false,
      ingredients: [],
      allergens: [],
      chef: null,
    }));
    
    return NextResponse.json({
      success: true,
      items: transformedFallback,
      count: transformedFallback.length,
      filters: {
        excludeIds: [],
        category: null,
        chefId: null,
        suggestions: false,
        currentOrderCount: 0,
      },
      _fallback: true, // Indicate this is fallback data
    });
  }
}

/**
 * Get smart pairing suggestions based on current order
 * Returns items that complement the current order
 */
async function getSmartSuggestions(
  currentOrderIds: string[],
  excludeIds: string[],
  limit: number
): Promise<any[]> {
  try {
    // Get current order items to understand what's being ordered
    const currentItems = await prisma.menuItem.findMany({
      where: {
        id: { in: currentOrderIds },
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        isVegetarian: true,
        isVegan: true,
        spicyLevel: true,
      },
    });

    // Analyze current order
    const hasCurry = currentItems.some(item =>
      item.category.toLowerCase().includes('curry') ||
      item.name.toLowerCase().includes('curry')
    );

    const hasButterChicken = currentItems.some(item =>
      item.name.toLowerCase().includes('butter chicken')
    );

    const hasBiryani = currentItems.some(item =>
      item.name.toLowerCase().includes('biryani')
    );

    const hasRice = currentItems.some(item =>
      item.category.toLowerCase().includes('rice') ||
      item.name.toLowerCase().includes('rice') ||
      item.name.toLowerCase().includes('biryani')
    );

    const isVegetarianOrder = currentItems.every(item => item.isVegetarian);

    // Build suggestion priority list
    const suggestionCriteria = [];

    if (hasCurry || hasButterChicken) {
      // Suggest naan, rice, raita for curries
      suggestionCriteria.push(
        { category: 'Rice & Breads', priority: 10 },
        { nameContains: 'naan', priority: 9 },
        { nameContains: 'rice', priority: 8 },
        { nameContains: 'raita', priority: 7 }
      );
    }

    if (hasBiryani) {
      // Suggest raita, beverages for biryani
      suggestionCriteria.push(
        { nameContains: 'raita', priority: 9 },
        { category: 'Beverages', priority: 8 }
      );
    }

    if (!hasRice && !hasBiryani) {
      // Suggest rice-based sides if no rice in order
      suggestionCriteria.push(
        { category: 'Rice & Breads', priority: 6 }
      );
    }

    // Always suggest beverages and desserts
    suggestionCriteria.push(
      { category: 'Beverages', priority: 4 },
      { category: 'Desserts', priority: 3 }
    );

    // Get items matching criteria
    const allSuggestions: any[] = [];
    const seenIds = new Set([...currentOrderIds, ...excludeIds]);

    for (const criteria of suggestionCriteria) {
      const where: any = {
        isAvailable: true,
        id: { notIn: Array.from(seenIds) },
      };

      if (criteria.category) {
        where.category = criteria.category;
      }

      if (criteria.nameContains) {
        where.name = { contains: criteria.nameContains, mode: 'insensitive' };
      }

      const items = await prisma.menuItem.findMany({
        where,
        orderBy: [
          { isPopular: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 5, // Take more than needed, we'll filter below
        include: {
          chef: {
            select: {
              id: true,
              name: true,
              bio: true,
            },
          },
      },
    });

      // Add priority to items
      items.forEach(item => {
        allSuggestions.push({
          ...item,
          suggestionPriority: criteria.priority,
        });
        seenIds.add(item.id);
      });
    }

    // Sort by priority and popularity, take top items
    const sortedSuggestions = allSuggestions
      .sort((a, b) => {
        // Higher priority first
        if (a.suggestionPriority !== b.suggestionPriority) {
          return b.suggestionPriority - a.suggestionPriority;
        }
        // Then popular items
        if (a.isPopular !== b.isPopular) {
          return a.isPopular ? -1 : 1;
        }
        // Then newer items
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    return sortedSuggestions;

  } catch (error) {
    console.error('Smart suggestions error:', error);
    // Fallback to popular items
    return await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        isPopular: true,
        id: { notIn: excludeIds },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        chef: {
          select: {
            id: true,
            name: true,
            bio: true,
          },
        },
      },
    });
  }
}

/**
 * POST /api/menu - Create a new menu item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Menu API] Creating new menu item:', body.name);
    
    // Create the menu item
    const newItem = await prisma.menuItem.create({
      data: {
        name: body.name,
        description: body.description || '',
        price: parseFloat(body.price) || 0,
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        category: body.category || 'Main Course',
        image: body.image || null,
        isVegetarian: body.isVegetarian || false,
        isVegan: body.isVegan || false,
        isGlutenFree: body.isGlutenFree || false,
        isDairyFree: body.isDairyFree || false,
        spicyLevel: parseInt(body.spicyLevel) || 0,
        preparationTime: parseInt(body.preparationTime) || 30,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        isPopular: body.isPopular || false,
        calories: body.calories ? parseInt(body.calories) : null,
        servingSize: body.servingSize || null,
        ingredients: body.ingredients ? JSON.stringify(body.ingredients) : null,
        allergens: body.allergens ? JSON.stringify(body.allergens) : null,
        chefId: body.chefId || null,
      },
    });

    logger.info('Menu item created', {
      itemId: newItem.id,
      name: newItem.name,
      price: newItem.price,
      category: newItem.category,
    });

    return NextResponse.json({
      success: true,
      message: '🎉 Menu item created successfully!',
      item: newItem,
    });

  } catch (error) {
    console.error('[Menu API] Error creating menu item:', error);
    logger.error('Failed to create menu item', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create menu item',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}