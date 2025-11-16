/**
 * NEW FILE: Authentication Helper Functions
 * Purpose: Verify admin and user authentication for API routes
 * 
 * Provides JWT verification and role checking for secure API endpoints.
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
}

interface UserTokenPayload {
  userId: string;
  email: string;
}

/**
 * Verify admin authentication from request headers
 * 
 * @param req - Next.js request object
 * @returns Authentication result with admin data
 */
export async function verifyAdminAuth(req: NextRequest): Promise<{
  isAuthenticated: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  error?: string;
}> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try cookie as fallback
      const token = req.cookies.get('admin_token')?.value;
      if (!token) {
        return { isAuthenticated: false, error: 'No authentication token provided' };
      }
      return verifyAdminTokenFromCookie(token);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;

    // Fetch admin from database to verify they still exist and are active
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin) {
      return { isAuthenticated: false, error: 'Admin not found' };
    }

    if (!admin.isActive) {
      return { isAuthenticated: false, error: 'Admin account is inactive' };
    }

    return {
      isAuthenticated: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isAuthenticated: false, error: 'Invalid token' };
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { isAuthenticated: false, error: 'Token expired' };
    }
    console.error('[Auth Helper] Error verifying admin auth:', error);
    return { isAuthenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Verify admin token from cookie
 * (Helper for verifyAdminAuth)
 */
async function verifyAdminTokenFromCookie(token: string): Promise<{
  isAuthenticated: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  error?: string;
}> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin) {
      return { isAuthenticated: false, error: 'Admin not found' };
    }

    if (!admin.isActive) {
      return { isAuthenticated: false, error: 'Admin account is inactive' };
    }

    return {
      isAuthenticated: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
    };
  } catch (error) {
    return { isAuthenticated: false, error: 'Invalid token' };
  }
}

/**
 * Verify user authentication from request headers
 * 
 * @param req - Next.js request object
 * @returns Authentication result with user data
 */
export async function verifyUserAuth(req: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try cookie as fallback
      const token = req.cookies.get('user_token')?.value;
      if (!token) {
        return { isAuthenticated: false, error: 'No authentication token provided' };
      }
      return verifyUserTokenFromCookie(token);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;

    // Fetch user from database
    const user = await prisma.customer.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        accountStatus: true,
      },
    });

    if (!user) {
      return { isAuthenticated: false, error: 'User not found' };
    }

    if (user.accountStatus !== 'ACTIVE') {
      return { isAuthenticated: false, error: 'User account is not active' };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isAuthenticated: false, error: 'Invalid token' };
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { isAuthenticated: false, error: 'Token expired' };
    }
    console.error('[Auth Helper] Error verifying user auth:', error);
    return { isAuthenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Verify user token from cookie
 * (Helper for verifyUserAuth)
 */
async function verifyUserTokenFromCookie(token: string): Promise<{
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;

    const user = await prisma.customer.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        accountStatus: true,
      },
    });

    if (!user) {
      return { isAuthenticated: false, error: 'User not found' };
    }

    if (user.accountStatus !== 'ACTIVE') {
      return { isAuthenticated: false, error: 'User account is not active' };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    return { isAuthenticated: false, error: 'Invalid token' };
  }
}

/**
 * Check if admin has required role
 * 
 * @param adminRole - Admin's current role
 * @param requiredRole - Required role ('OWNER', 'MANAGER', 'STAFF')
 * @returns True if admin has sufficient permissions
 */
export function hasAdminRole(adminRole: string, requiredRole: 'OWNER' | 'MANAGER' | 'STAFF'): boolean {
  const roleHierarchy = {
    OWNER: 3,
    MANAGER: 2,
    STAFF: 1,
  };

  return (roleHierarchy[adminRole as keyof typeof roleHierarchy] || 0) >= (roleHierarchy[requiredRole] || 0);
}

