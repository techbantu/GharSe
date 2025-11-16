/**
 * API IDEMPOTENCY SYSTEM (GENIUS ARCHITECTURE)
 * 
 * Purpose: Prevent duplicate requests (orders, payments) from creating duplicate records
 * 
 * Architecture:
 * - Client generates UUID for each operation
 * - Server caches result in Redis (primary) or in-memory (fallback)
 * - Duplicate requests return cached result
 * - Handles network chaos, retries, concurrent requests
 * 
 * Features:
 * - Redis with automatic in-memory fallback (no Redis = still protected)
 * - 24-hour cache TTL (covers all retry windows)
 * - Concurrent request protection (only one execution per key)
 * - Detailed metrics for monitoring
 * 
 * Inspired by: Stripe's idempotency implementation
 */

import crypto from 'crypto';
import { getCached, setCached } from '@/lib/redis-cache';

interface IdempotencyResult<T = any> {
  statusCode: number;
  body: T;
  headers?: Record<string, string>;
  timestamp: number;
}

// In-memory cache fallback (when Redis unavailable)
const inMemoryCache = new Map<string, { data: IdempotencyResult; expiresAt: number }>();
const processingKeys = new Set<string>(); // Track in-flight requests

// Metrics tracking
let metricsData = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  invalidKeys: 0,
  concurrentDuplicates: 0,
  redisErrors: 0,
};

/**
 * Generate idempotency key (client-side)
 * 
 * Usage in frontend:
 * ```typescript
 * const idempotencyKey = generateIdempotencyKey();
 * fetch('/api/orders', {
 *   headers: { 'Idempotency-Key': idempotencyKey }
 * });
 * ```
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Check if request has already been processed
 * 
 * Returns cached result if found, null otherwise
 * Falls back to in-memory cache if Redis fails
 */
export async function checkIdempotency<T = any>(
  idempotencyKey: string
): Promise<IdempotencyResult<T> | null> {
  const cacheKey = `idempotency:${idempotencyKey}`;
  
  try {
    // Try Redis first
    const cached = await getCached<IdempotencyResult<T>>(cacheKey);
    
    if (cached) {
      console.log(`[Idempotency] Redis cache hit for key: ${idempotencyKey.substring(0, 8)}...`);
      metricsData.cacheHits++;
      return cached;
    }
  } catch (error) {
    console.error('[Idempotency] Redis check failed, falling back to in-memory:', error);
    metricsData.redisErrors++;
  }
  
  // Fallback to in-memory cache
  const memCached = inMemoryCache.get(cacheKey);
  if (memCached && memCached.expiresAt > Date.now()) {
    console.log(`[Idempotency] In-memory cache hit for key: ${idempotencyKey.substring(0, 8)}...`);
    metricsData.cacheHits++;
    return memCached.data;
  } else if (memCached) {
    // Expired entry
    inMemoryCache.delete(cacheKey);
  }
  
  metricsData.cacheMisses++;
  return null;
}

/**
 * Store result for idempotency check
 * 
 * Cached for 24 hours (covers retry windows)
 * Stores in both Redis and in-memory for redundancy
 */
export async function storeIdempotencyResult<T = any>(
  idempotencyKey: string,
  statusCode: number,
  body: T,
  headers?: Record<string, string>
): Promise<void> {
  const cacheKey = `idempotency:${idempotencyKey}`;
  
  const result: IdempotencyResult<T> = {
    statusCode,
    body,
    headers,
    timestamp: Date.now(),
  };
  
  const ttlSeconds = 86400; // 24 hours
  
  try {
    // Store in Redis (primary)
    await setCached(cacheKey, result, ttlSeconds);
    console.log(`[Idempotency] Stored in Redis for key: ${idempotencyKey.substring(0, 8)}...`);
  } catch (error) {
    console.error('[Idempotency] Redis store failed:', error);
    metricsData.redisErrors++;
  }
  
  // Also store in-memory (fallback + performance)
  inMemoryCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + (ttlSeconds * 1000),
  });
  
  // Cleanup in-memory cache if too large (prevent memory leak)
  if (inMemoryCache.size > 1000) {
    cleanupInMemoryCache();
  }
}

/**
 * Cleanup expired entries from in-memory cache
 * Called automatically when cache grows too large
 */
function cleanupInMemoryCache(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of inMemoryCache.entries()) {
    if (value.expiresAt < now) {
      inMemoryCache.delete(key);
      cleaned++;
    }
  }
  
  console.log(`[Idempotency] Cleaned up ${cleaned} expired cache entries`);
}

/**
 * Extract idempotency key from request headers
 */
export function extractIdempotencyKey(headers: Headers): string | null {
  return headers.get('idempotency-key') || headers.get('Idempotency-Key');
}

/**
 * Validate idempotency key format
 * 
 * Must be valid UUID v4
 */
export function isValidIdempotencyKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

/**
 * Middleware wrapper for idempotent API routes
 * 
 * Features:
 * - Automatic cache check/store
 * - Concurrent request protection (prevents double-execution)
 * - Redis + in-memory fallback
 * - Metrics tracking
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return withIdempotency(request, async (req) => {
 *     // Your handler logic here
 *     const order = await createOrder(data);
 *     return NextResponse.json({ success: true, order });
 *   });
 * }
 * ```
 */
export async function withIdempotency<T = any>(
  request: Request,
  handler: (request: Request) => Promise<Response>
): Promise<Response> {
  metricsData.totalRequests++;
  
  // Extract idempotency key
  const idempotencyKey = extractIdempotencyKey(request.headers);
  
  // If no key provided, execute normally (allow non-idempotent requests)
  if (!idempotencyKey) {
    console.warn('[Idempotency] No key provided, executing without idempotency protection');
    return handler(request);
  }
  
  // Validate key format
  if (!isValidIdempotencyKey(idempotencyKey)) {
    metricsData.invalidKeys++;
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid idempotency key format. Must be UUID v4.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Check if already processed
  const cached = await checkIdempotency(idempotencyKey);
  
  if (cached) {
    console.log(`[Idempotency] Returning cached result (${cached.statusCode})`);
    
    return new Response(
      JSON.stringify(cached.body),
      {
        status: cached.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Replay': 'true', // Indicate this is replayed response
          'X-Idempotency-Original-Timestamp': cached.timestamp.toString(),
          ...(cached.headers || {}),
        },
      }
    );
  }
  
  // Check if another request with same key is currently processing
  if (processingKeys.has(idempotencyKey)) {
    metricsData.concurrentDuplicates++;
    console.warn(`[Idempotency] Concurrent request detected for key: ${idempotencyKey.substring(0, 8)}...`);
    
    // Wait for original request to finish (poll cache with timeout)
    const maxWaitMs = 30000; // 30 seconds max
    const pollIntervalMs = 100; // Check every 100ms
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
      const result = await checkIdempotency(idempotencyKey);
      if (result) {
        console.log('[Idempotency] Concurrent request resolved via polling');
        return new Response(
          JSON.stringify(result.body),
          {
            status: result.statusCode,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Replay': 'true',
              'X-Idempotency-Concurrent': 'true',
              ...(result.headers || {}),
            },
          }
        );
      }
    }
    
    // Timeout reached, return 409 Conflict
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Concurrent request with same idempotency key is still processing',
      }),
      {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Mark as processing
  processingKeys.add(idempotencyKey);
  
  try {
    // Execute handler
    const response = await handler(request);
    
    // Clone response to read body (Response can only be read once)
    const clonedResponse = response.clone();
    
    // Store result for future idempotency checks
    try {
      const body = await clonedResponse.json();
      const statusCode = response.status;
      
      // Only cache successful responses (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        await storeIdempotencyResult(idempotencyKey, statusCode, body);
      }
    } catch (error) {
      console.error('[Idempotency] Failed to cache response:', error);
      // Don't fail the request if caching fails
    }
    
    return response;
  } finally {
    // Always remove from processing set
    processingKeys.delete(idempotencyKey);
  }
}

/**
 * React hook for generating and managing idempotency keys
 * NOTE: This is exported from a separate client-side file: hooks/useIdempotency.ts
 * This keeps server-side idempotency logic separate from client-side React hooks
 */

/**
 * Enhanced fetch with automatic idempotency
 * 
 * Usage:
 * ```typescript
 * const response = await idempotentFetch('/api/orders', {
 *   method: 'POST',
 *   body: JSON.stringify(orderData),
 * });
 * ```
 */
export async function idempotentFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Only add idempotency key for POST/PUT/PATCH
  const method = options.method?.toUpperCase() || 'GET';
  const needsIdempotency = ['POST', 'PUT', 'PATCH'].includes(method);
  
  if (!needsIdempotency) {
    return fetch(url, options);
  }
  
  // Check if key already provided
  const headers = new Headers(options.headers);
  const existingKey = headers.get('Idempotency-Key');
  
  if (!existingKey) {
    // Generate new key
    const key = generateIdempotencyKey();
    headers.set('Idempotency-Key', key);
    console.log(`[Idempotency] Generated key: ${key.substring(0, 8)}... for ${method} ${url}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Metrics for monitoring idempotency usage
 */
export interface IdempotencyMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  invalidKeys: number;
  averageAge: number; // Average age of cached results (ms)
  concurrentDuplicates: number; // Concurrent requests with same key
  redisErrors: number; // Redis failures (fallback to in-memory)
  inMemoryCacheSize: number; // Current in-memory cache entries
  processingKeysCount: number; // Currently processing requests
}

/**
 * Get idempotency metrics (for admin dashboard)
 * Real-time stats with memory usage
 */
export async function getIdempotencyMetrics(): Promise<IdempotencyMetrics> {
  const hitRate = metricsData.totalRequests > 0
    ? (metricsData.cacheHits / metricsData.totalRequests) * 100
    : 0;
  
  // Calculate average age of cached results
  let totalAge = 0;
  let count = 0;
  const now = Date.now();
  
  for (const [_, value] of inMemoryCache.entries()) {
    if (value.data.timestamp) {
      totalAge += (now - value.data.timestamp);
      count++;
    }
  }
  
  const averageAge = count > 0 ? totalAge / count : 0;
  
  return {
    totalRequests: metricsData.totalRequests,
    cacheHits: metricsData.cacheHits,
    cacheMisses: metricsData.cacheMisses,
    hitRate: Number(hitRate.toFixed(2)),
    invalidKeys: metricsData.invalidKeys,
    averageAge: Number(averageAge.toFixed(0)),
    concurrentDuplicates: metricsData.concurrentDuplicates,
    redisErrors: metricsData.redisErrors,
    inMemoryCacheSize: inMemoryCache.size,
    processingKeysCount: processingKeys.size,
  };
}

/**
 * Reset metrics (for testing/admin purposes)
 */
export function resetIdempotencyMetrics(): void {
  metricsData = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    invalidKeys: 0,
    concurrentDuplicates: 0,
    redisErrors: 0,
  };
  console.log('[Idempotency] Metrics reset');
}
