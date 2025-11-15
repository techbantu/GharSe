/**
 * SMART KITCHEN INTELLIGENCE - Ingredient Expiry Tracker
 * 
 * Purpose: Track ingredient expiration and prevent food waste
 * Features:
 * - Calculate hours until expiry for all ingredients
 * - Identify at-risk items (< 4 hours to expiry)
 * - Map ingredients to affected menu items
 * - Calculate potential waste cost
 * - Generate discount recommendations
 * 
 * This feeds into the dynamic pricing algorithm to discount items
 * before ingredients expire.
 */

import { prisma } from '@/lib/prisma';

/**
 * Expiry risk assessment for a single ingredient
 */
export interface ExpiryRisk {
  ingredientId: string;
  name: string;
  hoursUntilExpiry: number;
  currentStock: number;
  unit: string;
  costPerUnit: number;
  wasteCostIfExpired: number; // Total cost if this expires
  affectedMenuItems: string[]; // Menu item IDs that use this ingredient
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: 'DISCOUNT_ITEMS' | 'USE_FIRST' | 'MONITOR' | 'NORMAL';
}

/**
 * Summary of all expiry risks
 */
export interface ExpiryRiskSummary {
  criticalAlerts: ExpiryRisk[]; // < 2 hours
  highPriorityAlerts: ExpiryRisk[]; // 2-4 hours
  mediumPriorityAlerts: ExpiryRisk[]; // 4-8 hours
  totalPotentialWaste: number; // Total money at risk
  itemsNeedingDiscount: string[]; // Menu item IDs to discount
}

/**
 * IngredientTracker - Monitors ingredient expiration and waste
 */
export class IngredientTracker {
  private restaurantId: string;

  constructor(restaurantId: string = 'default') {
    this.restaurantId = restaurantId;
  }

  /**
   * Calculate hours until expiry for an ingredient
   */
  private calculateHoursUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(0, hours); // Never negative
  }

  /**
   * Determine urgency level based on hours until expiry
   */
  private getUrgencyLevel(hours: number): 'critical' | 'high' | 'medium' | 'low' {
    if (hours < 2) return 'critical';
    if (hours < 4) return 'high';
    if (hours < 8) return 'medium';
    return 'low';
  }

  /**
   * Determine recommended action based on urgency
   */
  private getRecommendedAction(
    hours: number
  ): 'DISCOUNT_ITEMS' | 'USE_FIRST' | 'MONITOR' | 'NORMAL' {
    if (hours < 2) return 'DISCOUNT_ITEMS'; // Heavy discount now
    if (hours < 4) return 'DISCOUNT_ITEMS'; // Moderate discount
    if (hours < 8) return 'USE_FIRST'; // Prioritize using this ingredient
    return 'MONITOR'; // Just keep an eye on it
  }

  /**
   * Get all ingredients at risk of expiring
   * This is the main function called by the pricing algorithm
   */
  async getExpiryRisks(): Promise<ExpiryRiskSummary> {
    // Get all ingredients
    const ingredients = await prisma.ingredientInventory.findMany({
      where: {
        restaurantId: this.restaurantId,
      },
      orderBy: {
        hoursUntilExpiry: 'asc', // Most urgent first
      },
    });

    const risks: ExpiryRisk[] = [];

    for (const ingredient of ingredients) {
      // Calculate fresh hours until expiry
      const hoursUntilExpiry = this.calculateHoursUntilExpiry(ingredient.expiryDate);

      // Update database with calculated hours (for quick queries)
      await prisma.ingredientInventory.update({
        where: { id: ingredient.id },
        data: { hoursUntilExpiry: Math.round(hoursUntilExpiry) },
      });

      // Calculate waste cost
      const wasteCostIfExpired = ingredient.currentStock * ingredient.costPerUnit;

      // Parse affected menu items (JSON array string)
      let affectedMenuItems: string[] = [];
      try {
        affectedMenuItems = ingredient.affectedMenuItems
          ? JSON.parse(ingredient.affectedMenuItems)
          : [];
      } catch (e) {
        console.error('Failed to parse affectedMenuItems:', e);
      }

      const risk: ExpiryRisk = {
        ingredientId: ingredient.id,
        name: ingredient.name,
        hoursUntilExpiry,
        currentStock: ingredient.currentStock,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit,
        wasteCostIfExpired,
        affectedMenuItems,
        urgencyLevel: this.getUrgencyLevel(hoursUntilExpiry),
        recommendedAction: this.getRecommendedAction(hoursUntilExpiry),
      };

      risks.push(risk);
    }

    // Categorize by urgency
    const criticalAlerts = risks.filter(r => r.urgencyLevel === 'critical');
    const highPriorityAlerts = risks.filter(r => r.urgencyLevel === 'high');
    const mediumPriorityAlerts = risks.filter(r => r.urgencyLevel === 'medium');

    // Calculate total potential waste
    const totalPotentialWaste = risks.reduce((sum, r) => sum + r.wasteCostIfExpired, 0);

    // Get unique menu items that need discounting
    const itemsNeedingDiscount = Array.from(
      new Set(
        risks
          .filter(r => r.recommendedAction === 'DISCOUNT_ITEMS')
          .flatMap(r => r.affectedMenuItems)
      )
    );

    return {
      criticalAlerts,
      highPriorityAlerts,
      mediumPriorityAlerts,
      totalPotentialWaste,
      itemsNeedingDiscount,
    };
  }

  /**
   * Get expiry multiplier for dynamic pricing
   * Returns a value between 0.4 and 1.0
   * 
   * Used by pricing algorithm:
   * - >8 hours: Normal pricing (1.0x)
   * - 4-8 hours: Small discount (0.8-0.9x)
   * - 2-4 hours: Moderate discount (0.6-0.8x)
   * - <2 hours: Heavy discount (0.4-0.6x) - better than waste!
   */
  async getExpiryMultiplier(menuItemId: string): Promise<number> {
    // Get ingredients for this menu item
    const ingredients = await prisma.ingredientInventory.findMany({
      where: {
        restaurantId: this.restaurantId,
      },
    });

    // Filter to ingredients used in this menu item
    const relevantIngredients = ingredients.filter(ingredient => {
      try {
        const affectedItems = ingredient.affectedMenuItems
          ? JSON.parse(ingredient.affectedMenuItems)
          : [];
        return affectedItems.includes(menuItemId);
      } catch {
        return false;
      }
    });

    if (relevantIngredients.length === 0) {
      return 1.0; // No ingredient data, normal price
    }

    // Find the ingredient closest to expiry (most urgent)
    const mostUrgent = relevantIngredients.reduce((min, ing) => {
      const hours = this.calculateHoursUntilExpiry(ing.expiryDate);
      return hours < this.calculateHoursUntilExpiry(min.expiryDate) ? ing : min;
    });

    const hoursUntilExpiry = this.calculateHoursUntilExpiry(mostUrgent.expiryDate);

    // Calculate multiplier based on urgency
    if (hoursUntilExpiry > 8) {
      // SAFE: Normal pricing
      return 1.0;
    } else if (hoursUntilExpiry > 4) {
      // MODERATE: Small discount to encourage orders
      // 4-8 hours → 0.80-0.95x price
      return 0.80 + ((hoursUntilExpiry - 4) / 4) * 0.15;
    } else if (hoursUntilExpiry > 2) {
      // URGENT: Moderate discount
      // 2-4 hours → 0.60-0.80x price
      return 0.60 + ((hoursUntilExpiry - 2) / 2) * 0.20;
    } else {
      // CRITICAL: Heavy discount - better to sell cheap than waste
      // 0-2 hours → 0.40-0.60x price
      return 0.40 + (hoursUntilExpiry / 2) * 0.20;
    }
  }

  /**
   * Mark ingredient as used (reduce stock)
   * Call this when an order is placed
   */
  async consumeIngredient(
    ingredientId: string,
    quantity: number
  ): Promise<{ newStock: number; isLowStock: boolean }> {
    const ingredient = await prisma.ingredientInventory.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new Error(`Ingredient ${ingredientId} not found`);
    }

    const newStock = Math.max(0, ingredient.currentStock - quantity);
    const isLowStock = newStock <= ingredient.minimumStock;

    await prisma.ingredientInventory.update({
      where: { id: ingredientId },
      data: {
        currentStock: newStock,
      },
    });

    return { newStock, isLowStock };
  }

  /**
   * Restock an ingredient
   * Call this when new supplies arrive
   */
  async restockIngredient(
    ingredientId: string,
    quantity: number,
    expiryDate: Date
  ): Promise<void> {
    await prisma.ingredientInventory.update({
      where: { id: ingredientId },
      data: {
        currentStock: {
          increment: quantity,
        },
        expiryDate,
        lastRestocked: new Date(),
      },
    });
  }

  /**
   * Get low stock alerts (items below minimum threshold)
   */
  async getLowStockAlerts(): Promise<
    Array<{
      ingredientId: string;
      name: string;
      currentStock: number;
      minimumStock: number;
      unit: string;
    }>
  > {
    const lowStockItems = await prisma.ingredientInventory.findMany({
      where: {
        restaurantId: this.restaurantId,
        currentStock: {
          lte: prisma.ingredientInventory.fields.minimumStock,
        },
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minimumStock: true,
        unit: true,
      },
    });

    return lowStockItems.map(item => ({
      ingredientId: item.id,
      name: item.name,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unit: item.unit,
    }));
  }

  /**
   * Calculate money saved by discounting vs wasting
   * Shows ROI of dynamic pricing system
   */
  async calculateWastePrevention(days: number = 7): Promise<{
    totalPotentialWaste: number;
    itemsDiscounted: number;
    moneySaved: number;
  }> {
    // This would require tracking actual discounts and comparing to waste
    // For now, return placeholder data
    // TODO: Implement with DynamicPricing table data

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Count items that were about to expire
    const riskyIngredients = await prisma.ingredientInventory.findMany({
      where: {
        restaurantId: this.restaurantId,
        hoursUntilExpiry: {
          lte: 4,
        },
      },
    });

    const totalPotentialWaste = riskyIngredients.reduce(
      (sum, ing) => sum + ing.currentStock * ing.costPerUnit,
      0
    );

    // Estimate 70% of items were sold at discount instead of wasted
    const moneySaved = totalPotentialWaste * 0.7;

    return {
      totalPotentialWaste,
      itemsDiscounted: riskyIngredients.length,
      moneySaved,
    };
  }
}

/**
 * Global singleton instance for default restaurant
 */
export const ingredientTracker = new IngredientTracker();

/**
 * Helper function: Add a new ingredient to inventory
 */
export async function addIngredient(data: {
  name: string;
  currentStock: number;
  unit: string;
  costPerUnit: number;
  expiryDate: Date;
  minimumStock: number;
  affectedMenuItems: string[];
  restaurantId?: string;
}): Promise<string> {
  const ingredient = await prisma.ingredientInventory.create({
    data: {
      name: data.name,
      restaurantId: data.restaurantId || 'default',
      currentStock: data.currentStock,
      unit: data.unit,
      costPerUnit: data.costPerUnit,
      expiryDate: data.expiryDate,
      hoursUntilExpiry: Math.round(
        (data.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60)
      ),
      minimumStock: data.minimumStock,
      affectedMenuItems: JSON.stringify(data.affectedMenuItems),
      lastRestocked: new Date(),
    },
  });

  return ingredient.id;
}

/**
 * Helper function: Get all ingredients with their expiry status
 */
export async function getAllIngredientsWithStatus(): Promise<
  Array<ExpiryRisk>
> {
  const tracker = new IngredientTracker();
  const summary = await tracker.getExpiryRisks();

  return [
    ...summary.criticalAlerts,
    ...summary.highPriorityAlerts,
    ...summary.mediumPriorityAlerts,
  ];
}

