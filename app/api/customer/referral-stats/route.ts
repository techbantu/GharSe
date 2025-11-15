/**
 * API ENDPOINT: GET /api/customer/referral-stats
 * 
 * Purpose: Get referral statistics for the customer
 * 
 * Features:
 * - Count of completed referrals
 * - Total rewards earned from referrals
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
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

    const customerId = decoded.customerId;

    logger.info('Fetching referral stats', { customerId });

    // Count completed referrals
    const friendsReferred = await prisma.referral.count({
      where: {
        referrerId: customerId,
        status: 'COMPLETED',
      },
    });

    // Calculate rewards earned (₹50 per completed referral)
    const rewardsEarned = friendsReferred * 50;

    logger.info('Referral stats fetched successfully', { customerId, friendsReferred, rewardsEarned });

    return NextResponse.json({
      success: true,
      data: {
        friendsReferred,
        rewardsEarned,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch referral stats', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch referral stats',
      },
      { status: 500 }
    );
  }
}

