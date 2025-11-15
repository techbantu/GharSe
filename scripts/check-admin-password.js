const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@bantuskitchen.com' },
    });
    
    if (!admin) {
      console.log('❌ Admin not found!');
      return;
    }
    
    console.log('\n📋 Admin Info:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Email Verified:', admin.emailVerified);
    
    // Test the password from login page
    const testPassword = 'Sailaja@2025';
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    
    console.log('\n🔐 Password Test:');
    console.log('   Testing password:', testPassword);
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('\n⚠️  Password mismatch! Updating password...');
      const newHash = await bcrypt.hash(testPassword, 12);
      await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      });
      console.log('✅ Password updated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
