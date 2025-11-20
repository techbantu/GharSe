import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    console.log(`[Menu API] Updating item ${id}:`, body.name);

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        category: body.category,
        image: body.image,
        isVegetarian: body.isVegetarian,
        isVegan: body.isVegan,
        isGlutenFree: body.isGlutenFree,
        spicyLevel: parseInt(body.spicyLevel),
        preparationTime: parseInt(body.preparationTime),
        isAvailable: body.isAvailable,
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });

  } catch (error) {
    console.error('[Menu API] Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
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
