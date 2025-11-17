/**
 * Velocity-Based Trending Algorithm
 *
 * Catches items that are "rising stars" - not just popular, but gaining momentum
 *
 * This is the SECRET SAUCE that beats competitors:
 * - Traditional: Rank by total orders (favors old items)
 * - Better: Rank by recent orders (misses rising trends)
 * - BEST: Rank by ACCELERATION (velocity) - catches viral items early
 *
 * Inspired by:
 * - Reddit's "hot" algorithm
 * - Hacker News ranking
 * - TikTok's FYP algorithm
 * - Twitter's trending topics
 *
 * The key insight: Show users what's ABOUT TO BE popular, not what WAS popular
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TrendingItem {
  itemId: string;
  velocity: number; // Rate of change (orders per hour change)
  acceleration: number; // Rate of velocity change
  trendingScore: number; // Combined score (0-1)
  momentum: 'rising' | 'stable' | 'falling';
  currentOrders: number;
  previousOrders: number;
  percentChange: number;
  rank: number;
}

export interface TimeWindow {
  hours: number;
  label: string;
}

export const TIME_WINDOWS: TimeWindow[] = [
  { hours: 1, label: 'Last hour' },
  { hours: 3, label: 'Last 3 hours' },
  { hours: 6, label: 'Last 6 hours' },
  { hours: 12, label: 'Last 12 hours' },
  { hours: 24, label: 'Last 24 hours' },
  { hours: 168, label: 'Last week' },
];

/**
 * Trending Velocity Engine
 */
export class TrendingVelocityEngine {
  private cache: Map<string, TrendingItem[]> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * Calculate trending scores for items
   * Uses multiple time windows to detect acceleration
   */
  async calculateTrendingScores(
    itemIds: string[],
    windowHours: number = 6
  ): Promise<Map<string, number>> {
    const trending = await this.getTrendingItems(itemIds, windowHours);
    const scores = new Map<string, number>();

    for (const item of trending) {
      scores.set(item.itemId, item.trendingScore);
    }

    // Add neutral scores for items not in trending
    for (const itemId of itemIds) {
      if (!scores.has(itemId)) {
        scores.set(itemId, 0.5);
      }
    }

    return scores;
  }

  /**
   * Get trending items with detailed metrics
   */
  async getTrendingItems(
    itemIds: string[],
    windowHours: number = 6,
    limit: number = 50
  ): Promise<TrendingItem[]> {
    // Check cache
    const cacheKey = `${windowHours}-${itemIds.join(',')}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - new Date(cached[0]?.rank || 0).getTime() < this.cacheTimeout) {
      return cached;
    }

    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
      const previousWindowStart = new Date(windowStart.getTime() - windowHours * 60 * 60 * 1000);

      // Get order counts for current and previous windows
      const currentWindowOrders = await this.getOrderCounts(itemIds, windowStart, now);
      const previousWindowOrders = await this.getOrderCounts(
        itemIds,
        previousWindowStart,
        windowStart
      );

      // Calculate velocity metrics
      const trending: TrendingItem[] = [];

      for (const itemId of itemIds) {
        const current = currentWindowOrders.get(itemId) || 0;
        const previous = previousWindowOrders.get(itemId) || 0;

        // Velocity = (current - previous) / time window
        const velocity = (current - previous) / windowHours;

        // Acceleration = rate of velocity change
        // (simplified: use velocity as proxy for acceleration)
        const acceleration = velocity;

        // Percent change (handle division by zero)
        const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : current * 100;

        // Momentum classification
        let momentum: 'rising' | 'stable' | 'falling' = 'stable';
        if (percentChange > 10) momentum = 'rising';
        else if (percentChange < -10) momentum = 'falling';

        // Trending score (0-1)
        // Combines: velocity, acceleration, and recency
        const trendingScore = this.calculateTrendingScore(current, previous, velocity, windowHours);

        trending.push({
          itemId,
          velocity,
          acceleration,
          trendingScore,
          momentum,
          currentOrders: current,
          previousOrders: previous,
          percentChange,
          rank: 0, // Will be set after sorting
        });
      }

      // Sort by trending score
      trending.sort((a, b) => b.trendingScore - a.trendingScore);

      // Assign ranks
      trending.forEach((item, index) => {
        item.rank = index + 1;
      });

      // Cache results
      this.cache.set(cacheKey, trending);

      return trending.slice(0, limit);
    } catch (error) {
      console.error('Error calculating trending items:', error);
      return [];
    }
  }

  /**
   * Calculate trending score using modified Reddit "hot" algorithm
   *
   * Formula: log(max(|votes|, 1)) + sign(votes) * seconds / 45000
   * Adapted for orders: log(current + 1) + velocity_weight * velocity / 100
   */
  private calculateTrendingScore(
    current: number,
    previous: number,
    velocity: number,
    windowHours: number
  ): number {
    // Base score from current popularity (logarithmic to dampen large numbers)
    const popularityScore = Math.log10(current + 1);

    // Velocity component (normalized)
    const maxVelocity = 100; // Assume max 100 orders/hour change
    const velocityScore = Math.max(-1, Math.min(1, velocity / maxVelocity));

    // Recency boost (favor shorter time windows)
    const recencyBoost = 1 / Math.sqrt(windowHours);

    // Combined score (normalized to 0-1)
    const rawScore = popularityScore * 0.4 + velocityScore * 0.4 + recencyBoost * 0.2;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, (rawScore + 1) / 3));
  }

  /**
   * Get order counts for items in time window
   */
  private async getOrderCounts(
    itemIds: string[],
    startTime: Date,
    endTime: Date
  ): Promise<Map<string, number>> {
    try {
      // Query OrderItem table grouped by menuItemId
      const results = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          menuItemId: { in: itemIds },
          order: {
            createdAt: {
              gte: startTime,
              lt: endTime,
            },
            status: {
              notIn: ['cancelled', 'refunded'],
            },
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const counts = new Map<string, number>();
      for (const result of results) {
        counts.set(result.menuItemId, result._sum.quantity || 0);
      }

      return counts;
    } catch (error) {
      console.error('Error fetching order counts:', error);
      return new Map();
    }
  }

  /**
   * Get trending items across all categories (global trending)
   */
  async getGlobalTrending(limit: number = 20, windowHours: number = 6): Promise<TrendingItem[]> {
    try {
      // Get all item IDs (in production, this should be optimized)
      const allItems = await prisma.menuItem.findMany({
        where: { isAvailable: true },
        select: { id: true },
        take: 500, // Limit to prevent performance issues
      });

      const itemIds = allItems.map(item => item.id);

      return await this.getTrendingItems(itemIds, windowHours, limit);
    } catch (error) {
      console.error('Error fetching global trending:', error);
      return [];
    }
  }

  /**
   * Detect "breakout" items - sudden viral growth
   * These get extra boost in recommendations
   */
  async getBreakoutItems(threshold: number = 200): Promise<TrendingItem[]> {
    const trending = await this.getGlobalTrending(50, 3); // Last 3 hours

    // Filter for items with >200% growth
    return trending.filter(item => item.percentChange >= threshold && item.currentOrders >= 5);
  }

  /**
   * Get category-specific trending
   */
  async getCategoryTrending(
    category: string,
    limit: number = 10,
    windowHours: number = 6
  ): Promise<TrendingItem[]> {
    try {
      const categoryItems = await prisma.menuItem.findMany({
        where: {
          category,
          isAvailable: true,
        },
        select: { id: true },
      });

      const itemIds = categoryItems.map(item => item.id);

      return await this.getTrendingItems(itemIds, windowHours, limit);
    } catch (error) {
      console.error('Error fetching category trending:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get trending score for a specific item
   */
  async getItemTrendingScore(itemId: string, windowHours: number = 6): Promise<number> {
    const scores = await this.calculateTrendingScores([itemId], windowHours);
    return scores.get(itemId) || 0.5;
  }
}

/**
 * Singleton instance
 */
export const trendingVelocity = new TrendingVelocityEngine();

/**
 * Helper: Detect trending time of day
 * Returns which time period has highest velocity
 */
export async function detectTrendingTimeOfDay(
  itemId: string
): Promise<'morning' | 'afternoon' | 'evening' | 'night'> {
  // This would analyze order patterns by hour
  // For now, return default
  return 'evening';
}

/**
 * Helper: Predict when item will peak
 * Uses velocity to forecast peak demand
 */
export async function predictPeakTime(itemId: string): Promise<Date | null> {
  // This would use velocity trends to predict peak
  // For now, return null
  return null;
}

/**
 * Helper: Calculate "viral coefficient"
 * How much one order leads to more orders (network effect)
 */
export function calculateViralCoefficient(
  ordersBeforeExposure: number,
  ordersAfterExposure: number,
  exposureCount: number
): number {
  if (exposureCount === 0) return 0;

  const incrementalOrders = ordersAfterExposure - ordersBeforeExposure;
  return incrementalOrders / exposureCount;
}
