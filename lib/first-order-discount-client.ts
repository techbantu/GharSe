/**
 * FIRST ORDER DISCOUNT CLIENT SERVICE
 * 
 * CLIENT-SAFE version that calls API routes (no Prisma in browser)
 * 
 * Purpose: Manages automatic 20% discount for first-time customers
 * 
 * Features:
 * - Auto-detects first order eligibility based on totalOrders = 0
 * - Calculates 20% discount on subtotal
 * - Tracks discount application
 * - No manual code entry required
 * 
 * Business Rules:
 * - Eligible: totalOrders === 0 (never completed an order)
 * - Discount: 20% off subtotal
 * - Auto-applied: No code entry needed
 * - Persists until first order completes successfully
 * - If order cancelled, discount remains available
 */

export interface FirstOrderDiscountResult {
  eligible: boolean;
  discountAmount: number;
  discountPercent: number;
  message: string;
  customerId?: string;
}

/**
 * Check if customer is eligible for first order discount
 * CLIENT-SAFE: Calls API route instead of using Prisma directly
 * 
 * @param customerId - Customer ID (required - must be logged in)
 * @returns Promise<FirstOrderDiscountResult>
 */
export async function checkFirstOrderDiscount(
  customerId: string | null
): Promise<FirstOrderDiscountResult> {
  try {
    // Must be logged in to get first order discount
    if (!customerId) {
      return {
        eligible: false,
        discountAmount: 0,
        discountPercent: 0,
        message: 'Please log in to get your 20% first order discount',
      };
    }

    // Call API route (server handles Prisma)
    const response = await fetch(
      `/api/first-order-discount?customerId=${encodeURIComponent(customerId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('[First Order Discount] Failed to check eligibility:', error);

    return {
      eligible: false,
      discountAmount: 0,
      discountPercent: 0,
      message: 'Error checking discount eligibility',
    };
  }
}

/**
 * Calculate first order discount amount
 * 
 * @param subtotal - Order subtotal before discount
 * @param customerId - Customer ID
 * @returns Promise<number> - Discount amount
 */
export async function calculateFirstOrderDiscount(
  subtotal: number,
  customerId: string | null
): Promise<number> {
  const eligibility = await checkFirstOrderDiscount(customerId);

  if (!eligibility.eligible) {
    return 0;
  }

  // 20% discount on subtotal
  const discount = Math.round(subtotal * 0.2 * 100) / 100; // Round to 2 decimal places
  
  return discount;
}

/**
 * Mark first order discount as used
 * Called when order is successfully completed
 * CLIENT-SAFE: Calls API route instead of using Prisma directly
 * 
 * @param customerId - Customer ID
 * @returns Promise<boolean>
 */
export async function markFirstOrderUsed(customerId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/first-order-discount/mark-used', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.success;

  } catch (error) {
    console.error('[First Order Discount] Failed to mark as used:', error);
    return false;
  }
}

/**
 * Get first order discount status for UI display
 * 
 * @param customerId - Customer ID
 * @returns Promise<{ available: boolean; message: string; discountPercent: number }>
 */
export async function getFirstOrderDiscountStatus(
  customerId: string | null
): Promise<{ available: boolean; message: string; discountPercent: number }> {
  const result = await checkFirstOrderDiscount(customerId);

  return {
    available: result.eligible,
    message: result.message,
    discountPercent: result.discountPercent,
  };
}

