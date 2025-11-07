/**
 * NEW FILE: Menu API Routes - CRUD Operations
 * 
 * Purpose: Handle all menu item operations (Create, Read, Update, Delete)
 * Database: Prisma + PostgreSQL
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all menu items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');

    const where: any = {};
    
    if (category && category !== 'All') {
      where.category = category;
    }
    
    if (available === 'true') {
      where.isAvailable = true;
    }

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [
        { isPopular: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

// POST - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.description || !body.price || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        category: body.category,
        image: body.image || null,
        imagePublicId: body.imagePublicId || null,
        isVegetarian: body.isVegetarian || false,
        isVegan: body.isVegan || false,
        isGlutenFree: body.isGlutenFree || false,
        spicyLevel: body.spicyLevel || 0,
        preparationTime: body.preparationTime || 30,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        isPopular: body.isPopular || false,
        calories: body.calories || null,
        servingSize: body.servingSize || null,
        ingredients: body.ingredients ? (typeof body.ingredients === 'string' ? body.ingredients : JSON.stringify(body.ingredients)) : null,
        allergens: body.allergens ? (typeof body.allergens === 'string' ? body.allergens : JSON.stringify(body.allergens)) : null,
        // NEW: Inventory fields
        inventoryEnabled: body.inventoryEnabled || false,
        inventory: body.inventoryEnabled ? (body.inventory !== undefined ? parseInt(String(body.inventory)) : null) : null,
        outOfStockMessage: body.inventoryEnabled ? (body.outOfStockMessage || null) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Menu item created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create menu item';
    if (error.code === 'P2002') {
      errorMessage = 'A menu item with this name already exists';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

