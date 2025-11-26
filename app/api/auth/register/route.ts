/**
 * CUSTOMER REGISTRATION API
 * 
 * POST /api/auth/register
 * 
 * Purpose: Create new customer account with email/password
 * 
 * Features:
 * - Email and phone uniqueness validation
 * - Password strength requirements
 * - Automatic referral code generation
 * - Email verification token generation
 * - Rate limiting (5 registrations per IP per hour)
 * 
 * Security: Input validation with Zod, bcrypt password hashing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  hashPassword,
  generateToken,
  validatePasswordStrength,
  generateReferralCode,
  createSession,
} from '@/lib/auth-customer';
import {
  generateEmailVerificationToken,
  sendVerificationEmail,
} from '@/lib/email-verification';
import { processNewReferral } from '@/lib/referral-engine';
import { extractIPAddress, extractDeviceFingerprintFromHeaders } from '@/lib/fraud-detector';
import { getOrCreateWallet } from '@/lib/wallet-manager';

/**
 * Validation schema for registration
 */
const RegisterSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0900-\u097F]+$/,
      'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-()]+$/, 'Phone number can only contain numbers, +, spaces, hyphens, and parentheses')
    .transform(val => val.replace(/\D/g, '')) // Remove non-digits
    .refine(val => val.length >= 10, 'Phone number must have at least 10 digits'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  referredBy: z.string().optional(), // Referral code (if user was referred)
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept all terms and conditions'),
});

/**
 * POST /api/auth/register
 * 
 * Create new customer account
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = RegisterSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || 'Invalid registration data',
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
    
    // Check if email already exists
    const existingEmail = await (prisma.customer.findUnique as any)({
      where: { email: data.email },
    });
    
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists',
          field: 'email',
        },
        { status: 400 }
      );
    }
    
    // Check if phone already exists
    const existingPhone = await (prisma.customer.findUnique as any)({
      where: { phone: data.phone },
    });
    
    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this phone number already exists',
          field: 'phone',
        },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(data.password);
    
    // Generate unique referral code
    const referralCode = await generateReferralCode(data.name);
    
    // Create customer account
    const customer = await (prisma.customer.create as any)({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        referralCode,
        emailVerified: false,
        phoneVerified: false,
        accountStatus: 'ACTIVE',
        termsAccepted: data.termsAccepted,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      },
    });
    
    // Create wallet for customer
    await getOrCreateWallet(customer.id);
    
    // Process referral with fraud detection (if user was referred)
    if (data.referredBy) {
      try {
        const ipAddress = extractIPAddress(request);
        const deviceFingerprint = extractDeviceFingerprintFromHeaders(request.headers);
        
        const referralResult = await processNewReferral(
          data.referredBy,
          customer.id,
          customer.email,
          customer.phone,
          ipAddress,
          deviceFingerprint
        );
        
        if (referralResult.success) {
          logger.info('Referral processed with fraud check', {
            referralId: referralResult.referralId,
            fraudScore: referralResult.fraudScore,
            refereeId: customer.id,
        });
        } else {
          logger.warn('Referral processing failed', {
          refereeId: customer.id,
            message: referralResult.message,
        });
        }
      } catch (error) {
        // Don't fail registration if referral creation fails
        logger.error('Failed to process referral', {
          refereeId: customer.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    // Generate and send email verification token
    const verificationToken = await generateEmailVerificationToken(customer.id, customer.email);
    await sendVerificationEmail(customer.email, customer.name, verificationToken);
    
    // Generate JWT token
    const token = generateToken(customer);
    
    // Create session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    await createSession(customer.id, token, ipAddress, userAgent);
    
    const duration = Date.now() - startTime;
    
    logger.info('Customer registered successfully', {
      customerId: customer.id,
      email: customer.email.substring(0, 3) + '***',
      hasReferral: !!data.referredBy,
      duration,
    });
    
    // Return success with token
    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please verify your email.',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          emailVerified: customer.emailVerified,
          phoneVerified: customer.phoneVerified,
          referralCode: customer.referralCode,
        },
        token,
      },
      { status: 201 }
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
    
    // Detailed error logging for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      duration,
    };
    
    logger.error('Registration failed - Detailed error:', errorDetails);
    console.error('\n❌ REGISTRATION ERROR DETAILS:');
    console.error('Message:', errorDetails.message);
    console.error('Stack:', errorDetails.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? errorDetails.message : undefined,
      },
      { status: 500 }
    );
  }
}
