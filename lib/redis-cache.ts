/**
 * REDIS CACHE LAYER with Fallback and Circuit Breaker
 * 
 * Purpose: High-performance caching with Redis
 * 
 * Features:
 * - Chef listing cache (5 min TTL)
 * - Menu cache per chef (10 min TTL)
 * - Analytics cache (1 hour TTL)
 * - Smart invalidation
 * - Memory fallback when Redis unavailable
 * - Circuit breaker pattern (auto-recovery)
 * 
 * Architecture:
 * - Lazy initialization (only connects if Redis URL exists)
 * - Graceful degradation (falls back to memory)
 * - Circuit breaker (stops trying Redis after failures, auto-recovers)
 */

import { logger } from '@/utils/logger';

// Redis client (lazy loaded)
let redisClient: any = null;
let redisConnected = false;

// Circuit breaker state
let circuitBreakerOpen = false;
let failureCount = 0;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5; // Open after 5 failures
const CIRCUIT_BREAKER_TIMEOUT = 60000; // Try again after 60s
const CIRCUIT_BREAKER_RESET = 300000; // Full reset after 5 min of success

// Memory fallback cache
const memoryCache = new Map<string, { value: any; timestamp: number; ttl: number }>();

// Clean up expired memory cache entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp > entry.ttl * 1000) {
      memoryCache.delete(key);
    }
  }
}, 60000);

const REDIS_CONFIG = {
  url: process.env.REDIS_URL,
  enabled: !!process.env.REDIS_URL,
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  CHEFS_LIST: 5 * 60, // 5 minutes
  CHEF_PROFILE: 10 * 60, // 10 minutes
  CHEF_MENU: 10 * 60, // 10 minutes
  ANALYTICS: 60 * 60, // 1 hour
  MENU_ITEMS: 15 * 60, // 15 minutes
} as const;

/**
 * Check if circuit breaker should allow requests
 */
function shouldAttemptRedis(): boolean {
  if (!circuitBreakerOpen) {
    return true;
  }

  // Check if timeout has passed
  const now = Date.now();
  if (now - lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
    logger.info('Circuit breaker entering HALF_OPEN state (attempting recovery)');
    circuitBreakerOpen = false;
    failureCount = 0;
    return true;
  }

  return false;
}

/**
 * Record Redis failure
 */
function recordRedisFailure(): void {
  failureCount++;
  lastFailureTime = Date.now();

  if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpen = true;
    logger.error('Circuit breaker OPENED - Redis calls suspended', {
      failureCount,
      nextRetry: new Date(lastFailureTime + CIRCUIT_BREAKER_TIMEOUT).toISOString(),
    });
  }
}

/**
 * Record Redis success
 */
function recordRedisSuccess(): void {
  if (circuitBreakerOpen) {
    logger.info('Circuit breaker CLOSED - Redis recovered');
  }
  circuitBreakerOpen = false;
  
  // Reset failure count after sustained success
  if (Date.now() - lastFailureTime > CIRCUIT_BREAKER_RESET) {
    failureCount = 0;
  }
}

/**
 * Initialize Redis client (lazy)
 */
async function getRedisClient() {
  if (!REDIS_CONFIG.enabled) {
    return null;
  }

  // Circuit breaker check
  if (!shouldAttemptRedis()) {
    return null;
  }

  if (redisClient && redisConnected) {
    return redisClient;
  }

  try {
    // Dynamically import Redis (only if enabled)
    // This is wrapped in try-catch to gracefully handle when redis is not installed
    // @ts-ignore - Redis is optional dependency, gracefully fallback to memory cache if not installed
    const redis = await import('redis').catch((error: any) => {
      // Redis module not installed - this is OK, we'll use memory cache
      if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes("Can't resolve")) {
        logger.info('Redis module not found, using memory cache fallback');
        redisConnected = false;
        recordRedisFailure();
        return null;
      }
      throw error; // Re-throw if it's a different error
    });
    
    // If import failed and returned null, return early
    if (!redis) {
      return null;
    }
    
    redisClient = redis.createClient({
      url: REDIS_CONFIG.url,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            logger.error('Redis connection failed after 3 retries');
            redisConnected = false;
            recordRedisFailure();
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis client error', {
        error: err.message,
      });
      redisConnected = false;
      recordRedisFailure();
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      redisConnected = true;
      recordRedisSuccess();
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', {
      error: error instanceof Error ? error.message : String(error),
    });
    redisConnected = false;
    recordRedisFailure();
    return null;
  }
}

/**
 * Get value from cache (Redis with memory fallback)
 */
export async function getCached<T>(key: string): Promise<T | null> {
  // Try Redis first
  try {
    const client = await getRedisClient();
    
    if (client && redisConnected) {
    const cached = await client.get(key);

    if (cached) {
        logger.debug('Cache HIT (Redis)', { key });
        recordRedisSuccess();
      return JSON.parse(cached) as T;
      }
    }
  } catch (error) {
    logger.warn('Redis get failed, using memory fallback', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    recordRedisFailure();
  }

  // Fallback to memory cache
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    const age = Date.now() - memEntry.timestamp;
    if (age < memEntry.ttl * 1000) {
      logger.debug('Cache HIT (memory)', { key });
      return memEntry.value as T;
    } else {
      memoryCache.delete(key);
    }
  }

  logger.debug('Cache MISS', { key });
  return null;
}

/**
 * Set value in cache (Redis with memory fallback)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = 300
): Promise<boolean> {
  let redisSuccess = false;

  // Try Redis first
  try {
    const client = await getRedisClient();
    
    if (client && redisConnected) {
    await client.setEx(key, ttl, JSON.stringify(value));
      logger.debug('Cache SET (Redis)', { key, ttl });
      recordRedisSuccess();
      redisSuccess = true;
    }
  } catch (error) {
    logger.warn('Redis set failed, using memory fallback', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    recordRedisFailure();
  }

  // Always also store in memory as fallback
  memoryCache.set(key, {
    value,
    timestamp: Date.now(),
    ttl,
  });

  logger.debug('Cache SET (memory)', { key, ttl });
  
  return redisSuccess || true; // Always return true (at least memory succeeded)
}

/**
 * Delete key from cache
 */
export async function deleteCached(key: string): Promise<boolean> {
  let success = false;

  // Try Redis
  try {
    const client = await getRedisClient();
    
    if (client && redisConnected) {
    await client.del(key);
      logger.debug('Cache DELETE (Redis)', { key });
      recordRedisSuccess();
      success = true;
    }
  } catch (error) {
    logger.warn('Redis delete failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    recordRedisFailure();
  }

  // Also delete from memory
  memoryCache.delete(key);

  return success;
}

/**
 * Delete keys matching pattern
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  let count = 0;

  // Try Redis
  try {
    const client = await getRedisClient();
    
    if (client && redisConnected) {
    const keys = await client.keys(pattern);

      if (keys.length > 0) {
    await client.del(keys);
        count = keys.length;
        logger.info('Cache INVALIDATE (Redis)', { pattern, count });
        recordRedisSuccess();
      }
    }
  } catch (error) {
    logger.warn('Redis invalidation failed', {
      pattern,
      error: error instanceof Error ? error.message : String(error),
    });
    recordRedisFailure();
  }

  // Also invalidate matching keys in memory
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
      count++;
    }
  }

  return count;
}

// === DOMAIN-SPECIFIC CACHE FUNCTIONS ===

/**
 * Cache chef list
 */
export async function cacheChefsList(chefs: any[], filters?: string): Promise<void> {
  const key = `chefs:list:${filters || 'all'}`;
  await setCached(key, chefs, CACHE_TTL.CHEFS_LIST);
}

/**
 * Get cached chef list
 */
export async function getCachedChefsList(filters?: string): Promise<any[] | null> {
  const key = `chefs:list:${filters || 'all'}`;
  return getCached<any[]>(key);
}

/**
 * Cache chef profile
 */
export async function cacheChefProfile(slug: string, profile: any): Promise<void> {
  const key = `chef:profile:${slug}`;
  await setCached(key, profile, CACHE_TTL.CHEF_PROFILE);
}

/**
 * Get cached chef profile
 */
export async function getCachedChefProfile(slug: string): Promise<any | null> {
  const key = `chef:profile:${slug}`;
  return getCached<any>(key);
}

/**
 * Cache chef menu
 */
export async function cacheChefMenu(slug: string, menu: any[]): Promise<void> {
  const key = `chef:menu:${slug}`;
  await setCached(key, menu, CACHE_TTL.CHEF_MENU);
}

/**
 * Get cached chef menu
 */
export async function getCachedChefMenu(slug: string): Promise<any[] | null> {
  const key = `chef:menu:${slug}`;
  return getCached<any[]>(key);
}

/**
 * Cache chef analytics
 */
export async function cacheChefAnalytics(
  slug: string,
  period: string,
  analytics: any
): Promise<void> {
  const key = `chef:analytics:${slug}:${period}`;
  await setCached(key, analytics, CACHE_TTL.ANALYTICS);
}

/**
 * Get cached chef analytics
 */
export async function getCachedChefAnalytics(
  slug: string,
  period: string
): Promise<any | null> {
  const key = `chef:analytics:${slug}:${period}`;
  return getCached<any>(key);
}

/**
 * Invalidate all chef-related caches
 */
export async function invalidateChefCache(slug?: string): Promise<void> {
  if (slug) {
    // Invalidate specific chef
    await invalidatePattern(`chef:*:${slug}*`);
    await invalidatePattern(`chefs:list:*`); // List also needs update
  } else {
    // Invalidate all chefs
    await invalidatePattern(`chef:*`);
    await invalidatePattern(`chefs:*`);
  }

  logger.info('Chef cache invalidated', { slug: slug || 'all' });
}

/**
 * Invalidate menu cache
 */
export async function invalidateMenuCache(slug?: string): Promise<void> {
  if (slug) {
    await deleteCached(`chef:menu:${slug}`);
  } else {
    await invalidatePattern(`chef:menu:*`);
  }

  logger.info('Menu cache invalidated', { slug: slug || 'all' });
}

/**
 * Cache wrapper function
 * Usage: const result = await withCache('key', () => fetchData(), 300);
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Cache it
  await setCached(key, fresh, ttl);

  return fresh;
}

export default {
  getCached,
  setCached,
  deleteCached,
  invalidatePattern,
  cacheChefsList,
  getCachedChefsList,
  cacheChefProfile,
  getCachedChefProfile,
  cacheChefMenu,
  getCachedChefMenu,
  cacheChefAnalytics,
  getCachedChefAnalytics,
  invalidateChefCache,
  invalidateMenuCache,
  withCache,
  CACHE_TTL,
};

