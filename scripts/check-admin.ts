/**
 * CHECK ADMIN ACCOUNT
 * Verifies admin exists and tests password from .env
 * ⚠️ SECURITY: No hardcoded passwords!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  console.log('\n🔍 CHECKING ADMIN ACCOUNT...\n');

  // Get credentials from .env
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bantuskitchen.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!adminPassword) {
    console.error('❌ ADMIN_DEFAULT_PASSWORD not set in .env!');
    console.error('   Add to .env: ADMIN_DEFAULT_PASSWORD="YourStrong123!Password"');
    process.exit(1);
  }

  try {
    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      console.log('❌ Admin account NOT FOUND!');
      console.log('📝 Run: node scripts/auto-create-admin.js');
      return;
    }

    console.log('✅ Admin account EXISTS!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔑 Role:', admin.role);
    console.log('✅ Active:', admin.isActive);
    console.log('✅ Email Verified:', admin.emailVerified);
    console.log('🔐 Password Hash:', admin.passwordHash.substring(0, 20) + '...');
    
    // Test password from .env
    console.log('\n🔐 TESTING PASSWORD FROM .ENV...\n');
    
    const isValid = await bcrypt.compare(adminPassword, admin.passwordHash);
    console.log(`Password Test: ${isValid ? '✅ CORRECT' : '❌ WRONG'}`);
      
    if (isValid) {
      console.log('\n✅ ADMIN LOGIN IS WORKING!');
      console.log('📝 Use these credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Password: [See your .env file]');
    } else {
      console.log('\n⚠️  Password mismatch!');
      console.log('📝 Run: node scripts/fix-admin-login.mjs');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
