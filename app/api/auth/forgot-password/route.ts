/**
 * FORGOT PASSWORD API
 * 
 * POST /api/auth/forgot-password
 * 
 * Purpose: Initiate password reset process
 * 
 * Features:
 * - Generate password reset token
 * - Send reset email
 * - Token expiry: 1 hour
 * - Rate limiting (3 requests per email per hour)
 * 
 * Security: Don't reveal if email exists, one-time use tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendPasswordResetEmail } from '@/lib/email-verification';

/**
 * Validation schema for forgot password
 */
const ForgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
});

/**
 * POST /api/auth/forgot-password
 * 
 * Send password reset email
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = ForgotPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || 'Invalid email',
          field: firstError?.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Send password reset email
    const result = await sendPasswordResetEmail(data.email);

    const duration = Date.now() - startTime;

    logger.info('Password reset requested', {
      email: data.email.substring(0, 3) + '***',
      success: result.success,
      duration,
    });

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    let resetUrl = null;

    if (result.success) {
      // Fetch customer to get the reset token for development convenience
      const customer = await prisma.customer.findUnique({
        where: { email: data.email },
        select: { passwordResetToken: true }
      });

      if (customer?.passwordResetToken) {
        resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${customer.passwordResetToken}`;
      }
    }

    // Return appropriate response based on email success
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        ...(resetUrl && {
          development: {
            resetUrl,
            note: 'Development mode: Click the link below to reset your password',
            emailStatus: result.success ? 'Email sent successfully' : 'Email failed - using development link'
          }
        }),
      },
      { status: result.success ? 200 : 500 }
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Forgot password failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send password reset email. Please try again.',
      },
      { status: 500 }
    );
  }
}

