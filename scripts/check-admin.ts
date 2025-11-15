/**
 * CHECK ADMIN ACCOUNT
 * Verifies admin exists and tests password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  console.log('\n🔍 CHECKING ADMIN ACCOUNT...\n');

  try {
    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@bantuskitchen.com' },
    });

    if (!admin) {
      console.log('❌ Admin account NOT FOUND!');
      console.log('📝 Creating admin account...\n');
      
      // Create admin with the password from .env
      const hashedPassword = await bcrypt.hash('Sailaja@2025', 10);
      
      const newAdmin = await prisma.admin.create({
        data: {
          email: 'admin@bantuskitchen.com',
          name: 'Admin',
          passwordHash: hashedPassword,
          role: 'OWNER',
          isActive: true,
          emailVerified: true,
        },
      });
      
      console.log('✅ Admin account created!');
      console.log('📧 Email:', newAdmin.email);
      console.log('👤 Name:', newAdmin.name);
      console.log('🔑 Role:', newAdmin.role);
      console.log('✅ Active:', newAdmin.isActive);
      console.log('✅ Email Verified:', newAdmin.emailVerified);
      
      return;
    }

    console.log('✅ Admin account EXISTS!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔑 Role:', admin.role);
    console.log('✅ Active:', admin.isActive);
    console.log('✅ Email Verified:', admin.emailVerified);
    console.log('🔐 Password Hash:', admin.passwordHash.substring(0, 20) + '...');
    
    // Test password
    console.log('\n🔐 TESTING PASSWORD...\n');
    
    const testPasswords = [
      'Sailaja@2025',
      'ChangeThisPassword123!',
      'Sailaja2025',
    ];
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
      console.log(`Password "${testPassword}": ${isValid ? '✅ CORRECT' : '❌ WRONG'}`);
      
      if (isValid) {
        console.log('\n✅ CORRECT PASSWORD FOUND!');
        console.log('📝 Use this to login:');
        console.log('   Email: admin@bantuskitchen.com');
        console.log(`   Password: ${testPassword}`);
        break;
      }
    }
    
    // If no password worked, reset it
    const anyValid = await Promise.all(
      testPasswords.map(p => bcrypt.compare(p, admin.passwordHash))
    );
    
    if (!anyValid.includes(true)) {
      console.log('\n⚠️  No password matched! Resetting to: Sailaja@2025');
      
      const newHash = await bcrypt.hash('Sailaja@2025', 10);
      await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      });
      
      console.log('✅ Password reset successfully!');
      console.log('📝 New credentials:');
      console.log('   Email: admin@bantuskitchen.com');
      console.log('   Password: Sailaja@2025');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();

