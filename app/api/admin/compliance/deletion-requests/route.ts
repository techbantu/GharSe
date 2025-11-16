/**
 * Admin Deletion Request Management API
 * Purpose: Approve/reject user deletion requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit/logger';
import { executeDeletion } from '@/lib/legal-compliance/deletion-workflow';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, justification, reason } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action required' },
        { status: 400 }
      );
    }

    const deletionRequest = await prisma.userDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      );
    }

    if (deletionRequest.executedAt) {
      return NextResponse.json(
        { error: 'Deletion already executed' },
        { status: 400 }
      );
    }

    if (deletionRequest.cancelledAt) {
      return NextResponse.json(
        { error: 'Deletion already cancelled' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Execute deletion immediately (admin override)
      const result = await executeDeletion(deletionRequest.userId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to execute deletion' },
          { status: 500 }
        );
      }

      // Update request
      await prisma.userDeletionRequest.update({
        where: { id: requestId },
        data: {
          executedAt: new Date(),
        },
      });

      // Log audit
      await logAudit({
        action: 'DELETION_EXECUTED',
        entityType: 'user',
        entityId: deletionRequest.userId,
        userId: deletionRequest.userId,
        details: {
          adminOverride: true,
          justification: justification || 'No justification provided',
          hadLegalHold: deletionRequest.hasLegalHold,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Deletion approved and executed',
      });
    } else if (action === 'reject') {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: 'Rejection reason required' },
          { status: 400 }
        );
      }

      // Cancel the deletion request
      await prisma.userDeletionRequest.update({
        where: { id: requestId },
        data: {
          cancelledAt: new Date(),
        },
      });

      // Log audit
      await logAudit({
        action: 'DELETION_CANCELLED',
        entityType: 'user',
        entityId: deletionRequest.userId,
        userId: deletionRequest.userId,
        details: {
          rejectionReason: reason.trim(),
          hadLegalHold: deletionRequest.hasLegalHold,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Deletion request rejected',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[DELETION ADMIN API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

