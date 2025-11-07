/**
 * AUTOMATIC DATABASE MIGRATION API
 * 
 * Purpose: Automatically executes SQL migrations to Supabase
 * Uses DATABASE_URL from .env to connect and run schema changes
 * 
 * Endpoints:
 * - GET /api/database/migrate - Run migrations from supabase-schema.sql
 * - POST /api/database/migrate - Execute custom SQL commands
 * 
 * No manual steps required - everything is automatic!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseMigrator } from '@/lib/supabase-migrator';

/**
 * GET - Run complete schema migration
 */
export async function GET(request: NextRequest) {
  try {
    const migrator = getSupabaseMigrator();
    
    // Run complete schema setup
    const result = await migrator.ensureSchema();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database schema migrated successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Migration failed',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Execute custom SQL commands
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, description } = body;

    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: 'SQL command is required',
        },
        { status: 400 }
      );
    }

    const migrator = getSupabaseMigrator();
    const result = await migrator.execute(sql, description);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SQL executed successfully',
        changes: result.changes,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'SQL execution failed',
          changes: result.changes,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('SQL execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'SQL execution failed',
      },
      { status: 500 }
    );
  }
}

