/**
 * AUTOMATIC DATABASE INITIALIZATION
 * 
 * Purpose: Automatically ensures database schema is set up correctly
 * Runs on server startup or via API call
 * Uses Prisma db push to create tables automatically
 * 
 * Architecture: 
 * 1. First tries Prisma db push (works for both SQLite and PostgreSQL)
 * 2. Falls back to SupabaseMigrator if needed
 */

import { getSupabaseMigrator } from '@/lib/supabase-migrator';
import { ensurePrismaSchema } from '@/lib/prisma-auto-setup';

/**
 * Initialize database schema - ensures all tables exist
 * Automatically runs Prisma db push if tables don't exist
 */
export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database schema...');
    
    // First try Prisma db push (most reliable method)
    const prismaResult = await ensurePrismaSchema();
    
    if (prismaResult.success) {
      console.log('✅ Database schema initialized successfully via Prisma');
      return { success: true };
    }
    
    // Fallback to SupabaseMigrator if Prisma fails
    console.log('⚠️ Prisma setup failed, trying SupabaseMigrator...');
    const migrator = getSupabaseMigrator();
    
    const menuItemExists = await migrator.tableExists('MenuItem');
    
    if (!menuItemExists) {
      console.log('📋 MenuItem table not found, running complete schema migration...');
      const result = await migrator.ensureSchema();
      
      if (result.success) {
        console.log('✅ Database schema initialized successfully via SupabaseMigrator');
        return { success: true };
      } else {
        console.error('❌ Schema migration failed:', result.error);
        return { 
          success: false, 
          error: `Both Prisma and SupabaseMigrator failed. Prisma error: ${prismaResult.error}. Migrator error: ${result.error}` 
        };
      }
    } else {
      console.log('✅ Database schema already initialized');
      return { success: true };
    }
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * API endpoint to initialize database
 */
export async function GET() {
  const result = await initializeDatabase();
  return Response.json(result);
}

