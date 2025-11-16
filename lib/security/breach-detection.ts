/**
 * NEW FILE: Security Breach Detection System
 * Purpose: Monitor and detect security incidents requiring 72-hour notification
 * Compliance: DPDPA 2023 § 8 (Data breach notification), GDPR Article 33
 * 
 * Detection Categories:
 * - Brute force attacks (failed login attempts)
 * - Unusual database access patterns
 * - API rate limit violations
 * - Suspicious payment activity
 * - SQL injection attempts
 * - Unauthorized data access
 */

import { prisma } from '@/lib/prisma';

export type BreachSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type BreachType =
  | 'unauthorized_access'
  | 'data_leak'
  | 'sql_injection'
  | 'brute_force'
  | 'api_abuse'
  | 'payment_fraud'
  | 'privilege_escalation';

interface BreachDetectionResult {
  isBreachDetected: boolean;
  severity: BreachSeverity;
  breachType: BreachType;
  affectedRecords: number;
  affectedUsers: string[];
  description: string;
  mitigationSteps: string[];
}

/**
 * Monitor failed login attempts for brute force attacks
 * Threshold: 10 failed attempts in 15 minutes = CRITICAL breach
 */
export async function detectBruteForceAttack(
  ipAddress: string,
  timeWindowMinutes: number = 15
): Promise<BreachDetectionResult | null> {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  // Check failed login attempts from this IP
  const failedAttempts = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "AuditLog"
    WHERE "action" = 'LOGIN_FAILED'
      AND "ipAddress" = ${ipAddress}
      AND "createdAt" >= ${since}
  `.catch(() => [{ count: BigInt(0) }]);

  const attemptCount = Number(failedAttempts[0]?.count || 0);

  if (attemptCount >= 10) {
    return {
      isBreachDetected: true,
      severity: 'CRITICAL',
      breachType: 'brute_force',
      affectedRecords: attemptCount,
      affectedUsers: [], // No users affected yet (attack prevented)
      description: `Brute force attack detected: ${attemptCount} failed login attempts from IP ${ipAddress} in ${timeWindowMinutes} minutes`,
      mitigationSteps: [
        `Block IP address ${ipAddress} for 24 hours`,
        'Enable CAPTCHA for login page',
        'Force password reset for targeted accounts',
        'Review authentication logs for successful breaches',
        'Notify security team immediately',
      ],
    };
  }

  return null;
}

/**
 * Detect unusual database access patterns
 * Threshold: 1000+ records accessed in single query = HIGH breach risk
 */
export async function detectUnusualDatabaseAccess(
  userId: string,
  recordsAccessed: number
): Promise<BreachDetectionResult | null> {
  const THRESHOLD = 1000;

  if (recordsAccessed >= THRESHOLD) {
    return {
      isBreachDetected: true,
      severity: 'HIGH',
      breachType: 'unauthorized_access',
      affectedRecords: recordsAccessed,
      affectedUsers: [userId],
      description: `Unusual database access: User ${userId} accessed ${recordsAccessed} records in single query (threshold: ${THRESHOLD})`,
      mitigationSteps: [
        'Suspend user account immediately',
        'Review query logs for data exfiltration',
        'Check if user credentials were compromised',
        'Audit all recent actions by this user',
        'Notify affected users if data was accessed',
      ],
    };
  }

  return null;
}

/**
 * Detect API rate limit violations (potential DDoS or scraping)
 * Threshold: 1000 requests per minute = CRITICAL
 */
export async function detectAPIAbuse(
  ipAddress: string,
  endpoint: string,
  requestCount: number
): Promise<BreachDetectionResult | null> {
  const THRESHOLD = 1000;

  if (requestCount >= THRESHOLD) {
    return {
      isBreachDetected: true,
      severity: 'CRITICAL',
      breachType: 'api_abuse',
      affectedRecords: requestCount,
      affectedUsers: [],
      description: `API abuse detected: ${requestCount} requests to ${endpoint} from IP ${ipAddress} in 1 minute (threshold: ${THRESHOLD})`,
      mitigationSteps: [
        `Block IP address ${ipAddress} immediately`,
        'Enable rate limiting middleware',
        'Review server logs for attack pattern',
        'Check if API keys were compromised',
        'Scale infrastructure if DDoS attack',
      ],
    };
  }

  return null;
}

/**
 * Detect SQL injection attempts
 * Pattern: SQL keywords in user input
 */
export function detectSQLInjection(
  userInput: string,
  userId?: string
): BreachDetectionResult | null {
  const sqlPatterns = [
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(--|\#|\/\*)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];

  const isSQLInjection = sqlPatterns.some((pattern) => pattern.test(userInput));

  if (isSQLInjection) {
    return {
      isBreachDetected: true,
      severity: 'CRITICAL',
      breachType: 'sql_injection',
      affectedRecords: 0,
      affectedUsers: userId ? [userId] : [],
      description: `SQL injection attempt detected in user input: "${userInput.substring(0, 100)}..."`,
      mitigationSteps: [
        'Block request immediately',
        'Log attack details for investigation',
        'Review all recent queries from this user/IP',
        'Verify parameterized queries are used everywhere',
        'Run security audit on database access layer',
      ],
    };
  }

  return null;
}

/**
 * Detect suspicious payment activity
 * Threshold: 5+ failed payment attempts in 10 minutes = HIGH risk
 */
export async function detectPaymentFraud(
  userId: string,
  timeWindowMinutes: number = 10
): Promise<BreachDetectionResult | null> {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const failedPayments = await prisma.payment.count({
    where: {
      order: {
        customerId: userId,
      },
      status: 'FAILED',
      createdAt: {
        gte: since,
      },
    },
  });

  if (failedPayments >= 5) {
    return {
      isBreachDetected: true,
      severity: 'HIGH',
      breachType: 'payment_fraud',
      affectedRecords: failedPayments,
      affectedUsers: [userId],
      description: `Suspicious payment activity: ${failedPayments} failed payment attempts by user ${userId} in ${timeWindowMinutes} minutes`,
      mitigationSteps: [
        'Suspend user account temporarily',
        'Review payment logs for stolen card usage',
        'Contact payment gateway for fraud analysis',
        'Notify user of suspicious activity',
        'Require additional verification for next payment',
      ],
    };
  }

  return null;
}

/**
 * Record security breach in database
 * Triggers 72-hour notification countdown
 */
export async function recordSecurityBreach(
  breach: BreachDetectionResult
): Promise<string> {
  const securityBreach = await prisma.securityBreach.create({
    data: {
      severity: breach.severity,
      breachType: breach.breachType,
      affectedRecords: breach.affectedRecords,
      affectedUsers: breach.affectedUsers,
      description: breach.description,
      mitigationSteps: breach.mitigationSteps,
      detectedAt: new Date(),
    },
  });

  // Create compliance alert
  await prisma.complianceAlert.create({
    data: {
      alertType: 'BREACH_DETECTED',
      severity: breach.severity,
      title: `Security Breach: ${breach.breachType}`,
      description: breach.description,
    },
  });

  console.log(`[SECURITY BREACH] ${breach.severity} breach detected:`, breach.description);

  return securityBreach.id;
}

/**
 * Check if 72-hour notification deadline is approaching
 * Returns hours remaining until deadline
 */
export async function checkNotificationDeadline(breachId: string): Promise<number> {
  const breach = await prisma.securityBreach.findUnique({
    where: { id: breachId },
  });

  if (!breach) {
    throw new Error(`Breach ${breachId} not found`);
  }

  const detectedAt = breach.detectedAt.getTime();
  const deadline = detectedAt + 72 * 60 * 60 * 1000; // 72 hours
  const now = Date.now();
  const hoursRemaining = (deadline - now) / (60 * 60 * 1000);

  return Math.max(0, hoursRemaining);
}

/**
 * Get all unnotified breaches approaching 72-hour deadline
 */
export async function getUnnotifiedBreaches(): Promise<
  Array<{
    id: string;
    severity: string;
    breachType: string;
    detectedAt: Date;
    hoursRemaining: number;
  }>
> {
  const breaches = await prisma.securityBreach.findMany({
    where: {
      notifiedAt: null,
      severity: {
        in: ['CRITICAL', 'HIGH'], // Only notify for critical/high severity
      },
    },
    orderBy: {
      detectedAt: 'asc',
    },
  });

  return breaches.map((breach) => {
    const detectedAt = breach.detectedAt.getTime();
    const deadline = detectedAt + 72 * 60 * 60 * 1000;
    const now = Date.now();
    const hoursRemaining = Math.max(0, (deadline - now) / (60 * 60 * 1000));

    return {
      id: breach.id,
      severity: breach.severity,
      breachType: breach.breachType,
      detectedAt: breach.detectedAt,
      hoursRemaining,
    };
  });
}

/**
 * Comprehensive breach detection runner
 * Call this from middleware or API routes
 */
export async function runBreachDetection(context: {
  userId?: string;
  ipAddress: string;
  endpoint?: string;
  userInput?: string;
}): Promise<BreachDetectionResult | null> {
  const { userId, ipAddress, endpoint, userInput } = context;

  // Check for SQL injection
  if (userInput) {
    const sqlBreach = detectSQLInjection(userInput, userId);
    if (sqlBreach) {
      await recordSecurityBreach(sqlBreach);
      return sqlBreach;
    }
  }

  // Check for brute force
  const bruteForceBreach = await detectBruteForceAttack(ipAddress);
  if (bruteForceBreach) {
    await recordSecurityBreach(bruteForceBreach);
    return bruteForceBreach;
  }

  // Check for payment fraud
  if (userId) {
    const paymentBreach = await detectPaymentFraud(userId);
    if (paymentBreach) {
      await recordSecurityBreach(paymentBreach);
      return paymentBreach;
    }
  }

  return null;
}
