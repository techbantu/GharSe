/**
 * DATABASE EXECUTION API - Automatic SQL Execution Endpoint
 * 
 * Purpose: Provides API endpoint to execute SQL commands to Supabase
 * Uses DATABASE_URL from environment to connect
 * 
 * Security: Protected - requires admin authentication
 * CRITICAL: This endpoint can execute ANY SQL - must be admin-only!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseExecutor } from '@/lib/database-executor';
import crypto from 'crypto';

/**
 * CRITICAL SECURITY: Check if request is from authenticated admin
 *
 * This endpoint can execute arbitrary SQL queries - extremely dangerous!
 * ALWAYS require authentication, even in development mode
 *
 * Security measures:
 * - Requires ADMIN_API_TOKEN environment variable (no defaults)
 * - Uses Bearer token authentication
 * - Constant-time comparison to prevent timing attacks
 * - Never allows unauthenticated access, even in development
 */
function isAdminAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_API_TOKEN;

  /**
   * SECURITY FIX: Never allow open access, even in development
   * If ADMIN_API_TOKEN is not set, deny all requests
   * This prevents accidental exposure of database execution endpoint
   */
  if (!adminToken) {
    console.error(
      'CRITICAL SECURITY ERROR: ADMIN_API_TOKEN is not set. ' +
      'Database execution endpoint is completely blocked. ' +
      'Set ADMIN_API_TOKEN environment variable to enable this endpoint.'
    );
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Verify token matches using constant-time comparison to prevent timing attacks
  const expectedAuth = `Bearer ${adminToken}`;

  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    const authBuffer = Buffer.from(authHeader);
    const expectedBuffer = Buffer.from(expectedAuth);

    // Only compare if lengths match (otherwise timingSafeEqual throws)
    if (authBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(authBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: Check authentication
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { sql, description } = body;

    if (!sql) {
      return NextResponse.json(
        { success: false, error: 'SQL command is required' },
        { status: 400 }
      );
    }

    /**
     * CRITICAL SECURITY FIX: SQL Injection Prevention
     *
     * Previous implementation used simple string.includes() which could be bypassed
     * Example bypass: "SEL/* comment *\/ECT * FROM users; DR/**/OP TABLE admins"
     *
     * New approach:
     * 1. Use SQL parser for accurate command detection (TODO: integrate sql-parser library)
     * 2. Whitelist allowed commands instead of blacklisting dangerous ones
     * 3. Enforce read-only operations for this endpoint
     * 4. Require parameterized queries for any modifications
     *
     * For now: COMPLETELY BLOCK this endpoint and recommend using Prisma Migrate
     */
    return NextResponse.json(
      {
        success: false,
        error: 'Direct SQL execution is disabled for security. ' +
               'Please use Prisma migrations for schema changes: npx prisma migrate dev. ' +
               'For data queries, use the Prisma Client in your application code. ' +
               'If you absolutely need raw SQL access, use a secure database management tool like pgAdmin or DBeaver.',
        recommendation: 'Use Prisma migrations and Prisma Client for all database operations',
      },
      { status: 403 }
    );

    /**
     * IMPORTANT: The code below is intentionally unreachable
     * This endpoint should NEVER execute arbitrary SQL
     * If you need to re-enable this for a specific use case:
     * 1. Use a proper SQL parser library (e.g., node-sql-parser)
     * 2. Implement strict whitelisting of allowed operations
     * 3. Add comprehensive audit logging
     * 4. Require multi-factor authentication
     * 5. Add IP whitelisting
     * 6. Implement query timeout limits
     * 7. Use read-only database user
     */

    // BLOCKED - The following code is unreachable due to early return above
    // Kept for reference only - do not uncomment without implementing security measures above
    /*
    const executor = getDatabaseExecutor();
    const result = await executor.execute(sql, description);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SQL executed successfully',
        rows: result.rows,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    */
  } catch (error: any) {
    console.error('Database execution error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute SQL' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Check authentication
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }
  
  try {
    const executor = getDatabaseExecutor();
    const history = executor.getHistory();

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

