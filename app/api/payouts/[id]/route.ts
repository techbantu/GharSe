/**
 * PAYOUT MANAGEMENT API - Individual Payout Operations
 * 
 * GET /api/payouts/[id] - Get payout details
 * PATCH /api/payouts/[id] - Update payout status (mark as paid)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { processPayout } from '@/lib/commission-calculator';

const UpdatePayoutSchema = z.object({
  status: z.enum(['PROCESSING', 'PAID', 'FAILED']),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
});

/**
 * GET /api/payouts/[id] - Get payout details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        chef: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payout not found',
        },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;

    logger.info('Payout details fetched', {
      payoutId: id,
      chefId: payout.chefId,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: payout,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch payout details', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payout',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payouts/[id] - Update payout status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = UpdatePayoutSchema.safeParse(body);

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

    const { status, paymentMethod, transactionId } = validation.data;

    // TODO: Add admin authentication check

    // Check if payout exists
    const payout = await prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payout not found',
        },
        { status: 404 }
      );
    }

    // Update payout
    if (status === 'PAID' && paymentMethod && transactionId) {
      await processPayout(id, paymentMethod, transactionId);
    } else {
      await prisma.payout.update({
        where: { id },
        data: {
          status,
          ...(status === 'FAILED' && { paidAt: null }),
        },
      });
    }

    const duration = Date.now() - startTime;

    logger.info('Payout status updated', {
      payoutId: id,
      newStatus: status,
      paymentMethod,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Payout updated successfully',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to update payout', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payout',
      },
      { status: 500 }
    );
  }
}

