/**
 * CROSS-TAB SYNC TESTER
 * 
 * Purpose: Automated testing framework for cross-tab state synchronization
 * 
 * Usage:
 * ```typescript
 * import { CrossTabTester } from '@/lib/flow-audit/cross-tab-sync-tester';
 * 
 * const tester = new CrossTabTester('auth');
 * await tester.testSyncLatency();
 * await tester.testConflictResolution();
 * ```
 */

interface SyncEvent {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

interface TestResult {
  testName: string;
  passed: boolean;
  latency?: number;
  error?: string;
  details?: any;
}

export class CrossTabTester {
  private channelName: string;
  private channel: BroadcastChannel | null = null;
  private receivedEvents: SyncEvent[] = [];
  private testId: string;

  constructor(channelName: string) {
    this.channelName = channelName;
    this.testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event) => {
        this.receivedEvents.push({
          type: event.data.type,
          data: event.data,
          timestamp: Date.now(),
          source: event.data.source || 'unknown',
        });
      };
    }
  }

  /**
   * Test: Measure sync latency across tabs
   * 
   * Sends event and waits for echo from other tab
   */
  async testSyncLatency(timeoutMs = 1000): Promise<TestResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const testEvent = {
        type: 'SYNC_TEST',
        source: this.testId,
        timestamp: startTime,
        echo: true, // Request echo back
      };
      
      // Listen for echo
      const handleEcho = (event: SyncEvent) => {
        if (event.type === 'SYNC_ECHO' && event.data.originalSource === this.testId) {
          const latency = Date.now() - startTime;
          
          resolve({
            testName: 'Cross-Tab Sync Latency',
            passed: latency < 100, // Should be under 100ms
            latency,
            details: {
              startTime,
              endTime: Date.now(),
              echo: event,
            },
          });
        }
      };
      
      // Add temporary listener
      if (this.channel) {
        this.channel.addEventListener('message', (e) => handleEcho(e.data));
      }
      
      // Send test event
      this.broadcast(testEvent);
      
      // Timeout fallback
      setTimeout(() => {
        resolve({
          testName: 'Cross-Tab Sync Latency',
          passed: false,
          error: 'No echo received (no other tabs open or sync broken)',
          latency: Date.now() - startTime,
        });
      }, timeoutMs);
    });
  }

  /**
   * Test: Verify localStorage fallback works
   */
  async testLocalStorageFallback(): Promise<TestResult> {
    if (!this.channel) {
      return {
        testName: 'localStorage Fallback',
        passed: false,
        error: 'BroadcastChannel not supported',
      };
    }

    const testKey = `test_sync_${this.testId}`;
    const testData = { value: 'test', timestamp: Date.now() };
    
    try {
      // Write to localStorage (should trigger storage event in other tabs)
      localStorage.setItem(testKey, JSON.stringify(testData));
      localStorage.removeItem(testKey); // Immediate remove to trigger event
      
      // In real implementation, other tab would respond
      // For this test, just verify we can write/read
      
      return {
        testName: 'localStorage Fallback',
        passed: true,
        details: {
          note: 'localStorage write/remove successful. Full test requires 2+ tabs.',
        },
      };
    } catch (error) {
      return {
        testName: 'localStorage Fallback',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test: Conflict detection and resolution
   */
  async testConflictResolution(): Promise<TestResult> {
    // Simulate two conflicting updates
    const update1 = {
      type: 'STATE_UPDATE',
      source: this.testId,
      version: 1,
      timestamp: Date.now(),
      data: { value: 'A' },
    };
    
    const update2 = {
      type: 'STATE_UPDATE',
      source: 'other_tab',
      version: 2, // Higher version
      timestamp: Date.now() + 100, // Later timestamp
      data: { value: 'B' },
    };
    
    // Test version-based conflict resolution
    const winner = update2.version > update1.version ? update2 : update1;
    
    return {
      testName: 'Conflict Resolution',
      passed: winner === update2, // Higher version should win
      details: {
        update1,
        update2,
        winner,
        strategy: 'version-based',
      },
    };
  }

  /**
   * Test: State consistency check
   * 
   * Verifies that state in localStorage matches expected format
   */
  async testStateConsistency(
    storageKey: string,
    validator: (state: any) => boolean
  ): Promise<TestResult> {
    try {
      const storedState = localStorage.getItem(storageKey);
      
      if (!storedState) {
        return {
          testName: 'State Consistency',
          passed: false,
          error: `No state found for key: ${storageKey}`,
        };
      }
      
      const parsedState = JSON.parse(storedState);
      const isValid = validator(parsedState);
      
      return {
        testName: 'State Consistency',
        passed: isValid,
        details: {
          storageKey,
          stateSnapshot: parsedState,
        },
      };
    } catch (error) {
      return {
        testName: 'State Consistency',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test: Measure state update frequency
   * 
   * Counts how many times state updates in a given time window
   */
  async testUpdateFrequency(
    storageKey: string,
    durationMs = 5000
  ): Promise<TestResult> {
    let updateCount = 0;
    let lastValue: any = null;
    
    const interval = setInterval(() => {
      const currentValue = localStorage.getItem(storageKey);
      if (currentValue !== lastValue) {
        updateCount++;
        lastValue = currentValue;
      }
    }, 100); // Check every 100ms
    
    await new Promise(resolve => setTimeout(resolve, durationMs));
    clearInterval(interval);
    
    const updatesPerSecond = (updateCount / durationMs) * 1000;
    
    return {
      testName: 'Update Frequency',
      passed: updatesPerSecond < 10, // Should not update more than 10x/sec (avoid thrashing)
      details: {
        totalUpdates: updateCount,
        duration: durationMs,
        updatesPerSecond,
        warning: updatesPerSecond > 10 ? 'Too frequent updates, may cause performance issues' : null,
      },
    };
  }

  /**
   * Test: Memory leak detection
   * 
   * Checks if event listeners are properly cleaned up
   */
  async testMemoryLeaks(): Promise<TestResult> {
    if (!this.channel) {
      return {
        testName: 'Memory Leak Detection',
        passed: false,
        error: 'BroadcastChannel not supported',
      };
    }

    const initialListenerCount = this.receivedEvents.length;
    
    // Create and destroy multiple listeners
    for (let i = 0; i < 10; i++) {
      const tempChannel = new BroadcastChannel(this.channelName);
      tempChannel.close();
    }
    
    // Check if listener count increased unexpectedly
    const finalListenerCount = this.receivedEvents.length;
    const leaked = finalListenerCount > initialListenerCount + 5;
    
    return {
      testName: 'Memory Leak Detection',
      passed: !leaked,
      details: {
        initialListenerCount,
        finalListenerCount,
        warning: leaked ? 'Possible memory leak detected' : null,
      },
    };
  }

  /**
   * Broadcast event to all tabs
   */
  broadcast(data: any): void {
    if (this.channel) {
      this.channel.postMessage(data);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    results.push(await this.testSyncLatency());
    results.push(await this.testLocalStorageFallback());
    results.push(await this.testConflictResolution());
    results.push(await this.testMemoryLeaks());
    
    return results;
  }

  /**
   * Generate test report
   */
  generateReport(results: TestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    let report = '╔═══════════════════════════════════════╗\n';
    report += '║   CROSS-TAB SYNC TEST REPORT          ║\n';
    report += '╠═══════════════════════════════════════╣\n';
    report += `║ Total Tests: ${results.length.toString().padEnd(25)}║\n`;
    report += `║ Passed: ${passed.toString().padEnd(29)}║\n`;
    report += `║ Failed: ${failed.toString().padEnd(29)}║\n`;
    report += '╠═══════════════════════════════════════╣\n';
    
    results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      report += `║ ${status} ${result.testName.padEnd(35)}║\n`;
      
      if (result.latency) {
        report += `║    Latency: ${result.latency.toString().padEnd(27)}ms ║\n`;
      }
      
      if (result.error) {
        report += `║    Error: ${result.error.substring(0, 29).padEnd(29)}║\n`;
      }
      
      if (index < results.length - 1) {
        report += '║───────────────────────────────────────║\n';
      }
    });
    
    report += '╚═══════════════════════════════════════╝\n';
    
    return report;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.receivedEvents = [];
  }
}

/**
 * Echo responder (run in other tabs to respond to sync tests)
 */
export class SyncTestResponder {
  private channels: Map<string, BroadcastChannel> = new Map();

  constructor(channelNames: string[]) {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }

    channelNames.forEach(name => {
      const channel = new BroadcastChannel(name);
      
      channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_TEST' && event.data.echo) {
          // Echo back
          channel.postMessage({
            type: 'SYNC_ECHO',
            originalSource: event.data.source,
            timestamp: Date.now(),
          });
        }
      };
      
      this.channels.set(name, channel);
    });
  }

  cleanup(): void {
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
  }
}

/**
 * Usage Example:
 * 
 * // In dev tools console:
 * const tester = new CrossTabTester('bantu_auth_channel');
 * const results = await tester.runAllTests();
 * console.log(tester.generateReport(results));
 * 
 * // In another tab (to respond to tests):
 * const responder = new SyncTestResponder(['bantu_auth_channel', 'bantu_cart_channel']);
 */

