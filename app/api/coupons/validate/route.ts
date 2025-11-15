/**
 * COUPON VALIDATION API
 * 
 * POST /api/coupons/validate
 * 
 * Purpose: Validate coupon code and calculate discount
 * 
 * Features:
 * - Real-time validation
 * - User verification checks
 * - Discount calculation
 * - Business rule enforcement
 * 
 * Security: Requires authentication for coupon usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { extractTokenFromHeader, extractTokenFromCookie, verifyToken } from '@/lib/auth-customer';
import { validateCoupon } from '@/lib/coupon-validator';

/**
 * Validation schema for coupon validation request
 */
const ValidateCouponSchema = z.object({
  code: z.string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code is too long')
    .regex(/^[A-Z0-9\-]+$/i, 'Coupon code can only contain letters, numbers, and hyphens'),
  orderAmount: z.number()
    .positive('Order amount must be positive'),
  items: z.array(z.object({
    category: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).optional(),
});

/**
 * POST /api/coupons/validate
 * 
 * Validate coupon code
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = ValidateCouponSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const firstError = errors[0];
      
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || 'Invalid coupon validation data',
          field: firstError?.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Extract customer ID from token (optional - guests can check but can't apply)
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    const token = extractTokenFromHeader(authHeader) || extractTokenFromCookie(cookieHeader);
    
    let customerId: string | null = null;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        customerId = decoded.customerId;
      }
    }
    
    // Validate coupon
    const result = await validateCoupon(
      data.code,
      customerId,
      data.orderAmount,
      data.items
    );
    
    const duration = Date.now() - startTime;
    
    if (!result.valid) {
      logger.info('Coupon validation failed', {
        code: data.code.substring(0, 5) + '***',
        customerId,
        reason: result.message,
        duration,
      });
      
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: result.message,
          requiresLogin: result.requiresVerification && !customerId,
          requiresVerification: result.requiresVerification && !!customerId,
        },
        { status: 200 }
      );
    }
    
    logger.info('Coupon validated successfully', {
      code: data.code.substring(0, 5) + '***',
      customerId,
      discount: result.discount,
      duration,
    });
    
    return NextResponse.json(
      {
        success: true,
        valid: true,
        discount: result.discount,
        discountType: result.discountType,
        message: result.message,
        couponId: result.couponId,
      },
      { status: 200 }
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Coupon validation endpoint failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    }, error instanceof Error ? error : undefined);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate coupon. Please try again.',
      },
      { status: 500 }
    );
  }
}

