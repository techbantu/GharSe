/**
 * API ENDPOINT: GET /api/wallet/transactions
 * 
 * Purpose: Get customer wallet transaction history
 * 
 * Features:
 * - All credits and debits
 * - Source tracking (referrals, jackpots, orders)
 * - Pagination support
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { getWalletTransactions } from '@/lib/wallet-manager';
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
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get transactions
    const transactions = await getWalletTransactions(customerId, limit, offset);

    logger.info('Wallet transactions retrieved', {
      customerId,
      count: transactions.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error('Failed to get wallet transactions', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve transaction history',
      },
      { status: 500 }
    );
  }
}

