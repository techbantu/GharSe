/**
 * Thompson Sampling - Multi-Armed Bandit Algorithm
 *
 * Solves the exploration-exploitation dilemma:
 * - Exploitation: Show items we know perform well
 * - Exploration: Try new/unknown items to discover hidden gems
 *
 * Used by: Google, Netflix, LinkedIn for A/B testing and recommendations
 *
 * How it works:
 * 1. Model each item as a Beta distribution Beta(α, β)
 * 2. α (alpha) = successes (e.g., orders, clicks)
 * 3. β (beta) = failures (e.g., views without orders)
 * 4. Sample from each distribution and rank by samples
 * 5. Items with high uncertainty get more exploration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BanditArm {
  itemId: string;
  alpha: number; // Successes + 1 (prior)
  beta: number; // Failures + 1 (prior)
  lastUpdated: Date;
}

export interface BanditStats {
  itemId: string;
  impressions: number; // Times shown
  conversions: number; // Times ordered/clicked
  conversionRate: number;
  uncertainty: number; // Variance of Beta distribution
  expectedValue: number; // Mean of Beta distribution
}

/**
 * Thompson Sampling Engine
 */
export class ThompsonSamplingEngine {
  private cache: Map<string, BanditArm> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Sample scores for items using Thompson Sampling
   */
  async sampleScores(itemIds: string[]): Promise<Map<string, number>> {
    const arms = await this.getOrCreateArms(itemIds);
    const scores = new Map<string, number>();

    for (const arm of arms) {
      // Sample from Beta(α, β)
      const sample = this.sampleBeta(arm.alpha, arm.beta);
      scores.set(arm.itemId, sample);
    }

    return scores;
  }

  /**
   * Record an impression (item was shown to user)
   */
  async recordImpression(itemId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "BanditStats" ("itemId", "impressions", "conversions", "updatedAt")
        VALUES (${itemId}, 1, 0, NOW())
        ON CONFLICT ("itemId")
        DO UPDATE SET
          "impressions" = "BanditStats"."impressions" + 1,
          "updatedAt" = NOW()
      `;
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  }

  /**
   * Record a conversion (item was ordered/clicked)
   */
  async recordConversion(itemId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "BanditStats" ("itemId", "impressions", "conversions", "updatedAt")
        VALUES (${itemId}, 1, 1, NOW())
        ON CONFLICT ("itemId")
        DO UPDATE SET
          "impressions" = "BanditStats"."impressions" + 1,
          "conversions" = "BanditStats"."conversions" + 1,
          "updatedAt" = NOW()
      `;

      // Clear cache for this item
      this.cache.delete(itemId);
    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  }

  /**
   * Get statistics for items
   */
  async getStats(itemIds: string[]): Promise<BanditStats[]> {
    const arms = await this.getOrCreateArms(itemIds);

    return arms.map(arm => {
      const impressions = arm.alpha + arm.beta - 2; // Remove priors
      const conversions = arm.alpha - 1;
      const conversionRate = impressions > 0 ? conversions / impressions : 0;

      // Variance of Beta(α, β) = αβ / [(α+β)²(α+β+1)]
      const sum = arm.alpha + arm.beta;
      const variance = (arm.alpha * arm.beta) / (sum * sum * (sum + 1));

      return {
        itemId: arm.itemId,
        impressions,
        conversions,
        conversionRate,
        uncertainty: Math.sqrt(variance),
        expectedValue: arm.alpha / sum,
      };
    });
  }

  /**
   * Get or create bandit arms for items
   */
  private async getOrCreateArms(itemIds: string[]): Promise<BanditArm[]> {
    const arms: BanditArm[] = [];
    const uncachedIds: string[] = [];

    // Check cache first
    for (const itemId of itemIds) {
      const cached = this.cache.get(itemId);
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
        arms.push(cached);
      } else {
        uncachedIds.push(itemId);
      }
    }

    if (uncachedIds.length === 0) {
      return arms;
    }

    // Fetch from database (this would need BanditStats table)
    // For now, initialize with priors
    try {
      // In production, query actual stats from database
      // const stats = await prisma.banditStats.findMany({
      //   where: { itemId: { in: uncachedIds } }
      // });

      // For now, use default priors
      for (const itemId of uncachedIds) {
        const arm: BanditArm = {
          itemId,
          alpha: 1, // Prior (optimistic initialization)
          beta: 1,
          lastUpdated: new Date(),
        };

        this.cache.set(itemId, arm);
        arms.push(arm);
      }
    } catch (error) {
      console.error('Error fetching bandit arms:', error);

      // Fallback to priors
      for (const itemId of uncachedIds) {
        const arm: BanditArm = {
          itemId,
          alpha: 1,
          beta: 1,
          lastUpdated: new Date(),
        };
        arms.push(arm);
      }
    }

    return arms;
  }

  /**
   * Sample from Beta distribution Beta(α, β)
   * Uses simple acceptance-rejection method
   */
  private sampleBeta(alpha: number, beta: number): number {
    // For α=1, β=1 (uniform), just return random
    if (alpha === 1 && beta === 1) {
      return Math.random();
    }

    // Use gamma distribution to sample Beta
    // If X ~ Gamma(α), Y ~ Gamma(β), then X/(X+Y) ~ Beta(α, β)
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);

    return x / (x + y);
  }

  /**
   * Sample from Gamma distribution using Marsaglia and Tsang method
   */
  private sampleGamma(shape: number, scale: number = 1): number {
    if (shape < 1) {
      // Use transformation: if X ~ Gamma(α+1), then X*U^(1/α) ~ Gamma(α)
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    // Marsaglia and Tsang's method
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.randomNormal(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return scale * d * v;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return scale * d * v;
      }
    }
  }

  /**
   * Generate random number from standard normal distribution
   * Using Box-Muller transform
   */
  private randomNormal(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();

    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return z0 * stdDev + mean;
  }

  /**
   * Reset all statistics (use with caution!)
   */
  async resetAll(): Promise<void> {
    this.cache.clear();
    // In production: await prisma.banditStats.deleteMany({});
  }

  /**
   * Get top performing items by expected value
   */
  async getTopPerformers(limit: number = 10): Promise<BanditStats[]> {
    // In production, query from database
    // For now, return empty array
    return [];
  }
}

/**
 * Singleton instance
 */
export const thompsonSampling = new ThompsonSamplingEngine();

/**
 * Helper: Calculate optimal exploration rate based on catalog size
 * Smaller catalogs need more exploration, larger catalogs need less
 */
export function calculateOptimalExplorationRate(catalogSize: number): number {
  // Formula: rate = 1 / sqrt(catalogSize)
  // Bounded between 0.05 and 0.30
  const rate = 1 / Math.sqrt(catalogSize);
  return Math.max(0.05, Math.min(0.30, rate));
}

/**
 * Helper: Calculate regret (opportunity cost of not showing best item)
 */
export function calculateRegret(
  bestConversionRate: number,
  actualConversionRate: number,
  impressions: number
): number {
  return (bestConversionRate - actualConversionRate) * impressions;
}
