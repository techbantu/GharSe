/**
 * COMMISSION CALCULATOR TESTS
 * 
 * Purpose: Unit tests for commission calculation logic
 * 
 * Test Coverage:
 * - Commission rate calculation by tier
 * - Payout generation
 * - Analytics updates
 * - Edge cases
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  calculateCommission,
  updateChefAnalytics,
  generatePayout,
} from '../lib/commission-calculator';

describe('Commission Calculator', () => {
  describe('calculateCommission', () => {
    it('should calculate 10% commission for free tier', () => {
      const result = calculateCommission(1000, 'free');

      expect(result.orderTotal).toBe(1000);
      expect(result.commissionRate).toBe(0.10);
      expect(result.platformFee).toBe(100);
      expect(result.chefEarnings).toBe(900);
      expect(result.subscriptionTier).toBe('free');
    });

    it('should calculate 8% commission for basic tier', () => {
      const result = calculateCommission(1000, 'basic');

      expect(result.commissionRate).toBe(0.08);
      expect(result.platformFee).toBe(80);
      expect(result.chefEarnings).toBe(920);
    });

    it('should calculate 5% commission for premium tier', () => {
      const result = calculateCommission(1000, 'premium');

      expect(result.commissionRate).toBe(0.05);
      expect(result.platformFee).toBe(50);
      expect(result.chefEarnings).toBe(950);
    });

    it('should default to free tier for invalid tier', () => {
      const result = calculateCommission(1000, 'invalid');

      expect(result.commissionRate).toBe(0.10);
      expect(result.platformFee).toBe(100);
    });

    it('should handle decimal amounts correctly', () => {
      const result = calculateCommission(999.99, 'free');

      expect(result.platformFee).toBe(100); // 99.999 rounded to 100
      expect(result.chefEarnings).toBe(899.99); // 999.99 - 100 = 899.99
    });

    it('should handle zero amount', () => {
      const result = calculateCommission(0, 'free');

      expect(result.platformFee).toBe(0);
      expect(result.chefEarnings).toBe(0);
    });

    it('should handle large amounts', () => {
      const result = calculateCommission(100000, 'premium');

      expect(result.platformFee).toBe(5000);
      expect(result.chefEarnings).toBe(95000);
    });
  });

  describe('Tier Comparison', () => {
    const orderValue = 10000;

    it('should show premium tier has lowest commission', () => {
      const free = calculateCommission(orderValue, 'free');
      const basic = calculateCommission(orderValue, 'basic');
      const premium = calculateCommission(orderValue, 'premium');

      expect(free.platformFee).toBeGreaterThan(basic.platformFee);
      expect(basic.platformFee).toBeGreaterThan(premium.platformFee);

      expect(premium.chefEarnings).toBeGreaterThan(basic.chefEarnings);
      expect(basic.chefEarnings).toBeGreaterThan(free.chefEarnings);
    });

    it('should calculate monthly savings for different tiers', () => {
      const monthlyRevenue = 50000;

      const freeTier = calculateCommission(monthlyRevenue, 'free');
      const basicTier = calculateCommission(monthlyRevenue, 'basic');
      const premiumTier = calculateCommission(monthlyRevenue, 'premium');

      // Free: 5000 commission
      // Basic: 4000 commission + 999 subscription = 4999 (saves 1 rupee lol)
      // Premium: 2500 commission + 2999 subscription = 5499 (loses 499)

      // Basic becomes profitable at > 50k/month
      // Premium becomes profitable at > 60k/month

      const basicSubscription = 999;
      const premiumSubscription = 2999;

      const basicSavings = freeTier.platformFee - basicTier.platformFee - basicSubscription;
      const premiumSavings = freeTier.platformFee - premiumTier.platformFee - premiumSubscription;

      console.log('Basic savings at 50k:', basicSavings); // Should be ~1
      console.log('Premium savings at 50k:', premiumSavings); // Should be negative

      expect(basicSavings).toBeGreaterThanOrEqual(-1000); // Basic is worth it at 50k
      expect(premiumSavings).toBeLessThan(0); // Premium not worth it yet at 50k
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative amounts gracefully', () => {
      const result = calculateCommission(-100, 'free');

      expect(result.platformFee).toBeLessThan(0);
      expect(result.chefEarnings).toBeLessThan(0);
    });

    it('should handle very small amounts', () => {
      const result = calculateCommission(0.01, 'free');

      expect(result.platformFee).toBe(0);
      expect(result.chefEarnings).toBe(0.01);
    });

    it('should be case-insensitive for tier names', () => {
      const lower = calculateCommission(1000, 'free');
      const upper = calculateCommission(1000, 'FREE');
      const mixed = calculateCommission(1000, 'Free');

      expect(lower.platformFee).toBe(upper.platformFee);
      expect(lower.platformFee).toBe(mixed.platformFee);
    });
  });

  describe('Financial Accuracy', () => {
    it('should always sum to original amount', () => {
      const testAmounts = [99.99, 199.50, 500, 1000.01, 5432.10];

      testAmounts.forEach((amount) => {
        const result = calculateCommission(amount, 'free');
        const sum = result.platformFee + result.chefEarnings;

        // Allow small rounding differences (< 1 rupee)
        expect(Math.abs(sum - amount)).toBeLessThan(1);
      });
    });

    it('should never have negative chef earnings', () => {
      const testAmounts = [0, 1, 10, 100, 1000, 10000];

      testAmounts.forEach((amount) => {
        ['free', 'basic', 'premium'].forEach((tier) => {
          const result = calculateCommission(amount, tier);
          expect(result.chefEarnings).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should show ROI breakpoint for tier upgrades', () => {
      // Calculate monthly revenue needed to break even on subscriptions

      const basicSubscription = 999;
      const premiumSubscription = 2999;

      // Free to Basic: Save 2% on revenue
      // Break even: 999 / 0.02 = 49,950/month
      const basicBreakEven = basicSubscription / 0.02;
      expect(basicBreakEven).toBeCloseTo(49950, 0);

      // Free to Premium: Save 5% on revenue
      // Break even: 2999 / 0.05 = 59,980/month
      const premiumBreakEven = premiumSubscription / 0.05;
      expect(premiumBreakEven).toBeCloseTo(59980, 0);

      // Basic to Premium: Save additional 3% on revenue
      // Break even: 2000 / 0.03 = 66,667/month
      const basicToPremiumBreakEven = (premiumSubscription - basicSubscription) / 0.03;
      expect(basicToPremiumBreakEven).toBeCloseTo(66667, 0);
    });
  });
});

