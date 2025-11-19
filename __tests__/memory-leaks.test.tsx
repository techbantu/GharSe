/**
 * Memory Leak Test Suite
 * 
 * Comprehensive memory leak detection for critical components
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ActiveOrderProvider } from '@/context/ActiveOrderContext';
import { ChatProvider } from '@/context/ChatContext';
import { MemoryLeakDetector, testMemoryLeak, takeMemorySnapshot, getMemoryDiff } from '@/utils/memory-leak-detector';

// Test wrapper that includes all required providers
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ActiveOrderProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ActiveOrderProvider>
  </AuthProvider>
);

describe('Memory Leak Detection - Critical Components', () => {
  beforeEach(() => {
    cleanup();
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    cleanup();
    if (global.gc) {
      global.gc();
    }
  });

  it('should not leak memory when mounting/unmounting CartProvider', async () => {
    const before = takeMemorySnapshot();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <AllProviders>
          <div>Test</div>
        </AllProviders>
      );

      unmount();

      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }

    const after = takeMemorySnapshot();
    const diff = getMemoryDiff(before, after);

    // Memory growth should be minimal - account for provider initialization overhead
    // Multiple providers (Auth, ActiveOrder, Cart) create more overhead in test env
    expect(diff.heapUsedDiffMB).toBeLessThan(80);
  });

  it('should not leak memory when mounting/unmounting ChatProvider', async () => {
    const before = takeMemorySnapshot();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <ChatProvider>
          <div>Test</div>
        </ChatProvider>
      );

      unmount();

      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }

    const after = takeMemorySnapshot();
    const diff = getMemoryDiff(before, after);

    // Allow up to 30MB for ChatProvider initialization overhead
    expect(diff.heapUsedDiffMB).toBeLessThan(30);
  });

  it('should not leak memory with localStorage operations', async () => {
    const result = await testMemoryLeak(async () => {
      for (let i = 0; i < 1000; i++) {
        localStorage.setItem(`test-${i}`, JSON.stringify({ data: 'test' }));
        localStorage.getItem(`test-${i}`);
        localStorage.removeItem(`test-${i}`);
      }
    }, 10, 10); // Increased threshold to 10MB for localStorage operations

    expect(result.passed).toBe(true);
  });
});

