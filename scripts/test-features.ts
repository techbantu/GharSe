/**
 * COMPREHENSIVE FEATURE TESTING SCRIPT
 * 
 * Purpose: Test all implemented features to ensure they work correctly
 * 
 * Run with: npx ts-node scripts/test-features.ts
 * Or: npm run test:features
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(
  name: string,
  category: string,
  url: string,
  options?: RequestInit
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name,
        category,
        status: 'pass',
        message: `✅ Passed (${response.status}) - ${duration}ms`,
        duration,
      };
    } else {
      const errorText = await response.text();
      
      // Check if it's a "not configured" error (expected for optional features)
      if (errorText.includes('NOT CONFIGURED') || errorText.includes('Missing')) {
        return {
          name,
          category,
          status: 'skip',
          message: `⚠️ Skipped - Feature not configured (${response.status})`,
          duration,
        };
      }
      
      return {
        name,
        category,
        status: 'fail',
        message: `❌ Failed (${response.status}) - ${errorText.substring(0, 100)}`,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      category,
      status: 'fail',
      message: `❌ Error - ${error instanceof Error ? error.message : String(error)}`,
      duration,
    };
  }
}

async function runTests() {
  log('\n========================================', colors.bold);
  log('🧪 COMPREHENSIVE FEATURE TEST SUITE', colors.blue + colors.bold);
  log('========================================\n', colors.bold);
  
  log(`Testing: ${BASE_URL}\n`, colors.blue);
  
  // ===== SETUP VALIDATION =====
  log('📋 Category: Setup & Configuration', colors.bold);
  results.push(await testEndpoint(
    'Setup Validation',
    'Setup',
    '/api/setup/validate'
  ));
  
  // ===== DATABASE =====
  log('\n💾 Category: Database', colors.bold);
  results.push(await testEndpoint(
    'Database Connection Test',
    'Database',
    '/api/setup/validate?service=database'
  ));
  
  // ===== MENU API =====
  log('\n🍽️ Category: Menu', colors.bold);
  results.push(await testEndpoint(
    'Get Menu Items',
    'Menu',
    '/api/menu'
  ));
  
  results.push(await testEndpoint(
    'Search Menu Items',
    'Menu',
    '/api/menu/search?q=biryani'
  ));
  
  // ===== ORDERS API =====
  log('\n📦 Category: Orders', colors.bold);
  results.push(await testEndpoint(
    'Get Orders',
    'Orders',
    '/api/orders'
  ));
  
  // Test order creation
  const testOrder = {
    items: [
      {
        menuItemId: 'test-item',
        quantity: 2,
        price: 299,
        subtotal: 598,
      },
    ],
    customer: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919876543210',
    },
    orderType: 'delivery',
    deliveryAddress: {
      street: '123 Test Street',
      city: 'Hyderabad',
      zipCode: '500001',
    },
    paymentMethod: 'cash-on-delivery',
    specialInstructions: 'Test order',
    pricing: {
      subtotal: 598,
      tax: 59.8,
      deliveryFee: 0,
      total: 657.8,
    },
  };
  
  results.push(await testEndpoint(
    'Create Order (COD)',
    'Orders',
    '/api/orders',
    {
      method: 'POST',
      body: JSON.stringify(testOrder),
    }
  ));
  
  // ===== PAYMENT GATEWAYS =====
  log('\n💳 Category: Payments', colors.bold);
  
  // Razorpay
  results.push(await testEndpoint(
    'Razorpay Payment Intent',
    'Payments',
    '/api/payments/create-intent',
    {
      method: 'POST',
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        provider: 'razorpay',
        orderId: 'test-order-razorpay',
        customerEmail: 'test@example.com',
        customerPhone: '+919876543210',
      }),
    }
  ));
  
  // Stripe
  results.push(await testEndpoint(
    'Stripe Payment Intent',
    'Payments',
    '/api/payments/create-intent',
    {
      method: 'POST',
      body: JSON.stringify({
        amount: 500,
        currency: 'INR',
        provider: 'stripe',
        orderId: 'test-order-stripe',
        customerEmail: 'test@example.com',
      }),
    }
  ));
  
  // ===== NOTIFICATIONS =====
  log('\n🔔 Category: Notifications', colors.bold);
  results.push(await testEndpoint(
    'Email Service Test',
    'Notifications',
    '/api/setup/validate?service=email'
  ));
  
  // ===== AI CHAT =====
  log('\n🤖 Category: AI Chat', colors.bold);
  results.push(await testEndpoint(
    'AI Chat',
    'AI',
    '/api/chat',
    {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' },
        ],
      }),
    }
  ));
  
  // ===== MULTI-CHEF PLATFORM =====
  log('\n👨‍🍳 Category: Multi-Chef Platform', colors.bold);
  results.push(await testEndpoint(
    'Get Chefs List',
    'Multi-Chef',
    '/api/chefs'
  ));
  
  results.push(await testEndpoint(
    'Chef Registration',
    'Multi-Chef',
    '/api/chefs',
    {
      method: 'POST',
      body: JSON.stringify({
        businessName: 'Test Kitchen',
        slug: 'test-kitchen-' + Date.now(),
        ownerName: 'Test Chef',
        email: 'chef@test.com',
        phone: '+919876543210',
        address: {
          street: '123 Test St',
          city: 'Hyderabad',
          state: 'Telangana',
          zipCode: '500001',
        },
        cuisine: ['Indian', 'South Indian'],
        description: 'Test kitchen description',
      }),
    }
  ));
  
  // ===== ANALYTICS =====
  log('\n📊 Category: Analytics', colors.bold);
  results.push(await testEndpoint(
    'Analytics Event Tracking',
    'Analytics',
    '/api/analytics',
    {
      method: 'POST',
      body: JSON.stringify({
        event: 'test_event',
        page: 'test',
      }),
    }
  ));
  
  // ===== CACHING =====
  log('\n⚡ Category: Performance', colors.bold);
  results.push(await testEndpoint(
    'Redis Cache Test',
    'Performance',
    '/api/setup/validate?service=redis'
  ));
  
  // ===== GENERATE REPORT =====
  log('\n========================================', colors.bold);
  log('📊 TEST RESULTS SUMMARY', colors.blue + colors.bold);
  log('========================================\n', colors.bold);
  
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);
  
  Object.entries(groupedResults).forEach(([category, categoryResults]) => {
    log(`\n${category}:`, colors.bold);
    categoryResults.forEach((result) => {
      const statusColor = 
        result.status === 'pass' ? colors.green :
        result.status === 'skip' ? colors.yellow :
        colors.red;
      
      log(`  ${result.message}`, statusColor);
      log(`    ${result.name} (${result.duration}ms)`, colors.reset);
    });
  });
  
  // Overall statistics
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const total = results.length;
  
  log('\n========================================', colors.bold);
  log('FINAL SCORE', colors.bold);
  log('========================================', colors.bold);
  log(`✅ Passed: ${passed}/${total}`, colors.green);
  log(`❌ Failed: ${failed}/${total}`, failed > 0 ? colors.red : colors.reset);
  log(`⚠️  Skipped: ${skipped}/${total} (not configured)`, colors.yellow);
  
  const successRate = Math.round((passed / (total - skipped)) * 100);
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.yellow);
  
  if (skipped > 0) {
    log('\n💡 Tip: Configure skipped features to improve functionality', colors.blue);
    log('Run: npm run dev and visit http://localhost:3000/admin/setup', colors.blue);
  }
  
  if (failed > 0) {
    log('\n⚠️  Some tests failed - check logs above for details', colors.red);
    process.exit(1);
  } else {
    log('\n🎉 All configured features are working!', colors.green + colors.bold);
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, colors.red);
  process.exit(1);
});


