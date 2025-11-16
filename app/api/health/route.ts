/**
 * API Route: /api/health
 * Purpose: Basic process health check (is the server running?)
 * Access: Public
 * 
 * Returns 200 if process is alive, used by load balancers
 * 
 * Usage: Configure load balancer to ping this endpoint every 5s
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  return NextResponse.json({
    status: 'healthy',
    uptime: Math.floor(uptime),
    uptimeFormatted: formatUptime(uptime * 1000),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
    },
    pid: process.pid,
    nodeVersion: process.version,
  });
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

