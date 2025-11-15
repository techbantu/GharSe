/**
 * PRE-MIGRATION CHECK SCRIPT
 * 
 * Purpose: Verify everything is ready before running migration
 * 
 * Usage: npm run check:migration
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function checkMigrationReadiness() {
  console.log(`\n${colors.cyan}🔍 PRE-MIGRATION READINESS CHECK${colors.reset}\n`);

  let allChecks = true;

  // Check 1: SQLite database exists
  console.log(`${colors.blue}▶${colors.reset} Checking SQLite database...`);
  const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(sqlitePath)) {
    const stats = fs.statSync(sqlitePath);
    console.log(`${colors.green}✓${colors.reset} SQLite database found: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log(`${colors.red}✗${colors.reset} SQLite database not found at: ${sqlitePath}`);
    allChecks = false;
  }

  // Check 2: DATABASE_URL is set
  console.log(`\n${colors.blue}▶${colors.reset} Checking DATABASE_URL...`);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(`${colors.red}✗${colors.reset} DATABASE_URL not set in .env`);
    allChecks = false;
  } else if (databaseUrl.startsWith('file:')) {
    console.log(`${colors.yellow}⚠${colors.reset} DATABASE_URL is still pointing to SQLite`);
    console.log(`${colors.yellow}⚠${colors.reset} You need to update it to your Supabase connection string`);
    console.log(`${colors.cyan}ℹ${colors.reset} Example: postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres`);
    allChecks = false;
  } else if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    console.log(`${colors.green}✓${colors.reset} DATABASE_URL is set to PostgreSQL`);
    
    // Try to connect
    try {
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log(`${colors.green}✓${colors.reset} Successfully connected to Supabase`);
      await prisma.$disconnect();
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Cannot connect to Supabase`);
      console.log(`${colors.red}✗${colors.reset} Error: ${error instanceof Error ? error.message : String(error)}`);
      allChecks = false;
    }
  } else {
    console.log(`${colors.red}✗${colors.reset} DATABASE_URL format not recognized`);
    allChecks = false;
  }

  // Check 3: Prisma Client is generated
  console.log(`\n${colors.blue}▶${colors.reset} Checking Prisma Client...`);
  try {
    const prisma = new PrismaClient();
    console.log(`${colors.green}✓${colors.reset} Prisma Client is generated`);
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Prisma Client not generated`);
    console.log(`${colors.cyan}ℹ${colors.reset} Run: npm run prisma:generate`);
    allChecks = false;
  }

  // Check 4: Backups directory
  console.log(`\n${colors.blue}▶${colors.reset} Checking backups directory...`);
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    console.log(`${colors.yellow}⚠${colors.reset} Backups directory doesn't exist (will be created during migration)`);
  } else {
    console.log(`${colors.green}✓${colors.reset} Backups directory exists`);
  }

  // Final summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
  
  if (allChecks) {
    console.log(`${colors.green}✓ ALL CHECKS PASSED!${colors.reset}`);
    console.log(`\n${colors.cyan}You're ready to migrate!${colors.reset}`);
    console.log(`\nRun: ${colors.yellow}npm run migrate:to-supabase${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ SOME CHECKS FAILED${colors.reset}`);
    console.log(`\n${colors.yellow}Fix the issues above before migrating.${colors.reset}\n`);
    
    console.log(`${colors.cyan}Quick Fix Guide:${colors.reset}`);
    console.log(`1. Update .env with Supabase connection string`);
    console.log(`2. Run: npm run prisma:generate`);
    console.log(`3. Run: npm run db:push`);
    console.log(`4. Run this check again: npm run check:migration\n`);
  }
}

checkMigrationReadiness()
  .catch((error) => {
    console.error(`\n${colors.red}Error:${colors.reset}`, error);
    process.exit(1);
  });

