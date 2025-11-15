/**
 * GENIUS ALGORITHM: Real-Time Cart Inventory Tracker
 * 
 * Purpose: Track items across ALL active carts to create urgency and FOMO
 * 
 * Features:
 * - Tracks item reservations with TTL (30 minutes - typical cart abandonment time)
 * - Calculates "demand pressure" score (0-100) for each item
 * - Identifies "hot items" that multiple users are considering
 * - Provides urgency messaging: "3 people have this in their cart right now!"
 * 
 * Algorithm Inspiration: 
 * - Amazon's "Only X left in stock"
 * - Booking.com's "3 people viewing this property"
 * - Airbnb's "High demand - only 2 spots left"
 * 
 * Architecture:
 * - In-memory storage for MVP (can be upgraded to Redis for production)
 * - Automatic TTL cleanup every 5 minutes
 * - Real-time demand pressure calculations
 * - Thread-safe operations
 */

import { prisma } from './prisma';

/**
 * Cart Reservation - Tracks items in active carts
 */
interface CartReservation {
  sessionId: string;
  menuItemId: string;
  quantity: number;
  addedAt: number; // timestamp
  expiresAt: number; // timestamp
}

/**
 * Demand Pressure Data - Urgency metrics for an item
 */
export interface DemandPressureData {
  itemId: string;
  itemName: string;
  demandScore: number; // 0-100
  activeCartCount: number; // How many users have this in cart
  currentStock: number | null; // Actual inventory
  availableStock: number | null; // Stock minus soft reservations
  ordersLast24h: number;
  urgencyTier: 'none' | 'moderate' | 'high' | 'critical';
  urgencyMessage: string | null;
  socialProof: string | null;
}

/**
 * In-Memory Cart Tracker (Thread-Safe Singleton)
 */
class CartInventoryTracker {
  private reservations: Map<string, CartReservation[]> = new Map(); // itemId -> reservations
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly RESERVATION_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startCleanupJob();
  }

  /**
   * Track an item in a user's cart (soft reservation)
   */
  trackCartItem(sessionId: string, menuItemId: string, quantity: number): void {
    const now = Date.now();
    const reservation: CartReservation = {
      sessionId,
      menuItemId,
      quantity,
      addedAt: now,
      expiresAt: now + this.RESERVATION_TTL,
    };

    // Get existing reservations for this item
    const itemReservations = this.reservations.get(menuItemId) || [];

    // Remove any existing reservation from this session for this item
    const filteredReservations = itemReservations.filter(
      r => !(r.sessionId === sessionId && r.menuItemId === menuItemId)
    );

    // Add new reservation
    filteredReservations.push(reservation);
    this.reservations.set(menuItemId, filteredReservations);

    console.log(`[Cart Tracker] Tracked: ${menuItemId} x${quantity} for session ${sessionId.substring(0, 8)}`);
  }

  /**
   * Release an item from a user's cart
   */
  releaseCartItem(sessionId: string, menuItemId: string): void {
    const itemReservations = this.reservations.get(menuItemId);
    if (!itemReservations) return;

    const filteredReservations = itemReservations.filter(
      r => !(r.sessionId === sessionId && r.menuItemId === menuItemId)
    );

    if (filteredReservations.length === 0) {
      this.reservations.delete(menuItemId);
    } else {
      this.reservations.set(menuItemId, filteredReservations);
    }

    console.log(`[Cart Tracker] Released: ${menuItemId} for session ${sessionId.substring(0, 8)}`);
  }

  /**
   * Release all items from a user's cart (cart cleared)
   */
  releaseAllCartItems(sessionId: string): void {
    let releasedCount = 0;

    this.reservations.forEach((reservations, itemId) => {
      const filteredReservations = reservations.filter(r => r.sessionId !== sessionId);
      
      if (filteredReservations.length === 0) {
        this.reservations.delete(itemId);
      } else if (filteredReservations.length < reservations.length) {
        this.reservations.set(itemId, filteredReservations);
        releasedCount++;
      }
    });

    console.log(`[Cart Tracker] Released all items for session ${sessionId.substring(0, 8)} (${releasedCount} items)`);
  }

  /**
   * Get number of active carts containing this item
   */
  getActiveCartCount(menuItemId: string): number {
    const itemReservations = this.reservations.get(menuItemId) || [];
    const now = Date.now();
    
    // Only count non-expired reservations
    const activeReservations = itemReservations.filter(r => r.expiresAt > now);
    
    // Count unique sessions
    const uniqueSessions = new Set(activeReservations.map(r => r.sessionId));
    return uniqueSessions.size;
  }

  /**
   * Get total quantity reserved across all carts for this item
   */
  getTotalReservedQuantity(menuItemId: string): number {
    const itemReservations = this.reservations.get(menuItemId) || [];
    const now = Date.now();
    
    // Sum quantities from non-expired reservations
    return itemReservations
      .filter(r => r.expiresAt > now)
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  /**
   * Get available stock (actual inventory minus soft reservations)
   */
  getStockWithReservations(menuItemId: string, actualStock: number | null): number | null {
    if (actualStock === null || actualStock === undefined) return null;
    
    const reserved = this.getTotalReservedQuantity(menuItemId);
    return Math.max(0, actualStock - reserved);
  }

  /**
   * GENIUS ALGORITHM: Calculate Demand Pressure Score (0-100)
   * 
   * Formula:
   * score = min(100,
   *   (activeCartsWithItem × 30) +
   *   (ordersLast24Hours × 10) +
   *   ((maxStock - currentStock) / maxStock × 100 × 0.4)
   * )
   * 
   * Weights:
   * - Active carts: 30 points per cart (social proof weight)
   * - Recent orders: 10 points per order (velocity weight)
   * - Stock depletion: 40% of stock percentage (scarcity weight)
   */
  async calculateDemandPressure(menuItemId: string): Promise<DemandPressureData> {
    try {
      // Fetch item details from database
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        select: {
          id: true,
          name: true,
          inventory: true,
          inventoryEnabled: true,
        },
      });

      if (!menuItem) {
        throw new Error(`Menu item ${menuItemId} not found`);
      }

      // Get active cart count
      const activeCartCount = this.getActiveCartCount(menuItemId);

      // Get orders in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const ordersLast24h = await prisma.orderItem.count({
        where: {
          menuItemId,
          order: {
            createdAt: {
              gte: twentyFourHoursAgo,
            },
          },
        },
      });

      // Calculate stock metrics
      const currentStock = menuItem.inventoryEnabled ? (menuItem.inventory || 0) : null;
      const availableStock = currentStock !== null 
        ? this.getStockWithReservations(menuItemId, currentStock)
        : null;

      // Calculate demand score
      let demandScore = 0;

      // Component 1: Active carts (30 points each, max 60)
      demandScore += Math.min(60, activeCartCount * 30);

      // Component 2: Recent orders (10 points each, max 30)
      demandScore += Math.min(30, ordersLast24h * 10);

      // Component 3: Stock depletion (0-40 points based on % depleted)
      if (currentStock !== null && currentStock > 0) {
        // Assume max stock is 20 (or use historical data)
        const maxStock = Math.max(20, currentStock);
        const depletionPercentage = ((maxStock - currentStock) / maxStock) * 100;
        demandScore += depletionPercentage * 0.4;
      }

      // Cap at 100
      demandScore = Math.min(100, Math.round(demandScore));

      // Determine urgency tier
      let urgencyTier: DemandPressureData['urgencyTier'] = 'none';
      if (demandScore >= 76) urgencyTier = 'critical';
      else if (demandScore >= 51) urgencyTier = 'high';
      else if (demandScore >= 26) urgencyTier = 'moderate';

      // Generate urgency message
      const urgencyMessage = this.generateUrgencyMessage(
        menuItem.name,
        urgencyTier,
        activeCartCount,
        availableStock,
        ordersLast24h
      );

      // Generate social proof message
      const socialProof = this.generateSocialProof(
        activeCartCount,
        ordersLast24h,
        urgencyTier
      );

      return {
        itemId: menuItemId,
        itemName: menuItem.name,
        demandScore,
        activeCartCount,
        currentStock,
        availableStock,
        ordersLast24h,
        urgencyTier,
        urgencyMessage,
        socialProof,
      };
    } catch (error) {
      console.error(`[Cart Tracker] Error calculating demand pressure for ${menuItemId}:`, error);
      
      // Return safe default
      return {
        itemId: menuItemId,
        itemName: 'Unknown Item',
        demandScore: 0,
        activeCartCount: 0,
        currentStock: null,
        availableStock: null,
        ordersLast24h: 0,
        urgencyTier: 'none',
        urgencyMessage: null,
        socialProof: null,
      };
    }
  }

  /**
   * Generate urgency message based on demand data
   */
  private generateUrgencyMessage(
    itemName: string,
    urgencyTier: string,
    activeCartCount: number,
    availableStock: number | null,
    ordersLast24h: number
  ): string | null {
    if (urgencyTier === 'critical' && activeCartCount >= 3) {
      return `${activeCartCount} people have ${itemName} in their cart right now! ${availableStock !== null ? `Only ${availableStock} left!` : 'Going fast!'}`;
    }
    
    if (urgencyTier === 'high' && activeCartCount >= 2) {
      return `${activeCartCount} others are eyeing ${itemName} too. Want to secure yours?`;
    }
    
    if (availableStock !== null && availableStock <= 5 && availableStock > 0) {
      return `Only ${availableStock} ${itemName} left for today. Grab it before it's gone!`;
    }
    
    if (availableStock === 0) {
      return `${itemName} just sold out! Check back soon or try something similar.`;
    }
    
    if (ordersLast24h >= 10) {
      return `${itemName} is trending - ${ordersLast24h} orders in the last 24 hours!`;
    }

    return null;
  }

  /**
   * Generate social proof message
   */
  private generateSocialProof(
    activeCartCount: number,
    ordersLast24h: number,
    urgencyTier: string
  ): string | null {
    if (activeCartCount >= 3) {
      return `${activeCartCount} people have this in cart`;
    }
    
    if (ordersLast24h >= 15) {
      return `${ordersLast24h} orders today`;
    }
    
    if (ordersLast24h >= 5 && urgencyTier !== 'none') {
      return 'Popular choice';
    }

    return null;
  }

  /**
   * Clean up expired reservations
   */
  private cleanupExpiredReservations(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.reservations.forEach((reservations, itemId) => {
      const activeReservations = reservations.filter(r => r.expiresAt > now);
      
      if (activeReservations.length === 0) {
        this.reservations.delete(itemId);
        cleanedCount++;
      } else if (activeReservations.length < reservations.length) {
        this.reservations.set(itemId, activeReservations);
      }
    });

    if (cleanedCount > 0) {
      console.log(`[Cart Tracker] Cleaned up ${cleanedCount} expired item reservations`);
    }
  }

  /**
   * Start automatic cleanup job
   */
  private startCleanupJob(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredReservations();
    }, this.CLEANUP_INTERVAL);

    console.log('[Cart Tracker] Cleanup job started (runs every 5 minutes)');
  }

  /**
   * Stop cleanup job (for graceful shutdown)
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[Cart Tracker] Cleanup job stopped');
    }
  }

  /**
   * Get tracker statistics (for admin dashboard)
   */
  getStats(): {
    totalReservations: number;
    uniqueItems: number;
    uniqueSessions: number;
  } {
    const now = Date.now();
    const allSessions = new Set<string>();
    let totalReservations = 0;

    this.reservations.forEach(reservations => {
      const activeReservations = reservations.filter(r => r.expiresAt > now);
      totalReservations += activeReservations.length;
      activeReservations.forEach(r => allSessions.add(r.sessionId));
    });

    return {
      totalReservations,
      uniqueItems: this.reservations.size,
      uniqueSessions: allSessions.size,
    };
  }
}

// Singleton instance
export const cartTracker = new CartInventoryTracker();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('[Cart Tracker] Received SIGTERM, stopping cleanup job...');
    cartTracker.stopCleanupJob();
  });

  process.on('SIGINT', () => {
    console.log('[Cart Tracker] Received SIGINT, stopping cleanup job...');
    cartTracker.stopCleanupJob();
  });
}

