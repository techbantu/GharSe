/**
 * NEW FILE: Rate Limiting Utility - Carmack Performance Protection
 * 
 * Purpose: Prevent abuse by limiting requests per IP/route to protect hot paths.
 * 
 * Philosophy: Inspired by John Carmack's obsession with real-time performance.
 * Rate limiting prevents one bad actor from degrading service for everyone.
 * 
 * Design:
 * - Token bucket algorithm (efficient, O(1) operations)
 * - Per-IP limiting (prevents single user from spamming)
 * - Per-route limits (different thresholds per endpoint)
 * - In-memory store (fast, suitable for single server)
 * - Future: Migrate to Redis for distributed rate limiting
 */

import { Result, Ok, Err, RateLimitError } from './result';
import { logger } from './logger';

interface RateLimitConfig {
  /**
   * Maximum requests allowed in the time window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Route identifier (for logging)
   */
  route?: string;
}

/**
 * Token bucket entry for a single IP
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * In-memory store of token buckets (IP → bucket)
 * 
 * Note: In production with multiple servers, use Redis instead.
 * This implementation is suitable for single-server deployments.
 */
class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Clean up stale buckets every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Check if request should be allowed
   * 
   * @param identifier Unique identifier (usually IP address)
   * @param config Rate limit configuration
   * @returns Result<boolean, RateLimitError>
   */
  check(
    identifier: string,
    config: RateLimitConfig
  ): Result<true, RateLimitError> {
    const now = Date.now();
    const bucket = this.buckets.get(identifier);
    
    // Create new bucket if doesn't exist
    if (!bucket) {
      this.buckets.set(identifier, {
        tokens: config.maxRequests - 1, // Consume one token
        lastRefill: now,
      });
      
      return Ok(true);
    }
    
    // Calculate time since last refill
    const timePassed = now - bucket.lastRefill;
    const windowsPassed = Math.floor(timePassed / config.windowMs);
    
    // Refill tokens if a full window has passed
    if (windowsPassed > 0) {
      bucket.tokens = config.maxRequests;
      bucket.lastRefill = now;
    }
    
    // Check if tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return Ok(true);
    }
    
    // Rate limit exceeded
    const retryAfter = config.windowMs - (timePassed % config.windowMs);
    
    logger.warn('Rate limit exceeded', {
      identifier: identifier.substring(0, 8) + '...', // Don't log full IP
      route: config.route,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      retryAfterMs: retryAfter,
    });
    
    return Err(
      new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
        Math.ceil(retryAfter / 1000),
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }
  
  /**
   * Clean up stale buckets (older than 1 hour)
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let cleaned = 0;
    
    for (const [identifier, bucket] of this.buckets.entries()) {
      if (bucket.lastRefill < oneHourAgo) {
        this.buckets.delete(identifier);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} stale rate limit buckets`);
    }
  }
  
  /**
   * Get current token count for identifier (for debugging)
   */
  getTokens(identifier: string): number | null {
    const bucket = this.buckets.get(identifier);
    if (!bucket) return null;
    
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const windowsPassed = Math.floor(timePassed / (60 * 1000)); // Assuming 1 minute window
    
    // This is approximate - actual refill logic is in check()
    return bucket.tokens;
  }
  
  /**
   * Reset rate limit for identifier (for testing)
   */
  reset(identifier: string): void {
    this.buckets.delete(identifier);
  }
  
  /**
   * Destroy rate limiter and clear intervals
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }
}

// Singleton instance (shared across application)
export const rateLimiter = new RateLimiter();

/**
 * Extract IP address from Next.js request
 */
export function getClientIp(request: Request): string {
  // In production behind proxy, check X-Forwarded-For header
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback (won't work in production behind proxy)
  return 'unknown';
}

/**
 * Common rate limit configurations per route
 */
export const RATE_LIMITS = {
  /**
   * Order creation: 10 requests per minute
   * (Prevents spam orders, but allows legitimate users)
   */
  CREATE_ORDER: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    route: 'POST /api/orders',
  },
  
  /**
   * Search: 30 requests per minute
   * (More lenient, users might type quickly)
   */
  SEARCH: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    route: 'GET /api/search',
  },
  
  /**
   * Analytics: 100 requests per minute
   * (Very lenient, client-side tracking)
   */
  ANALYTICS: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    route: 'POST /api/analytics',
  },
  
  /**
   * Payment intent: 5 requests per minute
   * (Strict, prevents payment abuse)
   */
  PAYMENT: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    route: 'POST /api/payments/create-intent',
  },
  
  /**
   * Order status update: 20 requests per minute
   */
  UPDATE_ORDER: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    route: 'PATCH /api/orders/[id]',
  },
} as const;

/**
 * Apply rate limiting to a request
 * 
 * @param request Next.js request
 * @param config Rate limit configuration
 * @returns Result<true, RateLimitError>
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig
): Result<true, RateLimitError> {
  const ip = getClientIp(request);
  return rateLimiter.check(ip, config);
}

