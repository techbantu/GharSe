/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Middleware functions for protecting API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, hasRequiredRole, AdminRole } from './auth';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextRequest {
  admin?: {
    id: string;
    email: string;
    role: AdminRole;
  };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Please log in.' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token. Please log in again.' },
      { status: 401 }
    );
  }

  // Verify admin still exists and is active
  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, role: true, isActive: true, emailVerified: true },
  });

  if (!admin || !admin.isActive) {
    return NextResponse.json(
      { success: false, error: 'Account is inactive or does not exist.' },
      { status: 401 }
    );
  }

  if (!admin.emailVerified) {
    return NextResponse.json(
      { success: false, error: 'Email not verified. Please verify your email address.' },
      { status: 403 }
    );
  }

  // Attach admin info to request (for use in route handlers)
  (request as AuthenticatedRequest).admin = {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  };

  return null; // Authentication successful
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: AdminRole
): Promise<NextResponse | null> {
  // First check authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  const admin = (request as AuthenticatedRequest).admin;
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 }
    );
  }

  if (!hasRequiredRole(admin.role, requiredRole)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions. This action requires a higher role.' },
      { status: 403 }
    );
  }

  return null; // Authorization successful
}

/**
 * Get authenticated admin from request (for use in route handlers)
 */
export function getAuthenticatedAdmin(request: NextRequest) {
  return (request as AuthenticatedRequest).admin;
}

