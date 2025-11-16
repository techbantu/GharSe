/**
 * API ENDPOINT: GET /api/referral/history
 * 
 * Purpose: Get customer's referral history
 * 
 * Features:
 * - All referrals (completed and pending)
 * - Friend names and status
 * - Reward tracking
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { getReferralHistory } from '@/lib/referral-engine';
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

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Get referral history
    const history = await getReferralHistory(customerId, limit);

    logger.info('Referral history retrieved', {
      customerId,
      count: history.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        referrals: history,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get referral history', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve referral history',
      },
      { status: 500 }
    );
  }
}

