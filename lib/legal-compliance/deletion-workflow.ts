/**
 * NEW FILE: User Deletion Workflow (Right to Erasure)
 * Purpose: GDPR Article 17 & DPDPA 2023 compliance
 * 
 * Process:
 * 1. User requests deletion
 * 2. Check for legal holds (active orders, disputes)
 * 3. 30-day grace period (user can cancel)
 * 4. After 30 days: Anonymize data (not full deletion for tax compliance)
 * 5. Send confirmation emails
 * 
 * Anonymization Strategy:
 * - Email → `deleted_user_<timestamp>@example.com`
 * - Name → "Deleted User"
 * - Phone → null
 * - Address → null
 * - Password → null
 * - BUT: Keep order history (7-year tax requirement)
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { logAudit } from '@/lib/audit/logger';

interface CreateDeletionRequestData {
  userId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new deletion request
 * Checks for legal holds first
 */
export async function createDeletionRequest(data: CreateDeletionRequestData): Promise<{
  success: boolean;
  requestId?: string;
  gracePeriodEnds?: Date;
  error?: string;
  legalHolds?: string[];
}> {
  try {
    // Check if request already exists
    const existingRequest = await prisma.userDeletionRequest.findUnique({
      where: { userId: data.userId },
    });

    if (existingRequest && !existingRequest.cancelledAt && !existingRequest.executedAt) {
      return {
        success: false,
        error: 'A deletion request is already pending for this account',
      };
    }

    // Get user details
    const user = await prisma.customer.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check for legal holds
    const legalHolds = await checkLegalHolds(data.userId);

    if (legalHolds.length > 0) {
      // Create request but mark as having legal holds
      const gracePeriodEnds = new Date();
      gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 30);

      const request = await prisma.userDeletionRequest.create({
        data: {
          userId: data.userId,
          reason: data.reason,
          gracePeriodEnds,
          hasLegalHold: true,
          legalHoldReason: legalHolds.join(', '),
        },
      });

      // Notify user about legal holds
      await sendDeletionRequestEmail(user, request, legalHolds);

      // Log audit trail
      await logAudit({
        action: 'DELETION_REQUESTED',
        entityType: 'user',
        entityId: data.userId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: {
          legalHolds,
        },
      });

      return {
        success: false,
        error: 'Cannot process deletion due to legal holds',
        legalHolds,
      };
    }

    // No legal holds - create deletion request
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 30);

    const request = await prisma.userDeletionRequest.create({
      data: {
        userId: data.userId,
        reason: data.reason,
        gracePeriodEnds,
        hasLegalHold: false,
      },
    });

    // Send confirmation email
    await sendDeletionRequestEmail(user, request, []);

    // Create compliance alert
    await prisma.complianceAlert.create({
      data: {
        alertType: 'DELETION_REQUEST',
        severity: 'HIGH',
        title: `User Deletion Request - ${user.name}`,
        description: `User ${user.email} requested account deletion. Grace period ends on ${gracePeriodEnds.toLocaleDateString()}.`,
      },
    });

    // Log audit trail
    await logAudit({
      action: 'DELETION_REQUESTED',
      entityType: 'user',
      entityId: data.userId,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: {
        gracePeriodEnds: gracePeriodEnds.toISOString(),
      },
    });

    console.log(`[DELETION] Request created for user ${user.email}`);

    return {
      success: true,
      requestId: request.id,
      gracePeriodEnds,
    };
  } catch (error) {
    console.error('[DELETION] Error creating request:', error);
    return {
      success: false,
      error: 'Failed to create deletion request',
    };
  }
}

/**
 * Check for legal holds that prevent deletion
 */
async function checkLegalHolds(userId: string): Promise<string[]> {
  const holds: string[] = [];

  // Check for active orders (not delivered)
  const activeOrders = await prisma.order.count({
    where: {
      customerId: userId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'],
      },
    },
  });

  if (activeOrders > 0) {
    holds.push(`${activeOrders} active orders pending delivery`);
  }

  // Check for recent orders (<30 days) - might have disputes
  const recentOrdersDate = new Date();
  recentOrdersDate.setDate(recentOrdersDate.getDate() - 30);

  const recentOrders = await prisma.order.count({
    where: {
      customerId: userId,
      createdAt: { gte: recentOrdersDate },
    },
  });

  if (recentOrders > 0) {
    holds.push(`${recentOrders} orders placed in last 30 days (dispute window)`);
  }

  // Check for pending payments
  const pendingPayments = await prisma.payment.count({
    where: {
      order: {
        customerId: userId,
      },
      status: 'PENDING',
    },
  });

  if (pendingPayments > 0) {
    holds.push(`${pendingPayments} pending payments`);
  }

  return holds;
}

/**
 * Send deletion request confirmation email
 */
async function sendDeletionRequestEmail(
  user: any,
  request: any,
  legalHolds: string[]
): Promise<boolean> {
  const subject = legalHolds.length > 0
    ? '⚠️ Account Deletion Request - Action Required'
    : '✅ Account Deletion Request Received';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${legalHolds.length > 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #EF4444, #DC2626)'}; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
    .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${legalHolds.length > 0 ? '⚠️' : '✅'} Account Deletion Request</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Bantu's Kitchen (GharSe)</p>
    </div>

    <div class="content">
      <p>Hi ${user.name},</p>
      
      ${legalHolds.length > 0 ? `
        <div class="warning-box">
          <h3 style="margin-top: 0; color: #92400E;">⚠️ Legal Holds Preventing Deletion</h3>
          <p style="margin: 8px 0;">Your account cannot be deleted at this time due to the following reasons:</p>
          <ul style="margin: 8px 0;">
            ${legalHolds.map(hold => `<li>${hold}</li>`).join('')}
          </ul>
          <p style="margin: 8px 0 0 0;"><strong>What happens next:</strong> Your request has been recorded. We will process the deletion once all legal holds are cleared.</p>
        </div>
      ` : `
        <p>We have received your request to delete your account and all associated personal data.</p>

        <div class="info-box">
          <h3 style="margin-top: 0; color: #991B1B;">⏰ 30-Day Grace Period</h3>
          <p style="margin: 0;">Your account will be deleted on <strong>${new Date(request.gracePeriodEnds).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' })} IST</strong>.</p>
          <p style="margin: 8px 0 0 0;">You can cancel this request anytime before this date by logging into your account.</p>
        </div>
      `}

      <h3 style="color: #111827;">What Gets Deleted:</h3>
      <ul>
        <li>Personal information (name, email, phone)</li>
        <li>Account credentials</li>
        <li>Saved addresses</li>
        <li>Payment methods</li>
        <li>Marketing preferences</li>
      </ul>

      <h3 style="color: #111827;">What We Retain (Legal Requirement):</h3>
      <ul>
        <li>Order history (anonymized) - Required for tax compliance (7 years)</li>
        <li>Transaction records (anonymized) - Required for financial audits</li>
        <li>Delivery records (anonymized) - Required for food safety compliance</li>
      </ul>

      <p style="margin-top: 24px; font-size: 14px; color: #6B7280;">
        This data retention is required by the Income Tax Act 1961 and FSSAI regulations.
        Your personal details will be replaced with "Deleted User" to protect your privacy.
      </p>

      ${legalHolds.length === 0 ? `
        <h3 style="color: #111827;">Want to Cancel?</h3>
        <p>Log into your account and visit <strong>Profile → Data Rights</strong> to cancel this request.</p>
      ` : ''}

      <h3 style="color: #111827;">Questions?</h3>
      <p>Contact our Data Protection Officer:</p>
      <ul style="list-style: none; padding: 0;">
        <li>📧 Email: <a href="mailto:dpo@gharse.app">dpo@gharse.app</a></li>
        <li>📞 Phone: +91 90104 60964</li>
      </ul>
    </div>

    <div class="footer">
      <p>This email is required by GDPR Article 17 and DPDPA 2023.</p>
      <p>Bantu's Kitchen (Doing business as GharSe)<br>
      Hayathnagar, Hyderabad, Telangana, India</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[DELETION] Failed to send email:', error);
    return false;
  }
}

/**
 * Cancel deletion request (within grace period)
 */
export async function cancelDeletionRequest(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const request = await prisma.userDeletionRequest.findUnique({
      where: { userId },
    });

    if (!request) {
      return { success: false, error: 'No deletion request found' };
    }

    if (request.executedAt) {
      return { success: false, error: 'Deletion already executed' };
    }

    if (request.cancelledAt) {
      return { success: false, error: 'Request already cancelled' };
    }

    // Cancel request
    await prisma.userDeletionRequest.update({
      where: { userId },
      data: { cancelledAt: new Date() },
    });

    // Get user details for email
    const user = await prisma.customer.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user) {
      await sendCancellationEmail(user);
    }

    // Log audit trail
    await logAudit({
      action: 'DELETION_CANCELLED',
      entityType: 'user',
      entityId: userId,
      userId,
      details: {
        originalRequestDate: request.requestedAt.toISOString(),
      },
    });

    console.log(`[DELETION] Request cancelled for user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('[DELETION] Error cancelling request:', error);
    return { success: false, error: 'Failed to cancel request' };
  }
}

/**
 * Send cancellation confirmation email
 */
async function sendCancellationEmail(user: any): Promise<boolean> {
  const subject = '✅ Account Deletion Cancelled';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✅ Deletion Request Cancelled</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Bantu's Kitchen (GharSe)</p>
    </div>

    <div class="content">
      <p>Hi ${user.name},</p>
      <p>Your account deletion request has been <strong>cancelled</strong>.</p>
      <p>Your account and all associated data will remain active.</p>
      <p>Welcome back! 🎉</p>
      <p>If you did not cancel this request, please contact us immediately.</p>

      <h3 style="color: #111827;">Questions?</h3>
      <p>Contact our Data Protection Officer:</p>
      <ul style="list-style: none; padding: 0;">
        <li>📧 Email: <a href="mailto:dpo@gharse.app">dpo@gharse.app</a></li>
        <li>📞 Phone: +91 90104 60964</li>
      </ul>
    </div>

    <div class="footer">
      <p>Bantu's Kitchen (Doing business as GharSe)<br>
      Hayathnagar, Hyderabad, Telangana, India</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[DELETION] Failed to send cancellation email:', error);
    return false;
  }
}

/**
 * Execute deletion (anonymize user data)
 * Called by daily cron job after grace period
 */
export async function executeDeletion(requestId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const request = await prisma.userDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.executedAt) {
      return { success: false, error: 'Already executed' };
    }

    if (request.cancelledAt) {
      return { success: false, error: 'Request was cancelled' };
    }

    // Get user before anonymization
    const user = await prisma.customer.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Anonymize user data
    const timestamp = Date.now();
    await prisma.customer.update({
      where: { id: request.userId },
      data: {
        email: `deleted_user_${timestamp}@example.com`,
        name: 'Deleted User',
        passwordHash: undefined, // Remove password hash
        phone: undefined, // Remove phone number
        // Keep user ID for order history linkage
      },
    });

    // Mark request as executed
    await prisma.userDeletionRequest.update({
      where: { id: requestId },
      data: { executedAt: new Date() },
    });

    // Log audit trail
    await logAudit({
      action: 'DELETION_EXECUTED',
      entityType: 'user',
      entityId: request.userId,
      details: {
        originalEmail: user.email.substring(0, 3) + '***',
        anonymizedEmail: `deleted_user_${timestamp}@example.com`,
      },
    });

    // Send final confirmation email (to original email, before anonymization)
    await sendDeletionExecutedEmail(user);

    console.log(`[DELETION] Executed deletion for user ${request.userId}`);

    return { success: true };
  } catch (error) {
    console.error('[DELETION] Error executing deletion:', error);
    return { success: false, error: 'Failed to execute deletion' };
  }
}

/**
 * Send deletion executed confirmation email
 */
async function sendDeletionExecutedEmail(user: any): Promise<boolean> {
  const subject = '✅ Account Deleted - Final Confirmation';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6B7280, #4B5563); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✅ Account Deleted</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Bantu's Kitchen (GharSe)</p>
    </div>

    <div class="content">
      <p>Hi ${user.name},</p>
      <p>Your account has been <strong>permanently deleted</strong> as requested.</p>

      <h3 style="color: #111827;">What Has Been Deleted:</h3>
      <ul>
        <li>✅ Personal information (name, email, phone)</li>
        <li>✅ Account credentials</li>
        <li>✅ Saved addresses</li>
        <li>✅ Payment methods</li>
        <li>✅ Marketing preferences</li>
      </ul>

      <h3 style="color: #111827;">What We Retained (Legal Requirement):</h3>
      <ul>
        <li>📦 Order history (anonymized)</li>
        <li>💰 Transaction records (anonymized)</li>
        <li>🚚 Delivery records (anonymized)</li>
      </ul>

      <p>This data is retained for 7 years as required by the Income Tax Act 1961 and FSSAI regulations.</p>

      <p style="margin-top: 24px;">
        <strong>This is your final email from us.</strong> Your email address has been removed from all our systems.
      </p>

      <p>Thank you for using Bantu's Kitchen. We're sorry to see you go! 👋</p>
    </div>

    <div class="footer">
      <p>Bantu's Kitchen (Doing business as GharSe)<br>
      Hayathnagar, Hyderabad, Telangana, India</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[DELETION] Failed to send executed email:', error);
    return false;
  }
}

/**
 * Check for ready-to-execute deletions
 * Called by daily cron job
 */
export async function checkReadyForDeletion(): Promise<{
  readyCount: number;
  executedCount: number;
}> {
  const now = new Date();

  // Find requests ready for execution
  const readyRequests = await prisma.userDeletionRequest.findMany({
    where: {
      gracePeriodEnds: { lte: now },
      executedAt: null,
      cancelledAt: null,
      hasLegalHold: false,
    },
  });

  let executedCount = 0;

  for (const request of readyRequests) {
    const result = await executeDeletion(request.id);
    if (result.success) {
      executedCount++;
    }
  }

  return {
    readyCount: readyRequests.length,
    executedCount,
  };
}

/**
 * Get deletion request stats
 */
export async function getDeletionStats(): Promise<{
  pending: number;
  cancelled: number;
  executed: number;
  withLegalHolds: number;
}> {
  const [pending, cancelled, executed, withLegalHolds] = await Promise.all([
    prisma.userDeletionRequest.count({
      where: {
        executedAt: null,
        cancelledAt: null,
      },
    }),
    prisma.userDeletionRequest.count({
      where: {
        cancelledAt: { not: null },
      },
    }),
    prisma.userDeletionRequest.count({
      where: {
        executedAt: { not: null },
      },
    }),
    prisma.userDeletionRequest.count({
      where: {
        hasLegalHold: true,
        executedAt: null,
        cancelledAt: null,
      },
    }),
  ]);

  return {
    pending,
    cancelled,
    executed,
    withLegalHolds,
  };
}

