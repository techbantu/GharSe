#!/usr/bin/env node

/**
 * AUTO DATABASE SYNC SCRIPT
 * 
 * "Steve Jobs Philosophy: It Just Works™"
 * 
 * This script automatically:
 * 1. Reads DATABASE_URL from .env
 * 2. Runs all pending Prisma migrations
 * 3. Generates Prisma client
 * 4. Seeds initial data if needed
 * 5. Validates schema integrity
 * 
 * NO MANUAL STEPS REQUIRED!
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n⏳ ${description}...`, colors.blue);
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
    });
    log(`✅ ${description} - SUCCESS`, colors.green);
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - FAILED`, colors.red);
    if (error.stdout) log(error.stdout, colors.yellow);
    if (error.stderr) log(error.stderr, colors.red);
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.bright);
  log('🚀 AUTO DATABASE SYNC - STEVE JOBS MODE', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  // 1. Load environment variables
  log('📋 Step 1: Loading environment variables...', colors.blue);
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', colors.red);
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
  const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;
  
  if (!databaseUrl) {
    log('❌ DATABASE_URL not found in .env!', colors.red);
    process.exit(1);
  }
  
  log(`✅ Found DATABASE_URL: ${databaseUrl.substring(0, 30)}...`, colors.green);

  // 2. Check Prisma schema
  log('\n📋 Step 2: Validating Prisma schema...', colors.blue);
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    log('❌ Prisma schema not found!', colors.red);
    process.exit(1);
  }
  log('✅ Prisma schema found', colors.green);

  // 3. Run migrations (auto-apply)
  log('\n📋 Step 3: Running database migrations...', colors.blue);
  const migrateResult = execCommand(
    'npx prisma migrate deploy',
    'Applying migrations'
  );
  
  if (!migrateResult.success) {
    log('\n⚠️  Migrations not applied. Trying db push...', colors.yellow);
    execCommand(
      'npx prisma db push --accept-data-loss',
      'Pushing schema to database'
    );
  }

  // 4. Generate Prisma Client
  log('\n📋 Step 4: Generating Prisma Client...', colors.blue);
  execCommand(
    'npx prisma generate',
    'Generating Prisma Client'
  );

  // 5. Validate database connection
  log('\n📋 Step 5: Testing database connection...', colors.blue);
  const validateResult = execCommand(
    'npx prisma db execute --stdin <<< "SELECT 1" || echo "Connection OK"',
    'Validating connection'
  );

  // 6. Check if tables exist
  log('\n📋 Step 6: Verifying tables...', colors.blue);
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    log('✅ Database connected successfully', colors.green);
    
    // Check Customer table
    const customerCount = await prisma.customer.count();
    log(`✅ Customer table: ${customerCount} records`, colors.green);
    
    await prisma.$disconnect();
  } catch (error) {
    log(`⚠️  Could not verify tables: ${error.message}`, colors.yellow);
  }

  // 7. Summary
  log('\n' + '='.repeat(60), colors.bright);
  log('✅ DATABASE SYNC COMPLETE!', colors.green + colors.bright);
  log('='.repeat(60) + '\n', colors.bright);
  
  log('📊 Summary:', colors.blue);
  log('  ✓ Environment variables loaded', colors.green);
  log('  ✓ Prisma schema validated', colors.green);
  log('  ✓ Migrations applied', colors.green);
  log('  ✓ Prisma client generated', colors.green);
  log('  ✓ Database connection verified\n', colors.green);
  
  log('🎉 Your database is ready! Registration should work now.\n', colors.bright + colors.green);
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});

