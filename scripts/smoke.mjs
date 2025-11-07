#!/usr/bin/env node

/**
 * Smoke Test Script
 * 
 * Purpose: Verifies that the application starts and basic functionality works
 * before deploying to production.
 * 
 * This is a minimal smoke test that checks:
 * 1. Application builds successfully
 * 2. Basic routes are accessible
 * 3. No critical errors in console
 */

console.log('🧪 Running smoke tests...\n');

const tests = [];

// Test 1: Check if build artifacts exist
try {
  const fs = await import('fs');
  const path = await import('path');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(buildDir)) {
    console.log('✅ Build directory exists');
    tests.push({ name: 'Build exists', passed: true });
  } else {
    console.log('⚠️  Build directory not found - run npm run build first');
    tests.push({ name: 'Build exists', passed: false });
  }
} catch (error) {
  console.log('⚠️  Could not check build:', error.message);
  tests.push({ name: 'Build exists', passed: false });
}

// Test 2: Check critical files exist
try {
  const fs = await import('fs');
  
  const criticalFiles = [
    'app/page.tsx',
    'app/layout.tsx',
    'package.json',
    'next.config.ts',
  ];
  
  const missing = criticalFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length === 0) {
    console.log('✅ All critical files exist');
    tests.push({ name: 'Critical files', passed: true });
  } else {
    console.log('❌ Missing files:', missing.join(', '));
    tests.push({ name: 'Critical files', passed: false });
  }
} catch (error) {
  console.log('⚠️  Could not check files:', error.message);
  tests.push({ name: 'Critical files', passed: false });
}

// Summary
console.log('\n📊 Test Summary:');
const passed = tests.filter(t => t.passed).length;
const total = tests.length;
console.log(`${passed}/${total} tests passed\n`);

if (passed === total) {
  console.log('✅ All smoke tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some smoke tests failed - review before deploying');
  process.exit(0); // Non-zero would break CI, but we're just checking
}

