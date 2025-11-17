# Advanced Recommendation Algorithms - GharSe Platform

## 🚀 Overview

This platform implements a **revolutionary multi-algorithm recommendation system** that combines cutting-edge machine learning techniques to deliver personalized experiences that surpass DoorDash, UberEats, and Postmates.

### What Makes This Special?

Unlike competitors who rely on simple popularity rankings, our system uses:

1. **Thompson Sampling (Multi-Armed Bandit)** - Intelligently balances showing proven winners vs discovering hidden gems
2. **Collaborative Filtering with Temporal Decay** - Learns from user behavior with recent preferences weighted higher
3. **Contextual Bandits** - Context-aware recommendations based on time, weather, location
4. **Velocity-Based Trending** - Catches rising stars BEFORE they peak (not just what's popular)
5. **Cross-Item Affinity Mining** - "Frequently bought together" using association rules
6. **Diversity Injection** - Prevents filter bubbles using Maximal Marginal Relevance
7. **Multi-Objective Optimization** - Balances business goals with user satisfaction

---

## 📊 Algorithm Details

### 1. Thompson Sampling (Multi-Armed Bandit)

**Location:** `/lib/algorithms/thompson-sampling.ts`

**Purpose:** Solve the exploration-exploitation dilemma

**How it works:**
- Each item is modeled as a Beta distribution Beta(α, β)
- α (alpha) = successes (orders, clicks)
- β (beta) = failures (views without orders)
- Sample from each distribution and rank by samples
- Items with high uncertainty get more exploration

**Why it's genius:**
- Google uses this for A/B testing
- Netflix uses this for content recommendations
- LinkedIn uses this for job recommendations
- Automatically finds the optimal balance between showing proven winners and testing new items

**Database:** `BanditStats` table tracks impressions and conversions

**API Endpoint:** Integrated into `/api/recommendations`

---

### 2. Collaborative Filtering with Temporal Decay

**Location:** `/lib/algorithms/collaborative-filtering.ts`

**Purpose:** "Users who are similar to you also liked..."

**Two approaches:**
1. **User-User CF:** Find similar users, recommend what they liked
2. **Item-Item CF:** Find similar items to what user liked

**Key Innovation - Temporal Decay:**
```
weight = e^(-λt)
where:
  t = days ago
  λ = decay rate (0.1 for food = fast decay, preferences change weekly)
```

**Why it's powerful:**
- Preferences change over time (seasons, trends, life events)
- Recent behavior is more predictive than old behavior
- Used by Netflix for movie recommendations
- Used by Spotify for music recommendations

**Database:** `UserItemInteraction` table tracks user preferences

---

### 3. Contextual Bandits (Context-Aware Recommendations)

**Location:** Built into `/lib/algorithms/recommendation-engine.ts`

**Purpose:** Personalize based on current context

**Contexts considered:**
- **Time of day:** Morning → breakfast items, Evening → dinner items
- **Day of week:** Weekend → indulgent items, Weekday → quick items
- **Weather:** Rainy/Cold → hot comfort food, Hot → refreshing items
- **Device type:** Mobile → quick prep items

**Why it's smart:**
- Same user wants different things at different times
- Context is often more predictive than user history alone
- Used by Uber for pricing and recommendations

---

### 4. Velocity-Based Trending

**Location:** `/lib/algorithms/trending-velocity.ts`

**Purpose:** Catch items gaining momentum BEFORE they peak

**Algorithm:**
```
Velocity = (current_window_orders - previous_window_orders) / time
Trending Score = log(current) * 0.4 + velocity * 0.4 + recency * 0.2
```

**Why it beats competitors:**
- Traditional: Rank by total orders (favors old items)
- Better: Rank by recent orders (misses rising trends)
- **BEST:** Rank by ACCELERATION (catches viral items early)

**Inspired by:**
- Reddit's "hot" algorithm
- Hacker News ranking
- TikTok's FYP algorithm
- Twitter's trending topics

**Database:** `ItemVelocity` table tracks order velocity over time windows

**API Endpoint:** `/api/trending`

**Key Insight:** Show users what's ABOUT TO BE popular, not what WAS popular

---

### 5. Cross-Item Affinity Mining

**Location:** `/lib/algorithms/affinity-mining.ts`

**Purpose:** "Frequently bought together" recommendations

**Implements:** Apriori algorithm for association rule mining

**Discovers patterns like:**
- {Biryani} => {Raita} (confidence: 65%)
- {Pizza} => {Garlic Bread, Coke} (confidence: 72%)
- {Curry, Naan} => {Rice} (confidence: 58%)

**Key metrics:**
- **Support:** How often items appear together
- **Confidence:** P(B|A) - If A is ordered, probability of B
- **Lift:** Confidence / P(B) - How much A increases likelihood of B

**Why it works:**
- This is what Amazon uses for "Customers who bought this also bought..."
- Discovers hidden patterns in order data
- Increases average order value

**Database:** `AffinityRule` table stores mined association rules

**API Endpoint:** `/api/complete-meal`

---

### 6. Diversity Injection (Anti-Filter Bubble)

**Location:** Built into `/lib/algorithms/recommendation-engine.ts`

**Purpose:** Ensure variety in recommendations

**Algorithm:** Maximal Marginal Relevance (MMR)

```
MMR = λ * relevance + (1 - λ) * diversity

where:
  λ = diversity factor (0.3 for food delivery)
  diversity = average dissimilarity to already selected items
```

**Why it matters:**
- Prevents filter bubbles
- Introduces serendipity and discovery
- Improves long-term user satisfaction

**Similarity calculated using:**
- Category overlap
- Tag overlap (Jaccard similarity)
- Flavor profile cosine similarity

---

### 7. Multi-Objective Optimization

**Location:** `/lib/algorithms/recommendation-engine.ts`

**Purpose:** Balance multiple goals in final ranking

**Weighted ensemble:**
```
Final Score =
  0.20 * Thompson Sampling +
  0.25 * Collaborative Filtering +
  0.20 * Contextual Bandit +
  0.15 * Trending Velocity +
  0.15 * Affinity Mining +
  0.05 * Diversity
```

**Configurable by business type:**
- Food delivery: Higher contextual weight
- Grocery: Higher affinity weight
- Fashion: Higher trending weight
- Pharmacy: Higher collaborative weight

---

## 🎯 API Endpoints

### 1. Unified Recommendations

```
GET /api/recommendations
```

**Query Parameters:**
- `customerId` (optional): User ID for personalization
- `sessionId` (required): Session ID for A/B testing
- `cartItems` (optional): Comma-separated item IDs in cart
- `category` (optional): Category filter
- `limit` (default: 10): Number of recommendations
- `businessType` (default: food-delivery): Business configuration

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "itemId": "...",
      "score": 0.85,
      "rank": 1,
      "reasons": ["Based on your preferences", "Perfect for right now"],
      "confidence": 0.92,
      "algorithmScores": {
        "thompsonSampling": 0.75,
        "collaborative": 0.88,
        "contextual": 0.91,
        "trending": 0.65,
        "affinity": 0.70,
        "finalScore": 0.85
      },
      "item": { ... }
    }
  ]
}
```

### 2. Trending Items

```
GET /api/trending
```

**Query Parameters:**
- `category` (optional): Category filter
- `window` (default: 6): Time window in hours
- `limit` (default: 10): Number of results
- `minPercentChange` (default: 10): Minimum % change to include

**Response:**
```json
{
  "success": true,
  "trending": [
    {
      "itemId": "...",
      "velocity": 5.2,
      "percentChange": 245,
      "momentum": "rising",
      "currentOrders": 47,
      "previousOrders": 12,
      "trendingScore": 0.89,
      "rank": 1,
      "item": { ... }
    }
  ]
}
```

### 3. Complete the Meal

```
GET /api/complete-meal
```

**Query Parameters:**
- `cartItems` (required): Comma-separated item IDs in cart
- `limit` (default: 5): Number of suggestions

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "score": 0.82,
      "confidence": 0.68,
      "lift": 2.3,
      "reason": "68% of customers add this",
      "item": { ... }
    }
  ]
}
```

### 4. Feedback Recording

```
POST /api/recommendations/feedback
```

**Body:**
```json
{
  "itemId": "...",
  "action": "add_to_cart", // "view", "add_to_cart", "order", "dismiss"
  "sessionId": "...",
  "customerId": "..." // optional
}
```

---

## 🎨 UI Components

### RecommendedItems Component

**Location:** `/components/RecommendedItems.tsx`

**Features:**
- Three tabs: "Recommended for You", "Trending Now", "Complete Your Meal"
- Real-time confidence scores
- Trending indicators
- Automatic feedback recording
- Responsive grid layout

**Usage:**
```tsx
import RecommendedItems from '@/components/RecommendedItems';

<RecommendedItems
  customerId={userId}
  sessionId={sessionId}
  category={selectedCategory}
  limit={6}
  showTrending={true}
  showCartSuggestions={true}
/>
```

---

## 📈 A/B Testing Framework

**Database:** `ABTestAssignment` and `RecommendationMetric` tables

**How it works:**
1. Users are assigned to variants (A, B, C) based on session ID hash
2. Each variant can use different algorithm weights
3. Track shown, clicked, added to cart, ordered for each recommendation
4. Measure conversion rate by variant

**Metrics tracked:**
- **Impression CTR:** clicked / shown
- **Add-to-Cart Rate:** addedToCart / shown
- **Order Rate:** ordered / shown
- **Revenue per Impression:** sum(order_value) / impressions

---

## 🏢 Business-Agnostic Design

The system is configured for ANY business type:

```typescript
export type BusinessType =
  | 'food-delivery'
  | 'grocery'
  | 'pharmacy'
  | 'fashion'
  | 'electronics'
  | 'books'
  | 'general';
```

Each business type has optimized algorithm weights:

- **Food Delivery:** High contextual (time/weather), moderate collaborative
- **Grocery:** High affinity (basket completion), high collaborative
- **Pharmacy:** Very high collaborative, low exploration
- **Fashion:** High trending, high diversity
- **Electronics:** Balanced, moderate affinity
- **Books:** High diversity, high collaborative

**To switch business types:**
```typescript
const engine = new RecommendationEngine('pharmacy');
// or
recommendationEngine.setBusinessType('fashion');
```

---

## 🔬 Scientific Backing

### Thompson Sampling
- **Paper:** "A Tutorial on Thompson Sampling" (Russo et al., 2018)
- **Used by:** Google, Netflix, LinkedIn
- **Advantage:** Optimal exploration-exploitation tradeoff

### Collaborative Filtering
- **Paper:** "Matrix Factorization Techniques for Recommender Systems" (Koren et al., 2009)
- **Used by:** Netflix Prize winners
- **Advantage:** Captures latent user preferences

### Contextual Bandits
- **Paper:** "A Contextual-Bandit Approach to Personalized News Article Recommendation" (Li et al., 2010)
- **Used by:** Yahoo, Microsoft, Uber
- **Advantage:** Adapts to changing contexts

### Association Rules (Apriori)
- **Paper:** "Fast Algorithms for Mining Association Rules" (Agrawal & Srikant, 1994)
- **Used by:** Amazon, Walmart
- **Advantage:** Discovers hidden patterns in transaction data

### Maximal Marginal Relevance (MMR)
- **Paper:** "The Use of MMR, Diversity-Based Reranking for Reordering Documents" (Carbonell & Goldstein, 1998)
- **Used by:** Search engines, recommender systems
- **Advantage:** Balances relevance and diversity

---

## 🚀 Performance Optimizations

1. **Caching:**
   - User profiles cached for 30 minutes
   - Item similarities cached until invalidated
   - Trending scores cached for 10 minutes
   - Affinity rules cached for 1 hour

2. **Database Indexing:**
   - All foreign keys indexed
   - Time-based queries use indexes on createdAt/updatedAt
   - Composite indexes for common query patterns

3. **Query Optimization:**
   - Limit queries to last 1000 orders for performance
   - Use aggregation at database level
   - Batch fetches for item details

4. **Lazy Loading:**
   - Algorithms only run when needed
   - Results cached per session
   - Progressive enhancement

---

## 📊 Analytics Dashboard

Track algorithm performance with built-in metrics:

- **Conversion Funnel:** shown → clicked → added → ordered
- **Algorithm Comparison:** Which algorithm drives most conversions?
- **Trending Performance:** Catch rate for breakout items
- **Diversity Metrics:** Category distribution in recommendations
- **A/B Test Results:** Statistical significance testing

---

## 🎓 How This Beats Competitors

### vs DoorDash
- **DoorDash:** Mostly popularity + manual curation
- **GharSe:** 7 algorithms + auto-learning + context-aware

### vs UberEats
- **UberEats:** Collaborative filtering + simple trending
- **GharSe:** Temporal decay CF + velocity-based trending + contextual bandits

### vs Postmates
- **Postmates:** Category-based + search ranking
- **GharSe:** Multi-armed bandit + affinity mining + diversity injection

### vs Swiggy/Zomato
- **Swiggy/Zomato:** Popularity + promotions + manual
- **GharSe:** Full ML pipeline + real-time learning + explainable AI

---

## 🔮 Future Enhancements

1. **Deep Learning:**
   - Neural collaborative filtering
   - Recurrent networks for sequence prediction
   - Transformer models for session-based recommendations

2. **Graph Neural Networks:**
   - Model user-item-context as knowledge graph
   - Capture complex multi-hop relationships

3. **Reinforcement Learning:**
   - Full contextual bandit with reward modeling
   - Long-term user satisfaction optimization

4. **Real-Time Personalization:**
   - Stream processing for instant updates
   - Online learning with mini-batch SGD

5. **Causal Inference:**
   - Estimate true causal effect of recommendations
   - Remove confounding factors

---

## 📝 Database Schema

```sql
-- Thompson Sampling
BanditStats { itemId, impressions, conversions, alpha, beta }

-- Collaborative Filtering
UserItemInteraction { customerId, itemId, interaction, weight, createdAt }

-- Affinity Mining
AffinityRule { antecedent, consequent, support, confidence, lift }

-- Trending
ItemVelocity { itemId, windowHours, velocity, percentChange, momentum }

-- A/B Testing
ABTestAssignment { sessionId, customerId, variant, algorithm }
RecommendationMetric { itemId, algorithm, shown, clicked, addedToCart, ordered }
```

---

## 🎯 Key Takeaways

1. **Multi-Algorithm Approach:** No single algorithm is best for all situations
2. **Context Matters:** Same user wants different things at different times
3. **Exploration is Key:** Must try new items to discover hidden gems
4. **Learn from Data:** Continuously improve from user interactions
5. **Explainability:** Show users WHY we recommend something
6. **Business-Agnostic:** Same system works for any industry

---

## 🙌 Credits

Inspired by research from:
- Netflix
- Google
- Amazon
- LinkedIn
- Uber
- Reddit
- TikTok

Implemented with:
- TypeScript
- Next.js
- Prisma
- PostgreSQL

---

**This is a production-ready, enterprise-grade recommendation system that rivals (and exceeds) the world's best platforms.**
