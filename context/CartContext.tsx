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

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Cart, CartItem, MenuItem } from '@/types';
import { restaurantInfo } from '@/data/menuData';

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
 */
const calculateTotals = (items: CartItem[], promoCode?: string, discount?: number): Cart => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Apply delivery fee (free over threshold)
  const deliveryFee = subtotal >= restaurantInfo.settings.freeDeliveryOver
    ? 0
    : restaurantInfo.settings.deliveryFee;
  
  // Apply discount
  const discountAmount = discount || 0;
  
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
      
      // Check if identical item (same customizations) already exists
      const existingItemIndex = state.items.findIndex(
        item =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * menuItem.price }
            : item
        );
      } else {
        // Add new cart item
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          menuItem,
          quantity,
          customizations,
          specialInstructions,
          subtotal: menuItem.price * quantity,
        };
        newItems = [...state.items, newItem];
      }
      
      return calculateTotals(newItems, state.promoCode, state.discount);
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
 */
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);
  
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bantusKitchenCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bantusKitchenCart', JSON.stringify(cart));
  }, [cart]);
  
  // Cart API methods
  const addItem = (
    menuItem: MenuItem,
    quantity: number,
    customizations?: Record<string, string>,
    specialInstructions?: string
  ) => {
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity, customizations, specialInstructions } });
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
    cart,
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

