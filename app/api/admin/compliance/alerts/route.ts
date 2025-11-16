/**
 * NEW FILE: Compliance Alerts API
 * Purpose: Fetch unresolved compliance alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication
    // const auth = await verifyAdminAuth(request);
    // if (!auth.isAuthenticated) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { resolvedAt: null };
    if (severity) {
      where.severity = severity;
    }

    const alerts = await prisma.complianceAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' }, // CRITICAL first
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('[ALERTS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Mark alert as resolved
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID required' },
        { status: 400 }
      );
    }

    await prisma.complianceAlert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    console.error('[ALERTS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

