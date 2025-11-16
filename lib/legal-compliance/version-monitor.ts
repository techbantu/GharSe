/**
 * LEGAL DOCUMENT VERSION MONITOR
 * Purpose: Detect version changes and trigger re-acceptance + email notifications
 * Features: Automatic version tracking, email notifications, re-acceptance enforcement
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { LEGAL_VERSIONS, LegalDocumentType } from './index';

// ===== VERSION CHANGE DETECTION =====

interface VersionChangeResult {
  hasChanges: boolean;
  changedDocuments: Array<{
    type: LegalDocumentType;
    oldVersion: string;
    newVersion: string;
  }>;
  affectedUsers: number;
}

/**
 * Compare current versions against what users have accepted
 * Returns list of documents that need re-acceptance
 */
export async function detectVersionChanges(): Promise<VersionChangeResult> {
  const changedDocuments: Array<{
    type: LegalDocumentType;
    oldVersion: string;
    newVersion: string;
  }> = [];

  // Get all unique user IDs who have accepted any legal document
  const acceptances = await prisma.legalAcceptance.groupBy({
    by: ['userId', 'documentType', 'version'],
  });

  const usersNeedingUpdate = new Set<string>();

  // Check each document type for version changes
  for (const [docType, currentVersion] of Object.entries(LEGAL_VERSIONS)) {
    const relevantAcceptances = acceptances.filter(
      (a: any) => a.documentType === docType
    );

    for (const acceptance of relevantAcceptances) {
      if (acceptance.version !== currentVersion) {
        // Version mismatch - user needs to re-accept
        if (acceptance.userId) {
          usersNeedingUpdate.add(acceptance.userId);
        }

        // Check if we've already recorded this version change
        const alreadyRecorded = changedDocuments.some(
          c => c.type === docType as LegalDocumentType &&
               c.oldVersion === acceptance.version
        );

        if (!alreadyRecorded) {
          changedDocuments.push({
            type: docType as LegalDocumentType,
            oldVersion: acceptance.version,
            newVersion: currentVersion,
          });
        }
      }
    }
  }

  return {
    hasChanges: changedDocuments.length > 0,
    changedDocuments,
    affectedUsers: usersNeedingUpdate.size,
  };
}

// ===== EMAIL NOTIFICATIONS =====

/**
 * Send email notification to user about updated legal documents
 */
export async function sendVersionChangeEmail(
  userEmail: string,
  userName: string,
  changedDocuments: Array<{
    type: LegalDocumentType;
    oldVersion: string;
    newVersion: string;
  }>
) {
  const documentList = changedDocuments.map(doc => {
    const docName = {
      TERMS: 'Terms of Service',
      PRIVACY: 'Privacy Policy',
      REFUND: 'Refund Policy',
      FOOD_SAFETY: 'Food Safety Policy',
      IP_PROTECTION: 'IP Protection Policy',
      REFERRAL_TERMS: 'Referral Terms',
    }[doc.type];

    return `- ${docName}: v${doc.oldVersion} → v${doc.newVersion}`;
  }).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .alert-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .document-list {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border: 1px solid #ddd;
    }
    .cta-button {
      display: inline-block;
      padding: 15px 30px;
      background: #FF6B35;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔔 Legal Documents Updated</h1>
  </div>
  
  <div class="content">
    <p>Dear ${userName},</p>
    
    <p>We've updated our legal documents to better protect you and comply with current regulations. As required by law, we need you to review and accept the updated versions.</p>
    
    <div class="alert-box">
      <strong>⚠️ Action Required:</strong> You must accept the updated policies to continue using Bantu's Kitchen.
    </div>
    
    <div class="document-list">
      <h3>Updated Documents:</h3>
      <pre style="font-family: inherit;">${documentList}</pre>
    </div>
    
    <p><strong>What's Changed:</strong></p>
    <ul>
      <li>Enhanced data protection measures (DPDPA 2023 compliance)</li>
      <li>Updated refund and cancellation terms</li>
      <li>Improved food safety disclosures</li>
      <li>Clarified terms of service</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.app'}" class="cta-button">
        Review & Accept Updated Policies
      </a>
    </p>
    
    <p><strong>Important:</strong> When you next visit our website, you'll be prompted to accept the updated policies. This is a one-time requirement.</p>
    
    <p>If you have any questions about these changes, please contact our Data Protection Officer at <a href="mailto:privacy@gharse.app">privacy@gharse.app</a>.</p>
    
    <p>Thank you for your continued trust in Bantu's Kitchen!</p>
    
    <p>Best regards,<br>
    <strong>The Bantu's Kitchen Team</strong></p>
  </div>
  
  <div class="footer">
    <p>This is a mandatory notification required by data protection laws.</p>
    <p>Bantu's Kitchen | Hayatnagar, Hyderabad | <a href="https://gharse.app">gharse.app</a></p>
  </div>
</body>
</html>
  `;

  const text = `
Legal Documents Updated - Action Required

Dear ${userName},

We've updated our legal documents to better protect you and comply with current regulations. As required by law, we need you to review and accept the updated versions.

Updated Documents:
${documentList}

What's Changed:
- Enhanced data protection measures (DPDPA 2023 compliance)
- Updated refund and cancellation terms
- Improved food safety disclosures
- Clarified terms of service

ACTION REQUIRED: Please visit ${process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.app'} to review and accept the updated policies.

When you next visit our website, you'll be prompted to accept the updated policies. This is a one-time requirement.

If you have any questions about these changes, please contact our Data Protection Officer at privacy@gharse.app.

Thank you for your continued trust in Bantu's Kitchen!

Best regards,
The Bantu's Kitchen Team

---
This is a mandatory notification required by data protection laws.
Bantu's Kitchen | Hayatnagar, Hyderabad | gharse.app
  `;

  try {
    await sendEmail({
      to: userEmail,
      subject: '🔔 Action Required: Legal Documents Updated - Bantu\'s Kitchen',
      html,
    });

    console.log(`[VERSION MONITOR] Sent update notification to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[VERSION MONITOR] Failed to send email to ${userEmail}:`, error);
    return false;
  }
}

/**
 * Notify all affected users about version changes
 */
export async function notifyAffectedUsers(
  changedDocuments: Array<{
    type: LegalDocumentType;
    oldVersion: string;
    newVersion: string;
  }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Get all unique user IDs who have accepted outdated versions
  const affectedUserIds = new Set<string>();
  
  for (const doc of changedDocuments) {
    const acceptances = await prisma.legalAcceptance.findMany({
      where: {
        documentType: doc.type,
        version: doc.oldVersion,
        userId: { not: null },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    acceptances.forEach(a => {
      if (a.userId) affectedUserIds.add(a.userId);
    });
  }

  // Get user emails
  const users = await prisma.customer.findMany({
    where: {
      id: { in: Array.from(affectedUserIds) },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // Send emails
  for (const user of users) {
    const success = await sendVersionChangeEmail(
      user.email,
      user.name,
      changedDocuments
    );

    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Rate limiting: wait 100ms between emails
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[VERSION MONITOR] Sent ${sent} notifications, ${failed} failed`);
  return { sent, failed };
}

// ===== VERSION UPDATE WORKFLOW =====

/**
 * Complete workflow for updating legal document versions
 * 1. Detect changes
 * 2. Create compliance alert
 * 3. Send notifications
 * 4. Log action
 */
export async function handleVersionUpdate(): Promise<{
  success: boolean;
  message: string;
  details: {
    changedDocuments: number;
    affectedUsers: number;
    emailsSent: number;
    emailsFailed: number;
  };
}> {
  try {
    // 1. Detect version changes
    const changes = await detectVersionChanges();

    if (!changes.hasChanges) {
      return {
        success: true,
        message: 'No version changes detected',
        details: {
          changedDocuments: 0,
          affectedUsers: 0,
          emailsSent: 0,
          emailsFailed: 0,
        },
      };
    }

    // 2. Create compliance alert
    await prisma.complianceAlert.create({
      data: {
        alertType: 'LICENSE_EXPIRING', // Using closest type, should add VERSION_UPDATE
        severity: 'HIGH',
        title: 'Legal Document Versions Updated',
        description: `${changes.changedDocuments.length} document(s) updated, ${changes.affectedUsers} users need to re-accept`,
      },
    });

    // 3. Send notifications
    const emailResults = await notifyAffectedUsers(changes.changedDocuments);

    // 4. Log action
    await prisma.dataRetentionLog.create({
      data: {
        recordType: 'legal_version',
        recordId: `version-update-${Date.now()}`,
        action: 'reviewed',
        reason: 'legal_compliance',
        details: {
          changedDocuments: changes.changedDocuments,
          affectedUsers: changes.affectedUsers,
          emailsSent: emailResults.sent,
          emailsFailed: emailResults.failed,
        },
      },
    });

    return {
      success: true,
      message: 'Version update processed successfully',
      details: {
        changedDocuments: changes.changedDocuments.length,
        affectedUsers: changes.affectedUsers,
        emailsSent: emailResults.sent,
        emailsFailed: emailResults.failed,
      },
    };
  } catch (error) {
    console.error('[VERSION MONITOR] Error handling version update:', error);
    return {
      success: false,
      message: 'Failed to process version update',
      details: {
        changedDocuments: 0,
        affectedUsers: 0,
        emailsSent: 0,
        emailsFailed: 0,
      },
    };
  }
}

