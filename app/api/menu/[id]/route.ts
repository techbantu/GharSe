/**
 * NEW FILE: Menu Item API Routes - Individual Item Operations
 * 
 * Purpose: Handle operations on specific menu items (Get, Update, Delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch single menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await (prisma.menuItem.findUnique as any)({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

// PUT - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.description || !body.price || isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields or invalid price' },
        { status: 400 }
      );
    }

    const item = await (prisma.menuItem.update as any)({
      where: { id },
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
        inventoryEnabled: body.inventoryEnabled !== undefined ? body.inventoryEnabled : false,
        inventory: body.inventoryEnabled ? (body.inventory !== undefined ? parseInt(String(body.inventory)) : null) : null,
        outOfStockMessage: body.inventoryEnabled ? (body.outOfStockMessage || null) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Menu item updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to update menu item';
    if (error.code === 'P2025') {
      errorMessage = 'Menu item not found';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if item exists
    const item = await (prisma.menuItem.findUnique as any)({
      where: { id },
      include: {
        orderItems: {
          take: 1, // Just check if any exist
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Check if item has been ordered (has order history)
    if (item.orderItems && item.orderItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete menu item with order history',
          suggestion: 'Instead of deleting, try marking this item as "Not Available" to remove it from the menu while preserving order records. You can do this by editing the item and unchecking "Available on Menu".',
          hasOrders: true,
        },
        { status: 400 }
      );
    }

    // Safe to delete - no order history
    await (prisma.menuItem.delete as any)({
      where: { id },
    });

    // TODO: Delete image from cloud storage (Cloudinary/S3)
    // if (item.imagePublicId) {
    //   await cloudinary.uploader.destroy(item.imagePublicId);
    // }

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    
    // Handle foreign key constraint errors gracefully
    if (error.code === 'P2003' || error.message?.includes('foreign key constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete menu item with order history',
          suggestion: 'Instead of deleting, try marking this item as "Not Available" to remove it from the menu while preserving order records.',
          hasOrders: true,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}

