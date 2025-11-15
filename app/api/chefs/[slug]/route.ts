/**
 * CHEF PROFILE API - Individual Chef Management
 * 
 * GET /api/chefs/[slug] - Get chef profile with menu items
 * PATCH /api/chefs/[slug] - Update chef profile (chef/admin only)
 * DELETE /api/chefs/[slug] - Deactivate chef (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { isMultiChefMode } from '@/lib/feature-flags';

// Validation schema for chef profile update
const ChefUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  businessName: z.string().min(2).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    area: z.string(),
    pincode: z.string().regex(/^\d{6}$/),
  }).optional(),
  serviceRadius: z.number().min(1).max(20).optional(),
  bio: z.string().max(500).optional(),
  cuisineTypes: z.array(z.string()).optional(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  isAcceptingOrders: z.boolean().optional(),
  preparationBuffer: z.number().min(0).max(60).optional(),
  minOrderAmount: z.number().min(0).optional(),
  fssaiNumber: z.string().optional(),
  gstNumber: z.string().optional(),
});

/**
 * GET /api/chefs/[slug] - Get chef profile
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

    const chef = await prisma.chef.findUnique({
      where: { slug },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            originalPrice: true,
            category: true,
            image: true,
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: true,
            spicyLevel: true,
            preparationTime: true,
            isPopular: true,
            calories: true,
            inventoryEnabled: true,
            inventory: true,
          },
        },
        _count: {
          select: {
            orders: true,
            menuItems: true,
          },
        },
      },
    });

    if (!chef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    // Get chef analytics summary
    const analytics = await prisma.chefAnalytics.findFirst({
      where: { chefId: chef.id },
      orderBy: { date: 'desc' },
    });

    // Transform response
    const transformedChef = {
      ...chef,
      address: chef.address ? JSON.parse(chef.address) : null,
      cuisineTypes: chef.cuisineTypes ? JSON.parse(chef.cuisineTypes) : [],
      stats: {
        totalOrders: chef._count.orders,
        totalMenuItems: chef._count.menuItems,
        rating: analytics?.rating || null,
        avgOrderValue: analytics?.avgOrderValue || 0,
      },
    };

    const duration = Date.now() - startTime;

    logger.info('Chef profile fetched', {
      slug,
      chefId: chef.id,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedChef,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch chef profile', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch chef profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chefs/[slug] - Update chef profile
 */
export async function PATCH(
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
    const validation = ChefUpdateSchema.safeParse(body);

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

    // Check if chef exists
    const existingChef = await prisma.chef.findUnique({
      where: { slug },
    });

    if (!existingChef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    // TODO: Add authentication check - only chef owner or admin can update

    // Prepare update data
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.businessName) updateData.businessName = data.businessName;
    if (data.phone) updateData.phone = data.phone;
    if (data.email) updateData.email = data.email;
    if (data.address) updateData.address = JSON.stringify(data.address);
    if (data.serviceRadius !== undefined) updateData.serviceRadius = data.serviceRadius;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.cuisineTypes) updateData.cuisineTypes = JSON.stringify(data.cuisineTypes);
    if (data.logo) updateData.logo = data.logo;
    if (data.coverImage) updateData.coverImage = data.coverImage;
    if (data.isAcceptingOrders !== undefined) updateData.isAcceptingOrders = data.isAcceptingOrders;
    if (data.preparationBuffer !== undefined) updateData.preparationBuffer = data.preparationBuffer;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.fssaiNumber) updateData.fssaiNumber = data.fssaiNumber;
    if (data.gstNumber) updateData.gstNumber = data.gstNumber;

    // Update chef
    const updatedChef = await prisma.chef.update({
      where: { slug },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    const duration = Date.now() - startTime;

    logger.info('Chef profile updated', {
      slug,
      chefId: updatedChef.id,
      updatedFields: Object.keys(updateData),
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedChef.id,
        slug: updatedChef.slug,
        businessName: updatedChef.businessName,
      },
      message: 'Profile updated successfully',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to update chef profile', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chefs/[slug] - Deactivate chef (admin only)
 */
export async function DELETE(
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

    // TODO: Add authentication check - only admin can deactivate

    // Check if chef exists
    const chef = await prisma.chef.findUnique({
      where: { slug },
    });

    if (!chef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    // Soft delete: Set status to INACTIVE instead of deleting
    await prisma.chef.update({
      where: { slug },
      data: {
        status: 'INACTIVE',
        isAcceptingOrders: false,
        updatedAt: new Date(),
      },
    });

    const duration = Date.now() - startTime;

    logger.info('Chef deactivated', {
      slug,
      chefId: chef.id,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Chef deactivated successfully',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to deactivate chef', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to deactivate chef' },
      { status: 500 }
    );
  }
}

