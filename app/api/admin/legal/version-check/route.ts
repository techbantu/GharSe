/**
 * LEGAL VERSION CHECK API ENDPOINT
 * Purpose: Admin endpoint to check for version changes and notify users
 * POST /api/admin/legal/version-check
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  detectVersionChanges,
  handleVersionUpdate,
} from '@/lib/legal-compliance/version-monitor';

// Admin authentication helper (simplified - enhance with proper JWT validation)
async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  // TODO: Implement proper admin JWT validation
  return !!token;
}

// GET: Check for version changes without sending notifications
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const changes = await detectVersionChanges();

    return NextResponse.json({
      success: true,
      hasChanges: changes.hasChanges,
      changedDocuments: changes.changedDocuments,
      affectedUsers: changes.affectedUsers,
      message: changes.hasChanges
        ? `${changes.changedDocuments.length} document(s) updated, ${changes.affectedUsers} user(s) need notification`
        : 'All users are on the latest versions',
    });
  } catch (error) {
    console.error('[VERSION CHECK API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check version changes' },
      { status: 500 }
    );
  }
}

// POST: Process version update (send notifications)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await handleVersionUpdate();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        details: result.details,
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[VERSION CHECK API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process version update' },
      { status: 500 }
    );
  }
}

