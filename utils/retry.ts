/**
 * NEW FILE: Retry Utility with Exponential Backoff - Resilience Pattern
 * 
 * Purpose: Automatically retry failed operations with exponential backoff.
 * Prevents hammering failing services while giving transient errors time to recover.
 * 
 * Philosophy: Inspired by Joe Armstrong's "let it crash" and auto-recovery.
 * System should heal itself without user intervention.
 * 
 * Design:
 * - Exponential backoff: 100ms → 200ms → 400ms → 800ms
 * - Max attempts configurable (default: 3)
 * - Jitter to prevent thundering herd
 * - Only retries retriable errors (network, timeout, 5xx)
 */

import { Result, Ok, Err, isRetriableError, AppError } from './result';
import { logger } from './logger';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: AppError) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 100, // milliseconds
  maxDelay: 5000, // milliseconds
  jitter: true,
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, jitter: boolean): number {
  // Exponential: baseDelay * 2^(attempt - 1)
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Add jitter (±20%) to prevent thundering herd
  if (jitter) {
    const jitterAmount = cappedDelay * 0.2 * (Math.random() * 2 - 1); // -20% to +20%
    return Math.max(0, cappedDelay + jitterAmount);
  }
  
  return cappedDelay;
}

/**
 * Sleep for specified milliseconds (non-blocking Promise)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function that returns Result<T, E> with exponential backoff
 * 
 * Only retries if error is retriable (network, timeout, 5xx).
 * Permanent errors (4xx except rate limit) are not retried.
 * 
 * @param fn Function to retry (must return Result<T, E>)
 * @param options Retry configuration
 * @returns Result<T, E> - Ok if any attempt succeeds, Err if all fail
 * 
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => fetchOrder(orderId),
 *   { maxAttempts: 3, baseDelay: 100 }
 * );
 * 
 * if (result.isErr()) {
 *   // All retries failed
 *   showError(result.error.message);
 * }
 * ```
 */
export async function retryWithBackoff<T, E extends AppError>(
  fn: () => Promise<Result<T, E>>,
  options: RetryOptions = {}
): Promise<Result<T, E>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: E | undefined;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const result = await fn();
    
    // Success on any attempt
    if (result.isOk()) {
      if (attempt > 1) {
        logger.info(`Operation succeeded on attempt ${attempt}`, {
          attempts: attempt,
          maxAttempts: opts.maxAttempts,
        });
      }
      return result;
    }
    
    // Failure
    lastError = result.error;
    
    // Don't retry if error is not retriable
    if (!isRetriableError(lastError)) {
      logger.debug(`Not retrying non-retriable error`, {
        attempt,
        error: lastError.message,
        errorType: lastError.constructor.name,
      });
      return result;
    }
    
    // Last attempt - don't delay
    if (attempt === opts.maxAttempts) {
      logger.warn(`All retry attempts exhausted`, {
        attempts: attempt,
        maxAttempts: opts.maxAttempts,
        finalError: lastError.message,
      });
      return result;
    }
    
    // Calculate delay and wait
    const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay, opts.jitter);
    
    logger.debug(`Retrying operation`, {
      attempt,
      maxAttempts: opts.maxAttempts,
      delayMs: Math.round(delay),
      error: lastError.message,
    });
    
    opts.onRetry(attempt, lastError);
    
    await sleep(delay);
  }
  
  // This should never be reached, but TypeScript requires it
  return Err(lastError!);
}

/**
 * Retry a function that returns a Promise (non-Result pattern)
 * 
 * Wraps the function to return Result, then retries.
 * 
 * @example
 * ```ts
 * const result = await retryPromise(
 *   () => fetch('/api/orders').then(r => r.json()),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function retryPromise<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<Result<T, AppError>> {
  const wrappedFn = async (): Promise<Result<T, AppError>> => {
    try {
      const value = await fn();
      return Ok(value);
    } catch (error) {
      // Convert thrown error to AppError
      if (error instanceof Error) {
        return Err(error as AppError);
      }
      return Err(new Error(String(error)) as AppError);
    }
  };
  
  return retryWithBackoff(wrappedFn, options);
}

