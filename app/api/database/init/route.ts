/**
 * DATABASE INITIALIZATION API
 * 
 * Purpose: API endpoint to initialize database schema
 * Automatically creates tables if they don't exist
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database-init';

export async function GET(request: NextRequest) {
  try {
    const result = await initializeDatabase();
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Database initialized successfully' 
        : `Database initialization failed: ${result.error}`,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await initializeDatabase();
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Database initialized successfully' 
        : `Database initialization failed: ${result.error}`,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

