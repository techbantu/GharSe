/**
 * NEW FILE: Comprehensive Audit Logging System
 * Purpose: Record all compliance actions for legal defense and audit trail
 * Compliance: DPDPA 2023 § 10 (Accountability), GDPR Article 5(2) (Accountability)
 * 
 * Logs Every:
 * - Legal acceptance (IP, timestamp, user agent)
 * - Data retention (what was archived/deleted)
 * - Breach notifications (who was notified, when)
 * - DPO requests (status changes)
 * - Cookie consent (granted/withdrawn)
 * - Deletion requests (initiated/executed)
 * - Admin actions (all compliance management)
 */

import { prisma } from '@/lib/prisma';

export type AuditAction =
  // Authentication & Access
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'SESSION_EXPIRED'
  // Legal Compliance
  | 'LEGAL_ACCEPTED'
  | 'LEGAL_REJECTED'
  | 'LEGAL_VERSION_CHANGED'
  // Data Access
  | 'DATA_ACCESSED'
  | 'DATA_EXPORTED'
  | 'DATA_MODIFIED'
  | 'DATA_DELETED'
  // Security
  | 'BREACH_DETECTED'
  | 'BREACH_NOTIFIED'
  | 'BREACH_RESOLVED'
  | 'SUSPICIOUS_ACTIVITY'
  // Cookie Consent
  | 'COOKIE_CONSENT_GRANTED'
  | 'COOKIE_CONSENT_WITHDRAWN'
  | 'COOKIE_CONSENT_UPDATED'
  // DPO Requests
  | 'DPO_REQUEST_CREATED'
  | 'DPO_REQUEST_ACKNOWLEDGED'
  | 'DPO_REQUEST_RESPONDED'
  | 'DPO_REQUEST_REJECTED'
  // Data Deletion
  | 'DELETION_REQUESTED'
  | 'DELETION_CANCELLED'
  | 'DELETION_EXECUTED'
  // Data Retention
  | 'DATA_ARCHIVED'
  | 'DATA_PURGED'
  | 'RETENTION_CHECK_RUN'
  // Admin Actions
  | 'ADMIN_LOGIN'
  | 'ADMIN_ACTION'
  | 'COMPLIANCE_ALERT_CREATED'
  | 'COMPLIANCE_ALERT_RESOLVED';

export type EntityType =
  | 'user'
  | 'order'
  | 'payment'
  | 'security_breach'
  | 'dpo_request'
  | 'legal_acceptance'
  | 'cookie_consent'
  | 'deletion_request'
  | 'archived_order'
  | 'compliance_alert'
  | 'session';

interface AuditLogEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Log a compliance action to audit trail
 * Returns the audit log ID for reference
 */
export async function logAudit(entry: AuditLogEntry): Promise<string> {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        userId: entry.userId,
        sessionId: entry.sessionId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        details: entry.details || {},
      },
    });

    console.log(`[AUDIT] ${entry.action} - ${entry.entityType}${entry.entityId ? ` (${entry.entityId})` : ''}`);

    return auditLog.id;
  } catch (error) {
    console.error('[AUDIT] Failed to log audit entry:', error);
    // Don't throw - audit logging should never break app functionality
    return '';
  }
}

/**
 * Log legal document acceptance
 */
export async function logLegalAcceptance(data: {
  userId?: string;
  sessionId: string;
  documentType: string;
  version: string;
  ipAddress: string;
  userAgent: string;
  acceptMethod: string;
}): Promise<string> {
  return logAudit({
    action: 'LEGAL_ACCEPTED',
    entityType: 'legal_acceptance',
    userId: data.userId,
    sessionId: data.sessionId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: {
      documentType: data.documentType,
      version: data.version,
      acceptMethod: data.acceptMethod,
    },
  });
}

/**
 * Log security breach detection
 */
export async function logBreachDetection(data: {
  breachId: string;
  severity: string;
  breachType: string;
  affectedRecords: number;
  affectedUsers: string[];
  ipAddress?: string;
}): Promise<string> {
  return logAudit({
    action: 'BREACH_DETECTED',
    entityType: 'security_breach',
    entityId: data.breachId,
    ipAddress: data.ipAddress,
    details: {
      severity: data.severity,
      breachType: data.breachType,
      affectedRecords: data.affectedRecords,
      affectedUsersCount: data.affectedUsers.length,
    },
  });
}

/**
 * Log breach notification sent
 */
export async function logBreachNotification(data: {
  breachId: string;
  notifiedUsers: number;
  failedUsers: number;
  dpoNotified: boolean;
}): Promise<string> {
  return logAudit({
    action: 'BREACH_NOTIFIED',
    entityType: 'security_breach',
    entityId: data.breachId,
    details: {
      notifiedUsers: data.notifiedUsers,
      failedUsers: data.failedUsers,
      dpoNotified: data.dpoNotified,
    },
  });
}

/**
 * Log DPO request creation
 */
export async function logDPORequest(data: {
  requestId: string;
  userId?: string;
  email: string;
  requestType: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  return logAudit({
    action: 'DPO_REQUEST_CREATED',
    entityType: 'dpo_request',
    entityId: data.requestId,
    userId: data.userId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: {
      email: data.email,
      requestType: data.requestType,
    },
  });
}

/**
 * Log cookie consent
 */
export async function logCookieConsent(data: {
  userId?: string;
  sessionId: string;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  return logAudit({
    action: 'COOKIE_CONSENT_GRANTED',
    entityType: 'cookie_consent',
    userId: data.userId,
    sessionId: data.sessionId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: {
      essential: data.essential,
      analytics: data.analytics,
      marketing: data.marketing,
    },
  });
}

/**
 * Log user deletion request
 */
export async function logDeletionRequest(data: {
  requestId: string;
  userId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  return logAudit({
    action: 'DELETION_REQUESTED',
    entityType: 'deletion_request',
    entityId: data.requestId,
    userId: data.userId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: {
      reason: data.reason,
    },
  });
}

/**
 * Log data archival (7-year retention)
 */
export async function logDataArchival(data: {
  orderId: string;
  archivedOrderId: string;
  taxYear: string;
  retainUntil: Date;
}): Promise<string> {
  return logAudit({
    action: 'DATA_ARCHIVED',
    entityType: 'archived_order',
    entityId: data.archivedOrderId,
    details: {
      originalOrderId: data.orderId,
      taxYear: data.taxYear,
      retainUntil: data.retainUntil.toISOString(),
    },
  });
}

/**
 * Log data purge (after retention period)
 */
export async function logDataPurge(data: {
  recordType: string;
  recordId: string;
  reason: string;
}): Promise<string> {
  return logAudit({
    action: 'DATA_PURGED',
    entityType: data.recordType as EntityType,
    entityId: data.recordId,
    details: {
      reason: data.reason,
    },
  });
}

/**
 * Log failed login attempt (for brute force detection)
 */
export async function logFailedLogin(data: {
  email: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
}): Promise<string> {
  return logAudit({
    action: 'LOGIN_FAILED',
    entityType: 'session',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: {
      email: data.email,
      reason: data.reason,
    },
  });
}

/**
 * Log successful login
 */
export async function logSuccessfulLogin(data: {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}): Promise<string> {
  return logAudit({
    action: 'LOGIN_SUCCESS',
    entityType: 'session',
    userId: data.userId,
    sessionId: data.sessionId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: {},
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(data: {
  adminId: string;
  action: string;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<string> {
  return logAudit({
    action: 'ADMIN_ACTION',
    entityType: data.entityType,
    entityId: data.entityId,
    userId: data.adminId,
    ipAddress: data.ipAddress,
    details: {
      adminAction: data.action,
      ...data.details,
    },
  });
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
  entityType: EntityType,
  entityId: string
): Promise<any[]> {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get audit logs for a specific user
 */
export async function getAuditLogsForUser(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  return prisma.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit: number = 50): Promise<any[]> {
  return prisma.auditLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Search audit logs with filters
 */
export async function searchAuditLogs(filters: {
  action?: AuditAction;
  entityType?: EntityType;
  userId?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  const where: any = {};

  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.userId) where.userId = filters.userId;
  if (filters.ipAddress) where.ipAddress = filters.ipAddress;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: filters.limit || 100,
  });
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<{
  totalLogs: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  uniqueUsers: number;
  uniqueIPs: number;
}> {
  const since = new Date();
  if (timeRange === 'day') {
    since.setDate(since.getDate() - 1);
  } else if (timeRange === 'week') {
    since.setDate(since.getDate() - 7);
  } else {
    since.setMonth(since.getMonth() - 1);
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: since,
      },
    },
  });

  const byAction: Record<string, number> = {};
  const byEntityType: Record<string, number> = {};
  const uniqueUsers = new Set<string>();
  const uniqueIPs = new Set<string>();

  logs.forEach((log) => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1;
    if (log.userId) uniqueUsers.add(log.userId);
    if (log.ipAddress) uniqueIPs.add(log.ipAddress);
  });

  return {
    totalLogs: logs.length,
    byAction,
    byEntityType,
    uniqueUsers: uniqueUsers.size,
    uniqueIPs: uniqueIPs.size,
  };
}

