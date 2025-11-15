/**
 * ORDER FILTERS HOOK
 * 
 * Centralized hook for filtering, searching, and grouping orders.
 * Provides reusable logic for the admin dashboard order management.
 */

import { useState, useMemo, useCallback } from 'react';
import { Order, OrderStatus } from '@/types';
import {
  filterOrdersBySearch,
  filterOrdersByStatus,
  filterOrdersByDateRange,
  groupOrdersByDate,
  isOrderActive,
  isOrderCompleted,
  isOrderToday,
  sortOrdersByPriority,
} from '@/lib/order-utils';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface OrderFilters {
  searchQuery: string;
  statusFilter: OrderStatus[];
  dateRange: DateRange;
}

export interface UseOrderFiltersReturn {
  // Filtered and grouped orders
  activeOrders: Order[];
  completedTodayOrders: Order[];
  historyOrdersByDate: Record<string, Order[]>;
  
  // All filtered orders (for stats)
  allFilteredOrders: Order[];
  
  // Filter state
  searchQuery: string;
  statusFilter: OrderStatus[];
  dateRange: DateRange;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (statuses: OrderStatus[]) => void;
  setDateRange: (range: DateRange) => void;
  clearFilters: () => void;
  
  // Helper methods
  isFiltering: boolean;
}

/**
 * Custom hook for order filtering logic
 */
export function useOrderFilters(orders: Order[]): UseOrderFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  // Check if any filters are active
  const isFiltering = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      statusFilter.length > 0
    );
  }, [searchQuery, statusFilter]);

  // Apply all filters to orders
  const allFilteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filterOrdersBySearch(filtered, searchQuery);
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filterOrdersByStatus(filtered, statusFilter);
    }

    // Apply date range filter
    filtered = filterOrdersByDateRange(filtered, dateRange.start, dateRange.end);

    return filtered;
  }, [orders, searchQuery, statusFilter, dateRange]);

  // Split orders into active, completed today, and history
  const activeOrders = useMemo(() => {
    return sortOrdersByPriority(
      allFilteredOrders.filter(order => isOrderActive(order))
    );
  }, [allFilteredOrders]);

  const completedTodayOrders = useMemo(() => {
    return allFilteredOrders.filter(order => 
      isOrderCompleted(order) && isOrderToday(order)
    ).sort((a, b) => {
      // Sort by created date, most recent first
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  }, [allFilteredOrders]);

  const historyOrdersByDate = useMemo(() => {
    const historyOrders = allFilteredOrders.filter(order => !isOrderToday(order));
    return groupOrdersByDate(historyOrders);
  }, [allFilteredOrders]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter([]);
    setDateRange({
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999)),
    });
  }, []);

  return {
    activeOrders,
    completedTodayOrders,
    historyOrdersByDate,
    allFilteredOrders,
    searchQuery,
    statusFilter,
    dateRange,
    setSearchQuery,
    setStatusFilter,
    setDateRange,
    clearFilters,
    isFiltering,
  };
}

/**
 * Hook for managing expanded/collapsed sections
 */
export function useExpandedSections() {
  const [expandedSections, setExpandedSections] = useState<{
    completedToday: boolean;
    history: Record<string, boolean>;
  }>({
    completedToday: false,
    history: {},
  });

  const toggleCompletedToday = useCallback(() => {
    setExpandedSections(prev => ({
      ...prev,
      completedToday: !prev.completedToday,
    }));
  }, []);

  const toggleHistoryDate = useCallback((date: string) => {
    setExpandedSections(prev => ({
      ...prev,
      history: {
        ...prev.history,
        [date]: !prev.history[date],
      },
    }));
  }, []);

  const isCompletedTodayExpanded = expandedSections.completedToday;
  
  const isHistoryDateExpanded = useCallback((date: string) => {
    return !!expandedSections.history[date];
  }, [expandedSections.history]);

  return {
    expandedSections,
    toggleCompletedToday,
    toggleHistoryDate,
    isCompletedTodayExpanded,
    isHistoryDateExpanded,
  };
}

/**
 * Hook for view mode (grid vs list)
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminOrderViewMode');
      return (saved === 'list' ? 'list' : 'grid') as 'grid' | 'list';
    }
    return 'grid';
  });

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const newMode = prev === 'grid' ? 'list' : 'grid';
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminOrderViewMode', newMode);
      }
      return newMode;
    });
  }, []);

  const setViewModeDirectly = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminOrderViewMode', mode);
    }
  }, []);

  return {
    viewMode,
    toggleViewMode,
    setViewMode: setViewModeDirectly,
    isGridView: viewMode === 'grid',
    isListView: viewMode === 'list',
  };
}

