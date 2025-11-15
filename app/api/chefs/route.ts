/**
 * CHEF API - List & Registration
 * 
 * GET /api/chefs - List all active chefs (with filters)
 * POST /api/chefs - Register new chef (if feature flag enabled)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { canRegisterChef, isMultiChefMode } from '@/lib/feature-flags';

// Validation schema for chef registration
const ChefRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z.string().email('Invalid email address'),
  address: z.object({
    street: z.string(),
    city: z.string(),
    area: z.string(),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  }).optional(),
  serviceRadius: z.number().min(1).max(20).optional(),
  cuisineTypes: z.array(z.string()).optional(),
  bio: z.string().max(500).optional(),
  fssaiNumber: z.string().optional(),
  gstNumber: z.string().optional(),
});

/**
 * GET /api/chefs - List all chefs
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if multi-chef mode is enabled
    if (!isMultiChefMode()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Multi-chef mode not enabled',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Filter parameters
    const status = searchParams.get('status') || 'ACTIVE';
    const cuisine = searchParams.get('cuisine');
    const area = searchParams.get('area');
    const minRating = searchParams.get('minRating');
    const isVerified = searchParams.get('verified');
    const isAcceptingOrders = searchParams.get('acceptingOrders');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = {
      status,
    };

    if (isVerified !== null) {
      where.isVerified = isVerified === 'true';
    }

    if (isAcceptingOrders !== null) {
      where.isAcceptingOrders = isAcceptingOrders === 'true';
    }

    // Cuisine filter (JSON string search for SQLite)
    if (cuisine) {
      where.cuisineTypes = {
        contains: cuisine,
      };
    }

    // Area filter (JSON string search for SQLite)
    if (area) {
      where.address = {
        contains: area,
      };
    }

    // Fetch chefs with pagination
    const [chefs, totalCount] = await Promise.all([
      prisma.chef.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          businessName: true,
          slug: true,
          phone: true,
          email: true,
          address: true,
          serviceRadius: true,
          bio: true,
          cuisineTypes: true,
          logo: true,
          coverImage: true,
          status: true,
          isVerified: true,
          isAcceptingOrders: true,
          minOrderAmount: true,
          commissionRate: true,
          onboardedAt: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              menuItems: true,
            },
          },
        },
      }),
      prisma.chef.count({ where }),
    ]);

    // Transform chefs to include parsed JSON fields
    const transformedChefs = chefs.map((chef) => ({
      ...chef,
      address: chef.address ? JSON.parse(chef.address) : null,
      cuisineTypes: chef.cuisineTypes ? JSON.parse(chef.cuisineTypes) : [],
      stats: {
        totalOrders: chef._count.orders,
        totalMenuItems: chef._count.menuItems,
      },
    }));

    const duration = Date.now() - startTime;

    logger.info('Chefs list fetched', {
      count: chefs.length,
      page,
      totalCount,
      filters: { status, cuisine, area, isVerified },
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedChefs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch chefs list', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chefs',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chefs - Register new chef
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if chef registration is enabled
    if (!canRegisterChef()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chef registration is currently closed',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = ChefRegistrationSchema.safeParse(body);

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

    // Check for duplicate phone or email
    const existingChef = await prisma.chef.findFirst({
      where: {
        OR: [{ phone: data.phone }, { email: data.email }],
      },
    });

    if (existingChef) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chef with this phone or email already exists',
        },
        { status: 409 }
      );
    }

    // Generate unique slug from business name
    const baseSlug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.chef.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create chef with PENDING status (requires admin approval)
    const chef = await prisma.chef.create({
      data: {
        name: data.name,
        businessName: data.businessName,
        slug,
        phone: data.phone,
        email: data.email,
        address: data.address ? JSON.stringify(data.address) : null,
        serviceRadius: data.serviceRadius || 3,
        cuisineTypes: data.cuisineTypes ? JSON.stringify(data.cuisineTypes) : null,
        bio: data.bio,
        fssaiNumber: data.fssaiNumber,
        gstNumber: data.gstNumber,
        status: 'PENDING', // Awaiting approval
        isVerified: false,
        isAcceptingOrders: false, // Can't accept orders until approved
      },
    });

    const duration = Date.now() - startTime;

    logger.info('New chef registered', {
      chefId: chef.id,
      businessName: chef.businessName,
      slug: chef.slug,
      duration,
    });

    // TODO: Send notification to admin about new chef registration
    // TODO: Send welcome email to chef

    return NextResponse.json({
      success: true,
      data: {
        id: chef.id,
        businessName: chef.businessName,
        slug: chef.slug,
        status: chef.status,
      },
      message: 'Registration successful! Your application is under review.',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Chef registration failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
      },
      { status: 500 }
    );
  }
}

