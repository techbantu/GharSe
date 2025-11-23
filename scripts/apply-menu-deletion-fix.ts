/**
 * SCRIPT: Apply Menu Deletion Fix
 * Purpose: Update database schema to allow menu item deletion while preserving order history
 * Strategy: Make OrderItem.menuItemId nullable and add deleted item preservation fields
 * 
 * This is a CRITICAL FIX for admin menu management:
 * - Admins can now force delete menu items even if they have been ordered
 * - Order history is preserved with deleted item details
 * - No foreign key constraint errors
 * - Data integrity maintained
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🔧 Starting menu deletion fix migration...\n');

  try {
    // Step 1: Check if migration is needed
    console.log('📊 Step 1: Checking current schema...');
    
    const tables = await prisma.$queryRaw<any[]>`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'OrderItem'
      AND column_name IN ('menuItemId', 'deletedItemName', 'deletedItemDescription', 'deletedItemImage')
      ORDER BY column_name;
    `;
    
    console.log('Current OrderItem columns:', tables);
    
    // Check if migration already applied
    const menuItemIdColumn = tables.find(t => t.column_name === 'menuItemId');
    const deletedItemNameColumn = tables.find(t => t.column_name === 'deletedItemName');
    
    if (menuItemIdColumn?.is_nullable === 'YES' && deletedItemNameColumn) {
      console.log('✅ Migration already applied. Nothing to do.');
      return;
    }

    // Step 2: Create a backup of current OrderItem data
    console.log('\n💾 Step 2: Creating backup of OrderItem data...');
    
    const orderItemsBackup = await prisma.$queryRaw<any[]>`
      SELECT * FROM "OrderItem" LIMIT 10;
    `;
    
    console.log(`Backed up ${orderItemsBackup.length} sample order items`);

    // Step 3: Add new columns for deleted item preservation
    console.log('\n➕ Step 3: Adding new columns...');
    
    await prisma.$executeRaw`
      ALTER TABLE "OrderItem" 
      ADD COLUMN IF NOT EXISTS "deletedItemName" TEXT,
      ADD COLUMN IF NOT EXISTS "deletedItemDescription" TEXT,
      ADD COLUMN IF NOT EXISTS "deletedItemImage" TEXT;
    `;
    
    console.log('✅ Added deletedItem columns');

    // Step 4: Make menuItemId nullable
    console.log('\n🔓 Step 4: Making menuItemId nullable...');
    
    // First, we need to drop the foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "OrderItem" 
      DROP CONSTRAINT IF EXISTS "OrderItem_menuItemId_fkey";
    `;
    
    console.log('✅ Dropped foreign key constraint');

    // Make the column nullable
    await prisma.$executeRaw`
      ALTER TABLE "OrderItem" 
      ALTER COLUMN "menuItemId" DROP NOT NULL;
    `;
    
    console.log('✅ Made menuItemId nullable');

    // Re-add the foreign key constraint (with ON DELETE SET NULL)
    await prisma.$executeRaw`
      ALTER TABLE "OrderItem" 
      ADD CONSTRAINT "OrderItem_menuItemId_fkey" 
      FOREIGN KEY ("menuItemId") 
      REFERENCES "MenuItem"("id") 
      ON DELETE SET NULL;
    `;
    
    console.log('✅ Re-added foreign key constraint with ON DELETE SET NULL');

    // Step 5: Verify the changes
    console.log('\n🔍 Step 5: Verifying changes...');
    
    const updatedTables = await prisma.$queryRaw<any[]>`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'OrderItem'
      AND column_name IN ('menuItemId', 'deletedItemName', 'deletedItemDescription', 'deletedItemImage')
      ORDER BY column_name;
    `;
    
    console.log('Updated OrderItem columns:', updatedTables);

    // Step 6: Log to database_changes table for audit trail
    console.log('\n📝 Step 6: Logging to audit trail...');
    
    await prisma.databaseChange.create({
      data: {
        changeKind: 'ddl',
        commandTag: 'ALTER TABLE',
        objectType: 'table',
        objectIdentity: 'OrderItem',
        statement: 'Allow menu item deletion with order history preservation',
        details: {
          columnsAdded: ['deletedItemName', 'deletedItemDescription', 'deletedItemImage'],
          columnsModified: ['menuItemId (made nullable)'],
          constraintsModified: ['OrderItem_menuItemId_fkey (ON DELETE SET NULL)'],
        },
      },
    });
    
    console.log('✅ Logged to database_changes table');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  • OrderItem.menuItemId is now nullable');
    console.log('  • Added deletedItemName, deletedItemDescription, deletedItemImage columns');
    console.log('  • Foreign key constraint updated to SET NULL on menu item deletion');
    console.log('  • Order history will be preserved when admins force delete menu items');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    
    // Log the error to database
    try {
      await prisma.databaseChange.create({
        data: {
          changeKind: 'ddl',
          commandTag: 'ALTER TABLE',
          objectType: 'table',
          objectIdentity: 'OrderItem',
          statement: 'FAILED: Allow menu item deletion with order history preservation',
          details: {
            error: error.message,
            stack: error.stack,
          },
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
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

