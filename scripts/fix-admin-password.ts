#!/usr/bin/env npx ts-node
/**
 * ADMIN PASSWORD RESET SCRIPT
 * 
 * This script will:
 * 1. Find the admin account by email
 * 2. Reset the password to a new secure password
 * 3. Ensure the account is active and verified
 * 
 * Usage: npx ts-node scripts/fix-admin-password.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration - Change these values as needed
const ADMIN_EMAIL = 'bantusailaja@gmail.com';
const NEW_PASSWORD = 'GharSe@Admin2025!'; // Secure password

async function resetAdminPassword() {
  console.log('🔐 Admin Password Reset Script');
  console.log('================================\n');
  
  try {
    // 1. Find the admin account
    console.log(`📧 Looking for admin: ${ADMIN_EMAIL}`);
    
    const admin = await prisma.admin.findFirst({
      where: {
        email: {
          equals: ADMIN_EMAIL,
          mode: 'insensitive',
        },
      },
    });
    
    if (!admin) {
      console.log('\n❌ Admin account not found!');
      console.log('Creating new admin account...\n');
      
      // Create new admin if not exists
      const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);
      
      const newAdmin = await prisma.admin.create({
        data: {
          email: ADMIN_EMAIL.toLowerCase(),
          name: 'Sailaja Bantu',
          passwordHash,
          role: 'OWNER',
          isActive: true,
          emailVerified: true,
        },
      });
      
      console.log('✅ New admin account created!');
      console.log(`   ID: ${newAdmin.id}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Password: ${NEW_PASSWORD}`);
      return;
    }
    
    console.log(`✅ Found admin account: ${admin.name} (${admin.email})`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}`);
    console.log(`   Email Verified: ${admin.emailVerified}`);
    console.log(`   Last Login: ${admin.lastLoginAt || 'Never'}`);
    
    // 2. Hash the new password
    console.log('\n🔑 Generating new password hash...');
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);
    
    // 3. Update the admin account
    console.log('📝 Updating admin account...');
    
    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        isActive: true,
        emailVerified: true,
        // Clear any existing reset tokens
        resetToken: null,
        resetTokenExpires: null,
        resetTokenCreatedAt: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    
    console.log('\n✅ Password reset successful!');
    console.log('================================');
    console.log(`📧 Email: ${updatedAdmin.email}`);
    console.log(`🔐 New Password: ${NEW_PASSWORD}`);
    console.log(`✓ Account Active: ${updatedAdmin.isActive}`);
    console.log(`✓ Email Verified: ${updatedAdmin.emailVerified}`);
    console.log('\n🚀 You can now login at /admin/login');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    
    // Check for common errors
    if (error instanceof Error) {
      if (error.message.includes('planLimitReached')) {
        console.log('\n⚠️ PRISMA ACCELERATE LIMIT REACHED');
        console.log('Your Prisma Accelerate free tier has run out of queries.');
        console.log('Solutions:');
        console.log('1. Upgrade your Prisma Accelerate plan');
        console.log('2. Switch to direct Supabase connection');
        console.log('3. Wait for the limit to reset (usually monthly)');
      } else if (error.message.includes("Can't reach database")) {
        console.log('\n⚠️ DATABASE CONNECTION FAILED');
        console.log('Possible causes:');
        console.log('1. Supabase database is paused (free tier pauses after 7 days inactivity)');
        console.log('2. Database credentials are incorrect');
        console.log('3. Network issues');
        console.log('\nSolution: Log into Supabase dashboard and wake up your database');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetAdminPassword();

