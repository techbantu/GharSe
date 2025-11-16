/**
 * API ENDPOINT: GET /api/referral/milestones
 * 
 * Purpose: Get customer's referral milestones and progress
 * 
 * Features:
 * - Next milestone progress (e.g., "3/5 referrals to jackpot")
 * - Past milestones achieved
 * - Gamification motivation
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { getReferralStats } from '@/lib/referral-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const customerId = decoded.userId;

    // Get referral stats
    const stats = await getReferralStats(customerId);

    // Get achieved milestones
    const achievedMilestones = await (prisma.referralMilestone.findMany as any)({
      where: {
        customerId,
        status: 'PAID',
      },
      orderBy: {
        triggeredAt: 'desc',
      },
    });

    logger.info('Milestones retrieved', {
      customerId,
      completedReferrals: stats.completedReferrals,
      nextMilestone: stats.nextMilestone,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        achievedMilestones,
        upcomingMilestones: [
          {
            type: 'FIFTH_REFERRAL',
            requiredCount: 5,
            rewardRange: '₹200-₹500',
            description: 'Mystery jackpot on your 5th referral!',
          },
          {
            type: 'TENTH_REFERRAL',
            requiredCount: 10,
            rewardRange: '₹500-₹1000',
            description: 'Bigger jackpot on your 10th referral!',
          },
          {
            type: 'TWENTIETH_REFERRAL',
            requiredCount: 20,
            rewardRange: '₹1000-₹2000',
            description: 'Mega jackpot on your 20th referral!',
          },
        ],
      },
    });
  } catch (error) {
    logger.error('Failed to get milestones', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve milestones',
      },
      { status: 500 }
    );
  }
}

