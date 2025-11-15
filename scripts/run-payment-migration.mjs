/**
 * Run Payment Migration Script
 * 
 * Uses DatabaseExecutor to apply migration to Supabase
 */

import { getDatabaseExecutor } from '../lib/database-executor.js';

const migrationSQL = `
-- Migration: Add tip field to Order and payment method details to Payment
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tip" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentMethodDetails" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "tip" DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE "Order" SET "tip" = 0 WHERE "tip" IS NULL;
UPDATE "Payment" SET "tip" = 0 WHERE "tip" IS NULL;
CREATE INDEX IF NOT EXISTS "Payment_paymentMethodDetails_idx" ON "Payment"("paymentMethodDetails");
`;

async function runMigration() {
  console.log('🚀 Starting payment migration...');
  
  const executor = getDatabaseExecutor();
  
  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📦 Executing ${statements.length} SQL statements...`);
  
  const result = await executor.executeBatch(statements);
  
  if (result.success) {
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Changes applied:');
    console.log('  - Added "tip" field to Order table');
    console.log('  - Added "paymentMethodDetails" field to Payment table');
    console.log('  - Added "tip" field to Payment table');
    console.log('  - Created index on paymentMethodDetails');
  } else {
    console.error('❌ Migration failed:');
    result.errors.forEach((error, i) => {
      console.error(`  ${i + 1}. ${error}`);
    });
    process.exit(1);
  }
}

runMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

