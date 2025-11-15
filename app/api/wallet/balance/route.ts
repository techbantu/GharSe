/**
 * API ENDPOINT: GET /api/wallet/balance
 * 
 * Purpose: Get customer wallet balance
 * 
 * Features:
 * - Available balance (ready to spend)
 * - Pending balance (24hr hold)
 * - Total earned/spent lifetime stats
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { getWalletBalance } from '@/lib/wallet-manager';
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

    /**
     * CRITICAL FIX: JWT token contains 'customerId' not 'userId'
     * This was causing authentication bypass and accessing wrong wallet data
     * See AuthTokenPayload interface in lib/auth-customer.ts for correct field names
     */
    const customerId = decoded.customerId;

    // Get wallet balance
    const balance = await getWalletBalance(customerId);

    logger.info('Wallet balance retrieved', { customerId });

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logger.error('Failed to get wallet balance', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve wallet balance',
      },
      { status: 500 }
    );
  }
}

