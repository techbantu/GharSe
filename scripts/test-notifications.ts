/**
 * Test Script: Verify Email & SMS Notification Setup
 * 
 * Run: npx tsx scripts/test-notifications.ts
 */

import { Order } from '@/types';

async function testNotifications() {
  console.log('🧪 Testing Notification System...\n');

  // Create a mock order
  const mockOrder: Order = {
    id: 'test-order-123',
    orderNumber: 'BK-TEST001',
    customer: {
      id: 'test-customer',
      name: 'Test Customer',
      email: 'techbantu@gmail.com', // Your email
      phone: '+91 61927 78065', // Your phone
    },
    items: [
      {
        id: 'item-1',
        menuItemId: 'menu-1',
        menuItem: {
          id: 'menu-1',
          name: 'Test Dish',
          description: 'Test Description',
          price: 99,
          category: 'appetizers',
          image: '',
          isAvailable: true,
          isVegetarian: true,
          isSpicy: false,
          prepTime: 15,
          calories: 200,
          ingredients: [],
          allergens: [],
        },
        quantity: 1,
        customization: '',
        specialInstructions: '',
        subtotal: 99,
      },
    ],
    pricing: {
      subtotal: 99,
      tax: 4.95,
      deliveryFee: 50,
      discount: 0,
      tip: 0,
      total: 153.95,
    },
    status: 'pending-confirmation',
    orderType: 'delivery',
    estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    paymentMethod: 'cash-on-delivery',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      deliveryInstructions: 'Test instructions',
    },
    contactPreference: ['email', 'sms'],
    notifications: [],
  };

  try {
    // Test 1: Check Email Service Configuration
    console.log('📧 Test 1: Email Service Configuration');
    const emailConfig = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not Set',
      FROM_EMAIL: process.env.FROM_EMAIL || 'Not Set',
    };
    console.log(emailConfig);
    console.log('');

    // Test 2: Check SMS Service Configuration
    console.log('📱 Test 2: SMS Service Configuration (Twilio)');
    const smsConfig = {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Not Set',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Not Set',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'Not Set',
    };
    console.log(smsConfig);
    console.log('');

    // Test 3: Send Test Notifications
    console.log('🚀 Test 3: Sending Test Notifications...');
    const { notificationManager } = await import('@/lib/notifications/notification-manager');
    
    const result = await notificationManager.sendOrderConfirmation(mockOrder);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Email: ${result.email?.success ? '✅ Success' : '❌ Failed'}`);
    if (!result.email?.success) {
      console.log(`  Error: ${result.email?.error}`);
      if (result.email?.skipped) {
        console.log(`  Reason: Email service not configured`);
      }
    }
    
    console.log(`\nSMS: ${result.sms?.success ? '✅ Success' : '❌ Failed'}`);
    if (!result.sms?.success) {
      console.log(`  Error: ${result.sms?.error}`);
      if (result.sms?.skipped) {
        console.log(`  Reason: SMS service not configured`);
      }
    }
    
    console.log(`\nOverall: ${result.overall ? '✅ At least one succeeded' : '❌ All failed'}`);
    console.log('');

    // Instructions
    console.log('📝 Next Steps:');
    console.log('==============');
    
    if (!result.email?.success) {
      console.log('Email Setup:');
      console.log('1. Sign up at https://resend.com');
      console.log('2. Get your API key');
      console.log('3. Add to .env: RESEND_API_KEY=re_...');
      console.log('4. Add to .env: FROM_EMAIL=noreply@yourdomain.com');
      console.log('');
    }
    
    if (!result.sms?.success) {
      console.log('SMS Setup (Optional):');
      console.log('1. Sign up at https://twilio.com');
      console.log('2. Get Account SID, Auth Token, and Phone Number');
      console.log('3. Add to .env:');
      console.log('   TWILIO_ACCOUNT_SID=AC...');
      console.log('   TWILIO_AUTH_TOKEN=...');
      console.log('   TWILIO_PHONE_NUMBER=+1234567890');
      console.log('');
    }
    
    if (result.overall) {
      console.log('✅ Notifications are working! Check your email/phone.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testNotifications();

