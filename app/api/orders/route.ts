/**
 * UPDATED FILE: Orders API Route - ARCHITECT-Enhanced
 * 
 * Purpose: Handles order creation, retrieval, and status updates with
 * production-grade error handling, rate limiting, and validation.
 * 
 * Architecture: RESTful API endpoints with:
 * - Rate limiting (10 req/min per IP)
 * - Zod validation schemas
 * - Result<T, E> error handling
 * - Structured logging
 * - Input sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Order, OrderStatus, CustomerInfo, Address, PaymentMethod, PaymentStatus, MenuCategory, CartItem } from '@/types';
import { Result, Ok, Err, ValidationError, ServerError, AppError } from '@/utils/result';
import { logger } from '@/utils/logger';
import { applyRateLimit, RATE_LIMITS } from '@/utils/rate-limit';
import { restaurantInfo } from '@/data/menuData';
import { addOrder, getOrders, getOrdersCount } from '@/lib/order-storage';
import prisma from '@/lib/prisma';
import { broadcastNewOrderToAdmin } from '@/lib/websocket-server';
import { validateCoupon, applyCouponToOrder, checkReferralEligibility, completeReferral } from '@/lib/coupon-validator';
import { extractTokenFromHeader, extractTokenFromCookie, verifyToken } from '@/lib/auth-customer';
import { checkRefereeDiscount, applyRefereeDiscount } from '@/lib/referral-engine';
import { getMaxWalletUsage, debitWallet } from '@/lib/wallet-manager';

/**
 * Validation Schema for Order Creation
 * 
 * Uses Zod for runtime type checking and validation.
 * Never trust client input - validate everything.
 */
const CreateOrderSchema = z.object({
  customer: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100)
      .regex(/^[a-zA-Z\s\-'\.\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0900-\u097F]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
    email: z.string().email('Invalid email format'),
    phone: z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^\+?[\d\s\-()]+$/, 'Phone number can only contain numbers, +, spaces, hyphens, and parentheses')
      .refine((val) => val.replace(/\D/g, '').length >= 10, 'Phone number must have at least 10 digits'),
    id: z.string().optional(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      menuItem: z.any(), // MenuItem type (complex, validate separately)
      quantity: z.number().int().positive('Quantity must be positive'),
      subtotal: z.number().nonnegative(),
    })
  ).min(1, 'Cart cannot be empty'),
  pricing: z.object({
    subtotal: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    deliveryFee: z.number().nonnegative(),
    discount: z.number().nonnegative().optional(),
    walletAmount: z.number().nonnegative().optional().default(0), // Wallet credits used
    tip: z.number().nonnegative().optional().default(0),
    total: z.number().nonnegative(),
    promoCode: z.string().optional(), // Coupon code
  }),
  orderType: z.enum(['delivery', 'pickup']).default('delivery'),
  paymentMethod: z.enum(['cash-on-delivery', 'card', 'upi', 'paytm', 'razorpay', 'stripe', 'google-pay', 'phonepe', 'form-b', 'netbanking']).default('cash-on-delivery'),
  paymentMethodDetails: z.string().optional(), // Specific gateway details
  customerId: z.string().optional(), // Customer ID (if logged in)
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(3), // Flexible for different countries (India: 6 digits)
    country: z.string().default('India'),
    apartment: z.string().optional(),
    deliveryInstructions: z.string().optional(),
  }).optional(),
  specialInstructions: z.string().optional(),
});

/**
 * Validate and create order (pure business logic)
 */
async function createOrderLogic(body: unknown): Promise<Result<Order, AppError>> {
  try {
    // Validate input with Zod
    const validationResult = CreateOrderSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return Err(
        new ValidationError(
          firstError?.message || 'Invalid order data',
          firstError?.path.join('.'),
          'VALIDATION_ERROR'
        )
      );
    }
    
    const data = validationResult.data;
    
    // Coupon validation and discount calculation (if promoCode provided)
    let couponId: string | undefined;
    let finalDiscount = data.pricing.discount || 0;
    let referralId: string | undefined;
    let referralDiscountApplied = false;
    
    // Check for automatic referral discount (first-time user bonus)
    if (data.customerId) {
      const refereeDiscountResult = await checkRefereeDiscount(data.customerId);
      
      if (refereeDiscountResult.eligible) {
        // Apply referral discount automatically (no code needed!)
        finalDiscount += refereeDiscountResult.amount;
        referralId = refereeDiscountResult.referralId;
        referralDiscountApplied = true;
        
        logger.info('Referral discount auto-applied', {
          customerId: data.customerId,
          referralId,
          discount: refereeDiscountResult.amount,
        });
      }
    }
    
    // Check for promo code/coupon (on top of referral discount if applicable)
    if (data.pricing.promoCode && data.customerId) {
      const couponResult = await validateCoupon(
        data.pricing.promoCode,
        data.customerId,
        data.pricing.subtotal,
        data.items.map(item => ({
          category: item.menuItem.category,
          price: item.menuItem.price,
          quantity: item.quantity,
        }))
      );
      
      if (!couponResult.valid) {
        return Err(
          new ValidationError(
            couponResult.message || 'Invalid coupon code',
            'pricing.promoCode',
            'VALIDATION_ERROR'
          )
        );
      }
      
      // Apply coupon discount (on top of referral discount)
      couponId = couponResult.couponId;
      finalDiscount += (couponResult.discount || 0);
      
      logger.info('Coupon applied to order', {
        customerId: data.customerId,
        couponCode: data.pricing.promoCode,
        discount: couponResult.discount,
      });
    } else if (data.pricing.promoCode && !data.customerId) {
      return Err(
        new ValidationError(
          'Please login to use coupon codes',
          'pricing.promoCode',
          'VALIDATION_ERROR'
        )
      );
    }
    
    // Calculate total before wallet
    let subtotalAfterDiscounts = data.pricing.subtotal + data.pricing.tax + data.pricing.deliveryFee - finalDiscount;
    
    // Validate and apply wallet credits
    let walletAmountUsed = data.pricing.walletAmount || 0;
    
    if (walletAmountUsed > 0 && data.customerId) {
      // Validate wallet amount
      const maxWalletUsage = await getMaxWalletUsage(data.customerId, subtotalAfterDiscounts);
      
      if (walletAmountUsed > maxWalletUsage) {
        return Err(
          new ValidationError(
            `Insufficient wallet balance. Available: ₹${maxWalletUsage}`,
            'pricing.walletAmount',
            'VALIDATION_ERROR'
          )
        );
      }
      
      logger.info('Wallet credits applied', {
        customerId: data.customerId,
        walletAmount: walletAmountUsed,
      });
    }
    
    // Final total after wallet
    const finalTotal = Math.max(0, subtotalAfterDiscounts - walletAmountUsed);
    
    // Business rule: Check minimum order amount
    if (data.pricing.subtotal < restaurantInfo.settings.minimumOrder) {
      return Err(
        new ValidationError(
          `Minimum order amount is ₹${restaurantInfo.settings.minimumOrder}`,
          'pricing.subtotal',
          'VALIDATION_ERROR'
        )
      );
    }
    
    // Generate unique order ID (UUID-like, globally unique)
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const orderNumber = `BK-${Date.now().toString().slice(-6)}`;
    
    // Calculate estimated ready time (40 minutes + buffer)
    const estimatedReadyTime = new Date(
      Date.now() + (40 + restaurantInfo.settings.preparationBuffer) * 60 * 1000
    );
    
    // Calculate grace period expiry (3 minutes from now)
    const GRACE_PERIOD_MS = 3 * 60 * 1000; // 3 minutes
    const gracePeriodExpiresAt = new Date(Date.now() + GRACE_PERIOD_MS);
    
    // CRITICAL FIX: Declare order variable in outer scope
    let order: Order;
    
    // CRITICAL FIX: Save to database FIRST, then memory
    // This ensures data consistency - if DB fails, order doesn't exist anywhere
    
    // Save to database and decrement inventory (with transaction)
    try {
      await prisma.$transaction(async (tx) => {
        // Create order in database
        await tx.order.create({
          data: {
            id: orderId,
            orderNumber,
            customerId: data.customerId || null, // Link to customer if logged in
            customerName: data.customer.name,
            customerEmail: data.customer.email,
            customerPhone: data.customer.phone,
            deliveryAddress: data.deliveryAddress?.street || '',
            deliveryCity: data.deliveryAddress?.city || '',
            deliveryZip: data.deliveryAddress?.zipCode || '',
            deliveryNotes: data.deliveryAddress?.deliveryInstructions || '',
            subtotal: data.pricing.subtotal,
            tax: data.pricing.tax,
            deliveryFee: data.pricing.deliveryFee,
            discount: finalDiscount, // Use calculated discount
            tip: data.pricing.tip || 0,
            total: finalTotal + (data.pricing.tip || 0), // Include tip in total
            status: 'PENDING_CONFIRMATION', // Start in grace period
            paymentStatus: 'PENDING',
            paymentMethod: data.paymentMethodDetails || data.paymentMethod, // Use details if provided, otherwise use method
            estimatedDelivery: estimatedReadyTime,
            gracePeriodExpiresAt, // Grace period expiry timestamp
            modificationCount: 0, // No modifications yet
            items: {
              create: data.items.map(item => ({
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
                price: item.menuItem.price,
                subtotal: item.subtotal,
                specialInstructions: item.customization || '',
              })),
            },
          },
        });
        
        // CRITICAL FIX: Use atomic decrement with row-level locking to prevent race conditions
        // This ensures two simultaneous orders can't both get the last item
        for (const item of data.items) {
          const menuItem = await tx.menuItem.findUnique({
            where: { id: item.menuItem.id },
            select: { inventoryEnabled: true, inventory: true, name: true },
          });
          
          if (menuItem && menuItem.inventoryEnabled && menuItem.inventory !== null && menuItem.inventory !== undefined) {
            // Use atomic decrement with condition - only update if enough inventory
            const updated = await tx.menuItem.updateMany({
              where: { 
                id: item.menuItem.id,
                inventory: { gte: item.quantity } // Only update if sufficient inventory
              },
              data: { 
                inventory: { decrement: item.quantity } // Atomic decrement
              },
            });
            
            // If 0 rows updated, insufficient inventory (race condition caught!)
            if (updated.count === 0) {
              // Get current inventory for error message
              const currentItem = await tx.menuItem.findUnique({
                where: { id: item.menuItem.id },
                select: { inventory: true },
              });
              
              throw new Error(
                `Insufficient inventory for ${menuItem.name}. ` +
                `Requested: ${item.quantity}, Available: ${currentItem?.inventory || 0}. ` +
                `This item may have been sold to another customer.`
              );
            }
            
            // Get updated inventory for logging
            const updatedItem = await tx.menuItem.findUnique({
              where: { id: item.menuItem.id },
              select: { inventory: true },
            });
            
            logger.info(`Inventory decremented for ${menuItem.name}`, {
              itemId: item.menuItem.id,
              quantity: item.quantity,
              newInventory: updatedItem?.inventory,
            });
          }
        }
      });
      
      logger.info('Order saved to database with inventory update', {
        orderId,
        orderNumber,
      });
      
      // COUPON TRACKING: Create CouponUsage record if coupon was applied
      if (couponId && data.customerId && finalDiscount > 0) {
        try {
          const ipAddress = 'unknown'; // Will be set from request in POST handler
          await applyCouponToOrder(
            couponId,
            data.customerId,
            orderId,
            finalDiscount,
            data.pricing.subtotal + data.pricing.tax + data.pricing.deliveryFee,
            finalTotal,
            ipAddress
          );
          
          logger.info('Coupon usage tracked', {
            couponId,
            orderId,
            discount: finalDiscount,
          });
        } catch (couponError) {
          // Don't fail order if coupon tracking fails (already have the discount)
          logger.error('Failed to track coupon usage', {
            couponId,
            orderId,
            error: couponError instanceof Error ? couponError.message : String(couponError),
          });
        }
      }
      
      // REFERRAL TRACKING: Mark referee discount as applied if used
      if (referralDiscountApplied && referralId) {
        try {
          await applyRefereeDiscount(referralId, orderId);
          
          logger.info('Referee discount marked as applied', {
            referralId,
            orderId,
          });
        } catch (referralError) {
          // Don't fail order if referral marking fails
          logger.error('Failed to mark referee discount', {
            referralId,
            orderId,
            error: referralError instanceof Error ? referralError.message : String(referralError),
          });
        }
      }
      
      // WALLET DEBIT: Deduct wallet credits used
      if (walletAmountUsed > 0 && data.customerId) {
        try {
          await debitWallet(
            data.customerId,
            walletAmountUsed,
            orderId,
            `Payment for order ${orderNumber}`
          );
          
          logger.info('Wallet debited', {
              customerId: data.customerId,
              orderId,
            amount: walletAmountUsed,
            });
        } catch (walletError) {
          // Log error but don't fail order (money already accounted for in total)
          logger.error('Failed to debit wallet', {
            customerId: data.customerId,
            orderId,
            amount: walletAmountUsed,
            error: walletError instanceof Error ? walletError.message : String(walletError),
          });
        }
      }
      
      // Update customer statistics if logged in
      if (data.customerId) {
        try {
          await prisma.customer.update({
            where: { id: data.customerId },
            data: {
              totalOrders: { increment: 1 },
              totalSpent: { increment: finalTotal },
              lastOrderAt: new Date(),
            },
          });
        } catch (statsError) {
          // Don't fail order if stats update fails
          logger.error('Failed to update customer statistics', {
            customerId: data.customerId,
            error: statsError instanceof Error ? statsError.message : String(statsError),
          });
        }
      }
      
      // CRITICAL FIX: Fetch the complete order from DB with all relations
      // This ensures frontend gets gracePeriodExpiresAt and full MenuItem data
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: true, // Include full MenuItem data for images
            },
          },
        },
      });
      
      if (!dbOrder) {
        throw new Error('Order created but not found in database');
      }
      
      // Convert DB order to frontend format
      order = {
        id: dbOrder.id,
        orderNumber: dbOrder.orderNumber,
        customer: data.customer as CustomerInfo,
        items: dbOrder.items.map(item => ({
          id: item.id,
          menuItemId: item.menuItemId,
          menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            description: item.menuItem.description || '',
            price: parseFloat(item.menuItem.price.toString()),
            originalPrice: item.menuItem.originalPrice ? parseFloat(item.menuItem.originalPrice.toString()) : undefined,
            category: item.menuItem.category,
            image: item.menuItem.image || '',
            isVegetarian: item.menuItem.isVegetarian,
            isVegan: item.menuItem.isVegan,
            isGlutenFree: item.menuItem.isGlutenFree,
            spicyLevel: item.menuItem.spicyLevel,
            preparationTime: item.menuItem.preparationTime,
            isAvailable: item.menuItem.isAvailable,
            isPopular: item.menuItem.isPopular,
            calories: item.menuItem.calories || undefined,
            servingSize: item.menuItem.servingSize || undefined,
            ingredients: item.menuItem.ingredients || [],
            allergens: item.menuItem.allergens || [],
          },
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
          subtotal: parseFloat(item.subtotal.toString()),
          customization: item.specialInstructions || undefined,
        })),
        pricing: {
          subtotal: parseFloat(dbOrder.subtotal.toString()),
          tax: parseFloat(dbOrder.tax.toString()),
          deliveryFee: parseFloat(dbOrder.deliveryFee.toString()),
          discount: parseFloat(dbOrder.discount.toString()),
          tip: parseFloat(dbOrder.tip.toString()),
          total: parseFloat(dbOrder.total.toString()),
        },
        status: dbOrder.status.toLowerCase().replace(/_/g, '-') as OrderStatus,
        orderType: data.orderType,
        paymentMethod: dbOrder.paymentMethod || 'cash',
        paymentStatus: dbOrder.paymentStatus.toLowerCase() as any,
        specialInstructions: data.specialInstructions,
        createdAt: dbOrder.createdAt,
        updatedAt: dbOrder.updatedAt,
        estimatedReadyTime,
        deliveryAddress: data.deliveryAddress as Address | undefined,
        contactPreference: ['email', 'sms'],
        notifications: [],
        // Grace period fields - CRITICAL for timer
        gracePeriodExpiresAt: dbOrder.gracePeriodExpiresAt,
        modificationCount: dbOrder.modificationCount,
        lastModifiedAt: dbOrder.lastModifiedAt,
      };
      
      // Save to in-memory storage ONLY after DB success
      addOrder(order);
      
      // Broadcast new order to admin room via WebSocket (real-time notification)
      try {
        await broadcastNewOrderToAdmin({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer,
          pricing: order.pricing,
          status: order.status,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            menuItem: { name: item.menuItem.name },
            quantity: item.quantity,
          })),
        });
      } catch (wsError) {
        // Don't fail order creation if WebSocket fails (graceful degradation)
        logger.warn('Failed to broadcast new order to admin via WebSocket', {
          orderId,
          error: wsError instanceof Error ? wsError.message : String(wsError),
        });
      }
      
      // Send order confirmation notifications (email + SMS)
      // This runs asynchronously - don't block order response
      (async () => {
        try {
          const { notificationManager } = await import('@/lib/notifications/notification-manager');
          const notificationResult = await notificationManager.sendOrderConfirmation(order);
          
          logger.info('Order confirmation notifications sent', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            emailSuccess: notificationResult.email?.success,
            smsSuccess: notificationResult.sms?.success,
            smsSkipped: notificationResult.sms?.skipped,
          });
        } catch (notificationError) {
          // Don't fail order creation if notifications fail (graceful degradation)
          logger.error('Failed to send order confirmation notifications', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
          });
        }
      })();
      
    } catch (dbError: any) {
      logger.error('Failed to save order to database', {
        orderId,
        error: dbError.message,
      });
      
      // Return error - order NOT saved anywhere (data consistency maintained)
      if (dbError.message.includes('Insufficient inventory')) {
        return Err(
          new ValidationError(
            dbError.message,
            'items',
            'INSUFFICIENT_INVENTORY'
          )
        );
      }
      
      // Database error - return error, don't save to memory
      return Err(
        new ServerError(
          'Failed to create order. Please try again.',
          500,
          'DATABASE_ERROR'
        )
      );
    }
    
    // TODO: In production:
    // - Send email confirmation (circuit breaker pattern)
    // - Send SMS notification (queue for retry if fails)
    // - Emit order.created event for analytics
    
    logger.info('Order created successfully', {
      orderId,
      orderNumber,
      customerEmail: data.customer.email.substring(0, 3) + '***', // Privacy: don't log full email
      total: data.pricing.total,
      itemCount: data.items.length,
    });
    
    return Ok(order);
    
  } catch (error) {
    logger.error('Unexpected error in createOrderLogic', {
      error: error instanceof Error ? error.message : String(error),
    }, error instanceof Error ? error : undefined);
    
    return Err(
      new ServerError(
        'Failed to create order due to internal error',
        500,
        'SERVER_ERROR'
      )
    );
  }
}

/**
 * POST /api/orders - Create a new order
 * 
 * Flow:
 * 1. Rate limit check (10 req/min per IP)
 * 2. Parse and validate request body
 * 3. Business logic validation
 * 4. Create order
 * 5. Return result or error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Step 1: Rate limiting
    const rateLimitResult = applyRateLimit(request, RATE_LIMITS.CREATE_ORDER);
    
    if (rateLimitResult.isErr()) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error.message,
          code: rateLimitResult.error.code,
          retryAfter: rateLimitResult.error.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.error.retryAfter || 60),
          },
        }
      );
    }
    
    // Step 2: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in request body', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }
    
    // Step 2.5: Extract customer ID from auth token if present
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    const token = extractTokenFromHeader(authHeader) || extractTokenFromCookie(cookieHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.customerId) {
        // Add customerId to body if user is logged in
        (body as any).customerId = decoded.customerId;
      }
    }
    
    // Step 3: Create order (with validation and business logic)
    const result = await createOrderLogic(body);
    
    const duration = Date.now() - startTime;
    
    if (result.isErr()) {
      logger.warn('Order creation failed', {
        error: result.error.message,
        errorType: result.error.constructor.name,
        duration,
      });
      
      const statusCode =
        result.error instanceof ValidationError ? 400 :
        result.error instanceof ServerError ? 500 : 500;
      
      return NextResponse.json(
        {
          success: false,
          error: result.error.message,
          code: result.error.code,
          field: 'field' in result.error ? result.error.field : undefined,
        },
        { status: statusCode }
      );
    }
    
    // Step 4: Success response
    logger.info('Order created', {
      orderId: result.value.id,
      orderNumber: result.value.orderNumber,
      duration,
    });
    
    return NextResponse.json(
      {
        success: true,
        order: result.value,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Unexpected error in POST /api/orders', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders - Get all orders (with optional filters)
 * 
 * Note: In production, add authentication and pagination.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const includePendingConfirmation = searchParams.get('includePendingConfirmation') === 'true';
    
    // Handle multiple statuses (comma-separated)
    let statusFilter: string | undefined;
    if (statusParam) {
      // Split by comma and filter
      const statuses = statusParam.split(',').map(s => s.trim());
      const validStatuses: OrderStatus[] = [
        'pending-confirmation', 'pending', 'confirmed', 'preparing', 'ready',
        'out-for-delivery', 'delivered', 'picked-up', 'cancelled', 'refunded'
      ];
      
      // Validate all statuses
      const invalidStatuses = statuses.filter(s => !validStatuses.includes(s as OrderStatus));
      if (invalidStatuses.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status(es): ${invalidStatuses.join(', ')}. Must be one of: ${validStatuses.join(', ')}`,
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      
      // If multiple statuses, we'll filter after getting all orders
      statusFilter = statuses.length === 1 ? statuses[0] : undefined;
    }
    
    // Fetch orders from database (not in-memory storage)
    // Map frontend status to database enum format
    let dbStatusFilter: string | undefined;
    if (statusFilter) {
      const statusMap: Record<string, string> = {
        'pending-confirmation': 'PENDING_CONFIRMATION',
        'pending': 'PENDING',
        'confirmed': 'CONFIRMED',
        'preparing': 'PREPARING',
        'ready': 'READY',
        'out-for-delivery': 'OUT_FOR_DELIVERY',
        'delivered': 'DELIVERED',
        'picked-up': 'DELIVERED', // Map to DELIVERED since PICKED_UP doesn't exist in enum
        'cancelled': 'CANCELLED',
        'refunded': 'CANCELLED', // Map to CANCELLED since REFUNDED doesn't exist in enum
      };
      dbStatusFilter = statusMap[statusFilter.toLowerCase()] || statusFilter.toUpperCase();
    }
    
    // Build where clause - exclude PENDING_CONFIRMATION by default (unless explicitly included)
    const whereClause: any = {
      ...(dbStatusFilter && { status: dbStatusFilter as any }),
      ...(customerId && { customerPhone: customerId }),
    };
    
    // Exclude PENDING_CONFIRMATION unless explicitly requested
    if (!includePendingConfirmation && !dbStatusFilter) {
      whereClause.status = { not: 'PENDING_CONFIRMATION' };
    }
    
    // Fetch all orders first, then filter out sample/test orders
    const allDbOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // SIMPLIFIED FILTERING: Only filter OBVIOUS test/sample orders
    // Be conservative - we'd rather show a test order than hide a real one!
    const dbOrders = allDbOrders.filter(order => {
      const email = order.customerEmail.toLowerCase();
      const name = order.customerName.toLowerCase();
      
      // Only exclude VERY OBVIOUS test patterns
      // Be VERY conservative to avoid hiding real orders
      if (
        // Only filter exact @example.com (standard test domain)
        email.endsWith('@example.com') ||
        // Only filter emails that START with obvious test words
        email.startsWith('test@') ||
        email.startsWith('sample@') ||
        email.startsWith('dummy@') ||
        email.startsWith('fake@') ||
        // Only filter EXACT matches of obvious test names
        name === 'test' ||
        name === 'test user' ||
        name === 'sample' ||
        name === 'sample user' ||
        name === 'dummy' ||
        name === 'fake'
      ) {
        console.log('🚫 Filtered out test order:', order.orderNumber, name, email);
        return false;
      }
      
      console.log('✅ Including order:', order.orderNumber, name, email);
      return true; // Real order - show it!
    });
    
    // Transform database orders to frontend Order format
    const transformedOrders: Order[] = dbOrders.map(dbOrder => {
      // Map database status to frontend status (lowercase)
      // Note: Database enum only has: PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
      const statusMap: Record<string, OrderStatus> = {
        'PENDING': 'pending',
        'CONFIRMED': 'confirmed',
        'PREPARING': 'preparing',
        'READY': 'ready',
        'OUT_FOR_DELIVERY': 'out-for-delivery',
        'DELIVERED': 'delivered',
        'CANCELLED': 'cancelled',
      };
      
      // Default to pending if status not found
      const frontendStatus = statusMap[dbOrder.status] || 'pending';
      
      // Map payment status
      const paymentStatusMap: Record<string, PaymentStatus> = {
        'PENDING': 'pending',
        'PAID': 'completed',
        'COMPLETED': 'completed',
        'FAILED': 'failed',
        'REFUNDED': 'refunded',
      };
      
      const frontendPaymentStatus = paymentStatusMap[dbOrder.paymentStatus] || 'pending';
      
      // Map payment method
      const paymentMethodMap: Record<string, PaymentMethod> = {
        'cash': 'cash-on-delivery',
        'card': 'card',
        'online': 'card',
        'upi': 'upi',
      };
      
      const frontendPaymentMethod = paymentMethodMap[dbOrder.paymentMethod?.toLowerCase() || 'cash'] || 'cash-on-delivery';
      
      // Transform order items
      const transformedItems: CartItem[] = dbOrder.items.map(item => ({
        id: item.id,
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description || '',
          price: item.price, // Use price at time of order
          category: (item.menuItem.category || 'Main Course') as MenuCategory,
          image: item.menuItem.image || '',
          isVegetarian: item.menuItem.isVegetarian || false,
          isVegan: item.menuItem.isVegan || false,
          isGlutenFree: item.menuItem.isGlutenFree || false,
          spicyLevel: (item.menuItem.spicyLevel || 0) as 0 | 1 | 2 | 3 | undefined,
          preparationTime: item.menuItem.preparationTime || 30,
          isAvailable: item.menuItem.isAvailable !== undefined ? item.menuItem.isAvailable : true,
          isPopular: item.menuItem.isPopular || false,
        },
        quantity: item.quantity,
        subtotal: item.subtotal,
        specialInstructions: item.specialInstructions || undefined,
      }));
      
      // Determine order type from delivery address
      const orderType: 'delivery' | 'pickup' = dbOrder.deliveryAddress ? 'delivery' : 'pickup';
      
      // Build delivery address if exists
      const deliveryAddress: Address | undefined = dbOrder.deliveryAddress ? {
        street: dbOrder.deliveryAddress,
        city: dbOrder.deliveryCity,
        state: '', // Not stored in DB, but required by type
        zipCode: dbOrder.deliveryZip,
        country: 'India',
        deliveryInstructions: dbOrder.deliveryNotes || undefined,
      } : undefined;
      
      return {
        id: dbOrder.id,
        orderNumber: dbOrder.orderNumber,
        customer: {
          id: dbOrder.customerPhone, // Use phone as ID
          name: dbOrder.customerName,
          email: dbOrder.customerEmail,
          phone: dbOrder.customerPhone,
        },
        items: transformedItems,
        pricing: {
          subtotal: dbOrder.subtotal,
          tax: dbOrder.tax,
          deliveryFee: dbOrder.deliveryFee,
          discount: dbOrder.discount || undefined,
          total: dbOrder.total,
        },
        status: frontendStatus,
        orderType,
        estimatedReadyTime: dbOrder.estimatedDelivery || dbOrder.createdAt,
        actualReadyTime: dbOrder.readyAt || undefined,
        deliveryTime: dbOrder.deliveredAt || undefined,
        paymentMethod: frontendPaymentMethod,
        paymentStatus: frontendPaymentStatus,
        specialInstructions: dbOrder.deliveryNotes || undefined, // Order-level special instructions stored in deliveryNotes
        createdAt: dbOrder.createdAt,
        updatedAt: dbOrder.updatedAt,
        deliveryAddress,
        contactPreference: ['email', 'sms'],
        notifications: [],
      };
    });
    
    // If multiple statuses were provided, filter here
    let filteredOrders = transformedOrders;
    if (statusParam && statusParam.includes(',')) {
      const statuses = statusParam.split(',').map(s => s.trim());
      filteredOrders = transformedOrders.filter(o => statuses.includes(o.status));
    }
    
    const duration = Date.now() - startTime;
    
    logger.debug('Orders retrieved', {
      count: filteredOrders.length,
      filters: { status: statusParam, customerId },
      duration,
    });
    
    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      count: filteredOrders.length,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error retrieving orders', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve orders',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

