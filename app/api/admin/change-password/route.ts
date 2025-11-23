import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * POST /api/admin/change-password
 * 
 * Change admin password (requires current password verification)
 * 
 * SECURITY:
 * - Verifies JWT token
 * - Requires current password (prevents token-only attacks)
 * - Uses bcrypt with 12 rounds
 * - Password complexity validation
 * - Timing-safe comparison for current password
 */
export async function POST(request: NextRequest) {
  try {
    // 1. VERIFY ADMIN TOKEN (from httpOnly cookie OR Authorization header)
    let token: string | null = null;
    
    // Try to get token from cookie first (more secure)
    const cookieToken = request.cookies.get('admin_token');
    console.log('🔍 [Change Password] Cookie check:', cookieToken ? 'Found' : 'Not found');
    
    if (cookieToken) {
      token = cookieToken.value;
      console.log('🔍 [Change Password] Token from cookie (first 50 chars):', token.substring(0, 50));
    } else {
      // Fallback to Authorization header
      const authHeader = request.headers.get('Authorization');
      token = extractTokenFromHeader(authHeader);
      console.log('🔍 [Change Password] Token from header:', token ? 'Found' : 'Not found');
    }
    
    if (!token) {
      console.log('❌ [Change Password] No token provided');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    console.log('🔍 [Change Password] Verifying token...');
    const adminData = verifyToken(token);
    
    if (!adminData) {
      console.log('❌ [Change Password] Token verification failed');
      console.log('🔍 [Change Password] JWT_SECRET length:', (process.env.JWT_SECRET || 'change-this-secret-key-in-production').length);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }
    
    console.log('✅ [Change Password] Token verified for admin:', adminData.adminId);

    // 2. PARSE REQUEST BODY
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 3. VALIDATE INPUT
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 12) {
      return NextResponse.json(
        { error: 'New password must be at least 12 characters long' },
        { status: 400 }
      );
    }

    // Password complexity check (at least 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          error: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' 
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // 4. GET ADMIN FROM DATABASE
    const admin = await prisma.admin.findUnique({
      where: { id: adminData.adminId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // 5. VERIFY CURRENT PASSWORD (timing-safe)
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
    );

    if (!isCurrentPasswordValid) {
      // Log failed attempt (optional: implement rate limiting here)
      console.warn(`Failed password change attempt for admin: ${admin.email}`);
      
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // 6. HASH NEW PASSWORD
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 7. UPDATE PASSWORD IN DATABASE
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // 8. LOG SECURITY EVENT
    console.info(`✅ Password changed successfully for admin: ${admin.email}`);

    // 9. SEND SUCCESS EMAIL (optional - implement later)
    // TODO: Send email notification about password change
    // await sendPasswordChangeNotificationEmail(admin.email, admin.name);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

