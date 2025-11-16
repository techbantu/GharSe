/**
 * NEW FILE: Legal Document Version Manager
 * Purpose: Monitors legal document version changes and enforces re-acceptance
 * Compliance: GDPR Art. 7(3) (Right to withdraw consent), DPDPA 2023 § 7
 * 
 * Features:
 * - Detects version changes in LEGAL_VERSIONS
 * - Sends email notifications to affected users
 * - Requires re-acceptance of updated documents
 * - Maintains version history for audit trail
 * 
 * When a legal document version is updated in LEGAL_VERSIONS:
 * 1. All users who accepted the old version must re-accept
 * 2. Email notifications are sent explaining the changes
 * 3. Users are blocked from site access until re-acceptance
 * 4. Complete audit trail is maintained
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { 
  LEGAL_VERSIONS, 
  type LegalDocumentType,
  getLegalDocumentTitle,
  getLegalDocumentUrl,
} from '@/lib/legal-compliance';

/**
 * Version change notification email template
 * 
 * @param documentType - Type of legal document
 * @param oldVersion - Previous version
 * @param newVersion - New version
 * @param changes - Summary of changes
 * @returns Email HTML content
 */
function getVersionChangeEmailHtml(
  documentType: LegalDocumentType,
  oldVersion: string,
  newVersion: string,
  changes: string
): string {
  const title = getLegalDocumentTitle(documentType);
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${getLegalDocumentUrl(documentType)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legal Document Updated</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Important: Legal Document Updated</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear Valued Customer,</p>
    
    <div style="background: #FFF7ED; border-left: 4px solid #F97316; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0; font-weight: 600; color: #F97316;">
        We have updated our <strong>${title}</strong>
      </p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #6B7280;">
        Version ${oldVersion} → <strong>Version ${newVersion}</strong>
      </p>
    </div>
    
    <h2 style="color: #111; font-size: 18px; margin-top: 25px;">What Changed?</h2>
    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #374151; white-space: pre-line;">${changes}</p>
    </div>
    
    <h2 style="color: #111; font-size: 18px; margin-top: 25px;">Action Required</h2>
    <p style="font-size: 14px; margin-bottom: 15px;">
      As required by law (DPDPA 2023 § 7), we need your explicit consent to continue using our services under the updated terms.
    </p>
    
    <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 14px; color: #991B1B; font-weight: 600;">
        ⚠️ You will need to review and accept the updated document on your next visit to our website.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Review Updated Document
      </a>
    </div>
    
    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #E5E7EB;">
      <h3 style="color: #111; font-size: 16px; margin-top: 0;">Your Rights</h3>
      <ul style="font-size: 14px; color: #4B5563; padding-left: 20px; margin: 10px 0;">
        <li style="margin-bottom: 8px;">You have the right to withdraw consent at any time</li>
        <li style="margin-bottom: 8px;">You can request deletion of your data (30-day grace period)</li>
        <li style="margin-bottom: 8px;">You can access all your personal data we hold</li>
        <li style="margin-bottom: 8px;">You can correct any inaccurate data</li>
      </ul>
      <p style="font-size: 13px; color: #6B7280; margin-bottom: 0;">
        For data rights requests, contact our Data Protection Officer at 
        <a href="mailto:privacy@gharse.app" style="color: #F97316; text-decoration: none;">privacy@gharse.app</a>
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
    
    <p style="font-size: 13px; color: #6B7280; text-align: center; margin: 20px 0 0 0;">
      GharSe - From Real Homes To Your Hungry Heart<br>
      Hayatnagar, Hyderabad 501505<br>
      <a href="tel:+919010460964" style="color: #F97316; text-decoration: none;">+91 90104 60964</a> | 
      <a href="mailto:orders@gharse.app" style="color: #F97316; text-decoration: none;">orders@gharse.app</a>
    </p>
    
    <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 15px 0 0 0;">
      This is a mandatory legal notification required by law.<br>
      You are receiving this because you have an account with us or have placed an order.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Send version change notification to a user
 * 
 * @param email - User email
 * @param name - User name
 * @param documentType - Type of document that changed
 * @param oldVersion - Previous version
 * @param newVersion - New version
 * @param changes - Summary of changes
 */
export async function sendVersionChangeNotification(
  email: string,
  name: string,
  documentType: LegalDocumentType,
  oldVersion: string,
  newVersion: string,
  changes: string
): Promise<void> {
  const title = getLegalDocumentTitle(documentType);
  
  try {
    await sendEmail({
      to: email,
      subject: `Action Required: ${title} Updated (v${oldVersion} → v${newVersion})`,
      html: getVersionChangeEmailHtml(documentType, oldVersion, newVersion, changes),
    });
    
    console.log(`[Version Monitor] Sent notification to ${email} for ${documentType} v${oldVersion} → v${newVersion}`);
  } catch (error) {
    console.error(`[Version Monitor] Failed to send notification to ${email}:`, error);
    // Don't throw - email failure should not break the version update process
  }
}

/**
 * Notify all users who accepted an outdated version
 * This should be run AFTER updating LEGAL_VERSIONS in the code
 * 
 * @param documentType - Type of document that changed
 * @param oldVersion - Previous version (before LEGAL_VERSIONS was updated)
 * @param changes - Summary of changes for email
 */
export async function notifyUsersOfVersionChange(
  documentType: LegalDocumentType,
  oldVersion: string,
  changes: string
): Promise<void> {
  const newVersion = LEGAL_VERSIONS[documentType];
  
  console.log(`[Version Monitor] Notifying users of ${documentType} version change: v${oldVersion} → v${newVersion}`);
  
  try {
    // Find all users who accepted the old version
    const oldAcceptances = await prisma.legalAcceptance.findMany({
      where: {
        documentType,
        version: oldVersion,
      },
      distinct: ['userId', 'sessionId'],
      orderBy: { acceptedAt: 'desc' },
    });
    
    console.log(`[Version Monitor] Found ${oldAcceptances.length} users with outdated acceptance`);
    
    // Get unique user IDs (filter out null and duplicates)
    const userIds = [...new Set(oldAcceptances
      .map(a => a.userId)
      .filter((id): id is string => id !== null))];
    
    // Fetch user emails from Customer table
    const users = await prisma.customer.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    
    console.log(`[Version Monitor] Found ${users.length} registered users to notify`);
    
    // Send emails to all affected users
    const emailPromises = users.map(user =>
      sendVersionChangeNotification(
        user.email,
        user.name,
        documentType,
        oldVersion,
        newVersion,
        changes
      )
    );
    
    await Promise.allSettled(emailPromises); // Don't fail if some emails fail
    
    console.log(`[Version Monitor] Version change notifications sent for ${documentType}`);
  } catch (error) {
    console.error(`[Version Monitor] Error notifying users:`, error);
    throw error;
  }
}

/**
 * Check if any user has outdated acceptances and needs to re-accept
 * This is called automatically by the LegalAcceptanceModal
 * 
 * @param userId - User ID (if logged in)
 * @param sessionId - Session ID
 * @returns Array of document types that need re-acceptance
 */
export async function getOutdatedDocuments(
  userId: string | null,
  sessionId: string
): Promise<Array<{ documentType: LegalDocumentType; currentVersion: string; acceptedVersion: string }>> {
  try {
    const acceptances = await prisma.legalAcceptance.findMany({
      where: {
        OR: [
          { userId: userId || undefined },
          { sessionId },
        ],
      },
      orderBy: { acceptedAt: 'desc' },
      distinct: ['documentType'],
    });
    
    const outdated: Array<{ documentType: LegalDocumentType; currentVersion: string; acceptedVersion: string }> = [];
    
    for (const acceptance of acceptances) {
      const currentVersion = LEGAL_VERSIONS[acceptance.documentType as LegalDocumentType];
      if (currentVersion && acceptance.version !== currentVersion) {
        outdated.push({
          documentType: acceptance.documentType as LegalDocumentType,
          currentVersion,
          acceptedVersion: acceptance.version,
        });
      }
    }
    
    return outdated;
  } catch (error) {
    console.error('[Version Monitor] Error checking outdated documents:', error);
    return []; // Fail-safe: return empty array
  }
}

/**
 * Admin tool: Manually trigger version change notification
 * Use this after updating LEGAL_VERSIONS to notify all affected users
 * 
 * Example usage:
 * ```typescript
 * await triggerVersionChangeNotification('PRIVACY', '2.0', 
 *   'Updated data retention policy from 5 years to 7 years for tax compliance');
 * ```
 * 
 * @param documentType - Document that was updated
 * @param oldVersion - Previous version (before update)
 * @param changes - Human-readable summary of changes
 */
export async function triggerVersionChangeNotification(
  documentType: LegalDocumentType,
  oldVersion: string,
  changes: string
): Promise<{ notified: number; failed: number }> {
  console.log(`[Version Monitor] Triggering notification for ${documentType} v${oldVersion} → v${LEGAL_VERSIONS[documentType]}`);
  
  await notifyUsersOfVersionChange(documentType, oldVersion, changes);
  
  // Count how many users were notified
  const oldAcceptances = await prisma.legalAcceptance.findMany({
    where: {
      documentType,
      version: oldVersion,
    },
    distinct: ['userId'],
  });
  
  const userIds = oldAcceptances
    .map(a => a.userId)
    .filter((id): id is string => id !== null);
  
  const users = await prisma.customer.findMany({
    where: { id: { in: userIds } },
  });
  
  return {
    notified: users.length,
    failed: 0, // We use Promise.allSettled, so we don't track individual failures
  };
}

/**
 * Get version history for a document type
 * Shows all unique versions that have been accepted
 * 
 * @param documentType - Document type
 * @returns Array of versions with acceptance counts
 */
export async function getVersionHistory(documentType: LegalDocumentType) {
  const acceptances = await prisma.legalAcceptance.groupBy({
    by: ['version'],
    where: { documentType },
    _count: { version: true },
    orderBy: { version: 'desc' },
  });
  
  return acceptances.map(a => ({
    version: a.version,
    acceptanceCount: a._count.version,
    isCurrent: a.version === LEGAL_VERSIONS[documentType],
  }));
}

/**
 * Get statistics on acceptance status across all users
 * Useful for admin dashboard
 * 
 * @returns Statistics object
 */
export async function getAcceptanceStatistics() {
  const totalUsers = await prisma.customer.count();
  
  const stats: Record<LegalDocumentType, {
    total: number;
    current: number;
    outdated: number;
    percentage: number;
  }> = {} as any;
  
  for (const docType of Object.keys(LEGAL_VERSIONS) as LegalDocumentType[]) {
    const currentVersion = LEGAL_VERSIONS[docType];
    
    const totalAcceptances = await prisma.legalAcceptance.groupBy({
      by: ['userId'],
      where: {
        documentType: docType,
        userId: { not: null },
      },
      _count: { userId: true },
    });
    
    const currentAcceptances = await prisma.legalAcceptance.groupBy({
      by: ['userId'],
      where: {
        documentType: docType,
        version: currentVersion,
        userId: { not: null },
      },
      _count: { userId: true },
    });
    
    const total = totalAcceptances.length;
    const current = currentAcceptances.length;
    const outdated = total - current;
    
    stats[docType] = {
      total,
      current,
      outdated,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };
  }
  
  return {
    totalUsers,
    documentStats: stats,
  };
}

