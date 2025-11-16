/**
 * NEW FILE: Audit Logs API
 * Purpose: Fetch, search, filter, and export audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportFormat = searchParams.get('export');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { userId: { contains: search } },
        { sessionId: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Export to CSV
    if (exportFormat === 'csv') {
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000, // Max 10k records for export
      });

      const csv = generateCSV(logs);
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Regular fetch with pagination
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[AUDIT LOGS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(logs: any[]): string {
  const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Session ID', 'IP Address', 'User Agent', 'Details'];
  
  const rows = logs.map((log) => [
    new Date(log.createdAt).toISOString(),
    log.action,
    log.entityType,
    log.entityId || '',
    log.userId || '',
    log.sessionId || '',
    log.ipAddress || '',
    log.userAgent || '',
    log.details ? JSON.stringify(log.details) : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => 
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}

