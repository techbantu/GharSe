/**
 * SCRIPT: Upload YOUR Local Images to Cloudinary
 * 
 * Purpose: Take the actual images from public/uploads/ and upload to YOUR Cloudinary
 * These are the REAL images you uploaded via admin dashboard!
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadLocalImageToCloudinary(localPath: string, itemName: string) {
  try {
    const fullPath = path.join(process.cwd(), 'public', localPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    
    console.log(`  ↗️  Uploading YOUR image from: ${localPath}`);
    
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: 'bantus-kitchen/menu-items',
      public_id: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    });
    
    console.log(`  ✅ Uploaded to Cloudinary!`);
    console.log(`     From: ${localPath}`);
    console.log(`     To: ${result.secure_url.substring(0, 60)}...`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error(`  ❌ Upload failed:`, error.message);
    throw error;
  }
}

async function uploadYourImages() {
  console.log('🚀 Uploading YOUR local images to Cloudinary...\n');
  
  try {
    // Check Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured!');
      process.exit(1);
    }
    
    console.log('✅ Cloudinary configured: dt93mavok\n');
    
    // Get all menu items
    const items = await prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        image: true,
      },
      orderBy: { category: 'asc' },
    });
    
    console.log(`📋 Found ${items.length} menu items\n`);
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    for (const item of items) {
      console.log(`\n📸 Processing: ${item.name} (${item.category})`);
      
      if (!item.image) {
        console.log(`  ⏭️  No image, skipping`);
        skippedCount++;
        continue;
      }
      
      console.log(`   Current: ${item.image.substring(0, 60)}...`);
      
      // Check if it's a local path
      if (!item.image.startsWith('/uploads/')) {
        console.log(`  ⏭️  Already on Cloudinary or external URL, skipping`);
        skippedCount++;
        continue;
      }
      
      try {
        // Upload YOUR local image to Cloudinary
        const { url, publicId } = await uploadLocalImageToCloudinary(item.image, item.name);
        
        // Update database with Cloudinary URL
        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            image: url,
            imagePublicId: publicId,
          },
        });
        
        console.log(`  💾 Database updated!`);
        successCount++;
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`  ❌ Failed:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎉 Upload complete!`);
    console.log(`✅ Success: ${successCount} items`);
    console.log(`⏭️  Skipped: ${skippedCount} items (already on Cloudinary)`);
    console.log(`❌ Failed: ${failCount} items`);
    console.log(`📊 Total: ${items.length} items processed`);
    console.log(`\n🌐 YOUR images are now on: https://res.cloudinary.com/dt93mavok/\n`);
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

uploadYourImages()
  .then(() => {
    console.log('✨ Script completed successfully!');
    console.log('💡 Your original images are now on Cloudinary!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

