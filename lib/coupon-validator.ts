/**
 * COUPON VALIDATION ENGINE
 * 
 * Purpose: Validate coupons and calculate discounts with business rules
 * 
 * Features:
 * - Coupon code validation
 * - Eligibility checks (user verification, order amount, usage limits)
 * - Discount calculation (percentage/fixed amount)
 * - Usage tracking
 * - Referral coupon handling
 * 
 * Architecture: Production-grade validation with comprehensive business logic
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface CouponValidationResult {
  valid: boolean;
  discount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  message?: string;
  couponId?: string;
  requiresVerification?: boolean;
}

/**
 * Validate coupon code for a customer and order
 * 
 * @param code - Coupon code
 * @param customerId - Customer ID (null for guest)
 * @param orderAmount - Order subtotal
 * @param items - Order items (for category restrictions)
 * @returns CouponValidationResult
 */
export async function validateCoupon(
  code: string,
  customerId: string | null,
  orderAmount: number,
  items?: Array<{ category: string; price: number; quantity: number }>
): Promise<CouponValidationResult> {
  try {
    // Clean up code (uppercase, trim)
    const cleanCode = code.trim().toUpperCase();
    
    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });
    
    if (!coupon) {
      return {
        valid: false,
        message: 'Invalid coupon code',
      };
    }
    
    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        valid: false,
        message: 'This coupon is no longer active',
      };
    }
    
    // Check if customer is logged in (required for coupon usage)
    if (!customerId) {
      return {
        valid: false,
        message: 'Please login to use this coupon',
        requiresVerification: true,
      };
    }
    
    // Get customer info
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        emailVerified: true,
        phoneVerified: true,
        totalOrders: true,
        couponsUsed: {
          where: { couponId: coupon.id },
        },
      },
    });
    
    if (!customer) {
      return {
        valid: false,
        message: 'Customer not found',
      };
    }
    
    // Check if customer email/phone is verified
    if (!customer.emailVerified) {
      return {
        valid: false,
        message: 'Please verify your email to use coupons',
        requiresVerification: true,
      };
    }
    
    // Check validity period
    const now = new Date();
    if (coupon.validFrom > now) {
      return {
        valid: false,
        message: `This coupon will be valid from ${coupon.validFrom.toLocaleDateString()}`,
      };
    }
    
    if (coupon.validUntil && coupon.validUntil < now) {
      return {
        valid: false,
        message: 'This coupon has expired',
      };
    }
    
    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
      };
    }
    
    // Check if first order only
    if (coupon.firstOrderOnly && customer.totalOrders > 0) {
      return {
        valid: false,
        message: 'This coupon is only valid for first-time customers',
      };
    }
    
    // Check total usage limit
    if (coupon.maxUsageTotal !== null && coupon.usageCount >= coupon.maxUsageTotal) {
      return {
        valid: false,
        message: 'This coupon has reached its usage limit',
      };
    }
    
    // Check per-user usage limit
    const userUsageCount = customer.couponsUsed.length;
    if (userUsageCount >= coupon.maxUsagePerUser) {
      return {
        valid: false,
        message: `You have already used this coupon ${coupon.maxUsagePerUser} time${coupon.maxUsagePerUser > 1 ? 's' : ''}`,
      };
    }
    
    // Check category restrictions
    if (coupon.applicableCategories && items) {
      const applicableCategories = JSON.parse(coupon.applicableCategories);
      const eligibleAmount = items
        .filter(item => applicableCategories.includes(item.category))
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (eligibleAmount === 0) {
        return {
          valid: false,
          message: `This coupon is only valid for ${applicableCategories.join(', ')} items`,
        };
      }
      
      // Use eligible amount instead of total order amount for discount calculation
      orderAmount = eligibleAmount;
    }
    
    // Calculate discount
    let discount = 0;
    
    if (coupon.discountType === 'PERCENTAGE') {
      discount = orderAmount * (coupon.discountValue / 100);
      
      // Apply max discount cap if exists
      if (coupon.maxDiscountCap && discount > coupon.maxDiscountCap) {
        discount = coupon.maxDiscountCap;
      }
    } else {
      // FIXED_AMOUNT
      discount = coupon.discountValue;
      
      // Don't allow discount greater than order amount
      if (discount > orderAmount) {
        discount = orderAmount;
      }
    }
    
    logger.info('Coupon validated successfully', {
      couponId: coupon.id,
      code: cleanCode,
      customerId,
      discount,
      orderAmount,
    });
    
    return {
      valid: true,
      discount: Math.round(discount * 100) / 100, // Round to 2 decimals
      discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT',
      couponId: coupon.id,
      message: coupon.description || undefined,
    };
    
  } catch (error) {
    logger.error('Coupon validation failed', {
      code,
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return {
      valid: false,
      message: 'Failed to validate coupon. Please try again.',
    };
  }
}

/**
 * Apply coupon to order (create usage record)
 * 
 * @param couponId - Coupon ID
 * @param customerId - Customer ID
 * @param orderId - Order ID
 * @param discountAmount - Discount amount applied
 * @param orderTotal - Order total before discount
 * @param finalTotal - Order total after discount
 * @param ipAddress - Customer IP address (for fraud tracking)
 * @returns Promise<boolean> - True if applied successfully
 */
export async function applyCouponToOrder(
  couponId: string,
  customerId: string,
  orderId: string,
  discountAmount: number,
  orderTotal: number,
  finalTotal: number,
  ipAddress?: string
): Promise<boolean> {
  try {
    // Create coupon usage record
    await prisma.couponUsage.create({
      data: {
        couponId,
        customerId,
        orderId,
        discountAmount,
        orderTotal,
        finalTotal,
        ipAddress: ipAddress || null,
      },
    });
    
    // Increment coupon usage count
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usageCount: { increment: 1 } },
    });
    
    logger.info('Coupon applied to order', {
      couponId,
      customerId,
      orderId,
      discountAmount,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to apply coupon to order', {
      couponId,
      customerId,
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return false;
  }
}

/**
 * Generate coupon code for merchant coupons
 * 
 * @param prefix - Prefix for code (e.g., "WELCOME", "SUMMER")
 * @returns Promise<string> - Unique coupon code
 */
export async function generateCouponCode(prefix: string): Promise<string> {
  const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  let code = `${cleanPrefix}${suffix}`;
  
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.coupon.findUnique({
      where: { code },
    });
    
    if (!existing) break;
    
    const newSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${cleanPrefix}${newSuffix}`;
    attempts++;
  }
  
  return code;
}

/**
 * Check if customer is eligible for referral rewards
 * 
 * @param customerId - Customer ID
 * @returns Promise<{ eligible: boolean; reward?: number; referralId?: string }>
 */
export async function checkReferralEligibility(
  customerId: string
): Promise<{ eligible: boolean; reward?: number; referralId?: string }> {
  try {
    // Check if customer was referred
    const referral = await prisma.referral.findUnique({
      where: { refereeId: customerId },
    });
    
    if (!referral || referral.status !== 'PENDING') {
      return { eligible: false };
    }
    
    // Check if customer has completed first order
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { totalOrders: true },
    });
    
    if (!customer || customer.totalOrders > 0) {
      return { eligible: false };
    }
    
    return {
      eligible: true,
      reward: referral.refereeReward,
      referralId: referral.id,
    };
  } catch (error) {
    logger.error('Failed to check referral eligibility', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return { eligible: false };
  }
}

/**
 * Complete referral (mark as completed and credit rewards)
 * 
 * @param referralId - Referral ID
 * @param orderId - First order ID
 * @returns Promise<boolean> - True if completed successfully
 */
export async function completeReferral(
  referralId: string,
  orderId: string
): Promise<boolean> {
  try {
    // Update referral status
    const referral = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'COMPLETED',
        firstOrderId: orderId,
        completedAt: new Date(),
      },
    });
    
    // Credit loyalty points to referrer
    await prisma.customer.update({
      where: { id: referral.referrerId },
      data: {
        loyaltyPoints: { increment: referral.referrerReward },
      },
    });
    
    logger.info('Referral completed', {
      referralId,
      referrerId: referral.referrerId,
      refereeId: referral.refereeId,
      orderId,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to complete referral', {
      referralId,
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return false;
  }
}

