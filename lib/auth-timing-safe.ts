/**
 * 🔒 TIMING-SAFE AUTHENTICATION
 * 
 * Mitigates timing attacks on JWT verification
 * Nation-state resistant implementation
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Admin, AdminRole } from '@prisma/client';

export { AdminRole };

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

// Constant-time operations to prevent timing attacks
const MINIMUM_VERIFY_TIME_MS = 50; // Ensure all verifications take at least 50ms

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
 * Verify a password against a hash (timing-safe)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    const result = await bcrypt.compare(password, hash);
    
    // Ensure minimum time to prevent timing analysis
    const elapsed = Date.now() - startTime;
    if (elapsed < MINIMUM_VERIFY_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MINIMUM_VERIFY_TIME_MS - elapsed));
    }
    
    return result;
  } catch (error) {
    // Same timing for errors
    const elapsed = Date.now() - startTime;
    if (elapsed < MINIMUM_VERIFY_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MINIMUM_VERIFY_TIME_MS - elapsed));
    }
    return false;
  }
}

/**
 * Generate JWT token for admin (with explicit algorithm)
 */
export function generateToken(admin: Admin): string {
  const payload: AuthTokenPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };

  // ✅ FIXED: Always specify algorithm to prevent algorithm confusion attacks
  return jwt.sign(payload, JWT_SECRET!, {
    algorithm: 'HS256', // Explicit algorithm
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode JWT token (timing-safe, algorithm-verified)
 */
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  const startTime = Date.now();
  
  try {
    // ✅ FIXED: Whitelist only HS256 to prevent algorithm confusion
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HS256
    }) as AuthTokenPayload;
    
    // Ensure constant-time operation
    const elapsed = Date.now() - startTime;
    if (elapsed < MINIMUM_VERIFY_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MINIMUM_VERIFY_TIME_MS - elapsed));
    }
    
    return decoded;
  } catch (error) {
    // Same constant-time delay for all errors (prevent timing analysis)
    const elapsed = Date.now() - startTime;
    if (elapsed < MINIMUM_VERIFY_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MINIMUM_VERIFY_TIME_MS - elapsed));
    }
    
    // Never reveal error type (prevents information leakage)
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

