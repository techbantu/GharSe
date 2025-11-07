/**
 * NEW FILE: Currency Utility Functions
 * 
 * Purpose: Centralized currency formatting for Indian Rupees
 */

/**
 * Format price in Indian Rupees
 * @param amount - Price amount
 * @returns Formatted string with ₹ symbol
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

/**
 * Format price with decimals (for precise amounts)
 * @param amount - Price amount
 * @returns Formatted string with ₹ symbol and decimals
 */
export function formatPriceWithDecimals(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Format price in Indian numbering system (lakhs/crores)
 * @param amount - Price amount
 * @returns Formatted string in Indian style
 */
export function formatPriceIndian(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return formatted;
}

/**
 * Currency symbol
 */
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

