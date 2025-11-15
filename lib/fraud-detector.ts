/**
 * FRAUD DETECTOR - Anti-Gaming Shield for Referral System
 * 
 * Purpose: Detect and prevent fraudulent referrals using multi-layer analysis
 * 
 * Features:
 * - IP address tracking and duplication detection
 * - Device fingerprinting (browser, OS, screen size)
 * - Email/phone pattern matching (test1@, test2@, etc.)
 * - Velocity checks (too many referrals too fast)
 * - Risk scoring algorithm (0-100)
 * - Automatic flagging for manual review
 * 
 * Fraud Score Thresholds:
 * - 0-20: Safe (auto-approve)
 * - 21-60: Low risk (auto-approve with monitoring)
 * - 61-80: High risk (pending verification, manual review)
 * - 81-100: Very high risk (block reward, admin review required)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Device fingerprint data
 */
export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
}

/**
 * Fraud check result
 */
export interface FraudCheckResult {
  fraudScore: number; // 0-100
  riskLevel: 'SAFE' | 'LOW' | 'HIGH' | 'CRITICAL';
  flags: string[]; // List of suspicious indicators
  requiresVerification: boolean;
  shouldBlock: boolean;
}

/**
 * Calculate fraud score for a referral
 * 
 * @param refereeId - New user who used referral code
 * @param referrerId - User who shared the code
 * @param refereeEmail - Referee's email
 * @param refereePhone - Referee's phone
 * @param ipAddress - Referee's IP address
 * @param deviceFingerprint - Referee's device data
 * @returns Promise<FraudCheckResult>
 */
export async function calculateFraudScore(
  refereeId: string,
  referrerId: string,
  refereeEmail: string,
  refereePhone: string,
  ipAddress: string,
  deviceFingerprint?: DeviceFingerprint
): Promise<FraudCheckResult> {
  let fraudScore = 0;
  const flags: string[] = [];

  try {
    // Check 1: IP Address Duplication (30 points)
    const ipDuplication = await checkIPDuplication(referrerId, ipAddress);
    if (ipDuplication.isDuplicate) {
      fraudScore += 30;
      flags.push(`IP address matches ${ipDuplication.count} existing referrals`);
    }

    // Check 2: Email Pattern Matching (25 points)
    const emailPattern = checkEmailPattern(refereeEmail);
    if (emailPattern.isSuspicious) {
      fraudScore += 25;
      flags.push(emailPattern.reason);
    }

    // Check 3: Phone Pattern Matching (25 points)
    const phonePattern = checkPhonePattern(refereePhone);
    if (phonePattern.isSuspicious) {
      fraudScore += 25;
      flags.push(phonePattern.reason);
    }

    // Check 4: Velocity Check (20 points)
    const velocity = await checkReferralVelocity(referrerId);
    if (velocity.tooFast) {
      fraudScore += 20;
      flags.push(`${velocity.count} referrals in ${velocity.timeWindow} minutes (velocity limit exceeded)`);
    }

    // Check 5: Device Fingerprint (15 points)
    if (deviceFingerprint) {
      const deviceMatch = await checkDeviceFingerprint(referrerId, deviceFingerprint);
      if (deviceMatch.isDuplicate) {
        fraudScore += 15;
        flags.push(`Device fingerprint matches ${deviceMatch.count} existing referrals`);
      }
    }

    // Check 6: Self-Referral (INSTANT BLOCK - 100 points)
    const selfReferral = await checkSelfReferral(refereeEmail, refereePhone, referrerId);
    if (selfReferral.isSelfReferral) {
      fraudScore = 100;
      flags.push('Self-referral detected (same user)');
    }

    // Check 7: Email Domain Blacklist (40 points)
    const emailDomain = checkEmailDomain(refereeEmail);
    if (emailDomain.isBlacklisted) {
      fraudScore += 40;
      flags.push(`Email domain "${emailDomain.domain}" is blacklisted (temp email service)`);
    }

    // Check 8: Referrer's History (10 points if suspicious)
    const referrerHistory = await checkReferrerHistory(referrerId);
    if (referrerHistory.hasSuspiciousActivity) {
      fraudScore += 10;
      flags.push('Referrer has history of flagged referrals');
    }

    // Cap at 100
    fraudScore = Math.min(fraudScore, 100);

    // Determine risk level and actions
    let riskLevel: 'SAFE' | 'LOW' | 'HIGH' | 'CRITICAL';
    let requiresVerification = false;
    let shouldBlock = false;

    if (fraudScore <= 20) {
      riskLevel = 'SAFE';
    } else if (fraudScore <= 60) {
      riskLevel = 'LOW';
    } else if (fraudScore <= 80) {
      riskLevel = 'HIGH';
      requiresVerification = true;
    } else {
      riskLevel = 'CRITICAL';
      requiresVerification = true;
      shouldBlock = true;
    }

    logger.info('Fraud check completed', {
      refereeId,
      referrerId,
      fraudScore,
      riskLevel,
      flags,
    });

    return {
      fraudScore,
      riskLevel,
      flags,
      requiresVerification,
      shouldBlock,
    };
  } catch (error) {
    logger.error('Fraud check failed', {
      refereeId,
      referrerId,
      error: error instanceof Error ? error.message : String(error),
    });

    // On error, be conservative and require verification
    return {
      fraudScore: 65,
      riskLevel: 'HIGH',
      flags: ['Error during fraud check - requires manual review'],
      requiresVerification: true,
      shouldBlock: false,
    };
  }
}

/**
 * Check for IP address duplication among referrer's referrals
 */
async function checkIPDuplication(
  referrerId: string,
  ipAddress: string
): Promise<{ isDuplicate: boolean; count: number }> {
  const duplicateCount = await prisma.referral.count({
    where: {
      referrerId,
      ipAddress,
    },
  });

  return {
    isDuplicate: duplicateCount > 0,
    count: duplicateCount,
  };
}

/**
 * Check for suspicious email patterns
 */
function checkEmailPattern(email: string): { isSuspicious: boolean; reason: string } {
  const lowercaseEmail = email.toLowerCase();

  // Pattern 1: Sequential test emails (test1@, test2@, user1@, user2@)
  const sequentialPattern = /^(test|user|demo|temp|fake)\d+@/i;
  if (sequentialPattern.test(lowercaseEmail)) {
    return {
      isSuspicious: true,
      reason: 'Email matches sequential test pattern (test1@, user2@, etc.)',
    };
  }

  // Pattern 2: Very short email prefix (a@, ab@, abc@)
  const [prefix] = lowercaseEmail.split('@');
  if (prefix.length <= 2) {
    return {
      isSuspicious: true,
      reason: 'Email prefix too short (likely throwaway account)',
    };
  }

  // Pattern 3: Random character strings (jkdh38d@, xyzabc@)
  const randomPattern = /^[a-z]{2,4}\d{2,4}@/i;
  if (randomPattern.test(lowercaseEmail)) {
    return {
      isSuspicious: true,
      reason: 'Email appears randomly generated',
    };
  }

  return { isSuspicious: false, reason: '' };
}

/**
 * Check for suspicious phone patterns
 */
function checkPhonePattern(phone: string): { isSuspicious: boolean; reason: string } {
  const digits = phone.replace(/\D/g, '');

  // Pattern 1: Sequential numbers (1234567890, 9876543210)
  const isSequential = /^(0123456789|9876543210|1234567890)/.test(digits);
  if (isSequential) {
    return {
      isSuspicious: true,
      reason: 'Phone number is sequential (likely fake)',
    };
  }

  // Pattern 2: Repeating digits (1111111111, 9999999999)
  const isRepeating = /^(\d)\1{9,}$/.test(digits);
  if (isRepeating) {
    return {
      isSuspicious: true,
      reason: 'Phone number has all repeating digits (likely fake)',
    };
  }

  // Pattern 3: Too many zeros
  const zeroCount = (digits.match(/0/g) || []).length;
  if (zeroCount > 7) {
    return {
      isSuspicious: true,
      reason: 'Phone number has too many zeros',
    };
  }

  return { isSuspicious: false, reason: '' };
}

/**
 * Check referral velocity (too many too fast = suspicious)
 */
async function checkReferralVelocity(
  referrerId: string
): Promise<{ tooFast: boolean; count: number; timeWindow: number }> {
  // Check referrals in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentReferrals = await prisma.referral.count({
    where: {
      referrerId,
      createdAt: { gte: oneDayAgo },
    },
  });

  // More than 10 referrals in 24 hours = suspicious
  if (recentReferrals > 10) {
    return { tooFast: true, count: recentReferrals, timeWindow: 1440 };
  }

  // Check referrals in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const veryRecentReferrals = await prisma.referral.count({
    where: {
      referrerId,
      createdAt: { gte: oneHourAgo },
    },
  });

  // More than 3 referrals in 1 hour = very suspicious
  if (veryRecentReferrals > 3) {
    return { tooFast: true, count: veryRecentReferrals, timeWindow: 60 };
  }

  return { tooFast: false, count: recentReferrals, timeWindow: 1440 };
}

/**
 * Check device fingerprint duplication
 */
async function checkDeviceFingerprint(
  referrerId: string,
  fingerprint: DeviceFingerprint
): Promise<{ isDuplicate: boolean; count: number }> {
  const fingerprintString = JSON.stringify(fingerprint);

  const duplicateCount = await prisma.referral.count({
    where: {
      referrerId,
      deviceFingerprint: fingerprintString,
    },
  });

  return {
    isDuplicate: duplicateCount > 0,
    count: duplicateCount,
  };
}

/**
 * Check for self-referral (user referring themselves)
 */
async function checkSelfReferral(
  refereeEmail: string,
  refereePhone: string,
  referrerId: string
): Promise<{ isSelfReferral: boolean }> {
  // Check if referee email/phone matches referrer
  const referrer = await prisma.customer.findUnique({
    where: { id: referrerId },
    select: { email: true, phone: true },
  });

  if (!referrer) {
    return { isSelfReferral: false };
  }

  const emailMatch = referrer.email.toLowerCase() === refereeEmail.toLowerCase();
  const phoneMatch = referrer.phone.replace(/\D/g, '') === refereePhone.replace(/\D/g, '');

  return {
    isSelfReferral: emailMatch || phoneMatch,
  };
}

/**
 * Check if email domain is blacklisted (temporary email services)
 */
function checkEmailDomain(email: string): { isBlacklisted: boolean; domain: string } {
  const domain = email.split('@')[1]?.toLowerCase() || '';

  // Common temporary/disposable email domains
  const blacklistedDomains = [
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
    'trashmail.com',
    'yopmail.com',
    'fakeinbox.com',
    'sharklasers.com',
    'maildrop.cc',
  ];

  return {
    isBlacklisted: blacklistedDomains.includes(domain),
    domain,
  };
}

/**
 * Check referrer's history for suspicious patterns
 */
async function checkReferrerHistory(
  referrerId: string
): Promise<{ hasSuspiciousActivity: boolean }> {
  // Get referrer's past referrals
  const referrals = await prisma.referral.findMany({
    where: { referrerId },
    select: { fraudScore: true, status: true },
  });

  if (referrals.length === 0) {
    return { hasSuspiciousActivity: false };
  }

  // Check if more than 30% of referrals have high fraud scores
  const highFraudCount = referrals.filter((r) => r.fraudScore > 60).length;
  const highFraudPercentage = (highFraudCount / referrals.length) * 100;

  return {
    hasSuspiciousActivity: highFraudPercentage > 30,
  };
}

/**
 * Generate device fingerprint string for storage
 */
export function generateDeviceFingerprintString(fingerprint: DeviceFingerprint): string {
  return JSON.stringify(fingerprint);
}

/**
 * Extract device fingerprint from request headers
 */
export function extractDeviceFingerprintFromHeaders(headers: Headers): DeviceFingerprint {
  return {
    userAgent: headers.get('user-agent') || 'unknown',
    screenResolution: headers.get('sec-ch-viewport-width') || 'unknown',
    timezone: headers.get('timezone') || 'unknown',
    language: headers.get('accept-language')?.split(',')[0] || 'unknown',
    platform: headers.get('sec-ch-ua-platform')?.replace(/"/g, '') || 'unknown',
  };
}

/**
 * Get IP address from request
 */
export function extractIPAddress(request: Request): string {
  // Try multiple headers (for different proxy configurations)
  const headers = request.headers;
  
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  );
}

/**
 * Admin function: Manually approve a flagged referral
 */
export async function adminApproveReferral(
  referralId: string,
  adminId: string,
  notes: string
): Promise<boolean> {
  try {
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'COMPLETED',
        fraudScore: 0, // Reset fraud score after manual approval
      },
    });

    logger.info('Referral manually approved by admin', {
      referralId,
      adminId,
      notes,
    });

    return true;
  } catch (error) {
    logger.error('Failed to manually approve referral', {
      referralId,
      adminId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Admin function: Block a referral permanently
 */
export async function adminBlockReferral(
  referralId: string,
  adminId: string,
  reason: string
): Promise<boolean> {
  try {
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'EXPIRED',
        fraudScore: 100,
      },
    });

    logger.warn('Referral blocked by admin', {
      referralId,
      adminId,
      reason,
    });

    return true;
  } catch (error) {
    logger.error('Failed to block referral', {
      referralId,
      adminId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

