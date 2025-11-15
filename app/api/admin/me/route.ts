/**
 * NEW FILE: Admin Profile API
 * 
 * Purpose: Get current admin user information from JWT token
 * 
 * Features:
 * - Verifies admin JWT token
 * - Returns admin profile data
 * - Used for authentication checks on admin pages
 * 
 * Security:
 * - JWT verification with admin-specific secret
 * - Returns 401 if token is invalid or missing
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-change-this-secret-key-in-production';

interface AdminTokenPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: AdminTokenPayload;
    try {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch admin from database
    const admin = await prisma.admin.findUnique({
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

