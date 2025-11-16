/**
 * NEW FILE: Cart Context - Global Shopping Cart State Management
 * 
 * Purpose: Provides centralized cart state using React Context API with
 * localStorage persistence for cart recovery across sessions.
 * 
 * Architecture: Uses reducer pattern for predictable state updates and
 * implements optimistic UI updates for instant user feedback.
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useRef, ReactNode } from 'react';
import { Cart, CartItem, MenuItem } from '@/types';
import { restaurantInfo } from '@/data/menuData';
import { useAuth } from '@/context/AuthContext';
import { getFirstOrderDiscountStatus } from '@/lib/first-order-discount';

/**
 * Cart Actions - All possible cart mutations
 */
type CartAction =
  | { type: 'ADD_ITEM'; payload: { menuItem: MenuItem; quantity: number; customizations?: Record<string, string>; specialInstructions?: string } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_PROMO'; payload: { code: string; discount: number } }
  | { type: 'REMOVE_PROMO' }
  | { type: 'LOAD_CART'; payload: Cart };

/**
 * Cart Context Value - Exposed API
 */
interface CartContextValue {
  cart: Cart;
  addItem: (menuItem: MenuItem, quantity: number, customizations?: Record<string, string>, specialInstructions?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string, discount: number) => void;
  removePromoCode: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Initial Cart State - Empty cart template
 */
const initialCart: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
};

/**
 * Calculate Cart Totals - Financial computation logic
 * 
 * Business Rules:
 * - Free delivery over threshold
 * - Tax calculated on subtotal only
 * - Discount applied before tax
 * - First-order discount auto-applied for eligible users
 */
const calculateTotals = (
  items: CartItem[], 
  promoCode?: string, 
  discount?: number,
  firstOrderDiscount?: number
): Cart => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Apply delivery fee (free over threshold)
  const deliveryFee = subtotal >= restaurantInfo.settings.freeDeliveryOver
    ? 0
    : restaurantInfo.settings.deliveryFee;
  
  // Combine manual discount + first-order discount
  const discountAmount = (discount || 0) + (firstOrderDiscount || 0);
  
  // Calculate tax on discounted subtotal
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * restaurantInfo.settings.taxRate;
  
  // Final total
  const total = subtotal - discountAmount + tax + deliveryFee;
  
  return {
    items,
    subtotal,
    tax,
    deliveryFee,
    discount: discountAmount,
    total,
    promoCode,
  };
};

/**
 * Cart Reducer - State transition logic
 * 
 * Design: Pure function implementing business rules for cart operations.
 * Each action produces a new state immutably.
 */
const cartReducer = (state: Cart, action: CartAction): Cart => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { menuItem, quantity, customizations, specialInstructions } = action.payload;
      console.log('[CartReducer] Processing ADD_ITEM:', {
        itemName: menuItem.name,
        quantity,
        price: menuItem.price,
        currentStateItems: state.items.length
      });
      
      // Check if identical item (same customizations) already exists
      const existingItemIndex = state.items.findIndex(
        item =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedQuantity = state.items[existingItemIndex].quantity + quantity;
        console.log('[CartReducer] Item exists in cart, updating quantity:', {
          existingQuantity: state.items[existingItemIndex].quantity,
          addingQuantity: quantity,
          newQuantity: updatedQuantity
        });
        
        // If quantity becomes zero or negative, remove the item
        if (updatedQuantity <= 0) {
          console.warn('[CartReducer] Updated quantity <= 0, removing item');
          newItems = state.items.filter((item, index) => index !== existingItemIndex);
        } else {
          newItems = state.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: updatedQuantity, subtotal: updatedQuantity * menuItem.price }
              : item
          );
        }
      } else {
        // Add new cart item (only if quantity is positive)
        console.log('[CartReducer] Adding new item to cart:', {
          quantity,
          price: menuItem.price,
          willAdd: quantity > 0
        });
        
        if (quantity <= 0) {
          // Don't add items with zero or negative quantity
          console.error('[CartReducer] REJECTED: Quantity is <= 0:', quantity);
          return state;
        }
        
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          menuItem,
          quantity,
          customizations,
          specialInstructions,
          subtotal: menuItem.price * quantity,
        };
        console.log('[CartReducer] Created new cart item:', {
          cartItemId: newItem.id,
          quantity: newItem.quantity,
          subtotal: newItem.subtotal
        });
        newItems = [...state.items, newItem];
      }
      
      const newState = calculateTotals(newItems, state.promoCode, state.discount);
      console.log('[CartReducer] ADD_ITEM complete:', {
        newItemsCount: newItems.length,
        newStateItemsCount: newState.items.length,
        subtotal: newState.subtotal,
        total: newState.total
      });
      return newState;
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      return calculateTotals(newItems, state.promoCode, state.discount);
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const newItems = state.items.filter(item => item.id !== id);
        return calculateTotals(newItems, state.promoCode, state.discount);
      }
      
      const newItems = state.items.map(item =>
        item.id === id
          ? { ...item, quantity, subtotal: item.menuItem.price * quantity }
          : item
      );
      
      return calculateTotals(newItems, state.promoCode, state.discount);
    }
    
    case 'CLEAR_CART': {
      return initialCart;
    }
    
    case 'APPLY_PROMO': {
      const { code, discount } = action.payload;
      return calculateTotals(state.items, code, discount);
    }
    
    case 'REMOVE_PROMO': {
      return calculateTotals(state.items);
    }
    
    case 'LOAD_CART': {
      return action.payload;
    }
    
    default:
      return state;
  }
};

/**
 * Cart Provider Component
 * 
 * Responsibilities:
 * - Manages cart state with useReducer
 * - Persists cart to localStorage
 * - Loads cart from localStorage on mount
 * - Provides cart API to children
 * - CROSS-TAB SYNC via BroadcastChannel + localStorage events
 */
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [firstOrderDiscount, setFirstOrderDiscount] = useState<number>(0);
  const [firstOrderEligible, setFirstOrderEligible] = useState(false);
  const { user } = useAuth();
  
  // Cross-tab sync infrastructure
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const CART_CHANNEL_NAME = 'bantu_cart_sync';
  const CART_SYNC_KEY = 'bantu_cart_sync_event';
  
  // Check for first-order discount eligibility when user logs in
  useEffect(() => {
    if (!isMounted || !user?.id) {
      setFirstOrderDiscount(0);
      setFirstOrderEligible(false);
      return;
    }
    
    const checkFirstOrderEligibility = async () => {
      try {
        const status = await getFirstOrderDiscountStatus(user.id);
        
        if (status.available && cart.subtotal > 0) {
          // Calculate 20% discount on current subtotal
          const discount = Math.round(cart.subtotal * 0.2 * 100) / 100;
          setFirstOrderDiscount(discount);
          setFirstOrderEligible(true);
          
          console.log('[First Order Discount] Auto-applied', {
            discountPercent: status.discountPercent,
            discountAmount: discount,
            subtotal: cart.subtotal,
          });
        } else {
          setFirstOrderDiscount(0);
          setFirstOrderEligible(false);
        }
      } catch (error) {
        console.error('[First Order Discount] Failed to check eligibility:', error);
        setFirstOrderDiscount(0);
        setFirstOrderEligible(false);
      }
    };
    
    checkFirstOrderEligibility();
  }, [isMounted, user, cart.subtotal]);
  
  // Mark as mounted (client-side only)
  // Setup cross-tab sync
  useEffect(() => {
    setIsMounted(true);
    
    // Generate or retrieve session ID
    const generateSessionId = () => {
      let storedSessionId = localStorage.getItem('bantu_session_id');
      if (!storedSessionId) {
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('bantu_session_id', storedSessionId);
      }
      return storedSessionId;
    };
    
    setSessionId(generateSessionId());
    
    // Setup BroadcastChannel for cross-tab sync (modern browsers)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(CART_CHANNEL_NAME);
        broadcastChannel.current = channel;
        
        channel.onmessage = (event) => {
          if (event.data.type === 'CART_UPDATED') {
            console.log('[Cart Sync] Received cart update from another tab');
            dispatch({ type: 'LOAD_CART', payload: event.data.cart });
          }
        };
        
        console.log('[Cart Sync] BroadcastChannel initialized');
      } catch (error) {
        console.error('[Cart Sync] Failed to initialize BroadcastChannel:', error);
      }
    }
    
    // Fallback: localStorage event listener for older browsers
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === CART_SYNC_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.type === 'CART_UPDATED') {
            console.log('[Cart Sync] Received cart update via localStorage event');
            dispatch({ type: 'LOAD_CART', payload: data.cart });
          }
        } catch (error) {
          console.error('[Cart Sync] Failed to parse storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Cleanup
    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);
  
  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isMounted) return;
    
    const savedCart = localStorage.getItem('bantusKitchenCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, [isMounted]);
  
  // Save cart to localStorage whenever it changes (client-side only)
  // ALSO broadcast to other tabs
  useEffect(() => {
    if (!isMounted) return;
    
    localStorage.setItem('bantusKitchenCart', JSON.stringify(cart));
    
    // Broadcast cart update to other tabs
    if (broadcastChannel.current) {
      try {
        broadcastChannel.current.postMessage({
          type: 'CART_UPDATED',
          cart,
          timestamp: Date.now(),
        });
        console.log('[Cart Sync] Broadcasted cart update to other tabs');
      } catch (error) {
        console.error('[Cart Sync] BroadcastChannel error:', error);
      }
    }
    
    // Fallback: localStorage event for older browsers
    try {
      const payload = {
        type: 'CART_UPDATED',
        cart,
        timestamp: Date.now(),
      };
      localStorage.setItem(CART_SYNC_KEY, JSON.stringify(payload));
      localStorage.removeItem(CART_SYNC_KEY); // Trigger storage event
    } catch (error) {
      console.error('[Cart Sync] localStorage sync error:', error);
    }
  }, [cart, isMounted]);
  
  // Sync cart to backend for inventory tracking (GENIUS URGENCY SYSTEM)
  useEffect(() => {
    if (!isMounted || !sessionId) return;
    
    const syncCartToBackend = async () => {
      try {
        // Only sync if cart has items
        if (cart.items.length === 0) {
          // Release all reservations if cart is empty
          await fetch('/api/cart/track', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          return;
        }
        
        // Track cart items on backend for urgency calculations
        await fetch('/api/cart/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            items: cart.items.map(item => ({
              itemId: item.menuItem.id,
              quantity: item.quantity,
            })),
          }),
        });
        
        console.log('[Cart Sync] Cart synced to backend for urgency tracking');
      } catch (error) {
        console.error('[Cart Sync] Failed to sync cart to backend:', error);
        // Don't block user experience if sync fails
      }
    };
    
    // Debounce sync to avoid too many requests
    const timeoutId = setTimeout(syncCartToBackend, 500);
    
    return () => clearTimeout(timeoutId);
  }, [cart.items, isMounted, sessionId]);
  
  // Cart API methods
  const addItem = (
    menuItem: MenuItem,
    quantity: number,
    customizations?: Record<string, string>,
    specialInstructions?: string
  ) => {
    console.log('[CartContext] addItem called:', {
      itemName: menuItem.name,
      itemId: menuItem.id,
      quantity,
      price: menuItem.price,
      customizations,
      specialInstructions,
      currentCartSize: cart.items.length
    });
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity, customizations, specialInstructions } });
    console.log('[CartContext] ADD_ITEM dispatched');
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const applyPromoCode = (code: string, discount: number) => {
    dispatch({ type: 'APPLY_PROMO', payload: { code, discount } });
  };
  
  const removePromoCode = () => {
    dispatch({ type: 'REMOVE_PROMO' });
  };
  
  // Computed values
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  const value: CartContextValue = {
    cart: {
      ...cart,
      // Add first-order discount to total discount
      discount: (cart.discount || 0) + firstOrderDiscount,
      // Recalculate total with first-order discount
      total: cart.total - firstOrderDiscount,
    },
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    itemCount,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * Custom Hook - Convenient cart access
 * 
 * Usage: const { cart, addItem, removeItem } = useCart();
 */
export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

