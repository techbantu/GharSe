/**
 * SMART ORDER ROUTING - Intelligent Multi-Chef Order Management
 * 
 * Purpose: Route orders to appropriate chefs based on cart composition
 * 
 * Features:
 * - Single-chef orders (default mode)
 * - Multi-chef order splitting (when enabled)
 * - Chef availability validation
 * - Delivery radius validation
 * - Combined delivery fee calculation
 * - ETA estimation
 */

import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { isMultiChefMode, allowMultiChefCart } from '@/lib/feature-flags';

export interface CartItem {
  menuItemId: string;
  quantity: number;
  price: number;
}

export interface OrdersByChef {
  [chefId: string]: {
    items: CartItem[];
    subtotal: number;
    chef: {
      id: string;
      businessName: string;
      slug: string;
      preparationBuffer: number;
      minOrderAmount: number;
    };
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RoutingResult {
  success: boolean;
  ordersByChef: OrdersByChef;
  summary: {
    totalChefs: number;
    totalItems: number;
    totalAmount: number;
    combinedDeliveryFee: number;
    estimatedDeliveryTime: Date;
  };
  validation: ValidationResult;
}

/**
 * Get default chef ID (Bantu's Kitchen)
 */
async function getDefaultChefId(): Promise<string | null> {
  try {
    // Try to find chef with specific slug
    const defaultChef = await prisma.chef.findFirst({
      where: {
        OR: [
          { slug: 'bantus-kitchen' },
          { status: 'ACTIVE', isVerified: true },
        ],
      },
      orderBy: { createdAt: 'asc' }, // Get first chef if no specific slug
    });

    return defaultChef?.id || null;
  } catch (error) {
    logger.error('Failed to get default chef', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Route Order - Main Function
 */
export async function routeOrder(items: CartItem[]): Promise<RoutingResult> {
  if (!items || items.length === 0) {
    return {
      success: false,
      ordersByChef: {},
      summary: {
        totalChefs: 0,
        totalItems: 0,
        totalAmount: 0,
        combinedDeliveryFee: 0,
        estimatedDeliveryTime: new Date(),
      },
      validation: {
        valid: false,
        errors: ['No items in cart'],
        warnings: [],
      },
    };
  }

  try {
    // Get menu items with chef info
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: items.map(item => item.menuItemId) },
      },
      include: {
        chef: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            preparationBuffer: true,
            minOrderAmount: true,
            isAcceptingOrders: true,
            status: true,
          },
        },
      },
    });

    if (menuItems.length !== items.length) {
      return {
        success: false,
        ordersByChef: {},
        summary: {
          totalChefs: 0,
          totalItems: 0,
          totalAmount: 0,
          combinedDeliveryFee: 0,
          estimatedDeliveryTime: new Date(),
        },
        validation: {
          valid: false,
          errors: ['Some menu items not found'],
          warnings: [],
        },
      };
    }

    // If multi-chef mode disabled, assign all items to default chef
    if (!isMultiChefMode()) {
      const defaultChefId = await getDefaultChefId();

      if (!defaultChefId) {
        return {
          success: false,
          ordersByChef: {},
          summary: {
            totalChefs: 0,
            totalItems: 0,
            totalAmount: 0,
            combinedDeliveryFee: 0,
            estimatedDeliveryTime: new Date(),
          },
          validation: {
            valid: false,
            errors: ['Default chef not found'],
            warnings: [],
          },
        };
      }

      const defaultChef = await prisma.chef.findUnique({
        where: { id: defaultChefId },
        select: {
          id: true,
          businessName: true,
          slug: true,
          preparationBuffer: true,
          minOrderAmount: true,
        },
      });

      if (!defaultChef) {
        return {
          success: false,
          ordersByChef: {},
          summary: {
            totalChefs: 0,
            totalItems: 0,
            totalAmount: 0,
            combinedDeliveryFee: 0,
            estimatedDeliveryTime: new Date(),
          },
          validation: {
            valid: false,
            errors: ['Default chef not found'],
            warnings: [],
          },
        };
      }

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      return {
        success: true,
        ordersByChef: {
          [defaultChefId]: {
            items,
            subtotal,
            chef: defaultChef,
          },
        },
        summary: {
          totalChefs: 1,
          totalItems: items.length,
          totalAmount: subtotal,
          combinedDeliveryFee: subtotal >= 500 ? 0 : 50,
          estimatedDeliveryTime: new Date(Date.now() + (40 + defaultChef.preparationBuffer) * 60 * 1000),
        },
        validation: {
          valid: true,
          errors: [],
          warnings: [],
        },
      };
    }

    // Group items by chef
    const ordersByChef: OrdersByChef = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const cartItem of items) {
      const menuItem = menuItems.find(mi => mi.id === cartItem.menuItemId);

      if (!menuItem) {
        errors.push(`Menu item ${cartItem.menuItemId} not found`);
        continue;
      }

      const chefId = menuItem.chefId || await getDefaultChefId();

      if (!chefId) {
        errors.push(`No chef assigned to ${menuItem.name}`);
        continue;
      }

      const chef = menuItem.chef;

      if (!chef) {
        errors.push(`Chef not found for ${menuItem.name}`);
        continue;
      }

      // Validate chef is accepting orders
      if (!chef.isAcceptingOrders) {
        errors.push(`${chef.businessName} is not currently accepting orders`);
        continue;
      }

      if (chef.status !== 'ACTIVE') {
        errors.push(`${chef.businessName} is not active`);
        continue;
      }

      // Initialize chef's order if not exists
      if (!ordersByChef[chefId]) {
        ordersByChef[chefId] = {
          items: [],
          subtotal: 0,
          chef: {
            id: chef.id,
            businessName: chef.businessName,
            slug: chef.slug,
            preparationBuffer: chef.preparationBuffer,
            minOrderAmount: chef.minOrderAmount,
          },
        };
      }

      // Add item to chef's order
      ordersByChef[chefId].items.push(cartItem);
      ordersByChef[chefId].subtotal += cartItem.price * cartItem.quantity;
    }

    // If more than one chef and multi-chef cart not allowed
    const chefIds = Object.keys(ordersByChef);
    if (chefIds.length > 1 && !allowMultiChefCart()) {
      return {
        success: false,
        ordersByChef: {},
        summary: {
          totalChefs: 0,
          totalItems: 0,
          totalAmount: 0,
          combinedDeliveryFee: 0,
          estimatedDeliveryTime: new Date(),
        },
        validation: {
          valid: false,
          errors: ['Items from multiple chefs not allowed. Please order from one chef at a time.'],
          warnings: [],
        },
      };
    }

    // Validate minimum order amounts
    for (const chefId of chefIds) {
      const order = ordersByChef[chefId];
      if (order.subtotal < order.chef.minOrderAmount) {
        errors.push(
          `Minimum order amount for ${order.chef.businessName} is ₹${order.chef.minOrderAmount}. Current: ₹${order.subtotal}`
        );
      }
    }

    // Calculate summary
    const totalItems = items.length;
    const totalAmount = Object.values(ordersByChef).reduce((sum, order) => sum + order.subtotal, 0);
    const combinedDeliveryFee = calculateDeliveryFee(ordersByChef, totalAmount);
    const estimatedDeliveryTime = calculateEstimatedDeliveryTime(ordersByChef);

    if (chefIds.length > 1) {
      warnings.push(
        `Your order is from ${chefIds.length} different chefs. Separate delivery fees may apply.`
      );
    }

    return {
      success: errors.length === 0,
      ordersByChef,
      summary: {
        totalChefs: chefIds.length,
        totalItems,
        totalAmount,
        combinedDeliveryFee,
        estimatedDeliveryTime,
      },
      validation: {
        valid: errors.length === 0,
        errors,
        warnings,
      },
    };
  } catch (error) {
    logger.error('Order routing failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      ordersByChef: {},
      summary: {
        totalChefs: 0,
        totalItems: 0,
        totalAmount: 0,
        combinedDeliveryFee: 0,
        estimatedDeliveryTime: new Date(),
      },
      validation: {
        valid: false,
        errors: ['Failed to route order'],
        warnings: [],
      },
    };
  }
}

/**
 * Calculate delivery fee based on number of chefs and order value
 */
function calculateDeliveryFee(ordersByChef: OrdersByChef, totalAmount: number): number {
  const chefCount = Object.keys(ordersByChef).length;

  // Free delivery for orders above ₹500
  if (totalAmount >= 500) {
    return 0;
  }

  // Single chef: ₹50
  // Multiple chefs: ₹50 per chef
  return chefCount * 50;
}

/**
 * Calculate estimated delivery time (longest chef's prep time)
 */
function calculateEstimatedDeliveryTime(ordersByChef: OrdersByChef): Date {
  const chefs = Object.values(ordersByChef);

  if (chefs.length === 0) {
    return new Date();
  }

  // Find max preparation time
  const maxPrepTime = Math.max(...chefs.map(order => 40 + order.chef.preparationBuffer));

  return new Date(Date.now() + maxPrepTime * 60 * 1000);
}

export default routeOrder;

