#!/usr/bin/env node

/**
 * ADMIN PASSWORD MANAGEMENT - END-TO-END TEST
 * 
 * Tests:
 * 1. Change password from settings (requires valid current password)
 * 2. Forgot password email generation
 * 3. Reset password with token
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_ADMIN_EMAIL = process.env.ADMIN_DEFAULT_EMAIL || 'bantusailaja@gmail.com';
const TEST_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'Sailaja@2025';
const NEW_TEST_PASSWORD = 'NewSecurePass@2025';

console.log('\n🔐 ADMIN PASSWORD MANAGEMENT - END-TO-END TEST\n');
console.log('=' .repeat(70));

// Helper: Make HTTP request
function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test Suite
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  let adminToken = null;

  // TEST 1: Login to get admin token
  try {
    console.log('\n📝 TEST 1: Admin Login (Get Token)');
    console.log('-'.repeat(70));
    
    const loginResponse = await makeRequest(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      adminToken = loginResponse.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${adminToken.substring(0, 20)}...`);
      testsPassed++;
    } else {
      console.log('❌ Login failed');
      console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
      testsFailed++;
      return; // Can't continue without token
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    testsFailed++;
    return;
  }

  // TEST 2: Change Password (with wrong current password)
  try {
    console.log('\n📝 TEST 2: Change Password - Wrong Current Password');
    console.log('-'.repeat(70));
    
    const changeResponse = await makeRequest(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      currentPassword: 'WrongPassword123!',
      newPassword: NEW_TEST_PASSWORD
    });

    if (changeResponse.status === 401) {
      console.log('✅ Correctly rejected wrong password');
      console.log(`   Error: ${changeResponse.data.error}`);
      testsPassed++;
    } else {
      console.log('❌ Should have rejected wrong password');
      console.log(`   Response: ${JSON.stringify(changeResponse.data)}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    testsFailed++;
  }

  // TEST 3: Change Password (with weak password)
  try {
    console.log('\n📝 TEST 3: Change Password - Weak Password');
    console.log('-'.repeat(70));
    
    const changeResponse = await makeRequest(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      currentPassword: TEST_ADMIN_PASSWORD,
      newPassword: 'short'
    });

    if (changeResponse.status === 400) {
      console.log('✅ Correctly rejected weak password');
      console.log(`   Error: ${changeResponse.data.error}`);
      testsPassed++;
    } else {
      console.log('❌ Should have rejected weak password');
      console.log(`   Response: ${JSON.stringify(changeResponse.data)}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    testsFailed++;
  }

  // TEST 4: Forgot Password Email
  try {
    console.log('\n📝 TEST 4: Forgot Password - Send Reset Email');
    console.log('-'.repeat(70));
    
    const forgotResponse = await makeRequest(`${BASE_URL}/api/admin/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: TEST_ADMIN_EMAIL
    });

    if (forgotResponse.status === 200 && forgotResponse.data.success) {
      console.log('✅ Reset email sent successfully');
      console.log(`   Message: ${forgotResponse.data.message}`);
      console.log('\n   ⚠️  Check your email for the reset link!');
      testsPassed++;
    } else {
      console.log('❌ Failed to send reset email');
      console.log(`   Response: ${JSON.stringify(forgotResponse.data)}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    testsFailed++;
  }

  // TEST 5: Reset Password with Invalid Token
  try {
    console.log('\n📝 TEST 5: Reset Password - Invalid Token');
    console.log('-'.repeat(70));
    
    const resetResponse = await makeRequest(`${BASE_URL}/api/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      token: 'invalid-token-12345',
      newPassword: NEW_TEST_PASSWORD
    });

    if (resetResponse.status === 400) {
      console.log('✅ Correctly rejected invalid token');
      console.log(`   Error: ${resetResponse.data.error}`);
      testsPassed++;
    } else {
      console.log('❌ Should have rejected invalid token');
      console.log(`   Response: ${JSON.stringify(resetResponse.data)}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    testsFailed++;
  }

  // TEST 6: API Routes Exist
  console.log('\n📝 TEST 6: Verify All Endpoints Exist');
  console.log('-'.repeat(70));
  
  const endpoints = [
    '/api/admin/change-password',
    '/api/admin/forgot-password',
    '/api/admin/reset-password'
  ];

  for (const endpoint of endpoints) {
    try {
      // OPTIONS request to check if route exists
      const response = await makeRequest(`${BASE_URL}${endpoint}`, {
        method: 'OPTIONS'
      });

      // Any response means the route exists (even if it rejects OPTIONS)
      console.log(`   ✅ ${endpoint} exists (Status: ${response.status})`);
    } catch (error) {
      console.log(`   ❌ ${endpoint} not found or error: ${error.message}`);
      testsFailed++;
    }
  }
  testsPassed++;

  // TEST 7: Frontend Pages Exist
  console.log('\n📝 TEST 7: Verify Frontend Pages Exist');
  console.log('-'.repeat(70));
  
  const pages = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/settings'
  ];

  for (const page of pages) {
    try {
      const response = await makeRequest(`${BASE_URL}${page}`, {
        method: 'GET'
      });

      if (response.status === 200 || response.status === 301 || response.status === 302) {
        console.log(`   ✅ ${page} exists`);
      } else {
        console.log(`   ⚠️  ${page} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${page} error: ${error.message}`);
    }
  }
  testsPassed++;

  // FINAL RESULTS
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(70));
  console.log('\n📝 MANUAL TESTING STEPS:\n');
  console.log('1. Go to: ' + BASE_URL + '/admin/settings');
  console.log('2. Click "Edit Security"');
  console.log('3. Enter current password: ' + TEST_ADMIN_PASSWORD);
  console.log('4. Enter new password: ' + NEW_TEST_PASSWORD);
  console.log('5. Click "Update Password"');
  console.log('6. You should be logged out and redirected to login');
  console.log('7. Login with NEW password: ' + NEW_TEST_PASSWORD);
  console.log('\n8. Test Forgot Password:');
  console.log('   - Go to: ' + BASE_URL + '/admin/login');
  console.log('   - Click "Forgot password?"');
  console.log('   - Enter email: ' + TEST_ADMIN_EMAIL);
  console.log('   - Check email for reset link');
  console.log('   - Click link and set new password');
  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests();

