/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CSRF (Cross-Site Request Forgery) PROTECTION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Prevent unauthorized state-changing requests from malicious sites
 *
 * How CSRF Attacks Work:
 * 1. User logs into GharSe (gets authenticated cookie)
 * 2. User visits malicious site (while still logged in)
 * 3. Malicious site makes request to GharSe with user's cookies
 * 4. Without CSRF protection, the request would succeed
 *
 * Our Protection Strategy:
 * 1. Double Submit Cookie Pattern (production-ready, stateless)
 * 2. SameSite cookie attribute (defense in depth)
 * 3. Origin/Referer header validation
 * 4. Custom header requirement for AJAX requests
 *
 * Security: Protects against CSRF attacks on state-changing operations
 * Performance: O(1) token validation, no database lookups
 *
 * @module lib/security/csrf-protection
 * @author GharSe Engineering Team
 * @version 2.0.0
 * @since 2025-11-15
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * CSRF token configuration
 */
const CSRF_CONFIG = {
  tokenLength: 32, // bytes (will be 64 hex characters)
  cookieName: 'csrf_token',
  headerName: 'x-csrf-token',
  cookieMaxAge: 60 * 60 * 24, // 24 hours in seconds
  sameSite: 'strict' as const, // Strict SameSite for maximum protection
};

/**
 * Generate a cryptographically secure CSRF token
 *
 * @returns 64-character hexadecimal token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
}

/**
 * Set CSRF token in response cookies
 * This should be called on:
 * - User login
 * - Page loads requiring CSRF protection
 * - Token expiration/refresh
 *
 * @param response - Next.js response object to modify
 * @param token - CSRF token to set (generates new one if not provided)
 * @returns The token that was set
 */
export function setCsrfToken(response: NextResponse, token?: string): string {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set(CSRF_CONFIG.cookieName, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript to send in headers
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: CSRF_CONFIG.sameSite,
    maxAge: CSRF_CONFIG.cookieMaxAge,
    path: '/',
  });

  return csrfToken;
}

/**
 * Get CSRF token from request cookies
 *
 * @param request - Next.js request object
 * @returns CSRF token from cookie or null if not found
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_CONFIG.cookieName)?.value || null;
}

/**
 * Get CSRF token from request header
 *
 * @param request - Next.js request object
 * @returns CSRF token from header or null if not found
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_CONFIG.headerName) || null;
}

/**
 * Validate CSRF token using double-submit cookie pattern
 *
 * Double Submit Cookie Pattern:
 * 1. Cookie contains CSRF token
 * 2. Request header must contain same token
 * 3. Attacker can't read cookies from malicious site (same-origin policy)
 * 4. Therefore attacker can't send matching header
 *
 * @param request - Next.js request object
 * @returns true if CSRF token is valid, false otherwise
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  // Both tokens must be present
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must match (constant-time comparison to prevent timing attacks)
  try {
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    // Length must match for timingSafeEqual
    if (cookieBuffer.length !== headerBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(cookieBuffer, headerBuffer);
  } catch {
    return false;
  }
}

/**
 * Validate request origin/referer headers
 * Additional security layer to prevent CSRF
 *
 * @param request - Next.js request object
 * @param allowedOrigins - List of allowed origins (defaults to request origin)
 * @returns true if origin is valid, false otherwise
 */
export function validateOrigin(request: NextRequest, allowedOrigins?: string[]): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If allowedOrigins not specified, use request host
  const requestHost = request.headers.get('host');
  const allowed = allowedOrigins || (requestHost ? [`https://${requestHost}`, `http://${requestHost}`] : []);

  // Check origin header (most reliable)
  if (origin) {
    return allowed.some((allowedOrigin) => origin.startsWith(allowedOrigin));
  }

  // Fallback to referer header
  if (referer) {
    return allowed.some((allowedOrigin) => referer.startsWith(allowedOrigin));
  }

  // No origin or referer header - reject for security
  // (Some legitimate requests may not have these headers, but it's safer to reject)
  return false;
}

/**
 * CSRF protection middleware for API routes
 * Validates both CSRF token and request origin
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfResult = validateCsrfProtection(request);
 *   if (!csrfResult.valid) {
 *     return csrfResult.response;
 *   }
 *   // Your endpoint logic here...
 * }
 * ```
 *
 * @param request - Next.js request object
 * @param options - Optional configuration
 * @returns Object with validation result and optional response to return
 */
export function validateCsrfProtection(
  request: NextRequest,
  options: {
    skipOriginValidation?: boolean;
    allowedOrigins?: string[];
  } = {}
): { valid: boolean; response?: NextResponse } {
  const startTime = Date.now();

  try {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { valid: true };
    }

    // Validate CSRF token
    const tokenValid = validateCsrfToken(request);

    if (!tokenValid) {
      const duration = Date.now() - startTime;

      logger.warn('CSRF validation failed - invalid token', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        hasCookieToken: !!getCsrfTokenFromCookie(request),
        hasHeaderToken: !!getCsrfTokenFromHeader(request),
        ip: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent')?.substring(0, 50),
        duration,
      });

      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid CSRF token. Please refresh the page and try again.',
          code: 'CSRF_TOKEN_INVALID',
        },
        { status: 403 }
      );

      return { valid: false, response };
    }

    // Validate origin/referer (additional security layer)
    if (!options.skipOriginValidation) {
      const originValid = validateOrigin(request, options.allowedOrigins);

      if (!originValid) {
        const duration = Date.now() - startTime;

        logger.warn('CSRF validation failed - invalid origin', {
          endpoint: request.nextUrl.pathname,
          method: request.method,
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
          ip: request.headers.get('x-forwarded-for') || request.ip,
          duration,
        });

        const response = NextResponse.json(
          {
            success: false,
            error: 'Request origin not allowed.',
            code: 'CSRF_ORIGIN_INVALID',
          },
          { status: 403 }
        );

        return { valid: false, response };
      }
    }

    // All validations passed
    return { valid: true };
  } catch (error) {
    // On error, reject request for security
    logger.error('CSRF validation error', {
      endpoint: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
    });

    const response = NextResponse.json(
      {
        success: false,
        error: 'Security validation failed. Please try again.',
        code: 'CSRF_VALIDATION_ERROR',
      },
      { status: 500 }
    );

    return { valid: false, response };
  }
}

/**
 * Create API response with CSRF token included
 * Use this for responses that will trigger subsequent requests
 *
 * @param data - Response data
 * @param status - HTTP status code
 * @returns Next.js response with CSRF token cookie set
 */
export function createCsrfProtectedResponse(data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  const token = setCsrfToken(response);

  // Optionally include token in response body for convenience
  // Frontend can use this to set the header
  if (typeof data === 'object' && data !== null) {
    data.csrfToken = token;
  }

  return response;
}

/**
 * Middleware to automatically add CSRF token to all responses
 * Can be used in Next.js middleware.ts
 *
 * @param response - Next.js response to modify
 * @returns Modified response with CSRF token
 */
export function addCsrfTokenToResponse(response: NextResponse): NextResponse {
  setCsrfToken(response);
  return response;
}

/**
 * Export configuration for frontend usage
 */
export const CSRF_PUBLIC_CONFIG = {
  headerName: CSRF_CONFIG.headerName,
  cookieName: CSRF_CONFIG.cookieName,
} as const;
