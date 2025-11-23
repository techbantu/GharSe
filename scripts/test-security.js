#!/usr/bin/env node

/**
 * 🧪 SECURITY SYSTEMS TEST SUITE
 * 
 * This script tests ALL security systems to prove they work
 */

console.log('\n🧪 SECURITY SYSTEMS TEST SUITE\n');
console.log('='.repeat(60));

let passedTests = 0;
let failedTests = 0;

function testPass(name) {
  console.log(`✅ PASS: ${name}`);
  passedTests++;
}

function testFail(name, error) {
  console.log(`❌ FAIL: ${name}`);
  console.log(`   Error: ${error.message}`);
  failedTests++;
}

// Test 1: Secrets Manager
console.log('\n1️⃣ Testing Secrets Manager...');
try {
  const { generateSecret, redactSecret } = require('../lib/security/secrets-manager.ts');
  
  const secret = generateSecret(32);
  if (secret.length !== 64) throw new Error('Invalid secret length');
  
  const redacted = redactSecret(secret);
  if (!redacted.includes('...')) throw new Error('Redaction failed');
  if (redacted.includes(secret.substring(10, 20))) throw new Error('Secret not properly redacted');
  
  testPass('Secrets Manager - Generate & Redact');
} catch (error) {
  testFail('Secrets Manager', error);
}

// Test 2: Brute Force Protection
console.log('\n2️⃣  Testing Brute Force Protection...');
try {
  const { recordFailedAttempt, checkLockout, resetAttempts } = require('../lib/security/brute-force-protection.ts');
  
  const testIP = '192.168.1.100';
  
  // Reset first
  resetAttempts(testIP);
  
  // Test 5 failed attempts
  for (let i = 0; i < 5; i++) {
    const result = recordFailedAttempt(testIP);
    if (i < 4 && result.isLocked) throw new Error('Locked too early');
    if (i === 4 && !result.isLocked) throw new Error('Not locked after 5 attempts');
  }
  
  // Verify lockout
  const lockout = checkLockout(testIP);
  if (!lockout.isLocked) throw new Error('Lockout check failed');
  
  // Reset
  resetAttempts(testIP);
  const afterReset = checkLockout(testIP);
  if (afterReset.isLocked) throw new Error('Reset failed');
  
  testPass('Brute Force Protection - Lockout & Reset');
} catch (error) {
  testFail('Brute Force Protection', error);
}

// Test 3: Rate Limiting
console.log('\n3️⃣ Testing Rate Limiting...');
try {
  const { checkRateLimit, RATE_LIMITS } = require('../lib/security/advanced-rate-limiting.ts');
  
  const testID = 'test-user-123';
  
  // Test rate limit
  const result1 = checkRateLimit(testID, RATE_LIMITS.AUTH);
  if (!result1.allowed) throw new Error('First request should be allowed');
  
  // Test remaining count
  if (result1.remaining >= RATE_LIMITS.AUTH.maxRequests) {
    throw new Error('Remaining count not decremented');
  }
  
  testPass('Rate Limiting - Request Tracking');
} catch (error) {
  testFail('Rate Limiting', error);
}

// Test 4: Security Headers
console.log('\n4️⃣ Testing Security Headers...');
try {
  const { getSecurityHeaders, validateOrigin, sanitizeInput, isValidEmail, validatePasswordStrength } = require('../lib/security/security-headers.ts');
  
  const headers = getSecurityHeaders();
  if (!headers['Content-Security-Policy']) throw new Error('CSP missing');
  if (!headers['Strict-Transport-Security']) throw new Error('HSTS missing');
  if (!headers['X-Frame-Options']) throw new Error('X-Frame-Options missing');
  
  // Test input sanitization
  const dirty = '<script>alert("xss")</script>';
  const clean = sanitizeInput(dirty);
  if (clean.includes('<script>')) throw new Error('XSS not sanitized');
  
  // Test email validation
  if (!isValidEmail('test@example.com')) throw new Error('Valid email rejected');
  if (isValidEmail('invalid-email')) throw new Error('Invalid email accepted');
  
  // Test password validation
  const weakPassword = validatePasswordStrength('12345');
  if (weakPassword.isValid) throw new Error('Weak password accepted');
  
  const strongPassword = validatePasswordStrength('MyStr0ng!Pass123');
  if (!strongPassword.isValid) throw new Error('Strong password rejected');
  
  testPass('Security Headers - All Functions');
} catch (error) {
  testFail('Security Headers', error);
}

// Test 5: IP Tracking
console.log('\n5️⃣ Testing IP Tracking...');
try {
  const { recordAttackAttempt, getIPThreatData, isKnownAttacker, AttackType } = require('../lib/security/ip-tracking.ts');
  
  const testIP = '10.0.0.1';
  
  // Record attacks
  recordAttackAttempt(testIP, AttackType.BRUTE_FORCE, { attempts: 1 });
  recordAttackAttempt(testIP, AttackType.SQL_INJECTION, { query: 'DROP TABLE' });
  
  const threatData = getIPThreatData(testIP);
  if (!threatData) throw new Error('Threat data not recorded');
  if (threatData.attacks.length < 2) throw new Error('Attacks not tracked');
  
  testPass('IP Tracking - Attack Recording');
} catch (error) {
  testFail('IP Tracking', error);
}

// Test 6: Honeypots
console.log('\n6️⃣ Testing Honeypots...');
try {
  const { HONEYPOT_ENDPOINTS } = require('../lib/security/honeypots.ts');
  
  if (!HONEYPOT_ENDPOINTS || HONEYPOT_ENDPOINTS.length === 0) {
    throw new Error('No honeypot endpoints defined');
  }
  
  const hasAdminHoneypot = HONEYPOT_ENDPOINTS.some(h => h.path.includes('admin'));
  const hasDBHoneypot = HONEYPOT_ENDPOINTS.some(h => h.path.includes('backup'));
  const hasEnvHoneypot = HONEYPOT_ENDPOINTS.some(h => h.path.includes('.env'));
  
  if (!hasAdminHoneypot) throw new Error('Missing admin honeypot');
  if (!hasDBHoneypot) throw new Error('Missing DB honeypot');
  if (!hasEnvHoneypot) throw new Error('Missing ENV honeypot');
  
  testPass('Honeypots - Endpoints Defined');
} catch (error) {
  testFail('Honeypots', error);
}

// Test 7: Credential Rotation
console.log('\n7️⃣ Testing Credential Rotation...');
try {
  const { generateSecret } = require('../lib/security/credential-rotation.ts');
  
  const secret1 = generateSecret(32);
  const secret2 = generateSecret(32);
  
  if (secret1.length !== 64) throw new Error('Invalid secret length');
  if (secret1 === secret2) throw new Error('Secrets not unique');
  
  testPass('Credential Rotation - Secret Generation');
} catch (error) {
  testFail('Credential Rotation', error);
}

// Test 8: Check for hardcoded passwords
console.log('\n8️⃣ Testing Hardcoded Password Removal...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    'scripts/auto-create-admin.js',
    'scripts/fix-admin-login.mjs',
    'scripts/check-admin.ts',
    'scripts/check-admin-password.js',
  ];
  
  let foundHardcoded = false;
  
  for (const file of filesToCheck) {
    const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
    
    // Check for actual hardcoded passwords (not in comments)
    const codeOnly = content.split('\n')
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    
    if (codeOnly.includes('Sailaja@2025') || codeOnly.includes('ChangeThisPassword')) {
      foundHardcoded = true;
      throw new Error(`Hardcoded password found in ${file}`);
    }
  }
  
  testPass('Hardcoded Password Removal - All Scripts Clean');
} catch (error) {
  testFail('Hardcoded Password Removal', error);
}

// Test 9: Check .env.example
console.log('\n9️⃣ Testing .env.example...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf-8');
  
  if (envExample.includes('Sailaja@2025')) throw new Error('Password in .env.example');
  if (envExample.includes('sk-proj-')) throw new Error('Real API key in .env.example');
  if (!envExample.includes('ADMIN_DEFAULT_PASSWORD=')) throw new Error('Missing password field');
  if (!envExample.includes('JWT_SECRET=')) throw new Error('Missing JWT_SECRET field');
  
  testPass('.env.example - Secure Template');
} catch (error) {
  testFail('.env.example', error);
}

// Test 10: Check scripts for env usage
console.log('\n🔟 Testing Scripts Use .env...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const autoCreateAdmin = fs.readFileSync(
    path.join(__dirname, '..', 'scripts/auto-create-admin.js'),
    'utf-8'
  );
  
  if (!autoCreateAdmin.includes('process.env.ADMIN_DEFAULT_PASSWORD')) {
    throw new Error('auto-create-admin.js not using .env');
  }
  
  if (!autoCreateAdmin.includes('if (!ADMIN_PASSWORD')) {
    throw new Error('auto-create-admin.js not validating password');
  }
  
  testPass('Scripts Use .env - Validation');
} catch (error) {
  testFail('Scripts Use .env', error);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 TEST RESULTS SUMMARY\n');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Security systems are operational.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED! Review errors above.\n');
  process.exit(1);
}

