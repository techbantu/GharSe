/**
 * NEW FILE: User Deletion Request API
 * Purpose: Handle user data deletion requests (Right to Erasure)
 * 
 * Endpoints:
 * - POST: Create deletion request
 * - DELETE: Cancel deletion request
 * - GET: Get deletion request status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createDeletionRequest,
  cancelDeletionRequest,
  getDeletionStats,
} from '@/lib/legal-compliance/deletion-workflow';
import { prisma } from '@/lib/prisma';
import { verifyUserAuth } from '@/lib/auth-helpers';

/**
 * POST /api/user/deletion-request
 * Create a new deletion request (USER)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create deletion request
    const result = await createDeletionRequest({
      userId: auth.user.id,
      reason,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          legalHolds: result.legalHolds,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deletion request created successfully',
      gracePeriodEnds: result.gracePeriodEnds,
    }, { status: 201 });

  } catch (error) {
    console.error('[DELETION API] Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/deletion-request
 * Cancel deletion request (USER)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify user authentication
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Cancel deletion request
    const result = await cancelDeletionRequest(auth.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deletion request cancelled successfully',
    });

  } catch (error) {
    console.error('[DELETION API] Error cancelling request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/deletion-request
 * Get deletion request status (USER or ADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      // Admin: Get all deletion requests
      const [requests, stats] = await Promise.all([
        prisma.userDeletionRequest.findMany({
          orderBy: {
            requestedAt: 'desc',
          },
          take: 100,
        }),
        getDeletionStats(),
      ]);

      // Fetch user details for each request
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const user = await prisma.customer.findUnique({
            where: { id: request.userId },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });

          // Calculate days remaining
          const now = new Date();
          const gracePeriodEnds = new Date(request.gracePeriodEnds);
          const daysRemaining = Math.ceil((gracePeriodEnds.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

          return {
            ...request,
            user,
            daysRemaining,
          };
        })
      );

      return NextResponse.json({
        success: true,
        requests: requestsWithUsers,
        stats,
      });
    } else {
      // User: Get own deletion request
      const auth = await verifyUserAuth(request);
      if (!auth.isAuthenticated || !auth.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const deletionRequest = await prisma.userDeletionRequest.findUnique({
        where: { userId: auth.user.id },
      });

      if (!deletionRequest) {
        return NextResponse.json({
          success: true,
          request: null,
        });
      }

      // Calculate days remaining
      const now = new Date();
      const gracePeriodEnds = new Date(deletionRequest.gracePeriodEnds);
      const daysRemaining = Math.ceil((gracePeriodEnds.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      return NextResponse.json({
        success: true,
        request: {
          ...deletionRequest,
          daysRemaining,
        },
      });
    }

  } catch (error) {
    console.error('[DELETION API] Error fetching request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
