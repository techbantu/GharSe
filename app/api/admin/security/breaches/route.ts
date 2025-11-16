/**
 * NEW FILE: Security Breach Management API
 * Purpose: Admin endpoints for viewing and managing security breaches
 * Access: Admin only
 * 
 * Endpoints:
 * - GET: List all security breaches with 72-hour countdown
 * - POST: Manually record a security breach
 * - PATCH: Update breach status (resolved, mitigation steps)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifySecurityBreach, notifyDataProtectionBoard } from '@/lib/security/breach-notification';
import { recordSecurityBreach } from '@/lib/security/breach-detection';

/**
 * GET /api/admin/security/breaches
 * List all security breaches with 72-hour countdown
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const session = await getServerSession();
    // if (!session?.user?.role === 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const breaches = await prisma.securityBreach.findMany({
      orderBy: {
        detectedAt: 'desc',
      },
      take: 100, // Last 100 breaches
    });

    // Calculate 72-hour deadline status for each breach
    const breachesWithStatus = breaches.map((breach) => {
      const detectedAt = breach.detectedAt.getTime();
      const deadline = detectedAt + 72 * 60 * 60 * 1000; // 72 hours
      const now = Date.now();
      const hoursRemaining = Math.max(0, (deadline - now) / (60 * 60 * 1000));
      const isOverdue = now > deadline && !breach.notifiedAt;

      let status: 'CRITICAL' | 'WARNING' | 'OK' | 'NOTIFIED' | 'RESOLVED';
      if (breach.resolvedAt) {
        status = 'RESOLVED';
      } else if (breach.notifiedAt) {
        status = 'NOTIFIED';
      } else if (isOverdue) {
        status = 'CRITICAL';
      } else if (hoursRemaining < 24) {
        status = 'WARNING';
      } else {
        status = 'OK';
      }

      return {
        ...breach,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        isOverdue,
        status,
        deadline: new Date(deadline).toISOString(),
      };
    });

    // Get statistics
    const stats = {
      total: breaches.length,
      unnotified: breaches.filter((b) => !b.notifiedAt).length,
      unresolved: breaches.filter((b) => !b.resolvedAt).length,
      overdue: breachesWithStatus.filter((b) => b.isOverdue).length,
      critical: breaches.filter((b) => b.severity === 'CRITICAL').length,
    };

    return NextResponse.json({
      breaches: breachesWithStatus,
      stats,
    });
  } catch (error) {
    console.error('[BREACH API] Error fetching breaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breaches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security/breaches
 * Manually record a security breach
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const body = await request.json();
    const {
      severity,
      breachType,
      affectedRecords,
      affectedUsers,
      description,
      mitigationSteps,
      autoNotify = true,
    } = body;

    // Validate required fields
    if (!severity || !breachType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: severity, breachType, description' },
        { status: 400 }
      );
    }

    // Record breach
    const breachId = await recordSecurityBreach({
      isBreachDetected: true,
      severity,
      breachType,
      affectedRecords: affectedRecords || 0,
      affectedUsers: affectedUsers || [],
      description,
      mitigationSteps: mitigationSteps || [],
    });

    // Auto-notify if requested
    if (autoNotify && (severity === 'CRITICAL' || severity === 'HIGH')) {
      await notifySecurityBreach(breachId);
    }

    return NextResponse.json({
      success: true,
      breachId,
      message: autoNotify
        ? 'Breach recorded and notifications sent'
        : 'Breach recorded (notifications not sent)',
    });
  } catch (error) {
    console.error('[BREACH API] Error recording breach:', error);
    return NextResponse.json(
      { error: 'Failed to record breach' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/security/breaches/[id]
 * Update breach status
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const body = await request.json();
    const { breachId, action, rootCause, additionalMitigationSteps } = body;

    if (!breachId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: breachId, action' },
        { status: 400 }
      );
    }

    const breach = await prisma.securityBreach.findUnique({
      where: { id: breachId },
    });

    if (!breach) {
      return NextResponse.json({ error: 'Breach not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'notify':
        await notifySecurityBreach(breachId);
        break;

      case 'notify_dpb':
        await notifyDataProtectionBoard(breachId);
        break;

      case 'resolve':
        updateData = {
          resolvedAt: new Date(),
          rootCause: rootCause || null,
        };
        break;

      case 'add_mitigation':
        const existingSteps = (breach.mitigationSteps as string[]) || [];
        updateData = {
          mitigationSteps: [
            ...existingSteps,
            ...(additionalMitigationSteps || []),
          ],
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.securityBreach.update({
        where: { id: breachId },
        data: updateData,
      });
    }

    // Log the action
    await prisma.dataRetentionLog.create({
      data: {
        recordType: 'security_breach',
        recordId: breachId,
        action,
        reason: 'admin_action',
        details: { rootCause, additionalMitigationSteps },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Breach ${action} completed`,
    });
  } catch (error) {
    console.error('[BREACH API] Error updating breach:', error);
    return NextResponse.json(
      { error: 'Failed to update breach' },
      { status: 500 }
    );
  }
}

