/**
 * DATABASE MIGRATION HISTORY API
 * 
 * Purpose: View all database changes and migrations
 * Shows what SQL commands have been executed and when
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseMigrator } from '@/lib/supabase-migrator';

export async function GET(request: NextRequest) {
  try {
    const migrator = getSupabaseMigrator();
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    
    const history = await migrator.getHistory(limit);

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get migration history',
      },
      { status: 500 }
    );
  }
}

