/**
 * NEW FILE: Version Change Notification API
 * Purpose: Admin endpoint to trigger version change notifications
 * Access: Admin-only (requires authentication)
 * 
 * Usage: When LEGAL_VERSIONS is updated in code, admin calls this endpoint
 * to notify all affected users and require re-acceptance.
 * 
 * Example:
 * POST /api/legal/version-notify
 * {
 *   "documentType": "PRIVACY",
 *   "oldVersion": "1.0",
 *   "changes": "Updated data retention period from 5 to 7 years"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { triggerVersionChangeNotification } from '@/lib/legal-compliance/version-manager';
import { LEGAL_VERSIONS, type LegalDocumentType } from '@/lib/legal-compliance';
import { verifyAdminAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.isAuthenticated || !authResult.admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { documentType, oldVersion, changes } = body;

    // Validate input
    if (!documentType || !LEGAL_VERSIONS[documentType as LegalDocumentType]) {
      return NextResponse.json(
        { error: 'Invalid documentType' },
        { status: 400 }
      );
    }

    if (!oldVersion) {
      return NextResponse.json(
        { error: 'Missing oldVersion' },
        { status: 400 }
      );
    }

    if (!changes) {
      return NextResponse.json(
        { error: 'Missing changes description' },
        { status: 400 }
      );
    }

    const currentVersion = LEGAL_VERSIONS[documentType as LegalDocumentType];
    if (oldVersion === currentVersion) {
      return NextResponse.json(
        { error: `Current version is still ${currentVersion}. Update LEGAL_VERSIONS first.` },
        { status: 400 }
      );
    }

    // Trigger notification
    const result = await triggerVersionChangeNotification(
      documentType as LegalDocumentType,
      oldVersion,
      changes
    );

    return NextResponse.json({
      success: true,
      documentType,
      oldVersion,
      newVersion: currentVersion,
      usersNotified: result.notified,
      message: `Successfully notified ${result.notified} users about ${documentType} version change`,
    });
  } catch (error) {
    console.error('[Version Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger version notifications' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint: View version statistics
 * Shows how many users are on outdated versions
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.isAuthenticated || !authResult.admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { getAcceptanceStatistics, getVersionHistory } = await import('@/lib/legal-compliance/version-manager');
    
    const stats = await getAcceptanceStatistics();
    
    // Get version history for each document
    const history: Record<string, any> = {};
    for (const docType of Object.keys(LEGAL_VERSIONS) as LegalDocumentType[]) {
      history[docType] = await getVersionHistory(docType);
    }

    return NextResponse.json({
      currentVersions: LEGAL_VERSIONS,
      statistics: stats,
      versionHistory: history,
    });
  } catch (error) {
    console.error('[Version Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version statistics' },
      { status: 500 }
    );
  }
}

