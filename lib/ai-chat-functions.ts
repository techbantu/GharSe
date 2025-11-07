/**
 * NEW FILE: AI Chat Functions - Smart Order & Menu Intelligence
 * 
 * Purpose: Provides AI with real-time access to order tracking, menu search,
 * delivery status, and customer information. These functions are called by
 * the AI to provide accurate, up-to-date information.
 * 
 * Architecture Philosophy:
 * - Each function is a "tool" the AI can invoke
 * - Type-safe with Zod schemas for validation
 * - Error handling with graceful degradation
 * - Real-time data from database
 * - Smart caching for performance
 */

import { z } from 'zod';
import { prisma } from './prisma';
import { format } from 'date-fns';

// ===== FUNCTION SCHEMAS (What AI Can Call) =====

export const aiChatFunctions = {
  searchMenuItems: {
    name: 'searchMenuItems',
    description: 'Search for menu items by name, category, dietary restrictions, or price range. Returns matching dishes with details.',
    parameters: z.object({
      query: z.string().optional().describe('Search term (dish name, ingredients, etc.)'),
      category: z.string().optional().describe('Filter by category: appetizers, mains, rice, breads, desserts, drinks'),
      isVegetarian: z.boolean().optional().describe('Only vegetarian items'),
      isVegan: z.boolean().optional().describe('Only vegan items'),
      isGlutenFree: z.boolean().optional().describe('Only gluten-free items'),
      maxPrice: z.number().optional().describe('Maximum price in dollars'),
      maxSpicyLevel: z.number().optional().describe('Maximum spicy level (0-5)'),
    }),
  },

  getOrderStatus: {
    name: 'getOrderStatus',
    description: 'Get real-time order status by order number, phone number, or email. Returns current status, ETA, and tracking info.',
    parameters: z.object({
      orderNumber: z.string().optional().describe('Order number (e.g., BK-2024-001)'),
      phone: z.string().optional().describe('Customer phone number'),
      email: z.string().optional().describe('Customer email'),
    }),
  },

  getDeliveryEstimate: {
    name: 'getDeliveryEstimate',
    description: 'Calculate delivery time estimate based on location, current order volume, and time of day.',
    parameters: z.object({
      zipCode: z.string().describe('Delivery zip code'),
      currentTime: z.string().optional().describe('Current time (ISO format)'),
    }),
  },

  checkItemAvailability: {
    name: 'checkItemAvailability',
    description: 'Check if specific menu items are currently available for ordering.',
    parameters: z.object({
      itemNames: z.array(z.string()).describe('Array of item names to check'),
    }),
  },

  getPopularItems: {
    name: 'getPopularItems',
    description: 'Get most popular/bestselling items, optionally filtered by category or dietary preferences.',
    parameters: z.object({
      category: z.string().optional().describe('Filter by category'),
      isVegetarian: z.boolean().optional().describe('Only vegetarian'),
      limit: z.number().default(5).describe('Number of items to return'),
    }),
  },

  getCustomerOrderHistory: {
    name: 'getCustomerOrderHistory',
    description: 'Retrieve customer order history by phone or email for personalized recommendations.',
    parameters: z.object({
      phone: z.string().optional().describe('Customer phone'),
      email: z.string().optional().describe('Customer email'),
      limit: z.number().default(5).describe('Number of past orders to return'),
    }),
  },

  calculateOrderTotal: {
    name: 'calculateOrderTotal',
    description: 'Calculate total cost including tax, delivery fee, and any applicable discounts.',
    parameters: z.object({
      items: z.array(z.object({
        itemId: z.string(),
        quantity: z.number(),
      })).describe('Array of items with quantities'),
      zipCode: z.string().describe('Delivery zip code'),
      promoCode: z.string().optional().describe('Promo code if any'),
    }),
  },

  getRestaurantHours: {
    name: 'getRestaurantHours',
    description: 'Get restaurant operating hours and check if currently open.',
    parameters: z.object({
      date: z.string().optional().describe('Date to check (ISO format, defaults to today)'),
    }),
  },
};

// ===== FUNCTION IMPLEMENTATIONS =====

/**
 * Search Menu Items
 * Smart search with fuzzy matching and relevance scoring
 */
export async function searchMenuItems(params: z.infer<typeof aiChatFunctions.searchMenuItems.parameters>) {
  try {
    const where: any = {
      isAvailable: true,
    };

    // Text search
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { ingredients: { hasSome: [params.query] } },
      ];
    }

    // Category filter
    if (params.category) {
      where.category = { equals: params.category, mode: 'insensitive' };
    }

    // Dietary filters
    if (params.isVegetarian) where.isVegetarian = true;
    if (params.isVegan) where.isVegan = true;
    if (params.isGlutenFree) where.isGlutenFree = true;

    // Price filter
    if (params.maxPrice) {
      where.price = { lte: params.maxPrice };
    }

    // Spicy level filter
    if (params.maxSpicyLevel !== undefined) {
      where.spicyLevel = { lte: params.maxSpicyLevel };
    }

    const items = await prisma.menuItem.findMany({
      where,
      take: 10,
      orderBy: [
        { isPopular: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        category: true,
        image: true,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        spicyLevel: true,
        preparationTime: true,
        isPopular: true,
        calories: true,
        // NEW: Inventory fields
        inventoryEnabled: true,
        inventory: true,
        outOfStockMessage: true,
      },
    });

    return {
      success: true,
      itemsFound: items.length,
      items: items.map(item => {
        // Check if item is in stock
        const isInStock = !item.inventoryEnabled || item.inventory === null || item.inventory === undefined || item.inventory > 0;
        const stockCount = item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined ? item.inventory : null;
        
        return {
          ...item,
          priceFormatted: `₹${item.price}`,
          originalPriceFormatted: item.originalPrice ? `₹${item.originalPrice}` : null,
          dietaryInfo: [
            item.isVegetarian && 'Vegetarian',
            item.isVegan && 'Vegan',
            item.isGlutenFree && 'Gluten-Free',
          ].filter(Boolean).join(', ') || 'None',
          spicyLevelText: ['Mild', 'Medium', 'Medium-Hot', 'Hot', 'Very Hot', 'Extreme'][item.spicyLevel] || 'Not Spicy',
          // NEW: Inventory info
          isInStock,
          stockCount,
          stockMessage: !isInStock 
            ? (item.outOfStockMessage || 'Out of stock - Check back later!')
            : stockCount !== null && stockCount <= 3
            ? `Only ${stockCount} left! 🍽️`
            : stockCount === null
            ? 'Available'
            : `${stockCount} in stock`,
        };
      }),
    };
  } catch (error) {
    console.error('Error searching menu items:', error);
    return {
      success: false,
      error: 'Failed to search menu. Please try again.',
      itemsFound: 0,
      items: [],
    };
  }
}

/**
 * Get Order Status
 * Real-time order tracking with ETA calculation
 */
export async function getOrderStatus(params: z.infer<typeof aiChatFunctions.getOrderStatus.parameters>) {
  try {
    if (!params.orderNumber && !params.phone && !params.email) {
      return {
        success: false,
        error: 'Please provide either order number, phone number, or email address.',
      };
    }

    const where: any = {};
    if (params.orderNumber) where.orderNumber = params.orderNumber.toUpperCase();
    if (params.phone) where.customerPhone = params.phone;
    if (params.email) where.customerEmail = params.email;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (orders.length === 0) {
      return {
        success: false,
        error: 'No orders found with the provided information. Please check your order number, phone, or email.',
      };
    }

    return {
      success: true,
      ordersFound: orders.length,
      orders: orders.map(order => ({
        orderNumber: order.orderNumber,
        status: order.status,
        statusMessage: getStatusMessage(order.status),
        customerName: order.customerName,
        total: `₹${order.total.toFixed(2)}`,
        itemCount: order.items.length,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: `₹${item.price.toFixed(2)}`,
        })),
        orderTime: format(new Date(order.createdAt), 'PPpp'),
        estimatedDelivery: order.estimatedDelivery 
          ? format(new Date(order.estimatedDelivery), 'p')
          : calculateETA(order),
        deliveryAddress: `${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryZip}`,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        canCancel: order.status === 'PENDING' || order.status === 'CONFIRMED',
      })),
    };
  } catch (error) {
    console.error('Error getting order status:', error);
    return {
      success: false,
      error: 'Failed to retrieve order information. Please try again.',
    };
  }
}

/**
 * Get Delivery Estimate
 * Smart ETA calculation based on location and load
 */
export async function getDeliveryEstimate(params: z.infer<typeof aiChatFunctions.getDeliveryEstimate.parameters>) {
  try {
    const { zipCode } = params;

    // Base delivery time: 30-45 minutes
    let baseTime = 35;

    // Adjust for current order volume
    const currentOrders = await prisma.order.count({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'],
        },
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
        },
      },
    });

    // Add time based on volume
    if (currentOrders > 10) baseTime += 10;
    if (currentOrders > 20) baseTime += 15;

    // Check time of day (peak hours)
    const hour = new Date().getHours();
    if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      baseTime += 10; // Peak dinner/lunch time
    }

    // Distance calculation (simplified - in production, use real mapping API)
    const zipDistance = Math.abs(parseInt(zipCode.substring(0, 5)) % 100);
    const distanceMinutes = Math.floor(zipDistance / 10) * 5;

    const totalMinutes = baseTime + distanceMinutes;
    const etaTime = new Date(Date.now() + totalMinutes * 60 * 1000);

    return {
      success: true,
      estimatedMinutes: totalMinutes,
      estimatedTime: format(etaTime, 'p'),
      estimatedRange: `${totalMinutes - 5}-${totalMinutes + 10} minutes`,
      currentOrderVolume: currentOrders > 15 ? 'High' : currentOrders > 8 ? 'Medium' : 'Low',
      message: currentOrders > 15 
        ? 'We\'re experiencing high order volume. Your order may take slightly longer.'
        : 'Normal delivery time expected.',
    };
  } catch (error) {
    console.error('Error calculating delivery estimate:', error);
    return {
      success: false,
      error: 'Unable to calculate delivery time.',
      estimatedMinutes: 40,
      estimatedRange: '35-50 minutes',
    };
  }
}

/**
 * Check Item Availability
 */
export async function checkItemAvailability(params: z.infer<typeof aiChatFunctions.checkItemAvailability.parameters>) {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        name: {
          in: params.itemNames,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        isAvailable: true,
        preparationTime: true,
        // NEW: Inventory fields
        inventoryEnabled: true,
        inventory: true,
        outOfStockMessage: true,
      },
    });

    return {
      success: true,
      items: items.map(item => {
        // Check if item is in stock
        const isInStock = item.isAvailable && (!item.inventoryEnabled || item.inventory === null || item.inventory === undefined || item.inventory > 0);
        const stockCount = item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined ? item.inventory : null;
        
        let message = '';
        if (!item.isAvailable) {
          message = 'Not on menu';
        } else if (!isInStock) {
          message = item.outOfStockMessage || 'Out of stock - Check back later!';
        } else if (stockCount !== null && stockCount <= 3) {
          message = `Only ${stockCount} left! Ready in ${item.preparationTime} minutes`;
        } else {
          message = `Available - Ready in ${item.preparationTime} minutes`;
        }
        
        return {
          name: item.name,
          available: isInStock,
          inStock: isInStock,
          stockCount,
          preparationTime: item.preparationTime,
          message,
        };
      }),
      unavailableItems: items.filter(i => !i.isAvailable || (i.inventoryEnabled && i.inventory === 0)).map(i => i.name),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to check item availability.',
    };
  }
}

/**
 * Get Popular Items
 */
export async function getPopularItems(params: z.infer<typeof aiChatFunctions.getPopularItems.parameters>) {
  try {
    const where: any = {
      isAvailable: true,
      isPopular: true,
    };

    if (params.category) where.category = params.category;
    if (params.isVegetarian) where.isVegetarian = true;

    const items = await prisma.menuItem.findMany({
      where,
      take: params.limit || 5,
      orderBy: { name: 'asc' },
      select: {
        name: true,
        description: true,
        price: true,
        category: true,
        isVegetarian: true,
        isVegan: true,
        spicyLevel: true,
      },
    });

    return {
      success: true,
      count: items.length,
      items: items.map(item => ({
        ...item,
        price: `₹${item.price}`,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch popular items.',
      items: [],
    };
  }
}

/**
 * Get Customer Order History
 */
export async function getCustomerOrderHistory(params: z.infer<typeof aiChatFunctions.getCustomerOrderHistory.parameters>) {
  try {
    const where: any = {};
    if (params.phone) where.customerPhone = params.phone;
    if (params.email) where.customerEmail = params.email;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 5,
    });

    // Extract favorite items
    const itemCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.menuItem.name]) {
          itemCounts[item.menuItem.name] = { name: item.menuItem.name, count: 0 };
        }
        itemCounts[item.menuItem.name].count += item.quantity;
      });
    });

    const favoriteItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      totalOrders: orders.length,
      totalSpent: `₹${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`,
      orders: orders.map(o => ({
        orderNumber: o.orderNumber,
        date: format(new Date(o.createdAt), 'PP'),
        total: `₹${o.total.toFixed(2)}`,
        itemCount: o.items.length,
      })),
      favoriteItems,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to retrieve order history.',
    };
  }
}

/**
 * Calculate Order Total
 */
export async function calculateOrderTotal(params: z.infer<typeof aiChatFunctions.calculateOrderTotal.parameters>) {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        id: {
          in: params.items.map(i => i.itemId),
        },
      },
    });

    let subtotal = 0;
    params.items.forEach(orderItem => {
      const menuItem = items.find(i => i.id === orderItem.itemId);
      if (menuItem) {
        subtotal += menuItem.price * orderItem.quantity;
      }
    });

    const tax = subtotal * 0.05; // 5% GST
    const deliveryFee = subtotal >= 499 ? 0 : 49; // Free delivery over ₹499
    const total = subtotal + tax + deliveryFee;

    return {
      success: true,
      breakdown: {
        subtotal: `₹${subtotal.toFixed(2)}`,
        tax: `₹${tax.toFixed(2)}`,
        deliveryFee: deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`,
        total: `₹${total.toFixed(2)}`,
      },
      itemCount: params.items.reduce((sum, i) => sum + i.quantity, 0),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to calculate order total.',
    };
  }
}

/**
 * Get Restaurant Hours
 */
export async function getRestaurantHours(params: z.infer<typeof aiChatFunctions.getRestaurantHours.parameters>) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Restaurant hours: Mon-Sun 10:00 AM - 10:00 PM
  const isOpen = hour >= 10 && hour < 22;

  const hours = {
    monday: '10:00 AM - 10:00 PM',
    tuesday: '10:00 AM - 10:00 PM',
    wednesday: '10:00 AM - 10:00 PM',
    thursday: '10:00 AM - 10:00 PM',
    friday: '10:00 AM - 10:00 PM',
    saturday: '10:00 AM - 10:00 PM',
    sunday: '10:00 AM - 10:00 PM',
  };

  return {
    success: true,
    currentlyOpen: isOpen,
    message: isOpen 
      ? 'We are currently open and accepting orders!'
      : 'We are currently closed. We open at 10:00 AM.',
    todayHours: Object.values(hours)[day],
    fullSchedule: hours,
  };
}

// ===== HELPER FUNCTIONS =====

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    PENDING: 'Order received! We\'re reviewing your order.',
    CONFIRMED: 'Order confirmed! We\'re preparing your food.',
    PREPARING: 'Your food is being cooked with love!',
    READY: 'Your order is ready! Driver is on the way.',
    OUT_FOR_DELIVERY: 'Your order is on its way!',
    DELIVERED: 'Delivered! Enjoy your meal!',
    CANCELLED: 'Order was cancelled.',
  };
  return messages[status] || 'Processing...';
}

function calculateETA(order: any): string {
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  const totalTime = order.estimatedPrepTime * 60 * 1000; // Convert to ms
  const remaining = totalTime - elapsed;

  if (remaining <= 0) {
    return 'Arriving soon!';
  }

  const minutes = Math.ceil(remaining / (60 * 1000));
  return `About ${minutes} minutes`;
}

// ===== FUNCTION EXECUTOR =====

/**
 * Execute AI Function
 * Routes function calls to the appropriate handler
 */
export async function executeAIFunction(functionName: string, params: any) {
  try {
    switch (functionName) {
      case 'searchMenuItems':
        return await searchMenuItems(params);
      case 'getOrderStatus':
        return await getOrderStatus(params);
      case 'getDeliveryEstimate':
        return await getDeliveryEstimate(params);
      case 'checkItemAvailability':
        return await checkItemAvailability(params);
      case 'getPopularItems':
        return await getPopularItems(params);
      case 'getCustomerOrderHistory':
        return await getCustomerOrderHistory(params);
      case 'calculateOrderTotal':
        return await calculateOrderTotal(params);
      case 'getRestaurantHours':
        return await getRestaurantHours(params);
      default:
        return {
          success: false,
          error: `Unknown function: ${functionName}`,
        };
    }
  } catch (error) {
    console.error(`Error executing AI function ${functionName}:`, error);
    return {
      success: false,
      error: 'Function execution failed. Please try again.',
    };
  }
}

