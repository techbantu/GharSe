/**
 * NEW FILE: Order Modification API - Handle order modifications during grace period
 * 
 * Purpose: Allow customers to add/remove items during the 5-8 minute grace period
 * after placing an order, before it reaches the kitchen.
 * 
 * Features:
 * - Validates order is in PENDING_CONFIRMATION status
 * - Validates timer hasn't expired
 * - Updates order items (add, remove, quantity changes)
 * - Extends grace period by 2 minutes (max 8 min from original)
 * - Recalculates pricing
 * - Tracks modification count for analytics
 * 
 * Business Rules:
 * - Only PENDING_CONFIRMATION orders can be modified
 * - Grace period can extend +2min per modification (max 8min total)
 * - Must have at least 1 item (or auto-cancel)
 * - Pricing recalculated with tax, delivery fee, discounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { restaurantInfo } from '@/data/menuData';

// ===== VALIDATION SCHEMAS =====

const ModifyOrderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  quantity: z.number().int().min(0, 'Quantity must be 0 or greater'), // 0 means remove
  price: z.number().positive('Price must be positive'),
  specialInstructions: z.string().optional(),
});

const ModifyOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  items: z.array(ModifyOrderItemSchema).min(1, 'At least one item is required'),
  customerId: z.string().optional(), // For auth validation
});

type ModifyOrderData = z.infer<typeof ModifyOrderSchema>;

// ===== CONFIGURATION =====

const INITIAL_GRACE_PERIOD_MS = 3 * 60 * 1000; // 3 minutes
const GRACE_PERIOD_EXTENSION_MS = 2 * 60 * 1000; // +2 minutes per modification
const MAX_GRACE_PERIOD_MS = 5 * 60 * 1000; // Max 5 minutes total
const TAX_RATE = restaurantInfo.settings.taxRate || 0.05; // 5% tax
const DELIVERY_FEE = restaurantInfo.settings.deliveryFee || 50; // ₹50 delivery

// ===== HELPER FUNCTIONS =====

/**
 * Calculate order pricing with tax and delivery
 */
function calculatePricing(items: { quantity: number; price: number }[], discount: number = 0) {
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + DELIVERY_FEE - discount;
  
  return {
    subtotal,
    tax,
    deliveryFee: DELIVERY_FEE,
    discount,
    total,
  };
}

/**
 * Calculate new grace period expiry time
 * - Extends by 2 minutes
 * - Caps at 8 minutes from original creation time
 */
function calculateNewGracePeriodExpiry(
  createdAt: Date,
  currentExpiry: Date | null,
  modificationCount: number
): Date {
  const now = Date.now();
  const creationTime = createdAt.getTime();
  const maxExpiry = creationTime + MAX_GRACE_PERIOD_MS;
  
  // If this is the first modification, set initial grace period
  if (!currentExpiry || modificationCount === 0) {
    const newExpiry = creationTime + INITIAL_GRACE_PERIOD_MS;
    return new Date(Math.min(newExpiry, maxExpiry));
  }
  
  // Extend by 2 minutes, but cap at max
  const extendedExpiry = now + GRACE_PERIOD_EXTENSION_MS;
  return new Date(Math.min(extendedExpiry, maxExpiry));
}

// ===== API HANDLER =====

/**
 * POST /api/orders/modify - Modify an order during grace period
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = ModifyOrderSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      logger.warn('Order modification validation failed', {
        error: firstError.message,
        path: firstError.path,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data: ModifyOrderData = validation.data;
    
    // Find the order
    const order = await (prisma.order.findUnique as any)({
      where: { id: data.orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    
    if (!order) {
      logger.warn('Order not found for modification', {
        orderId: data.orderId,
      });
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    logger.info('Order modification attempt', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      gracePeriodExpiresAt: order.gracePeriodExpiresAt?.toISOString(),
      now: new Date().toISOString(),
      itemCount: data.items.length,
    });
    
    // Validate order status - must be PENDING_CONFIRMATION
    if (order.status !== 'PENDING_CONFIRMATION') {
      logger.warn('Order modification blocked - wrong status', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        expectedStatus: 'PENDING_CONFIRMATION',
      });
      
      return NextResponse.json(
        {
          success: false,
          error: `Order can no longer be modified. Current status: ${order.status}. Orders can only be modified when status is PENDING_CONFIRMATION.`,
          currentStatus: order.status,
        },
        { status: 400 }
      );
    }
    
    // Validate grace period hasn't expired
    if (order.gracePeriodExpiresAt) {
      const now = new Date();
      if (now > order.gracePeriodExpiresAt) {
        return NextResponse.json(
          {
            success: false,
            error: 'Modification window has expired. Order has been finalized.',
          },
          { status: 400 }
        );
      }
    }
    
    // Optional: Validate customer ownership (if customerId provided)
    if (data.customerId && order.customerId && data.customerId !== order.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to modify this order' },
        { status: 403 }
      );
    }
    
    // Validate at least one item with quantity > 0
    const validItems = data.items.filter((item: any) => item.quantity > 0);
    if (validItems.length === 0) {
      // No items left - should cancel order instead
      return NextResponse.json(
        {
          success: false,
          error: 'Order must have at least one item. To remove all items, please cancel the order.',
          shouldCancel: true,
        },
        { status: 400 }
      );
    }
    
    // Calculate new pricing
    const pricing = calculatePricing(validItems, order.discount);
    
    // Calculate new grace period expiry
    const newGracePeriodExpiry = calculateNewGracePeriodExpiry(
      order.createdAt,
      order.gracePeriodExpiresAt,
      order.modificationCount
    );
    
    // Update order in database (transactional)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId: order.id },
      });
      
      // Create new order items
      const newItems = await Promise.all(
        validItems.map((item: any) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.quantity * item.price,
              specialInstructions: item.specialInstructions,
            },
            include: {
              menuItem: true,
            },
          })
        )
      );
      
      // Update order
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          deliveryFee: pricing.deliveryFee,
          total: pricing.total,
          modificationCount: order.modificationCount + 1,
          gracePeriodExpiresAt: newGracePeriodExpiry,
          lastModifiedAt: new Date(),
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
      
      return updated;
    });
    
    // Calculate time remaining for client
    const timeRemaining = Math.max(
      0,
      newGracePeriodExpiry.getTime() - Date.now()
    );
    
    logger.info('Order modified successfully', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      modificationCount: updatedOrder.modificationCount,
      itemCount: validItems.length,
      newTotal: pricing.total,
      gracePeriodExpiresAt: newGracePeriodExpiry.toISOString(),
      timeRemainingMs: timeRemaining,
    });
    
    // Transform Prisma order to frontend Order type
    const formattedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customer: {
        id: updatedOrder.customerId || '',
        name: updatedOrder.customerName,
        email: updatedOrder.customerEmail,
        phone: updatedOrder.customerPhone,
      },
      items: updatedOrder.items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description || '',
          price: item.menuItem.price,
          category: item.menuItem.category,
          image: item.menuItem.image || '',
          isAvailable: item.menuItem.isAvailable,
          isVegetarian: item.menuItem.isVegetarian || false,
          isSpicy: item.menuItem.isSpicy || false,
          prepTime: item.menuItem.prepTime || 20,
          calories: item.menuItem.calories,
          ingredients: item.menuItem.ingredients as string[] || [],
          allergens: item.menuItem.allergens as string[] || [],
        },
        quantity: item.quantity,
        customization: item.specialInstructions || '',
        specialInstructions: item.specialInstructions || '',
        subtotal: item.subtotal,
      })),
      pricing: {
        subtotal: updatedOrder.subtotal,
        tax: updatedOrder.tax,
        deliveryFee: updatedOrder.deliveryFee,
        discount: updatedOrder.discount || 0,
        tip: updatedOrder.tip || 0,
        total: updatedOrder.total,
      },
      status: updatedOrder.status,
      orderType: 'delivery' as const,
      estimatedReadyTime: updatedOrder.estimatedDelivery?.toISOString() || new Date().toISOString(),
      paymentMethod: updatedOrder.paymentMethod || 'cash-on-delivery',
      paymentStatus: updatedOrder.paymentStatus,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
      deliveryAddress: updatedOrder.deliveryAddress ? {
        street: updatedOrder.deliveryAddress,
        city: updatedOrder.deliveryCity,
        state: '',
        zipCode: updatedOrder.deliveryZip,
        deliveryInstructions: updatedOrder.deliveryNotes || '',
      } : undefined,
      contactPreference: ['sms', 'email'] as any[],
      notifications: [],
      modificationCount: updatedOrder.modificationCount,
      gracePeriodExpiresAt: newGracePeriodExpiry.toISOString(),
      lastModifiedAt: updatedOrder.lastModifiedAt?.toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      order: formattedOrder,
      timeRemaining, // in milliseconds
      message: `Order updated! You have ${Math.ceil(timeRemaining / 1000 / 60)} minutes to make more changes.`,
    });
    
  } catch (error) {
    logger.error('Error modifying order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to modify order. Please try again or contact support.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/modify?orderId=xxx - Check if order can be modified
 * Returns order details and time remaining
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const order = await (prisma.order.findUnique as any)({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if modifiable
    const canModify = order.status === 'PENDING_CONFIRMATION';
    const now = new Date();
    const hasExpired = order.gracePeriodExpiresAt ? now > order.gracePeriodExpiresAt : false;
    const timeRemaining = order.gracePeriodExpiresAt
      ? Math.max(0, order.gracePeriodExpiresAt.getTime() - now.getTime())
      : 0;
    
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        gracePeriodExpiresAt: order.gracePeriodExpiresAt?.toISOString(),
        lastModifiedAt: order.lastModifiedAt?.toISOString(),
      },
      canModify: canModify && !hasExpired,
      timeRemaining, // in milliseconds
      modificationCount: order.modificationCount,
      maxModifications: 10, // Prevent abuse
    });
    
  } catch (error) {
    logger.error('Error checking order modification status', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check order status',
      },
      { status: 500 }
    );
  }
}

