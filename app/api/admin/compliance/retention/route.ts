/**
 * NEW FILE: Data Retention API
 * Purpose: Manage data retention for tax compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get('export');
    const taxYear = searchParams.get('taxYear');

    const now = new Date();
    const sevenYearsAgo = new Date(now.getTime() - 7 * 365 * 24 * 60 * 60 * 1000);
    const sixPointFiveYearsAgo = new Date(now.getTime() - 6.5 * 365 * 24 * 60 * 60 * 1000);

    // Export archived orders
    if (exportFormat === 'csv') {
      const where: any = {};
      if (taxYear && taxYear !== 'all') {
        where.taxYear = taxYear;
      }

      const archived = await prisma.archivedOrder.findMany({
        where,
        orderBy: { archivedAt: 'desc' },
        take: 10000,
      });

      const csv = generateCSV(archived);
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="archived-orders-${taxYear || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Regular fetch
    const [archivedCount, approachingOrders, byTaxYear] = await Promise.all([
      // Count archived orders
      prisma.archivedOrder.count(),

      // Orders approaching 7 years (6.5+ years old)
      prisma.order.findMany({
        where: {
          createdAt: {
            lte: sixPointFiveYearsAgo,
            gte: sevenYearsAgo,
          },
        },
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 100,
      }),

      // Group by tax year
      prisma.archivedOrder.groupBy({
        by: ['taxYear'],
        _count: true,
        orderBy: {
          taxYear: 'desc',
        },
      }),
    ]);

    // Calculate age for each order
    const ordersWithAge = approachingOrders.map((order) => {
      const ageMs = now.getTime() - new Date(order.createdAt).getTime();
      const ageYears = ageMs / (365 * 24 * 60 * 60 * 1000);
      const taxYear = getTaxYear(new Date(order.createdAt));

      return {
        ...order,
        ageYears,
        taxYear,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        archivedCount,
        approachingCount: approachingOrders.length,
        approachingOrders: ordersWithAge,
        byTaxYear,
      },
    });
  } catch (error) {
    console.error('[RETENTION API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Manual archive
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if already archived
    const existing = await prisma.archivedOrder.findUnique({
      where: { originalOrderId: order.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Order already archived' },
        { status: 400 }
      );
    }

    // Calculate retention period
    const retainUntil = new Date(order.createdAt);
    retainUntil.setFullYear(retainUntil.getFullYear() + 7);

    const taxYear = getTaxYear(new Date(order.createdAt));
    const quarter = getQuarter(new Date(order.createdAt));

    // Archive order
    await prisma.archivedOrder.create({
      data: {
        originalOrderId: order.id,
        orderData: order as any,
        retainUntil,
        taxYear,
        financialPeriod: quarter,
      },
    });

    // Log action
    await prisma.dataRetentionLog.create({
      data: {
        recordType: 'order',
        recordId: order.id,
        action: 'archived',
        reason: 'manual_archive',
        details: {
          taxYear,
          quarter,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order archived successfully',
    });
  } catch (error) {
    console.error('[RETENTION API] Archive error:', error);
    return NextResponse.json(
      { error: 'Failed to archive order' },
      { status: 500 }
    );
  }
}

function getTaxYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Indian tax year: April 1 - March 31
  if (month >= 3) {
    // April to December
    return `FY${year}-${String(year + 1).substring(2)}`;
  } else {
    // January to March
    return `FY${year - 1}-${String(year).substring(2)}`;
  }
}

function getQuarter(date: Date): string {
  const month = date.getMonth();
  
  // Q1: April-June, Q2: July-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  if (month >= 3 && month <= 5) return 'Q1';
  if (month >= 6 && month <= 8) return 'Q2';
  if (month >= 9 && month <= 11) return 'Q3';
  return 'Q4';
}

function generateCSV(archived: any[]): string {
  const headers = ['Original Order ID', 'Archived At', 'Retain Until', 'Tax Year', 'Financial Period'];
  
  const rows = archived.map((item) => [
    item.originalOrderId,
    new Date(item.archivedAt).toISOString(),
    new Date(item.retainUntil).toISOString(),
    item.taxYear,
    item.financialPeriod,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => 
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}
