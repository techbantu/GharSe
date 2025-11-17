/**
 * PRODUCTION FIX: Find and Fix Duplicate/Incorrect Butter Chicken Entries
 * 
 * This script will:
 * 1. Find ALL "Butter Chicken" entries in production database
 * 2. Identify which one has price ₹0 (the wrong one)
 * 3. Delete duplicate/incorrect entries
 * 4. Ensure only ONE correct Butter Chicken exists (₹299)
 * 
 * GENIUS ARCHITECTURE: Surgical database cleanup with full audit trail
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 SCANNING PRODUCTION DATABASE FOR BUTTER CHICKEN...\n');

  // Find ALL menu items with "Butter Chicken" in the name
  const butterChickenItems = await prisma.menuItem.findMany({
    where: {
      name: {
        contains: 'Butter Chicken',
        mode: 'insensitive',
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
  });

  console.log(`Found ${butterChickenItems.length} "Butter Chicken" entries:\n`);

  // Display all entries
  butterChickenItems.forEach((item, index) => {
    console.log(`[${index + 1}] ID: ${item.id}`);
    console.log(`    Name: ${item.name}`);
    console.log(`    Price: ₹${item.price}`);
    console.log(`    Original Price: ₹${item.originalPrice || 'N/A'}`);
    console.log(`    Category: ${item.category}`);
    console.log(`    Available: ${item.isAvailable}`);
    console.log(`    Created: ${item.createdAt}`);
    console.log('');
  });

  // Identify the correct entry (should have price 299)
  const correctEntry = butterChickenItems.find(
    (item) => item.price === 299 && item.name === 'Butter Chicken'
  );

  // Identify incorrect entries (price 0 or duplicates)
  const incorrectEntries = butterChickenItems.filter(
    (item) => item.id !== correctEntry?.id
  );

  if (!correctEntry) {
    console.log('❌ ERROR: No correct Butter Chicken entry found (expected price: ₹299)');
    console.log('\n📝 CREATING CORRECT ENTRY...\n');

    // Create the correct entry
    const newEntry = await prisma.menuItem.create({
      data: {
        name: 'Butter Chicken',
        description:
          'Tender chicken pieces in rich, creamy tomato-based gravy with aromatic spices',
        price: 299,
        originalPrice: 349,
        category: 'Main Course',
        image: '/images/butter-chicken.jpg',
        isVegetarian: false,
        spicyLevel: 1,
        preparationTime: 30,
        isAvailable: true,
        isPopular: true,
        calories: 450,
        servingSize: '400g',
        ingredients: JSON.stringify(['Chicken', 'Tomatoes', 'Cream', 'Butter', 'Spices']),
        allergens: JSON.stringify(['Dairy']),
      },
    });

    console.log(`✅ Created correct Butter Chicken entry:`);
    console.log(`   ID: ${newEntry.id}`);
    console.log(`   Price: ₹${newEntry.price}`);
    console.log(`   Original Price: ₹${newEntry.originalPrice}`);
  } else {
    console.log(`✅ CORRECT ENTRY FOUND:`);
    console.log(`   ID: ${correctEntry.id}`);
    console.log(`   Price: ₹${correctEntry.price}`);
    console.log(`   Original Price: ₹${correctEntry.originalPrice || 'N/A'}`);
  }

  if (incorrectEntries.length > 0) {
    console.log(`\n⚠️  FOUND ${incorrectEntries.length} INCORRECT/DUPLICATE ENTRIES:\n`);

    for (const item of incorrectEntries) {
      console.log(`   Deleting: ${item.name} (ID: ${item.id}, Price: ₹${item.price})`);

      // Check if this item is used in any orders (safety check)
      const ordersUsingThisItem = await prisma.orderItem.count({
        where: {
          menuItemId: item.id,
        },
      });

      if (ordersUsingThisItem > 0) {
        console.log(`   ⚠️  WARNING: This item is used in ${ordersUsingThisItem} orders!`);
        console.log(`   ⚠️  NOT DELETING - Marking as unavailable instead`);

        await prisma.menuItem.update({
          where: { id: item.id },
          data: {
            isAvailable: false,
            name: `${item.name} (OLD - DO NOT USE)`,
          },
        });

        console.log(`   ✅ Marked as unavailable`);
      } else {
        // Safe to delete - no orders reference this item
        await prisma.menuItem.delete({
          where: { id: item.id },
        });

        console.log(`   ✅ Deleted`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ DATABASE CLEANUP COMPLETE');
  console.log('='.repeat(60));

  // Final verification
  const finalCheck = await prisma.menuItem.findMany({
    where: {
      name: {
        contains: 'Butter Chicken',
        mode: 'insensitive',
      },
      isAvailable: true,
    },
  });

  console.log(`\n📊 FINAL STATUS:`);
  console.log(`   Available "Butter Chicken" entries: ${finalCheck.length}`);

  if (finalCheck.length === 1) {
    const item = finalCheck[0];
    console.log(`\n   ✅ PERFECT! Only one active Butter Chicken:`);
    console.log(`      Name: ${item.name}`);
    console.log(`      Price: ₹${item.price}`);
    console.log(`      Original Price: ₹${item.originalPrice || 'N/A'}`);
    console.log(`      ID: ${item.id}`);
  } else if (finalCheck.length === 0) {
    console.log(`\n   ❌ ERROR: No active Butter Chicken found!`);
  } else {
    console.log(`\n   ⚠️  WARNING: Multiple active Butter Chicken entries still exist!`);
  }

  console.log('\n✅ AI ASSISTANT WILL NOW PULL CORRECT DATA\n');
}

main()
  .catch((error) => {
    console.error('❌ ERROR:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

