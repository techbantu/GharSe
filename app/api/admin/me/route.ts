/**
 * Admin Profile API
 * 
 * Purpose: Get current admin user information from JWT token
 * 
 * Features:
 * - Verifies admin JWT token from httpOnly cookie (primary) or Authorization header (fallback)
 * - Returns admin profile data
 * - Used for authentication checks on admin pages
 * 
 * Security:
 * - SECURITY FIX: Now reads token from httpOnly cookie first (prevents XSS token theft)
 * - JWT verification with admin-specific secret
 * - Fails fast if ADMIN_JWT_SECRET is not set
 * - Returns 401 if token is invalid or missing
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

/**
 * CRITICAL SECURITY: Admin JWT Secret must be set in environment variables
 * Never use default secrets in production
 */
if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: ADMIN_JWT_SECRET environment variable is not set. ' +
    'This is required for admin authentication.'
  );
}

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

interface AdminTokenPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Extract token from httpOnly cookie first, then fallback to header
    let token: string | null = null;
    
    // 1. Try httpOnly cookie (most secure - can't be stolen via XSS)
    const cookieToken = request.cookies.get('admin_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
    
    // 2. Fallback to Authorization header (for backward compatibility)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.warn('[Admin Me API] Using Authorization header - consider migrating to httpOnly cookies');
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: AdminTokenPayload;
    try {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
    } catch (err) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
      response.cookies.delete('admin_token');
      return response;
    }

    // Fetch admin from database
    // Type assertion needed for Prisma Accelerate compatibility
    const admin = await (prisma.admin.findUnique as any)({
      where: { id: decoded.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin,
    });

  } catch (error: any) {
    console.error('❌ [Admin Me API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

