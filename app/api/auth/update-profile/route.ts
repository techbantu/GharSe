/**
 * UPDATE PROFILE API
 * 
 * PUT /api/auth/update-profile
 * 
 * Purpose: Allow authenticated customers to update their profile information
 * 
 * Features:
 * - Update name, email, phone
 * - Re-verify email if changed
 * - JWT authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { extractTokenFromHeader, extractTokenFromCookie, verifyToken } from '@/lib/auth-customer';
import { generateEmailVerificationToken, sendVerificationEmail } from '@/lib/email-verification';

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Invalid phone number'),
});

export async function PUT(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get current user
    const currentUser = await prisma.customer.findUnique({
      where: { id: payload.customerId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed
    const emailChanged = currentUser.email !== data.email;

    // Check if new email is already taken
    if (emailChanged) {
      const existingUser = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== payload.customerId) {
        return NextResponse.json(
          { success: false, error: 'Email is already registered' },
          { status: 400 }
        );
      }
    }

    // Check if new phone is already taken
    if (currentUser.phone !== data.phone) {
      const existingUser = await prisma.customer.findUnique({
        where: { phone: data.phone },
      });

      if (existingUser && existingUser.id !== payload.customerId) {
        return NextResponse.json(
          { success: false, error: 'Phone number is already registered' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.customer.update({
      where: { id: payload.customerId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        // If email changed, mark as unverified and send new verification email
        ...(emailChanged && {
          emailVerified: false,
        }),
      },
    });

    // If email changed, send verification email
    if (emailChanged) {
      const verificationToken = await generateEmailVerificationToken(updatedUser.id, updatedUser.email);
      await sendVerificationEmail(updatedUser.email, updatedUser.name, verificationToken);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      emailChanged,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        emailVerified: updatedUser.emailVerified,
      },
    });

  } catch (error: any) {
    console.error('❌ [Update Profile API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

