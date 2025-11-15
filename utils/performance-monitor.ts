/**
 * Performance Monitoring Utility
 * 
 * Tracks and reports performance metrics for premium quality assurance
 */

import React from 'react';

export interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  memoryUsage: number;
  renderTime: number;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  stop(): PerformanceMetrics {
    const endTime = performance.now();
    const renderTime = endTime - this.startTime;

    const metrics: PerformanceMetrics = {
      pageLoad: typeof performance !== 'undefined' && (performance as any).timing 
        ? (performance as any).timing.loadEventEnd - (performance as any).timing.navigationStart 
        : 0,
      firstContentfulPaint: this.getFCP(),
      timeToInteractive: this.getTTI(),
      memoryUsage: this.getMemoryUsage(),
      renderTime,
    };

    this.metrics.push(metrics);
    return metrics;
  }

  private getFCP(): number {
    // Would need PerformanceObserver for accurate FCP
    return 0;
  }

  private getTTI(): number {
    return typeof performance !== 'undefined' && (performance as any).timing
      ? (performance as any).timing.domInteractive - (performance as any).timing.navigationStart
      : 0;
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        pageLoad: 0,
        firstContentfulPaint: 0,
        timeToInteractive: 0,
        memoryUsage: 0,
        renderTime: 0,
      };
    }

    return {
      pageLoad: this.metrics.reduce((sum, m) => sum + m.pageLoad, 0) / this.metrics.length,
      firstContentfulPaint: this.metrics.reduce((sum, m) => sum + m.firstContentfulPaint, 0) / this.metrics.length,
      timeToInteractive: this.metrics.reduce((sum, m) => sum + m.timeToInteractive, 0) / this.metrics.length,
      memoryUsage: this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length,
      renderTime: this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length,
    };
  }

  report(): void {
    const avg = this.getAverageMetrics();
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metrics:', {
        'Page Load': `${avg.pageLoad.toFixed(2)}ms`,
        'First Contentful Paint': `${avg.firstContentfulPaint.toFixed(2)}ms`,
        'Time to Interactive': `${avg.timeToInteractive.toFixed(2)}ms`,
        'Memory Usage': `${(avg.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        'Render Time': `${avg.renderTime.toFixed(2)}ms`,
      });
    }
  }
}

/**
 * React Hook for Performance Monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const monitor = new PerformanceMonitor();
    monitor.start();

    return () => {
      const metrics = monitor.stop();
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, metrics);
      }
    };
  }, [componentName]);
}

