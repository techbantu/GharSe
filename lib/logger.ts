/**
 * NEW FILE: Structured Logging System
 * Purpose: Production-grade logging with context, search, and alerting
 * Pattern: Replace console.log with searchable JSON logs
 * 
 * Features:
 * - JSON format (searchable in log aggregators)
 * - Request ID tracking (trace requests across services)
 * - User context (who did what)
 * - Log levels (debug, info, warn, error, fatal)
 * - Automatic error serialization
 * - Performance timing
 * 
 * Based on: Pino (high-performance Node.js logger)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// Current log level (configurable via environment)
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

/**
 * Format log entry as JSON
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Serialize error object
 */
function serializeError(error: Error): LogEntry['error'] {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: (error as any).code,
  };
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    context: {
      service: 'bantus-kitchen',
      environment: process.env.NODE_ENV || 'development',
      ...context,
    },
  };

  if (error) {
    entry.error = serializeError(error);
  }

  const formatted = formatLog(entry);

  // Output to console (production log collectors will capture this)
  if (level === 'error' || level === 'fatal') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Logger class with context preservation
 * 
 * Usage:
 * ```typescript
 * import { createLogger } from '@/lib/logger';
 * 
 * const logger = createLogger({ requestId: req.id, userId: user.id });
 * logger.info('User logged in', { method: 'email' });
 * logger.error('Database query failed', { query: sql }, error);
 * ```
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    log('debug', message, { ...this.context, ...context });
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    log('info', message, { ...this.context, ...context });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    log('warn', message, { ...this.context, ...context });
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    log('error', message, { ...this.context, ...context }, error);
  }

  /**
   * Log fatal error (system failure)
   */
  fatal(message: string, context?: LogContext, error?: Error): void {
    log('fatal', message, { ...this.context, ...context }, error);
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`${label} started`);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, { duration }, error as Error);
      throw error;
    }
  }
}

/**
 * Create logger with context
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

/**
 * Default logger (no context)
 */
export const logger = createLogger();

/**
 * Create logger from Next.js request
 * 
 * Usage:
 * ```typescript
 * import { createRequestLogger } from '@/lib/logger';
 * 
 * export async function GET(request: NextRequest) {
 *   const logger = createRequestLogger(request);
 *   logger.info('Processing GET request');
 *   // ... your logic
 * }
 * ```
 */
export function createRequestLogger(request: Request): Logger {
  const url = new URL(request.url);
  
  return createLogger({
    requestId: crypto.randomUUID(),
    method: request.method,
    url: url.pathname,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });
}

/**
 * Middleware wrapper for automatic request logging
 * 
 * Usage:
 * ```typescript
 * import { withLogging } from '@/lib/logger';
 * 
 * export async function POST(request: NextRequest) {
 *   return withLogging(request, async (req, logger) => {
 *     logger.info('Creating order');
 *     const order = await createOrder(data);
 *     return NextResponse.json({ success: true, order });
 *   });
 * }
 * ```
 */
export async function withLogging(
  request: Request,
  handler: (request: Request, logger: Logger) => Promise<Response>
): Promise<Response> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  try {
    logger.info('Request started');
    
    const response = await handler(request, logger);
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      statusCode: response.status,
      duration,
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Request failed', { duration }, error as Error);
    
    // Re-throw to let error boundary handle it
    throw error;
  }
}

/**
 * Parse structured log (for testing/debugging)
 */
export function parseLog(logLine: string): LogEntry | null {
  try {
    return JSON.parse(logLine) as LogEntry;
  } catch {
    return null;
  }
}

/**
 * Log metrics (for admin dashboard)
 */
interface LogMetrics {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  errorRate: number;
  avgDuration: number;
}

let metrics: LogMetrics = {
  totalLogs: 0,
  byLevel: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
  errorRate: 0,
  avgDuration: 0,
};

/**
 * Get log metrics
 */
export function getLogMetrics(): LogMetrics {
  return { ...metrics };
}

/**
 * Reset log metrics (for testing)
 */
export function resetLogMetrics(): void {
  metrics = {
    totalLogs: 0,
    byLevel: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
    errorRate: 0,
    avgDuration: 0,
  };
}
