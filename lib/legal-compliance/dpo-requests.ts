/**
 * NEW FILE: DPO Request Management System
 * Purpose: Handle Data Protection Officer requests with 30-day SLA
 * Compliance: DPDPA 2023 § 12(2), GDPR Article 15 (Right to Access)
 * 
 * Request Types:
 * - DATA_ACCESS: User wants to see their data
 * - DATA_DELETION: User wants data deleted (triggers Right to Erasure)
 * - DATA_CORRECTION: User wants to correct inaccurate data
 * - CONSENT_WITHDRAWAL: User wants to withdraw consent for processing
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { logAudit } from '@/lib/audit/logger';

export type DPORequestType =
  | 'DATA_ACCESS'
  | 'DATA_DELETION'
  | 'DATA_CORRECTION'
  | 'CONSENT_WITHDRAWAL';

export type DPORequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

interface CreateDPORequestData {
  userId?: string;
  email: string;
  phone?: string;
  requestType: DPORequestType;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new DPO request
 * Auto-calculates 30-day SLA deadline
 */
export async function createDPORequest(data: CreateDPORequestData): Promise<{
  success: boolean;
  requestId?: string;
  dueDate?: Date;
  error?: string;
}> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate request type
    const validTypes: DPORequestType[] = [
      'DATA_ACCESS',
      'DATA_DELETION',
      'DATA_CORRECTION',
      'CONSENT_WITHDRAWAL',
    ];
    if (!validTypes.includes(data.requestType)) {
      return { success: false, error: 'Invalid request type' };
    }

    // Calculate 30-day SLA deadline (DPDPA § 12(2))
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create DPO request
    const dpoRequest = await prisma.dPORequest.create({
      data: {
        userId: data.userId,
        email: data.email,
        phone: data.phone,
        requestType: data.requestType,
        description: data.description,
        dueDate,
        status: 'PENDING',
        isOverdue: false,
      },
    });

    // Send auto-acknowledgment email (within 24 hours requirement)
    await sendAcknowledgmentEmail(dpoRequest);

    // Log audit trail
    await logAudit({
      action: 'DPO_REQUEST_CREATED',
      entityType: 'dpo_request',
      entityId: dpoRequest.id,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: {
        requestType: data.requestType,
        email: data.email,
        dueDate: dueDate.toISOString(),
      },
    });

    // Create compliance alert for admins
    await prisma.complianceAlert.create({
      data: {
        alertType: 'DPO_REQUEST',
        severity: 'HIGH',
        title: `New DPO Request: ${data.requestType}`,
        description: `User ${data.email} submitted a ${data.requestType} request. Response required within 30 days.`,
      },
    });

    console.log(`[DPO REQUEST] Created request ${dpoRequest.id} for ${data.email}`);

    return {
      success: true,
      requestId: dpoRequest.id,
      dueDate,
    };
  } catch (error) {
    console.error('[DPO REQUEST] Error creating request:', error);
    return {
      success: false,
      error: 'Failed to create DPO request. Please try again.',
    };
  }
}

/**
 * Send auto-acknowledgment email within 24 hours
 */
async function sendAcknowledgmentEmail(request: any): Promise<boolean> {
  const subject = `✅ DPO Request Received - Reference #${request.id.substring(0, 8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
    .info-box { background: #F0F9FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">✅ Request Received</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Data Protection Officer - Bantu's Kitchen (GharSe)</p>
    </div>

    <div class="content">
      <h2 style="color: #111827;">Thank you for your request</h2>
      <p>We have received your data protection request and will respond within <strong>30 days</strong> as required by the Digital Personal Data Protection Act 2023.</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1E40AF;">Request Details</h3>
        <ul style="margin: 8px 0;">
          <li><strong>Reference Number:</strong> #${request.id.substring(0, 8).toUpperCase()}</li>
          <li><strong>Request Type:</strong> ${formatRequestType(request.requestType)}</li>
          <li><strong>Submitted:</strong> ${new Date(request.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST</li>
          <li><strong>Response Deadline:</strong> ${new Date(request.dueDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST</li>
        </ul>
      </div>

      <h3 style="color: #111827;">What Happens Next?</h3>
      <ol>
        <li>Our Data Protection Officer will review your request</li>
        <li>We may contact you for additional verification (if required)</li>
        <li>You will receive our response within 30 days</li>
        <li>If approved, we will process your request immediately</li>
      </ol>

      <h3 style="color: #111827;">Your Rights</h3>
      <p>Under the Digital Personal Data Protection Act 2023, you have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data (Right to Erasure)</li>
        <li>Withdraw consent for data processing</li>
        <li>File a complaint with the Data Protection Board</li>
      </ul>

      <h3 style="color: #111827;">Need Help?</h3>
      <p>If you have questions about your request, please contact our Data Protection Officer:</p>
      <ul style="list-style: none; padding: 0;">
        <li>📧 Email: <a href="mailto:dpo@gharse.app">dpo@gharse.app</a></li>
        <li>📞 Phone: +91 90104 60964</li>
        <li>🌐 Website: <a href="https://gharse.app/legal/dpo-request">gharse.app/legal/dpo-request</a></li>
      </ul>

      <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
        <strong>Reference Number:</strong> #${request.id.substring(0, 8).toUpperCase()}<br>
        <strong>Acknowledgment Date:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </p>
    </div>

    <div class="footer">
      <p>This is an automated acknowledgment as required by DPDPA 2023.</p>
      <p>Bantu's Kitchen (Doing business as GharSe)<br>
      Hayathnagar, Hyderabad, Telangana, India</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: request.email,
      subject,
      html,
    });

    // Update acknowledgment timestamp
    await prisma.dPORequest.update({
      where: { id: request.id },
      data: { acknowledgedAt: new Date() },
    });

    console.log(`[DPO REQUEST] Acknowledgment email sent to ${request.email}`);
    return true;
  } catch (error) {
    console.error('[DPO REQUEST] Failed to send acknowledgment email:', error);
    return false;
  }
}

/**
 * Format request type for display
 */
function formatRequestType(type: string): string {
  const typeMap: Record<string, string> = {
    DATA_ACCESS: 'Data Access Request',
    DATA_DELETION: 'Data Deletion Request',
    DATA_CORRECTION: 'Data Correction Request',
    CONSENT_WITHDRAWAL: 'Consent Withdrawal',
  };
  return typeMap[type] || type;
}

/**
 * Check for overdue DPO requests (>30 days)
 * Called by daily cron job
 */
export async function checkOverdueDPORequests(): Promise<{
  overdueCount: number;
  approachingCount: number;
}> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find overdue requests (past due date, not completed/rejected)
  const overdueRequests = await prisma.dPORequest.findMany({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
      isOverdue: false, // Not yet marked as overdue
    },
  });

  // Mark as overdue
  for (const request of overdueRequests) {
    await prisma.dPORequest.update({
      where: { id: request.id },
      data: { isOverdue: true },
    });

    // Create CRITICAL alert
    await prisma.complianceAlert.create({
      data: {
        alertType: 'DPO_OVERDUE',
        severity: 'CRITICAL',
        title: `⚠️ DPO Request Overdue - #${request.id.substring(0, 8).toUpperCase()}`,
        description: `Request from ${request.email} is overdue. DPDPA 2023 violation! Respond immediately.`,
      },
    });

    console.log(`[DPO REQUEST] Request ${request.id} marked as OVERDUE`);
  }

  // Find requests approaching deadline (within 7 days)
  const approachingRequests = await prisma.dPORequest.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: sevenDaysFromNow,
      },
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
    },
  });

  // Create WARNING alerts for approaching deadlines
  for (const request of approachingRequests) {
    const daysRemaining = Math.ceil((request.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    await prisma.complianceAlert.create({
      data: {
        alertType: 'DPO_APPROACHING_DEADLINE',
        severity: 'WARNING',
        title: `⏰ DPO Request Due in ${daysRemaining} Days - #${request.id.substring(0, 8).toUpperCase()}`,
        description: `Request from ${request.email} is due on ${request.dueDate.toLocaleDateString()}. Please respond soon.`,
      },
    });
  }

  return {
    overdueCount: overdueRequests.length,
    approachingCount: approachingRequests.length,
  };
}

/**
 * Respond to DPO request
 */
export async function respondToDPORequest(
  requestId: string,
  response: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const request = await prisma.dPORequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Update request with response
    await prisma.dPORequest.update({
      where: { id: requestId },
      data: {
        response,
        respondedAt: new Date(),
        status: 'COMPLETED',
      },
    });

    // Send response email to user
    await sendResponseEmail(request, response);

    // Log audit trail
    await logAudit({
      action: 'DPO_REQUEST_RESPONDED',
      entityType: 'dpo_request',
      entityId: requestId,
      userId: adminId,
      details: {
        responseLength: response.length,
        requestType: request.requestType,
      },
    });

    console.log(`[DPO REQUEST] Response sent for request ${requestId}`);

    return { success: true };
  } catch (error) {
    console.error('[DPO REQUEST] Error responding to request:', error);
    return { success: false, error: 'Failed to send response' };
  }
}

/**
 * Send response email to user
 */
async function sendResponseEmail(request: any, response: string): Promise<boolean> {
  const subject = `📋 DPO Request Response - Reference #${request.id.substring(0, 8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
    .response-box { background: #F9FAFB; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap; }
    .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📋 DPO Response</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Data Protection Officer - Bantu's Kitchen (GharSe)</p>
    </div>

    <div class="content">
      <h2 style="color: #111827;">Your Request Has Been Processed</h2>
      <p>We have completed the review of your data protection request.</p>

      <h3 style="color: #111827;">Request Details</h3>
      <ul>
        <li><strong>Reference Number:</strong> #${request.id.substring(0, 8).toUpperCase()}</li>
        <li><strong>Request Type:</strong> ${formatRequestType(request.requestType)}</li>
        <li><strong>Submitted:</strong> ${new Date(request.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' })} IST</li>
        <li><strong>Responded:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' })} IST</li>
      </ul>

      <h3 style="color: #111827;">Response</h3>
      <div class="response-box">${response}</div>

      <h3 style="color: #111827;">Need Further Assistance?</h3>
      <p>If you have additional questions or concerns, please contact our Data Protection Officer:</p>
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
      to: request.email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[DPO REQUEST] Failed to send response email:', error);
    return false;
  }
}

/**
 * Get DPO request statistics
 */
export async function getDPORequestStats(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  overdue: number;
  averageResponseTime: number;
}> {
  const [total, pending, inProgress, completed, rejected, overdue] = await Promise.all([
    prisma.dPORequest.count(),
    prisma.dPORequest.count({ where: { status: 'PENDING' } }),
    prisma.dPORequest.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.dPORequest.count({ where: { status: 'COMPLETED' } }),
    prisma.dPORequest.count({ where: { status: 'REJECTED' } }),
    prisma.dPORequest.count({ where: { isOverdue: true } }),
  ]);

  // Calculate average response time for completed requests
  const completedRequests = await prisma.dPORequest.findMany({
    where: {
      status: 'COMPLETED',
      respondedAt: { not: null },
    },
    select: {
      requestedAt: true,
      respondedAt: true,
    },
  });

  let totalResponseTime = 0;
  completedRequests.forEach((request) => {
    if (request.respondedAt) {
      const responseTime = request.respondedAt.getTime() - request.requestedAt.getTime();
      totalResponseTime += responseTime;
    }
  });

  const averageResponseTime =
    completedRequests.length > 0
      ? Math.round(totalResponseTime / completedRequests.length / (24 * 60 * 60 * 1000)) // Convert to days
      : 0;

  return {
    total,
    pending,
    inProgress,
    completed,
    rejected,
    overdue,
    averageResponseTime,
  };
}

