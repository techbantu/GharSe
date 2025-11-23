/**
 * SCRIPT: Direct SQL Execution for Menu Deletion Fix
 * Purpose: Run SQL migration directly on Supabase without Prisma Accelerate
 * Strategy: Use postgres connection pool to execute raw SQL
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Extract the actual Supabase URL from DATABASE_URL
// Prisma Accelerate URL format: prisma+postgres://accelerate.prisma-data.net/?api_key=...
// We need the actual Supabase connection string
const SUPABASE_URL = 'postgresql://postgres:Sailaja2025@db.jkacjjusycmjwtcedeqf.supabase.co:5432/postgres';

async function main() {
  console.log('🔧 Starting direct SQL migration for menu deletion fix...\n');

  const pool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Supabase requires SSL
    },
  });

  const client = await pool.connect();

  try {
    console.log('✅ Connected to Supabase database\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'menu-deletion-fix.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('📄 Read SQL migration file\n');
    console.log('🚀 Executing migration...\n');

    // Execute the entire SQL content
    await client.query(sqlContent);

    console.log('✅ Migration executed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying changes...\n');

    const result = await client.query(`
      SELECT 
        column_name, 
        is_nullable, 
        data_type
      FROM information_schema.columns
      WHERE table_name = 'OrderItem'
      AND column_name IN ('menuItemId', 'deletedItemName', 'deletedItemDescription', 'deletedItemImage')
      ORDER BY column_name;
    `);

    console.log('Updated OrderItem columns:');
    console.table(result.rows);

    // Check foreign key constraint
    const fkResult = await client.query(`
      SELECT
        conname AS constraint_name,
        confdeltype AS on_delete_action
      FROM pg_constraint
      WHERE conrelid = 'OrderItem'::regclass
      AND conname = 'OrderItem_menuItemId_fkey';
    `);

    console.log('\nForeign key constraint:');
    console.table(fkResult.rows);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  • OrderItem.menuItemId is now nullable');
    console.log('  • Added deletedItemName, deletedItemDescription, deletedItemImage columns');
    console.log('  • Foreign key constraint updated to SET NULL on menu item deletion');
    console.log('  • Order history will be preserved when admins force delete menu items');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Disconnected from database');
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

