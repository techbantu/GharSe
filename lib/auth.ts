/**
 * AUTHENTICATION UTILITIES
 * 
 * Secure authentication system with:
 * - JWT token generation and verification
 * - Password hashing and verification
 * - Session management
 * - Role-based access control
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Admin, AdminRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokenPayload {
  adminId: string;
  email: string;
  role: AdminRole;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for admin
 */
export function generateToken(admin: Admin): string {
  const payload: AuthTokenPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign(payload, JWT_SECRET!, options);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Generate random token for email verification or password reset
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if admin has required role or higher
 */
export function hasRequiredRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy: Record<AdminRole, number> = {
    STAFF: 1,
    MANAGER: 2,
    OWNER: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get role permissions
 */
export function getRolePermissions(role: AdminRole) {
  const permissions = {
    STAFF: {
      canViewOrders: true,
      canUpdateOrders: true,
      canManageMenu: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canManageSettings: false,
    },
    MANAGER: {
      canViewOrders: true,
      canUpdateOrders: true,
      canManageMenu: true,
      canManageUsers: false,
      canViewAnalytics: true,
      canManageSettings: false,
    },
    OWNER: {
      canViewOrders: true,
      canUpdateOrders: true,
      canManageMenu: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: true,
    },
  };

  return permissions[role];
}

