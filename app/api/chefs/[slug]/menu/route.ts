/**
 * CHEF MENU API - Menu Item Management
 * 
 * GET /api/chefs/[slug]/menu - Get all menu items for chef
 * POST /api/chefs/[slug]/menu - Add new menu item (chef only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { isMultiChefMode } from '@/lib/feature-flags';

// Validation schema for menu item creation
const MenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(1, 'Price must be greater than 0'),
  originalPrice: z.number().optional(),
  category: z.string(),
  image: z.string().url().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  spicyLevel: z.number().min(0).max(3).optional(),
  preparationTime: z.number().min(5).max(120).optional(),
  calories: z.number().optional(),
  servingSize: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  inventoryEnabled: z.boolean().optional(),
  inventory: z.number().optional(),
});

/**
 * GET /api/chefs/[slug]/menu - Get chef's menu
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();

  try {
    if (!isMultiChefMode()) {
      return NextResponse.json(
        { success: false, error: 'Multi-chef mode not enabled' },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Filters
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('available');
    const isVegetarian = searchParams.get('vegetarian');
    const isVegan = searchParams.get('vegan');

    // Find chef
    const chef = await prisma.chef.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!chef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      chefId: chef.id,
    };

    if (category) where.category = category;
    if (isAvailable !== null) where.isAvailable = isAvailable === 'true';
    if (isVegetarian !== null) where.isVegetarian = isVegetarian === 'true';
    if (isVegan !== null) where.isVegan = isVegan === 'true';

    // Fetch menu items
    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [{ isPopular: 'desc' }, { createdAt: 'desc' }],
    });

    const duration = Date.now() - startTime;

    logger.info('Chef menu fetched', {
      slug,
      chefId: chef.id,
      count: menuItems.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: menuItems,
      count: menuItems.length,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch chef menu', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chefs/[slug]/menu - Add menu item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();

  try {
    if (!isMultiChefMode()) {
      return NextResponse.json(
        { success: false, error: 'Multi-chef mode not enabled' },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const body = await request.json();

    // Validate input
    const validation = MenuItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Find chef
    const chef = await prisma.chef.findUnique({
      where: { slug },
    });

    if (!chef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    // TODO: Add authentication check - only chef owner can add items

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        category: data.category,
        image: data.image,
        isVegetarian: data.isVegetarian || false,
        isVegan: data.isVegan || false,
        isGlutenFree: data.isGlutenFree || false,
        spicyLevel: data.spicyLevel || 0,
        preparationTime: data.preparationTime || 30,
        calories: data.calories,
        servingSize: data.servingSize,
        ingredients: data.ingredients ? JSON.stringify(data.ingredients) : null,
        allergens: data.allergens ? JSON.stringify(data.allergens) : null,
        inventoryEnabled: data.inventoryEnabled || false,
        inventory: data.inventory,
        chefId: chef.id,
      },
    });

    const duration = Date.now() - startTime;

    logger.info('Menu item created', {
      slug,
      chefId: chef.id,
      menuItemId: menuItem.id,
      itemName: menuItem.name,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: menuItem,
      message: 'Menu item added successfully',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to add menu item', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to add menu item' },
      { status: 500 }
    );
  }
}

