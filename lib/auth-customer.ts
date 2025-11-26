/**
 * CUSTOMER AUTHENTICATION SYSTEM
 * 
 * Purpose: Secure authentication for customer accounts with JWT, bcrypt, and session management
 * 
 * Features:
 * - Password hashing with bcrypt (12 rounds)
 * - JWT token generation with 7-day expiry
 * - Session tracking and validation
 * - Token revocation on logout
 * - Login attempt tracking
 * 
 * Architecture: Production-grade security following OWASP best practices
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Customer } from '@prisma/client';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * CRITICAL SECURITY: JWT Secret must be set in environment variables
 * Never use default secrets in production - this would allow anyone to forge tokens
 * The application will fail fast if JWT_SECRET is not configured
 */
if (!process.env.JWT_SECRET) {
  throw new Error(
    'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. ' +
    'This is required for authentication. Please add JWT_SECRET to your .env file. ' +
    'Generate a secure secret using: openssl rand -base64 64'
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokenPayload {
  customerId: string;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt (12 rounds for security)
 * 
 * @param password - Plain text password
 * @returns Promise<string> - Bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password
 * @param hash - Bcrypt hash from database
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for customer
 * 
 * @param customer - Customer object from database
 * @returns string - JWT token
 */
export function generateToken(customer: Customer): string {
  const payload: AuthTokenPayload = {
    customerId: customer.id,
    email: customer.email,
    emailVerified: customer.emailVerified,
    phoneVerified: customer.phoneVerified,
  };

  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Verify and decode JWT token
 * 
 * @param token - JWT token string
 * @returns AuthTokenPayload | null - Decoded payload or null if invalid
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired', { error: error.message });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
    }
    return null;
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader - Authorization header value
 * @returns string | null - Token or null if invalid format
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
 * Extract token from cookie string
 * 
 * @param cookieHeader - Cookie header value
 * @returns string | null - Token or null if not found
 */
export function extractTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));
  
  if (!authCookie) return null;
  
  return authCookie.split('=')[1];
}

/**
 * Create session record in database
 * 
 * @param customerId - Customer ID
 * @param token - JWT token
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @returns Promise<void>
 */
export async function createSession(
  customerId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Calculate expiry from JWT
  const decoded = jwt.decode(token) as AuthTokenPayload;
  const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  try {
    await prisma.userSession.create({
      data: {
        customerId,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
    
    logger.info('Session created', {
      customerId,
      expiresAt,
      ipAddress: ipAddress?.substring(0, 10) + '***', // Privacy: partial IP
    });
  } catch (error) {
    logger.error('Failed to create session', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - session creation is not critical for login
  }
}

/**
 * Validate session (check if token is not revoked and not expired)
 * 
 * @param token - JWT token
 * @returns Promise<boolean> - True if session is valid
 */
export async function validateSession(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  try {
    const session = await prisma.userSession.findUnique({
      where: { tokenHash },
    });
    
    if (!session) return false;
    if (session.isRevoked) return false;
    if (session.expiresAt < new Date()) return false;
    
    // Update last used timestamp
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });
    
    return true;
  } catch (error) {
    logger.error('Session validation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Revoke session (logout)
 * 
 * @param token - JWT token
 * @returns Promise<boolean> - True if session was revoked
 */
export async function revokeSession(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  try {
    await prisma.userSession.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
    
    logger.info('Session revoked', { tokenHash: tokenHash.substring(0, 10) + '***' });
    return true;
  } catch (error) {
    logger.error('Failed to revoke session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Revoke all sessions for a customer (logout from all devices)
 * 
 * @param customerId - Customer ID
 * @returns Promise<number> - Number of sessions revoked
 */
export async function revokeAllSessions(customerId: string): Promise<number> {
  try {
    const result = await prisma.userSession.updateMany({
      where: { customerId, isRevoked: false },
      data: { isRevoked: true },
    });
    
    logger.info('All sessions revoked', {
      customerId,
      count: result.count,
    });
    
    return result.count;
  } catch (error) {
    logger.error('Failed to revoke all sessions', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Generate random token for email verification or password reset
 * 
 * @returns string - 64-character hex token
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate unique referral code for customer
 * 
 * @param name - Customer name
 * @returns Promise<string> - Unique referral code (e.g., "RAVI-FEAST-A3B2")
 */
export async function generateReferralCode(name: string): Promise<string> {
  // Create base code from name (first 4-6 chars, uppercase, remove spaces)
  const nameBase = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 6) || 'USER';
  
  // Add random suffix for uniqueness
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  let code = `${nameBase}-${suffix}`;
  
  // Ensure uniqueness (check database)
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.customer.findUnique({
      where: { referralCode: code },
    });
    
    if (!existing) break;
    
    // Generate new suffix if code exists
    const newSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    code = `${nameBase}-${newSuffix}`;
    attempts++;
  }
  
  return code;
}

/**
 * Increment login attempts and check if account should be locked
 * 
 * @param customerId - Customer ID
 * @returns Promise<boolean> - True if account is now locked (>5 attempts)
 */
export async function incrementLoginAttempts(customerId: string): Promise<boolean> {
  try {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { loginAttempts: { increment: 1 } },
      select: { loginAttempts: true },
    });
    
    const isLocked = customer.loginAttempts >= 5;
    
    if (isLocked) {
      logger.warn('Account locked due to failed login attempts', {
        customerId,
        attempts: customer.loginAttempts,
      });
    }
    
    return isLocked;
  } catch (error) {
    logger.error('Failed to increment login attempts', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Reset login attempts (after successful login)
 * 
 * @param customerId - Customer ID
 * @returns Promise<void>
 */
export async function resetLoginAttempts(customerId: string): Promise<void> {
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        loginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to reset login attempts', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate password strength
 * SIMPLIFIED: Just require minimum 6 characters - keep it easy for users!
 * 
 * @param password - Password to validate
 * @returns { valid: boolean; message?: string } - Validation result
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  // SIMPLIFIED: Just check minimum length - don't frustrate users with complex rules
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  
  return { valid: true };
}

