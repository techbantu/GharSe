/**
 * AUTOMATIC PRISMA DATABASE SETUP
 * 
 * Purpose: Automatically runs Prisma db push when tables don't exist
 * This ensures database schema is always up-to-date without manual intervention
 * 
 * Architecture: Uses child_process to run Prisma CLI commands programmatically
 */

import { execSync } from 'child_process';
import prisma from '@/lib/prisma';

/**
 * Check if MenuItem table exists in the database
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Try PostgreSQL first (Supabase uses PostgreSQL)
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        ) as exists;
      `) as any[];
      return result[0]?.exists === true;
    } catch {
      // Fallback for SQLite (local development)
      const result = await prisma.$queryRawUnsafe(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='${tableName}';
      `) as any[];
      return result.length > 0;
    }
  } catch (error: any) {
    console.warn('Could not check if table exists:', error.message);
    return false;
  }
}

/**
 * Run Prisma db push programmatically
 * This creates all tables from the Prisma schema
 */
async function runPrismaDbPush(): Promise<{ success: boolean; error?: string }> {
  try {
    const projectRoot = process.cwd();
    
    console.log('📦 Running Prisma db push to create database tables...');
    
    // First ensure Prisma client is generated
    try {
      execSync('npx prisma generate', {
        cwd: projectRoot,
        stdio: 'pipe', // Suppress output to avoid cluttering logs
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
      });
      console.log('✅ Prisma client generated');
    } catch (genError: any) {
      console.warn('⚠️ Prisma generate warning:', genError.message);
      // Continue anyway - client might already be generated
    }
    
    // Run db push to create tables
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: projectRoot,
      stdio: 'pipe', // Suppress output
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
      timeout: 60000, // 60 second timeout
    });
    
    console.log('✅ Database tables created successfully');
    return { success: true };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error('❌ Prisma db push failed:', errorMessage);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Automatically ensure database schema is set up
 * Checks if tables exist, and if not, runs Prisma db push
 */
export async function ensurePrismaSchema(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if MenuItem table exists (indicator that schema is set up)
    const menuItemExists = await tableExists('MenuItem');
    
    if (menuItemExists) {
      console.log('✅ Database schema already exists');
      return { success: true };
    }
    
    console.log('🔧 Database tables not found, setting up schema...');
    
    // Run Prisma db push to create all tables
    const result = await runPrismaDbPush();
    
    if (result.success) {
      // Verify tables were created
      const verified = await tableExists('MenuItem');
      if (verified) {
        console.log('✅ Database schema setup verified');
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Tables were not created. Please check your DATABASE_URL and run: npm run db:push' 
        };
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Schema setup failed:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Quick check if database is ready (non-blocking)
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    return await tableExists('MenuItem');
  } catch {
    return false;
  }
}

