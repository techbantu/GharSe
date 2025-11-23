/**
 * 🛡️ FORTRESS-LEVEL SECURITY HEADERS
 * 
 * Implements all modern web security headers to prevent:
 * - XSS attacks
 * - Clickjacking
 * - MIME sniffing
 * - Man-in-the-middle attacks
 * - Data injection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Generate a cryptographic nonce for CSP
 */
export function generateNonce(): string {
  const crypto = require('crypto');
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

/**
 * Get Content Security Policy header
 * This is THE most important security header
 */
export function getCSPHeader(nonce?: string): string {
  const policies = [
    // Default: only same origin
    "default-src 'self'",
    
    // Scripts: only same origin + inline with nonce + specific CDNs
    `script-src 'self' 'unsafe-eval' ${nonce ? `'nonce-${nonce}'` : ''} https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com`,
    
    // Styles: same origin + inline styles (needed for styled-components/tailwind)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Images: same origin + data URLs + Cloudinary + external APIs
    "img-src 'self' data: blob: https://*.cloudinary.com https://maps.googleapis.com https://maps.gstatic.com",
    
    // Fonts: same origin + Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    
    // Connections: same origin + APIs
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.cloudinary.com",
    
    // Frames: Stripe payment + Google Maps
    "frame-src 'self' https://js.stripe.com https://www.google.com",
    
    // Object/Embed: block all (prevents Flash/PDF vulnerabilities)
    "object-src 'none'",
    
    // Base URI: only same origin (prevents base tag injection)
    "base-uri 'self'",
    
    // Form actions: only same origin (prevents form hijacking)
    "form-action 'self'",
    
    // Frame ancestors: prevent clickjacking
    "frame-ancestors 'none'",
    
    // Upgrade insecure requests (HTTP -> HTTPS)
    "upgrade-insecure-requests",
    
    // Block all mixed content
    "block-all-mixed-content",
  ];
  
  return policies.join('; ');
}

/**
 * All security headers in one place
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    // Content Security Policy - Prevents XSS, injection attacks
    'Content-Security-Policy': getCSPHeader(nonce),
    
    // Strict Transport Security - Force HTTPS
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    
    // X-Frame-Options - Prevent clickjacking (CSP frame-ancestors is better but this is fallback)
    'X-Frame-Options': 'DENY',
    
    // X-Content-Type-Options - Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // X-XSS-Protection - Legacy XSS protection (CSP is better but this helps old browsers)
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy - Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy - Control browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
    ].join(', '),
    
    // Cross-Origin Embedder Policy
    'Cross-Origin-Embedder-Policy': 'credentialless',
    
    // Cross-Origin Opener Policy
    'Cross-Origin-Opener-Policy': 'same-origin',
    
    // Cross-Origin Resource Policy
    'Cross-Origin-Resource-Policy': 'same-origin',
    
    // Remove server information (security through obscurity)
    'X-Powered-By': '',
    
    // Cache control for sensitive data
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    
    // Prevent DNS rebinding
    'X-DNS-Prefetch-Control': 'off',
    
    // Download options for IE
    'X-Download-Options': 'noopen',
    
    // Permitted cross-domain policies
    'X-Permitted-Cross-Domain-Policies': 'none',
  };
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  const headers = getSecurityHeaders(nonce);
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

/**
 * Middleware to add security headers to all responses
 */
export function securityHeadersMiddleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Generate nonce for this request
  const nonce = generateNonce();
  
  // Store nonce in request for use in components
  (response as any).nonce = nonce;
  
  // Add security headers
  return addSecurityHeaders(response, nonce);
}

/**
 * Check if request is from a suspicious source
 */
export function isSuspiciousRequest(req: NextRequest): boolean {
  // Check for SQL injection attempts in URL
  const url = req.url.toLowerCase();
  const sqlPatterns = [
    'union select',
    'drop table',
    'insert into',
    'delete from',
    'update set',
    '--',
    "';--",
    'or 1=1',
    'or true',
  ];
  
  if (sqlPatterns.some(pattern => url.includes(pattern))) {
    return true;
  }
  
  // Check for suspicious user agents
  const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
  const suspiciousAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'metasploit',
    'havij',
    'acunetix',
    'netsparker',
  ];
  
  if (suspiciousAgents.some(agent => userAgent.includes(agent))) {
    return true;
  }
  
  // Check for missing required headers (real browsers always send these)
  if (!req.headers.get('accept')) {
    return true;
  }
  
  return false;
}

/**
 * Validate request origin to prevent CSRF
 */
export function validateOrigin(req: NextRequest): boolean {
  // Skip for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }
  
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  
  if (!origin) {
    // No origin header (might be a direct request, not from browser)
    return false;
  }
  
  // Parse origin domain
  const originUrl = new URL(origin);
  
  // Check if origin matches our domain
  const allowedOrigins = [
    host,
    process.env.NEXT_PUBLIC_APP_URL,
    'localhost:3000',
    'localhost:3001',
  ];
  
  return allowedOrigins.some(allowed => 
    allowed && (originUrl.host === allowed || origin.includes(allowed))
  );
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email format (strict)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Password strength validator
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Minimum length
  if (password.length < 12) {
    feedback.push('Password must be at least 12 characters');
  } else {
    score++;
  }
  
  // Uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }
  
  // Lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }
  
  // Numbers
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }
  
  // Special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }
  
  // No common patterns
  const commonPatterns = ['123', 'abc', 'password', 'admin', 'qwerty'];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    feedback.push('Avoid common patterns');
    score = Math.max(0, score - 2);
  }
  
  return {
    isValid: score >= 4 && password.length >= 12,
    score,
    feedback,
  };
}

