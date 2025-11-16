/**
 * SCRIPT: Upload YOUR ACTUAL Images from public/uploads/
 * 
 * Purpose: Find the most recent local image file for each menu item
 * and upload it to YOUR Cloudinary account
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

// Find the most recent image file for an item
function findLatestImageFile(itemName: string): string | null {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    return null;
  }
  
  const files = fs.readdirSync(uploadsDir);
  
  // Clean item name for matching (lowercase, no special chars)
  const cleanName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Find all files matching this item
  const matchingFiles = files.filter(file => {
    const lowerFile = file.toLowerCase();
    // Match patterns like: seed-chicken-biryani-*.jpeg or item-name-*.jpg
    return lowerFile.includes(cleanName) || 
           lowerFile.includes(itemName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''));
  });
  
  if (matchingFiles.length === 0) {
    return null;
  }
  
  // Get the most recent file (highest timestamp)
  const sortedFiles = matchingFiles.sort((a, b) => {
    const timeA = parseInt(a.match(/(\d{13})/)?.[1] || '0');
    const timeB = parseInt(b.match(/(\d{13})/)?.[1] || '0');
    return timeB - timeA; // Newest first
  });
  
  return `/uploads/${sortedFiles[0]}`;
}

async function uploadToCloudinary(localPath: string, itemName: string) {
  const fullPath = path.join(process.cwd(), 'public', localPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  
  const result = await cloudinary.uploader.upload(fullPath, {
    folder: 'bantus-kitchen/menu-items',
    public_id: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
    overwrite: false,
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

async function uploadYourRealImages() {
  console.log('🚀 Uploading YOUR ACTUAL images to Cloudinary...\n');
  console.log('📁 Looking in: public/uploads/\n');
  
  try {
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
    let notFoundCount = 0;
    
    for (const item of items) {
      console.log(`\n📸 ${item.name} (${item.category})`);
      
      // Find the local image file
      const localPath = findLatestImageFile(item.name);
      
      if (!localPath) {
        console.log(`  ❓ No local image found in public/uploads/`);
        notFoundCount++;
        continue;
      }
      
      console.log(`  📂 Found: ${localPath}`);
      
      try {
        console.log(`  ↗️  Uploading to Cloudinary...`);
        const { url, publicId } = await uploadToCloudinary(localPath, item.name);
        
        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            image: url,
            imagePublicId: publicId,
          },
        });
        
        console.log(`  ✅ SUCCESS!`);
        console.log(`     URL: ${url.substring(0, 65)}...`);
        successCount++;
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error: any) {
        console.error(`  ❌ Failed:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n🎉 COMPLETE!`);
    console.log(`✅ Uploaded: ${successCount} images`);
    console.log(`❓ Not Found: ${notFoundCount} items (no local file)`);
    console.log(`❌ Failed: ${failCount} items`);
    console.log(`📊 Total: ${items.length} items`);
    console.log(`\n🌐 YOUR images: https://res.cloudinary.com/dt93mavok/\n`);
    
    if (notFoundCount > 0) {
      console.log(`💡 TIP: ${notFoundCount} items don't have local files.`);
      console.log(`   You can upload images for them via the admin dashboard.\n`);
    }
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

uploadYourRealImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

