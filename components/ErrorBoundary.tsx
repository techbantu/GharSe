/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REACT ERROR BOUNDARY COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Catch JavaScript errors in React component tree and prevent app crashes
 *
 * Features:
 * - Graceful error handling with user-friendly UI
 * - Error logging to monitoring service
 * - Automatic error recovery
 * - Development vs production error messages
 * - Error boundary reset functionality
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * @module components/ErrorBoundary
 * @author GharSe Engineering Team
 * @version 2.0.0
 * @since 2025-11-15
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>; // Reset boundary when these keys change
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * Catches errors in child component tree and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  /**
   * Update state when error is caught
   * Called during render phase
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details after error is caught
   * Called during commit phase - safe to use side effects
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Increment error count
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log error to monitoring service
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, also console.error for easier debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  /**
   * Reset error boundary when resetKeys change
   * Allows automatic recovery when user navigates or props change
   */
  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;

    // Reset if resetKeys changed
    if (
      resetKeys &&
      prevProps.resetKeys &&
      !this.areArraysEqual(resetKeys, prevProps.resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  /**
   * Check if two arrays are equal (shallow comparison)
   */
  private areArraysEqual(a: Array<any>, b: Array<any>): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Reset error boundary manually
   * Useful for "Try Again" buttons
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      // Don't reset errorCount - keep it for monitoring
    });
  };

  /**
   * Render method
   * Shows fallback UI when error occurred, otherwise renders children
   */
  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorCount={errorCount}
          onReset={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

/**
 * Default Error Fallback UI Component
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  onReset: () => void;
}

function DefaultErrorFallback({ error, errorInfo, errorCount, onReset }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#FEF2F2',
        border: '2px solid #FCA5A5',
        borderRadius: '12px',
        margin: '20px',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {/* Error Icon */}
      <div
        style={{
          fontSize: '64px',
          marginBottom: '20px',
        }}
      >
        ⚠️
      </div>

      {/* Error Title */}
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#991B1B',
          marginBottom: '12px',
        }}
      >
        Oops! Something went wrong
      </h2>

      {/* Error Message */}
      <p
        style={{
          fontSize: '16px',
          color: '#7F1D1D',
          marginBottom: '24px',
          lineHeight: '1.5',
        }}
      >
        {isDevelopment && error
          ? `Error: ${error.message}`
          : "We're experiencing a technical issue. Our team has been notified."}
      </p>

      {/* Error Count Warning (if multiple errors) */}
      {errorCount > 1 && (
        <p
          style={{
            fontSize: '14px',
            color: '#B91C1C',
            marginBottom: '16px',
            fontWeight: '500',
          }}
        >
          ⚠️ This error has occurred {errorCount} times. You may need to refresh the page.
        </p>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        {/* Try Again Button */}
        <button
          onClick={onReset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B91C1C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#DC2626';
          }}
        >
          Try Again
        </button>

        {/* Refresh Page Button */}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#DC2626',
            border: '2px solid #DC2626',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          Refresh Page
        </button>

        {/* Go Home Button */}
        <button
          onClick={() => (window.location.href = '/')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#DC2626',
            border: '2px solid #DC2626',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          Go Home
        </button>
      </div>

      {/* Development Error Details */}
      {isDevelopment && (error || errorInfo) && (
        <details
          style={{
            textAlign: 'left',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            border: '1px solid #FCA5A5',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: '600',
              color: '#991B1B',
              marginBottom: '12px',
            }}
          >
            🔍 Error Details (Development Only)
          </summary>

          {error && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#991B1B' }}>Error Message:</strong>
              <pre
                style={{
                  backgroundColor: '#FEF2F2',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '14px',
                  marginTop: '8px',
                }}
              >
                {error.message}
              </pre>
            </div>
          )}

          {error?.stack && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#991B1B' }}>Stack Trace:</strong>
              <pre
                style={{
                  backgroundColor: '#FEF2F2',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '8px',
                  maxHeight: '200px',
                }}
              >
                {error.stack}
              </pre>
            </div>
          )}

          {errorInfo?.componentStack && (
            <div>
              <strong style={{ color: '#991B1B' }}>Component Stack:</strong>
              <pre
                style={{
                  backgroundColor: '#FEF2F2',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px',
                  marginTop: '8px',
                  maxHeight: '200px',
                }}
              >
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </details>
      )}

      {/* Help Text */}
      <p
        style={{
          fontSize: '14px',
          color: '#7F1D1D',
          marginTop: '24px',
          fontStyle: 'italic',
        }}
      >
        If this problem persists, please contact our support team at support@gharse.com
      </p>
    </div>
  );
}

/**
 * Custom hook to use error boundary programmatically
 * Throws error to nearest error boundary
 *
 * Usage:
 * ```tsx
 * const throwError = useErrorBoundary();
 * throwError(new Error('Something went wrong!'));
 * ```
 */
export function useErrorBoundary() {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

/**
 * Export default
 */
export default ErrorBoundary;
