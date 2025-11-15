/**
 * Prisma Client Singleton with Accelerate Support
 * 
 * Purpose: Creates a single Prisma client instance to prevent connection exhaustion
 * Pattern: Singleton with hot-reload support for development
 * 
 * Supports:
 * - Prisma Postgres with Accelerate (prisma+postgres://...)
 * - Regular PostgreSQL (postgresql://...)
 * - SQLite (file:...)
 */

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detect if using Prisma Accelerate
const databaseUrl = process.env.DATABASE_URL || '';
const useAccelerate = databaseUrl.startsWith('prisma+postgres://');

// Create Prisma Client
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Add Accelerate extension if using Prisma Postgres
  if (useAccelerate) {
    console.log('🚀 Prisma Accelerate enabled (caching + connection pooling)');
    return client.$extends(withAccelerate());
  }

  return client;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

