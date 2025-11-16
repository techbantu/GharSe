/**
 * NEW FILE: DPO Request API Endpoint
 * Purpose: Public + Admin endpoints for DPO request management
 * 
 * Public Endpoints:
 * - POST: Submit new DPO request
 * - GET: Check request status by reference number
 * 
 * Admin Endpoints:
 * - GET: List all DPO requests (with filters)
 * - PATCH: Update request status / send response
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDPORequest, respondToDPORequest, getDPORequestStats } from '@/lib/legal-compliance/dpo-requests';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/legal/dpo-request
 * Submit new DPO request (PUBLIC)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, requestType, description } = body;

    // Validation
    if (!email || !requestType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: email, requestType, description' },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Get IP and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create DPO request
    const result = await createDPORequest({
      email,
      phone,
      requestType,
      description,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'DPO request submitted successfully',
      requestId: result.requestId,
      referenceNumber: result.requestId?.substring(0, 8).toUpperCase(),
      dueDate: result.dueDate,
    }, { status: 201 });

  } catch (error) {
    console.error('[DPO API] Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/legal/dpo-request
 * List DPO requests (ADMIN) or check status (PUBLIC with reference number)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceNumber = searchParams.get('ref');
    const isAdmin = searchParams.get('admin') === 'true';

    // Public: Check request status by reference number
    if (referenceNumber && !isAdmin) {
      const requests = await prisma.dPORequest.findMany({
        where: {
          id: {
            startsWith: referenceNumber.toLowerCase(),
          },
        },
        select: {
          id: true,
          requestType: true,
          requestedAt: true,
          dueDate: true,
          status: true,
          acknowledgedAt: true,
          respondedAt: true,
          isOverdue: true,
        },
        take: 1,
      });

      if (requests.length === 0) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        request: requests[0],
      });
    }

    // Admin: List all requests
    if (isAdmin) {
      // TODO: Add admin authentication check
      // const auth = await verifyAdminAuth(request);
      // if (!auth.isAuthenticated) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // }

      const status = searchParams.get('status');
      const requestType = searchParams.get('type');
      const overdue = searchParams.get('overdue') === 'true';

      const where: any = {};
      if (status) where.status = status;
      if (requestType) where.requestType = requestType;
      if (overdue) where.isOverdue = true;

      const [requests, stats] = await Promise.all([
        prisma.dPORequest.findMany({
          where,
          orderBy: {
            requestedAt: 'desc',
          },
          take: 100,
        }),
        getDPORequestStats(),
      ]);

      // Calculate days remaining for each request
      const requestsWithSLA = requests.map((request) => {
        const now = new Date();
        const dueDate = new Date(request.dueDate);
        const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        return {
          ...request,
          daysRemaining,
          referenceNumber: request.id.substring(0, 8).toUpperCase(),
        };
      });

      return NextResponse.json({
        success: true,
        requests: requestsWithSLA,
        stats,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[DPO API] Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/legal/dpo-request
 * Update request status / send response (ADMIN)
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const auth = await verifyAdminAuth(request);
    // if (!auth.isAuthenticated) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { requestId, action, response, status } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, action' },
        { status: 400 }
      );
    }

    const dpoRequest = await prisma.dPORequest.findUnique({
      where: { id: requestId },
    });

    if (!dpoRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'respond':
        if (!response) {
          return NextResponse.json(
            { error: 'Response text required' },
            { status: 400 }
          );
        }

        const result = await respondToDPORequest(
          requestId,
          response,
          'admin' // TODO: Use actual admin ID from auth
        );

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Response sent successfully',
        });

      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status required' },
            { status: 400 }
          );
        }

        await prisma.dPORequest.update({
          where: { id: requestId },
          data: { status },
        });

        return NextResponse.json({
          success: true,
          message: 'Status updated successfully',
        });

      case 'acknowledge':
        await prisma.dPORequest.update({
          where: { id: requestId },
          data: { acknowledgedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          message: 'Request acknowledged',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[DPO API] Error updating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

