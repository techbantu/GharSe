/**
 * GET CURRENT USER API
 * 
 * GET /api/auth/me
 * 
 * Purpose: Get current authenticated user profile
 * 
 * Features:
 * - Validate JWT token
 * - Check session validity
 * - Return user profile data
 * 
 * Security: Token and session validation
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  extractTokenFromHeader,
  extractTokenFromCookie,
  verifyToken,
  validateSession,
} from '@/lib/auth-customer';

/**
 * GET /api/auth/me
 * 
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Extract token from header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    const token = extractTokenFromHeader(authHeader) || extractTokenFromCookie(cookieHeader);
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token provided',
        },
        { status: 401 }
      );
    }
    
    // Verify JWT token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }
    
    // Validate session (check if not revoked)
    const isSessionValid = await validateSession(token);
    
    if (!isSessionValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session expired or revoked',
        },
        { status: 401 }
      );
    }
    
    // Get customer profile from database
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });
    
    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }
    
    // Check if account is active
    if (customer.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is suspended',
        },
        { status: 403 }
      );
    }
    
    const duration = Date.now() - startTime;
    
    logger.debug('User profile retrieved', {
      customerId: customer.id,
      duration,
    });
    
    // Return user profile (exclude sensitive data)
    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          emailVerified: customer.emailVerified,
          phoneVerified: customer.phoneVerified,
          referralCode: customer.referralCode,
          loyaltyPoints: customer.loyaltyPoints,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          addresses: customer.addresses,
          createdAt: customer.createdAt,
          lastOrderAt: customer.lastOrderAt,
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Get current user failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user profile. Please try again.',
      },
      { status: 500 }
    );
  }
}
