/**
 * NEW FILE: Compliance Cron API Endpoint
 * Purpose: API endpoint for Vercel Cron to execute compliance checks
 * Schedule: 2:00 AM IST daily (configured in vercel.json)
 * 
 * This endpoint runs all the compliance checks from the cron script.
 * Vercel Cron will call GET /api/cron/compliance daily at 2 AM IST.
 * 
 * Security: Protected by Vercel Cron secret header
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, subYears } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Verify Vercel Cron secret (security)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results: Record<string, any> = {};
    const now = new Date();

    // Task 1: Data retention check
    try {
      const sevenYearsAgo = subYears(now, 7);
      const oldOrders = await prisma.order.count({
        where: {
          createdAt: { lt: sevenYearsAgo },
          id: {
            notIn: (await prisma.archivedOrder.findMany({ select: { originalOrderId: true } }))
              .map(a => a.originalOrderId),
          },
        },
      });

      if (oldOrders > 0) {
        await prisma.complianceAlert.create({
          data: {
            alertType: 'RETENTION_DUE',
            severity: 'MEDIUM',
            title: 'Data Retention: Orders Need Archival',
            description: `${oldOrders} orders are 7+ years old and need archiving for tax compliance.`,
          },
        });
      }

      results.dataRetention = { ordersToArchive: oldOrders };
    } catch (error) {
      results.dataRetention = { error: String(error) };
    }

    // Task 2: DPO SLA check
    try {
      const overdueRequests = await prisma.dPORequest.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
      });

      if (overdueRequests.length > 0) {
        for (const request of overdueRequests) {
          await prisma.dPORequest.update({
            where: { id: request.id },
            data: { isOverdue: true },
          });
        }

        await prisma.complianceAlert.create({
          data: {
            alertType: 'DPO_OVERDUE',
            severity: 'CRITICAL',
            title: 'URGENT: DPO Requests Overdue',
            description: `${overdueRequests.length} DPO requests exceeded 30-day SLA.`,
          },
        });
      }

      results.dpoRequests = { overdue: overdueRequests.length };
    } catch (error) {
      results.dpoRequests = { error: String(error) };
    }

    // Task 3: License expiry check
    try {
      const chefs = await prisma.chef.findMany({
        where: {
          fssaiNumber: { not: null },
          fssaiExpiry: { not: null },
        },
      });

      let expired = 0;
      let expiringSoon = 0;

      for (const chef of chefs) {
        if (!chef.fssaiExpiry) continue;

        const daysUntilExpiry = Math.ceil(
          (chef.fssaiExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          expired++;
          if (chef.status === 'ACTIVE') {
            await prisma.chef.update({
              where: { id: chef.id },
              data: { status: 'SUSPENDED' },
            });
          }

          await prisma.complianceAlert.create({
            data: {
              alertType: 'LICENSE_EXPIRING',
              severity: 'CRITICAL',
              title: 'FSSAI License Expired',
              description: `${chef.businessName} - License expired. Chef auto-suspended.`,
            },
          });
        } else if (daysUntilExpiry <= 30) {
          expiringSoon++;
          await prisma.complianceAlert.create({
            data: {
              alertType: 'LICENSE_EXPIRING',
              severity: daysUntilExpiry <= 7 ? 'CRITICAL' : 'HIGH',
              title: 'FSSAI License Expiring',
              description: `${chef.businessName} - License expires in ${daysUntilExpiry} days.`,
            },
          });
        }
      }

      results.licenseCheck = { expired, expiringSoon };
    } catch (error) {
      results.licenseCheck = { error: String(error) };
    }

    // Task 4: Execute user deletions
    try {
      const pendingDeletions = await prisma.userDeletionRequest.findMany({
        where: {
          executedAt: null,
          gracePeriodEnds: { lt: now },
          hasLegalHold: false,
          hasActiveOrders: false,
        },
        take: 50,
      });

      for (const deletion of pendingDeletions) {
        await prisma.customer.update({
          where: { id: deletion.userId },
          data: {
            name: `Deleted User ${deletion.userId.substring(0, 8)}`,
            email: `deleted-${deletion.userId}@anonymized.local`,
            phone: `DELETED-${deletion.userId.substring(0, 8)}`,
            passwordHash: null,
            accountStatus: 'DELETED',
          },
        });

        await prisma.userDeletionRequest.update({
          where: { id: deletion.id },
          data: { executedAt: now },
        });
      }

      results.userDeletions = { executed: pendingDeletions.length };
    } catch (error) {
      results.userDeletions = { error: String(error) };
    }

    // Task 5: Breach notification check
    try {
      const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      const overdueBreaches = await prisma.securityBreach.count({
        where: {
          detectedAt: { lt: seventyTwoHoursAgo },
          notifiedAt: null,
        },
      });

      if (overdueBreaches > 0) {
        await prisma.complianceAlert.create({
          data: {
            alertType: 'BREACH_DETECTED',
            severity: 'CRITICAL',
            title: 'URGENT: Breach Notification SLA Exceeded',
            description: `${overdueBreaches} breaches not reported within 72 hours.`,
          },
        });
      }

      results.breachCheck = { overdue: overdueBreaches };
    } catch (error) {
      results.breachCheck = { error: String(error) };
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[Compliance Cron] Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}

