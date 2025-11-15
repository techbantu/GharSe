#!/usr/bin/env node

/**
 * CREATE ADMIN USER SCRIPT
 * 
 * Purpose: Easily create new admin users with proper password hashing
 * 
 * Usage:
 *   node scripts/create-admin-user.mjs
 *   OR
 *   EMAIL="chef@bantuskitchen.com" NAME="Chef Name" PASSWORD="SecurePass123!" ROLE="MANAGER" node scripts/create-admin-user.mjs
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminUser() {
  console.log('\n🔐 Create New Admin User\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get user input
    const email = process.env.EMAIL || await question('📧 Email: ');
    const name = process.env.NAME || await question('👤 Name: ');
    const password = process.env.PASSWORD || await question('🔑 Password: ');
    const roleInput = process.env.ROLE || await question('👔 Role (OWNER/MANAGER/STAFF) [default: STAFF]: ') || 'STAFF';

    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const validRoles = ['OWNER', 'MANAGER', 'STAFF'];
    const role = validRoles.includes(roleInput.toUpperCase()) 
      ? roleInput.toUpperCase() 
      : 'STAFF';

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      console.error(`\n❌ Error: Email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    console.log('⏳ Creating admin user...');
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role,
        isActive: true,
        emailVerified: true, // Set to true for manually created users
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 User Details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive ? 'Yes' : 'No'}`);
    console.log(`   Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   Created: ${admin.createdAt.toLocaleString()}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log('\n💡 Note: User can login immediately with these credentials.\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdminUser();

