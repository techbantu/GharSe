/**
 * CHECK ADMIN PASSWORD
 * Verifies admin password from .env
 * ⚠️ SECURITY: No hardcoded passwords!
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bantuskitchen.com';
    const testPassword = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!testPassword) {
      console.error('❌ ADMIN_DEFAULT_PASSWORD not set in .env!');
      process.exit(1);
    }

    const admin = await prisma.admin.findUnique({
      where: { email: adminEmail },
    });
    
    if (!admin) {
      console.log('❌ Admin not found!');
      console.log('Run: node scripts/auto-create-admin.js');
      return;
    }
    
    console.log('\n📋 Admin Info:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Email Verified:', admin.emailVerified);
    
    // Test the password from .env
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    
    console.log('\n🔐 Password Test:');
    console.log('   Testing password from .env');
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('\n⚠️  Password mismatch! Run: node scripts/fix-admin-login.mjs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
