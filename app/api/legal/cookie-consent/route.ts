/**
 * NEW FILE: Cookie Consent API
 * Purpose: Record, retrieve, and manage cookie consent preferences
 * Compliance: GDPR Art. 7 (Conditions for consent), ePrivacy Directive, DPDPA 2023
 * 
 * Endpoints:
 * - POST /api/legal/cookie-consent - Record consent preferences
 * - GET /api/legal/cookie-consent - Get user's current preferences
 * - DELETE /api/legal/cookie-consent - Withdraw consent
 * 
 * Features:
 * - Granular consent (Essential, Analytics, Marketing)
 * - Session and user tracking
 * - IP address and user agent logging
 * - Consent withdrawal (right to object)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionId, getClientIp, getUserAgent } from '@/lib/legal-compliance';

/**
 * POST: Record cookie consent preferences
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId: providedSessionId, preferences } = body;

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid preferences' },
        { status: 400 }
      );
    }

    const { essential, analytics, marketing } = preferences;

    // Essential cookies are always true
    if (essential !== true) {
      return NextResponse.json(
        { error: 'Essential cookies must be enabled' },
        { status: 400 }
      );
    }

    // Get session and tracking info
    const sessionId = providedSessionId || getSessionId(req);
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Check if consent already exists for this user/session
    const existing = await prisma.cookieConsent.findFirst({
      where: {
        OR: [
          { userId: userId || undefined },
          { sessionId },
        ],
        withdrawnAt: null,
      },
      orderBy: { consentedAt: 'desc' },
    });

    if (existing) {
      // Update existing consent
      const updated = await prisma.cookieConsent.update({
        where: { id: existing.id },
        data: {
          essential: true,
          analytics: analytics === true,
          marketing: marketing === true,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json({
        success: true,
        consent: {
          id: updated.id,
          essential: updated.essential,
          analytics: updated.analytics,
          marketing: updated.marketing,
          consentedAt: updated.consentedAt,
          lastUpdated: updated.lastUpdated,
        },
      });
    }

    // Create new consent record
    const consent = await prisma.cookieConsent.create({
      data: {
        userId: userId || null,
        sessionId,
        essential: true,
        analytics: analytics === true,
        marketing: marketing === true,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      consent: {
        id: consent.id,
        essential: consent.essential,
        analytics: consent.analytics,
        marketing: consent.marketing,
        consentedAt: consent.consentedAt,
      },
    });
  } catch (error) {
    console.error('[Cookie Consent API] Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record cookie consent' },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve user's current cookie preferences
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = getSessionId(req);

    // Find most recent consent record
    const consent = await prisma.cookieConsent.findFirst({
      where: {
        OR: [
          { userId: userId || undefined },
          { sessionId },
        ],
        withdrawnAt: null,
      },
      orderBy: { consentedAt: 'desc' },
    });

    if (!consent) {
      return NextResponse.json({
        hasConsent: false,
        preferences: {
          essential: true,
          analytics: false,
          marketing: false,
        },
      });
    }

    return NextResponse.json({
      hasConsent: true,
      preferences: {
        essential: consent.essential,
        analytics: consent.analytics,
        marketing: consent.marketing,
      },
      consentedAt: consent.consentedAt,
      lastUpdated: consent.lastUpdated,
    });
  } catch (error) {
    console.error('[Cookie Consent API] Error retrieving consent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cookie consent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Withdraw cookie consent (right to object)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = getSessionId(req);

    // Find active consent records
    const consents = await prisma.cookieConsent.findMany({
      where: {
        OR: [
          { userId: userId || undefined },
          { sessionId },
        ],
        withdrawnAt: null,
      },
    });

    if (consents.length === 0) {
      return NextResponse.json(
        { error: 'No active consent found' },
        { status: 404 }
      );
    }

    // Mark all as withdrawn
    const now = new Date();
    await Promise.all(
      consents.map((consent) =>
        prisma.cookieConsent.update({
          where: { id: consent.id },
          data: { withdrawnAt: now },
        })
      )
    );

    // Create new consent with essential-only
    await prisma.cookieConsent.create({
      data: {
        userId: userId || null,
        sessionId,
        essential: true,
        analytics: false,
        marketing: false,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cookie consent withdrawn. Essential cookies remain enabled.',
    });
  } catch (error) {
    console.error('[Cookie Consent API] Error withdrawing consent:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw cookie consent' },
      { status: 500 }
    );
  }
}
