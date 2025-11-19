/**
 * Jest Setup File
 * 
 * Global test configuration and utilities
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from '@jest/globals';

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Clear all mocks
  jest.clearAllMocks();
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Memory leak detection helper
export const detectMemoryLeaks = () => {
  if (typeof performance !== 'undefined' && performance.memory) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock Next.js Request/Response
global.Request = class Request {
  constructor(public url: string, public init?: any) {}
  headers = new Headers();
  async json() {
    return {};
  }
  async text() {
    return '';
  }
} as any;

global.Response = class Response {
  constructor(public body?: any, public init?: any) {}
  status = 200;
  statusText = 'OK';
  headers = new Headers();
  static json(data: any, init?: any) {
    return new Response(JSON.stringify(data), init);
  }
  async json() {
    return JSON.parse(this.body || '{}');
  }
  async text() {
    return this.body || '';
  }
} as any;

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => {
      const response = new Response(JSON.stringify(data), init);
      response.status = init?.status || 200;
      return response;
    },
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock fetch globally for all tests
global.fetch = jest.fn((url) => {
  // Default mock response for auth check
  if (url.includes('/api/auth/me')) {
    return Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ success: false }),
    } as Response);
  }
  
  // Default mock response for menu items
  if (url.includes('/api/menu')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, items: [] }),
    } as Response);
  }
  
  // Default fallback
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
  } as Response);
}) as jest.Mock;

// Suppress console errors in tests (optional)
// Uncomment if you want to suppress console errors during tests
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };

