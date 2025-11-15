/**
 * CUSTOMER LOGIN API
 * 
 * POST /api/auth/login
 * 
 * Purpose: Authenticate customer with email/password
 * 
 * Features:
 * - Email/password authentication
 * - Login attempt tracking (lock after 5 failures)
 * - JWT token generation
 * - Session creation
 * - Rate limiting (10 login attempts per IP per 15 minutes)
 * 
 * Security: bcrypt verification, account locking, session tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  verifyPassword,
  generateToken,
  createSession,
  incrementLoginAttempts,
  resetLoginAttempts,
} from '@/lib/auth-customer';

/**
 * Validation schema for login
 */
const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * 
 * Authenticate customer
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = LoginSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || 'Invalid login data',
          field: firstError?.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email: data.email },
    });
    
    if (!customer) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    // Check if account is locked (too many failed attempts)
    if (customer.loginAttempts >= 5) {
      logger.warn('Login attempt on locked account', {
        customerId: customer.id,
        email: data.email.substring(0, 3) + '***',
        attempts: customer.loginAttempts,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Account locked due to too many failed login attempts. Please reset your password.',
        },
        { status: 403 }
      );
    }
    
    // Check if account is suspended
    if (customer.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is suspended. Please contact support.',
        },
        { status: 403 }
      );
    }
    
    // Verify password
    if (!customer.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    const isPasswordValid = await verifyPassword(data.password, customer.passwordHash);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await incrementLoginAttempts(customer.id);
      
      logger.warn('Failed login attempt', {
        customerId: customer.id,
        email: data.email.substring(0, 3) + '***',
        attempts: customer.loginAttempts + 1,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    // Successful login - reset login attempts
    await resetLoginAttempts(customer.id);
    
    // Update last login info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastLoginIP: ipAddress,
      },
    });
    
    // Generate JWT token
    const token = generateToken(customer);
    
    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    await createSession(customer.id, token, ipAddress, userAgent);
    
    const duration = Date.now() - startTime;
    
    logger.info('Customer logged in successfully', {
      customerId: customer.id,
      email: customer.email.substring(0, 3) + '***',
      duration,
    });
    
    // Return success with token
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          emailVerified: customer.emailVerified,
          phoneVerified: customer.phoneVerified,
          referralCode: customer.referralCode,
          loyaltyPoints: customer.loyaltyPoints,
        },
        token,
      },
      { status: 200 }
    );
    
    // Set httpOnly cookie for token
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Login failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
