/**
 * LOGOUT API
 * 
 * POST /api/auth/logout
 * 
 * Purpose: Revoke user session and logout
 * 
 * Features:
 * - Revoke session token
 * - Clear authentication cookie
 * - Log logout event
 * 
 * Security: Token validation before revocation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractTokenFromHeader, extractTokenFromCookie, revokeSession } from '@/lib/auth-customer';

/**
 * POST /api/auth/logout
 * 
 * Logout user and revoke session
 */
export async function POST(request: NextRequest) {
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
    
    // Revoke session
    const revoked = await revokeSession(token);
    
    const duration = Date.now() - startTime;
    
    if (revoked) {
      logger.info('User logged out successfully', { duration });
    }
    
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
    
    // Clear authentication cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Logout failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed. Please try again.',
      },
      { status: 500 }
    );
  }
}

