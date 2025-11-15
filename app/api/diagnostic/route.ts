/**
 * DIAGNOSTIC ENDPOINT
 * 
 * GET /api/diagnostic
 * 
 * Check system health and environment
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        CUSTOMER_JWT_SECRET: process.env.CUSTOMER_JWT_SECRET ? '✅ SET' : '❌ MISSING',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '❌ MISSING',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '❌ MISSING',
        DATABASE_URL: process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING',
        EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'console',
      },
      prisma: {
        status: 'checking...',
      },
    };

    // Test Prisma connection
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      const count = await prisma.customer.count();
      diagnostics.prisma = {
        status: '✅ Connected',
        customerCount: count,
      } as any;
      await prisma.$disconnect();
    } catch (error) {
      diagnostics.prisma = {
        status: '❌ Error',
        error: error instanceof Error ? error.message : String(error),
      } as any;
    }

    return NextResponse.json({
      success: true,
      diagnostics,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

