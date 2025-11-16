/**
 * SCRIPT: Update Admin Email
 * 
 * Purpose: Change admin email from admin@bantuskitchen.com to bantusailaja@gmail.com
 * Run this ONCE to update your production database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminEmail() {
  console.log('🔄 Updating admin email...\n');

  try {
    // Find the old admin
    const oldAdmin = await (prisma.admin.findUnique as any)({
      where: { email: 'admin@bantuskitchen.com' },
    });

    if (!oldAdmin) {
      console.log('❌ Old admin not found: admin@bantuskitchen.com');
      console.log('✅ Checking if new email already exists...');
      
      const newAdmin = await (prisma.admin.findUnique as any)({
        where: { email: 'bantusailaja@gmail.com' },
      });
      
      if (newAdmin) {
        console.log('✅ Admin with bantusailaja@gmail.com already exists!');
        console.log(`   Name: ${newAdmin.name}`);
        console.log(`   Role: ${newAdmin.role}`);
        console.log(`   Active: ${newAdmin.isActive}`);
        console.log('\n✅ No changes needed!');
      } else {
        console.log('❌ No admin found. Run: pnpm prisma db seed');
      }
      
      return;
    }

    // Update the email
    const updated = await (prisma.admin.update as any)({
      where: { id: oldAdmin.id },
      data: {
        email: 'bantusailaja@gmail.com',
        emailVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Admin email updated successfully!');
    console.log(`   Old: admin@bantuskitchen.com`);
    console.log(`   New: ${updated.email}`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`   Active: ${updated.isActive}`);
    console.log(`   Email Verified: ${updated.emailVerified}`);
    console.log('\n🎉 You can now login with bantusailaja@gmail.com');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

