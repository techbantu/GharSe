/**
 * HEALTH CHECK API
 * 
 * Purpose: Simple endpoint to check if the server is reachable
 * Used by: Offline page to test connection
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
