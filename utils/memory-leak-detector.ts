/**
 * Memory Leak Detection Utilities
 * 
 * Comprehensive memory leak detection and prevention tools
 * for ensuring the application maintains optimal memory usage
 */

import { performance } from 'perf_hooks';

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * Take a memory snapshot
 */
export function takeMemorySnapshot(): MemorySnapshot {
  const usage = process.memoryUsage();
  return {
    timestamp: Date.now(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
  };
}

/**
 * Calculate memory difference between two snapshots
 */
export function getMemoryDiff(
  before: MemorySnapshot,
  after: MemorySnapshot
): {
  heapUsedDiff: number;
  heapTotalDiff: number;
  rssDiff: number;
  heapUsedDiffMB: number;
  heapTotalDiffMB: number;
  rssDiffMB: number;
} {
  return {
    heapUsedDiff: after.heapUsed - before.heapUsed,
    heapTotalDiff: after.heapTotal - before.heapTotal,
    rssDiff: after.rss - before.rss,
    heapUsedDiffMB: (after.heapUsed - before.heapUsed) / 1024 / 1024,
    heapTotalDiffMB: (after.heapTotal - before.heapTotal) / 1024 / 1024,
    rssDiffMB: (after.rss - before.rss) / 1024 / 1024,
  };
}

/**
 * Memory leak detector class
 */
export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private thresholdMB: number;

  constructor(thresholdMB: number = 50) {
    this.thresholdMB = thresholdMB;
  }

  /**
   * Start monitoring memory
   */
  start(intervalMs: number = 1000): void {
    this.snapshots = [];
    this.intervalId = setInterval(() => {
      this.snapshots.push(takeMemorySnapshot());
    }, intervalMs);
  }

  /**
   * Stop monitoring and analyze
   */
  stop(): {
    hasLeak: boolean;
    maxGrowthMB: number;
    averageGrowthMB: number;
    snapshots: MemorySnapshot[];
  } {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.snapshots.length < 2) {
      return {
        hasLeak: false,
        maxGrowthMB: 0,
        averageGrowthMB: 0,
        snapshots: this.snapshots,
      };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const diff = getMemoryDiff(first, last);

    const maxGrowthMB = diff.heapUsedDiffMB;
    const averageGrowthMB =
      this.snapshots.reduce((sum, snap, idx) => {
        if (idx === 0) return 0;
        const prev = this.snapshots[idx - 1];
        const currentDiff = getMemoryDiff(prev, snap);
        return sum + currentDiff.heapUsedDiffMB;
      }, 0) / (this.snapshots.length - 1);

    const hasLeak = maxGrowthMB > this.thresholdMB;

    return {
      hasLeak,
      maxGrowthMB,
      averageGrowthMB,
      snapshots: this.snapshots,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * Test helper: Check for memory leaks in a function
 */
export async function testMemoryLeak(
  fn: () => Promise<void> | void,
  iterations: number = 100,
  thresholdMB: number = 10
): Promise<{
  passed: boolean;
  maxGrowthMB: number;
  message: string;
}> {
  const detector = new MemoryLeakDetector(thresholdMB);
  const before = takeMemorySnapshot();

  // Run function multiple times
  for (let i = 0; i < iterations; i++) {
    await fn();
    // Force GC every 10 iterations
    if (i % 10 === 0 && global.gc) {
      global.gc();
    }
  }

  // Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));

  const after = takeMemorySnapshot();
  const diff = getMemoryDiff(before, after);

  const passed = diff.heapUsedDiffMB < thresholdMB;
  const message = passed
    ? `Memory usage acceptable: ${diff.heapUsedDiffMB.toFixed(2)}MB growth`
    : `Potential memory leak detected: ${diff.heapUsedDiffMB.toFixed(2)}MB growth (threshold: ${thresholdMB}MB)`;

  return {
    passed,
    maxGrowthMB: diff.heapUsedDiffMB,
    message,
  };
}

/**
 * Cleanup helper for tests
 */
export function cleanupMemory(): void {
  // Clear any intervals
  if (typeof global !== 'undefined') {
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  // Clear any timeouts
  if (typeof jest !== 'undefined') {
    jest.clearAllTimers();
  }
}

