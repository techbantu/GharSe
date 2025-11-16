/**
 * NEW FILE: RED Metrics System (Rate, Errors, Duration)
 * Purpose: Track application health and performance in real-time
 * Pattern: Prometheus-compatible metrics for monitoring
 * 
 * Metrics Tracked:
 * - Request Rate: Requests per second by route
 * - Error Rate: Percentage of failed requests
 * - Duration: p50, p95, p99 latency histograms
 * - Custom business metrics (orders, payments, users)
 * 
 * Usage: Expose via /api/metrics for Prometheus scraping
 */

interface MetricValue {
  count: number;
  sum: number;
  min: number;
  max: number;
  values: number[]; // For histogram calculations
}

interface RouteMetrics {
  requests: Record<string, number>; // By status code
  duration: MetricValue;
  errors: number;
  lastRequest: number;
}

// Global metrics storage
const metrics = {
  routes: new Map<string, RouteMetrics>(),
  system: {
    startTime: Date.now(),
    totalRequests: 0,
    totalErrors: 0,
    totalDuration: 0,
  },
  business: {
    orders: { total: 0, completed: 0, cancelled: 0 },
    payments: { total: 0, successful: 0, failed: 0 },
    users: { total: 0, active: 0 },
  },
};

/**
 * Get or create route metrics
 */
function getRouteMetrics(route: string): RouteMetrics {
  if (!metrics.routes.has(route)) {
    metrics.routes.set(route, {
      requests: {},
      duration: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: 0,
        values: [],
      },
      errors: 0,
      lastRequest: Date.now(),
    });
  }
  return metrics.routes.get(route)!;
}

/**
 * Record HTTP request metrics
 * 
 * Usage:
 * ```typescript
 * import { recordRequest } from '@/lib/metrics';
 * 
 * const startTime = Date.now();
 * // ... handle request
 * const duration = Date.now() - startTime;
 * recordRequest('/api/orders', 'POST', 200, duration);
 * ```
 */
export function recordRequest(
  route: string,
  method: string,
  statusCode: number,
  duration: number
): void {
  const routeKey = `${method} ${route}`;
  const routeMetrics = getRouteMetrics(routeKey);

  // Update request count by status
  const statusKey = statusCode.toString();
  routeMetrics.requests[statusKey] = (routeMetrics.requests[statusKey] || 0) + 1;

  // Update duration metrics
  routeMetrics.duration.count++;
  routeMetrics.duration.sum += duration;
  routeMetrics.duration.min = Math.min(routeMetrics.duration.min, duration);
  routeMetrics.duration.max = Math.max(routeMetrics.duration.max, duration);
  
  // Store value for histogram (keep last 1000 values)
  routeMetrics.duration.values.push(duration);
  if (routeMetrics.duration.values.length > 1000) {
    routeMetrics.duration.values.shift();
  }

  // Update error count
  if (statusCode >= 400) {
    routeMetrics.errors++;
    metrics.system.totalErrors++;
  }

  routeMetrics.lastRequest = Date.now();

  // Update system totals
  metrics.system.totalRequests++;
  metrics.system.totalDuration += duration;
}

/**
 * Calculate percentile from histogram
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get metrics for a specific route
 */
export function getRouteMetric(route: string, method: string) {
  const routeKey = `${method} ${route}`;
  const routeMetrics = metrics.routes.get(routeKey);
  
  if (!routeMetrics) {
    return null;
  }

  const totalRequests = Object.values(routeMetrics.requests).reduce((sum, count) => sum + count, 0);
  const errorRate = totalRequests > 0 ? (routeMetrics.errors / totalRequests) * 100 : 0;

  return {
    requests: routeMetrics.requests,
    totalRequests,
    errors: routeMetrics.errors,
    errorRate: Number(errorRate.toFixed(2)),
    duration: {
      avg: routeMetrics.duration.count > 0 
        ? routeMetrics.duration.sum / routeMetrics.duration.count 
        : 0,
      min: routeMetrics.duration.min === Infinity ? 0 : routeMetrics.duration.min,
      max: routeMetrics.duration.max,
      p50: calculatePercentile(routeMetrics.duration.values, 50),
      p95: calculatePercentile(routeMetrics.duration.values, 95),
      p99: calculatePercentile(routeMetrics.duration.values, 99),
    },
    lastRequest: routeMetrics.lastRequest,
  };
}

/**
 * Get all metrics (for admin dashboard)
 */
export function getAllMetrics() {
  const routes: Record<string, any> = {};
  
  for (const [routeKey, routeMetrics] of metrics.routes.entries()) {
    const totalRequests = Object.values(routeMetrics.requests).reduce((sum, count) => sum + count, 0);
    const errorRate = totalRequests > 0 ? (routeMetrics.errors / totalRequests) * 100 : 0;

    routes[routeKey] = {
      requests: routeMetrics.requests,
      totalRequests,
      errors: routeMetrics.errors,
      errorRate: Number(errorRate.toFixed(2)),
      duration: {
        avg: routeMetrics.duration.count > 0 
          ? Number((routeMetrics.duration.sum / routeMetrics.duration.count).toFixed(2))
          : 0,
        min: routeMetrics.duration.min === Infinity ? 0 : routeMetrics.duration.min,
        max: routeMetrics.duration.max,
        p50: calculatePercentile(routeMetrics.duration.values, 50),
        p95: calculatePercentile(routeMetrics.duration.values, 95),
        p99: calculatePercentile(routeMetrics.duration.values, 99),
      },
      lastRequest: routeMetrics.lastRequest,
    };
  }

  const uptime = Date.now() - metrics.system.startTime;
  const avgDuration = metrics.system.totalRequests > 0
    ? metrics.system.totalDuration / metrics.system.totalRequests
    : 0;
  const errorRate = metrics.system.totalRequests > 0
    ? (metrics.system.totalErrors / metrics.system.totalRequests) * 100
    : 0;

  return {
    system: {
      uptime,
      uptimeFormatted: formatUptime(uptime),
      totalRequests: metrics.system.totalRequests,
      totalErrors: metrics.system.totalErrors,
      errorRate: Number(errorRate.toFixed(2)),
      avgDuration: Number(avgDuration.toFixed(2)),
    },
    business: metrics.business,
    routes,
  };
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Export metrics in Prometheus format
 * 
 * Usage in /api/metrics endpoint
 */
export function exportPrometheusMetrics(): string {
  const lines: string[] = [];

  // System metrics
  lines.push('# HELP http_requests_total Total HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total ${metrics.system.totalRequests}`);

  lines.push('# HELP http_errors_total Total HTTP errors (4xx + 5xx)');
  lines.push('# TYPE http_errors_total counter');
  lines.push(`http_errors_total ${metrics.system.totalErrors}`);

  // Per-route metrics
  for (const [routeKey, routeMetrics] of metrics.routes.entries()) {
    const [method, route] = routeKey.split(' ', 2);
    
    // Request count by status
    for (const [status, count] of Object.entries(routeMetrics.requests)) {
      lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`);
    }

    // Duration metrics
    const avg = routeMetrics.duration.count > 0 
      ? routeMetrics.duration.sum / routeMetrics.duration.count 
      : 0;
    
    lines.push(`http_request_duration_ms{method="${method}",route="${route}",quantile="0.5"} ${calculatePercentile(routeMetrics.duration.values, 50)}`);
    lines.push(`http_request_duration_ms{method="${method}",route="${route}",quantile="0.95"} ${calculatePercentile(routeMetrics.duration.values, 95)}`);
    lines.push(`http_request_duration_ms{method="${method}",route="${route}",quantile="0.99"} ${calculatePercentile(routeMetrics.duration.values, 99)}`);
  }

  // Business metrics
  lines.push('# HELP orders_total Total orders');
  lines.push('# TYPE orders_total counter');
  lines.push(`orders_total ${metrics.business.orders.total}`);
  
  lines.push('# HELP payments_total Total payments');
  lines.push('# TYPE payments_total counter');
  lines.push(`payments_total ${metrics.business.payments.total}`);

  return lines.join('\n');
}

/**
 * Record business metrics
 */
export function recordOrderMetric(status: 'completed' | 'cancelled'): void {
  metrics.business.orders.total++;
  if (status === 'completed') {
    metrics.business.orders.completed++;
  } else {
    metrics.business.orders.cancelled++;
  }
}

export function recordPaymentMetric(status: 'successful' | 'failed'): void {
  metrics.business.payments.total++;
  if (status === 'successful') {
    metrics.business.payments.successful++;
  } else {
    metrics.business.payments.failed++;
  }
}

export function recordUserMetric(type: 'registered' | 'active'): void {
  if (type === 'registered') {
    metrics.business.users.total++;
  } else {
    metrics.business.users.active++;
  }
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
  metrics.routes.clear();
  metrics.system = {
    startTime: Date.now(),
    totalRequests: 0,
    totalErrors: 0,
    totalDuration: 0,
  };
  metrics.business = {
    orders: { total: 0, completed: 0, cancelled: 0 },
    payments: { total: 0, successful: 0, failed: 0 },
    users: { total: 0, active: 0 },
  };
}

/**
 * Middleware wrapper for automatic metrics tracking
 * 
 * Usage:
 * ```typescript
 * import { withMetrics } from '@/lib/metrics';
 * 
 * export async function POST(request: NextRequest) {
 *   return withMetrics(request, async (req) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   });
 * }
 * ```
 */
export async function withMetrics(
  request: Request,
  handler: (request: Request) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url);
  const route = url.pathname;
  const method = request.method;
  const startTime = Date.now();

  try {
    const response = await handler(request);
    const duration = Date.now() - startTime;
    
    recordRequest(route, method, response.status, duration);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordRequest(route, method, 500, duration);
    throw error;
  }
}

