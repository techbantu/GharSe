/**
 * Correlation ID Management - Request Tracing
 * 
 * Purpose: Generate and propagate correlation IDs across the request lifecycle.
 * Enables tracing a single user request across multiple services/functions.
 * 
 * Pattern: Each request gets a unique ID that flows through all operations.
 * When debugging, grep logs by correlation ID to see the full request story.
 */

import { NextRequest } from 'next/server';

// AsyncLocalStorage for Node.js 16+ (request-scoped context)
let asyncLocalStorage: any = null;

// Initialize AsyncLocalStorage if available (Node.js runtime only)
if (typeof globalThis !== 'undefined') {
  try {
    const { AsyncLocalStorage } = require('async_hooks');
    asyncLocalStorage = new AsyncLocalStorage();
  } catch {
    // Edge runtime doesn't support async_hooks
    // Fall back to header-based correlation
  }
}

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `corr-${timestamp}-${random}`;
}

/**
 * Extract or generate correlation ID from request
 */
export function getCorrelationId(request?: NextRequest): string {
  // Try to get from AsyncLocalStorage first (Node.js runtime)
  if (asyncLocalStorage) {
    const stored = asyncLocalStorage.getStore();
    if (stored?.correlationId) {
      return stored.correlationId;
    }
  }
  
  // Try from request headers
  if (request) {
    const headerValue = request.headers.get('x-correlation-id') ||
                        request.headers.get('x-request-id');
    if (headerValue) {
      return headerValue;
    }
  }
  
  // Generate new if not found
  return generateCorrelationId();
}

/**
 * Set correlation ID in async context
 */
export function setCorrelationId(correlationId: string): void {
  if (asyncLocalStorage) {
    const store = asyncLocalStorage.getStore() || {};
    store.correlationId = correlationId;
  }
}

/**
 * Run function with correlation context
 */
export async function withCorrelation<T>(
  correlationId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (asyncLocalStorage) {
    return asyncLocalStorage.run({ correlationId }, fn);
  }
  // Fallback without async context
  return fn();
}

/**
 * Middleware wrapper to add correlation ID to requests
 */
export function withCorrelationMiddleware(
  handler: (request: NextRequest, correlationId: string) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const correlationId = getCorrelationId(request);
    
    if (asyncLocalStorage) {
      return withCorrelation(correlationId, () => handler(request, correlationId));
    }
    
    return handler(request, correlationId);
  };
}

export default {
  generateCorrelationId,
  getCorrelationId,
  setCorrelationId,
  withCorrelation,
  withCorrelationMiddleware,
};

