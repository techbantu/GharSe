import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * PUT /api/admin/profile
 * Updates the authenticated admin's profile information
 * Requires: JWT token in cookie
 * Body: { name?: string, email?: string, phone?: string }
 */
export async function PUT(request: Request) {
  try {
    // Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Verify and decode the JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const adminId = decoded.adminId;
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const { name, email, phone } = body;

    // Build the update object (only include provided fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // If email is being updated, check if it's already in use by another admin
    if (email) {
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          email,
          id: { not: adminId }
        }
      });

      if (existingAdmin) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another admin' },
          { status: 400 }
        );
      }
    }

    // Update the admin profile in the database
    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    console.log('✅ Admin profile updated successfully:', {
      adminId,
      updatedFields: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      admin: updatedAdmin
    });

  } catch (error: any) {
    console.error('❌ Error updating admin profile:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/profile
 * Fetches the authenticated admin's profile information
 * Requires: JWT token in cookie
 */
export async function GET(request: Request) {
  try {
    // Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Verify and decode the JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const adminId = decoded.adminId;
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Fetch the admin profile from the database
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin
    });

  } catch (error: any) {
    console.error('❌ Error fetching admin profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
