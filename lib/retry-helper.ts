/**
 * NEW FILE: Retry Helper with Exponential Backoff
 * Purpose: Automatically retry failed operations with increasing delays
 * Pattern: Resilience for transient failures (network glitches, temporary service unavailability)
 * 
 * Features:
 * - Exponential backoff (100ms → 200ms → 400ms → 800ms...)
 * - Jitter to prevent thundering herd
 * - Configurable max attempts and delay
 * - Selective retry (only retry on retriable errors)
 * - Detailed logging for debugging
 * 
 * Inspired by: AWS SDK retry logic, Google Cloud retry strategies
 */

export interface RetryConfig {
  maxAttempts: number; // Maximum retry attempts (default: 3)
  baseDelay: number; // Initial delay in ms (default: 100)
  maxDelay: number; // Maximum delay in ms (default: 10000)
  exponentialBase: number; // Base for exponential backoff (default: 2)
  jitter: boolean; // Add random jitter to prevent thundering herd (default: true)
  retryableErrors?: (error: any) => boolean; // Function to determine if error is retriable
  onRetry?: (attempt: number, error: any, delay: number) => void; // Hook for retry events
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 10000,
  exponentialBase: 2,
  jitter: true,
  retryableErrors: (error: any) => {
    // Retry on network errors, 5xx server errors, timeouts
    if (error.name === 'AbortError') return true;
    if (error.name === 'NetworkError') return true;
    if (error.name === 'TimeoutError') return true;
    if (error.message?.includes('ECONNREFUSED')) return true;
    if (error.message?.includes('ETIMEDOUT')) return true;
    if (error.message?.includes('ENOTFOUND')) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.status === 429) return true; // Rate limited
    return false;
  },
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Exponential backoff: baseDelay * (exponentialBase ^ attempt)
  const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt);
  
  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  
  // Add jitter (0-50% random variation)
  if (config.jitter) {
    const jitterAmount = cappedDelay * 0.5 * Math.random();
    return cappedDelay + jitterAmount;
  }
  
  return cappedDelay;
}

/**
 * Sleep for specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 * 
 * Usage:
 * ```typescript
 * import { retryWithBackoff } from '@/lib/retry-helper';
 * 
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 100,
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  
  let lastError: any;
  
  for (let attempt = 0; attempt < fullConfig.maxAttempts; attempt++) {
    try {
      // First attempt has no delay
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, fullConfig);
        console.log(`[Retry] Attempt ${attempt + 1}/${fullConfig.maxAttempts} after ${Math.round(delay)}ms`);
        await sleep(delay);
      }
      
      // Execute function
      const result = await fn();
      
      // Success
      if (attempt > 0) {
        console.log(`[Retry] Success on attempt ${attempt + 1}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retriable
      const isRetriable = fullConfig.retryableErrors!(error);
      
      if (!isRetriable) {
        console.error('[Retry] Non-retriable error, giving up:', error);
        throw error;
      }
      
      // Check if this was the last attempt
      if (attempt === fullConfig.maxAttempts - 1) {
        console.error(`[Retry] All ${fullConfig.maxAttempts} attempts failed`);
        throw lastError;
      }
      
      // Log retry
      const nextDelay = calculateDelay(attempt, fullConfig);
      console.warn(`[Retry] Attempt ${attempt + 1}/${fullConfig.maxAttempts} failed, retrying in ${Math.round(nextDelay)}ms:`, error);
      
      // Call retry hook if provided
      if (fullConfig.onRetry) {
        fullConfig.onRetry(attempt + 1, error, nextDelay);
      }
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Retry wrapper for fetch requests
 * 
 * Usage:
 * ```typescript
 * import { retryFetch } from '@/lib/retry-helper';
 * 
 * const response = await retryFetch('https://api.example.com/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' }),
 * }, {
 *   maxAttempts: 3,
 * });
 * ```
 */
export async function retryFetch(
  url: string,
  init: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init);
      
      // Throw on non-2xx so retry logic can handle it
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      return response;
    },
    config
  );
}

/**
 * Retry with circuit breaker integration
 * 
 * Combines retry logic with circuit breaker for ultimate resilience
 * 
 * Usage:
 * ```typescript
 * import { retryWithCircuitBreaker } from '@/lib/retry-helper';
 * 
 * const result = await retryWithCircuitBreaker(
 *   'email-service',
 *   async () => sendEmail(to, subject, body),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function retryWithCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { withCircuitBreaker } = await import('@/lib/circuit-breaker');
  
  return retryWithBackoff(
    () => withCircuitBreaker(serviceName, fn),
    config
  );
}

/**
 * Retry metrics for monitoring
 */
interface RetryMetrics {
  totalAttempts: number;
  totalSuccesses: number;
  totalFailures: number;
  avgAttemptsPerSuccess: number;
  retriableErrors: number;
  nonRetriableErrors: number;
}

let metrics: RetryMetrics = {
  totalAttempts: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  avgAttemptsPerSuccess: 0,
  retriableErrors: 0,
  nonRetriableErrors: 0,
};

/**
 * Get retry metrics (for admin dashboard)
 */
export function getRetryMetrics(): RetryMetrics {
  return { ...metrics };
}

/**
 * Reset retry metrics (for testing)
 */
export function resetRetryMetrics(): void {
  metrics = {
    totalAttempts: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    avgAttemptsPerSuccess: 0,
    retriableErrors: 0,
    nonRetriableErrors: 0,
  };
}

/**
 * Wrapper with automatic metrics tracking
 */
export async function retryWithMetrics<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  let attemptCount = 0;
  
  const trackedConfig: Partial<RetryConfig> = {
    ...config,
    onRetry: (attempt, error, delay) => {
      attemptCount = attempt;
      metrics.totalAttempts++;
      
      const isRetriable = (config.retryableErrors || DEFAULT_CONFIG.retryableErrors!)(error);
      if (isRetriable) {
        metrics.retriableErrors++;
      } else {
        metrics.nonRetriableErrors++;
      }
      
      // Call user's onRetry if provided
      if (config.onRetry) {
        config.onRetry(attempt, error, delay);
      }
    },
  };
  
  try {
    const result = await retryWithBackoff(fn, trackedConfig);
    metrics.totalSuccesses++;
    metrics.totalAttempts += (attemptCount + 1);
    
    // Update average
    if (metrics.totalSuccesses > 0) {
      metrics.avgAttemptsPerSuccess = metrics.totalAttempts / metrics.totalSuccesses;
    }
    
    return result;
  } catch (error) {
    metrics.totalFailures++;
    throw error;
  }
}

/**
 * Convenience functions for common retry scenarios
 */

// Email sending with retry
export async function retryEmail<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  return retryWithCircuitBreaker('email-service', fn, {
    maxAttempts: 3,
    baseDelay: 200,
    ...config,
  });
}

// API calls with retry
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    baseDelay: 100,
    ...config,
  });
}

// Database operations with retry
export async function retryDbOperation<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 2,
    baseDelay: 50,
    retryableErrors: (error: any) => {
      // Retry on connection errors, deadlocks, timeouts
      if (error.code === 'P1001') return true; // Prisma connection error
      if (error.code === 'P2034') return true; // Transaction conflict
      if (error.message?.includes('deadlock')) return true;
      if (error.message?.includes('timeout')) return true;
      return false;
    },
    ...config,
  });
}

// Webhook delivery with retry
export async function retryWebhook<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 5, // Webhooks get more retries
    baseDelay: 1000, // Start with 1 second
    maxDelay: 60000, // Max 1 minute
    ...config,
  });
}

