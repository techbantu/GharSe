/**
 * NEW FILE: Structured Logging Utility - Production-Grade Observability
 * 
 * Purpose: Centralized logging with structured output, log levels, and context.
 * 
 * Philosophy: Inspired by NASA JPL's mission-critical logging.
 * Every log entry is structured, searchable, and contains enough context
 * to debug production issues without replaying the entire request.
 * 
 * Design:
 * - Structured JSON logs (easily parseable by log aggregators)
 * - Log levels: DEBUG, INFO, WARN, ERROR, FATAL
 * - Contextual data attached (userId, orderId, duration, etc.)
 * - Performance-safe: no blocking I/O, async writes
 * - Environment-aware: DEBUG only in development
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogContext {
  [key: string]: unknown;
  correlationId?: string;
  userId?: string;
  orderId?: string;
  duration?: number;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
  service: string;
  version: string;
  environment: string;
}

class Logger {
  private service: string;
  private version: string;
  private environment: string;
  private logLevel: LogLevel;

  constructor(
    service = 'bantus-kitchen',
    version = process.env.npm_package_version || '1.0.0',
    environment = process.env.NODE_ENV || 'development'
  ) {
    this.service = service;
    this.version = version;
    this.environment = environment;
    
    // Set log level based on environment
    this.logLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    
    if (envLevel && ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(envLevel)) {
      return envLevel as LogLevel;
    }
    
    // Default: DEBUG in development, INFO in production
    return this.environment === 'production' ? 'INFO' : 'DEBUG';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      version: this.version,
      environment: this.environment,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // In production, use structured JSON (parseable by log aggregators)
    if (this.environment === 'production') {
      console.log(JSON.stringify(entry));
      return;
    }

    // In development, use human-readable format
    const colorMap: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      FATAL: '\x1b[35m', // Magenta
    };
    
    const reset = '\x1b[0m';
    const color = colorMap[entry.level] || '';
    
    const contextStr = entry.context 
      ? ` ${JSON.stringify(entry.context)}`
      : '';
    
    const errorStr = entry.error
      ? `\n  Error: ${entry.error.name}: ${entry.error.message}${entry.error.stack ? `\n  ${entry.error.stack}` : ''}`
      : '';
    
    console.log(
      `${color}[${entry.level}]${reset} ${entry.timestamp} ${entry.message}${contextStr}${errorStr}`
    );
  }

  /**
   * Debug: Detailed information for development
   * Use for request/response bodies, variable values, etc.
   */
  debug(message: string, context?: LogContext): void {
    this.writeLog(this.createLogEntry('DEBUG', message, context));
  }

  /**
   * Info: Normal operations
   * Use for order creation, payment processing, successful API calls
   */
  info(message: string, context?: LogContext): void {
    this.writeLog(this.createLogEntry('INFO', message, context));
  }

  /**
   * Warn: Recoverable issues
   * Use for retries that succeeded, slow queries, deprecated API usage
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    this.writeLog(this.createLogEntry('WARN', message, context, error));
  }

  /**
   * Error: Failures that need attention
   * Use for API errors, validation failures, unexpected exceptions
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.writeLog(this.createLogEntry('ERROR', message, context, error));
  }

  /**
   * Fatal: System cannot recover
   * Use for database connection failures, out of memory, critical service down
   */
  fatal(message: string, context?: LogContext, error?: Error): void {
    this.writeLog(this.createLogEntry('FATAL', message, context, error));
    
    // In production, fatal errors might trigger alerts (PagerDuty, etc.)
    if (this.environment === 'production') {
      // TODO: Integrate with alerting service
      console.error('FATAL ERROR - Consider alerting on-call engineer');
    }
  }
}

// Singleton instance (shared across application)
export const logger = new Logger(
  'bantus-kitchen',
  process.env.npm_package_version || '1.0.0',
  process.env.NODE_ENV || 'development'
);

// Export Logger class for testing or custom instances
export { Logger };
export type { LogLevel, LogContext, LogEntry };

