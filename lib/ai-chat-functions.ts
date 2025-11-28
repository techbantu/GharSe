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
import { cartTracker } from './cart-inventory-tracker';

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
      maxPrice: z.number().optional().describe('Maximum price in Indian Rupees (₹)'),
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

  // ===== CART INTELLIGENCE FUNCTIONS (NEW!) =====

  getCartSummary: {
    name: 'getCartSummary',
    description: 'Get detailed summary of user cart with urgency data for each item. Shows demand pressure, stock levels, and creates FOMO.',
    parameters: z.object({
      cartItems: z.array(z.object({
        itemId: z.string(),
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
        category: z.string().optional(),
      })).describe('Array of items currently in user cart'),
    }),
  },

  getItemDemandPressure: {
    name: 'getItemDemandPressure',
    description: 'Get real-time demand pressure and urgency data for specific menu items. Returns demand scores, active cart counts, stock levels, and urgency messages.',
    parameters: z.object({
      itemIds: z.array(z.string()).describe('Array of menu item IDs to check demand for'),
    }),
  },

  suggestCartCompletions: {
    name: 'suggestCartCompletions',
    description: 'AI-powered upsell suggestions based on cart contents and order patterns. Returns items that are frequently ordered together.',
    parameters: z.object({
      cartItems: z.array(z.object({
        itemId: z.string(),
        category: z.string(),
      })).describe('Current cart items with categories'),
      limit: z.number().optional().default(3).describe('Maximum number of suggestions'),
    }),
  },

  checkCartStockStatus: {
    name: 'checkCartStockStatus',
    description: 'Verify all cart items are still available before checkout. Checks inventory and returns items that are out of stock or have insufficient quantity.',
    parameters: z.object({
      cartItems: z.array(z.object({
        itemId: z.string(),
        name: z.string(),
        quantity: z.number(),
      })).describe('Cart items to validate'),
    }),
  },

  // ===== AI CART MANIPULATION FUNCTIONS (NEW!) =====

  addItemToCart: {
    name: 'addItemToCart',
    description: 'Add item to user cart when they confirm purchase intent. Use when user says: yes, add it, I want it, sure, etc. MUST be called when user shows intent to purchase.',
    parameters: z.object({
      sessionId: z.string().describe('User session ID from chat context'),
      itemId: z.string().describe('Menu item ID to add'),
      itemName: z.string().describe('Menu item name for confirmation'),
      quantity: z.number().int().positive().default(1).describe('Quantity to add'),
    }),
  },

  removeItemFromCart: {
    name: 'removeItemFromCart',
    description: 'Remove item from cart when user requests. Use when user says: remove that, take it out, delete it, etc.',
    parameters: z.object({
      sessionId: z.string().describe('User session ID from chat context'),
      itemId: z.string().describe('Menu item ID to remove'),
    }),
  },

  proceedToCheckout: {
    name: 'proceedToCheckout',
    description: 'Signal frontend to open checkout when user is ready to complete order. Use when user says: checkout, order now, I\'m ready, place order, etc.',
    parameters: z.object({
      sessionId: z.string().describe('User session ID from chat context'),
    }),
  },

  // ===== GENIUS 10/10 FUNCTIONS =====

  searchAllergyFree: {
    name: 'searchAllergyFree',
    description: 'CRITICAL: Search for allergy-safe menu items. Use when user mentions ANY allergy (peanut, nut, dairy, egg, shellfish, wheat, soy, fish). Returns items with safety confidence levels.',
    parameters: z.object({
      allergens: z.array(z.string()).describe('List of allergens to avoid (e.g., ["peanut", "dairy"])'),
      category: z.string().optional().describe('Optional category filter'),
    }),
  },

  getSmartCombo: {
    name: 'getSmartCombo',
    description: 'Get intelligent meal combo suggestions based on a main dish. Returns complementary items (bread with curry, rice with gravy, drinks with spicy food). Use when user orders a main dish to suggest pairings.',
    parameters: z.object({
      mainItemId: z.string().describe('The main dish item ID'),
      budget: z.number().optional().describe('Optional budget limit in rupees'),
      isVegetarian: z.boolean().optional().describe('Filter combos for vegetarian'),
    }),
  },

  getDecisionHelper: {
    name: 'getDecisionHelper',
    description: 'Help indecisive customers choose. Returns curated recommendations based on preferences. Use when user says "help me decide", "what should I get", "I don\'t know what to order".',
    parameters: z.object({
      preferences: z.object({
        isVegetarian: z.boolean().optional(),
        spiceLevel: z.enum(['mild', 'medium', 'hot']).optional(),
        mealType: z.enum(['light', 'heavy', 'balanced']).optional(),
        budget: z.enum(['low', 'medium', 'high']).optional(),
      }).optional().describe('User preferences if known'),
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

    // Track if this is a health-focused query (for sorting later)
    let isHealthQuery = false;
    let maxCaloriesForHealth = 400; // Default max calories for "healthy" items

    // Text search - SQLite compatible (case-insensitive by default with LIKE)
    if (params.query) {
      const searchTerm = params.query.toLowerCase().trim();

      // GENIUS FIX: Handle dessert/desserts query variations
      // If user searches for "dessert" or "desserts", also search by category
      const dessertKeywords = ['dessert', 'desserts', 'sweet', 'sweets'];
      const isDessertQuery = dessertKeywords.some(keyword => searchTerm.includes(keyword));

      // GENIUS FIX: Handle health/healthy/nutritious queries
      // Map "healthy" searches to low-calorie, vegetarian options
      const healthKeywords = ['healthy', 'health', 'nutritious', 'light', 'low calorie', 'low-calorie', 'diet', 'fitness', 'lean', 'wholesome'];
      isHealthQuery = healthKeywords.some(keyword => searchTerm.includes(keyword));

      if (isHealthQuery) {
        // For healthy queries, filter by calories and prefer vegetarian
        where.calories = { lte: maxCaloriesForHealth };
        // Don't add text search for "healthy" since it won't match anything
        // Instead, return items sorted by calories
        console.log('[AI Chat] Health query detected - filtering by calories <= 400');
      } else if (isDessertQuery && !params.category) {
        // Add category filter for desserts
        where.category = { contains: 'Desserts' };
      }

      // Only add text search if it's not a health query (health isn't in menu item names)
      if (!isHealthQuery) {
        where.OR = [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { ingredients: { contains: searchTerm } },
        ];
      }
    }

    // Category filter - SQLite compatible with case-insensitive matching
    if (params.category) {
      // GENIUS FIX: Case-insensitive category matching
      // Handle common variations: "dessert" -> "Desserts", "desserts" -> "Desserts"
      const categoryLower = params.category.toLowerCase().trim();
      const categoryMap: Record<string, string> = {
        'dessert': 'Desserts',
        'desserts': 'Desserts',
        'drink': 'Beverages',
        'drinks': 'Beverages',
        'beverage': 'Beverages',
        'beverages': 'Beverages',
        'appetizer': 'Appetizers',
        'appetizers': 'Appetizers',
        'main': 'Main Course',
        'mains': 'Main Course',
        'main course': 'Main Course',
        'rice': 'Rice & Breads',
        'bread': 'Rice & Breads',
        'breads': 'Rice & Breads',
        'naan': 'Rice & Breads',
      };
      
      const normalizedCategory = categoryMap[categoryLower] || params.category;
      
      // Use case-insensitive contains for SQLite
      where.category = { contains: normalizedCategory };
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
      // For health queries, sort by lowest calories first; otherwise by popularity
      orderBy: isHealthQuery
        ? [{ calories: 'asc' }, { isVegetarian: 'desc' }, { name: 'asc' }]
        : [{ isPopular: 'desc' }, { name: 'asc' }],
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

    // CRITICAL: Tell AI WHY there are no results (menu existence vs stock vs filter)
    // This helps AI give correct response - not "out of stock" for menu gaps
    const dietaryFilterUsed = params.isVegetarian || params.isVegan || params.isGlutenFree;
    const categoryFilterUsed = !!params.category;
    const filterDescription = [
      params.isVegetarian && 'vegetarian',
      params.isVegan && 'vegan',
      params.isGlutenFree && 'gluten-free',
      params.category && params.category,
      isHealthQuery && 'healthy/low-calorie',
    ].filter(Boolean).join(', ');

    return {
      success: true,
      itemsFound: items.length,
      // GENIUS: Explicitly tell AI if this is a menu existence issue vs stock issue
      menuExistenceNote: items.length === 0 && (dietaryFilterUsed || categoryFilterUsed || isHealthQuery)
        ? `IMPORTANT: No ${filterDescription} items exist on our menu. This is a MENU gap, NOT a stock issue. Do NOT say "out of stock" or "fresh out" - say "We don't have ${filterDescription} dishes on our menu yet" and offer alternatives.`
        : null,
      // Flag for AI to know this was a health-focused search
      isHealthSearch: isHealthQuery,
      healthSearchNote: isHealthQuery
        ? items.length > 0
          ? `Showing ${items.length} healthy options under 400 calories, sorted by lowest calories first`
          : `No items under 400 calories found. Suggest showing popular or vegetarian items instead.`
        : undefined,
      items: items.map(item => {
        // Check if item is in stock
        const isInStock = !item.inventoryEnabled || item.inventory === null || item.inventory === undefined || item.inventory > 0;
        const stockCount = item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined ? item.inventory : null;

        // Calculate health score for display (lower calories = healthier)
        const calorieScore = item.calories
          ? item.calories <= 200 ? 'Very Light'
            : item.calories <= 300 ? 'Light'
            : item.calories <= 400 ? 'Moderate'
            : 'Hearty'
          : 'Unknown';

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
          // Health info
          caloriesFormatted: item.calories ? `${item.calories} cal` : 'N/A',
          calorieScore,
          // NEW: Inventory info
          isInStock,
          stockCount,
          stockMessage: !isInStock
            ? (item.outOfStockMessage || 'Out of stock - Check back later!')
            : stockCount !== null && stockCount <= 3
            ? `Only ${stockCount} left!`
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
          name: item.menuItem?.name || 'Unknown Item',
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
    // SQLite compatible - search with lowercase comparison
    const items = await prisma.menuItem.findMany({
      where: {
        OR: params.itemNames.map(name => ({
          name: { contains: name.toLowerCase() }
        }))
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
 * GENIUS FIX: Return ALL fields needed for action buttons (id, image, etc.)
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
      orderBy: [
        { isPopular: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true, // GENIUS FIX: Include ID for action buttons
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        category: true,
        image: true, // GENIUS FIX: Include image for display
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        spicyLevel: true,
        preparationTime: true,
        isPopular: true,
        calories: true,
      },
    });

    return {
      success: true,
      count: items.length,
      items: items.map(item => ({
        ...item,
        // GENIUS FIX: Keep price as number (not string) for action buttons
        // priceFormatted is added for AI display, but price stays as number
        priceFormatted: `₹${item.price}`,
        originalPriceFormatted: item.originalPrice ? `₹${item.originalPrice}` : null,
      })),
    };
  } catch (error) {
    console.error('Error fetching popular items:', error);
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
        const itemName = item.menuItem?.name || 'Unknown Item';
        if (!itemCounts[itemName]) {
          itemCounts[itemName] = { name: itemName, count: 0 };
        }
        itemCounts[itemName].count += item.quantity;
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
      // Cart intelligence functions
      case 'getCartSummary':
        return await getCartSummary(params);
      case 'getItemDemandPressure':
        return await getItemDemandPressure(params);
      case 'suggestCartCompletions':
        return await suggestCartCompletions(params);
      case 'checkCartStockStatus':
        return await checkCartStockStatus(params);
      // NEW: Cart manipulation functions
      case 'addItemToCart':
        return await addItemToCart(params);
      case 'removeItemFromCart':
        return await removeItemFromCart(params);
      case 'proceedToCheckout':
        return await proceedToCheckout(params);
      // GENIUS 10/10 functions
      case 'searchAllergyFree':
        return await searchAllergyFree(params);
      case 'getSmartCombo':
        return await getSmartCombo(params);
      case 'getDecisionHelper':
        return await getDecisionHelper(params);
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

// ===== NEW CART INTELLIGENCE FUNCTION IMPLEMENTATIONS =====

/**
 * Get Cart Summary with Urgency Data
 * GENIUS FEATURE: Analyzes entire cart for urgency triggers
 */
export async function getCartSummary(params: z.infer<typeof aiChatFunctions.getCartSummary.parameters>) {
  try {
    const { cartItems } = params;

    if (!cartItems || cartItems.length === 0) {
      return {
        success: true,
        message: 'Cart is empty',
        items: [],
        totalValue: 0,
        itemCount: 0,
      };
    }

    // Get demand pressure data for all cart items
    const itemsWithUrgency = await Promise.all(
      cartItems.map(async (item) => {
        const demandData = await cartTracker.calculateDemandPressure(item.itemId);
        
        return {
          ...item,
          demandScore: demandData.demandScore,
          activeCartCount: demandData.activeCartCount,
          currentStock: demandData.currentStock,
          availableStock: demandData.availableStock,
          ordersLast24h: demandData.ordersLast24h,
          urgencyTier: demandData.urgencyTier,
          urgencyMessage: demandData.urgencyMessage,
          socialProof: demandData.socialProof,
        };
      })
    );

    // Calculate totals
    const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Find highest urgency items
    const highUrgencyItems = itemsWithUrgency.filter(item => 
      item.urgencyTier === 'critical' || item.urgencyTier === 'high'
    );

    // Find low stock items
    const lowStockItems = itemsWithUrgency.filter(item => 
      item.availableStock !== null && item.availableStock <= 5 && item.availableStock > 0
    );

    // Find out of stock items
    const outOfStockItems = itemsWithUrgency.filter(item => 
      item.availableStock === 0
    );

    return {
      success: true,
      cartSummary: {
        totalValue: `₹${totalValue.toFixed(2)}`,
        totalItems,
        itemCount: cartItems.length,
      },
      items: itemsWithUrgency,
      alerts: {
        highUrgency: highUrgencyItems.length > 0 
          ? `${highUrgencyItems.length} items have high demand!`
          : null,
        lowStock: lowStockItems.length > 0
          ? `${lowStockItems.length} items running low on stock`
          : null,
        outOfStock: outOfStockItems.length > 0
          ? `Warning: ${outOfStockItems.map(i => i.name).join(', ')} out of stock!`
          : null,
      },
      recommendation: highUrgencyItems.length > 0
        ? 'Complete your order soon - some items are in high demand!'
        : lowStockItems.length > 0
        ? 'Some items are running low. Order now to secure them!'
        : 'Your cart looks great! Ready to order?',
    };
  } catch (error) {
    console.error('Error getting cart summary:', error);
    return {
      success: false,
      error: 'Failed to analyze cart',
    };
  }
}

/**
 * Get Item Demand Pressure
 * GENIUS FEATURE: Real-time demand analytics for items
 */
export async function getItemDemandPressure(params: z.infer<typeof aiChatFunctions.getItemDemandPressure.parameters>) {
  try {
    const { itemIds } = params;

    const pressureData = await Promise.all(
      itemIds.map(itemId => cartTracker.calculateDemandPressure(itemId))
    );

    return {
      success: true,
      items: pressureData,
      summary: {
        criticalItems: pressureData.filter(d => d.urgencyTier === 'critical').length,
        highDemandItems: pressureData.filter(d => d.urgencyTier === 'high').length,
        totalActiveCartCount: pressureData.reduce((sum, d) => sum + d.activeCartCount, 0),
      },
    };
  } catch (error) {
    console.error('Error getting demand pressure:', error);
    return {
      success: false,
      error: 'Failed to get demand data',
    };
  }
}

/**
 * Suggest Cart Completions
 * GENIUS FEATURE: AI-powered upsells based on order patterns
 */
export async function suggestCartCompletions(params: z.infer<typeof aiChatFunctions.suggestCartCompletions.parameters>) {
  try {
    const { cartItems, limit = 3 } = params;

    if (!cartItems || cartItems.length === 0) {
      return {
        success: true,
        suggestions: [],
        message: 'Add items to cart to get personalized recommendations',
      };
    }

    // Get categories in cart
    const cartCategories = new Set(cartItems.map(item => item.category).filter(Boolean));
    const cartItemIds = new Set(cartItems.map(item => item.itemId));

    // Find frequently ordered together items
    // Query orders containing cart items
    const relatedOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            menuItemId: {
              in: Array.from(cartItemIds),
            },
          },
        },
        status: {
          in: ['DELIVERED', 'OUT_FOR_DELIVERY', 'READY'],
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count item frequency
    const itemFrequency: Record<string, { item: any; count: number }> = {};

    relatedOrders.forEach(order => {
      order.items.forEach(orderItem => {
        // Skip items already in cart or items without menuItemId
        if (!orderItem.menuItemId || cartItemIds.has(orderItem.menuItemId)) return;

        if (!itemFrequency[orderItem.menuItemId]) {
          itemFrequency[orderItem.menuItemId] = {
            item: orderItem.menuItem,
            count: 0,
          };
        }
        itemFrequency[orderItem.menuItemId].count++;
      });
    });

    // Sort by frequency and take top items
    const suggestions = Object.values(itemFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ item, count }) => ({
        id: item.id,
        name: item.name,
        price: `₹${item.price}`,
        category: item.category,
        orderedWithCount: count,
        percentage: Math.round((count / relatedOrders.length) * 100),
        reason: `${Math.round((count / relatedOrders.length) * 100)}% of customers who ordered these items also got ${item.name}`,
      }));

    // If no related orders, suggest popular items from missing categories
    if (suggestions.length === 0) {
      const missingCategories = ['Rice & Breads', 'Beverages', 'Desserts'].filter(
        cat => !cartCategories.has(cat)
      );

      if (missingCategories.length > 0) {
        const popularItems = await prisma.menuItem.findMany({
          where: {
            category: {
              in: missingCategories,
            },
            isAvailable: true,
            isPopular: true,
          },
          take: limit,
        });

        return {
          success: true,
          suggestions: popularItems.map(item => ({
            id: item.id,
            name: item.name,
            price: `₹${item.price}`,
            category: item.category,
            reason: `Popular ${item.category} choice`,
          })),
          message: 'Complete your meal with these popular items',
        };
      }
    }

    return {
      success: true,
      suggestions,
      message: suggestions.length > 0
        ? 'Customers who ordered these items also got:'
        : 'No specific recommendations at this time',
    };
  } catch (error) {
    console.error('Error suggesting cart completions:', error);
    return {
      success: false,
      error: 'Failed to get suggestions',
      suggestions: [],
    };
  }
}

/**
 * Check Cart Stock Status
 * GENIUS FEATURE: Validates cart before checkout
 */
export async function checkCartStockStatus(params: z.infer<typeof aiChatFunctions.checkCartStockStatus.parameters>) {
  try {
    const { cartItems } = params;

    if (!cartItems || cartItems.length === 0) {
      return {
        success: true,
        allAvailable: true,
        items: [],
      };
    }

    // Check each item
    const itemStatuses = await Promise.all(
      cartItems.map(async (cartItem) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: cartItem.itemId },
          select: {
            id: true,
            name: true,
            isAvailable: true,
            inventoryEnabled: true,
            inventory: true,
            price: true,
          },
        });

        if (!menuItem) {
          return {
            itemId: cartItem.itemId,
            name: cartItem.name,
            requestedQuantity: cartItem.quantity,
            available: false,
            reason: 'Item not found',
            status: 'not_found',
          };
        }

        if (!menuItem.isAvailable) {
          return {
            itemId: cartItem.itemId,
            name: menuItem.name,
            requestedQuantity: cartItem.quantity,
            available: false,
            reason: 'Item no longer available',
            status: 'unavailable',
          };
        }

        // Check inventory
        if (menuItem.inventoryEnabled) {
          const availableStock = cartTracker.getStockWithReservations(
            menuItem.id,
            menuItem.inventory
          );

          if (availableStock === 0) {
            return {
              itemId: cartItem.itemId,
              name: menuItem.name,
              requestedQuantity: cartItem.quantity,
              availableQuantity: 0,
              available: false,
              reason: 'Out of stock',
              status: 'out_of_stock',
            };
          }

          if (availableStock !== null && cartItem.quantity > availableStock) {
            return {
              itemId: cartItem.itemId,
              name: menuItem.name,
              requestedQuantity: cartItem.quantity,
              availableQuantity: availableStock,
              available: false,
              reason: `Only ${availableStock} available`,
              status: 'insufficient_stock',
            };
          }
        }

        // All checks passed
        return {
          itemId: cartItem.itemId,
          name: menuItem.name,
          requestedQuantity: cartItem.quantity,
          available: true,
          status: 'available',
          price: `₹${menuItem.price}`,
        };
      })
    );

    const unavailableItems = itemStatuses.filter(item => !item.available);
    const allAvailable = unavailableItems.length === 0;

    return {
      success: true,
      allAvailable,
      items: itemStatuses,
      unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined,
      message: allAvailable
        ? 'All items in your cart are available!'
        : `${unavailableItems.length} item(s) have stock issues`,
      canCheckout: allAvailable,
    };
  } catch (error) {
    console.error('Error checking cart stock status:', error);
    return {
      success: false,
      error: 'Failed to validate cart',
      canCheckout: false,
    };
  }
}

// ===== NEW CART MANIPULATION FUNCTION IMPLEMENTATIONS =====

/**
 * Add Item to Cart
 * GENIUS FEATURE: AI can add items directly to user cart
 */
export async function addItemToCart(params: z.infer<typeof aiChatFunctions.addItemToCart.parameters>) {
  try {
    const { sessionId, itemId, itemName, quantity } = params;

    // Call cart modification API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cart/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        action: 'add',
        itemId,
        quantity,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to add item to cart',
      };
    }

    return {
      success: true,
      message: `Successfully added ${quantity}x ${itemName} to cart!`,
      item: data.cart.item,
      action: 'cart_modified',
    };
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return {
      success: false,
      error: 'Failed to add item to cart. Please try again.',
    };
  }
}

/**
 * Remove Item from Cart
 * GENIUS FEATURE: AI can remove items on user request
 */
export async function removeItemFromCart(params: z.infer<typeof aiChatFunctions.removeItemFromCart.parameters>) {
  try {
    const { sessionId, itemId } = params;

    // Call cart modification API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cart/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        action: 'remove',
        itemId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to remove item from cart',
      };
    }

    return {
      success: true,
      message: 'Item removed from cart!',
      action: 'cart_modified',
    };
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return {
      success: false,
      error: 'Failed to remove item from cart. Please try again.',
    };
  }
}

/**
 * Proceed to Checkout
 * GENIUS FEATURE: AI signals frontend to open checkout
 */
export async function proceedToCheckout(params: z.infer<typeof aiChatFunctions.proceedToCheckout.parameters>) {
  try {
    const { sessionId } = params;

    return {
      success: true,
      message: 'Ready to checkout! Opening checkout page...',
      action: 'navigate_to_checkout',
      sessionId,
    };
  } catch (error) {
    console.error('Error proceeding to checkout:', error);
    return {
      success: false,
      error: 'Failed to proceed to checkout. Please try again.',
    };
  }
}

// ===== GENIUS 10/10 FUNCTION IMPLEMENTATIONS =====

/**
 * ALLERGEN MAP - Maps allergens to ingredients that contain them
 * This is CRITICAL for food safety
 */
const ALLERGEN_INGREDIENTS: Record<string, string[]> = {
  peanut: ['peanut', 'groundnut', 'arachis', 'goober'],
  nut: ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'chestnut', 'pine nut', 'brazil nut'],
  dairy: ['milk', 'cream', 'butter', 'ghee', 'cheese', 'paneer', 'yogurt', 'curd', 'dahi', 'khoya', 'mawa', 'whey', 'casein', 'lactose', 'malai'],
  egg: ['egg', 'mayonnaise', 'meringue', 'albumin'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scallop', 'clam', 'mussel', 'oyster'],
  wheat: ['wheat', 'flour', 'maida', 'atta', 'bread', 'naan', 'roti', 'paratha', 'chapati', 'semolina', 'suji', 'rava'],
  gluten: ['wheat', 'barley', 'rye', 'flour', 'maida', 'atta', 'bread', 'naan', 'semolina'],
  soy: ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh'],
  fish: ['fish', 'anchovy', 'salmon', 'tuna', 'cod', 'sardine', 'mackerel'],
  sesame: ['sesame', 'tahini', 'til'],
};

/**
 * Search Allergy-Free Items
 * CRITICAL SAFETY FUNCTION: Helps users with allergies find safe food
 */
export async function searchAllergyFree(params: z.infer<typeof aiChatFunctions.searchAllergyFree.parameters>) {
  try {
    const { allergens, category } = params;

    // Get all available menu items
    const where: any = { isAvailable: true };
    if (category) {
      where.category = { contains: category };
    }

    const allItems = await prisma.menuItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        ingredients: true,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        image: true,
      },
    });

    // Build list of ingredients to avoid
    const ingredientsToAvoid: string[] = [];
    for (const allergen of allergens) {
      const lowerAllergen = allergen.toLowerCase();
      if (ALLERGEN_INGREDIENTS[lowerAllergen]) {
        ingredientsToAvoid.push(...ALLERGEN_INGREDIENTS[lowerAllergen]);
      } else {
        // If allergen not in map, use it directly
        ingredientsToAvoid.push(lowerAllergen);
      }
    }

    // Filter items
    const safeItems: Array<{
      item: any;
      safetyLevel: 'HIGH' | 'MEDIUM' | 'VERIFY';
      reason: string;
    }> = [];

    const unsafeItems: Array<{
      item: any;
      reason: string;
    }> = [];

    for (const item of allItems) {
      const ingredientsLower = (item.ingredients || '').toLowerCase();
      const nameLower = item.name.toLowerCase();
      const descLower = (item.description || '').toLowerCase();

      // Check if any allergen ingredient is present
      let foundAllergen: string | null = null;
      for (const ingredient of ingredientsToAvoid) {
        if (ingredientsLower.includes(ingredient) ||
            nameLower.includes(ingredient) ||
            descLower.includes(ingredient)) {
          foundAllergen = ingredient;
          break;
        }
      }

      if (foundAllergen) {
        unsafeItems.push({
          item,
          reason: `Contains ${foundAllergen}`,
        });
      } else {
        // Determine safety level
        let safetyLevel: 'HIGH' | 'MEDIUM' | 'VERIFY' = 'MEDIUM';
        let reason = 'No known allergens detected';

        // Check for explicit flags
        if (allergens.includes('gluten') && item.isGlutenFree) {
          safetyLevel = 'HIGH';
          reason = 'Marked as gluten-free';
        } else if (allergens.includes('dairy') && item.isVegan) {
          safetyLevel = 'HIGH';
          reason = 'Vegan (no dairy)';
        } else if (!item.ingredients || item.ingredients.trim() === '') {
          safetyLevel = 'VERIFY';
          reason = 'Ingredients not listed - please verify with kitchen';
        }

        safeItems.push({
          item,
          safetyLevel,
          reason,
        });
      }
    }

    // Sort: HIGH safety first, then MEDIUM, then VERIFY
    safeItems.sort((a, b) => {
      const order = { 'HIGH': 0, 'MEDIUM': 1, 'VERIFY': 2 };
      return order[a.safetyLevel] - order[b.safetyLevel];
    });

    return {
      success: true,
      allergensChecked: allergens,
      safeItemsCount: safeItems.length,
      // CRITICAL: Always include safety warning
      safetyWarning: 'IMPORTANT: For severe allergies, always call +91 90104 60964 to confirm with our kitchen. Cross-contamination may occur.',
      safeItems: safeItems.slice(0, 10).map(({ item, safetyLevel, reason }) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priceFormatted: `₹${item.price}`,
        category: item.category,
        safetyLevel,
        safetyReason: reason,
        image: item.image,
      })),
      unsafeItemsCount: unsafeItems.length,
      // Show first few unsafe items so AI knows what to avoid mentioning
      unsafeItems: unsafeItems.slice(0, 5).map(({ item, reason }) => ({
        name: item.name,
        reason,
      })),
    };
  } catch (error) {
    console.error('Error searching allergy-free items:', error);
    return {
      success: false,
      error: 'Failed to search for allergy-safe items',
      safetyWarning: 'For allergy concerns, please call +91 90104 60964 directly.',
    };
  }
}

/**
 * PAIRING MAP - Smart food combinations
 */
const PAIRING_RULES: Record<string, { categories: string[]; items: string[]; reason: string }[]> = {
  // Curries pair with breads and rice
  'Main Course': [
    { categories: ['Rice & Breads'], items: [], reason: 'Every curry needs a carb companion!' },
    { categories: ['Beverages'], items: ['Lassi', 'Chaas'], reason: 'Cool drink to balance the spice' },
  ],
  // Biryanis are complete but pair with raita
  'Biryani': [
    { categories: [], items: ['Raita', 'Mirchi Ka Salan'], reason: 'Traditional biryani accompaniment' },
    { categories: ['Beverages'], items: [], reason: 'Something to sip' },
  ],
  // Appetizers lead to mains
  'Appetizers': [
    { categories: ['Main Course'], items: [], reason: 'Start light, go big!' },
  ],
  // Breads go with everything gravy
  'Rice & Breads': [
    { categories: ['Main Course'], items: [], reason: 'Bread needs a dip!' },
  ],
};

/**
 * Get Smart Combo Suggestions
 * GENIUS: Suggests perfect food pairings
 */
export async function getSmartCombo(params: z.infer<typeof aiChatFunctions.getSmartCombo.parameters>) {
  try {
    const { mainItemId, budget, isVegetarian } = params;

    // Get the main item
    const mainItem = await prisma.menuItem.findUnique({
      where: { id: mainItemId },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        isVegetarian: true,
        spicyLevel: true,
      },
    });

    if (!mainItem) {
      return {
        success: false,
        error: 'Main item not found',
      };
    }

    // Determine pairing rules based on category
    const rules = PAIRING_RULES[mainItem.category] || PAIRING_RULES['Main Course'];

    // Build suggestions
    const suggestions: Array<{
      item: any;
      reason: string;
      comboPrice: number;
    }> = [];

    for (const rule of rules) {
      // Find items matching this rule
      const where: any = {
        isAvailable: true,
        id: { not: mainItemId }, // Don't suggest the same item
      };

      // Apply vegetarian filter if main item is veg or user wants veg
      if (mainItem.isVegetarian || isVegetarian) {
        where.isVegetarian = true;
      }

      // Apply budget filter
      if (budget) {
        const remainingBudget = budget - mainItem.price;
        if (remainingBudget > 0) {
          where.price = { lte: remainingBudget };
        }
      }

      // Category or specific item filter
      if (rule.categories.length > 0) {
        where.category = { in: rule.categories };
      } else if (rule.items.length > 0) {
        where.name = { in: rule.items };
      }

      const matchingItems = await prisma.menuItem.findMany({
        where,
        take: 3,
        orderBy: { isPopular: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          image: true,
        },
      });

      for (const item of matchingItems) {
        suggestions.push({
          item,
          reason: rule.reason,
          comboPrice: mainItem.price + item.price,
        });
      }
    }

    // Calculate combo deals
    const comboSuggestions = suggestions.slice(0, 5).map(s => ({
      id: s.item.id,
      name: s.item.name,
      price: s.item.price,
      priceFormatted: `₹${s.item.price}`,
      category: s.item.category,
      image: s.item.image,
      pairingReason: s.reason,
      comboTotal: s.comboPrice,
      comboTotalFormatted: `₹${s.comboPrice}`,
      // Check if combo qualifies for free delivery
      freeDelivery: s.comboPrice >= 499,
    }));

    return {
      success: true,
      mainItem: {
        name: mainItem.name,
        price: mainItem.price,
        priceFormatted: `₹${mainItem.price}`,
        category: mainItem.category,
      },
      suggestions: comboSuggestions,
      comboTip: comboSuggestions.some(s => s.freeDelivery)
        ? 'Add any of these for FREE DELIVERY!'
        : `Add ₹${499 - mainItem.price} more for free delivery`,
    };
  } catch (error) {
    console.error('Error getting smart combo:', error);
    return {
      success: false,
      error: 'Failed to get combo suggestions',
    };
  }
}

/**
 * Decision Helper
 * GENIUS: Helps indecisive customers choose
 */
export async function getDecisionHelper(params: z.infer<typeof aiChatFunctions.getDecisionHelper.parameters>) {
  try {
    const { preferences } = params;

    // Build query based on preferences
    const where: any = { isAvailable: true };

    if (preferences?.isVegetarian) {
      where.isVegetarian = true;
    }

    if (preferences?.spiceLevel) {
      const spiceLevels = { mild: 1, medium: 2, hot: 4 };
      where.spicyLevel = { lte: spiceLevels[preferences.spiceLevel] };
    }

    if (preferences?.mealType) {
      const calorieRanges = {
        light: { lte: 300 },
        balanced: { gte: 300, lte: 500 },
        heavy: { gte: 400 },
      };
      where.calories = calorieRanges[preferences.mealType];
    }

    if (preferences?.budget) {
      const budgetRanges = {
        low: { lte: 200 },
        medium: { gte: 150, lte: 350 },
        high: { gte: 300 },
      };
      where.price = budgetRanges[preferences.budget];
    }

    // Get matching items
    const items = await prisma.menuItem.findMany({
      where,
      take: 10,
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        image: true,
        isVegetarian: true,
        spicyLevel: true,
        calories: true,
        isPopular: true,
      },
    });

    // If no preferences, get bestsellers
    if (!preferences || Object.keys(preferences).length === 0) {
      const bestsellers = await prisma.menuItem.findMany({
        where: { isAvailable: true, isPopular: true },
        take: 5,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          image: true,
          isVegetarian: true,
          spicyLevel: true,
        },
      });

      return {
        success: true,
        preferencesUsed: false,
        message: "Not sure what you want? Here are our crowd favorites:",
        recommendations: bestsellers.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          priceFormatted: `₹${item.price}`,
          category: item.category,
          image: item.image,
          whyThisItem: 'Customer favorite!',
        })),
        followUpQuestion: 'Want me to narrow it down? Tell me: veg or non-veg? Spicy or mild?',
      };
    }

    // Build personalized recommendations
    const recommendations = items.slice(0, 5).map(item => {
      // Build reason based on preferences matched
      const reasons: string[] = [];
      if (preferences.isVegetarian && item.isVegetarian) reasons.push('vegetarian');
      if (preferences.spiceLevel === 'mild' && item.spicyLevel <= 1) reasons.push('mild');
      if (preferences.spiceLevel === 'hot' && item.spicyLevel >= 3) reasons.push('spicy');
      if (preferences.mealType === 'light' && item.calories && item.calories <= 300) reasons.push('light');
      if (item.isPopular) reasons.push('popular');

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        priceFormatted: `₹${item.price}`,
        category: item.category,
        image: item.image,
        whyThisItem: reasons.length > 0
          ? `Matches your preference: ${reasons.join(', ')}`
          : 'Great choice!',
      };
    });

    return {
      success: true,
      preferencesUsed: true,
      preferencesApplied: preferences,
      message: `Based on what you like, here are my picks:`,
      recommendations,
      topPick: recommendations[0],
      followUpQuestion: recommendations.length > 0
        ? `My top pick: ${recommendations[0].name} at ₹${recommendations[0].price}. Want it?`
        : 'Nothing matched exactly. Want me to show you our bestsellers instead?',
    };
  } catch (error) {
    console.error('Error in decision helper:', error);
    return {
      success: false,
      error: 'Failed to get recommendations',
      fallback: 'Try our Butter Chicken (₹299) - 9/10 customers love it!',
    };
  }
}

