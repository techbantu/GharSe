/**
 * 🛡️ ADVANCED RATE LIMITING SYSTEM
 * 
 * Multi-layered rate limiting:
 * 1. Global rate limit (all requests)
 * 2. Per-endpoint limits
 * 3. Per-user limits
 * 4. Burst protection
 * 5. Adaptive throttling
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  burstSize?: number; // Allow burst of requests
  skipSuccessfulRequests?: boolean; // Only count failed requests
}

// Predefined rate limit tiers
export const RATE_LIMITS = {
  // Very strict for auth endpoints (prevent brute force)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Only 5 attempts per 15 min
    burstSize: 2, // Allow 2 quick attempts
  },
  
  // Moderate for API endpoints
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    burstSize: 10,
  },
  
  // Generous for static content
  STATIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    burstSize: 100,
  },
  
  // Strict for expensive operations
  EXPENSIVE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Only 10 per minute
    burstSize: 2,
  },
};

// In-memory store (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetAt: number;
  burst: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Token Bucket Algorithm for burst protection
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true; // Request allowed
    }
    
    return false; // Rate limited
  }
  
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Token buckets for different IPs
const tokenBuckets = new Map<string, TokenBucket>();

/**
 * Get or create token bucket for identifier
 */
function getTokenBucket(identifier: string, config: RateLimitConfig): TokenBucket {
  if (!tokenBuckets.has(identifier)) {
    const refillRate = config.maxRequests / (config.windowMs / 1000);
    const bucket = new TokenBucket(
      config.burstSize || config.maxRequests,
      refillRate
    );
    tokenBuckets.set(identifier, bucket);
  }
  
  return tokenBuckets.get(identifier)!;
}

/**
 * Rate limit check using sliding window
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = identifier;
  
  // Clean expired entries
  for (const [k, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(k);
    }
  }
  
  // Get or create entry
  let entry = store.get(key);
  
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
      burst: config.burstSize || 0,
    };
    store.set(key, entry);
  }
  
  // Check token bucket for burst protection
  const bucket = getTokenBucket(identifier, config);
  const canConsume = bucket.consume();
  
  if (!canConsume) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Express/Next.js middleware for rate limiting
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    // Get identifier (IP address)
    const ip = 
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    
    // Check rate limit
    const result = checkRateLimit(ip, config);
    
    // Add rate limit headers
    const headers = new Headers({
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    });
    
    if (!result.allowed) {
      headers.set('Retry-After', String(result.retryAfter));
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
          resetAt: result.resetAt,
        }),
        {
          status: 429,
          headers,
        }
      );
    }
    
    // Add headers to response
    return NextResponse.next({
      headers,
    });
  };
}

/**
 * Adaptive rate limiting based on server load
 */
export class AdaptiveRateLimiter {
  private baseConfig: RateLimitConfig;
  private currentMultiplier: number = 1.0;
  
  constructor(baseConfig: RateLimitConfig) {
    this.baseConfig = baseConfig;
  }
  
  /**
   * Adjust rate limits based on system load
   * @param cpuUsage - CPU usage percentage (0-100)
   * @param memoryUsage - Memory usage percentage (0-100)
   */
  adjustForLoad(cpuUsage: number, memoryUsage: number): void {
    const avgLoad = (cpuUsage + memoryUsage) / 2;
    
    if (avgLoad > 80) {
      // High load: reduce limits by 50%
      this.currentMultiplier = 0.5;
    } else if (avgLoad > 60) {
      // Medium load: reduce limits by 25%
      this.currentMultiplier = 0.75;
    } else {
      // Normal load: full capacity
      this.currentMultiplier = 1.0;
    }
    
    console.log(`⚖️  Rate limit adjusted: ${this.currentMultiplier * 100}% capacity (Load: ${avgLoad}%)`);
  }
  
  getConfig(): RateLimitConfig {
    return {
      ...this.baseConfig,
      maxRequests: Math.floor(this.baseConfig.maxRequests * this.currentMultiplier),
    };
  }
}

/**
 * Get statistics for monitoring
 */
export function getRateLimitStats(): {
  activeClients: number;
  totalRequests: number;
  blockedRequests: number;
} {
  let totalRequests = 0;
  let blockedRequests = 0;
  
  for (const entry of store.values()) {
    totalRequests += entry.count;
    if (entry.count > 0) {
      // This is a rough estimate
      blockedRequests += Math.max(0, entry.count - 100);
    }
  }
  
  return {
    activeClients: store.size,
    totalRequests,
    blockedRequests,
  };
}

