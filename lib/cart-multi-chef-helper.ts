/**
 * MULTI-CHEF CART HELPER
 * 
 * Purpose: Helper functions for managing multi-chef cart logic
 * 
 * Features:
 * - Group cart items by chef
 * - Calculate delivery fees per chef
 * - Validate multi-chef cart rules
 * - Generate warnings for customers
 */

import { CartItem } from '@/types';
import { allowMultiChefCart } from '@/lib/feature-flags';
import { restaurantInfo } from '@/data/menuData';

export interface ChefGroup {
  chefId: string | null; // null = default restaurant
  chefName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  minOrderAmount: number;
}

export interface MultiChefCartAnalysis {
  chefGroups: ChefGroup[];
  totalChefs: number;
  warnings: string[];
  errors: string[];
  isValid: boolean;
  combinedDeliveryFee: number;
}

/**
 * Group cart items by chef
 */
export function groupItemsByChef(items: CartItem[]): Map<string, CartItem[]> {
  const groups = new Map<string, CartItem[]>();

  for (const item of items) {
    // Extract chefId from menu item metadata (you'll need to add this to MenuItem type)
    const chefId = (item.menuItem as any).chefId || 'default';

    if (!groups.has(chefId)) {
      groups.set(chefId, []);
    }

    groups.get(chefId)!.push(item);
  }

  return groups;
}

/**
 * Calculate delivery fee for a chef's order
 */
export function calculateChefDeliveryFee(subtotal: number, chefMinOrder: number = 199): number {
  // Free delivery if above threshold
  if (subtotal >= restaurantInfo.settings.freeDeliveryOver) {
    return 0;
  }

  // Standard delivery fee
  return restaurantInfo.settings.deliveryFee;
}

/**
 * Analyze multi-chef cart
 */
export function analyzeMultiChefCart(items: CartItem[]): MultiChefCartAnalysis {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (items.length === 0) {
    return {
      chefGroups: [],
      totalChefs: 0,
      warnings: [],
      errors: [],
      isValid: true,
      combinedDeliveryFee: 0,
    };
  }

  // Group by chef
  const itemsByChef = groupItemsByChef(items);
  const chefGroups: ChefGroup[] = [];
  let combinedDeliveryFee = 0;

  for (const [chefId, chefItems] of itemsByChef.entries()) {
    const subtotal = chefItems.reduce((sum, item) => sum + item.subtotal, 0);
    const chefName =
      chefId === 'default'
        ? restaurantInfo.name
        : (chefItems[0]?.menuItem as any).chefName || 'Unknown Chef';

    const minOrderAmount =
      chefId === 'default'
        ? restaurantInfo.settings.minimumOrder
        : (chefItems[0]?.menuItem as any).minOrderAmount || 199;

    const deliveryFee = calculateChefDeliveryFee(subtotal, minOrderAmount);
    combinedDeliveryFee += deliveryFee;

    // Check minimum order amount
    if (subtotal < minOrderAmount) {
      errors.push(
        `${chefName}: Minimum order is ₹${minOrderAmount}. Current: ₹${subtotal.toFixed(2)}`
      );
    }

    chefGroups.push({
      chefId,
      chefName,
      items: chefItems,
      subtotal,
      deliveryFee,
      minOrderAmount,
    });
  }

  // Multi-chef warnings
  if (chefGroups.length > 1) {
    if (!allowMultiChefCart()) {
      errors.push(
        'Items from multiple chefs are not allowed. Please order from one chef at a time.'
      );
    } else {
      warnings.push(
        `Your order contains items from ${chefGroups.length} different chefs. Separate delivery fees apply.`
      );

      if (combinedDeliveryFee > restaurantInfo.settings.deliveryFee) {
        warnings.push(
          `Multiple delivery fees: ₹${combinedDeliveryFee} (₹${restaurantInfo.settings.deliveryFee} per chef)`
        );
      }
    }
  }

  return {
    chefGroups,
    totalChefs: chefGroups.length,
    warnings,
    errors,
    isValid: errors.length === 0,
    combinedDeliveryFee,
  };
}

/**
 * Get cart summary for multi-chef orders
 */
export function getMultiChefCartSummary(items: CartItem[]): {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  discount: number;
  chefCount: number;
  warnings: string[];
} {
  const analysis = analyzeMultiChefCart(items);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = analysis.combinedDeliveryFee;

  // Calculate tax on subtotal only
  const tax = subtotal * restaurantInfo.settings.taxRate;

  const total = subtotal + tax + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    tax,
    total,
    discount: 0,
    chefCount: analysis.totalChefs,
    warnings: analysis.warnings,
  };
}

/**
 * Validate multi-chef cart before checkout
 */
export function validateMultiChefCart(items: CartItem[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const analysis = analyzeMultiChefCart(items);

  return {
    valid: analysis.isValid,
    errors: analysis.errors,
    warnings: analysis.warnings,
  };
}

export default {
  groupItemsByChef,
  calculateChefDeliveryFee,
  analyzeMultiChefCart,
  getMultiChefCartSummary,
  validateMultiChefCart,
};

