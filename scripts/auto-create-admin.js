#!/usr/bin/env node

/**
 * AUTO-CREATE ADMIN USER
 * 
 * Automatically creates admin user if it doesn't exist
 * Email: admin@bantuskitchen.com
 * Password: Sailaja@2025
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ⚠️ SECURITY: Never hardcode passwords!
// Password is now loaded from .env file ONLY
const ADMIN_EMAIL = process.env.ADMIN_DEFAULT_EMAIL || 'admin@bantuskitchen.com';
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_DEFAULT_NAME || 'Admin';

// Validate password exists
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('❌ SECURITY ERROR: ADMIN_DEFAULT_PASSWORD must be set in .env and at least 12 characters!');
  console.error('   Generate a strong password and add to .env:');
  console.error('   ADMIN_DEFAULT_PASSWORD="YourStrong123!Password"');
  process.exit(1);
}

async function createAdminUser() {
  try {
    console.log('\n🔐 Checking admin user...\n');
    
    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email: ADMIN_EMAIL },
    });
    
    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Email Verified: ${existing.emailVerified ? 'Yes' : 'No'}\n`);
      return;
    }
    
    console.log('👤 Creating admin user...');
    
    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true, // Auto-verify for admin
        isActive: true,
      },
    });
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: [REDACTED - Check your .env file]`);
    console.log(`\n🌐 Login URL: http://localhost:3001/admin/login\n`);
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

