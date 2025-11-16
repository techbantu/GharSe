/**
 * NEW FILE: 72-Hour Breach Notification System
 * Purpose: Notify affected users within 72 hours of security breach detection
 * Compliance: DPDPA 2023 § 8, GDPR Article 33, Article 34
 * 
 * Legal Requirements:
 * - Notify Data Protection Board within 72 hours (GDPR Article 33)
 * - Notify affected users "without undue delay" (GDPR Article 34)
 * - Include: nature of breach, likely consequences, mitigation measures
 * - Document all notifications for audit trail
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';

interface BreachNotificationData {
  breachId: string;
  severity: string;
  breachType: string;
  affectedUsers: string[];
  description: string;
  mitigationSteps: string[];
  detectedAt: Date;
}

/**
 * Send breach notification email to affected user
 */
async function sendUserBreachNotification(
  userEmail: string,
  breach: BreachNotificationData
): Promise<boolean> {
  const subject = `🔒 Important Security Notice - ${breach.severity} Incident Detected`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #DC2626, #EA580C); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
    .alert-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #F0F9FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .steps { background: #F9FAFB; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .steps li { margin: 8px 0; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
    .button { display: inline-block; background: linear-gradient(to right, #DC2626, #EA580C); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🔒 Security Incident Notification</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Bantu's Kitchen (GharSe)</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <strong>⚠️ ${breach.severity} Security Incident</strong>
        <p style="margin: 8px 0 0 0;">We detected a security incident that may have affected your account.</p>
      </div>

      <h2 style="color: #111827; font-size: 18px;">What Happened?</h2>
      <p>${breach.description}</p>

      <h2 style="color: #111827; font-size: 18px;">When Did This Occur?</h2>
      <p><strong>Detected:</strong> ${breach.detectedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST</p>

      <h2 style="color: #111827; font-size: 18px;">What We're Doing</h2>
      <div class="steps">
        <ul>
          ${breach.mitigationSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1E40AF;">What You Should Do</h3>
        <ul style="margin: 8px 0;">
          <li><strong>Change your password immediately</strong> if you haven't already</li>
          <li>Enable two-factor authentication (if available)</li>
          <li>Review your recent account activity for anything suspicious</li>
          <li>Monitor your payment methods for unauthorized transactions</li>
          <li>Be cautious of phishing emails pretending to be from us</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://gharse.app/profile/security" class="button">Review Account Security</a>
      </div>

      <h2 style="color: #111827; font-size: 18px;">Your Rights</h2>
      <p>Under the Digital Personal Data Protection Act 2023 (DPDPA), you have the right to:</p>
      <ul>
        <li>Request details about what data was affected</li>
        <li>Request deletion of your personal data</li>
        <li>File a complaint with the Data Protection Board</li>
        <li>Withdraw consent for data processing</li>
      </ul>

      <h2 style="color: #111827; font-size: 18px;">Need Help?</h2>
      <p>If you have questions or concerns, please contact our Data Protection Officer:</p>
      <ul style="list-style: none; padding: 0;">
        <li>📧 Email: <a href="mailto:dpo@gharse.app">dpo@gharse.app</a></li>
        <li>📞 Phone: +91 90104 60964</li>
        <li>🌐 DPO Request Form: <a href="https://gharse.app/legal/dpo-request">gharse.app/legal/dpo-request</a></li>
      </ul>

      <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
        <strong>Reference Number:</strong> ${breach.breachId}<br>
        <strong>Notification Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </p>
    </div>

    <div class="footer">
      <p>This is a mandatory security notification as required by DPDPA 2023 § 8.</p>
      <p>Bantu's Kitchen (Doing business as GharSe)<br>
      Hayatnagar, Hyderabad, Telangana, India</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: userEmail,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`[BREACH NOTIFICATION] Failed to send email to ${userEmail}:`, error);
    return false;
  }
}

/**
 * Send breach notification to Data Protection Officer
 */
async function sendDPOBreachNotification(breach: BreachNotificationData): Promise<boolean> {
  const subject = `🚨 URGENT: ${breach.severity} Security Breach Detected - Action Required`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: monospace; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #FEF2F2; }
    .header { background: #DC2626; color: white; padding: 20px; border-radius: 8px; }
    .content { background: white; padding: 20px; margin-top: 16px; border: 2px solid #DC2626; border-radius: 8px; }
    .critical { background: #FEE2E2; padding: 16px; border-left: 4px solid #DC2626; margin: 16px 0; }
    pre { background: #F9FAFB; padding: 12px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 SECURITY BREACH ALERT</h1>
      <p style="margin: 8px 0 0 0;">Immediate Action Required - 72-Hour Notification Deadline</p>
    </div>

    <div class="content">
      <div class="critical">
        <strong>SEVERITY: ${breach.severity}</strong><br>
        <strong>BREACH TYPE: ${breach.breachType}</strong><br>
        <strong>AFFECTED USERS: ${breach.affectedUsers.length}</strong><br>
        <strong>DETECTED: ${breach.detectedAt.toISOString()}</strong>
      </div>

      <h2>Breach Details</h2>
      <pre>${breach.description}</pre>

      <h2>Affected Users</h2>
      <pre>${breach.affectedUsers.join('\n') || 'No specific users affected (system-level breach)'}</pre>

      <h2>Mitigation Steps Taken</h2>
      <ol>
        ${breach.mitigationSteps.map(step => `<li>${step}</li>`).join('')}
      </ol>

      <h2>Legal Obligations (72-Hour Deadline)</h2>
      <ul>
        <li>✅ User notifications: Automated (sent immediately)</li>
        <li>⏳ Data Protection Board notification: <strong>Required within 72 hours</strong></li>
        <li>⏳ Documentation: Update breach register</li>
        <li>⏳ Root cause analysis: Required for compliance report</li>
      </ul>

      <h2>Next Steps</h2>
      <ol>
        <li>Review breach details in admin dashboard: <a href="https://gharse.app/admin/compliance/security-breaches">Admin Panel</a></li>
        <li>Conduct forensic analysis to determine root cause</li>
        <li>Prepare Data Protection Board notification (if required)</li>
        <li>Document all actions taken for audit trail</li>
        <li>Schedule post-incident review meeting</li>
      </ol>

      <p style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #DC2626;">
        <strong>Breach ID:</strong> ${breach.breachId}<br>
        <strong>Notification Sent:</strong> ${new Date().toISOString()}<br>
        <strong>Deadline:</strong> ${new Date(breach.detectedAt.getTime() + 72 * 60 * 60 * 1000).toISOString()}
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: 'dpo@gharse.app',
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[BREACH NOTIFICATION] Failed to send DPO email:', error);
    return false;
  }
}

/**
 * Notify all affected users and DPO about security breach
 * Marks breach as notified in database
 */
export async function notifySecurityBreach(breachId: string): Promise<{
  success: boolean;
  notifiedUsers: number;
  failedUsers: number;
  dpoNotified: boolean;
}> {
  const breach = await prisma.securityBreach.findUnique({
    where: { id: breachId },
  });

  if (!breach) {
    throw new Error(`Breach ${breachId} not found`);
  }

  if (breach.notifiedAt) {
    console.log(`[BREACH NOTIFICATION] Breach ${breachId} already notified at ${breach.notifiedAt}`);
    return {
      success: true,
      notifiedUsers: 0,
      failedUsers: 0,
      dpoNotified: true,
    };
  }

  const affectedUserIds = breach.affectedUsers as string[];
  let notifiedCount = 0;
  let failedCount = 0;

  // Get user emails
  const users = await prisma.customer.findMany({
    where: {
      id: {
        in: affectedUserIds,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Notify each affected user
  for (const user of users) {
    const success = await sendUserBreachNotification(user.email, {
      breachId: breach.id,
      severity: breach.severity,
      breachType: breach.breachType,
      affectedUsers: affectedUserIds,
      description: breach.description,
      mitigationSteps: breach.mitigationSteps as string[],
      detectedAt: breach.detectedAt,
    });

    if (success) {
      notifiedCount++;
    } else {
      failedCount++;
    }
  }

  // Notify DPO
  const dpoNotified = await sendDPOBreachNotification({
    breachId: breach.id,
    severity: breach.severity,
    breachType: breach.breachType,
    affectedUsers: affectedUserIds,
    description: breach.description,
    mitigationSteps: breach.mitigationSteps as string[],
    detectedAt: breach.detectedAt,
  });

  // Update breach record
  await prisma.securityBreach.update({
    where: { id: breachId },
    data: {
      notifiedAt: new Date(),
    },
  });

  // Log notification action
  await prisma.dataRetentionLog.create({
    data: {
      recordType: 'security_breach',
      recordId: breachId,
      action: 'notified',
      reason: 'dpdpa_72_hour_requirement',
      details: {
        notifiedUsers: notifiedCount,
        failedUsers: failedCount,
        dpoNotified,
      },
    },
  });

  console.log(`[BREACH NOTIFICATION] Breach ${breachId} notifications sent:`, {
    notifiedUsers: notifiedCount,
    failedUsers: failedCount,
    dpoNotified,
  });

  return {
    success: failedCount === 0 && dpoNotified,
    notifiedUsers: notifiedCount,
    failedUsers: failedCount,
    dpoNotified,
  };
}

/**
 * Check for breaches approaching 72-hour deadline and send notifications
 * Call this from cron job every hour
 */
export async function checkAndNotifyBreaches(): Promise<{
  checked: number;
  notified: number;
  errors: number;
}> {
  const unnotifiedBreaches = await prisma.securityBreach.findMany({
    where: {
      notifiedAt: null,
      severity: {
        in: ['CRITICAL', 'HIGH'],
      },
    },
  });

  let notifiedCount = 0;
  let errorCount = 0;

  for (const breach of unnotifiedBreaches) {
    const hoursElapsed = (Date.now() - breach.detectedAt.getTime()) / (60 * 60 * 1000);

    // Notify immediately for CRITICAL, within 24 hours for HIGH
    const shouldNotify =
      breach.severity === 'CRITICAL' ||
      (breach.severity === 'HIGH' && hoursElapsed >= 1);

    if (shouldNotify) {
      try {
        await notifySecurityBreach(breach.id);
        notifiedCount++;
      } catch (error) {
        console.error(`[BREACH NOTIFICATION] Error notifying breach ${breach.id}:`, error);
        errorCount++;
      }
    }
  }

  return {
    checked: unnotifiedBreaches.length,
    notified: notifiedCount,
    errors: errorCount,
  };
}

/**
 * Send Data Protection Board notification (for CRITICAL breaches)
 * Required by DPDPA 2023 § 8 within 72 hours
 */
export async function notifyDataProtectionBoard(breachId: string): Promise<boolean> {
  const breach = await prisma.securityBreach.findUnique({
    where: { id: breachId },
  });

  if (!breach) {
    throw new Error(`Breach ${breachId} not found`);
  }

  // In production, this would integrate with official DPB reporting system
  // For now, we log and send email to DPO for manual filing
  const subject = `📋 Data Protection Board Notification Required - Breach ${breachId}`;

  const html = `
<h1>Data Protection Board Notification Required</h1>
<p><strong>Breach ID:</strong> ${breachId}</p>
<p><strong>Severity:</strong> ${breach.severity}</p>
<p><strong>Detected:</strong> ${breach.detectedAt.toISOString()}</p>
<p><strong>Deadline:</strong> ${new Date(breach.detectedAt.getTime() + 72 * 60 * 60 * 1000).toISOString()}</p>

<h2>Action Required</h2>
<p>File breach notification with Data Protection Board of India using official portal:</p>
<ul>
  <li>Portal: <a href="https://www.dataprotection.gov.in">www.dataprotection.gov.in</a> (when available)</li>
  <li>Include: Breach details, affected users, mitigation steps</li>
  <li>Attach: Forensic analysis report, timeline of events</li>
</ul>

<h2>Breach Details</h2>
<pre>${JSON.stringify(breach, null, 2)}</pre>
  `;

  try {
    await sendEmail({
      to: 'dpo@gharse.app',
      subject,
      html,
    });

    await prisma.securityBreach.update({
      where: { id: breachId },
      data: {
        dpbReportedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('[BREACH NOTIFICATION] Failed to send DPB notification:', error);
    return false;
  }
}
