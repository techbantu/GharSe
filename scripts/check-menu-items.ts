/**
 * SCRIPT: Check Database Menu Items
 * Purpose: Verify menu items and their images in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMenuItems() {
  console.log('🔍 Checking menu items in database...\n');
  
  try {
    const items = await prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        image: true,
        imagePublicId: true,
        isAvailable: true,
      },
      orderBy: { category: 'asc' },
    });
    
    console.log(`📋 Total menu items: ${items.length}\n`);
    
    if (items.length === 0) {
      console.log('⚠️  No menu items found in database!');
      console.log('💡 Run: pnpm prisma db seed');
      return;
    }
    
    // Group by category
    const byCategory: Record<string, typeof items> = {};
    items.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push(item);
    });
    
    // Display by category
    for (const [category, categoryItems] of Object.entries(byCategory)) {
      console.log(`\n📁 ${category} (${categoryItems.length} items):`);
      console.log('─'.repeat(80));
      
      for (const item of categoryItems) {
        const hasImage = item.image && item.image !== '' && !item.image.startsWith('/images/');
        const icon = hasImage ? '✅' : '❌';
        const imageInfo = hasImage 
          ? item.image!.substring(0, 60) + '...' 
          : '(No image)';
        
        console.log(`${icon} ${item.name}`);
        console.log(`   Image: ${imageInfo}`);
        console.log(`   Available: ${item.isAvailable ? 'Yes' : 'No'}`);
        console.log('');
      }
    }
    
    // Summary
    const withImages = items.filter(i => i.image && i.image !== '' && !i.image.startsWith('/images/'));
    const withoutImages = items.length - withImages.length;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log(`   Total Items: ${items.length}`);
    console.log(`   ✅ With Images: ${withImages.length}`);
    console.log(`   ❌ Without Images: ${withoutImages}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkMenuItems()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

