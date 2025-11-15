/**
 * Apply Payment Migration to Database
 * 
 * Adds tip field to Order and payment method details to Payment tables
 */

import prisma from '../lib/prisma';

// Check if column exists (SQLite-compatible)
async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='${table}';
    `) as any[];
    
    if (result.length === 0) return false;
    
    const tableSQL = result[0].sql || '';
    return tableSQL.includes(`"${column}"`) || tableSQL.includes(`\`${column}\``);
  } catch {
    // For PostgreSQL/Supabase
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = '${column}';
      `) as any[];
      return result.length > 0;
    } catch {
      return false;
    }
  }
}

async function applyMigration() {
  console.log('🚀 Starting payment migration...\n');

  try {
    // Check and add tip to Order table
    const orderTipExists = await columnExists('Order', 'tip');
    if (!orderTipExists) {
      console.log('[1/6] Adding "tip" column to Order table...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "tip" REAL NOT NULL DEFAULT 0`);
      console.log('✅ Added tip column to Order table\n');
    } else {
      console.log('⚠️  Order.tip column already exists, skipping...\n');
    }

    // Check and add paymentMethodDetails to Payment table
    const paymentDetailsExists = await columnExists('Payment', 'paymentMethodDetails');
    if (!paymentDetailsExists) {
      console.log('[2/6] Adding "paymentMethodDetails" column to Payment table...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "Payment" ADD COLUMN "paymentMethodDetails" TEXT`);
      console.log('✅ Added paymentMethodDetails column to Payment table\n');
    } else {
      console.log('⚠️  Payment.paymentMethodDetails column already exists, skipping...\n');
    }

    // Check and add tip to Payment table
    const paymentTipExists = await columnExists('Payment', 'tip');
    if (!paymentTipExists) {
      console.log('[3/6] Adding "tip" column to Payment table...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "Payment" ADD COLUMN "tip" REAL NOT NULL DEFAULT 0`);
      console.log('✅ Added tip column to Payment table\n');
    } else {
      console.log('⚠️  Payment.tip column already exists, skipping...\n');
    }

    // Update existing records
    console.log('[4/6] Updating existing Order records...');
    await prisma.$executeRawUnsafe(`UPDATE "Order" SET "tip" = 0 WHERE "tip" IS NULL`);
    console.log('✅ Updated Order records\n');

    console.log('[5/6] Updating existing Payment records...');
    await prisma.$executeRawUnsafe(`UPDATE "Payment" SET "tip" = 0 WHERE "tip" IS NULL`);
    console.log('✅ Updated Payment records\n');

    // Create index (ignore if exists)
    console.log('[6/6] Creating index on paymentMethodDetails...');
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX "Payment_paymentMethodDetails_idx" ON "Payment"("paymentMethodDetails")`);
      console.log('✅ Created index\n');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Changes applied:');
    console.log('  ✓ Added "tip" field to Order table');
    console.log('  ✓ Added "paymentMethodDetails" field to Payment table');
    console.log('  ✓ Added "tip" field to Payment table');
    console.log('  ✓ Created index on paymentMethodDetails');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
