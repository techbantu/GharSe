/**
 * RESEND VERIFICATION EMAIL API
 * 
 * POST /api/auth/resend-verification
 * 
 * Purpose: Resend email verification link to customer
 * 
 * Features:
 * - Generate new verification token
 * - Send verification email
 * - JWT authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractTokenFromHeader, extractTokenFromCookie, verifyToken } from '@/lib/auth-customer';
import { generateEmailVerificationToken, sendVerificationEmail } from '@/lib/email-verification';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get token from header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    const token = extractTokenFromHeader(authHeader) || extractTokenFromCookie(cookieHeader);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user
    const user = await (prisma.customer.findUnique as any)({
      where: { id: payload.customerId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = await generateEmailVerificationToken(user.id, user.email);
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);
    
    if (!emailSent) {
      logger.error('Failed to send verification email', {
        customerId: user.id,
        email: user.email.substring(0, 3) + '***',
      });
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    logger.info('Verification email resent successfully', {
      customerId: user.id,
      email: user.email.substring(0, 3) + '***' + user.email.substring(user.email.indexOf('@')),
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });

  } catch (error: any) {
    logger.error('Resend verification email failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error 
      ? error.message.includes('token') 
        ? 'Failed to generate verification token. Please try again.'
        : error.message.includes('email')
        ? 'Failed to send verification email. Please check your email configuration.'
        : 'Internal server error. Please try again later.'
      : 'Internal server error. Please try again later.';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

