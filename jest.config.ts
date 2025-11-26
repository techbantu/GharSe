/**
 * Jest Configuration for Next.js
 * 
 * Comprehensive testing setup with:
 * - TypeScript support
 * - React Testing Library
 * - Memory leak detection
 * - Coverage reporting
 */

import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Base config that nextJest will transform
const baseConfig: Config = {
  // Multi-project setup: Separate browser and Node.js test environments
  projects: [
    // Browser/React tests (jsdom environment)
    {
      displayName: 'browser',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: [
        '**/__tests__/**/*.tsx',
        '**/__tests__/context/**/*.ts',
        '**/__tests__/memory-leaks.test.tsx',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/e2e/',
      ],
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
    // Node.js/API tests (node environment for Prisma)
    {
      displayName: 'node',
      testEnvironment: 'node',
      preset: 'ts-jest', // Explicit TypeScript transformation for Node.js tests
      setupFilesAfterEnv: ['<rootDir>/jest.setup.node.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/api/**/*.ts',
        '**/__tests__/integration/**/*.ts',
        '**/__tests__/security/**/*.ts',
        '**/__tests__/concurrency/**/*.ts',
        '!**/__tests__/**/*.tsx',
        '!**/__tests__/context/**/*.ts',
        '!**/__tests__/memory-leaks.test.tsx',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/e2e/',
      ],
      transformIgnorePatterns: [
        '/node_modules/',
      ],
      // TypeScript transformation config
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
          },
        }],
      },
    },
  ],
  
  // Shared coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'context/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  
  // Coverage thresholds (premium quality standards)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Test timeout (for memory leak tests) - root level only
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset modules between tests (prevents state leakage)
  resetModules: true,
};

// Apply nextJest transformation to the config
const finalConfig = createJestConfig(baseConfig);
export default finalConfig;

