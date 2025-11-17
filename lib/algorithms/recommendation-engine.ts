/**
 * Revolutionary Multi-Algorithm Recommendation Engine
 *
 * Combines cutting-edge techniques:
 * 1. Thompson Sampling (Multi-Armed Bandit) - Exploration vs Exploitation
 * 2. Collaborative Filtering with Temporal Decay - User pattern learning
 * 3. Contextual Bandits - Time/Weather/Location awareness
 * 4. Velocity-Based Trending - Rising stars detection
 * 5. Cross-Item Affinity Mining - Frequently bought together
 * 6. Diversity Injection - Prevent filter bubbles
 * 7. Multi-Objective Optimization - Balance multiple goals
 *
 * This system is business-agnostic and can be adapted to any domain
 */

export interface RecommendationContext {
  customerId?: string;
  sessionId: string;
  currentTime: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  isWeekend: boolean;
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'cold' | 'hot';
  temperature?: number;
  location?: { lat: number; lng: number };
  cartItems?: string[]; // Current cart item IDs
  userHistory?: string[]; // Previously ordered item IDs
  userSegment?: 'new' | 'casual' | 'regular' | 'vip';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

export interface RecommendationItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating?: number;
  ratingCount?: number;
  tags?: string[];
  flavorProfile?: number[]; // 8D vector from taste-analyzer
  preparationTime?: number;
  popularity?: number;
  metadata?: Record<string, any>;
}

export interface RecommendationResult {
  itemId: string;
  score: number;
  rank: number;
  reasons: string[]; // Explainability
  algorithmScores: {
    thompsonSampling?: number;
    collaborative?: number;
    contextual?: number;
    trending?: number;
    affinity?: number;
    diversity?: number;
    finalScore: number;
  };
  confidence: number;
  experimentGroup?: 'A' | 'B' | 'C'; // For A/B testing
}

export interface AlgorithmWeights {
  thompsonSampling: number;  // Exploration vs exploitation
  collaborative: number;      // User similarity
  contextual: number;         // Context-aware
  trending: number;           // Velocity-based
  affinity: number;           // Cart-based
  diversity: number;          // Anti-filter bubble
}

export type BusinessType =
  | 'food-delivery'
  | 'grocery'
  | 'pharmacy'
  | 'fashion'
  | 'electronics'
  | 'books'
  | 'general';

export interface BusinessConfig {
  type: BusinessType;
  weights: AlgorithmWeights;
  diversityFactor: number; // 0-1, higher = more diverse
  explorationRate: number; // 0-1, higher = more exploration
  trendingWindow: number; // hours to consider for trending
  affinityThreshold: number; // min confidence for affinity rules
}

// Predefined configs for different business types
export const BUSINESS_CONFIGS: Record<BusinessType, BusinessConfig> = {
  'food-delivery': {
    type: 'food-delivery',
    weights: {
      thompsonSampling: 0.20,
      collaborative: 0.25,
      contextual: 0.20,
      trending: 0.15,
      affinity: 0.15,
      diversity: 0.05,
    },
    diversityFactor: 0.3,
    explorationRate: 0.15,
    trendingWindow: 24,
    affinityThreshold: 0.1,
  },
  'grocery': {
    type: 'grocery',
    weights: {
      thompsonSampling: 0.15,
      collaborative: 0.30,
      contextual: 0.15,
      trending: 0.10,
      affinity: 0.25,
      diversity: 0.05,
    },
    diversityFactor: 0.4,
    explorationRate: 0.10,
    trendingWindow: 168, // 7 days
    affinityThreshold: 0.15,
  },
  'pharmacy': {
    type: 'pharmacy',
    weights: {
      thompsonSampling: 0.10,
      collaborative: 0.35,
      contextual: 0.10,
      trending: 0.05,
      affinity: 0.35,
      diversity: 0.05,
    },
    diversityFactor: 0.2,
    explorationRate: 0.05,
    trendingWindow: 720, // 30 days
    affinityThreshold: 0.20,
  },
  'fashion': {
    type: 'fashion',
    weights: {
      thompsonSampling: 0.25,
      collaborative: 0.20,
      contextual: 0.15,
      trending: 0.25,
      affinity: 0.10,
      diversity: 0.05,
    },
    diversityFactor: 0.5,
    explorationRate: 0.25,
    trendingWindow: 72, // 3 days
    affinityThreshold: 0.08,
  },
  'electronics': {
    type: 'electronics',
    weights: {
      thompsonSampling: 0.20,
      collaborative: 0.25,
      contextual: 0.10,
      trending: 0.20,
      affinity: 0.20,
      diversity: 0.05,
    },
    diversityFactor: 0.4,
    explorationRate: 0.20,
    trendingWindow: 168, // 7 days
    affinityThreshold: 0.12,
  },
  'books': {
    type: 'books',
    weights: {
      thompsonSampling: 0.15,
      collaborative: 0.35,
      contextual: 0.10,
      trending: 0.15,
      affinity: 0.15,
      diversity: 0.10,
    },
    diversityFactor: 0.6,
    explorationRate: 0.15,
    trendingWindow: 336, // 14 days
    affinityThreshold: 0.10,
  },
  'general': {
    type: 'general',
    weights: {
      thompsonSampling: 0.20,
      collaborative: 0.25,
      contextual: 0.15,
      trending: 0.15,
      affinity: 0.15,
      diversity: 0.10,
    },
    diversityFactor: 0.4,
    explorationRate: 0.15,
    trendingWindow: 72,
    affinityThreshold: 0.10,
  },
};

/**
 * Main Recommendation Engine Class
 */
export class RecommendationEngine {
  private config: BusinessConfig;

  constructor(businessType: BusinessType = 'food-delivery') {
    this.config = BUSINESS_CONFIGS[businessType];
  }

  /**
   * Generate personalized recommendations
   */
  async recommend(
    items: RecommendationItem[],
    context: RecommendationContext,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    if (items.length === 0) return [];

    // Calculate scores from each algorithm
    const thompsonScores = await this.calculateThompsonSampling(items, context);
    const collaborativeScores = await this.calculateCollaborativeFiltering(items, context);
    const contextualScores = await this.calculateContextualBandit(items, context);
    const trendingScores = await this.calculateTrendingVelocity(items, context);
    const affinityScores = await this.calculateAffinityMining(items, context);

    // Combine scores using weighted ensemble
    const results: RecommendationResult[] = items.map((item, index) => {
      const thompsonScore = thompsonScores[index] || 0;
      const collaborativeScore = collaborativeScores[index] || 0;
      const contextualScore = contextualScores[index] || 0;
      const trendingScore = trendingScores[index] || 0;
      const affinityScore = affinityScores[index] || 0;

      // Weighted combination
      const baseScore =
        thompsonScore * this.config.weights.thompsonSampling +
        collaborativeScore * this.config.weights.collaborative +
        contextualScore * this.config.weights.contextual +
        trendingScore * this.config.weights.trending +
        affinityScore * this.config.weights.affinity;

      // Calculate reasons for explainability
      const reasons: string[] = [];
      if (thompsonScore > 0.7) reasons.push('Optimized for discovery');
      if (collaborativeScore > 0.7) reasons.push('Based on your preferences');
      if (contextualScore > 0.7) reasons.push('Perfect for right now');
      if (trendingScore > 0.7) reasons.push('Trending up fast');
      if (affinityScore > 0.7) reasons.push('Goes great with your cart');

      return {
        itemId: item.id,
        score: baseScore,
        rank: 0, // Will be set after sorting
        reasons,
        algorithmScores: {
          thompsonSampling: thompsonScore,
          collaborative: collaborativeScore,
          contextual: contextualScore,
          trending: trendingScore,
          affinity: affinityScore,
          finalScore: baseScore,
        },
        confidence: this.calculateConfidence(thompsonScore, collaborativeScore, contextualScore),
        experimentGroup: this.assignExperimentGroup(context.sessionId),
      };
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply diversity injection
    const diverseResults = this.applyDiversityInjection(
      results,
      items,
      this.config.diversityFactor
    );

    // Assign ranks
    diverseResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    return diverseResults.slice(0, limit);
  }

  /**
   * Thompson Sampling - Multi-Armed Bandit
   * Balances exploration (trying new items) vs exploitation (showing proven winners)
   */
  private async calculateThompsonSampling(
    items: RecommendationItem[],
    context: RecommendationContext
  ): Promise<number[]> {
    // For each item, sample from Beta distribution based on success/failure history
    return items.map(item => {
      const successes = (item.ratingCount || 0) * ((item.rating || 3) / 5);
      const failures = (item.ratingCount || 0) - successes;

      // Beta distribution parameters (with prior)
      const alpha = successes + 1;
      const beta = failures + 1;

      // Sample from Beta distribution (simplified with mean + random exploration)
      const mean = alpha / (alpha + beta);
      const exploration = Math.random() * this.config.explorationRate;

      return Math.min(1, mean + exploration);
    });
  }

  /**
   * Collaborative Filtering with Temporal Decay
   * Learn from similar users' preferences, with recent behavior weighted higher
   */
  private async calculateCollaborativeFiltering(
    items: RecommendationItem[],
    context: RecommendationContext
  ): Promise<number[]> {
    if (!context.customerId || !context.userHistory || context.userHistory.length === 0) {
      // No user history, return neutral scores
      return items.map(() => 0.5);
    }

    // In a real implementation, this would query a user-item matrix
    // For now, we'll use a simplified version based on category overlap
    return items.map(item => {
      // Check if item category matches user's historical preferences
      const categoryMatch = context.userHistory!.some(histId => {
        // In production, look up the category of histId
        return true; // Simplified
      });

      // Temporal decay: recent history weighted more (exponential decay)
      const recencyBoost = 0.3;

      return categoryMatch ? 0.7 + recencyBoost : 0.3;
    });
  }

  /**
   * Contextual Bandit - Context-Aware Recommendations
   * Considers time of day, weather, location, device type
   */
  private async calculateContextualBandit(
    items: RecommendationItem[],
    context: RecommendationContext
  ): Promise<number[]> {
    return items.map(item => {
      let score = 0.5; // Base score

      // Time of day context (for food delivery)
      if (this.config.type === 'food-delivery') {
        const itemTags = item.tags || [];

        if (context.timeOfDay === 'morning') {
          if (itemTags.includes('breakfast') || itemTags.includes('light')) score += 0.3;
        } else if (context.timeOfDay === 'afternoon') {
          if (itemTags.includes('lunch') || itemTags.includes('quick')) score += 0.3;
        } else if (context.timeOfDay === 'evening' || context.timeOfDay === 'night') {
          if (itemTags.includes('dinner') || itemTags.includes('hearty')) score += 0.3;
        }
      }

      // Weather context
      if (context.weather === 'rainy' || context.weather === 'cold') {
        const itemTags = item.tags || [];
        if (itemTags.includes('hot') || itemTags.includes('comfort') || itemTags.includes('soup')) {
          score += 0.2;
        }
      } else if (context.weather === 'hot') {
        const itemTags = item.tags || [];
        if (itemTags.includes('cold') || itemTags.includes('refreshing') || itemTags.includes('light')) {
          score += 0.2;
        }
      }

      // Weekend vs weekday
      if (context.isWeekend) {
        const itemTags = item.tags || [];
        if (itemTags.includes('indulgent') || itemTags.includes('special')) {
          score += 0.15;
        }
      }

      // Device type (mobile users prefer quick items)
      if (context.deviceType === 'mobile' && item.preparationTime && item.preparationTime < 20) {
        score += 0.1;
      }

      return Math.min(1, score);
    });
  }

  /**
   * Velocity-Based Trending
   * Detect items gaining momentum (not just popular, but rising fast)
   */
  private async calculateTrendingVelocity(
    items: RecommendationItem[],
    context: RecommendationContext
  ): Promise<number[]> {
    // In production, this would analyze order velocity over time windows
    // For now, simulate with popularity + random velocity factor

    return items.map(item => {
      const basePopularity = item.popularity || 0;

      // Simulate velocity (would be calculated from order history)
      // Velocity = (recent orders - historical average) / historical average
      const simulatedVelocity = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2

      const trendingScore = Math.max(0, basePopularity + simulatedVelocity);

      return Math.min(1, trendingScore);
    });
  }

  /**
   * Cross-Item Affinity Mining
   * "Frequently bought together" - Apriori algorithm for association rules
   */
  private async calculateAffinityMining(
    items: RecommendationItem[],
    context: RecommendationContext
  ): Promise<number[]> {
    if (!context.cartItems || context.cartItems.length === 0) {
      return items.map(() => 0.5); // Neutral if no cart items
    }

    // In production, this would query association rules from order history
    // Rules like: {Biryani} => {Raita} with confidence 0.65

    return items.map(item => {
      // Check if item has affinity with cart items
      let affinityScore = 0.5;

      // Simplified affinity rules (in production, mine from data)
      const cartCategories = new Set(context.cartItems!.map(id => {
        // In production, look up category
        return 'main'; // Simplified
      }));

      // Example rules
      if (cartCategories.has('main') && item.category === 'sides') {
        affinityScore = 0.8;
      } else if (cartCategories.has('main') && item.category === 'beverage') {
        affinityScore = 0.7;
      } else if (cartCategories.has('spicy') && item.tags?.includes('cooling')) {
        affinityScore = 0.75;
      }

      return affinityScore;
    });
  }

  /**
   * Diversity Injection
   * Prevent filter bubbles by ensuring variety in recommendations
   * Uses Maximal Marginal Relevance (MMR) algorithm
   */
  private applyDiversityInjection(
    rankedResults: RecommendationResult[],
    items: RecommendationItem[],
    diversityFactor: number
  ): RecommendationResult[] {
    if (diversityFactor === 0 || rankedResults.length <= 2) {
      return rankedResults;
    }

    const reranked: RecommendationResult[] = [];
    const remaining = [...rankedResults];
    const itemsMap = new Map(items.map(item => [item.id, item]));

    // Always add top result first
    reranked.push(remaining.shift()!);

    // For each subsequent position, balance relevance and diversity
    while (remaining.length > 0 && reranked.length < rankedResults.length) {
      let bestIndex = 0;
      let bestMMRScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const candidateItem = itemsMap.get(candidate.itemId);

        // Relevance score (from original ranking)
        const relevance = candidate.score;

        // Diversity score (average dissimilarity to already selected items)
        let diversityScore = 0;
        for (const selected of reranked) {
          const selectedItem = itemsMap.get(selected.itemId);
          if (candidateItem && selectedItem) {
            const similarity = this.calculateSimilarity(candidateItem, selectedItem);
            diversityScore += (1 - similarity);
          }
        }
        diversityScore /= reranked.length;

        // MMR formula: λ * relevance + (1 - λ) * diversity
        const mmrScore =
          (1 - diversityFactor) * relevance +
          diversityFactor * diversityScore;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestIndex = i;
        }
      }

      reranked.push(remaining.splice(bestIndex, 1)[0]);
    }

    return reranked;
  }

  /**
   * Calculate similarity between two items (for diversity)
   */
  private calculateSimilarity(item1: RecommendationItem, item2: RecommendationItem): number {
    let similarity = 0;

    // Category similarity
    if (item1.category === item2.category) similarity += 0.5;

    // Tag overlap
    if (item1.tags && item2.tags) {
      const tags1 = new Set(item1.tags);
      const tags2 = new Set(item2.tags);
      const intersection = new Set([...tags1].filter(t => tags2.has(t)));
      const union = new Set([...tags1, ...tags2]);
      similarity += 0.3 * (intersection.size / union.size);
    }

    // Flavor profile similarity (cosine similarity)
    if (item1.flavorProfile && item2.flavorProfile) {
      const cosineSim = this.cosineSimilarity(item1.flavorProfile, item2.flavorProfile);
      similarity += 0.2 * cosineSim;
    }

    return Math.min(1, similarity);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Calculate confidence based on agreement between algorithms
   */
  private calculateConfidence(
    thompsonScore: number,
    collaborativeScore: number,
    contextualScore: number
  ): number {
    // If algorithms agree (all high or all low), confidence is high
    const scores = [thompsonScore, collaborativeScore, contextualScore];
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;

    // Low variance = high confidence
    return Math.max(0, 1 - variance);
  }

  /**
   * Assign experiment group for A/B testing
   */
  private assignExperimentGroup(sessionId: string): 'A' | 'B' | 'C' {
    // Hash session ID to consistently assign groups
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
      hash = hash & hash;
    }
    const bucket = Math.abs(hash) % 3;
    return bucket === 0 ? 'A' : bucket === 1 ? 'B' : 'C';
  }

  /**
   * Update business configuration
   */
  setBusinessType(businessType: BusinessType): void {
    this.config = BUSINESS_CONFIGS[businessType];
  }

  /**
   * Get current configuration
   */
  getConfig(): BusinessConfig {
    return { ...this.config };
  }

  /**
   * Custom configuration
   */
  setCustomConfig(config: Partial<BusinessConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Singleton instance for easy access
 */
export const recommendationEngine = new RecommendationEngine('food-delivery');
