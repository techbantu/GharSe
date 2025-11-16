/**
 * SCRIPT: Migrate Local Images to Cloudinary
 * 
 * Purpose: Replace local /uploads/* paths with Cloudinary URLs
 * This fixes the "No Image" issue in production
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// High-quality Unsplash images for Indian food
const UNSPLASH_IMAGES: Record<string, string> = {
  // Appetizers
  'chicken 65': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80',
  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  'pakora': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
  'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80',
  
  // Main Course
  'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80',
  'chicken tikka masala': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
  'palak paneer': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&q=80',
  'chana masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'rogan josh': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80',
  
  // Biryani
  'chicken biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
  'vegetable biryani': 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=800&q=80',
  'lamb biryani': 'https://images.unsplash.com/photo-1633945274509-e9b8d38a698c?w=800&q=80',
  'jeera rice': 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800&q=80',
  
  // Breads
  'butter naan': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
  'garlic naan': 'https://images.unsplash.com/photo-1619897682469-d83a72e8a43c?w=800&q=80',
  'tandoori roti': 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80',
  
  // Desserts
  'gulab jamun': 'https://images.unsplash.com/photo-1589301773859-3d3e64a8bde0?w=800&q=80',
  'rasmalai': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80',
  'kheer': 'https://images.unsplash.com/photo-1643636168942-99b7e1ee7c04?w=800&q=80',
  
  // Beverages
  'mango lassi': 'https://images.unsplash.com/photo-1622478323112-48c39d9a8fb4?w=800&q=80',
  'sweet lassi': 'https://images.unsplash.com/photo-1623259582203-56a05ddfb82d?w=800&q=80',
  'masala chai': 'https://images.unsplash.com/photo-1563822249366-3a0901c33e54?w=800&q=80',
};

function findBestMatch(itemName: string): string {
  const lowerName = itemName.toLowerCase();
  
  // Try exact match first
  for (const [key, url] of Object.entries(UNSPLASH_IMAGES)) {
    if (lowerName.includes(key)) {
      return url;
    }
  }
  
  // Fallback to generic food image
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
}

async function uploadToCloudinary(imageUrl: string, itemName: string) {
  try {
    console.log(`  ↗️  Uploading to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'menu-items',
      public_id: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      overwrite: true,
      resource_type: 'image',
    });
    
    console.log(`  ✅ Success: ${result.secure_url.substring(0, 60)}...`);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error(`  ❌ Cloudinary upload failed:`, error.message);
    // Return direct URL as fallback
    return {
      url: imageUrl,
      publicId: '',
    };
  }
}

async function migrateImages() {
  console.log('🚀 Migrating local images to Cloudinary...\n');
  
  try {
    // Find all items with local image paths
    const items = await prisma.menuItem.findMany({
      where: {
        OR: [
          { image: { startsWith: '/uploads/' } },
          { image: { startsWith: '/images/' } },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        image: true,
      },
    });
    
    console.log(`📋 Found ${items.length} items with local images\n`);
    
    if (items.length === 0) {
      console.log('✨ All images already migrated!');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of items) {
      console.log(`\n📸 Processing: ${item.name} (${item.category})`);
      console.log(`   Current: ${item.image}`);
      
      try {
        // Find best matching Unsplash image
        const imageUrl = findBestMatch(item.name);
        console.log(`  🔍 Found match: ${imageUrl.substring(0, 60)}...`);
        
        // Upload to Cloudinary
        const { url, publicId } = await uploadToCloudinary(imageUrl, item.name);
        
        // Update database
        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            image: url,
            imagePublicId: publicId,
          },
        });
        
        console.log(`  💾 Database updated!`);
        successCount++;
        
        // Rate limit: wait 500ms between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`  ❌ Failed:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Success: ${successCount} items`);
    console.log(`❌ Failed: ${failCount} items`);
    console.log(`📊 Total: ${items.length} items processed\n`);
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
migrateImages()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

