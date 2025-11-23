#!/usr/bin/env node

/**
 * FIX ADMIN LOGIN - Verify and Fix Admin User
 * 
 * This script:
 * 1. Checks if admin user exists
 * 2. Verifies password hash
 * 3. Ensures email is verified
 * 4. Ensures account is active
 * 5. Fixes any issues found
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ⚠️ SECURITY: Never hardcode passwords!
const ADMIN_EMAIL = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bantuskitchen.com';
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_DEFAULT_NAME || 'Admin';

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('❌ SECURITY ERROR: ADMIN_DEFAULT_PASSWORD must be set in .env!');
  process.exit(1);
}

async function fixAdminLogin() {
  try {
    console.log('\n🔐 Fixing Admin Login...\n');
    
    // Check if admin exists
    let admin = await prisma.admin.findUnique({
      where: { email: ADMIN_EMAIL },
    });
    
    if (!admin) {
      console.log('❌ Admin user not found! Creating...');
      
      // Create admin user
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      admin = await prisma.admin.create({
        data: {
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          passwordHash,
          role: 'OWNER',
          emailVerified: true,
          isActive: true,
        },
      });
      
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('✅ Admin user found!');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Email Verified: ${admin.emailVerified}`);
      console.log(`   Is Active: ${admin.isActive}`);
      
      // Check password
      const passwordValid = await bcrypt.compare(ADMIN_PASSWORD, admin.passwordHash);
      
      if (!passwordValid) {
        console.log('\n⚠️  Password mismatch! Updating password...');
        const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        admin = await prisma.admin.update({
          where: { id: admin.id },
          data: { passwordHash: newHash },
        });
        console.log('✅ Password updated!');
      } else {
        console.log('✅ Password is correct!');
      }
      
      // Ensure email is verified
      if (!admin.emailVerified) {
        console.log('\n⚠️  Email not verified! Fixing...');
        admin = await prisma.admin.update({
          where: { id: admin.id },
          data: { emailVerified: true },
        });
        console.log('✅ Email verified!');
      }
      
      // Ensure account is active
      if (!admin.isActive) {
        console.log('\n⚠️  Account is inactive! Activating...');
        admin = await prisma.admin.update({
          where: { id: admin.id },
          data: { isActive: true },
        });
        console.log('✅ Account activated!');
      }
    }
    
    // Final verification
    console.log('\n📋 Final Admin Status:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Email Verified: ${admin.emailVerified ? '✅' : '❌'}`);
    console.log(`   Is Active: ${admin.isActive ? '✅' : '❌'}`);
    
    // Test password one more time
    const finalPasswordTest = await bcrypt.compare(ADMIN_PASSWORD, admin.passwordHash);
    console.log(`   Password Test: ${finalPasswordTest ? '✅ VALID' : '❌ INVALID'}`);
    
    if (admin.emailVerified && admin.isActive && finalPasswordTest) {
      console.log('\n✅ Admin login is ready!');
      console.log(`\n🌐 Login at: http://localhost:3001/admin/login`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: [REDACTED - Check your .env file]\n`);
    } else {
      console.log('\n❌ Admin login still has issues. Please check the errors above.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing admin login:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminLogin();

