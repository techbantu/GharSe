/**
 * UPDATED FILE: Result Type Utilities - Erlang-Style Error Handling
 * 
 * Purpose: Provides Result<T, E> pattern for operations that can fail.
 * Forces error handling at compile time, prevents silent failures.
 * 
 * Philosophy: Inspired by Rust's Result and Erlang's "let it crash" approach.
 * Every function that can fail returns Result<T, E> instead of throwing.
 * 
 * Design:
 * - Ok<T> represents success with value
 * - Err<E> represents failure with error
 * - Type-safe: caller MUST handle both cases
 * - No exceptions: all errors are explicit
 */

/**
 * Result Type - Either success (Ok) or failure (Err)
 * 
 * Usage:
 * ```ts
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) return Err(new Error('Division by zero'));
 *   return Ok(a / b);
 * }
 * 
 * const result = divide(10, 2);
 * if (result.isErr()) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.value); // 5
 * }
 * ```
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Ok - Success variant
 * 
 * Contains the successful value and provides methods for safe access.
 */
class OkImpl<T> {
  readonly success = true as const;
  
  constructor(public readonly value: T) {}
  
  /**
   * Check if result is Ok
   */
  isOk(): this is Ok<T> {
    return true;
  }
  
  /**
   * Check if result is Err
   */
  isErr(): this is never {
    return false;
  }
  
  /**
   * Map the value if Ok, otherwise return Err unchanged
   */
  map<U>(fn: (value: T) => U): Result<U, never> {
    return Ok(fn(this.value)) as Result<U, never>;
  }
  
  /**
   * Map the error if Err, otherwise return Ok unchanged
   */
  mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }
  
  /**
   * Chain another Result-returning operation
   */
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }
  
  /**
   * Get value or throw (use only if absolutely certain)
   */
  unwrap(): T {
    return this.value;
  }
  
  /**
   * Get value or return default
   */
  unwrapOr<U>(_defaultValue: U): T {
    return this.value;
  }
}

/**
 * Err - Failure variant
 * 
 * Contains the error and provides methods for safe error handling.
 */
class ErrImpl<E> {
  readonly success = false as const;
  
  constructor(public readonly error: E) {}
  
  /**
   * Check if result is Ok
   */
  isOk(): this is never {
    return false;
  }
  
  /**
   * Check if result is Err
   */
  isErr(): this is Err<E> {
    return true;
  }
  
  /**
   * Map the value if Ok, otherwise return Err unchanged
   */
  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }
  
  /**
   * Map the error if Err, otherwise return Ok unchanged
   */
  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return Err(fn(this.error)) as Result<never, F>;
  }
  
  /**
   * Chain another Result-returning operation
   */
  andThen<U, F>(_fn: (value: never) => Result<U, F>): Result<U, F> {
    return this as unknown as Result<U, F>;
  }
  
  /**
   * Get value or throw (use only if absolutely certain)
   */
  unwrap(): never {
    throw new Error(`Called unwrap() on Err: ${this.error}`);
  }
  
  /**
   * Get value or return default
   */
  unwrapOr<U>(defaultValue: U): U {
    return defaultValue;
  }
}

// Type aliases for external use
export type Ok<T> = OkImpl<T>;
export type Err<E> = ErrImpl<E>;

/**
 * Create Ok result
 */
export function Ok<T>(value: T): OkImpl<T> {
  return new OkImpl(value);
}

/**
 * Create Err result
 */
export function Err<E>(error: E): ErrImpl<E> {
  return new ErrImpl(error);
}

/**
 * Custom Error Types for Application
 * 
 * These provide semantic meaning beyond generic Error.
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly resource?: string,
    public readonly code = 'NOT_FOUND'
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    public readonly code = 'RATE_LIMIT_EXCEEDED'
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs?: number,
    public readonly code = 'TIMEOUT'
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly code = 'NETWORK_ERROR'
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code = 'SERVER_ERROR'
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

export class RetriableError extends Error {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    public readonly code = 'RETRIABLE_ERROR'
  ) {
    super(message);
    this.name = 'RetriableError';
  }
}

export class PermanentError extends Error {
  constructor(
    message: string,
    public readonly code = 'PERMANENT_ERROR'
  ) {
    super(message);
    this.name = 'PermanentError';
  }
}

export type AppError =
  | ValidationError
  | NotFoundError
  | RateLimitError
  | TimeoutError
  | NetworkError
  | ServerError
  | RetriableError
  | PermanentError;

/**
 * Type guard: Check if error is retriable
 */
export function isRetriableError(error: unknown): error is RetriableError | TimeoutError | NetworkError {
  if (!(error instanceof Error)) return false;
  
  return (
    error instanceof RetriableError ||
    error instanceof TimeoutError ||
    error instanceof NetworkError ||
    (error instanceof ServerError && error.statusCode !== undefined && error.statusCode >= 500)
  );
}

/**
 * Type guard: Check if error is a known AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof RateLimitError ||
    error instanceof TimeoutError ||
    error instanceof NetworkError ||
    error instanceof ServerError ||
    error instanceof RetriableError ||
    error instanceof PermanentError
  );
}

