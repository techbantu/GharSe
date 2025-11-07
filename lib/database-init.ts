/**
 * AUTOMATIC DATABASE INITIALIZATION
 * 
 * Purpose: Automatically ensures database schema is set up correctly
 * Runs on server startup or via API call
 * Uses Supabase Migrator to execute SQL directly to Supabase
 * 
 * Architecture: Uses SupabaseMigrator which tracks all changes
 */

import { getSupabaseMigrator } from '@/lib/supabase-migrator';

/**
 * Initialize database schema - ensures all tables exist
 * This now uses the SupabaseMigrator for automatic SQL execution
 */
export async function initializeDatabase() {
  const migrator = getSupabaseMigrator();
  
  try {
    console.log('🔧 Initializing database schema...');
    
    // Check if MenuItem table exists
    const menuItemExists = await migrator.tableExists('MenuItem');
    
    if (!menuItemExists) {
      console.log('📋 MenuItem table not found, running complete schema migration...');
      // Run complete schema setup
      const result = await migrator.ensureSchema();
      
      if (result.success) {
        console.log('✅ Database schema initialized successfully');
        return { success: true };
      } else {
        console.error('❌ Schema migration failed:', result.error);
        return { success: false, error: result.error };
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

