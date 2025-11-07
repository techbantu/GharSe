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
import { Order, OrderStatus, CustomerInfo, Address } from '@/types';
import { Result, Ok, Err, ValidationError, ServerError, AppError } from '@/utils/result';
import { logger } from '@/utils/logger';
import { applyRateLimit, RATE_LIMITS } from '@/utils/rate-limit';
import { restaurantInfo } from '@/data/menuData';
import { addOrder, getOrders, getOrdersCount } from '@/lib/order-storage';
import prisma from '@/lib/prisma';

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
    total: z.number().nonnegative(),
  }),
  orderType: z.enum(['delivery', 'pickup']).default('delivery'),
  paymentMethod: z.enum(['cash-on-delivery', 'card', 'upi']).default('cash-on-delivery'),
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
    
    // Create order object
    const order: Order = {
      id: orderId,
      orderNumber,
      customer: data.customer as CustomerInfo,
      items: data.items,
      pricing: data.pricing,
      status: 'pending' as OrderStatus,
      orderType: data.orderType,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      specialInstructions: data.specialInstructions,
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedReadyTime,
      deliveryAddress: data.deliveryAddress as Address | undefined,
      contactPreference: ['email', 'sms'],
      notifications: [],
    };
    
    // Save to storage (in-memory for now, also save to database)
    addOrder(order);
    
    // Save to database and decrement inventory (with transaction)
    try {
      await prisma.$transaction(async (tx) => {
        // Create order in database
        await tx.order.create({
          data: {
            id: orderId,
            orderNumber,
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
            discount: data.pricing.discount || 0,
            total: data.pricing.total,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: data.paymentMethod,
            estimatedDelivery: estimatedReadyTime,
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
        
        // Decrement inventory for items with inventory tracking enabled
        for (const item of data.items) {
          const menuItem = await tx.menuItem.findUnique({
            where: { id: item.menuItem.id },
            select: { inventoryEnabled: true, inventory: true },
          });
          
          if (menuItem && menuItem.inventoryEnabled && menuItem.inventory !== null && menuItem.inventory !== undefined) {
            const newInventory = menuItem.inventory - item.quantity;
            
            // Check if sufficient inventory (shouldn't happen if frontend is working correctly, but double-check)
            if (newInventory < 0) {
              throw new Error(`Insufficient inventory for item ${item.menuItem.name}. Only ${menuItem.inventory} available.`);
            }
            
            // Update inventory
            await tx.menuItem.update({
              where: { id: item.menuItem.id },
              data: { inventory: newInventory },
            });
            
            logger.info(`Inventory decremented for ${item.menuItem.name}`, {
              itemId: item.menuItem.id,
              quantity: item.quantity,
              newInventory,
            });
          }
        }
      });
      
      logger.info('Order saved to database with inventory update', {
        orderId,
        orderNumber,
      });
    } catch (dbError: any) {
      logger.error('Failed to save order to database', {
        orderId,
        error: dbError.message,
      });
      
      // Return error if inventory insufficient or database error
      if (dbError.message.includes('Insufficient inventory')) {
        return Err(
          new ValidationError(
            dbError.message,
            'items',
            'INSUFFICIENT_INVENTORY'
          )
        );
      }
      
      // Log but don't fail the order creation (order is already in memory)
      // In production, we'd want to retry or use a message queue
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
    
    // Handle multiple statuses (comma-separated)
    let statusFilter: string | undefined;
    if (statusParam) {
      // Split by comma and filter
      const statuses = statusParam.split(',').map(s => s.trim());
      const validStatuses: OrderStatus[] = [
        'pending', 'confirmed', 'preparing', 'ready',
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
    
    // Get filtered orders from shared storage
    let filteredOrders = getOrders({
      status: statusFilter,
      customerId: customerId || undefined,
    });
    
    // If multiple statuses were provided, filter here
    if (statusParam && statusParam.includes(',')) {
      const statuses = statusParam.split(',').map(s => s.trim());
      filteredOrders = filteredOrders.filter(o => statuses.includes(o.status));
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

