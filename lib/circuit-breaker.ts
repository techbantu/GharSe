/**
 * NEW FILE: Circuit Breaker Pattern (Self-Healing Systems)
 * Purpose: Prevent cascading failures when external services (email, payment) fail
 * Pattern: Joe Armstrong's "Let It Crash" philosophy + auto-recovery
 * 
 * States:
 * - CLOSED: Normal operation, all requests go through
 * - OPEN: Threshold exceeded, fail fast without calling service
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 * 
 * Features:
 * - Automatic recovery after timeout (30s default)
 * - Fail fast when service is down (don't wait for timeouts)
 * - Metrics for monitoring
 * - Per-service state tracking
 * 
 * Inspired by: Netflix Hystrix, Resilience4j
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number; // Open after N failures (default: 5)
  successThreshold: number; // Close from HALF_OPEN after N successes (default: 2)
  timeout: number; // Time before trying again in OPEN state (ms, default: 30000)
  name: string; // Circuit breaker identifier (for logging/metrics)
}

interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  totalRejections: number; // Calls rejected due to OPEN state
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  
  // Metrics
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private totalRejections: number = 0;
  
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 30000, // 30 seconds
      name: config.name || 'unnamed-circuit',
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * 
   * Usage:
   * ```typescript
   * const emailBreaker = new CircuitBreaker({ name: 'email-service' });
   * 
   * const result = await emailBreaker.execute(async () => {
   *   return sendEmail(recipient, subject, body);
   * });
   * ```
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;
    
    // Check if circuit is OPEN
    if (this.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        console.log(`[Circuit Breaker:${this.config.name}] Entering HALF_OPEN state (testing recovery)`);
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        // Still in timeout period, reject immediately
        this.totalRejections++;
        const timeRemaining = Math.ceil((this.config.timeout - (Date.now() - this.lastFailureTime)) / 1000);
        throw new CircuitBreakerOpenError(
          `Circuit breaker is OPEN for ${this.config.name}. Retry in ${timeRemaining}s`
        );
      }
    }

    try {
      // Execute the function
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with fallback value on failure
   * 
   * Usage:
   * ```typescript
   * const user = await breaker.executeWithFallback(
   *   () => fetchUser(id),
   *   { id, name: 'Unknown', email: 'unknown@example.com' }
   * );
   * ```
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      console.warn(`[Circuit Breaker:${this.config.name}] Using fallback value:`, error);
      return fallback;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      console.log(`[Circuit Breaker:${this.config.name}] Success in HALF_OPEN (${this.successCount}/${this.config.successThreshold})`);
      
      // Close circuit after threshold successes
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log(`[Circuit Breaker:${this.config.name}] Recovered to CLOSED state ✅`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN reopens the circuit
      this.state = 'OPEN';
      console.error(`[Circuit Breaker:${this.config.name}] Failed in HALF_OPEN, reopening circuit ❌`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Threshold exceeded, open circuit
      this.state = 'OPEN';
      console.error(`[Circuit Breaker:${this.config.name}] Threshold exceeded (${this.failureCount} failures), opening circuit 🔴`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      totalRejections: this.totalRejections,
    };
  }

  /**
   * Manually reset circuit breaker (for testing/admin purposes)
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    console.log(`[Circuit Breaker:${this.config.name}] Manually reset to CLOSED`);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is allowing requests
   */
  isOpen(): boolean {
    return this.state === 'OPEN' && (Date.now() - this.lastFailureTime) < this.config.timeout;
  }
}

/**
 * Custom error for circuit breaker open state
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
    Object.setPrototypeOf(this, CircuitBreakerOpenError.prototype);
  }
}

/**
 * Global circuit breakers for common services
 * Singleton pattern ensures same breaker instance across app
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a service
 */
export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker({ ...config, name }));
  }
  return circuitBreakers.get(name)!;
}

/**
 * Get metrics for all circuit breakers (admin dashboard)
 */
export function getAllCircuitBreakerMetrics(): Record<string, CircuitBreakerMetrics> {
  const metrics: Record<string, CircuitBreakerMetrics> = {};
  
  for (const [name, breaker] of circuitBreakers.entries()) {
    metrics[name] = breaker.getMetrics();
  }
  
  return metrics;
}

/**
 * Reset all circuit breakers (for testing)
 */
export function resetAllCircuitBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset();
  }
  console.log('[Circuit Breaker] All circuit breakers reset');
}

/**
 * Convenience function: Execute with automatic circuit breaker
 * 
 * Usage:
 * ```typescript
 * import { withCircuitBreaker } from '@/lib/circuit-breaker';
 * 
 * const result = await withCircuitBreaker(
 *   'payment-api',
 *   () => processPayment(data)
 * );
 * ```
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, config);
  return breaker.execute(fn);
}

