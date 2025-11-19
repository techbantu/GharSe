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
import { getFirstOrderDiscountStatus } from '@/lib/first-order-discount-client';
import { useActiveOrder } from '@/context/ActiveOrderContext';

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
        
        // GENIUS FIX: Ensure price is a valid number before calculating subtotal
        const itemPrice = typeof menuItem.price === 'number' && !isNaN(menuItem.price) 
          ? menuItem.price 
          : 0;
        const calculatedSubtotal = itemPrice * quantity;
        
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          menuItem,
          quantity,
          customizations,
          specialInstructions,
          subtotal: calculatedSubtotal,
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
  const [firstOrderDiscount, setFirstOrderDiscount] = useState<number>(0);
  const [firstOrderEligible, setFirstOrderEligible] = useState(false);
  const { user } = useAuth();
  const { activeOrderId, activeOrder, isInGracePeriod, refreshActiveOrder } = useActiveOrder();

  // Cross-tab sync infrastructure
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const CART_CHANNEL_NAME = 'bantu_cart_sync';
  const CART_SYNC_KEY = 'bantu_cart_sync_event';
  const lastBroadcastRef = useRef<number>(0); // Prevent infinite loops
  const sessionIdRef = useRef<string>(''); // Session ID ref for immediate access
  const instanceIdRef = useRef<string>(`instance_${Date.now()}_${Math.random().toString(36)}`); // Unique per component instance
  
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
    
    // Generate or retrieve session ID (use ref for immediate access)
    const generateSessionId = () => {
      let storedSessionId = localStorage.getItem('bantu_session_id');
      if (!storedSessionId) {
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('bantu_session_id', storedSessionId);
      }
      sessionIdRef.current = storedSessionId;
      return storedSessionId;
    };
    generateSessionId();
    
    // Setup BroadcastChannel for cross-tab sync (modern browsers)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(CART_CHANNEL_NAME);
        broadcastChannel.current = channel;
        
        channel.onmessage = (event) => {
          if (event.data.type === 'CART_UPDATED') {
            // Prevent processing our own broadcasts (check instance ID)
            if (event.data.instanceId === instanceIdRef.current) {
              return; // Ignore broadcasts from THIS component instance
            }

            // GENIUS FIX: Only update if cart actually changed (prevent infinite loop)
            // Compare cart contents to avoid unnecessary re-renders
            const currentCartJson = JSON.stringify(cart);
            const incomingCartJson = JSON.stringify(event.data.cart);
            
            if (currentCartJson === incomingCartJson) {
              console.log('[Cart Sync] Received identical cart, ignoring');
              return; // Cart hasn't changed, no need to update
            }

            console.log('[Cart Sync] Received cart update from another tab');
            dispatch({ type: 'LOAD_CART', payload: event.data.cart });
          }
        };
        
        console.log('[Cart Sync] BroadcastChannel initialized');
      } catch (error) {
        console.error('[Cart Sync] Failed to initialize BroadcastChannel:', error);
      }
    }
    
    // DISABLED: localStorage event listener (was causing duplicate events)
    // BroadcastChannel is sufficient for modern browsers
    // const handleStorageEvent = (e: StorageEvent) => { ... };
    // window.addEventListener('storage', handleStorageEvent);
    
    // Cleanup
    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
      }
    };
  }, []);
  
  // Load cart from localStorage on mount (client-side only)
  // GENIUS FIX: Validate and refresh prices from database to prevent stale data
  useEffect(() => {
    if (!isMounted) return;
    
    const savedCart = localStorage.getItem('bantusKitchenCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        
        // GENIUS: Check for stale prices and refresh from database
        validateAndRefreshCartPrices(parsedCart).then((updatedCart) => {
          dispatch({ type: 'LOAD_CART', payload: updatedCart });
        });
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, [isMounted]);
  
  /**
   * GENIUS FUNCTION: Validate Cart Prices Against Database
   * 
   * Problem: Users might have items in cart with old prices (₹0) from before
   * database was properly seeded. This causes confusion.
   * 
   * Solution: On cart load, fetch fresh prices from database and update any
   * items that have incorrect prices.
   * 
   * @param cart - Cart loaded from localStorage
   * @returns Updated cart with fresh prices from database
   */
  async function validateAndRefreshCartPrices(cart: Cart): Promise<Cart> {
    // If cart is empty, nothing to validate
    if (!cart.items || cart.items.length === 0) {
      return cart;
    }
    
    try {
      // Extract all menu item IDs from cart
      const menuItemIds = cart.items.map(item => item.menuItem.id);
      
      // Fetch fresh data from database for all cart items
      const response = await fetch('/api/menu');
      if (!response.ok) {
        console.warn('[Cart Price Validation] Failed to fetch menu, using existing prices');
        return cart;
      }
      
      const { items: menuItems } = await response.json();
      
      // Create a map for fast lookup
      const menuItemMap = new Map(
        menuItems.map((item: MenuItem) => [item.id, item])
      );
      
      // Track if any prices were updated
      let pricesUpdated = false;
      
      // Update cart items with fresh prices
      const updatedItems = cart.items.map((cartItem) => {
        const freshMenuItem = menuItemMap.get(cartItem.menuItem.id) as MenuItem | undefined;
        
        if (!freshMenuItem || typeof freshMenuItem.price !== 'number') {
          console.warn(`[Cart Price Validation] Menu item not found or invalid: ${cartItem.menuItem.name} (${cartItem.menuItem.id})`);
          return cartItem; // Keep original if item not found
        }
        
        // Check if price needs updating
        if (cartItem.menuItem.price !== freshMenuItem.price) {
          console.log(`[Cart Price Validation] Price mismatch for ${cartItem.menuItem.name}:`);
          console.log(`  Old price: ₹${cartItem.menuItem.price}`);
          console.log(`  New price: ₹${freshMenuItem.price}`);
          console.log(`  Updating to fresh price...`);
          
          pricesUpdated = true;
          
          // GENIUS FIX: Ensure price is valid before calculating subtotal
          const freshPrice = typeof freshMenuItem.price === 'number' && !isNaN(freshMenuItem.price)
            ? freshMenuItem.price
            : 0;
          const newSubtotal = cartItem.quantity * freshPrice;
          
          // Create updated cart item with fresh menu data
          return {
            ...cartItem,
            menuItem: freshMenuItem, // Replace entire menuItem with fresh data (includes correct image)
            subtotal: newSubtotal, // Recalculate subtotal with validated price
          };
        }
        
        return cartItem;
      });
      
      if (pricesUpdated) {
        console.log('[Cart Price Validation] ✅ Prices updated from database');
        
        // Recalculate cart totals with updated prices
        // GENIUS FIX: Pass discount amount directly (not a ratio)
        // The discount is already an absolute amount, not a percentage
        const refreshedCart = calculateTotals(
          updatedItems,
          cart.promoCode,
          cart.discount || 0  // Pass discount amount directly
        );
        
        // Save updated cart back to localStorage
        localStorage.setItem('bantusKitchenCart', JSON.stringify(refreshedCart));
        
        return refreshedCart;
      }
      
      console.log('[Cart Price Validation] ✅ All prices are up to date');
      return cart;
      
    } catch (error) {
      console.error('[Cart Price Validation] Error validating prices:', error);
      // On error, return original cart (better to show stale prices than crash)
      return cart;
    }
  }
  
  // Save cart to localStorage whenever it changes (client-side only)
  // ALSO broadcast to other tabs (BroadcastChannel ONLY - no localStorage fallback)
  useEffect(() => {
    if (!isMounted || !sessionIdRef.current) return;

    // GENIUS FIX: Removed throttle check that was causing timing issues
    // instanceIdRef already prevents self-receive via BroadcastChannel (line 329)
    // Deep comparison in receiver prevents infinite loops (line 337)

    // Save to localStorage for persistence
    localStorage.setItem('bantusKitchenCart', JSON.stringify(cart));

    // Broadcast ONLY via BroadcastChannel (not localStorage)
    if (broadcastChannel.current) {
      try {
        const payload = {
          type: 'CART_UPDATED',
          cart,
          instanceId: instanceIdRef.current, // Instance ID to prevent self-receive
          sessionId: sessionIdRef.current,
          timestamp: Date.now(),
        };
        broadcastChannel.current.postMessage(payload);
        console.log('[Cart Sync] Broadcasted cart update to other tabs');
      } catch (error) {
        console.error('[Cart Sync] BroadcastChannel error:', error);
      }
    }
  }, [cart, isMounted]);
  
  // Sync cart to backend for inventory tracking (GENIUS URGENCY SYSTEM)
  useEffect(() => {
    if (!isMounted || !sessionIdRef.current) return;
    
    const syncCartToBackend = async () => {
      try {
        // Only sync if cart has items
        if (cart.items.length === 0) {
          // Release all reservations if cart is empty
          await fetch('/api/cart/track', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionIdRef.current }),
          });
          return;
        }
        
        // Track cart items on backend for urgency calculations
        await fetch('/api/cart/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
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
  }, [cart.items, isMounted]);
  
  // Cart API methods
  const addItem = async (
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
      currentCartSize: cart.items.length,
      hasActiveOrder: !!activeOrderId,
      isInGracePeriod,
    });
    
    // GENIUS FIX: If user has an active order in grace period, add to that order instead of cart
    if (isInGracePeriod && activeOrderId && activeOrder) {
      console.log('[CartContext] Routing to active order modification:', {
        orderId: activeOrderId,
        orderNumber: activeOrder.orderNumber,
      });
      
      try {
        // Get current order items
        const currentItems = activeOrder.items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          specialInstructions: item.specialInstructions || '',
        }));
        
        // Check if item already exists in order
        const existingItemIndex = currentItems.findIndex(
          item => item.menuItemId === menuItem.id
        );
        
        if (existingItemIndex >= 0) {
          // Item exists, increase quantity
          currentItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          currentItems.push({
            menuItemId: menuItem.id,
            quantity,
            price: menuItem.price,
            specialInstructions: specialInstructions || '',
          });
        }
        
        // Send to modify API
        const response = await fetch('/api/orders/modify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            orderId: activeOrderId,
            customerId: activeOrder.customer?.id,
            items: currentItems,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log('[CartContext] Successfully added to active order:', data.order);
          
          // Refresh active order in context
          await refreshActiveOrder();
          
          // Success logged to console (toast would require useToast hook)
          
          return;
        } else {
          console.error('[CartContext] Failed to add to active order:', data.error);
          // Fall through to regular cart addition
        }
      } catch (error) {
        console.error('[CartContext] Error adding to active order:', error);
        // Fall through to regular cart addition
      }
    }
    
    // Regular cart addition (when no active order)
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity, customizations, specialInstructions } });
    console.log('[CartContext] ADD_ITEM dispatched to regular cart');
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

