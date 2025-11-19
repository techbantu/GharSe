/**
 * NEW FILE: Order Status Poller Hook
 * 
 * Purpose: Poll order status during grace period to detect backend changes
 * (cancellation, finalization, etc.) and keep frontend in sync.
 * 
 * Features:
 * - Auto-start/stop based on enabled flag
 * - Exponential backoff on errors (3s → 6s → 12s max)
 * - Cleanup on unmount
 * - Stops polling when order reaches terminal status
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Order } from '@/types';

interface UseOrderStatusPollerOptions {
  orderId: string | null;
  enabled: boolean;
  onStatusChange?: (order: Order) => void;
  interval?: number; // Default 3000ms
}

/**
 * Terminal statuses that should stop polling
 */
const TERMINAL_STATUSES = [
  'CANCELLED',
  'DELIVERED',
  'COMPLETED',
] as const;

/**
 * Hook to poll order status during grace period
 * 
 * @param orderId - Order ID to poll
 * @param enabled - Whether polling is enabled
 * @param onStatusChange - Callback when order data changes
 * @param interval - Poll interval in ms (default 3000)
 */
export function useOrderStatusPoller({
  orderId,
  enabled,
  onStatusChange,
  interval = 3000,
}: UseOrderStatusPollerOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const errorCountRef = useRef(0);
  const currentIntervalRef = useRef(interval);

  const pollOrderStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      console.log('[OrderStatusPoller] Polling order:', orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.order) {
        const newStatus = data.order.status;

        // Only trigger callback if status changed
        if (newStatus !== lastStatusRef.current) {
          console.log('[OrderStatusPoller] Status changed:', {
            from: lastStatusRef.current,
            to: newStatus,
          });
          
          lastStatusRef.current = newStatus;
          
          if (onStatusChange) {
            onStatusChange(data.order);
          }
        }

        // Stop polling if terminal status reached
        if (TERMINAL_STATUSES.includes(newStatus as any)) {
          console.log('[OrderStatusPoller] Terminal status reached, stopping polling');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }

        // Reset error count on success
        errorCountRef.current = 0;
        currentIntervalRef.current = interval;
      }
    } catch (error) {
      console.error('[OrderStatusPoller] Error polling order:', error);
      
      // Exponential backoff: 3s → 6s → 12s (max)
      errorCountRef.current++;
      const backoffMultiplier = Math.min(errorCountRef.current, 4);
      currentIntervalRef.current = interval * backoffMultiplier;
      
      console.log('[OrderStatusPoller] Backoff to', currentIntervalRef.current, 'ms');
      
      // Restart interval with new backoff time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(pollOrderStatus, currentIntervalRef.current);
      }
    }
  }, [orderId, interval, onStatusChange]);

  useEffect(() => {
    if (!enabled || !orderId) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[OrderStatusPoller] Starting polling for order:', orderId);

    // Initial poll
    pollOrderStatus();

    // Set up interval
    intervalRef.current = setInterval(pollOrderStatus, currentIntervalRef.current);

    // Cleanup
    return () => {
      console.log('[OrderStatusPoller] Stopping polling');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, orderId, pollOrderStatus]);

  return {
    isPolling: intervalRef.current !== null,
  };
}
