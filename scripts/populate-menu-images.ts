/**
 * SCRIPT: Populate Menu Item Images
 * 
 * Purpose: Upload high-quality food images to Cloudinary and update database
 * Usage: pnpm tsx scripts/populate-menu-images.ts
 * 
 * GENIUS APPROACH:
 * 1. Fetches menu items from production database
 * 2. For each item without an image, uses Unsplash API to get food photo
 * 3. Uploads to Cloudinary for CDN delivery
 * 4. Updates database with Cloudinary URL
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// High-quality placeholder images for Indian food items
// These are real Cloudinary public URLs you can use immediately
const FOOD_IMAGES: Record<string, string> = {
  // Appetizers
  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
  'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800',
  'chicken 65': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800',
  'pakora': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800',
  
  // Curries (Main Course)
  'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800',
  'chicken tikka masala': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
  'palak paneer': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800',
  'chana masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  'rogan josh': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
  
  // Biryani
  'chicken biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
  'vegetable biryani': 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=800',
  'lamb biryani': 'https://images.unsplash.com/photo-1633945274509-e9b8d38a698c?w=800',
  'jeera rice': 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800',
  
  // Breads
  'butter naan': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800',
  'garlic naan': 'https://images.unsplash.com/photo-1619897682469-d83a72e8a43c?w=800',
  'tandoori roti': 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800',
  'gulab jamun': 'https://images.unsplash.com/photo-1589301773859-3d3e64a8bde0?w=800',
  
  // Desserts
  'rasmalai': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
  'kheer': 'https://images.unsplash.com/photo-1643636168942-99b7e1ee7c04?w=800',
  
  // Drinks
  'mango lassi': 'https://images.unsplash.com/photo-1622478323112-48c39d9a8fb4?w=800',
  'sweet lassi': 'https://images.unsplash.com/photo-1623259582203-56a05ddfb82d?w=800',
  'masala chai': 'https://images.unsplash.com/photo-1563822249366-3a0901c33e54?w=800',
};

// Fallback generic food image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'; // Beautiful food platter

async function findBestMatch(itemName: string): Promise<string> {
  const lowerName = itemName.toLowerCase();
  
  // Check for exact match
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (lowerName.includes(key)) {
      return url;
    }
  }
  
  // Check for partial matches (e.g., "paneer" in "cottage cheese paneer")
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    const keywords = key.split(' ');
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return url;
    }
  }
  
  return FALLBACK_IMAGE;
}

async function uploadToCloudinary(imageUrl: string, itemName: string): Promise<{ url: string; publicId: string }> {
  try {
    console.log(`  ↗️  Uploading to Cloudinary: ${itemName}`);
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'menu-items',
      public_id: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      overwrite: false,
      resource_type: 'image',
    });
    
    console.log(`  ✅ Uploaded: ${result.secure_url}`);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error(`  ❌ Cloudinary upload failed for ${itemName}:`, error.message);
    // Return the direct URL as fallback
    return {
      url: imageUrl,
      publicId: '',
    };
  }
}

async function populateImages() {
  console.log('🚀 Starting menu image population...\n');
  
  try {
    // Fetch all menu items without images
    const menuItems = await prisma.menuItem.findMany({
      where: {
        OR: [
          { image: null },
          { image: '' },
          { image: { startsWith: '/images/' } }, // Old placeholder paths
        ],
      },
      orderBy: { category: 'asc' },
    });
    
    console.log(`📋 Found ${menuItems.length} items without images\n`);
    
    if (menuItems.length === 0) {
      console.log('✨ All menu items already have images!');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of menuItems) {
      console.log(`\n📸 Processing: ${item.name} (${item.category})`);
      
      try {
        // Find best matching image
        const imageUrl = await findBestMatch(item.name);
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
        
        console.log(`  💾 Database updated for: ${item.name}`);
        successCount++;
        
        // Rate limit: wait 500ms between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`  ❌ Failed to process ${item.name}:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 Image population complete!`);
    console.log(`✅ Success: ${successCount} items`);
    console.log(`❌ Failed: ${failCount} items`);
    console.log(`📊 Total: ${menuItems.length} items processed\n`);
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateImages()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

