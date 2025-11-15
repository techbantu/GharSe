/**
 * RECOVERY SCRIPT: Restore Uploaded Images
 * 
 * Purpose: Match uploaded images in /uploads/ folder to menu items and restore their URLs
 * Run: node scripts/restore-uploaded-images.mjs
 */

import { PrismaClient } from '@prisma/client';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const prisma = new PrismaClient();

async function restoreUploadedImages() {
  try {
    console.log('🔍 Scanning for uploaded images...\n');
    
    const uploadsDir = join(projectRoot, 'public', 'uploads');
    
    if (!existsSync(uploadsDir)) {
      console.log('❌ Uploads directory does not exist');
      return;
    }
    
    const uploadedFiles = readdirSync(uploadsDir).filter(file => 
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
    );
    
    console.log(`📦 Found ${uploadedFiles.length} uploaded image files\n`);
    
    if (uploadedFiles.length === 0) {
      console.log('ℹ️  No uploaded images found. Images may have been deleted or never uploaded.');
      return;
    }
    
    // Get all menu items
    const menuItems = await prisma.menuItem.findMany({
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
    
    console.log(`📋 Found ${menuItems.length} menu items in database\n`);
    console.log('═'.repeat(80));
    
    let restoredCount = 0;
    let matchedCount = 0;
    let skippedCount = 0;
    
    // Map to store the most recent uploaded image for each item
    const itemImageMap = new Map();
    
    // First pass: Match all uploaded files to menu items and find the most recent one
    for (const file of uploadedFiles) {
      const filenameWithoutExt = file.replace(/\.[^/.]+$/, '');
      const filePath = join(uploadsDir, file);
      
      if (!existsSync(filePath)) continue;
      
      // Extract timestamp from filename (last number before extension)
      const timestampMatch = file.match(/(\d+)\.(jpg|jpeg|png|webp|gif)$/i);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
      
      // Try to find matching menu item
      let matchedItem = null;
      
      // Strategy 1: Match by ID prefix (seed-item-name)
      for (const item of menuItems) {
        const itemIdSlug = item.id.toLowerCase().replace(/\s+/g, '-');
        const nameSlug = item.name.toLowerCase()
          .replace(/\s*\([^)]*\)/g, '') // Remove parentheses content
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        if (filenameWithoutExt.startsWith(itemIdSlug) || 
            filenameWithoutExt.startsWith(`seed-${nameSlug}`) ||
            filenameWithoutExt.includes(`-${nameSlug}-`)) {
          matchedItem = item;
          break;
        }
      }
      
      // Strategy 2: Match by name slug
      if (!matchedItem) {
        for (const item of menuItems) {
          const nameSlug = item.name.toLowerCase()
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          
          if (filenameWithoutExt.includes(nameSlug) || 
              nameSlug.includes(filenameWithoutExt.split('-').slice(1, -1).join('-'))) {
            matchedItem = item;
            break;
          }
        }
      }
      
      if (matchedItem) {
        const imageUrl = `/uploads/${file}`;
        const existing = itemImageMap.get(matchedItem.id);
        
        // Keep the most recent image (highest timestamp)
        if (!existing || timestamp > existing.timestamp) {
          itemImageMap.set(matchedItem.id, {
            item: matchedItem,
            imageUrl,
            file,
            timestamp,
          });
        }
      }
    }
    
    // Second pass: Update menu items with their most recent uploaded images
    for (const [itemId, data] of itemImageMap.entries()) {
      const { item, imageUrl, file } = data;
      
      // Only update if current image is a seed image (starts with /images/)
      // or if item has no image
      if (!item.image || item.image.startsWith('/images/')) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            image: imageUrl,
            imagePublicId: file,
          },
        });
        
        console.log(`🔄 ${item.name}`);
        console.log(`   Restored image: ${imageUrl}`);
        console.log(`   Previous: ${item.image || 'None'}`);
        restoredCount++;
      } else if (item.image === imageUrl) {
        console.log(`✅ ${item.name}`);
        console.log(`   Already has correct image: ${imageUrl}`);
        matchedCount++;
      } else {
        console.log(`⏭️  ${item.name}`);
        console.log(`   Skipped (already has uploaded image): ${item.image}`);
        skippedCount++;
      }
      console.log('');
    }
    
    // Report unmatched files
    const matchedFilenames = new Set(Array.from(itemImageMap.values()).map(d => d.file));
    const unmatchedFiles = uploadedFiles.filter(f => !matchedFilenames.has(f));
    
    if (unmatchedFiles.length > 0) {
      console.log('⚠️  Unmatched files:');
      for (const file of unmatchedFiles) {
        console.log(`   - ${file}`);
      }
      console.log('');
    }
    
    console.log('═'.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`   🔄 Restored: ${restoredCount} images`);
    console.log(`   ✅ Already correct: ${matchedCount} images`);
    console.log(`   ⏭️  Skipped: ${skippedCount} items (already have uploaded images)`);
    console.log(`   ⚠️  Unmatched: ${unmatchedFiles.length} files`);
    console.log(`   📦 Total uploaded files: ${uploadedFiles.length}\n`);
    
    if (restoredCount > 0) {
      console.log('✅ Uploaded images have been restored!');
      console.log('   Refresh your admin dashboard to see the images.\n');
    }
    
  } catch (error) {
    console.error('❌ Error restoring images:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

restoreUploadedImages();

