/**
 * REFERRAL ENGINE - Genius Viral Growth System
 * 
 * Purpose: Central orchestration for referral flow, rewards, and gamification
 * 
 * Features:
 * - Process new referrals with fraud detection
 * - Auto-apply referee discount at checkout
 * - Reward referrer after delivery (with 24hr hold)
 * - Trigger milestone jackpots (5th, 10th, 20th referral)
 * - Monthly champion tracking
 * - Complete end-to-end referral lifecycle management
 * 
 * Flow:
 * 1. Friend signs up with code → processNewReferral()
 * 2. Friend checks out → checkRefereeDiscount()
 * 3. Order delivered → rewardReferrerOnDelivery()
 * 4. Check milestones → checkAndRewardMilestones()
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { creditWallet } from '@/lib/wallet-manager';
import { calculateFraudScore, DeviceFingerprint } from '@/lib/fraud-detector';

/**
 * Referral processing result
 */
export interface ReferralProcessResult {
  success: boolean;
  referralId?: string;
  fraudScore?: number;
  message: string;
  requiresVerification?: boolean;
}

/**
 * Referee discount check result
 */
export interface RefereeDiscountResult {
  eligible: boolean;
  amount: number;
  referralId?: string;
  message: string;
}

/**
 * Milestone reward amounts (with randomness for excitement)
 */
const MILESTONE_REWARDS = {
  FIFTH_REFERRAL: { min: 200, max: 500 },
  TENTH_REFERRAL: { min: 500, max: 1000 },
  TWENTIETH_REFERRAL: { min: 1000, max: 2000 },
};

/**
 * Process a new referral when user signs up with a referral code
 * 
 * @param referralCode - Code used by new user
 * @param refereeId - New user's ID
 * @param refereeEmail - New user's email
 * @param refereePhone - New user's phone
 * @param ipAddress - Signup IP address
 * @param deviceFingerprint - Device data
 * @returns Promise<ReferralProcessResult>
 */
export async function processNewReferral(
  referralCode: string,
  refereeId: string,
  refereeEmail: string,
  refereePhone: string,
  ipAddress: string,
  deviceFingerprint?: DeviceFingerprint
): Promise<ReferralProcessResult> {
  try {
    // Find referrer by code
    const referrer = await prisma.customer.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return {
        success: false,
        message: 'Invalid referral code',
      };
    }

    // Check if referee already has a referral record (can only be referred once)
    const existingReferral = await prisma.referral.findUnique({
      where: { refereeId },
    });

    if (existingReferral) {
      return {
        success: false,
        message: 'User already has an active referral',
      };
    }

    // Run fraud detection
    const fraudCheck = await calculateFraudScore(
      refereeId,
      referrer.id,
      refereeEmail,
      refereePhone,
      ipAddress,
      deviceFingerprint
    );

    logger.info('Fraud check result for new referral', {
      referralCode,
      refereeId,
      fraudScore: fraudCheck.fraudScore,
      riskLevel: fraudCheck.riskLevel,
      flags: fraudCheck.flags,
    });

    // Determine initial status based on fraud score
    let status: string;
    if (fraudCheck.shouldBlock) {
      status = 'EXPIRED'; // Block immediately
    } else if (fraudCheck.requiresVerification) {
      status = 'PENDING_VERIFICATION'; // Hold for manual review
    } else {
      status = 'PENDING'; // Good to go, waiting for first order
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        referralCode,
        referrerReward: 50, // ₹50 for referrer
        refereeReward: 50, // ₹50 for referee
        status,
        fraudScore: fraudCheck.fraudScore,
        ipAddress,
        deviceFingerprint: deviceFingerprint ? JSON.stringify(deviceFingerprint) : null,
      },
    });

    logger.info('Referral created', {
      referralId: referral.id,
      referrerId: referrer.id,
      refereeId,
      status,
      fraudScore: fraudCheck.fraudScore,
    });

    return {
      success: true,
      referralId: referral.id,
      fraudScore: fraudCheck.fraudScore,
      message: fraudCheck.shouldBlock
        ? 'Referral blocked due to high fraud risk'
        : fraudCheck.requiresVerification
        ? 'Referral created but requires verification'
        : 'Referral created successfully',
      requiresVerification: fraudCheck.requiresVerification,
    };
  } catch (error) {
    logger.error('Failed to process referral', {
      referralCode,
      refereeId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      message: 'Failed to process referral',
    };
  }
}

/**
 * Check if a customer is eligible for referral discount on their first order
 * 
 * @param customerId - Customer ID
 * @returns Promise<RefereeDiscountResult>
 */
export async function checkRefereeDiscount(
  customerId: string
): Promise<RefereeDiscountResult> {
  try {
    // Check if customer was referred
    const referral = await prisma.referral.findUnique({
      where: { refereeId: customerId },
    });

    if (!referral) {
      return {
        eligible: false,
        amount: 0,
        message: 'Customer was not referred',
      };
    }

    // Check if discount already applied
    if (referral.refereeDiscountApplied) {
      return {
        eligible: false,
        amount: 0,
        message: 'Referral discount already used',
      };
    }

    // Check referral status
    if (referral.status === 'EXPIRED') {
      return {
        eligible: false,
        amount: 0,
        message: 'Referral expired or blocked',
      };
    }

    if (referral.status === 'PENDING_VERIFICATION') {
      return {
        eligible: false,
        amount: 0,
        message: 'Referral pending verification',
      };
    }

    // Check if customer already placed orders
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { totalOrders: true },
    });

    if (!customer || customer.totalOrders > 0) {
      return {
        eligible: false,
        amount: 0,
        message: 'Discount only valid for first order',
      };
    }

    // All checks passed - eligible for discount!
    return {
      eligible: true,
      amount: referral.refereeReward,
      referralId: referral.id,
      message: `Welcome bonus: ₹${referral.refereeReward} off your first order!`,
    };
  } catch (error) {
    logger.error('Failed to check referee discount', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      eligible: false,
      amount: 0,
      message: 'Error checking referral discount',
    };
  }
}

/**
 * Mark referee discount as applied (called when order is placed)
 * 
 * @param referralId - Referral ID
 * @param orderId - Order ID
 * @returns Promise<boolean>
 */
export async function applyRefereeDiscount(
  referralId: string,
  orderId: string
): Promise<boolean> {
  try {
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        refereeDiscountApplied: true,
        firstOrderId: orderId,
      },
    });

    logger.info('Referee discount applied', {
      referralId,
      orderId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to apply referee discount', {
      referralId,
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Reward referrer after order is delivered (with 24-hour hold)
 * 
 * @param customerId - Customer ID (referee)
 * @returns Promise<boolean>
 */
export async function rewardReferrerOnDelivery(customerId: string): Promise<boolean> {
  try {
    // Find referral record
    const referral = await prisma.referral.findUnique({
      where: { refereeId: customerId },
      include: {
        referrer: true,
        referee: true,
      },
    });

    if (!referral) {
      logger.debug('No referral found for customer', { customerId });
      return false;
    }

    // Check if reward already paid
    if (referral.rewardPaidAt) {
      logger.debug('Referral reward already paid', {
        referralId: referral.id,
        paidAt: referral.rewardPaidAt,
      });
      return false;
    }

    // Check referral status
    if (referral.status !== 'PENDING' && referral.status !== 'COMPLETED') {
      logger.debug('Referral not in valid status for reward', {
        referralId: referral.id,
        status: referral.status,
      });
      return false;
    }

    // Mark delivery confirmed
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        deliveryConfirmed: true,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Credit referrer's wallet (with 24-hour hold for fraud prevention)
    await creditWallet(
      referral.referrerId,
      referral.referrerReward,
      'REFERRAL_REWARD',
      referral.id,
      `Referral reward: ${referral.referee.name} completed their first order`,
      false // Apply 24-hour hold
    );

    // Mark reward as paid
    await prisma.referral.update({
      where: { id: referral.id },
      data: { rewardPaidAt: new Date() },
    });

    logger.info('Referrer rewarded', {
      referralId: referral.id,
      referrerId: referral.referrerId,
      amount: referral.referrerReward,
      refereeName: referral.referee.name,
    });

    // Check if referrer hit any milestones
    await checkAndRewardMilestones(referral.referrerId);

    return true;
  } catch (error) {
    logger.error('Failed to reward referrer', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Check and reward milestone achievements (5th, 10th, 20th referral jackpots)
 * 
 * @param referrerId - Referrer ID
 * @returns Promise<void>
 */
export async function checkAndRewardMilestones(referrerId: string): Promise<void> {
  try {
    // Count completed referrals
    const completedCount = await prisma.referral.count({
      where: {
        referrerId,
        status: 'COMPLETED',
      },
    });

    // Define milestones to check
    const milestones: Array<{
      count: number;
      type: string;
      rewards: { min: number; max: number };
    }> = [
      { count: 5, type: 'FIFTH_REFERRAL', rewards: MILESTONE_REWARDS.FIFTH_REFERRAL },
      { count: 10, type: 'TENTH_REFERRAL', rewards: MILESTONE_REWARDS.TENTH_REFERRAL },
      { count: 20, type: 'TWENTIETH_REFERRAL', rewards: MILESTONE_REWARDS.TWENTIETH_REFERRAL },
    ];

    for (const milestone of milestones) {
      if (completedCount === milestone.count) {
        // Check if milestone already rewarded
        const existingMilestone = await prisma.referralMilestone.findFirst({
          where: {
            customerId: referrerId,
            milestoneType: milestone.type,
          },
        });

        if (existingMilestone) {
          continue; // Already rewarded
        }

        // Generate random jackpot amount for excitement
        const rewardAmount = Math.floor(
          Math.random() * (milestone.rewards.max - milestone.rewards.min + 1) +
            milestone.rewards.min
        );

        // Create milestone record
        const milestoneRecord = await prisma.referralMilestone.create({
          data: {
            customerId: referrerId,
            milestoneType: milestone.type,
            milestoneCount: milestone.count,
            rewardAmount,
            status: 'PAID', // Pay immediately
            paidAt: new Date(),
          },
        });

        // Credit wallet (skip 24hr hold for milestones - they're exciting!)
        await creditWallet(
          referrerId,
          rewardAmount,
          'JACKPOT',
          milestoneRecord.id,
          `🏆 JACKPOT! ${milestone.count} referrals milestone reached!`,
          true // Skip hold for milestone rewards
        );

        logger.info('Milestone jackpot awarded', {
          referrerId,
          milestoneType: milestone.type,
          milestoneCount: milestone.count,
          rewardAmount,
        });

        // TODO: Send notification (WhatsApp/Email/Push)
      }
    }
  } catch (error) {
    logger.error('Failed to check milestones', {
      referrerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get referral statistics for a customer
 * 
 * @param customerId - Customer ID
 * @returns Promise<ReferralStats>
 */
export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  nextMilestone: {
    type: string;
    currentCount: number;
    requiredCount: number;
    progress: number; // 0-100%
  } | null;
}

export async function getReferralStats(customerId: string): Promise<ReferralStats> {
  try {
    // Get all referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId },
    });

    const completedReferrals = referrals.filter((r) => r.status === 'COMPLETED').length;
    const pendingReferrals = referrals.filter(
      (r) => r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION'
    ).length;

    // Calculate total earned (referral rewards + milestones)
    const referralRewards = referrals
      .filter((r) => r.rewardPaidAt)
      .reduce((sum, r) => sum + r.referrerReward, 0);

    const milestones = await prisma.referralMilestone.findMany({
      where: {
        customerId,
        status: 'PAID',
      },
    });

    const milestoneRewards = milestones.reduce((sum, m) => sum + m.rewardAmount, 0);
    const totalEarned = referralRewards + milestoneRewards;

    // Calculate next milestone
    let nextMilestone = null;
    const milestoneCounts = [5, 10, 20];

    for (const count of milestoneCounts) {
      if (completedReferrals < count) {
        const progress = Math.floor((completedReferrals / count) * 100);
        nextMilestone = {
          type:
            count === 5
              ? 'FIFTH_REFERRAL'
              : count === 10
              ? 'TENTH_REFERRAL'
              : 'TWENTIETH_REFERRAL',
          currentCount: completedReferrals,
          requiredCount: count,
          progress,
        };
        break;
      }
    }

    return {
      totalReferrals: referrals.length,
      completedReferrals,
      pendingReferrals,
      totalEarned,
      nextMilestone,
    };
  } catch (error) {
    logger.error('Failed to get referral stats', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalEarned: 0,
      nextMilestone: null,
    };
  }
}

/**
 * Get referral history with details
 * 
 * @param customerId - Customer ID
 * @param limit - Number of records to return
 * @returns Promise<ReferralHistoryItem[]>
 */
export interface ReferralHistoryItem {
  id: string;
  refereeName: string;
  refereeEmail: string;
  status: string;
  rewardAmount: number;
  isPaid: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export async function getReferralHistory(
  customerId: string,
  limit: number = 50
): Promise<ReferralHistoryItem[]> {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customerId },
      include: {
        referee: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return referrals.map((r) => ({
      id: r.id,
      refereeName: r.referee.name,
      refereeEmail: r.referee.email,
      status: r.status,
      rewardAmount: r.referrerReward,
      isPaid: !!r.rewardPaidAt,
      createdAt: r.createdAt,
      completedAt: r.completedAt || undefined,
    }));
  } catch (error) {
    logger.error('Failed to get referral history', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return [];
  }
}

/**
 * Get leaderboard data for current month
 * 
 * @param limit - Number of top referrers to return
 * @returns Promise<LeaderboardEntry[]>
 */
export interface LeaderboardEntry {
  rank: number;
  customerId: string;
  customerName: string;
  referralCount: number;
  totalEarned: number;
}

export async function getMonthlyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed referrals this month grouped by referrer
    const referrals = await prisma.referral.groupBy({
      by: ['referrerId'],
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startOfMonth },
      },
      _count: { id: true },
      _sum: { referrerReward: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: limit,
    });

    // Get customer names
    const leaderboard: LeaderboardEntry[] = [];

    for (let i = 0; i < referrals.length; i++) {
      const referral = referrals[i];
      const customer = await prisma.customer.findUnique({
        where: { id: referral.referrerId },
        select: { name: true },
      });

      if (customer) {
        leaderboard.push({
          rank: i + 1,
          customerId: referral.referrerId,
          customerName: customer.name,
          referralCount: referral._count.id,
          totalEarned: referral._sum.referrerReward || 0,
        });
      }
    }

    return leaderboard;
  } catch (error) {
    logger.error('Failed to get leaderboard', {
      error: error instanceof Error ? error.message : String(error),
    });

    return [];
  }
}

/**
 * Award monthly champion prize
 * Called by cron job at end of each month
 * 
 * @returns Promise<void>
 */
export async function awardMonthlyChampion(): Promise<void> {
  try {
    const leaderboard = await getMonthlyLeaderboard(1);

    if (leaderboard.length === 0) {
      logger.info('No referrals this month, skipping champion award');
      return;
    }

    const champion = leaderboard[0];
    const championPrize = 5000; // ₹5000

    // Create milestone record
    const milestone = await prisma.referralMilestone.create({
      data: {
        customerId: champion.customerId,
        milestoneType: 'MONTHLY_CHAMPION',
        milestoneCount: champion.referralCount,
        rewardAmount: championPrize,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Credit wallet (no hold for champion prize)
    await creditWallet(
      champion.customerId,
      championPrize,
      'MONTHLY_CHAMPION',
      milestone.id,
      `👑 MONTHLY CHAMPION! You're #1 with ${champion.referralCount} referrals!`,
      true // Skip hold
    );

    logger.info('Monthly champion awarded', {
      customerId: champion.customerId,
      customerName: champion.customerName,
      referralCount: champion.referralCount,
      prize: championPrize,
    });

    // TODO: Send special notification (email + WhatsApp)
  } catch (error) {
    logger.error('Failed to award monthly champion', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

