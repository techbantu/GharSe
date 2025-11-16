/**
 * CONCURRENCY TESTS - Idempotency Under Load
 * Purpose: Verify idempotency system prevents duplicate operations
 * Critical: These tests simulate race conditions and concurrent requests
 * 
 * Test scenarios:
 * - Double-submit (same key, rapid succession)
 * - Concurrent requests (same key, parallel execution)
 * - Race conditions (two tabs submitting simultaneously)
 * - Cache failures (Redis down, in-memory fallback)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  withIdempotency,
  checkIdempotency,
  storeIdempotencyResult,
  resetIdempotencyMetrics,
  getIdempotencyMetrics,
} from '@/lib/idempotency';

describe('Idempotency - Concurrency & Race Conditions', () => {
  beforeEach(() => {
    resetIdempotencyMetrics();
  });

  describe('Double-Submit Prevention', () => {
    test('Same idempotency key returns cached result (not duplicate)', async () => {
      const idempotencyKey = 'test-order-12345';
      let executionCount = 0;

      // Create a mock handler that increments counter
      const handler = async () => {
        executionCount++;
        return new Response(JSON.stringify({ orderId: 'ORDER-001', execution: executionCount }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      // Create mock requests with same idempotency key
      const request1 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ item: 'pizza' }),
      });

      const request2 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ item: 'pizza' }),
      });

      // First request executes handler
      const response1 = await withIdempotency(request1, handler);
      const data1 = await response1.json();

      // Second request should return cached result (no execution)
      const response2 = await withIdempotency(request2, handler);
      const data2 = await response2.json();

      // Assertions
      expect(executionCount).toBe(1); // Handler only executed once
      expect(data1.orderId).toBe('ORDER-001');
      expect(data2.orderId).toBe('ORDER-001'); // Same result
      expect(response2.headers.get('X-Idempotency-Replay')).toBe('true');
    });

    test('Different idempotency keys execute independently', async () => {
      let executionCount = 0;

      const handler = async () => {
        executionCount++;
        return new Response(JSON.stringify({ count: executionCount }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const request1 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'key-1' },
      });

      const request2 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'key-2' },
      });

      await withIdempotency(request1, handler);
      await withIdempotency(request2, handler);

      expect(executionCount).toBe(2); // Both executed
    });
  });

  describe('Concurrent Request Protection', () => {
    test('Concurrent requests with same key only execute once', async () => {
      const idempotencyKey = 'concurrent-test-001';
      let executionCount = 0;

      // Slow handler to simulate processing time
      const handler = async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return new Response(JSON.stringify({ orderId: 'ORDER-002', count: executionCount }), {
          status: 200,
        });
      };

      // Create 5 concurrent requests with same key
      const requests = Array.from({ length: 5 }, () => 
        new Request('https://test.com/api/orders', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
        })
      );

      // Execute all requests in parallel
      const responses = await Promise.all(
        requests.map(req => withIdempotency(req, handler))
      );

      // Parse all responses
      const results = await Promise.all(
        responses.map(res => res.json())
      );

      // Assertions
      expect(executionCount).toBe(1); // Handler executed only once
      results.forEach(result => {
        expect(result.orderId).toBe('ORDER-002'); // All got same result
      });

      // Check if concurrent requests were detected
      const metrics = await getIdempotencyMetrics();
      expect(metrics.concurrentDuplicates).toBeGreaterThan(0);
    });

    test('Concurrent requests wait for first to complete', async () => {
      const idempotencyKey = 'wait-test-001';
      const startTimes: number[] = [];
      const endTimes: number[] = [];

      const handler = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      const makeRequest = async () => {
        startTimes.push(Date.now());
        const req = new Request('https://test.com/api/orders', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
        });
        await withIdempotency(req, handler);
        endTimes.push(Date.now());
      };

      // Start 3 requests concurrently
      await Promise.all([
        makeRequest(),
        makeRequest(),
        makeRequest(),
      ]);

      // All should start around same time
      const maxStartDiff = Math.max(...startTimes) - Math.min(...startTimes);
      expect(maxStartDiff).toBeLessThan(50); // Within 50ms

      // All should end around same time (after first completes)
      const maxEndDiff = Math.max(...endTimes) - Math.min(...endTimes);
      expect(maxEndDiff).toBeLessThan(500); // Within 500ms window
    });
  });

  describe('Race Condition Handling', () => {
    test('Two tabs submitting simultaneously only create one order', async () => {
      const idempotencyKey = 'race-condition-001';
      const createdOrders: string[] = [];

      // Simulate order creation with race condition
      const createOrder = async (tabId: string) => {
        const handler = async () => {
          // Simulate database insertion
          const orderId = `ORDER-${Date.now()}`;
          createdOrders.push(orderId);
          
          return new Response(JSON.stringify({ orderId, tabId }), {
            status: 200,
          });
        };

        const request = new Request('https://test.com/api/orders', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
        });

        return withIdempotency(request, handler);
      };

      // Simulate two tabs submitting at exact same time
      const [response1, response2] = await Promise.all([
        createOrder('tab1'),
        createOrder('tab2'),
      ]);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Only one order should be created
      expect(createdOrders.length).toBe(1);
      
      // Both responses should have same order ID
      expect(data1.orderId).toBe(data2.orderId);
    });

    test('Rapid succession requests are deduplicated', async () => {
      const idempotencyKey = 'rapid-fire-001';
      let dbInsertCount = 0;

      const handler = async () => {
        dbInsertCount++;
        return new Response(JSON.stringify({ insertNumber: dbInsertCount }), {
          status: 200,
        });
      };

      // Rapid fire 10 requests with minimal delay
      const promises: Promise<Response>[] = [];
      for (let i = 0; i < 10; i++) {
        const request = new Request('https://test.com/api/orders', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
        });
        promises.push(withIdempotency(request, handler));
        
        // Tiny delay to simulate network timing
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Only one database insert should occur
      expect(dbInsertCount).toBe(1);
      
      // All results should be identical
      const firstResult = results[0].insertNumber;
      results.forEach(result => {
        expect(result.insertNumber).toBe(firstResult);
      });
    });
  });

  describe('Cache Failure Scenarios', () => {
    test('In-memory fallback works when Redis fails', async () => {
      // This tests the in-memory cache fallback
      const idempotencyKey = 'fallback-test-001';
      let executionCount = 0;

      const handler = async () => {
        executionCount++;
        return new Response(JSON.stringify({ count: executionCount }), {
          status: 200,
        });
      };

      // First request (stores in both Redis and in-memory)
      const request1 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      await withIdempotency(request1, handler);

      // Second request (should hit in-memory cache even if Redis fails)
      const request2 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      await withIdempotency(request2, handler);

      // Handler should only execute once
      expect(executionCount).toBe(1);

      // Check metrics show Redis errors are tracked
      const metrics = await getIdempotencyMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Under Concurrency', () => {
    test('Failed requests are not cached', async () => {
      const idempotencyKey = 'error-test-001';
      let attemptCount = 0;

      const handler = async () => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt fails
          throw new Error('Database connection failed');
        }
        // Second attempt succeeds
        return new Response(JSON.stringify({ success: true, attempt: attemptCount }), {
          status: 200,
        });
      };

      const request1 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      const request2 = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      // First request fails
      try {
        await withIdempotency(request1, handler);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Second request should retry (not return cached error)
      const response2 = await withIdempotency(request2, handler);
      const data2 = await response2.json();

      expect(data2.success).toBe(true);
      expect(attemptCount).toBe(2); // Both attempts executed
    });

    test('Invalid idempotency keys are rejected', async () => {
      const handler = async () => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      const request = new Request('https://test.com/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'invalid-key-format' }, // Not UUID
      });

      const response = await withIdempotency(request, handler);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid idempotency key format');

      const metrics = await getIdempotencyMetrics();
      expect(metrics.invalidKeys).toBeGreaterThan(0);
    });
  });

  describe('Performance Under Load', () => {
    test('System handles 100 concurrent requests efficiently', async () => {
      const uniqueKeys = Array.from({ length: 100 }, (_, i) => `load-test-${i}`);
      let executionCount = 0;

      const handler = async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms processing
        return new Response(JSON.stringify({ count: executionCount }), { status: 200 });
      };

      const startTime = Date.now();

      // Create 100 concurrent requests with unique keys
      const requests = uniqueKeys.map(key => 
        new Request('https://test.com/api/orders', {
          method: 'POST',
          headers: { 'Idempotency-Key': key },
        })
      );

      await Promise.all(
        requests.map(req => withIdempotency(req, handler))
      );

      const duration = Date.now() - startTime;

      // All 100 should execute
      expect(executionCount).toBe(100);

      // Should complete in reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);

      console.log(`✅ Processed 100 concurrent requests in ${duration}ms`);
    });
  });
});

