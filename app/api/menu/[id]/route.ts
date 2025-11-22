import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    console.log(`[Menu API] Updating item ${id}:`, JSON.stringify(body, null, 2));

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

    console.log(`[Menu API] Successfully updated item ${id}`);

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
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[Menu API] Deleting item ${id}`);

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });

  } catch (error) {
    console.error('[Menu API] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
