import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info(`[Menu API] Fetching item ${id}`);

    const menuItem = await prisma.menuItem.findUnique({ where: { id } });

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item: menuItem });
  } catch (error) {
    logger.error('[Menu API] GET item error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    logger.info(`[Menu API] Updating item ${id}`, { item: body });

    // Validate required fields
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, price, or category' },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || '',
        price: parseFloat(body.price) || 0,
        category: body.category,
        image: body.image || '',
        isVegetarian: Boolean(body.isVegetarian),
        isVegan: Boolean(body.isVegan),
        isGlutenFree: Boolean(body.isGlutenFree),
        isDairyFree: Boolean(body.isDairyFree),
        spicyLevel: parseInt(body.spicyLevel) || 0,
        preparationTime: parseInt(body.preparationTime) || 30,
        isAvailable: Boolean(body.isAvailable),
      },
    });

    logger.info(`[Menu API] Successfully updated item ${id}`);

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });

  } catch (error: any) {
    console.error('[Menu API] Update error:', error);
    console.error('[Menu API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if this is a forced deletion (admin override)
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get('force') === 'true';
    
    logger.info(`[Menu API] Attempting to delete menu item ${id}`, { forceDelete });

    // Check if item exists first
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true,
        description: true,
        image: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Check if item has order history
    const orderCount = await prisma.orderItem.count({
      where: { menuItemId: id },
    });

    // If item has order history and not forced, suggest alternatives
    if (orderCount > 0 && !forceDelete) {
      logger.warn(`[Menu API] Item ${id} has ${orderCount} order references`);
      
      return NextResponse.json(
        {
          success: false,
          error: `This menu item has been ordered ${orderCount} time${orderCount > 1 ? 's' : ''}`,
          hasOrders: true,
          orderCount,
          suggestion: 'You can either mark it as "Not Available" to hide it, or force delete to remove it permanently (order history will be preserved)',
        },
        { status: 409 } // 409 Conflict
      );
    }

    // GENIUS PATTERN: Admin force delete with data preservation
    if (orderCount > 0 && forceDelete) {
      logger.warn(`[Menu API] Force deleting item ${id} with ${orderCount} order references`);
      
      // Preserve order history by storing deleted item details in order items
      // This maintains order totals and history while allowing menu item deletion
      await prisma.orderItem.updateMany({
        where: { 
          menuItemId: id,
          // Only update order items that haven't been marked as deleted yet
          deletedItemName: null,
        },
        data: {
          menuItemId: null, // Remove foreign key reference
          deletedItemName: menuItem.name, // Preserve item name
          deletedItemDescription: menuItem.description, // Preserve description
          deletedItemImage: menuItem.image, // Preserve image
        },
      });

      logger.info(`[Menu API] Preserved ${orderCount} order records with deleted item data`);
    }

    // Now safe to delete the menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    logger.info(`[Menu API] Successfully deleted menu item ${id}`, {
      forceDelete,
      orderCount,
    });

    return NextResponse.json({
      success: true,
      message: orderCount > 0 
        ? `Menu item deleted. ${orderCount} order records preserved with item details.`
        : 'Menu item deleted successfully',
      orderCount,
    });

  } catch (error: any) {
    console.error('[Menu API] Delete error:', error);
    logger.error('[Menu API] Delete error', {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });

    // Handle Prisma-specific errors
    if (error.code === 'P2003') {
      // Foreign key constraint failed (shouldn't happen with our new approach)
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete: Item is still referenced in existing orders',
          hasOrders: true,
          suggestion: 'Use force delete to preserve order history and remove the item',
        },
        { status: 409 }
      );
    }

    if (error.code === 'P2025') {
      // Record not found
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete menu item',
      },
      { status: 500 }
    );
  }
}
