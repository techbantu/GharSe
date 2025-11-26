#!/usr/bin/env npx ts-node
/**
 * RESTORE CLOUDINARY IMAGES
 * 
 * This script restores the real Cloudinary image URLs to menu items
 * by matching item names with uploaded images in Cloudinary.
 * 
 * Usage: npx ts-node scripts/restore-cloudinary-images.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cloudinary base URL
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dt93mavok/image/upload';

// Mapping of menu item names to their Cloudinary public IDs
// These are from the actual uploads in your Cloudinary account
const CLOUDINARY_IMAGES: Record<string, string> = {
  // Appetizers
  'Samosa (2 pieces)': 'bantus-kitchen/menu-items/samosa--2-pieces--1763297715104',
  'Paneer Tikka': 'bantus-kitchen/menu-items/paneer-tikka-1763297717277',
  'Chicken 65': 'bantus-kitchen/menu-items/chicken-65-1763297710889',
  'Vegetable Pakora': 'bantus-kitchen/menu-items/vegetable-pakora-1763297713200',
  
  // Main Course
  'Butter Chicken': 'bantus-kitchen/menu-items/butter-chicken-1763297750353',
  'Chicken Tikka Masala': 'bantus-kitchen/menu-items/chicken-tikka-masala-1763297757701',
  'Palak Paneer': 'bantus-kitchen/menu-items/palak-paneer-1763297752400',
  'Chana Masala': 'bantus-kitchen/menu-items/chana-masala-1763297747580',
  'Rogan Josh': 'bantus-kitchen/menu-items/rogan-josh-1763297754540',
  
  // Biryani & Rice
  'Chicken Biryani': 'bantus-kitchen/menu-items/chicken-biryani-1763297725550',
  'Vegetable Biryani': 'bantus-kitchen/menu-items/vegetable-biryani-1763297729840',
  'Lamb Biryani': 'bantus-kitchen/menu-items/lamb-biryani-1763297732067',
  'Jeera Rice': 'bantus-kitchen/menu-items/jeera-rice-1763297727705',
  
  // Breads
  'Butter Naan': 'bantus-kitchen/menu-items/butter-naan-1763297739929',
  'Garlic Naan': 'bantus-kitchen/menu-items/garlic-naan-1763297736022',
  'Tandoori Roti': 'bantus-kitchen/menu-items/tandoori-roti-1763297734129',
  
  // Desserts
  'Gulab Jamun (2 pieces)': 'bantus-kitchen/menu-items/gulab-jamun--2-pieces--1763297741972',
  'Rasmalai (2 pieces)': 'bantus-kitchen/menu-items/rasmalai--2-pieces--1763297743823',
  'Kheer': 'bantus-kitchen/menu-items/kheer-1763297745646',
  
  // Beverages
  'Mango Lassi': 'bantus-kitchen/menu-items/mango-lassi-1763297719364',
  'Sweet Lassi': 'bantus-kitchen/menu-items/sweet-lassi-1763297723324',
  'Masala Chai': 'bantus-kitchen/menu-items/masala-chai-1763297721309',
};

async function restoreImages() {
  console.log('🔄 RESTORING CLOUDINARY IMAGES');
  console.log('================================\n');

  try {
    // Get all menu items
    const menuItems = await prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        imagePublicId: true,
      },
    });

    console.log(`📋 Found ${menuItems.length} menu items\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of menuItems) {
      const publicId = CLOUDINARY_IMAGES[item.name];
      
      if (publicId) {
        const imageUrl = `${CLOUDINARY_BASE}/${publicId}.jpg`;
        
        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            image: imageUrl,
            imagePublicId: publicId,
          },
        });
        
        console.log(`✅ ${item.name}`);
        console.log(`   → ${imageUrl.substring(0, 70)}...`);
        updatedCount++;
      } else {
        console.log(`⏭️  ${item.name} - No Cloudinary image found`);
        skippedCount++;
      }
    }

    console.log('\n================================');
    console.log('📊 SUMMARY');
    console.log('================================');
    console.log(`✅ Updated: ${updatedCount} items`);
    console.log(`⏭️  Skipped: ${skippedCount} items`);
    console.log('\n🎉 Done! Your real images should now be showing.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreImages();

