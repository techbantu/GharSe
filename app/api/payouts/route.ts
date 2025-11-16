/**
 * PAYOUT API - Manage Chef Payouts
 * 
 * GET /api/payouts - List payouts (admin/chef)
 * POST /api/payouts - Generate payout for period (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { generatePayout, generateAllPayouts } from '@/lib/commission-calculator';

const GeneratePayoutSchema = z.object({
  chefId: z.string().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in format YYYY-MM'),
  generateAll: z.boolean().optional(),
});

/**
 * GET /api/payouts - List payouts
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Filters
    const chefId = searchParams.get('chefId');
    const status = searchParams.get('status');
    const period = searchParams.get('period');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (chefId) where.chefId = chefId;
    if (status) where.status = status.toUpperCase();
    if (period) where.period = period;

    // Fetch payouts
    const [payouts, totalCount] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          chef: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              email: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    const duration = Date.now() - startTime;

    logger.info('Payouts list fetched', {
      count: payouts.length,
      page,
      totalCount,
      filters: { chefId, status, period },
      duration,
    });

    return NextResponse.json({
      success: true,
      data: payouts,
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

    logger.error('Failed to fetch payouts', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payouts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payouts - Generate payout
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validate input
    const validation = GeneratePayoutSchema.safeParse(body);

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

    const { chefId, period, generateAll } = validation.data;

    // TODO: Add admin authentication check

    let payouts;

    if (generateAll) {
      // Generate payouts for all chefs
      payouts = await generateAllPayouts(period);

      const duration = Date.now() - startTime;

      logger.info('Bulk payouts generated', {
        period,
        count: payouts.length,
        totalAmount: payouts.reduce((sum: number, p: any) => sum + p.netEarnings, 0),
        duration,
      });

      return NextResponse.json({
        success: true,
        data: payouts,
        message: `Generated ${payouts.length} payouts for period ${period}`,
        duration,
      });
    } else if (chefId) {
      // Generate payout for specific chef
      const payout = await generatePayout(chefId, period);

      if (!payout) {
        return NextResponse.json(
          {
            success: false,
            error: 'No orders found for this period or payout already exists',
          },
          { status: 404 }
        );
      }

      const duration = Date.now() - startTime;

      logger.info('Payout generated', {
        chefId,
        period,
        netEarnings: payout.netEarnings,
        duration,
      });

      return NextResponse.json({
        success: true,
        data: payout,
        message: 'Payout generated successfully',
        duration,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either chefId or generateAll must be provided',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to generate payout', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate payout',
      },
      { status: 500 }
    );
  }
}

