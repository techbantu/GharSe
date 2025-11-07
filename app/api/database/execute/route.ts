/**
 * DATABASE EXECUTION API - Automatic SQL Execution Endpoint
 * 
 * Purpose: Provides API endpoint to execute SQL commands to Supabase
 * Uses DATABASE_URL from environment to connect
 * 
 * Security: Should be protected in production (admin-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseExecutor } from '@/lib/database-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, description } = body;

    if (!sql) {
      return NextResponse.json(
        { success: false, error: 'SQL command is required' },
        { status: 400 }
      );
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

