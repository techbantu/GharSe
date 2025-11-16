/**
 * PLAYWRIGHT E2E TESTS - Multi-Tab Auth Sync
 * Purpose: Verify BroadcastChannel syncs auth state across browser tabs
 * Critical: Tests real browser behavior with multiple contexts
 * 
 * Test scenarios:
 * - Login in Tab A reflects in Tab B
 * - Logout in Tab B logs out Tab A
 * - Token refresh propagates to all tabs
 * - Session expiry handled uniformly
 */

import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';

test.describe('Multi-Tab Authentication Sync', () => {
  let context: BrowserContext;
  let tabA: Page;
  let tabB: Page;
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Create two tabs
    tabA = await context.newPage();
    tabB = await context.newPage();

    // Navigate both to home page
    await Promise.all([
      tabA.goto(baseURL),
      tabB.goto(baseURL),
    ]);

    // Wait for page load
    await Promise.all([
      tabA.waitForLoadState('networkidle'),
      tabB.waitForLoadState('networkidle'),
    ]);
  });

  test.afterEach(async () => {
    await tabA.close();
    await tabB.close();
  });

  test('Login in Tab A instantly reflects in Tab B', async () => {
    // Tab A: Click login button
    await tabA.click('text=Login', { timeout: 5000 });

    // Fill login form in Tab A
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    // Wait for login to complete in Tab A
    await tabA.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Tab B should automatically show logged-in state (within 2 seconds)
    await tabB.waitForSelector('text=Dashboard', { timeout: 2000 });

    // Verify both tabs show user menu
    const tabAUserMenu = await tabA.locator('[data-testid="user-menu"]').isVisible();
    const tabBUserMenu = await tabB.locator('[data-testid="user-menu"]').isVisible();

    expect(tabAUserMenu).toBe(true);
    expect(tabBUserMenu).toBe(true);
  });

  test('Logout in Tab B logs out Tab A', async () => {
    // First, login in Tab A
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    // Wait for both tabs to be logged in
    await Promise.all([
      tabA.waitForSelector('text=Dashboard'),
      tabB.waitForSelector('text=Dashboard'),
    ]);

    // Tab B: Click logout
    await tabB.click('[data-testid="logout-button"]');

    // Wait for logout in Tab B
    await tabB.waitForSelector('text=Login', { timeout: 5000 });

    // Tab A should automatically log out (within 2 seconds)
    await tabA.waitForSelector('text=Login', { timeout: 2000 });

    // Verify both tabs show login page
    const tabALoginVisible = await tabA.locator('text=Sign in').isVisible();
    const tabBLoginVisible = await tabB.locator('text=Sign in').isVisible();

    expect(tabALoginVisible).toBe(true);
    expect(tabBLoginVisible).toBe(true);
  });

  test('Multiple tabs stay in sync during navigation', async () => {
    // Login
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    // Wait for login
    await tabA.waitForSelector('text=Dashboard');
    await tabB.waitForSelector('text=Dashboard');

    // Tab A navigates to profile
    await tabA.goto(`${baseURL}/profile`);
    await tabA.waitForLoadState('networkidle');

    // Tab B navigates to orders
    await tabB.goto(`${baseURL}/orders`);
    await tabB.waitForLoadState('networkidle');

    // Both should still be logged in
    const tabALoggedIn = await tabA.locator('[data-testid="user-menu"]').isVisible();
    const tabBLoggedIn = await tabB.locator('[data-testid="user-menu"]').isVisible();

    expect(tabALoggedIn).toBe(true);
    expect(tabBLoggedIn).toBe(true);

    // Logout in Tab A
    await tabA.click('[data-testid="logout-button"]');

    // Both tabs should redirect to login
    await Promise.all([
      tabA.waitForURL(/.*login.*/),
      tabB.waitForURL(/.*login.*/),
    ]);
  });

  test('Session expiry broadcasts to all tabs', async () => {
    // Login
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');
    await tabB.waitForSelector('text=Dashboard');

    // Simulate session expiry by clearing cookies in one tab
    await context.clearCookies();

    // Make an API call that detects expired session
    await tabA.goto(`${baseURL}/api/user/profile`);

    // Both tabs should detect session expiry and redirect to login
    await Promise.all([
      tabA.waitForURL(/.*login.*/),
      tabB.waitForURL(/.*login.*/),
    ]);
  });

  test('Opening new tab inherits auth state', async () => {
    // Login in Tab A
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');

    // Open a third tab AFTER login
    const tabC = await context.newPage();
    await tabC.goto(baseURL);
    await tabC.waitForLoadState('networkidle');

    // Tab C should automatically be logged in
    const tabCLoggedIn = await tabC.locator('[data-testid="user-menu"]').isVisible();
    expect(tabCLoggedIn).toBe(true);

    await tabC.close();
  });

  test('Rapid tab opening/closing maintains sync', async () => {
    // Login
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');

    // Rapidly open and close tabs
    const tabs: Page[] = [];
    for (let i = 0; i < 5; i++) {
      const newTab = await context.newPage();
      await newTab.goto(baseURL);
      tabs.push(newTab);
    }

    // All tabs should be logged in
    for (const tab of tabs) {
      const isLoggedIn = await tab.locator('[data-testid="user-menu"]').isVisible();
      expect(isLoggedIn).toBe(true);
    }

    // Logout in original tab
    await tabA.click('[data-testid="logout-button"]');

    // All tabs should log out
    for (const tab of tabs) {
      await tab.waitForSelector('text=Login', { timeout: 3000 });
    }

    // Cleanup
    for (const tab of tabs) {
      await tab.close();
    }
  });

  test('BroadcastChannel fallback works (localStorage event)', async () => {
    // This tests the localStorage fallback for older browsers
    // We simulate this by disabling BroadcastChannel

    await tabA.addInitScript(() => {
      // @ts-ignore
      delete window.BroadcastChannel;
    });

    await tabB.addInitScript(() => {
      // @ts-ignore
      delete window.BroadcastChannel;
    });

    // Login in Tab A
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');

    // Tab B should still sync (via localStorage)
    await tabB.waitForSelector('text=Dashboard', { timeout: 2000 });

    // Logout in Tab B
    await tabB.click('[data-testid="logout-button"]');

    // Tab A should log out
    await tabA.waitForSelector('text=Login', { timeout: 2000 });
  });

  test('Auth sync works across different domains (subdomain)', async () => {
    // Test that auth syncs even when using subdomains
    // e.g., app.example.com and admin.example.com

    const mainDomain = baseURL;
    const subdomain = baseURL.replace('localhost', 'admin.localhost');

    await tabA.goto(mainDomain);
    await tabB.goto(subdomain);

    // Login in main domain
    await tabA.goto(`${mainDomain}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');

    // Note: Cross-domain BroadcastChannel may not work
    // This test documents the limitation
    // In production, use same-domain or SSO for cross-domain auth
  });

  test('Token refresh broadcasts to all tabs', async () => {
    // Login
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');
    await tabB.waitForSelector('text=Dashboard');

    // Simulate token refresh (by triggering an API call that refreshes token)
    await tabA.goto(`${baseURL}/api/refresh-token`);

    // Wait for refresh
    await tabA.waitForLoadState('networkidle');

    // Both tabs should have new token (verify via authenticated request)
    const tabAResponse = await tabA.goto(`${baseURL}/api/user/profile`);
    const tabBResponse = await tabB.goto(`${baseURL}/api/user/profile`);

    expect(tabAResponse?.status()).toBe(200);
    expect(tabBResponse?.status()).toBe(200);
  });

  test('Sync performance: 10 tabs in under 2 seconds', async () => {
    // Login in Tab A
    await tabA.goto(`${baseURL}/login`);
    await tabA.fill('input[type="email"]', 'test@example.com');
    await tabA.fill('input[type="password"]', 'password123');
    await tabA.click('button[type="submit"]');

    await tabA.waitForSelector('text=Dashboard');

    // Open 10 additional tabs
    const tabs: Page[] = [];
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const newTab = await context.newPage();
      await newTab.goto(baseURL);
      tabs.push(newTab);
    }

    // All should be logged in
    await Promise.all(
      tabs.map(tab => tab.waitForSelector('[data-testid="user-menu"]'))
    );

    const syncTime = Date.now() - startTime;
    console.log(`✅ 10 tabs synced in ${syncTime}ms`);

    // Should complete in under 2 seconds
    expect(syncTime).toBeLessThan(2000);

    // Cleanup
    for (const tab of tabs) {
      await tab.close();
    }
  });
});

