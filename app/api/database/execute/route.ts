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

/**
 * Check if request is from authenticated admin
 * TODO: Implement proper authentication (JWT, session, etc.)
 */
function isAdminAuthenticated(request: NextRequest): boolean {
  // Check for admin token in header
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_API_TOKEN;
  
  if (!adminToken) {
    // If no admin token configured, deny all access in production
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    // In development, allow if no token configured (for testing)
    return true;
  }
  
  // Verify token matches
  return authHeader === `Bearer ${adminToken}`;
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

    // SECURITY: Block dangerous SQL commands
    const dangerousCommands = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'];
    const sqlUpper = sql.toUpperCase();
    
    for (const cmd of dangerousCommands) {
      if (sqlUpper.includes(cmd)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Dangerous SQL command "${cmd}" is not allowed. Use admin database tools for schema changes.` 
          },
          { status: 400 }
        );
      }
    }

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

