#!/usr/bin/env node

/**
 * SMART STARTUP SCRIPT - Seeds database if empty, then starts dev server
 * 
 * What it does:
 * 1. Checks if OpenAI key is set
 * 2. Runs Prisma generate
 * 3. Seeds database (only if empty)
 * 4. Starts Next.js dev server
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('\n🚀 Starting Bantu\'s Kitchen with Smart Setup...\n');

// Step 1: Check OpenAI API Key
console.log('🔑 Checking OpenAI API key...');
const envPath = join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const hasOpenAIKey = envContent.includes('OPENAI_API_KEY=') && 
                     envContent.match(/OPENAI_API_KEY=["']?sk-[^"'\n]+["']?/);

if (!hasOpenAIKey) {
  console.error('❌ OPENAI_API_KEY not found in .env file!');
  console.error('   Add your OpenAI API key to .env');
  process.exit(1);
}
console.log('✅ OpenAI key found\n');

// Step 2: Generate Prisma Client
console.log('⚙️  Generating Prisma client...');
try {
  execSync('npx prisma generate', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  console.log('✅ Prisma client generated\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client');
  process.exit(1);
}

// Step 3: Check if database needs seeding
console.log('🌱 Checking database...');
try {
  // Push schema first
  console.log('   📦 Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  
  // Seed the database
  console.log('   🌱 Seeding database with menu items...');
  execSync('npm run prisma:seed', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  console.log('\n✅ Database ready\n');
} catch (error) {
  console.log('ℹ️  Database might already be seeded (this is OK)\n');
}

// Step 4: Cleanup dev processes
console.log('🧹 Cleaning up...');
try {
  execSync('node scripts/cleanup-dev.mjs', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
} catch (error) {
  // Cleanup might fail if nothing to clean, that's OK
}

// Step 5: Start dev server
console.log('\n🚀 Starting development server...\n');
console.log('=' .repeat(60));
console.log('✅ Setup complete! Your AI chat is ready!');
console.log('=' .repeat(60));
console.log('\n📍 Your app will be available at: http://localhost:3000');
console.log('🤖 AI Chat is in the bottom-right corner');
console.log('🔥 Test it with: "What\'s popular?" or "Show me spicy food"');
console.log('\n');

try {
  execSync('npm run dev:quick', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('\n❌ Dev server crashed');
  process.exit(1);
}

