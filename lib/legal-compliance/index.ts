/**
 * NEW FILE: Legal Compliance Utility Library
 * Purpose: Core utilities for DPDPA 2023, GDPR, CCPA compliance enforcement
 * Provides: Version checking, acceptance tracking, audit logging, SLA monitoring
 * 
 * This library ensures that every promise in legal documents is enforced by code:
 * - No user can access the site without accepting latest legal terms
 * - Every acceptance is logged with IP, timestamp, user agent
 * - Version changes trigger re-acceptance requirements
 * - Complete audit trail for legal defense
 */

import { prisma } from '@/lib/prisma';

// Current legal document versions (INCREMENT WHEN DOCUMENTS CHANGE)
export const LEGAL_VERSIONS = {
  TERMS: '2.0',
  PRIVACY: '2.0',
  REFUND: '2.0',
  FOOD_SAFETY: '2.0',
  IP_PROTECTION: '1.0',
  REFERRAL_TERMS: '1.0',
} as const;

export type LegalDocumentType = keyof typeof LEGAL_VERSIONS;

// Required documents that block access if not accepted
export const MANDATORY_DOCUMENTS: LegalDocumentType[] = ['TERMS', 'PRIVACY', 'REFUND', 'FOOD_SAFETY'];

/**
 * Check if user has accepted all mandatory legal documents (latest versions)
 * 
 * CRITICAL FIX: Check by sessionId primarily (persists across login/logout)
 * Falls back to userId if no sessionId provided
 * 
 * @param userId - User ID (if logged in)
 * @param sessionId - Browser session ID (for guest users)
 * @returns true if all mandatory documents accepted, false otherwise
 */
export async function hasAcceptedAllLegalDocuments(
  userId: string | null,
  sessionId: string
): Promise<boolean> {
  try {
    // Get all acceptances for this user/session
    // PRIORITY: sessionId (persists in localStorage) > userId (might change)
    const acceptances = await prisma.legalAcceptance.findMany({
      where: {
        OR: [
          { sessionId }, // Check by sessionId first (localStorage)
          { userId: userId || undefined }, // Then by userId if logged in
        ],
      },
      orderBy: { acceptedAt: 'desc' },
    });

    // Check each mandatory document
    for (const docType of MANDATORY_DOCUMENTS) {
      const currentVersion = LEGAL_VERSIONS[docType];
      const hasAccepted = acceptances.some(
        (a) => a.documentType === docType && a.version === currentVersion
      );

      if (!hasAccepted) {
        return false; // Missing acceptance for this document
      }
    }

    return true; // All mandatory documents accepted
  } catch (error) {
    console.error('[Legal Compliance] Error checking acceptance status:', error);
    return false; // Fail-safe: require acceptance if check fails
  }
}

/**
 * Record legal document acceptance with full audit trail
 * 
 * @param data - Acceptance details
 * @returns Created acceptance record
 */
export async function recordLegalAcceptance(data: {
  userId: string | null;
  sessionId: string;
  documentType: LegalDocumentType;
  ipAddress: string;
  userAgent: string;
  acceptMethod: 'MODAL' | 'CHECKBOX' | 'SIGNUP';
}) {
  const version = LEGAL_VERSIONS[data.documentType];

  return await prisma.legalAcceptance.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      documentType: data.documentType,
      version,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      acceptMethod: data.acceptMethod,
    },
  });
}

/**
 * Get user's legal acceptance history
 * 
 * @param userId - User ID (if logged in)
 * @param sessionId - Browser session ID
 * @returns Array of acceptances with version info
 */
export async function getLegalAcceptanceHistory(
  userId: string | null,
  sessionId: string
) {
  const acceptances = await prisma.legalAcceptance.findMany({
    where: {
      OR: [
        { userId: userId || undefined },
        { sessionId },
      ],
    },
    orderBy: { acceptedAt: 'desc' },
  });

  return acceptances.map((a) => ({
    ...a,
    currentVersion: LEGAL_VERSIONS[a.documentType as LegalDocumentType],
    isOutdated: a.version !== LEGAL_VERSIONS[a.documentType as LegalDocumentType],
  }));
}

/**
 * Check if user needs to re-accept documents (version changed)
 * 
 * @param userId - User ID (if logged in)
 * @param sessionId - Browser session ID
 * @returns Array of document types that need re-acceptance
 */
export async function getOutdatedAcceptances(
  userId: string | null,
  sessionId: string
): Promise<LegalDocumentType[]> {
  const history = await getLegalAcceptanceHistory(userId, sessionId);
  const outdated: LegalDocumentType[] = [];

  for (const docType of MANDATORY_DOCUMENTS) {
    const latest = history.find((h) => h.documentType === docType);
    if (!latest || latest.isOutdated) {
      outdated.push(docType);
    }
  }

  return outdated;
}

/**
 * Get session ID from request headers (browser fingerprint)
 * Uses a combination of user agent and IP for session identification
 * 
 * @param req - Request object
 * @returns Session ID
 */
export function getSessionId(req: { headers: Headers }): string {
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Simple hash for session ID (in production, use a proper session management library)
  return Buffer.from(`${userAgent}-${ip}`).toString('base64').slice(0, 32);
}

/**
 * Get client IP address from request headers
 * 
 * @param req - Request object
 * @returns IP address
 */
export function getClientIp(req: { headers: Headers }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get user agent from request headers
 * 
 * @param req - Request object
 * @returns User agent string
 */
export function getUserAgent(req: { headers: Headers }): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Generate legal document URL
 * 
 * @param docType - Document type
 * @returns URL path to legal document
 */
export function getLegalDocumentUrl(docType: LegalDocumentType): string {
  const urlMap: Record<LegalDocumentType, string> = {
    TERMS: '/legal/terms-of-service',
    PRIVACY: '/legal/privacy-policy',
    REFUND: '/legal/refund-policy',
    FOOD_SAFETY: '/legal/food-safety',
    IP_PROTECTION: '/legal/ip-protection',
    REFERRAL_TERMS: '/legal/referral-terms',
  };
  return urlMap[docType];
}

/**
 * Generate human-readable document title
 * 
 * @param docType - Document type
 * @returns Formatted title
 */
export function getLegalDocumentTitle(docType: LegalDocumentType): string {
  const titleMap: Record<LegalDocumentType, string> = {
    TERMS: 'Terms of Service',
    PRIVACY: 'Privacy Policy',
    REFUND: 'Refund Policy',
    FOOD_SAFETY: 'Food Safety & Hygiene',
    IP_PROTECTION: 'Intellectual Property Protection',
    REFERRAL_TERMS: 'Referral Program Terms',
  };
  return titleMap[docType];
}

/**
 * Calculate SLA deadline (for DPO requests, data retention, etc.)
 * 
 * @param startDate - Start date
 * @param days - Number of days
 * @returns Deadline date
 */
export function calculateSLADeadline(startDate: Date, days: number): Date {
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

/**
 * Check if SLA is approaching or overdue
 * 
 * @param deadline - SLA deadline
 * @returns Status: 'OVERDUE', 'CRITICAL' (< 2 days), 'WARNING' (< 7 days), 'OK'
 */
export function checkSLAStatus(deadline: Date): 'OVERDUE' | 'CRITICAL' | 'WARNING' | 'OK' {
  const now = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'OVERDUE';
  if (daysRemaining < 2) return 'CRITICAL';
  if (daysRemaining < 7) return 'WARNING';
  return 'OK';
}

/**
 * Format SLA deadline for display
 * 
 * @param deadline - SLA deadline
 * @returns Human-readable string
 */
export function formatSLADeadline(deadline: Date): string {
  const now = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return `OVERDUE by ${Math.abs(daysRemaining)} days`;
  } else if (daysRemaining === 0) {
    return 'Due TODAY';
  } else if (daysRemaining === 1) {
    return 'Due TOMORROW';
  } else {
    return `${daysRemaining} days remaining`;
  }
}
