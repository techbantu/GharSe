/**
 * Create Admin User Script
 * 
 * Run this to create the default admin user
 * Usage: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    
    const email = 'admin@gharse.com';
    const password = 'Admin123!'; // Change this after first login!
    const name = 'Admin';
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { email: email },
        ]
      }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', email);
      console.log('📧 Email:', email);
      console.log('🔑 Password: (use your current password)');
      
      // Update password if needed
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash,
          emailVerified: true,
          isActive: true,
        }
      });
      
      console.log('✅ Admin password updated and verified');
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: 'OWNER', // Full access
        emailVerified: true, // Auto-verify for first admin
        isActive: true,
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('⚠️  Please change this password after first login!');
    console.log('');
    console.log('🌐 Admin Login: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

