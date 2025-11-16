/**
 * API Route: /api/ready
 * Purpose: Deep health check (are all dependencies ready?)
 * Access: Public
 * 
 * Returns 200 if all systems operational, 503 if any dependency fails
 * Used by load balancers to determine if instance should receive traffic
 * 
 * Checks:
 * - Database connection
 * - Redis connection (if used)
 * - Essential services availability
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
}

export async function GET() {
  const checks: HealthCheck[] = [];
  let overallHealthy = true;

  // Check 1: Database connectivity
  const dbCheck = await checkDatabase();
  checks.push(dbCheck);
  if (dbCheck.status !== 'healthy') overallHealthy = false;

  // Check 2: Application logic (can query critical tables)
  const queryCheck = await checkCriticalQueries();
  checks.push(queryCheck);
  if (queryCheck.status !== 'healthy') overallHealthy = false;

  // Check 3: Memory usage
  const memoryCheck = checkMemory();
  checks.push(memoryCheck);
  if (memoryCheck.status === 'unhealthy') overallHealthy = false;

  const response = {
    status: overallHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(
    response,
    { status: overallHealthy ? 200 : 503 }
  );
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - start;
    
    return {
      name: 'database',
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check critical queries (ensure schema is intact)
 */
async function checkCriticalQueries(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Try to query critical tables (should be fast)
    await Promise.all([
      prisma.order.findFirst({ select: { id: true } }),
      prisma.customer.findFirst({ select: { id: true } }),
      prisma.admin.findFirst({ select: { id: true } }),
    ]);
    
    const latency = Date.now() - start;
    
    return {
      name: 'critical_queries',
      status: latency < 500 ? 'healthy' : 'degraded',
      latency,
    };
  } catch (error) {
    return {
      name: 'critical_queries',
      status: 'unhealthy',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const memory = process.memoryUsage();
  const heapUsedMB = memory.heapUsed / 1024 / 1024;
  const heapTotalMB = memory.heapTotal / 1024 / 1024;
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (usagePercent > 90) {
    status = 'unhealthy';
  } else if (usagePercent > 75) {
    status = 'degraded';
  }

  return {
    name: 'memory',
    status,
    latency: Math.round(usagePercent),
    error: status !== 'healthy' ? `Memory usage at ${Math.round(usagePercent)}%` : undefined,
  };
}

