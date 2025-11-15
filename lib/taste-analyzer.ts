/**
 * TASTE ANALYZER - Culinary Intelligence Engine
 * 
 * Purpose: Analyze customer order history to build flavor profiles and taste preferences
 * 
 * Features:
 * - Calculate 8-dimensional taste profile (Spicy, Creamy, Tangy, Sweet, Smoky, Herbal, Rich, Light)
 * - Identify dominant flavor archetype ("Spice Warrior", "Creamy Soul", etc.)
 * - Calculate menu exploration score
 * - Detect favorite categories and dishes
 * - Track order patterns (time, frequency, seasonality)
 * 
 * Architecture: Pure functions with no side effects, data-driven analysis
 * Inspired by: Netflix recommendation engine + Spotify taste profiles
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  Flame,
  Droplets,
  Zap,
  Candy,
  Wind,
  Sprout,
  Crown,
  Feather,
  Scale,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Taste dimensions (0-100 scale)
export interface TasteProfile {
  spicy: number;      // Heat level preference
  creamy: number;     // Rich, dairy-based dishes
  tangy: number;      // Sour, citrus, tamarind
  sweet: number;      // Sugar, jaggery, honey
  smoky: number;      // Tandoor, charred, BBQ
  herbal: number;     // Coriander, mint, curry leaves
  rich: number;       // Butter, ghee, heavy gravies
  light: number;      // Healthy, low-cal, steamed
}

export interface FlavorArchetype {
  name: string;
  description: string;
  icon?: LucideIcon;  // Icon component (preferred)
  emoji?: string;     // Deprecated, kept for backward compatibility
}

export interface ExplorationStats {
  totalDishes: number;        // Unique dishes ordered
  totalMenuItems: number;     // Total menu items available
  explorationPercentage: number;
  categoriesExplored: string[];
  totalCategories: number;
  explorerRank: string;       // Novice, Enthusiast, Connoisseur, Master, Legend
}

export interface FavoriteDish {
  dishId: string;
  dishName: string;
  category: string;
  orderCount: number;
  lastOrdered: Date;
  totalSpent: number;
  image?: string;
}

export interface OrderPattern {
  favoriteDay: string;        // Monday, Tuesday, etc.
  favoriteTime: string;        // Morning, Afternoon, Evening, Night
  averageOrderValue: number;
  orderFrequency: string;      // Weekly, Bi-weekly, Monthly
  lastOrderDate: Date | null;
  daysSinceLastOrder: number;
}

export interface TasteAnalysisResult {
  tasteProfile: TasteProfile;
  flavorArchetype: FlavorArchetype;
  explorationStats: ExplorationStats;
  favoriteDishes: FavoriteDish[];
  orderPatterns: OrderPattern;
}

/**
 * Flavor mapping: Map menu item characteristics to taste dimensions
 * This would ideally come from MenuItem metadata, but we'll infer from names/categories
 */
const FLAVOR_KEYWORDS: Record<keyof TasteProfile, string[]> = {
  spicy: ['spicy', 'chili', 'hot', 'vindaloo', 'madras', 'pepper', 'jalfrezi'],
  creamy: ['butter', 'cream', 'paneer', 'korma', 'makhani', 'malai', 'coconut'],
  tangy: ['lemon', 'tamarind', 'tomato', 'sour', 'pickle', 'achaar'],
  sweet: ['sweet', 'mango', 'gulab', 'kheer', 'rasmalai', 'lassi', 'dessert'],
  smoky: ['tandoor', 'tikka', 'kebab', 'grilled', 'bbq', 'charcoal'],
  herbal: ['coriander', 'mint', 'basil', 'curry', 'herb', 'green'],
  rich: ['butter', 'ghee', 'rich', 'dum', 'biryani', 'mughlai', 'royal'],
  light: ['steamed', 'grilled', 'salad', 'soup', 'light', 'healthy', 'low-cal'],
};

/**
 * Flavor archetypes based on dominant taste dimensions
 */
const FLAVOR_ARCHETYPES: FlavorArchetype[] = [
  {
    name: 'Spice Warrior',
    description: 'You fearlessly embrace the heat! Bold flavors and fiery spices are your calling.',
    icon: Flame,
  },
  {
    name: 'Creamy Soul',
    description: 'Rich, velvety textures make your heart sing. Comfort food is your love language.',
    icon: Droplets,
  },
  {
    name: 'Tangy Explorer',
    description: 'Bright, zesty flavors excite your palate. You love the complexity of sour notes.',
    icon: Zap,
  },
  {
    name: 'Sweet Seeker',
    description: 'Life is sweeter with desserts! You appreciate the art of confectionery.',
    icon: Candy,
  },
  {
    name: 'Smoke Master',
    description: 'Charred, grilled perfection is your signature. Tandoor magic speaks to your soul.',
    icon: Wind,
  },
  {
    name: 'Herb Enthusiast',
    description: 'Fresh, aromatic herbs delight you. You appreciate the garden in every bite.',
    icon: Sprout,
  },
  {
    name: 'Royal Gourmet',
    description: 'Opulent, rich dishes worthy of royalty. You dine like a Maharaja!',
    icon: Crown,
  },
  {
    name: 'Light Balance',
    description: 'Mindful eating is your path. You seek harmony between taste and wellness.',
    icon: Feather,
  },
  {
    name: 'Balanced Foodie',
    description: 'You appreciate all flavors equally. A true connoisseur of culinary diversity!',
    icon: Scale,
  },
];

/**
 * Calculate taste profile from order history
 */
export async function analyzeTasteProfile(customerId: string): Promise<TasteAnalysisResult> {
  try {
    logger.info('Analyzing taste profile', { customerId });

    // Fetch customer orders with menu items
    let orders;
    try {
      orders = await prisma.order.findMany({
        where: {
          customerId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError) {
      logger.error('Database query failed in taste analyzer', {
        customerId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      // Return default profile if database query fails
      return getDefaultTasteProfile();
    }

    logger.info('Orders fetched for analysis', { customerId, orderCount: orders.length });

    // If no orders, return default profile
    if (!orders || orders.length === 0) {
      logger.info('No orders found, returning default profile', { customerId });
      return getDefaultTasteProfile();
    }

    // Calculate taste dimensions
    const tasteProfile = calculateTasteDimensions(orders);

    // Determine flavor archetype
    const flavorArchetype = determineFlavorArchetype(tasteProfile);

    // Calculate exploration stats
    const explorationStats = await calculateExplorationStats(customerId, orders);

    // Get favorite dishes
    const favoriteDishes = calculateFavoriteDishes(orders);

    // Analyze order patterns
    const orderPatterns = analyzeOrderPatterns(orders);

    logger.info('Taste analysis complete', { customerId });

    return {
      tasteProfile,
      flavorArchetype,
      explorationStats,
      favoriteDishes,
      orderPatterns,
    };
  } catch (error) {
    logger.error('Failed to analyze taste profile', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return default profile instead of throwing
    return getDefaultTasteProfile();
  }
}

/**
 * Calculate taste dimensions based on ordered items
 */
function calculateTasteDimensions(orders: any[]): TasteProfile {
  const dimensionScores: Record<keyof TasteProfile, number> = {
    spicy: 0,
    creamy: 0,
    tangy: 0,
    sweet: 0,
    smoky: 0,
    herbal: 0,
    rich: 0,
    light: 0,
  };

  let totalItems = 0;

  // Analyze each ordered item
  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const menuItem = item.menuItem;
      const searchText = `${menuItem.name} ${menuItem.description || ''} ${menuItem.category}`.toLowerCase();

      // Check for flavor keywords and increment scores
      (Object.keys(FLAVOR_KEYWORDS) as (keyof TasteProfile)[]).forEach((dimension) => {
        const keywords = FLAVOR_KEYWORDS[dimension];
        const matchCount = keywords.filter((keyword) => searchText.includes(keyword)).length;
        
        if (matchCount > 0) {
          // Weight by quantity ordered
          dimensionScores[dimension] += item.quantity * matchCount;
        }
      });

      totalItems += item.quantity;
    });
  });

  // Normalize scores to 0-100 scale
  const profile: TasteProfile = {} as TasteProfile;
  
  if (totalItems > 0) {
    (Object.keys(dimensionScores) as (keyof TasteProfile)[]).forEach((dimension) => {
      // Normalize and cap at 100
      profile[dimension] = Math.min(100, Math.round((dimensionScores[dimension] / totalItems) * 100));
    });
  } else {
    // Default balanced profile
    (Object.keys(dimensionScores) as (keyof TasteProfile)[]).forEach((dimension) => {
      profile[dimension] = 50;
    });
  }

  return profile;
}

/**
 * Determine flavor archetype from taste profile
 */
function determineFlavorArchetype(profile: TasteProfile): FlavorArchetype {
  // Find dominant dimension
  const dimensions: (keyof TasteProfile)[] = ['spicy', 'creamy', 'tangy', 'sweet', 'smoky', 'herbal', 'rich', 'light'];
  
  let maxScore = 0;
  let dominantDimension: keyof TasteProfile | null = null;

  dimensions.forEach((dimension) => {
    if (profile[dimension] > maxScore) {
      maxScore = profile[dimension];
      dominantDimension = dimension;
    }
  });

  // Check if profile is balanced (no dominant dimension)
  const variance = calculateVariance(Object.values(profile));
  if (variance < 200) {
    // Low variance = balanced profile
    return FLAVOR_ARCHETYPES[8]; // Balanced Foodie
  }

  // Map dimension to archetype
  const archetypeMap: Record<keyof TasteProfile, number> = {
    spicy: 0,
    creamy: 1,
    tangy: 2,
    sweet: 3,
    smoky: 4,
    herbal: 5,
    rich: 6,
    light: 7,
  };

  const archetypeIndex = dominantDimension ? archetypeMap[dominantDimension] : 8;
  return FLAVOR_ARCHETYPES[archetypeIndex];
}

/**
 * Calculate variance of an array
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  return squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate exploration statistics
 */
async function calculateExplorationStats(customerId: string, orders: any[]): Promise<ExplorationStats> {
  try {
    // Get unique dishes ordered and categories explored
    const uniqueDishes = new Set<string>();
    const categoriesExplored = new Set<string>();

    logger.info('Calculating exploration stats', {
      customerId,
      orderCount: orders.length,
    });

    // Extract unique dishes and categories from orders
    orders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) {
        logger.warn('Order has no items array', { orderId: order.id });
        return;
      }

      order.items.forEach((item: any) => {
        if (!item) {
          logger.warn('Invalid order item', { orderId: order.id });
          return;
        }

        // Add the menu item ID
        if (item.menuItemId) {
          uniqueDishes.add(item.menuItemId);
        }

        // Add category if menuItem exists
        if (item.menuItem && item.menuItem.category) {
          categoriesExplored.add(item.menuItem.category);
        } else {
          logger.warn('Order item missing menuItem or category', {
            orderId: order.id,
            itemId: item.id,
            hasMenuItem: !!item.menuItem,
            category: item.menuItem?.category,
          });
        }
      });
    });

    logger.info('Dishes and categories extracted', {
      customerId,
      uniqueDishCount: uniqueDishes.size,
      categoriesCount: categoriesExplored.size,
      categories: Array.from(categoriesExplored),
    });

    // Get total menu items available
    const totalMenuItems = await prisma.menuItem.count({
      where: { isAvailable: true },
    });

    // Get total categories (all unique categories in the menu)
    const allCategories = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: { category: true },
      distinct: ['category'],
    });

    logger.info('Menu stats fetched', {
      totalMenuItems,
      totalCategories: allCategories.length,
      allCategoriesList: allCategories.map(c => c.category),
    });

    const explorationPercentage = totalMenuItems > 0 
      ? Math.round((uniqueDishes.size / totalMenuItems) * 100)
      : 0;

    // Determine explorer rank
    const explorerRank = getExplorerRank(orders.length, explorationPercentage);

    const result = {
      totalDishes: uniqueDishes.size,
      totalMenuItems,
      explorationPercentage,
      categoriesExplored: Array.from(categoriesExplored),
      totalCategories: allCategories.length,
      explorerRank,
    };

    logger.info('Exploration stats calculated', {
      customerId,
      result,
    });

    return result;
  } catch (error) {
    logger.error('Error calculating exploration stats', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return safe defaults on error
    return {
      totalDishes: 0,
      totalMenuItems: 45,
      explorationPercentage: 0,
      categoriesExplored: [],
      totalCategories: 7,
      explorerRank: 'Novice',
    };
  }
}

/**
 * Determine explorer rank based on orders and exploration
 */
function getExplorerRank(orderCount: number, explorationPercentage: number): string {
  const score = orderCount * 0.7 + explorationPercentage * 0.3;

  if (score >= 80) return 'Legend';
  if (score >= 60) return 'Master';
  if (score >= 40) return 'Connoisseur';
  if (score >= 20) return 'Enthusiast';
  return 'Novice';
}

/**
 * Calculate favorite dishes
 */
function calculateFavoriteDishes(orders: any[]): FavoriteDish[] {
  const dishMap = new Map<string, { item: any; count: number; totalSpent: number; lastOrdered: Date }>();

  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const dishId = item.menuItemId;
      const existing = dishMap.get(dishId);

      if (existing) {
        existing.count += item.quantity;
        existing.totalSpent += item.subtotal;
        if (new Date(order.createdAt) > existing.lastOrdered) {
          existing.lastOrdered = new Date(order.createdAt);
        }
      } else {
        dishMap.set(dishId, {
          item: item.menuItem,
          count: item.quantity,
          totalSpent: item.subtotal,
          lastOrdered: new Date(order.createdAt),
        });
      }
    });
  });

  // Convert to array and sort by count
  const favorites: FavoriteDish[] = Array.from(dishMap.entries())
    .map(([dishId, data]) => ({
      dishId,
      dishName: data.item.name,
      category: data.item.category,
      orderCount: data.count,
      lastOrdered: data.lastOrdered,
      totalSpent: data.totalSpent,
      image: data.item.image,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5); // Top 5 favorites

  return favorites;
}

/**
 * Analyze order patterns
 */
function analyzeOrderPatterns(orders: any[]): OrderPattern {
  if (orders.length === 0) {
    return {
      favoriteDay: 'Not enough data',
      favoriteTime: 'Not enough data',
      averageOrderValue: 0,
      orderFrequency: 'New customer',
      lastOrderDate: null,
      daysSinceLastOrder: 0,
    };
  }

  // Analyze day of week
  const dayCount: Record<string, number> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  orders.forEach((order) => {
    const dayIndex = new Date(order.createdAt).getDay();
    const dayName = days[dayIndex];
    dayCount[dayName] = (dayCount[dayName] || 0) + 1;
  });

  const favoriteDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Not enough data';

  // Analyze time of day
  const timeCount: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };

  orders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    if (hour >= 5 && hour < 12) timeCount.Morning++;
    else if (hour >= 12 && hour < 17) timeCount.Afternoon++;
    else if (hour >= 17 && hour < 21) timeCount.Evening++;
    else timeCount.Night++;
  });

  const favoriteTime = Object.entries(timeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Not enough data';

  // Calculate average order value
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalSpent / orders.length;

  // Calculate order frequency
  const lastOrderDate = new Date(orders[0].createdAt);
  const firstOrderDate = new Date(orders[orders.length - 1].createdAt);
  const daysBetween = Math.max(1, Math.ceil((lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)));
  const ordersPerDay = orders.length / daysBetween;

  let orderFrequency: string;
  if (ordersPerDay >= 0.5) orderFrequency = 'Multiple times per week';
  else if (ordersPerDay >= 0.14) orderFrequency = 'Weekly';
  else if (ordersPerDay >= 0.07) orderFrequency = 'Bi-weekly';
  else orderFrequency = 'Monthly';

  // Days since last order
  const now = new Date();
  const daysSinceLastOrder = Math.ceil((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    favoriteDay,
    favoriteTime,
    averageOrderValue,
    orderFrequency,
    lastOrderDate,
    daysSinceLastOrder,
  };
}

/**
 * Default taste profile for new customers
 */
function getDefaultTasteProfile(): TasteAnalysisResult {
  return {
    tasteProfile: {
      spicy: 50,
      creamy: 50,
      tangy: 50,
      sweet: 50,
      smoky: 50,
      herbal: 50,
      rich: 50,
      light: 50,
    },
    flavorArchetype: {
      name: 'New Explorer',
      description: 'Your culinary journey is just beginning! Order to discover your taste profile.',
      icon: MapPin,
    },
    explorationStats: {
      totalDishes: 0,
      totalMenuItems: 0,
      explorationPercentage: 0,
      categoriesExplored: [],
      totalCategories: 0,
      explorerRank: 'Novice',
    },
    favoriteDishes: [],
    orderPatterns: {
      favoriteDay: 'Not enough data',
      favoriteTime: 'Not enough data',
      averageOrderValue: 0,
      orderFrequency: 'New customer',
      lastOrderDate: null,
      daysSinceLastOrder: 0,
    },
  };
}

