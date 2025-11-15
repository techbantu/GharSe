/**
 * COMMISSION & PAYOUT CALCULATOR
 * 
 * Purpose: Calculate platform commissions and chef payouts
 * 
 * Architecture:
 * - Order-level commission calculation
 * - Automatic analytics update
 * - Payout generation and tracking
 * - Subscription tier-based rates
 * 
 * Commission Structure:
 * - Free Tier: 10% commission
 * - Basic Tier: 8% commission (₹999/month)
 * - Premium Tier: 5% commission (₹2999/month)
 */

import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';

// Commission rates by subscription tier
const COMMISSION_RATES = {
  free: 0.10,    // 10%
  basic: 0.08,   // 8%
  premium: 0.05, // 5%
} as const;

export interface CommissionBreakdown {
  orderTotal: number;
  commissionRate: number;
  platformFee: number;
  chefEarnings: number;
  subscriptionTier: string;
}

export interface PayoutSummary {
  chefId: string;
  period: string;
  totalOrders: number;
  totalRevenue: number;
  totalPlatformFee: number;
  netEarnings: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
}

/**
 * Calculate commission for a single order
 */
export function calculateCommission(
  orderTotal: number,
  subscriptionTier: string = 'free'
): CommissionBreakdown {
  const tier = subscriptionTier.toLowerCase() as keyof typeof COMMISSION_RATES;
  const commissionRate = COMMISSION_RATES[tier] || COMMISSION_RATES.free;
  
  const platformFee = orderTotal * commissionRate;
  const chefEarnings = orderTotal - platformFee;

  return {
    orderTotal,
    commissionRate,
    platformFee: Math.round(platformFee * 100) / 100,
    chefEarnings: Math.round(chefEarnings * 100) / 100,
    subscriptionTier: tier,
  };
}

/**
 * Update chef analytics when order is completed
 */
export async function updateChefAnalytics(
  chefId: string,
  orderId: string,
  orderTotal: number,
  status: 'completed' | 'cancelled'
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get chef's commission rate
    const chef = await prisma.chef.findUnique({
      where: { id: chefId },
      select: { subscriptionTier: true },
    });

    if (!chef) {
      throw new Error('Chef not found');
    }

    const commission = calculateCommission(orderTotal, chef.subscriptionTier);

    // Upsert analytics for today
    const existing = await prisma.chefAnalytics.findUnique({
      where: { chefId_date: { chefId, date: today } },
    });

    if (existing) {
      // Update existing record
      await prisma.chefAnalytics.update({
        where: { chefId_date: { chefId, date: today } },
        data: {
          ordersCount: { increment: status === 'completed' ? 1 : 0 },
          cancelledOrders: { increment: status === 'cancelled' ? 1 : 0 },
          revenue: { increment: status === 'completed' ? orderTotal : 0 },
          platformFee: { increment: status === 'completed' ? commission.platformFee : 0 },
          netEarnings: { increment: status === 'completed' ? commission.chefEarnings : 0 },
          avgOrderValue: status === 'completed'
            ? (existing.revenue + orderTotal) / (existing.ordersCount + 1)
            : existing.avgOrderValue,
        },
      });
    } else {
      // Create new record
      await prisma.chefAnalytics.create({
        data: {
          chefId,
          date: today,
          ordersCount: status === 'completed' ? 1 : 0,
          cancelledOrders: status === 'cancelled' ? 1 : 0,
          revenue: status === 'completed' ? orderTotal : 0,
          platformFee: status === 'completed' ? commission.platformFee : 0,
          netEarnings: status === 'completed' ? commission.chefEarnings : 0,
          avgOrderValue: status === 'completed' ? orderTotal : 0,
        },
      });
    }

    logger.info('Chef analytics updated', {
      chefId,
      orderId,
      date: today,
      status,
      orderTotal,
      platformFee: commission.platformFee,
    });
  } catch (error) {
    logger.error('Failed to update chef analytics', {
      chefId,
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - this is non-critical
  }
}

/**
 * Generate payout for a chef for a specific period
 */
export async function generatePayout(
  chefId: string,
  period: string // Format: "2025-01"
): Promise<PayoutSummary | null> {
  try {
    // Check if payout already exists
    const existingPayout = await prisma.payout.findFirst({
      where: { chefId, period },
    });

    if (existingPayout) {
      logger.info('Payout already exists', { chefId, period });
      return {
        chefId: existingPayout.chefId,
        period: existingPayout.period,
        totalOrders: existingPayout.ordersIncluded,
        totalRevenue: existingPayout.totalRevenue,
        totalPlatformFee: existingPayout.platformFee,
        netEarnings: existingPayout.netAmount,
        status: existingPayout.status as any,
      };
    }

    // Parse period (e.g., "2025-01" -> January 2025)
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all completed orders for the period
    const orders = await prisma.order.findMany({
      where: {
        chefId,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        total: true,
      },
    });

    if (orders.length === 0) {
      logger.info('No orders to payout', { chefId, period });
      return null;
    }

    // Get chef's commission rate
    const chef = await prisma.chef.findUnique({
      where: { id: chefId },
      select: { subscriptionTier: true },
    });

    if (!chef) {
      throw new Error('Chef not found');
    }

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const commission = calculateCommission(totalRevenue, chef.subscriptionTier);

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        chefId,
        period,
        amount: commission.chefEarnings,
        ordersIncluded: orders.length,
        totalRevenue,
        platformFee: commission.platformFee,
        netAmount: commission.chefEarnings,
        status: 'PENDING',
      },
    });

    logger.info('Payout generated', {
      chefId,
      period,
      payoutId: payout.id,
      ordersCount: orders.length,
      netAmount: payout.netAmount,
    });

    return {
      chefId: payout.chefId,
      period: payout.period,
      totalOrders: payout.ordersIncluded,
      totalRevenue: payout.totalRevenue,
      totalPlatformFee: payout.platformFee,
      netEarnings: payout.netAmount,
      status: payout.status as any,
    };
  } catch (error) {
    logger.error('Failed to generate payout', {
      chefId,
      period,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Process payout (mark as paid)
 */
export async function processPayout(
  payoutId: string,
  paymentMethod: string,
  transactionId: string
): Promise<boolean> {
  try {
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod,
        transactionId,
      },
    });

    logger.info('Payout processed', {
      payoutId,
      paymentMethod,
      transactionId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to process payout', {
      payoutId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Generate payouts for all active chefs for a period
 */
export async function generateAllPayouts(period: string): Promise<PayoutSummary[]> {
  try {
    // Get all active chefs
    const chefs = await prisma.chef.findMany({
      where: {
        status: 'ACTIVE',
        isVerified: true,
      },
      select: { id: true, businessName: true },
    });

    logger.info('Generating payouts for all chefs', {
      period,
      chefsCount: chefs.length,
    });

    const payouts: PayoutSummary[] = [];

    for (const chef of chefs) {
      const payout = await generatePayout(chef.id, period);
      if (payout) {
        payouts.push(payout);
      }
    }

    logger.info('All payouts generated', {
      period,
      payoutsCount: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.netEarnings, 0),
    });

    return payouts;
  } catch (error) {
    logger.error('Failed to generate all payouts', {
      period,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get pending payouts for a chef
 */
export async function getPendingPayouts(chefId: string): Promise<PayoutSummary[]> {
  try {
    const payouts = await prisma.payout.findMany({
      where: {
        chefId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map(p => ({
      chefId: p.chefId,
      period: p.period,
      totalOrders: p.ordersIncluded,
      totalRevenue: p.totalRevenue,
      totalPlatformFee: p.platformFee,
      netEarnings: p.netAmount,
      status: p.status as any,
    }));
  } catch (error) {
    logger.error('Failed to get pending payouts', {
      chefId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export default {
  calculateCommission,
  updateChefAnalytics,
  generatePayout,
  processPayout,
  generateAllPayouts,
  getPendingPayouts,
};

