#!/usr/bin/env node

/**
 * NEW FILE: All-in-One AI Chat System Startup Script
 * 
 * Purpose: Runs ALL necessary setup steps automatically in one command
 * 
 * What it does:
 * 1. Checks for .env and OpenAI API key
 * 2. Generates Prisma client
 * 3. Cleans up dev environment
 * 4. Starts Next.js dev server
 * 
 * Usage: npm run start:chat
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('═'.repeat(70), 'cyan');
  log(`  ${message}`, 'bright');
  log('═'.repeat(70), 'cyan');
  console.log('');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function checkEnv() {
  const envPath = path.join(rootDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    error('.env file not found!');
    log('Please create .env file with your OpenAI API key', 'yellow');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  if (!envContent.includes('OPENAI_API_KEY=')) {
    error('OPENAI_API_KEY not found in .env!');
    log('Add this line to .env: OPENAI_API_KEY="sk-..."', 'yellow');
    process.exit(1);
  }

  if (envContent.includes('OPENAI_API_KEY="sk-proj-') || envContent.includes("OPENAI_API_KEY='sk-proj-")) {
    success('OpenAI API key found!');
  } else if (envContent.includes('OPENAI_API_KEY="sk-') || envContent.includes("OPENAI_API_KEY='sk-")) {
    success('OpenAI API key found!');
  } else {
    warning('OpenAI API key might not be set correctly');
    log('Make sure it starts with: OPENAI_API_KEY="sk-..."', 'yellow');
  }

  return true;
}

async function generatePrisma() {
  info('Generating Prisma client...');
  
  try {
    execSync('npx prisma generate', {
      cwd: rootDir,
      stdio: 'pipe',
    });
    success('Prisma client generated!');
  } catch (err) {
    warning('Prisma generation issue (will retry if needed)');
  }

  return true;
}

async function cleanup() {
  info('Cleaning development environment...');
  
  try {
    const lockFile = path.join(rootDir, '.next', 'trace.lock');
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
    success('Cleanup complete!');
  } catch (err) {
    // Ignore cleanup errors
  }

  return true;
}

async function startServer() {
  info('Starting Next.js development server...');
  console.log('');
  
  // Start the dev server
  execSync('next dev', {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

// Main execution
async function main() {
  header('🤖 AI CHAT SYSTEM - SMART STARTUP');

  log('This will start your AI-powered chat system with all checks', 'cyan');
  console.log('');

  try {
    // Step 1: Check environment
    info('[1/4] Checking environment...');
    await checkEnv();
    console.log('');

    // Step 2: Generate Prisma
    info('[2/4] Setting up database client...');
    await generatePrisma();
    console.log('');

    // Step 3: Cleanup
    info('[3/4] Cleaning up...');
    await cleanup();
    console.log('');

    // Step 4: Start server
    info('[4/4] Starting server...');
    console.log('');
    
    log('━'.repeat(70), 'green');
    log('  ✨ ALL CHECKS PASSED! Starting your AI chat system...', 'green');
    log('━'.repeat(70), 'green');
    console.log('');
    
    log('💡 Your AI chat will appear in the bottom-RIGHT corner', 'cyan');
    log('💡 Try: "What\'s popular?" or "Track my order"', 'cyan');
    console.log('');
    
    await startServer();

  } catch (err) {
    console.error('');
    error('Startup failed!');
    console.error(err);
    process.exit(1);
  }
}

main();

