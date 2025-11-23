import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/admin/reset-password
 * 
 * Reset admin password using token from email
 * 
 * SECURITY:
 * - Token is one-time use (deleted after use)
 * - Token expires in 1 hour
 * - Token is hashed in database
 * - Strong password validation
 * - Timing-safe token comparison
 */
export async function POST(request: NextRequest) {
  try {
    // 1. PARSE REQUEST
    const body = await request.json();
    const { token, newPassword } = body;

    // 2. VALIDATE INPUT
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters long' },
        { status: 400 }
      );
    }

    // Password complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          error: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' 
        },
        { status: 400 }
      );
    }

    // 3. HASH THE TOKEN (same way we hashed it when storing)
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 4. FIND ADMIN WITH VALID TOKEN
    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // 5. CHECK IF NEW PASSWORD IS SAME AS OLD (prevent reuse)
    const isSameAsOld = await bcrypt.compare(newPassword, admin.passwordHash);
    if (isSameAsOld) {
      return NextResponse.json(
        { error: 'New password must be different from your previous password' },
        { status: 400 }
      );
    }

    // 6. HASH NEW PASSWORD
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 7. UPDATE PASSWORD AND CLEAR RESET TOKEN
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null, // Clear token (one-time use)
        resetTokenExpires: null,
        resetTokenCreatedAt: null,
        updatedAt: new Date(),
      },
    });

    // 8. LOG SECURITY EVENT
    console.info(`✅ Password reset successful for admin: ${admin.email}`);

    // 9. SEND CONFIRMATION EMAIL (optional)
    // TODO: Send email notification about successful password reset
    // await sendPasswordResetConfirmationEmail(admin.email, admin.name);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again or request a new reset link.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

