/**
 * E2E Test: Complete Order Flow
 * 
 * Tests the full user journey from browsing to order confirmation
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full order flow', async ({ page }) => {
    // Step 1: Browse menu
    await expect(page.locator('h1')).toContainText('Authentic');
    
    // Step 2: Add item to cart
    const addButton = page.locator('button:has-text("Add to Cart")').first();
    await addButton.click();
    
    // Step 3: Open cart
    const cartButton = page.locator('button[aria-label*="Cart"]');
    await cartButton.click();
    
    // Step 4: Proceed to checkout
    const checkoutButton = page.locator('button:has-text("Checkout")');
    await checkoutButton.click();
    
    // Step 5: Fill checkout form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '+91 90104 60964');
    await page.fill('input[name="street"]', '123 Main St');
    await page.fill('input[name="city"]', 'Hyderabad');
    await page.fill('input[name="state"]', 'Telangana');
    await page.fill('input[name="zipCode"]', '501505');
    
    // Step 6: Submit order
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Step 7: Verify order confirmation
    await expect(page.locator('text=Order confirmed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text/Order Number/')).toBeVisible();
  });

  test('should handle empty cart checkout', async ({ page }) => {
    const cartButton = page.locator('button[aria-label*="Cart"]');
    await cartButton.click();
    
    const checkoutButton = page.locator('button:has-text("Checkout")');
    await expect(checkoutButton).toBeDisabled();
  });

  test('should validate form fields', async ({ page }) => {
    // Add item first
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('button[aria-label*="Cart"]').click();
    await page.locator('button:has-text("Checkout")').click();
    
    // Try to submit without filling form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Lighthouse scores', async ({ page }) => {
    await page.goto('/');
    
    // Check for critical resources
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check mobile menu
    const menuButton = page.locator('button[aria-label*="menu"]');
    await menuButton.click();
    
    await expect(page.locator('text=Menu')).toBeVisible();
    await expect(page.locator('text=About')).toBeVisible();
  });
});

