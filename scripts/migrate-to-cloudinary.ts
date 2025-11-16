/**
 * SCRIPT: Migrate Existing Images to YOUR Cloudinary Account
 * 
 * Purpose: Take current Unsplash URLs and upload them to your Cloudinary
 * This gives you full control over your images!
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary with YOUR credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(imageUrl: string, itemName: string) {
  try {
    console.log(`  ↗️  Uploading to YOUR Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'bantus-kitchen/menu-items',
      public_id: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      overwrite: true,
      resource_type: 'image',
      // Optimization
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    });
    
    console.log(`  ✅ Uploaded to Cloudinary!`);
    console.log(`     URL: ${result.secure_url.substring(0, 60)}...`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error(`  ❌ Upload failed:`, error.message);
    throw error;
  }
}

async function migrateToCloudinary() {
  console.log('🚀 Migrating images to YOUR Cloudinary account...\n');
  
  try {
    // Check Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured!');
      console.error('Required environment variables:');
      console.error('  - CLOUDINARY_CLOUD_NAME');
      console.error('  - CLOUDINARY_API_KEY');
      console.error('  - CLOUDINARY_API_SECRET');
      process.exit(1);
    }
    
    console.log('✅ Cloudinary configured:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}\n`);
    
    // Find all items with external URLs (Unsplash, etc.)
    const items = await prisma.menuItem.findMany({
      where: {
        image: {
          startsWith: 'https://images.unsplash.com',
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
        image: true,
      },
    });
    
    console.log(`📋 Found ${items.length} items with Unsplash images\n`);
    
    if (items.length === 0) {
      console.log('✨ All images already on your Cloudinary!');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of items) {
      console.log(`\n📸 Processing: ${item.name} (${item.category})`);
      console.log(`   Current: ${item.image?.substring(0, 60)}...`);
      
      try {
        if (!item.image) {
          console.log(`  ⏭️  Skipping (no image)`);
          continue;
        }
        
        // Upload to YOUR Cloudinary
        const { url, publicId } = await uploadToCloudinary(item.image, item.name);
        
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
        
        // Rate limit: wait 1 second between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`  ❌ Failed:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Success: ${successCount} items`);
    console.log(`❌ Failed: ${failCount} items`);
    console.log(`📊 Total: ${items.length} items processed`);
    console.log(`\n🌐 Your images are now on: https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/\n`);
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
migrateToCloudinary()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

