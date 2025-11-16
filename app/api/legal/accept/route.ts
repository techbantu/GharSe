/**
 * NEW FILE: Legal Acceptance API
 * Purpose: Record user acceptance of legal documents with full audit trail
 * Compliance: DPDPA 2023 § 7 (Consent), GDPR Art. 7 (Conditions for consent)
 * 
 * This endpoint ensures:
 * - Every acceptance is logged with IP, timestamp, user agent
 * - Cannot accept outdated versions (enforces latest)
 * - Supports both logged-in users and guest sessions
 * - Complete audit trail for legal defense
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordLegalAcceptance,
  getSessionId,
  getClientIp,
  getUserAgent,
  LEGAL_VERSIONS,
  type LegalDocumentType,
} from '@/lib/legal-compliance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId: providedSessionId, documentTypes, acceptMethod, acceptAll } = body;

    // Get session and tracking info
    const sessionId = providedSessionId || getSessionId(req);
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Determine accept method
    const method = acceptMethod || 'MODAL';

    // Determine which documents to accept
    let docsToAccept: LegalDocumentType[] = [];
    
    if (acceptAll) {
      // Accept all mandatory documents
      const { MANDATORY_DOCUMENTS } = await import('@/lib/legal-compliance');
      docsToAccept = [...MANDATORY_DOCUMENTS];
    } else if (documentTypes && Array.isArray(documentTypes)) {
      docsToAccept = documentTypes;
    } else {
      return NextResponse.json(
        { error: 'Missing documentTypes or acceptAll parameter' },
        { status: 400 }
      );
    }

    if (docsToAccept.length === 0) {
      return NextResponse.json(
        { error: 'No documents to accept' },
        { status: 400 }
      );
    }

    // Record acceptance for each document
    const acceptances = [];
    for (const docType of docsToAccept) {
      if (!LEGAL_VERSIONS[docType as LegalDocumentType]) {
        return NextResponse.json(
          { error: `Invalid document type: ${docType}` },
          { status: 400 }
        );
      }

      const acceptance = await recordLegalAcceptance({
        userId: userId || null,
        sessionId,
        documentType: docType as LegalDocumentType,
        ipAddress,
        userAgent,
        acceptMethod: method as 'MODAL' | 'CHECKBOX' | 'SIGNUP',
      });

      acceptances.push(acceptance);
    }

    return NextResponse.json({
      success: true,
      acceptances: acceptances.map((a) => ({
        id: a.id,
        documentType: a.documentType,
        version: a.version,
        acceptedAt: a.acceptedAt,
      })),
    });
  } catch (error) {
    console.error('[Legal Acceptance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record legal acceptance' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint: Check user's acceptance status
 * 
 * CRITICAL FIX: Accept sessionId from query params (client localStorage)
 * instead of generating a new one on every request (which causes mismatch)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId') || getSessionId(req); // Use client's sessionId

    const { hasAcceptedAllLegalDocuments, getOutdatedAcceptances } = await import('@/lib/legal-compliance');

    const hasAccepted = await hasAcceptedAllLegalDocuments(userId, sessionId);
    const outdated = await getOutdatedAcceptances(userId, sessionId);

    return NextResponse.json({
      hasAccepted,
      outdatedDocuments: outdated,
    });
  } catch (error) {
    console.error('[Legal Acceptance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check acceptance status' },
      { status: 500 }
    );
  }
}
