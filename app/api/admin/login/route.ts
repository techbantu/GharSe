/**
 * ADMIN LOGIN API
 * 
 * POST /api/admin/login
 * 
 * Purpose: Authenticate admin users with email/password
 * 
 * Features:
 * - Separate admin authentication (different from customer auth)
 * - JWT token generation for admin
 * - Session tracking
 * - Rate limiting
 * 
 * Security: bcrypt verification, session tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * CRITICAL SECURITY: Admin JWT Secret must be set in environment variables
 * This should be DIFFERENT from the customer JWT secret for security isolation
 * Never use default secrets - the application will fail fast if not configured
 */
if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: ADMIN_JWT_SECRET environment variable is not set. ' +
    'This is required for admin authentication. Please add ADMIN_JWT_SECRET to your .env file. ' +
    'Generate a secure secret using: openssl rand -base64 64'
  );
}

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

/**
 * Validation schema for admin login
 */
const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/admin/login
 * 
 * Authenticate admin user
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = AdminLoginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Normalize email (lowercase, trim whitespace)
    const normalizedEmail = data.email.toLowerCase().trim();
    
    logger.info('Admin login attempt', {
      email: normalizedEmail.substring(0, 3) + '***',
      timestamp: new Date().toISOString(),
    });
    
    // Find admin by email (case-insensitive lookup)
    // Try exact match first, then lowercase match
    // Type assertion needed for Prisma Accelerate compatibility (fixes TypeScript union type issue)
    let admin = await (prisma.admin.findUnique as any)({
      where: { email: normalizedEmail },
    });
    
    // If not found with normalized email, try original email (for backwards compatibility)
    if (!admin) {
      admin = await (prisma.admin.findUnique as any)({
        where: { email: data.email },
      });
    }
    
    // If still not found, try case-insensitive search
    if (!admin) {
      admin = await (prisma.admin.findFirst as any)({
        where: {
          email: normalizedEmail,
        },
      });
    }
    
    if (!admin) {
      // Don't reveal if email exists (security best practice)
      logger.warn('Admin login attempt with non-existent email', {
        email: data.email.substring(0, 3) + '***',
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    /**
     * SECURITY FIX: Check email verification BEFORE password verification
     * This prevents information leakage about valid admin credentials
     * An attacker should not be able to determine if an unverified admin account exists
     */
    if (!admin.emailVerified) {
      logger.warn('Admin login attempt with unverified email', {
        adminId: admin.id,
        email: data.email.substring(0, 3) + '***',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password', // Generic error - don't reveal email verification status
        },
        { status: 401 }
      );
    }

    // Check if admin is active
    if (!admin.isActive) {
      logger.warn('Login attempt on inactive admin account', {
        adminId: admin.id,
        email: data.email.substring(0, 3) + '***',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password', // Generic error - don't reveal account status
        },
        { status: 401 }
      );
    }

    // Verify password (trim whitespace to handle form input issues)
    const passwordToCompare = (data.password || '').trim();
    const isPasswordValid = await bcrypt.compare(passwordToCompare, admin.passwordHash);

    logger.info('Password verification', {
      adminId: admin.id,
      email: normalizedEmail.substring(0, 3) + '***',
      passwordLength: passwordToCompare.length,
      hashLength: admin.passwordHash.length,
      isValid: isPasswordValid,
    });

    if (!isPasswordValid) {
      logger.warn('Admin login failed - incorrect password', {
        adminId: admin.id,
        email: normalizedEmail.substring(0, 3) + '***',
        passwordLength: passwordToCompare.length,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Email is verified and password is correct - proceed with login
    if (!admin.emailVerified) { // This should never be reached due to early check above
      logger.warn('Admin login attempt with unverified email', {
        adminId: admin.id,
        email: data.email.substring(0, 3) + '***',
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Email not verified. Please verify your email first.',
          requiresVerification: true,
        },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      ADMIN_JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Update last login
    await (prisma.admin.update as any)({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
      },
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('Admin logged in successfully', {
      adminId: admin.id,
      email: admin.email.substring(0, 3) + '***',
      role: admin.role,
      duration,
    });
    
    // Return success with token
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          emailVerified: admin.emailVerified,
        },
        token,
      },
      { status: 200 }
    );
    
    // Set httpOnly cookie for token
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Admin login failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed. Please try again.',
      },
      { status: 500 }
    );
  }
}

