/**
 * Collaborative Filtering with Temporal Decay
 *
 * "Users who are similar to you also liked..."
 *
 * Two approaches:
 * 1. User-User CF: Find similar users, recommend what they liked
 * 2. Item-Item CF: Find similar items to what user liked
 *
 * Key innovation: TEMPORAL DECAY
 * - Recent behavior weighted more than old behavior
 * - Preferences change over time (seasons, trends, life events)
 * - Exponential decay: weight = e^(-λt) where t = days ago
 *
 * Used by: Netflix, Spotify, Amazon
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserProfile {
  customerId: string;
  preferences: Map<string, number>; // itemId -> preference score (0-1)
  recencyWeightedPreferences: Map<string, number>; // With temporal decay
  lastUpdated: Date;
}

export interface ItemSimilarity {
  itemId1: string;
  itemId2: string;
  similarity: number; // Cosine similarity (0-1)
  sharedUsers: number;
}

/**
 * Collaborative Filtering Engine
 */
export class CollaborativeFilteringEngine {
  private userProfileCache: Map<string, UserProfile> = new Map();
  private itemSimilarityCache: Map<string, Map<string, number>> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  // Temporal decay parameter (λ)
  // Higher = more aggressive decay (only recent matters)
  // Lower = slower decay (long history matters)
  private decayRate = 0.05; // Half-life ~14 days

  /**
   * Calculate collaborative filtering scores
   */
  async calculateScores(
    candidateIds: string[],
    customerId?: string
  ): Promise<Map<string, number>> {
    if (!customerId) {
      // No user context, return neutral scores
      return new Map(candidateIds.map(id => [id, 0.5]));
    }

    try {
      // Get user profile with temporal decay
      const userProfile = await this.getUserProfile(customerId);

      // Calculate scores using item-item similarity
      const scores = new Map<string, number>();

      for (const candidateId of candidateIds) {
        // Skip if user already ordered this item recently
        if (userProfile.recencyWeightedPreferences.has(candidateId)) {
          const recentScore = userProfile.recencyWeightedPreferences.get(candidateId)!;
          if (recentScore > 0.7) {
            scores.set(candidateId, 0.3); // Lower score for recently ordered
            continue;
          }
        }

        // Find similar items to user's preferences
        let totalScore = 0;
        let totalWeight = 0;

        for (const [likedItemId, likedScore] of userProfile.recencyWeightedPreferences.entries()) {
          const similarity = await this.getItemSimilarity(likedItemId, candidateId);

          if (similarity > 0) {
            totalScore += similarity * likedScore;
            totalWeight += similarity;
          }
        }

        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;
        scores.set(candidateId, Math.min(1, finalScore));
      }

      return scores;
    } catch (error) {
      console.error('Error calculating collaborative scores:', error);
      return new Map(candidateIds.map(id => [id, 0.5]));
    }
  }

  /**
   * Get user profile with temporal decay applied
   */
  async getUserProfile(customerId: string): Promise<UserProfile> {
    // Check cache
    const cached = this.userProfileCache.get(customerId);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
      return cached;
    }

    try {
      // Get user's order history
      const orders = await prisma.order.findMany({
        where: {
          customerId,
          status: { notIn: ['cancelled', 'refunded'] },
        },
        include: {
          items: {
            select: {
              menuItemId: true,
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Last 100 orders
      });

      const preferences = new Map<string, number>();
      const recencyWeightedPreferences = new Map<string, number>();

      const now = new Date();

      for (const order of orders) {
        const orderDate = new Date(order.createdAt);
        const daysAgo = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

        // Temporal decay weight: e^(-λt)
        const decayWeight = Math.exp(-this.decayRate * daysAgo);

        for (const item of order.items) {
          const itemId = item.menuItemId;

          // Raw preference (frequency)
          preferences.set(itemId, (preferences.get(itemId) || 0) + item.quantity);

          // Recency-weighted preference
          const weightedScore = item.quantity * decayWeight;
          recencyWeightedPreferences.set(
            itemId,
            (recencyWeightedPreferences.get(itemId) || 0) + weightedScore
          );
        }
      }

      // Normalize preferences to 0-1 range
      const maxPreference = Math.max(...Array.from(preferences.values()));
      const maxWeighted = Math.max(...Array.from(recencyWeightedPreferences.values()));

      if (maxPreference > 0) {
        for (const [itemId, score] of preferences.entries()) {
          preferences.set(itemId, score / maxPreference);
        }
      }

      if (maxWeighted > 0) {
        for (const [itemId, score] of recencyWeightedPreferences.entries()) {
          recencyWeightedPreferences.set(itemId, score / maxWeighted);
        }
      }

      const profile: UserProfile = {
        customerId,
        preferences,
        recencyWeightedPreferences,
        lastUpdated: new Date(),
      };

      this.userProfileCache.set(customerId, profile);

      return profile;
    } catch (error) {
      console.error('Error building user profile:', error);
      return {
        customerId,
        preferences: new Map(),
        recencyWeightedPreferences: new Map(),
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get item-item similarity using collaborative filtering
   * Based on users who ordered both items
   */
  async getItemSimilarity(itemId1: string, itemId2: string): Promise<number> {
    if (itemId1 === itemId2) return 1;

    // Check cache
    const cacheKey1 = this.itemSimilarityCache.get(itemId1);
    if (cacheKey1?.has(itemId2)) {
      return cacheKey1.get(itemId2)!;
    }

    try {
      // Find users who ordered both items
      const usersItem1 = await prisma.order.findMany({
        where: {
          status: { notIn: ['cancelled', 'refunded'] },
          items: { some: { menuItemId: itemId1 } },
        },
        select: { customerId: true },
        distinct: ['customerId'],
      });

      const usersItem2 = await prisma.order.findMany({
        where: {
          status: { notIn: ['cancelled', 'refunded'] },
          items: { some: { menuItemId: itemId2 } },
        },
        select: { customerId: true },
        distinct: ['customerId'],
      });

      const users1 = new Set(usersItem1.map(o => o.customerId).filter(Boolean));
      const users2 = new Set(usersItem2.map(o => o.customerId).filter(Boolean));

      // Jaccard similarity: |intersection| / |union|
      const intersection = new Set([...users1].filter(u => users2.has(u)));
      const union = new Set([...users1, ...users2]);

      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      // Cache the result
      if (!this.itemSimilarityCache.has(itemId1)) {
        this.itemSimilarityCache.set(itemId1, new Map());
      }
      if (!this.itemSimilarityCache.has(itemId2)) {
        this.itemSimilarityCache.set(itemId2, new Map());
      }

      this.itemSimilarityCache.get(itemId1)!.set(itemId2, similarity);
      this.itemSimilarityCache.get(itemId2)!.set(itemId1, similarity);

      return similarity;
    } catch (error) {
      console.error('Error calculating item similarity:', error);
      return 0;
    }
  }

  /**
   * Find similar users (user-user collaborative filtering)
   */
  async findSimilarUsers(
    customerId: string,
    limit: number = 10
  ): Promise<Array<{ customerId: string; similarity: number }>> {
    try {
      const userProfile = await this.getUserProfile(customerId);

      // Get other users who ordered similar items
      const userItems = Array.from(userProfile.preferences.keys());

      if (userItems.length === 0) return [];

      const similarOrders = await prisma.order.findMany({
        where: {
          customerId: { not: customerId },
          status: { notIn: ['cancelled', 'refunded'] },
          items: {
            some: {
              menuItemId: { in: userItems },
            },
          },
        },
        select: {
          customerId: true,
          items: {
            select: {
              menuItemId: true,
              quantity: true,
            },
          },
        },
        take: 500,
      });

      // Calculate similarity for each user
      const userSimilarities = new Map<string, number>();

      for (const order of similarOrders) {
        if (!order.customerId) continue;

        const otherUserId = order.customerId;

        if (!userSimilarities.has(otherUserId)) {
          userSimilarities.set(otherUserId, 0);
        }

        // Simple overlap-based similarity
        for (const item of order.items) {
          if (userProfile.preferences.has(item.menuItemId)) {
            userSimilarities.set(
              otherUserId,
              userSimilarities.get(otherUserId)! + 1
            );
          }
        }
      }

      // Normalize and sort
      const maxSimilarity = Math.max(...Array.from(userSimilarities.values()));

      const results = Array.from(userSimilarities.entries())
        .map(([userId, sim]) => ({
          customerId: userId,
          similarity: maxSimilarity > 0 ? sim / maxSimilarity : 0,
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on similar users
   */
  async getUserBasedRecommendations(
    customerId: string,
    limit: number = 10
  ): Promise<Array<{ itemId: string; score: number }>> {
    try {
      const similarUsers = await this.findSimilarUsers(customerId, 20);
      const userProfile = await this.getUserProfile(customerId);

      if (similarUsers.length === 0) return [];

      const userIds = similarUsers.map(u => u.customerId);

      // Get what similar users ordered
      const theirOrders = await prisma.order.findMany({
        where: {
          customerId: { in: userIds },
          status: { notIn: ['cancelled', 'refunded'] },
        },
        include: {
          items: {
            select: {
              menuItemId: true,
              quantity: true,
            },
          },
        },
        take: 500,
      });

      // Score items based on similarity-weighted orders
      const itemScores = new Map<string, number>();
      const userSimilarityMap = new Map(similarUsers.map(u => [u.customerId, u.similarity]));

      for (const order of theirOrders) {
        if (!order.customerId) continue;

        const similarity = userSimilarityMap.get(order.customerId) || 0;

        for (const item of order.items) {
          const itemId = item.menuItemId;

          // Skip if user already ordered
          if (userProfile.preferences.has(itemId)) continue;

          const score = item.quantity * similarity;
          itemScores.set(itemId, (itemScores.get(itemId) || 0) + score);
        }
      }

      // Normalize and sort
      const maxScore = Math.max(...Array.from(itemScores.values()));

      const results = Array.from(itemScores.entries())
        .map(([itemId, score]) => ({
          itemId,
          score: maxScore > 0 ? score / maxScore : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error getting user-based recommendations:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.userProfileCache.clear();
    this.itemSimilarityCache.clear();
  }

  /**
   * Set decay rate
   */
  setDecayRate(rate: number): void {
    this.decayRate = rate;
    this.clearCache(); // Clear cache to apply new rate
  }
}

/**
 * Singleton instance
 */
export const collaborativeFiltering = new CollaborativeFilteringEngine();

/**
 * Helper: Calculate optimal decay rate based on business type
 */
export function calculateOptimalDecayRate(
  businessType: 'food' | 'fashion' | 'electronics' | 'books'
): number {
  const rates = {
    food: 0.1, // Fast decay (preferences change weekly)
    fashion: 0.05, // Medium decay (seasonal trends)
    electronics: 0.02, // Slow decay (technology preferences stable)
    books: 0.03, // Slow-medium decay
  };

  return rates[businessType] || 0.05;
}
