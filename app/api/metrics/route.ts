/**
 * API Route: /api/metrics
 * Purpose: Expose Prometheus-compatible metrics for monitoring
 * 
 * SECURITY FIX: Now requires authentication
 * Access: 
 * - Admin token (for admin dashboard)
 * - Metrics token (for Prometheus scraping)
 * 
 * Usage: Configure Prometheus to scrape this endpoint every 15s with auth header
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportPrometheusMetrics, getAllMetrics } from '@/lib/metrics';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * SECURITY: Verify request is from authorized source
 * Supports:
 * 1. Admin JWT token (for dashboard access)
 * 2. Metrics bearer token (for Prometheus scraping)
 * 3. Internal IP whitelist (for internal monitoring)
 */
function isAuthorized(request: NextRequest): boolean {
  // 1. Check for admin token in cookie
  const adminToken = request.cookies.get('admin_token')?.value;
  if (adminToken && process.env.ADMIN_JWT_SECRET) {
    try {
      jwt.verify(adminToken, process.env.ADMIN_JWT_SECRET);
      return true;
    } catch {
      // Invalid token, continue to other checks
    }
  }
  
  // 2. Check for metrics bearer token (for Prometheus)
  const authHeader = request.headers.get('authorization');
  const metricsToken = process.env.METRICS_API_TOKEN;
  
  if (authHeader && metricsToken) {
    const [type, token] = authHeader.split(' ');
    if (type === 'Bearer' && token) {
      // Constant-time comparison to prevent timing attacks
      try {
        const tokenBuffer = Buffer.from(token);
        const secretBuffer = Buffer.from(metricsToken);
        if (tokenBuffer.length === secretBuffer.length && 
            crypto.timingSafeEqual(tokenBuffer, secretBuffer)) {
          return true;
        }
      } catch {
        // Invalid token format
      }
    }
  }
  
  // 3. Check for internal IP (localhost or internal network)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip')
    || '';
  
  const internalIPs = ['127.0.0.1', '::1', 'localhost'];
  if (internalIPs.includes(ip)) {
    return true;
  }
  
  // 4. Development mode bypass (for local testing only)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Metrics API] Allowing unauthenticated access in development mode');
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  // SECURITY FIX: Require authentication
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Metrics endpoint requires authentication.' },
      { status: 401 }
    );
  }
  
  const format = request.nextUrl.searchParams.get('format') || 'prometheus';

  try {
    if (format === 'prometheus') {
      // Prometheus format (text/plain)
      return new NextResponse(exportPrometheusMetrics(), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      // JSON format (for admin dashboard)
      const metrics = getAllMetrics();
      return NextResponse.json(metrics, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
  } catch (error) {
    console.error('[Metrics API] Error exporting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}

