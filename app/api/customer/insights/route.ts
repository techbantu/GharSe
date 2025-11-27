/**
 * API ENDPOINT: GET /api/customer/insights
 * 
 * Purpose: Generate smart insights about customer ordering behavior
 * 
 * Features:
 * - Monthly spending trends
 * - Favorite dishes with reorder data
 * - Category exploration stats
 * - Order pattern analysis
 * - Savings from discounts/coupons
 * - Next order prediction
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface MonthlySpending {
  month: string;
  amount: number;
  orderCount: number;
}

interface CategoryExploration {
  category: string;
  orderCount: number;
  percentageOfTotal: number;
  iconName: string; // Icon name for Lucide icons
}

interface Savings {
  totalDiscounts: number;
  totalCoupons: number;
  totalSavings: number;
}

interface Insights {
  monthlySpending: MonthlySpending[];
  averageOrderValue: number;
  totalSpent: number;
  savings: Savings;
  categoryExploration: CategoryExploration[];
  favoriteTimeOfDay: string;
  favoriteDay: string;
  orderFrequency: string;
  nextOrderPrediction: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const customerId = decoded.customerId;

    logger.info('Generating customer insights', { customerId });

    // Fetch customer data
    let customer;
    try {
      customer = await (prisma.customer.findUnique as any)({
        where: { id: customerId },
        select: {
          totalSpent: true,
          totalOrders: true,
        },
      });
    } catch (dbError) {
      logger.error('Database query failed for customer', {
        customerId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (!customer) {
      // Return default insights for new customer
      customer = { totalSpent: 0, totalOrders: 0 };
    }

    // Fetch orders with items
    // Include all non-cancelled orders for pattern analysis
    let orders: any[];
    try {
      orders = await (prisma.order.findMany as any)({
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
      logger.error('Database query failed for orders', {
        customerId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      orders = [];
    }

    // CRITICAL FIX: Calculate spending from DELIVERED orders only
    // Previously used customer.totalSpent which was never being updated
    const deliveredOrders = orders.filter((order: any) => order.status === 'DELIVERED');
    const totalSpentFromOrders = deliveredOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const deliveredOrderCount = deliveredOrders.length;

    // Calculate monthly spending (last 6 months) - use all non-cancelled orders for trends
    const monthlySpending = calculateMonthlySpending(orders);

    // Calculate average order value from delivered orders only
    const averageOrderValue = deliveredOrderCount > 0
      ? totalSpentFromOrders / deliveredOrderCount
      : 0;

    // Calculate savings
    const savings = calculateSavings(orders);

    // Analyze category exploration
    const categoryExploration = analyzeCategoryExploration(orders);

    // Analyze time patterns
    const { favoriteTimeOfDay, favoriteDay, orderFrequency } = analyzeTimePatterns(orders);

    // Predict next order
    const nextOrderPrediction = predictNextOrder(orders);

    const insights: Insights = {
      monthlySpending,
      averageOrderValue,
      totalSpent: totalSpentFromOrders, // Use calculated value from DELIVERED orders
      savings,
      categoryExploration,
      favoriteTimeOfDay,
      favoriteDay,
      orderFrequency,
      nextOrderPrediction,
    };

    logger.info('Insights generated successfully', {
      customerId,
      totalOrders: orders.length,
      deliveredOrders: deliveredOrderCount,
      totalSpent: totalSpentFromOrders,
      averageOrderValue,
    });

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error('Failed to generate insights', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate monthly spending for last 6 months
 */
function calculateMonthlySpending(orders: any[]): MonthlySpending[] {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyData: Record<string, { amount: number; count: number }> = {};

  orders.forEach((order: any) => {
    const orderDate = new Date(order.createdAt);
    
    if (orderDate >= sixMonthsAgo) {
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      
      monthlyData[monthKey].amount += order.total;
      monthlyData[monthKey].count++;
    }
  });

  // Generate array for last 6 months (fill missing months with 0)
  const result: MonthlySpending[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    result.push({
      month: monthName,
      amount: monthlyData[monthKey]?.amount || 0,
      orderCount: monthlyData[monthKey]?.count || 0,
    });
  }

  return result;
}

/**
 * Calculate savings from discounts and coupons
 */
function calculateSavings(orders: any[]): Savings {
  let totalDiscounts = 0;
  let totalCoupons = 0;

  orders.forEach((order: any) => {
    totalDiscounts += order.discount || 0;
    // Coupons are tracked in discount field for now
    // In future, separate coupon tracking
  });

  return {
    totalDiscounts,
    totalCoupons: totalDiscounts, // Same for now
    totalSavings: totalDiscounts,
  };
}

/**
 * Analyze category exploration
 */
function analyzeCategoryExploration(orders: any[]): CategoryExploration[] {
  const categoryCount: Record<string, number> = {};
  let totalItems = 0;

  orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const category = item.menuItem.category;
      categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
      totalItems += item.quantity;
    });
  });

  // Map categories to Lucide icon names
  const categoryIcons: Record<string, string> = {
    'Appetizers': 'cookie',
    'Curries': 'soup',
    'Biryanis': 'beef',
    'Biryani & Rice': 'beef',
    'Rice': 'beef',
    'Breads': 'wheat',
    'Desserts': 'cake',
    'Beverages': 'cup-soda',
    'Snacks': 'popcorn',
    'Specials': 'star',
    'Default': 'utensils-crossed'
  };

  return Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      orderCount: count,
      percentageOfTotal: Math.round((count / totalItems) * 100),
      iconName: categoryIcons[category] || categoryIcons['Default'],
    }))
    .sort((a, b) => b.orderCount - a.orderCount);
}

/**
 * Analyze time patterns
 */
function analyzeTimePatterns(orders: any[]): {
  favoriteTimeOfDay: string;
  favoriteDay: string;
  orderFrequency: string;
} {
  if (orders.length === 0) {
    return {
      favoriteTimeOfDay: 'Not enough data',
      favoriteDay: 'Not enough data',
      orderFrequency: 'New customer',
    };
  }

  // Analyze time of day
  const timeCount: Record<string, number> = {
    'Morning (6am-12pm)': 0,
    'Afternoon (12pm-5pm)': 0,
    'Evening (5pm-9pm)': 0,
    'Night (9pm-6am)': 0,
  };

  // Analyze day of week
  const dayCount: Record<string, number> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  orders.forEach((order: any) => {
    const date = new Date(order.createdAt);
    const hour = date.getHours();
    const dayName = days[date.getDay()];

    // Categorize time
    if (hour >= 6 && hour < 12) timeCount['Morning (6am-12pm)']++;
    else if (hour >= 12 && hour < 17) timeCount['Afternoon (12pm-5pm)']++;
    else if (hour >= 17 && hour < 21) timeCount['Evening (5pm-9pm)']++;
    else timeCount['Night (9pm-6am)']++;

    dayCount[dayName] = (dayCount[dayName] || 0) + 1;
  });

  const favoriteTimeOfDay = Object.entries(timeCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Not enough data';

  const favoriteDay = Object.entries(dayCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Not enough data';

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

  return {
    favoriteTimeOfDay,
    favoriteDay,
    orderFrequency,
  };
}

/**
 * Predict next order timeframe
 */
function predictNextOrder(orders: any[]): string {
  if (orders.length === 0) {
    return 'Start your culinary journey today!';
  }

  if (orders.length === 1) {
    return 'Ready for your next delicious meal?';
  }

  // Calculate average days between orders
  let totalDaysBetween = 0;
  
  for (let i = 0; i < orders.length - 1; i++) {
    const date1 = new Date(orders[i].createdAt);
    const date2 = new Date(orders[i + 1].createdAt);
    const daysBetween = Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    totalDaysBetween += daysBetween;
  }

  const avgDaysBetween = totalDaysBetween / (orders.length - 1);

  // Calculate days since last order
  const lastOrderDate = new Date(orders[0].createdAt);
  const now = new Date();
  const daysSinceLastOrder = Math.ceil((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLastOrder >= avgDaysBetween * 1.5) {
    return 'We miss you! Time for another order?';
  } else if (daysSinceLastOrder >= avgDaysBetween) {
    return 'Based on your pattern, you might be craving something soon!';
  } else {
    const daysUntilNext = Math.ceil(avgDaysBetween - daysSinceLastOrder);
    return `You usually order in about ${daysUntilNext} days`;
  }
}

