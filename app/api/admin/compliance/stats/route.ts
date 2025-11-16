/**
 * NEW FILE: Compliance Dashboard Statistics API
 * Purpose: Aggregate all compliance metrics for admin dashboard
 * 
 * Returns:
 * - Legal acceptance stats
 * - DPO request stats
 * - Deletion request stats
 * - Security breach stats
 * - Data retention stats
 * - Cookie consent stats
 * - Compliance alert stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDPORequestStats } from '@/lib/legal-compliance/dpo-requests';
import { getDeletionStats } from '@/lib/legal-compliance/deletion-workflow';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const auth = await verifyAdminAuth(request);
    // if (!auth.isAuthenticated) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel fetch all stats
    const [
      // Legal Acceptance
      totalAcceptances,
      acceptancesToday,
      acceptancesThisWeek,
      acceptancesThisMonth,
      latestVersionAcceptances,

      // DPO Requests
      dpoStats,

      // Deletion Requests
      deletionStats,

      // Security Breaches
      totalBreaches,
      activeBreaches,
      unresolvedBreaches,
      breachesThisMonth,

      // Data Retention
      totalArchivedOrders,
      ordersApproaching7Years,

      // Cookie Consent
      totalCookieConsents,
      cookieConsentsThisWeek,
      analyticsConsented,
      marketingConsented,

      // Compliance Alerts
      criticalAlerts,
      unresolvedAlerts,
      alertsThisWeek,
    ] = await Promise.all([
      // Legal Acceptance
      prisma.legalAcceptance.count(),
      prisma.legalAcceptance.count({ where: { acceptedAt: { gte: twentyFourHoursAgo } } }),
      prisma.legalAcceptance.count({ where: { acceptedAt: { gte: sevenDaysAgo } } }),
      prisma.legalAcceptance.count({ where: { acceptedAt: { gte: thirtyDaysAgo } } }),
      prisma.legalAcceptance.groupBy({
        by: ['documentType'],
        where: { version: '2.0' },
        _count: true,
      }),

      // DPO Requests
      getDPORequestStats(),

      // Deletion Requests
      getDeletionStats(),

      // Security Breaches
      prisma.securityBreach.count(),
      prisma.securityBreach.count({
        where: {
          resolvedAt: null,
        },
      }),
      prisma.securityBreach.count({
        where: {
          OR: [
            { notifiedAt: null },
            { resolvedAt: null },
          ],
        },
      }),
      prisma.securityBreach.count({
        where: {
          detectedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Data Retention
      prisma.archivedOrder.count(),
      prisma.order.count({
        where: {
          createdAt: {
            lte: new Date(now.getTime() - 6.5 * 365 * 24 * 60 * 60 * 1000), // 6.5 years
          },
        },
      }),

      // Cookie Consent
      prisma.cookieConsent.count(),
      prisma.cookieConsent.count({ where: { consentedAt: { gte: sevenDaysAgo } } }),
      prisma.cookieConsent.count({ where: { analytics: true, withdrawnAt: null } }),
      prisma.cookieConsent.count({ where: { marketing: true, withdrawnAt: null } }),

      // Compliance Alerts
      prisma.complianceAlert.count({ where: { severity: 'CRITICAL', resolvedAt: null } }),
      prisma.complianceAlert.count({ where: { resolvedAt: null } }),
      prisma.complianceAlert.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    // Calculate additional metrics
    const legalAcceptanceRate = totalAcceptances > 0 
      ? Math.round((acceptancesThisMonth / totalAcceptances) * 100)
      : 0;

    // Get recent alerts
    const recentAlerts = await prisma.complianceAlert.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get overdue DPO requests
    const overdueDPORequests = await prisma.dPORequest.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      take: 5,
    });

    // Get approaching deletions
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const approachingDeletions = await prisma.userDeletionRequest.findMany({
      where: {
        gracePeriodEnds: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        executedAt: null,
        cancelledAt: null,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          legalAcceptance: {
            total: totalAcceptances,
            today: acceptancesToday,
            thisWeek: acceptancesThisWeek,
            thisMonth: acceptancesThisMonth,
            rate: legalAcceptanceRate,
            byDocument: latestVersionAcceptances,
          },
          dpoRequests: {
            ...dpoStats,
            overdue: overdueDPORequests.length,
          },
          deletionRequests: deletionStats,
          securityBreaches: {
            total: totalBreaches,
            active: activeBreaches,
            unresolved: unresolvedBreaches,
            thisMonth: breachesThisMonth,
          },
          dataRetention: {
            totalArchived: totalArchivedOrders,
            approaching7Years: ordersApproaching7Years,
          },
          cookieConsent: {
            total: totalCookieConsents,
            thisWeek: cookieConsentsThisWeek,
            analyticsOptIn: analyticsConsented,
            marketingOptIn: marketingConsented,
          },
          alerts: {
            critical: criticalAlerts,
            unresolved: unresolvedAlerts,
            thisWeek: alertsThisWeek,
          },
        },
        recentActivity: {
          alerts: recentAlerts,
          overdueDPORequests,
          approachingDeletions,
        },
      },
    });
  } catch (error) {
    console.error('[COMPLIANCE STATS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

