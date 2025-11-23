#!/usr/bin/env node

/**
 * AUTOMATED PASSWORD CHANGE TEST
 * 
 * This script will:
 * 1. Login to get a fresh token
 * 2. Attempt to change password
 * 3. Report results
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'bantusailaja@gmail.com';
const CURRENT_PASSWORD = 'Sailaja@2025';
const NEW_PASSWORD = 'MyNewSecure@Pass2025';

console.log('\n🔐 AUTOMATED PASSWORD CHANGE TEST\n');
console.log('='.repeat(70));

// Helper: Make HTTP request
function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            data: parsed, 
            headers: res.headers,
            cookies: res.headers['set-cookie'] || []
          });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers, cookies: [] });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    // STEP 1: Login
    console.log('\n📝 STEP 1: Admin Login');
    console.log('-'.repeat(70));
    
    const loginResponse = await makeRequest(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: ADMIN_EMAIL,
      password: CURRENT_PASSWORD
    });

    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      console.log('❌ Login FAILED');
      console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
      process.exit(1);
    }

    console.log('✅ Login successful');
    
    // Extract cookie
    const cookies = loginResponse.cookies;
    const adminTokenCookie = cookies.find(c => c.startsWith('admin_token='));
    
    if (!adminTokenCookie) {
      console.log('❌ No admin_token cookie received!');
      console.log('   Cookies:', cookies);
      process.exit(1);
    }
    
    console.log('✅ Token cookie received:', adminTokenCookie.substring(0, 50) + '...');

    // STEP 2: Change Password
    console.log('\n📝 STEP 2: Change Password');
    console.log('-'.repeat(70));
    
    const changeResponse = await makeRequest(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminTokenCookie
      }
    }, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD
    });

    if (changeResponse.status === 200 && changeResponse.data.success) {
      console.log('✅ Password changed successfully!');
      console.log('\n🎉 TEST PASSED!');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Your password has been changed to:', NEW_PASSWORD);
      console.log('   2. Try logging in with the new password');
      console.log('   3. URL: http://localhost:3000/admin/login');
      process.exit(0);
    } else {
      console.log('❌ Password change FAILED');
      console.log('   Status:', changeResponse.status);
      console.log('   Response:', JSON.stringify(changeResponse.data, null, 2));
      
      // Debug: Check what token was sent
      console.log('\n🔍 DEBUG INFO:');
      console.log('   Cookie sent:', adminTokenCookie.substring(0, 100));
      
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();

