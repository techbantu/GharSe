/**
 * DIAGNOSTIC SCRIPT: Check Menu Item Images
 * 
 * Purpose: Verify image URLs in database and check if images exist
 * Run: node scripts/check-images.mjs
 */

import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const prisma = new PrismaClient();

async function checkImages() {
  try {
    console.log('🔍 Checking menu item images...\n');
    
    const items = await prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        imagePublicId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`📊 Found ${items.length} menu items\n`);
    console.log('═'.repeat(80));

    let missingCount = 0;
    let foundCount = 0;
    let invalidPathCount = 0;

    for (const item of items) {
      const hasImage = !!item.image;
      const imagePath = item.image;
      
      if (!hasImage) {
        console.log(`❌ ${item.name}`);
        console.log(`   No image URL in database`);
        missingCount++;
        console.log('');
        continue;
      }

      // Check if it's a local path
      if (imagePath.startsWith('/')) {
        const publicPath = join(projectRoot, 'public', imagePath);
        const exists = existsSync(publicPath);
        
        if (exists) {
          console.log(`✅ ${item.name}`);
          console.log(`   Image: ${imagePath}`);
          console.log(`   Path: ${publicPath}`);
          foundCount++;
        } else {
          console.log(`❌ ${item.name}`);
          console.log(`   Image URL: ${imagePath}`);
          console.log(`   Expected path: ${publicPath}`);
          console.log(`   ⚠️  File does not exist!`);
          invalidPathCount++;
        }
      } else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log(`🌐 ${item.name}`);
        console.log(`   Image: ${imagePath}`);
        console.log(`   (External URL - cannot verify locally)`);
        foundCount++;
      } else {
        console.log(`⚠️  ${item.name}`);
        console.log(`   Image: ${imagePath}`);
        console.log(`   ⚠️  Invalid path format (should start with / or http)`);
        invalidPathCount++;
      }
      
      if (item.imagePublicId) {
        console.log(`   Public ID: ${item.imagePublicId}`);
      }
      
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`   ✅ Images found: ${foundCount}`);
    console.log(`   ❌ Missing images: ${missingCount}`);
    console.log(`   ⚠️  Invalid paths: ${invalidPathCount}`);
    console.log(`   📦 Total items: ${items.length}\n`);

    if (invalidPathCount > 0 || missingCount > 0) {
      console.log('💡 Recommendations:');
      if (invalidPathCount > 0) {
        console.log('   - Fix invalid image paths in database');
        console.log('   - Ensure images are in public/images/ folder');
      }
      if (missingCount > 0) {
        console.log('   - Upload images for items without images');
        console.log('   - Use admin dashboard to add images');
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking images:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();



