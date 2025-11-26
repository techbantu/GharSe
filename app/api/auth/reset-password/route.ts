/**
 * RESET PASSWORD API
 * 
 * POST /api/auth/reset-password
 * 
 * Purpose: Complete password reset with token
 * 
 * Features:
 * - Verify reset token
 * - Update password with new hash
 * - Remove used token
 * - Reset login attempts
 * 
 * Security: One-time use tokens, password strength validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { hashPassword, validatePasswordStrength } from '@/lib/auth-customer';
import { verifyPasswordResetToken } from '@/lib/email-verification';

/**
 * Validation schema for password reset
 */
const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * POST /api/auth/reset-password
 * 
 * Reset password with token
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = ResetPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || 'Invalid reset data',
          field: firstError?.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.message,
          field: 'password',
        },
        { status: 400 }
      );
    }
    
    // Verify token
    const tokenResult = await verifyPasswordResetToken(data.token);
    
    if (!tokenResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: tokenResult.message || 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }
    
    // Hash new password
    const passwordHash = await hashPassword(data.password);
    
    // Update password and remove token
    await (prisma.customer.update as any)({
      where: { id: tokenResult.customerId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0, // Reset login attempts
      },
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('Password reset successfully', {
      customerId: tokenResult.customerId,
      duration,
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      },
      { status: 200 }
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Password reset failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Password reset failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
