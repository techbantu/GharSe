/**
 * SCRIPT: Fix Failed Images and Re-upload to Cloudinary
 * 
 * Purpose: Handle the 6 items that failed during migration
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Better quality image URLs (no query params that might break)
const REPLACEMENT_IMAGES: Record<string, string> = {
  'sweet lassi': 'https://images.pexels.com/photos/5946075/pexels-photo-5946075.jpeg?auto=compress&cs=tinysrgb&w=800',
  'masala chai': 'https://images.pexels.com/photos/1793034/pexels-photo-1793034.jpeg?auto=compress&cs=tinysrgb&w=800',
  'kheer': 'https://images.pexels.com/photos/6607495/pexels-photo-6607495.jpeg?auto=compress&cs=tinysrgb&w=800',
  'garlic naan': 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=800',
  'gulab jamun': 'https://images.pexels.com/photos/4449068/pexels-photo-4449068.jpeg?auto=compress&cs=tinysrgb&w=800',
  'mango lassi': 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800',
};

async function uploadToCloudinary(imageUrl: string, itemName: string) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: 'bantus-kitchen/menu-items',
    public_id: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

async function fixFailedImages() {
  console.log('🔧 Fixing failed images...\n');
  
  const items = await prisma.menuItem.findMany({
    where: {
      image: {
        startsWith: 'https://images.unsplash.com',
      },
    },
  });
  
  console.log(`📋 Found ${items.length} items still with Unsplash URLs\n`);
  
  for (const item of items) {
    console.log(`\n📸 Processing: ${item.name}`);
    
    const lowerName = item.name.toLowerCase();
    let imageUrl: string | null = null;
    
    // Find matching replacement image
    for (const [key, url] of Object.entries(REPLACEMENT_IMAGES)) {
      if (lowerName.includes(key)) {
        imageUrl = url;
        break;
      }
    }
    
    if (!imageUrl) {
      console.log(`  ⏭️  No replacement found, skipping`);
      continue;
    }
    
    try {
      console.log(`  ↗️  Uploading: ${imageUrl.substring(0, 50)}...`);
      const { url, publicId } = await uploadToCloudinary(imageUrl, item.name);
      
      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          image: url,
          imagePublicId: publicId,
        },
      });
      
      console.log(`  ✅ Success: ${url.substring(0, 60)}...`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`  ❌ Failed:`, error.message);
    }
  }
  
  console.log('\n✨ All images fixed!\n');
}

fixFailedImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

