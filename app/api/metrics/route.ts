/**
 * API Route: /api/metrics
 * Purpose: Expose Prometheus-compatible metrics for monitoring
 * Access: Public (but should be restricted in production via firewall)
 * 
 * Usage: Configure Prometheus to scrape this endpoint every 15s
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportPrometheusMetrics, getAllMetrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'prometheus';

  try {
    if (format === 'prometheus') {
      // Prometheus format (text/plain)
      return new NextResponse(exportPrometheusMetrics(), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
        },
      });
    } else {
      // JSON format (for admin dashboard)
      const metrics = getAllMetrics();
      return NextResponse.json(metrics);
    }
  } catch (error) {
    console.error('[Metrics API] Error exporting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}

