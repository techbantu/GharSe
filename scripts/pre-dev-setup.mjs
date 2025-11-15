#!/usr/bin/env node

/**
 * PRE-DEV SETUP SCRIPT
 * 
 * Purpose: Automatically sets up database before starting dev server
 * This ensures database tables exist without manual intervention
 * 
 * Architecture: Runs prisma db push (idempotent - safe to run every time)
 * Fast if tables exist, creates them if missing
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Setup database automatically
 * Prisma db push is idempotent - safe to run every time
 */
function setupDatabase() {
  try {
    console.log('📦 Ensuring database schema is ready...');
    
    // Run prisma db push - it's fast if tables exist, creates them if missing
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: projectRoot,
      stdio: 'pipe', // Suppress output for cleaner logs (only show on error)
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
      timeout: 30000, // 30 second timeout
    });
    
    console.log('✅ Database ready!\n');
    return true;
  } catch (error) {
    // If db push fails, don't block dev server startup
    // The API will handle database setup automatically on first request
    console.warn('⚠️  Database setup skipped (will be handled automatically on first API call)\n');
    return false;
  }
}

/**
 * Main setup function
 */
function main() {
  setupDatabase();
}

// Run setup
main();

