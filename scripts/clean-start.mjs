#!/usr/bin/env node

/**
 * CLEAN START SCRIPT
 * 
 * Purpose: Ensures a completely clean dev server start by:
 * 1. Killing any running Next.js processes
 * 2. Clearing all cache directories
 * 3. Starting fresh
 * 
 * Usage: npm run dev:clean
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧹 Starting clean development server...\n');

// Step 1: Kill any running Next.js processes
console.log('1️⃣  Stopping any running Next.js processes...');
try {
  execSync('pkill -9 node', { stdio: 'ignore' });
  console.log('   ✅ Processes stopped\n');
} catch (error) {
  console.log('   ℹ️  No running processes found\n');
}

// Step 2: Remove cache directories
console.log('2️⃣  Clearing cache directories...');
const cacheDirs = [
  path.join(rootDir, '.next'),
  path.join(rootDir, '.turbo'),
  path.join(rootDir, 'node_modules', '.cache'),
];

for (const dir of cacheDirs) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`   ✅ Removed ${path.basename(dir)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Could not remove ${path.basename(dir)}: ${error.message}`);
  }
}

console.log('\n3️⃣  Generating Prisma Client...');
try {
  execSync('prisma generate', { stdio: 'inherit', cwd: rootDir });
  console.log('   ✅ Prisma Client generated\n');
} catch (error) {
  console.log('   ⚠️  Prisma generation failed, continuing anyway...\n');
}

console.log('✨ Clean start complete! Starting dev server with webpack (more stable)...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 4: Start the dev server with webpack (avoids Turbopack issues)
try {
  // Use webpack mode to avoid Turbopack panics
  const env = { ...process.env, TURBOPACK: '0' };
  execSync('next dev', { stdio: 'inherit', cwd: rootDir, env });
} catch (error) {
  console.error('\n❌ Dev server failed to start');
  process.exit(1);
}

