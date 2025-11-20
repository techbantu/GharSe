/**
 * NEW FILE: Pending Order Modification Component
 * 
 * Purpose: Shows after order placement during the 3-5 minute grace period.
 * Allows customers to add/remove items before order reaches kitchen.
 * 
 * Features:
 * - Smart countdown timer with contextual messaging
 * - Current order items (editable - add/remove)
 * - Quick-add suggestion cards (frequently paired items)
 * - Savings opportunities (show available coupons)
 * - Reopen cart sidebar for browsing
 * - Auto-finalizes when timer hits 0
 * 
 * UX Philosophy:
 * - Calm, reassuring (not anxiety-inducing)
 * - Helpful suggestions (increases order value)
 * - Clear visual feedback on all actions
 * - Smooth animations and transitions
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Plus, Minus, Trash2, ShoppingBag, Sparkles, TrendingUp, X, XCircle, UtensilsCrossed } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Order, MenuItem } from '@/types';
import { useOrderStatusPoller } from '@/hooks/useOrderStatusPoller';
// Removed hardcoded menu data import - now using API
import OrderModificationConfirmModal from '@/components/OrderModificationConfirmModal';
import CustomerCancelOrderModal from '@/components/CustomerCancelOrderModal';
import { restaurantInfo } from '@/data/menuData';

interface PendingOrderModificationProps {
  order: Order;
  onOrderUpdated: (updatedOrder: Order) => void;
  onFinalized: () => void;
  onBrowseMenu: () => void; // Opens cart sidebar / menu
  onCancelled?: () => void; // Called when order is cancelled
}

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  menuItem: MenuItem;
}

const PendingOrderModification: React.FC<PendingOrderModificationProps> = ({
  order,
  onOrderUpdated,
  onFinalized,
  onBrowseMenu,
  onCancelled,
}) => {
  const { addItem, clearCart } = useCart();
  const toast = useToast();
  
  // State
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in milliseconds
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isModifying, setIsModifying] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<MenuItem[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingModification, setPendingModification] = useState<{
    items: OrderItem[];
    newTotal: number;
    newSubtotal: number;
    newTax: number;
  } | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalizationInProgressRef = useRef(false);
  
  // Initialize time remaining and items
  useEffect(() => {
    console.log('[PendingOrderModification] Initializing with order:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      gracePeriodExpiresAt: order.gracePeriodExpiresAt,
      itemCount: order.items?.length,
      fullOrder: JSON.stringify(order, null, 2),
    });
    
    if (order.gracePeriodExpiresAt) {
      const expiry = new Date(order.gracePeriodExpiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiry - now);
      
      console.log('[PendingOrderModification] Timer calculation:', {
        expiry: new Date(expiry).toISOString(),
        now: new Date(now).toISOString(),
        remainingMs: remaining,
        remainingMin: Math.floor(remaining / 60000),
      });
      
      setTimeRemaining(remaining);
    } else {
      console.error('[PendingOrderModification] No gracePeriodExpiresAt found!', order);
      // Set default 3 minutes if not provided
      setTimeRemaining(3 * 60 * 1000);
      toast?.error?.('Timer not set properly. Defaulting to 3 minutes.');
    }
    
    // Convert order items to local state with proper structure for modify API
    if (order.items && order.items.length > 0) {
      console.log('[PendingOrderModification] Raw order items:', order.items);
      
      // Transform items to include required fields at top level
      const transformedItems: OrderItem[] = order.items
        .filter(item => item.menuItem && item.menuItem.name)
        .map(item => ({
          id: item.id,
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price, // Extract price from nested menuItem
          specialInstructions: item.specialInstructions || '',
          menuItem: item.menuItem,
        }));
      
      console.log('[PendingOrderModification] Transformed items:', transformedItems);
      
      if (transformedItems.length > 0) {
        setItems(transformedItems);
      } else {
        console.error('[PendingOrderModification] Items missing menuItem data!', order.items);
        toast?.error?.('Order items missing data. Please refresh.');
      }
    } else {
      console.error('[PendingOrderModification] No items found in order!', order);
      toast?.error?.('No items in order. Please contact support.');
    }
  }, [order, toast]);
  
  // GENIUS FIX: Poll order status to detect backend changes (cancellation, finalization)
  // This makes the modal reactive to status changes from any source
  const handleOrderStatusChange = useCallback((updatedOrder: Order) => {
    console.log('[PendingOrderModification] Order status changed:', {
      from: order.status,
      to: updatedOrder.status,
    });
    
    // If order was cancelled, clean up and close modal
    if (updatedOrder.status === 'cancelled') {
      console.log('[PendingOrderModification] Order cancelled, cleaning up...');
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Clear cart
      clearCart();
      
      // Show cancellation toast
      toast?.info?.('Order Cancelled', `Order #${order.orderNumber} has been cancelled.`);
      
      // Close modal via onCancelled callback
      if (onCancelled) {
        onCancelled();
      }
      
      return;
    }
    
    // If order was confirmed/finalized externally, update parent
    if (updatedOrder.status === 'confirmed' || updatedOrder.status === 'preparing') {
      onOrderUpdated(updatedOrder);
    }
  }, [order.status, order.orderNumber, onCancelled, onOrderUpdated, clearCart, toast]);
  
  // Start polling for order status changes
  useOrderStatusPoller({
    orderId: order.id,
    enabled: true, // Always poll while modal is open
    onStatusChange: handleOrderStatusChange,
    interval: 3000, // Poll every 3 seconds
  });
  
  // Timer countdown
  useEffect(() => {
    console.log('[PendingOrderModification] Starting timer interval');
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1000);
        
        // Log every 30 seconds for debugging
        if (newTime % 30000 === 0) {
          console.log('[PendingOrderModification] Timer update:', {
            remainingMs: newTime,
            remainingMin: Math.floor(newTime / 60000),
            remainingSec: Math.floor((newTime % 60000) / 1000),
          });
        }
        
        // Auto-finalize when timer hits 0 (but check status first)
        if (newTime === 0 && !finalizationInProgressRef.current) {
          console.log('[PendingOrderModification] Timer expired, checking status before finalizing...');
          finalizationInProgressRef.current = true;
          
          // Double-check order wasn't cancelled while timer was running
          fetch(`/api/orders/${order.id}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.order) {
                if (data.order.status === 'cancelled') {
                  console.log('[PendingOrderModification] Order was cancelled, aborting finalization');
                  // Trigger cancellation cleanup
                  handleOrderStatusChange(data.order);
                } else {
                  console.log('[PendingOrderModification] Status OK, proceeding with finalization');
                  finalizeOrder();
                }
              } else {
                console.error('[PendingOrderModification] Failed to check status, finalizing anyway');
                finalizeOrder();
              }
            })
            .catch(err => {
              console.error('[PendingOrderModification] Error checking status:', err);
              // Finalize anyway on network error
              finalizeOrder();
            });
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      console.log('[PendingOrderModification] Cleaning up timer interval');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  // Load suggested items (frequently paired with current order)
  useEffect(() => {
    loadSuggestions();
  }, [items]);
  
  // Load smart suggestions based on current items (from database)
  const loadSuggestions = async () => {
    try {
      const currentItemIds = items.map(item => item.menuItemId);

      // Build API URL with parameters
      const params = new URLSearchParams({
        suggestions: 'true',
        currentOrder: JSON.stringify(currentItemIds),
        limit: '3',
      });

      const response = await fetch(`/api/menu?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuggestedItems(data.items);
        console.log('[PendingOrderModification] Loaded smart suggestions:', data.items.length);
      } else {
        console.error('[PendingOrderModification] Failed to load suggestions:', data.error);
        // Fallback to empty suggestions
        setSuggestedItems([]);
      }
    } catch (error) {
      console.error('[PendingOrderModification] Error loading suggestions:', error);
      setSuggestedItems([]);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get timer color and message based on time remaining
  const getTimerStyle = () => {
    const seconds = Math.floor(timeRemaining / 1000);
    
    if (seconds > 180) { // > 3 minutes
      return {
        color: '#3b82f6', // Blue - calm
        message: 'You can still add more items!',
        icon: <Sparkles size={18} />,
        bgColor: 'rgba(59, 130, 246, 0.1)',
      };
    } else if (seconds > 60) { // 1-3 minutes
      return {
        color: '#f97316', // Orange - warm
        message: 'Did you forget anything?',
        icon: <UtensilsCrossed size={18} />,
        bgColor: 'rgba(249, 115, 22, 0.1)',
      };
    } else { // < 1 minute
      return {
        color: '#f59e0b', // Amber - gentle urgency
        message: 'Finalizing order soon...',
        icon: <Clock size={18} />,
        bgColor: 'rgba(245, 158, 11, 0.1)',
      };
    }
  };
  
  // Update item quantity locally AND sync to backend immediately
  const updateItemQuantity = async (itemId: string, delta: number) => {
    // Optimistic update
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with quantity 0
      
      return updated;
    });
    
    // Instant backend sync - no Save button needed
    setTimeout(async () => {
      try {
        const updatedItems = items.map(item => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }).filter(item => item.quantity > 0);
        
        if (updatedItems.length === 0) {
          toast.warning('Empty order', 'Please add at least one item or cancel the order');
          return;
        }
        
        const itemsToSend = updatedItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || '',
        }));
        
        const response = await fetch('/api/orders/modify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            orderId: order.id,
            customerId: order.customer?.id || undefined,
            items: itemsToSend,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Update parent with new order data
          onOrderUpdated(data.order);
          console.log('[PendingOrderModification] Instant update successful:', data.order);
        }
      } catch (error) {
        console.error('[PendingOrderModification] Instant update failed:', error);
        // Revert on error - not implemented for simplicity, user can refresh
      }
    }, 300); // Small delay to batch rapid clicks
  };
  
  // Add suggested item AND sync to backend immediately
  const addSuggestedItem = async (menuItem: MenuItem) => {
    const newItem: OrderItem = {
      id: `temp-${Date.now()}`,
      menuItemId: menuItem.id,
      quantity: 1,
      price: menuItem.price,
      menuItem: menuItem,
    };
    
    // Optimistic update
    setItems(prev => [...prev, newItem]);
    toast.success('Item added!', `${menuItem.name} added to your order`);
    
    // Instant backend sync
    setTimeout(async () => {
      try {
        const updatedItems = [...items, newItem];
        const itemsToSend = updatedItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || '',
        }));
        
        const response = await fetch('/api/orders/modify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            orderId: order.id,
            customerId: order.customer?.id || undefined,
            items: itemsToSend,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Update parent with new order data
          onOrderUpdated(data.order);
          console.log('[PendingOrderModification] Instant add successful:', data.order);
        }
      } catch (error) {
        console.error('[PendingOrderModification] Instant add failed:', error);
      }
    }, 300);
  };
  
  // Calculate new pricing for modifications
  const calculateNewPricing = (itemsToCalculate: OrderItem[]) => {
    const TAX_RATE = restaurantInfo.settings.taxRate || 0.05;
    const DELIVERY_FEE = restaurantInfo.settings.deliveryFee || 50;
    
    const newSubtotal = itemsToCalculate.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const newTax = newSubtotal * TAX_RATE;
    const newTotal = newSubtotal + newTax + DELIVERY_FEE - (order.pricing.discount || 0);
    
    return { newSubtotal, newTax, newTotal };
  };

  // Confirm order and send to kitchen
  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      toast.error('Empty order', 'Please add at least one item before confirming');
      return;
    }

    setIsModifying(true);

    try {
      // Prepare final items payload
      const itemsToSend = items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        specialInstructions: item.specialInstructions || '',
      }));

      console.log('[PendingOrderModification] Confirming order and sending to kitchen:', {
        orderId: order.id,
        items: itemsToSend,
      });

      // Send final order to kitchen via modify API
      const response = await fetch('/api/orders/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          customerId: order.customer?.id || undefined,
          items: itemsToSend,
          finalize: true, // Signal that this is the final confirmation
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm order');
      }

      // Success!
      toast.success(
        'Order Placed! 🎉',
        'Your order has been sent to the kitchen. You\'ll receive updates as it\'s prepared.'
      );

      // Update parent with confirmed order
      onOrderUpdated(data.order);

      // Finalize and close modification UI
      setTimeout(() => {
        onFinalized();
      }, 1500);

    } catch (error) {
      console.error('[PendingOrderModification] Confirm order failed:', error);
      toast.error(
        'Confirmation Failed',
        error instanceof Error ? error.message : 'Please try again or contact support'
      );
    } finally {
      setIsModifying(false);
    }
  };

  // Get items being added (new items not in original order)
  const getItemsBeingAdded = (): Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }> => {
    const originalItemIds = new Set(order.items.map(item => item.menuItem.id));
    return items
      .filter(item => !originalItemIds.has(item.menuItemId))
      .map(item => ({
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        price: item.price,
        quantity: item.quantity,
      }));
  };

  // Save modifications to server (called after confirmation)
  const executeModification = async () => {
    if (!pendingModification) return;
    
    setIsModifying(true);
    
    try {
      // Validate all items have required fields before sending
      const itemsToSend = pendingModification.items.map(item => {
        if (!item.menuItemId || !item.price || item.quantity === undefined) {
          console.error('[PendingOrderModification] Invalid item:', item);
          throw new Error(`Invalid item data: ${item.menuItem?.name || 'Unknown'}`);
        }
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || '',
        };
      });
      
      console.log('[PendingOrderModification] Sending modification request:', {
        orderId: order.id,
        customerId: order.customer?.id,
        items: itemsToSend,
      });
      
      const response = await fetch('/api/orders/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          customerId: order.customer?.id || undefined,
          items: itemsToSend,
        }),
      });
      
      const data = await response.json();
      
      console.log('[PendingOrderModification] Modification response:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order');
      }
      
      // Update local state with new order data
      onOrderUpdated(data.order);
      setTimeRemaining(data.timeRemaining);
      
      // Reset pending modification
      setPendingModification(null);
      setShowConfirmModal(false);
      
      toast.success('Order updated!', data.message || 'Your changes have been saved');
      
    } catch (error) {
      console.error('[PendingOrderModification] Failed to modify order:', error);
      toast.error('Update failed', error instanceof Error ? error.message : 'Please try again');
      setShowConfirmModal(false);
    } finally {
      setIsModifying(false);
    }
  };

  // Save modifications with confirmation
  const saveModifications = () => {
    if (items.length === 0) {
      toast.error('Empty order', 'Please add at least one item or cancel the order');
      return;
    }
    
    // Calculate new pricing
    const { newSubtotal, newTax, newTotal } = calculateNewPricing(items);
    
    // Check if there are items being added (not just quantity changes)
    const itemsBeingAdded = getItemsBeingAdded();
    
    // If items are being added, show confirmation modal
    if (itemsBeingAdded.length > 0) {
      setPendingModification({
        items,
        newTotal,
        newSubtotal,
        newTax,
      });
      setShowConfirmModal(true);
    } else {
      // If only quantity changes, proceed without confirmation
      setPendingModification({
        items,
        newTotal,
        newSubtotal,
        newTax,
      });
      executeModification();
    }
  };
  
  // Finalize order (send to kitchen)
  const finalizeOrder = useCallback(async () => {
    try {
      const response = await fetch('/api/orders/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          customerId: order.customer.id || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Order finalized!', data.message || 'Your order has been sent to the kitchen');
        onFinalized();
      } else {
        // If already finalized, that's okay
        if (data.alreadyFinalized) {
          onFinalized();
        } else {
          console.error('Failed to finalize order:', data.error);
        }
      }
    } catch (error) {
      console.error('Error finalizing order:', error);
      // Don't show error to user - auto-finalization is backend process
      onFinalized(); // Proceed anyway
    }
  }, [order.id, order.customer.id, onFinalized, toast]);
  
  // Calculate live totals from current items
  const calculateLiveTotals = () => {
    const TAX_RATE = restaurantInfo.settings.taxRate || 0.05;
    const DELIVERY_FEE = restaurantInfo.settings.deliveryFee || 50;
    
    const liveSubtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const liveTax = liveSubtotal * TAX_RATE;
    const liveTotal = liveSubtotal + liveTax + DELIVERY_FEE - (order.pricing.discount || 0);
    
    return { liveSubtotal, liveTax, liveTotal, liveDeliveryFee: DELIVERY_FEE };
  };
  
  const timerStyle = getTimerStyle();
  const { liveSubtotal, liveTax, liveTotal, liveDeliveryFee } = calculateLiveTotals();
  const hasChanges = items.length !== order.items.length || 
    items.some((item, idx) => item.quantity !== (order.items[idx] as any)?.quantity);
  
  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Order Number Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      }}>
        <div style={{
          fontSize: '0.875rem',
          opacity: 0.9,
          marginBottom: '4px',
        }}>
          Order Placed
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          {order.orderNumber || 'Loading...'}
        </div>
      </div>
      
      {/* Timer Card */}
      <div style={{
        background: timerStyle.bgColor,
        border: `2px solid ${timerStyle.color}`,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <Clock size={32} color={timerStyle.color} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: timerStyle.color,
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            {formatTime(timeRemaining)}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6B7280',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {timerStyle.icon}
            {timerStyle.message}
          </div>
        </div>
      </div>
      
      {/* Current Order Items */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: '#1F2937',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ShoppingBag size={20} />
          Your Order
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '12px',
            }}>
              {/* Item Image */}
              {item.menuItem?.image && (
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '2px solid #E5E7EB',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      console.warn('[PendingOrderModification] Failed to load image:', item.menuItem.image);
                      // Replace with fallback emoji
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">
                          🍽️
                        </div>
                      `;
                    }}
                  />
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#1F2937',
                  marginBottom: '4px',
                }}>
                  {item.menuItem.name}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                }}>
                  ₹{item.price}
                </div>
              </div>
              
              {/* Quantity controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'white',
                borderRadius: '10px',
                padding: '4px',
                border: '2px solid #E5E7EB',
              }}>
                <button
                  onClick={() => updateItemQuantity(item.id, -1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#F3F4F6',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                </button>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#1F2937',
                  minWidth: '24px',
                  textAlign: 'center',
                }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateItemQuantity(item.id, 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f97316',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Live Order Summary - Shows above suggestions */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)',
              borderRadius: '12px',
          border: '2px solid #E5E7EB',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '0.875rem',
            color: '#6B7280',
          }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: 600, color: '#1F2937' }}>₹{Math.round(liveSubtotal)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '0.875rem',
            color: '#6B7280',
          }}>
            <span>Tax (GST 5%):</span>
            <span style={{ fontWeight: 600, color: '#1F2937' }}>₹{Math.round(liveTax)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            fontSize: '0.875rem',
            color: '#6B7280',
          }}>
            <span>Delivery:</span>
            <span style={{ fontWeight: 600, color: liveDeliveryFee === 0 ? '#10B981' : '#1F2937' }}>
              {liveDeliveryFee === 0 ? 'FREE' : `₹${Math.round(liveDeliveryFee)}`}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '2px solid #D1D5DB',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}>
            <span style={{ color: '#1F2937' }}>Total:</span>
            <span style={{ color: '#f97316' }}>₹{Math.round(liveTotal)}</span>
          </div>
        </div>
        
        {/* Action Buttons Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '16px',
        }}>
          {/* PRIMARY: Confirm & Send to Kitchen Button */}
          <button
            onClick={handleConfirmOrder}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <UtensilsCrossed size={18} />
            Confirm & Send to Kitchen
          </button>

          {/* SECONDARY: Browse Menu Button */}
          <button
            onClick={onBrowseMenu}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ea580c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f97316';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ShoppingBag size={16} />
            Browse Full Menu
          </button>

          {/* TERTIARY: Cancel Order Button */}
          <button
            onClick={() => setShowCancelModal(true)}
            style={{
              width: '100%',
              padding: '10px 20px',
              background: 'white',
              color: '#EF4444',
              border: '2px solid #EF4444',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <XCircle size={14} />
            Cancel Order
          </button>
        </div>
      </div>
      
      {/* Suggested Items */}
      {suggestedItems.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Sparkles size={20} color="#f97316" />
            Frequently Added With Your Order
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {suggestedItems.map((item) => (
              <div key={item.id} style={{
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
              }}>
                {/* Suggestion Image */}
                {item.image && (
                  <div style={{
                    width: '100%',
                    height: '120px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    border: '2px solid #E5E7EB',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        console.warn('[PendingOrderModification] Failed to load suggested image:', item.image);
                        // Replace with fallback emoji
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">
                            🍽️
                          </div>
                        `;
                      }}
                    />
                  </div>
                )}
                
                <div style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#1F2937',
                  marginBottom: '4px',
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  marginBottom: '12px',
                }}>
                  ₹{item.price}
                </div>
                <button
                  onClick={() => addSuggestedItem(item)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <Plus size={14} />
                  Quick Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Adding Items */}
      {showConfirmModal && pendingModification && (
        <OrderModificationConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setPendingModification(null);
          }}
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.pricing.total,
            subtotal: order.pricing.subtotal,
            tax: order.pricing.tax,
            deliveryFee: order.pricing.deliveryFee,
            paymentMethod: order.paymentMethod,
          }}
          itemsToAdd={getItemsBeingAdded()}
          newTotal={pendingModification.newTotal}
          newSubtotal={pendingModification.newSubtotal}
          newTax={pendingModification.newTax}
          onConfirm={executeModification}
        />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <CustomerCancelOrderModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.pricing.total,
            status: order.status,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            preparingAt: (order as any).preparingAt,
          }}
          onSuccess={() => {
            setShowCancelModal(false);
            if (onCancelled) {
              onCancelled();
            }
          }}
        />
      )}
    </div>
  );
};

export default PendingOrderModification;

