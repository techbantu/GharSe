/**
 * NEW FILE: Active Order Context - Track Grace Period Order State
 * 
 * Purpose: Manages the state of an active order during grace period.
 * When a user has a pending order they can modify, this context stores
 * that order ID globally so menu additions can be routed to order modification
 * instead of regular cart.
 * 
 * Architecture: Provides a bridge between regular menu browsing (CartContext)
 * and order modification (/api/orders/modify) during grace period.
 * 
 * Features:
 * - Track active order ID and status
 * - Auto-clear when grace period expires
 * - Persist across page refreshes (sessionStorage)
 * - Emit events when order is modified
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order } from '@/types';

interface ActiveOrderContextValue {
  activeOrderId: string | null;
  activeOrder: Order | null;
  isInGracePeriod: boolean;
  
  // Methods
  setActiveOrder: (order: Order) => void;
  clearActiveOrder: () => void;
  refreshActiveOrder: () => Promise<void>;
}

const ActiveOrderContext = createContext<ActiveOrderContextValue | undefined>(undefined);

const SESSION_STORAGE_KEY = 'active_order_grace_period';

export const ActiveOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrderState] = useState<Order | null>(null);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);

  // Load from sessionStorage on mount (survives page refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const gracePeriodExpiry = data.gracePeriodExpiresAt ? new Date(data.gracePeriodExpiresAt).getTime() : 0;
        const now = Date.now();
        
        // Only restore if grace period hasn't expired
        if (gracePeriodExpiry > now) {
          setActiveOrderId(data.orderId);
          setActiveOrderState(data.order);
          setIsInGracePeriod(true);
          
          console.log('[ActiveOrderContext] Restored active order from session:', {
            orderId: data.orderId,
            orderNumber: data.order?.orderNumber,
            timeRemaining: Math.floor((gracePeriodExpiry - now) / 1000) + 's',
          });
        } else {
          // Expired, clear storage
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          console.log('[ActiveOrderContext] Stored order grace period expired, cleared');
        }
      } catch (error) {
        console.error('[ActiveOrderContext] Failed to restore active order:', error);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Auto-clear when grace period expires
  useEffect(() => {
    if (!activeOrder?.gracePeriodExpiresAt) return;
    
    const expiry = new Date(activeOrder.gracePeriodExpiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    
    if (timeUntilExpiry <= 0) {
      clearActiveOrder();
      return;
    }
    
    // Set timeout to clear when grace period expires
    const timeout = setTimeout(() => {
      console.log('[ActiveOrderContext] Grace period expired, clearing active order');
      clearActiveOrder();
    }, timeUntilExpiry);
    
    return () => clearTimeout(timeout);
  }, [activeOrder]);

  const setActiveOrder = (order: Order) => {
    console.log('[ActiveOrderContext] Setting active order:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      gracePeriodExpiresAt: order.gracePeriodExpiresAt,
    });
    
    setActiveOrderId(order.id);
    setActiveOrderState(order);
    setIsInGracePeriod(true);
    
    // Persist to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        orderId: order.id,
        order,
        gracePeriodExpiresAt: order.gracePeriodExpiresAt,
      }));
    }
  };

  const clearActiveOrder = () => {
    console.log('[ActiveOrderContext] Clearing active order');
    
    setActiveOrderId(null);
    setActiveOrderState(null);
    setIsInGracePeriod(false);
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const refreshActiveOrder = async () => {
    if (!activeOrderId) return;
    
    try {
      console.log('[ActiveOrderContext] Refreshing active order:', activeOrderId);
      
      const response = await fetch(`/api/orders/${activeOrderId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('[ActiveOrderContext] Failed to refresh order:', response.status);
        // Order might be finalized or cancelled, clear it
        clearActiveOrder();
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.order) {
        console.log('[ActiveOrderContext] Fetched updated order:', data.order);
        
        // GENIUS FIX: If order was cancelled, clear active order immediately
        // This prevents modal from reopening with stale state
        if (data.order.status === 'cancelled') {
          console.log('[ActiveOrderContext] Order is cancelled, clearing active order');
          clearActiveOrder();
          return;
        }
        
        // Check if still in grace period
        const gracePeriodExpiry = data.order.gracePeriodExpiresAt 
          ? new Date(data.order.gracePeriodExpiresAt).getTime() 
          : 0;
        const now = Date.now();
        
        if (gracePeriodExpiry > now) {
          // Still in grace period, update order data
          setActiveOrder(data.order);
        } else {
          // Grace period expired, clear active order
          console.log('[ActiveOrderContext] Grace period expired, clearing active order');
          clearActiveOrder();
        }
      } else {
        console.error('[ActiveOrderContext] Invalid refresh response:', data);
        clearActiveOrder();
      }
    } catch (error) {
      console.error('[ActiveOrderContext] Error refreshing active order:', error);
      // Keep existing order data, don't clear on network errors
    }
  };

  // GENIUS FIX: Auto-poll order status during grace period
  // This ensures all components using activeOrder get fresh status
  useEffect(() => {
    if (!isInGracePeriod || !activeOrderId) return;
    
    console.log('[ActiveOrderContext] Starting auto-poll for grace period order:', activeOrderId);
    
    const interval = setInterval(async () => {
      await refreshActiveOrder();
    }, 3000); // Poll every 3 seconds
    
    return () => {
      console.log('[ActiveOrderContext] Stopping auto-poll');
      clearInterval(interval);
    };
  }, [isInGracePeriod, activeOrderId, refreshActiveOrder]);

  const value: ActiveOrderContextValue = {
    activeOrderId,
    activeOrder,
    isInGracePeriod,
    setActiveOrder,
    clearActiveOrder,
    refreshActiveOrder,
  };

  return (
    <ActiveOrderContext.Provider value={value}>
      {children}
    </ActiveOrderContext.Provider>
  );
};

/**
 * Custom Hook - Access active order state
 * 
 * Usage: const { activeOrderId, isInGracePeriod, setActiveOrder } = useActiveOrder();
 */
export const useActiveOrder = (): ActiveOrderContextValue => {
  const context = useContext(ActiveOrderContext);
  if (!context) {
    throw new Error('useActiveOrder must be used within ActiveOrderProvider');
  }
  return context;
};

