/**
 * FIRST ORDER DISCOUNT SERVICE
 * 
 * Purpose: Manages automatic 20% discount for first-time customers
 * 
 * Features:
 * - Auto-detects first order eligibility based on totalOrders = 0
 * - Calculates 20% discount on subtotal
 * - Tracks discount application
 * - No manual code entry required
 * 
 * Business Rules:
 * - Eligible: totalOrders === 0 (never completed an order)
 * - Discount: 20% off subtotal
 * - Auto-applied: No code entry needed
 * - Persists until first order completes successfully
 * - If order cancelled, discount remains available
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface FirstOrderDiscountResult {
  eligible: boolean;
  discountAmount: number;
  discountPercent: number;
  message: string;
  customerId?: string;
}

/**
 * Check if customer is eligible for first order discount
 * 
 * @param customerId - Customer ID (required - must be logged in)
 * @returns Promise<FirstOrderDiscountResult>
 */
export async function checkFirstOrderDiscount(
  customerId: string | null
): Promise<FirstOrderDiscountResult> {
  try {
    // Must be logged in to get first order discount
    if (!customerId) {
      return {
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'Please log in to get your 20% first order discount',
      };
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        totalOrders: true,
        firstOrderEligible: true,
      },
    });

    if (!customer) {
      return {
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'Customer not found',
      };
    }

    // Check if eligible - MUST have both:
    // 1. firstOrderEligible flag set to true
    // 2. AND totalOrders = 0 (never completed an order)
    const isEligible = customer.firstOrderEligible && customer.totalOrders === 0;

    if (!isEligible) {
      return {
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'First order discount already used',
        customerId: customer.id,
      };
    }

    // Eligible for first order discount!
    return {
      eligible: true,
      discountAmount: 0, // Will be calculated when subtotal is known
      discountPercent: 20,
      message: '🎉 Welcome! 20% off your first order automatically applied',
      customerId: customer.id,
    };
  } catch (error) {
    logger.error('Failed to check first order discount', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      eligible: false,
      discountAmount: 0,
      discountPercent: 0,
      message: 'Error checking discount eligibility',
    };
  }
}

/**
 * Calculate first order discount amount
 * 
 * @param subtotal - Order subtotal before discount
 * @param customerId - Customer ID
 * @returns Promise<number> - Discount amount
 */
export async function calculateFirstOrderDiscount(
  subtotal: number,
  customerId: string | null
): Promise<number> {
  const eligibility = await checkFirstOrderDiscount(customerId);

  if (!eligibility.eligible) {
    return 0;
  }

  // 20% discount on subtotal
  const discount = Math.round(subtotal * 0.2 * 100) / 100; // Round to 2 decimal places
  
  logger.info('First order discount calculated', {
    customerId,
    subtotal,
    discount,
    discountPercent: 20,
  });

  return discount;
}

/**
 * Mark first order discount as used
 * Called when order is successfully completed
 * 
 * @param customerId - Customer ID
 * @returns Promise<boolean>
 */
export async function markFirstOrderUsed(customerId: string): Promise<boolean> {
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstOrderEligible: false,
      },
    });

    logger.info('First order discount marked as used', {
      customerId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to mark first order as used', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Get first order discount status for UI display
 * 
 * @param customerId - Customer ID
 * @returns Promise<{ available: boolean; message: string }>
 */
export async function getFirstOrderDiscountStatus(
  customerId: string | null
): Promise<{ available: boolean; message: string; discountPercent: number }> {
  const result = await checkFirstOrderDiscount(customerId);

  return {
    available: result.eligible,
    message: result.message,
    discountPercent: result.discountPercent,
  };
}

