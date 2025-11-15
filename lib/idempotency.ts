/**
 * Idempotency Layer - Prevent Duplicate Operations
 * 
 * Purpose: Ensure operations can be safely retried without side effects.
 * Critical for order creation - prevents double-charging customers.
 * 
 * Pattern:
 * 1. Client generates idempotency key (unique per operation)
 * 2. Server checks if key already processed
 * 3. If yes, return cached response (no-op)
 * 4. If no, process operation and cache response
 * 
 * Storage: Redis (fast lookups) with 24-hour TTL
 * Fallback: In-memory Map (if Redis unavailable)
 */

import { getCached, setCached } from './redis-cache';
import { logger } from '@/utils/logger';

// In-memory fallback (when Redis unavailable)
const memoryStore = new Map<string, {
  response: any;
  timestamp: number;
}>();

// TTL for idempotency keys (24 hours)
const IDEMPOTENCY_TTL = 24 * 60 * 60;

// Clean up old entries every hour
setInterval(() => {
  const cutoff = Date.now() - (IDEMPOTENCY_TTL * 1000);
  for (const [key, value] of memoryStore.entries()) {
    if (value.timestamp < cutoff) {
      memoryStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Check if idempotency key already processed
 * Returns cached response if exists, null otherwise
 */
export async function checkIdempotency<T = any>(
  key: string
): Promise<T | null> {
  if (!key || key.trim() === '') {
    return null;
  }

  // Normalize key (lowercase, trim)
  const normalizedKey = `idempotency:${key.toLowerCase().trim()}`;

  // Try Redis first
  try {
    const cached = await getCached<T>(normalizedKey);
    if (cached !== null) {
      logger.info('Idempotency key hit (Redis)', { key: normalizedKey });
      return cached;
    }
  } catch (error) {
    logger.warn('Redis check failed, trying memory fallback', {
      key: normalizedKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Try memory fallback
  const memEntry = memoryStore.get(normalizedKey);
  if (memEntry) {
    // Check if still valid (not expired)
    const age = Date.now() - memEntry.timestamp;
    if (age < IDEMPOTENCY_TTL * 1000) {
      logger.info('Idempotency key hit (memory)', { key: normalizedKey });
      return memEntry.response as T;
    } else {
      // Expired, remove it
      memoryStore.delete(normalizedKey);
    }
  }

  return null;
}

/**
 * Store response for idempotency key
 */
export async function storeIdempotencyResponse<T = any>(
  key: string,
  response: T
): Promise<void> {
  if (!key || key.trim() === '') {
    return;
  }

  const normalizedKey = `idempotency:${key.toLowerCase().trim()}`;

  // Try Redis first
  try {
    await setCached(normalizedKey, response, IDEMPOTENCY_TTL);
    logger.debug('Idempotency response stored (Redis)', {
      key: normalizedKey,
    });
  } catch (error) {
    logger.warn('Failed to store in Redis, using memory fallback', {
      key: normalizedKey,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to memory
    memoryStore.set(normalizedKey, {
      response,
      timestamp: Date.now(),
    });
  }
}

/**
 * Validate idempotency key format
 * 
 * Requirements:
 * - At least 16 characters (for entropy)
 * - Alphanumeric + hyphens + underscores
 * - Max 255 characters (for storage efficiency)
 */
export function validateIdempotencyKey(key: string): {
  valid: boolean;
  error?: string;
} {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Idempotency key is required' };
  }

  const trimmed = key.trim();

  if (trimmed.length < 16) {
    return {
      valid: false,
      error: 'Idempotency key must be at least 16 characters',
    };
  }

  if (trimmed.length > 255) {
    return {
      valid: false,
      error: 'Idempotency key must not exceed 255 characters',
    };
  }

  // Allow alphanumeric, hyphens, underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Idempotency key can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Generate idempotency key (client-side helper)
 * 
 * Format: operation-timestamp-sessionId-random
 * Example: order-1704067200000-sess123abc-4k9x2p
 */
export function generateIdempotencyKey(
  operation: string,
  sessionId: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${operation}-${timestamp}-${sessionId}-${random}`;
}

/**
 * Middleware wrapper for idempotent operations
 */
export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if already processed
  const cached = await checkIdempotency<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute operation
  const result = await operation();

  // Store result
  await storeIdempotencyResponse(key, result);

  return result;
}

export default {
  checkIdempotency,
  storeIdempotencyResponse,
  validateIdempotencyKey,
  generateIdempotencyKey,
  withIdempotency,
  IDEMPOTENCY_TTL,
};

