#!/usr/bin/env node

/**
 * DATABASE SETUP SCRIPT
 * 
 * Creates database tables and initial admin user
 * Run with: node scripts/setup-database.mjs
 * ⚠️ SECURITY: Password loaded from .env only!
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔧 Setting up database...\n');

try {
  // Step 1: Generate Prisma Client
  console.log('📦 Step 1: Generating Prisma Client...');
  execSync('npm run prisma:generate', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('✅ Prisma Client generated\n');

  // Step 2: Push database schema
  console.log('🗄️  Step 2: Creating database tables...');
  execSync('npm run db:push', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('✅ Database tables created\n');

  // Step 3: Seed initial admin user
  console.log('👤 Step 3: Creating initial admin user...');
  execSync('npm run prisma:seed', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('✅ Admin user created\n');

  console.log('🎉 Database setup complete!\n');
  console.log('📋 Login Credentials:');
  console.log('   Email: From your .env (ADMIN_DEFAULT_EMAIL)');
  console.log('   Password: From your .env (ADMIN_DEFAULT_PASSWORD)');
  console.log('\n🔗 Login at: http://localhost:3000/admin/login\n');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
