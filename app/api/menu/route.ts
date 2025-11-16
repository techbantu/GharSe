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
    // Test database connection first
    try {
      await prisma.$connect();
    } catch (connectError: any) {
      console.error('Database connection failed:', connectError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed. Please check your DATABASE_URL in .env file and ensure the database is running.',
          details: process.env.NODE_ENV === 'development' ? connectError.message : undefined
        },
        { status: 503 }
      );
    }

    // Ensure database is initialized first (this will auto-create tables if needed)
    try {
      const { initializeDatabase } = await import('@/lib/database-init');
      const initResult = await initializeDatabase();
      if (!initResult.success) {
        console.error('Database initialization failed:', initResult.error);
        // Return error if initialization fails - tables won't exist
        return NextResponse.json(
          { 
            success: false, 
            error: `Database setup failed: ${initResult.error}. Please check your DATABASE_URL and ensure the database is accessible.`,
            details: process.env.NODE_ENV === 'development' ? initResult.error : undefined
          },
          { status: 503 }
        );
      }
      console.log('✅ Database initialization check passed');
    } catch (initError: any) {
      console.error('Database initialization error:', initError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: `Database initialization error: ${initError.message}`,
          details: process.env.NODE_ENV === 'development' ? initError.stack : undefined
        },
        { status: 503 }
      );
    }

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

    const items = await (prisma.menuItem.findMany as any)({
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
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    
    // Provide detailed error messages for debugging
    let errorMessage = 'Failed to fetch menu items';
    let statusCode = 500;
    
    // Prisma error codes
    if (error.code === 'P1001') {
      errorMessage = 'Database connection failed. Please check your DATABASE_URL in .env file and ensure the database is running.';
      statusCode = 503;
    } else if (error.code === 'P1003') {
      errorMessage = 'Database table not found. Please run: npm run db:push or npm run setup';
      statusCode = 500;
    } else if (error.code === 'P2025') {
      errorMessage = 'Database table not found. Please run database initialization.';
      statusCode = 500;
    } else if (error.code === 'P2002') {
      errorMessage = 'Database constraint violation. Please check your data.';
      statusCode = 400;
    } else if (error.message?.includes('Can\'t reach database server')) {
      errorMessage = 'Cannot reach database server. Please check your DATABASE_URL and network connection.';
      statusCode = 503;
    } else if (error.message?.includes('does not exist')) {
      errorMessage = 'Database table does not exist. Please run: npm run db:push';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = `Database error: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          stack: error.stack
        } : undefined
      },
      { status: statusCode }
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

    const item = await (prisma.menuItem.create as any)({
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

