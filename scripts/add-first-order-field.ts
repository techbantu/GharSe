/**
 * Direct SQL migration to add firstOrderEligible field to Customer table
 * This bypasses Prisma migrate and directly updates the database via DATABASE_URL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addFirstOrderField() {
  try {
    console.log('🔧 Adding firstOrderEligible field to Customer table...');
    
    // Check if column already exists
    const checkResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' 
      AND column_name = 'firstOrderEligible'
      AND table_schema = 'public'
    `);
    
    if (checkResult.length > 0) {
      console.log('✅ Column firstOrderEligible already exists. Skipping.');
      return;
    }
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Customer" 
      ADD COLUMN IF NOT EXISTS "firstOrderEligible" BOOLEAN NOT NULL DEFAULT true
    `);
    
    console.log('✅ Successfully added firstOrderEligible field');
    console.log('📊 All new and existing customers now have first order discount eligibility');
    
  } catch (error) {
    console.error('❌ Error adding firstOrderEligible field:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addFirstOrderField()
  .then(() => {
    console.log('🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });

