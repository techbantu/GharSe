#!/usr/bin/env node

/**
 * FIX ADMIN LOGIN & ADD IMAGES
 * 
 * This script:
 * 1. Fixes the admin user password
 * 2. Adds sample image URLs to menu items
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample food images from a free CDN (placeholder images)
const FOOD_IMAGES = {
  'Mango Lassi': 'https://images.unsplash.com/photo-1589968108138-3a389e0df9b1?w=500',
  'Gulab Jamun (2 pieces)': 'https://images.unsplash.com/photo-1589947109253-5965a0f4c63a?w=500',
  'Garlic Naan': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=500',
  'Butter Naan': 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500',
  'Vegetable Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
  'Chicken Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
  'Palak Paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
  'Chicken Tikka Masala': 'https://images.unsplash.com/photo-1603894584373-5ac82b2fb2c1?w=500',
  'Butter Chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2fb2c1?w=500',
  'Chicken 65': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500',
  'Samosa (2 pieces)': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
  'Paneer Tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500',
  'Vegetable Pakora': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
  'Chana Masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
  'Rogan Josh': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500',
  'Lamb Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
  'Jeera Rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
  'Tandoori Roti': 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500',
  'Rasmalai (2 pieces)': 'https://images.unsplash.com/photo-1589947109253-5965a0f4c63a?w=500',
  'Kheer': 'https://images.unsplash.com/photo-1589947109253-5965a0f4c63a?w=500',
  'Sweet Lassi': 'https://images.unsplash.com/photo-1589968108138-3a389e0df9b1?w=500',
  'Masala Chai': 'https://images.unsplash.com/photo-1597318130878-11e285564f1a?w=500',
};

async function main() {
  console.log('🔧 Fixing Admin & Adding Images...\n');

  try {
    // 1. Fix Admin Password
    console.log('👤 Fixing admin user password...');
    
    const adminEmail = 'admin@bantuskitchen.com';
    const adminPassword = '***REMOVED***';
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    console.log('   ✅ Password hashed successfully');
    
    // Update admin
    const admin = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        emailVerified: true,
        isActive: true,
      },
      create: {
        email: adminEmail,
        name: 'Admin',
        passwordHash,
        role: 'OWNER',
        isActive: true,
        emailVerified: true,
      },
    });
    
    console.log('   ✅ Admin user fixed!');
    console.log('   📧 Email:', admin.email);
    console.log('   🔑 Password:', adminPassword);

    // 2. Add Images to Menu Items
    console.log('\n📸 Adding images to menu items...');
    
    let updatedCount = 0;
    
    for (const [itemName, imageUrl] of Object.entries(FOOD_IMAGES)) {
      try {
        const result = await prisma.menuItem.updateMany({
          where: { name: itemName },
          data: { image: imageUrl },
        });
        
        if (result.count > 0) {
          console.log(`   ✅ ${itemName}`);
          updatedCount += result.count;
        }
      } catch (error) {
        console.log(`   ⏭️  ${itemName} (not found)`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} menu items with images`);
    
    // 3. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n🔐 Admin Login Credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n🎯 Try logging in now at: http://localhost:3000/admin/login');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

