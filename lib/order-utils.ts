/**
 * ORDER UTILITY FUNCTIONS
 * 
 * Helper functions for order management, filtering, and display logic.
 * Used throughout the admin dashboard for consistent order handling.
 */

import { Order, OrderStatus } from '@/types';
import { format, isToday, isYesterday, differenceInMinutes, differenceInHours, parseISO } from 'date-fns';

/**
 * Check if an order is delayed (pending for more than 10 minutes)
 */
export function isOrderDelayed(order: Order): boolean {
  if (order.status !== 'pending') return false;
  
  const orderTime = typeof order.createdAt === 'string' 
    ? parseISO(order.createdAt) 
    : new Date(order.createdAt);
  
  const minutesSinceOrder = differenceInMinutes(new Date(), orderTime);
  return minutesSinceOrder > 10;
}

/**
 * Check if an order has been waiting too long (ready for more than 30 minutes)
 */
export function isOrderWaitingLong(order: Order): boolean {
  if (order.status !== 'ready') return false;
  
  const orderTime = typeof order.createdAt === 'string' 
    ? parseISO(order.createdAt) 
    : new Date(order.createdAt);
  
  const minutesSinceReady = differenceInMinutes(new Date(), orderTime);
  return minutesSinceReady > 30;
}

/**
 * Group orders by date
 * Returns an object with date strings as keys and arrays of orders as values
 */
export function groupOrdersByDate(orders: Order[]): Record<string, Order[]> {
  const grouped: Record<string, Order[]> = {};
  
  orders.forEach(order => {
    const orderDate = typeof order.createdAt === 'string' 
      ? parseISO(order.createdAt) 
      : new Date(order.createdAt);
    
    const dateKey = format(orderDate, 'yyyy-MM-dd');
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(order);
  });
  
  // Sort each group by time (most recent first)
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  });
  
  return grouped;
}

/**
 * Format order time in a smart, human-readable way
 */
export function formatOrderTime(date: Date | string): string {
  const orderDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(orderDate)) {
    return format(orderDate, 'h:mm a');
  } else if (isYesterday(orderDate)) {
    return `Yesterday ${format(orderDate, 'h:mm a')}`;
  } else {
    return format(orderDate, 'MMM d, h:mm a');
  }
}

/**
 * Format date for section headers
 */
export function formatDateHeader(date: Date | string): string {
  const orderDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(orderDate)) {
    return 'Today';
  } else if (isYesterday(orderDate)) {
    return 'Yesterday';
  } else {
    return format(orderDate, 'EEEE, MMM d');
  }
}

/**
 * Get time ago string (e.g., "5 minutes ago", "2 hours ago")
 */
export function getTimeAgo(date: Date | string): string {
  const orderDate = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  
  const minutesAgo = differenceInMinutes(now, orderDate);
  const hoursAgo = differenceInHours(now, orderDate);
  
  if (minutesAgo < 1) {
    return 'Just now';
  } else if (minutesAgo < 60) {
    return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hoursAgo < 24) {
    return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return formatOrderTime(orderDate);
  }
}

/**
 * Check if order is from today
 */
export function isOrderToday(order: Order): boolean {
  const orderDate = typeof order.createdAt === 'string' 
    ? parseISO(order.createdAt) 
    : new Date(order.createdAt);
  return isToday(orderDate);
}

/**
 * Check if order is active (needs attention)
 */
export function isOrderActive(order: Order): boolean {
  return ['pending', 'preparing', 'ready'].includes(order.status);
}

/**
 * Check if order is completed (actually fulfilled, not cancelled)
 * Only counts orders that represent actual revenue
 */
export function isOrderCompleted(order: Order): boolean {
  return ['delivered', 'picked-up'].includes(order.status);
}

/**
 * Check if order is closed (completed OR cancelled)
 * Use this for historical records, not revenue calculations
 */
export function isOrderClosed(order: Order): boolean {
  return ['delivered', 'picked-up', 'cancelled', 'refunded'].includes(order.status);
}

/**
 * Get priority level for order (1 = highest priority)
 */
export function getOrderPriority(order: Order): number {
  // Delayed pending orders are highest priority
  if (isOrderDelayed(order)) return 1;
  
  // Orders waiting too long
  if (isOrderWaitingLong(order)) return 2;
  
  // Regular pending orders
  if (order.status === 'pending') return 3;
  
  // Preparing orders
  if (order.status === 'preparing') return 4;
  
  // Ready orders
  if (order.status === 'ready') return 5;
  
  // Completed orders
  return 6;
}

/**
 * Sort orders by priority and time
 */
export function sortOrdersByPriority(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    // First sort by priority
    const priorityDiff = getOrderPriority(a) - getOrderPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by time (most recent first)
    const dateA = typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(a.createdAt);
    const dateB = typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Calculate total amount for orders
 */
export function calculateOrdersTotal(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + order.pricing.total, 0);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'red';
    case 'preparing':
      return 'yellow';
    case 'ready':
      return 'green';
    case 'delivered':
      return 'blue';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get status display text
 */
export function getStatusText(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Filter orders by search query
 */
export function filterOrdersBySearch(orders: Order[], query: string): Order[] {
  if (!query.trim()) return orders;
  
  const searchLower = query.toLowerCase().trim();
  
  return orders.filter(order => {
    // Search by order number
    if (order.orderNumber.toLowerCase().includes(searchLower)) return true;
    
    // Search by customer name
    if (order.customerName.toLowerCase().includes(searchLower)) return true;
    
    // Search by phone number
    if (order.customerPhone.includes(searchLower)) return true;
    
    // Search by items
    const itemMatch = order.items.some(item => 
      item.name.toLowerCase().includes(searchLower)
    );
    if (itemMatch) return true;
    
    return false;
  });
}

/**
 * Filter orders by status
 */
export function filterOrdersByStatus(orders: Order[], statuses: OrderStatus[]): Order[] {
  if (statuses.length === 0) return orders;
  return orders.filter(order => statuses.includes(order.status));
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDateRange(
  orders: Order[], 
  startDate: Date, 
  endDate: Date
): Order[] {
  return orders.filter(order => {
    const orderDate = typeof order.createdAt === 'string' 
      ? parseISO(order.createdAt) 
      : new Date(order.createdAt);
    
    return orderDate >= startDate && orderDate <= endDate;
  });
}

