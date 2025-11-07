/**
 * NEW FILE: Order Storage - Shared In-Memory Storage
 * 
 * Purpose: Centralized in-memory storage for orders that can be shared
 * across multiple API routes. In production, this would be replaced with
 * a database (PostgreSQL/Supabase).
 * 
 * Architecture: Singleton pattern ensures all API routes access the same data.
 */

import { Order } from '@/types';

// Shared in-memory storage
// In production, replace with database queries
let orders: Order[] = [];

/**
 * Get all orders (optionally filtered)
 */
export function getOrders(filters?: {
  status?: string;
  customerId?: string;
}): Order[] {
  let filteredOrders = [...orders];

  if (filters?.status) {
    filteredOrders = filteredOrders.filter(o => o.status === filters.status);
  }

  if (filters?.customerId) {
    filteredOrders = filteredOrders.filter(
      o => o.customer.id === filters.customerId
    );
  }

  // Sort by creation date (newest first)
  filteredOrders.sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );

  return filteredOrders;
}

/**
 * Get order by ID or order number
 */
export function getOrderById(id: string): Order | undefined {
  return orders.find(o => o.id === id || o.orderNumber === id);
}

/**
 * Add a new order
 */
export function addOrder(order: Order): void {
  orders.push(order);
}

/**
 * Update an existing order
 */
export function updateOrder(
  id: string,
  updates: Partial<Order>
): Order | null {
  const index = orders.findIndex(
    o => o.id === id || o.orderNumber === id
  );

  if (index === -1) {
    return null;
  }

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date(),
  };

  return orders[index];
}

/**
 * Update order status (convenience function)
 */
export function updateOrderStatus(
  id: string,
  status: Order['status']
): Order | null {
  return updateOrder(id, { status });
}

/**
 * Delete an order (for cleanup/testing)
 */
export function deleteOrder(id: string): boolean {
  const index = orders.findIndex(
    o => o.id === id || o.orderNumber === id
  );

  if (index === -1) {
    return false;
  }

  orders.splice(index, 1);
  return true;
}

/**
 * Get orders count (for stats)
 */
export function getOrdersCount(): number {
  return orders.length;
}

/**
 * Clear all orders (for testing/reset)
 */
export function clearOrders(): void {
  orders = [];
}
