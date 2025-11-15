/**
 * EMAIL VERIFICATION API
 * 
 * POST /api/auth/verify-email
 * 
 * Purpose: Verify customer email address with token
 * 
 * Features:
 * - Token validation with expiry check
 * - Mark email as verified
 * - Remove used token
 * 
 * Security: One-time use tokens, 24-hour expiry
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { verifyEmailToken } from '@/lib/email-verification';

/**
 * Validation schema for email verification
 */
const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * GET /api/auth/verify-email?token=xxx
 * 
 * Verify email with token from URL (for email links)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Extract token from URL query parameter
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification token is required',
        },
        { status: 400 }
      );
    }
    
    // Verify token
    const result = await verifyEmailToken(token);
    
    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Invalid or expired verification token',
        },
        { status: 400 }
      );
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Email verified successfully (GET)', {
      customerId: result.customerId,
      duration,
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        customerId: result.customerId,
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    logger.error('Email verification failed (GET)', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify email. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify-email
 * 
 * Verify email with token (for API calls)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = VerifyEmailSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || 'Invalid verification data',
          field: firstError?.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Verify token
    const result = await verifyEmailToken(data.token);
    
    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Invalid or expired verification token',
        },
        { status: 400 }
      );
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Email verified successfully', {
      customerId: result.customerId,
      duration,
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        customerId: result.customerId,
      },
      { status: 200 }
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Email verification failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Email verification failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
