/**
 * TEST SCRIPT: Debug Cart Price Validation
 * Test the actual cart data and price validation logic
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 DEBUGGING CART PRICE ISSUE...\n');

  // Fetch Butter Chicken from database
  const butterChicken = await prisma.menuItem.findFirst({
    where: {
      name: 'Butter Chicken',
      isAvailable: true,
    },
  });

  if (butterChicken) {
    console.log('📋 DATABASE DATA:');
    console.log(`   Name: ${butterChicken.name}`);
    console.log(`   ID: ${butterChicken.id}`);
    console.log(`   Price: ${butterChicken.price} (type: ${typeof butterChicken.price})`);
    console.log(`   Original Price: ${butterChicken.originalPrice}`);
    console.log('');

    // Test calculation
    const quantity = 1;
    const subtotal = quantity * butterChicken.price;
    console.log('🧮 CALCULATION TEST:');
    console.log(`   Quantity: ${quantity}`);
    console.log(`   Price: ${butterChicken.price}`);
    console.log(`   Subtotal: ${subtotal}`);
    console.log(`   Is NaN? ${isNaN(subtotal)}`);
    console.log('');

    // Check data types
    console.log('🔍 DATA TYPE ANALYSIS:');
    console.log(`   Price type: ${typeof butterChicken.price}`);
    console.log(`   Price value: ${JSON.stringify(butterChicken.price)}`);
    console.log(`   Price as number: ${Number(butterChicken.price)}`);
    console.log(`   Is number? ${typeof butterChicken.price === 'number'}`);
    console.log('');

    // Simulate cart item
    const cartItem = {
      id: 'cart-test',
      menuItem: butterChicken,
      quantity: 1,
      subtotal: butterChicken.price * 1,
    };

    console.log('🛒 SIMULATED CART ITEM:');
    console.log(JSON.stringify(cartItem, null, 2));
  } else {
    console.log('❌ Butter Chicken not found in database!');
  }

  // Test fetching all menu items (like the API does)
  const allItems = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    select: {
      id: true,
      name: true,
      price: true,
      originalPrice: true,
    },
    take: 5,
  });

  console.log('\n📋 SAMPLE MENU ITEMS FROM API:');
  allItems.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.name}: ₹${item.price} (type: ${typeof item.price})`);
  });
}

main()
  .catch((error) => {
    console.error('❌ ERROR:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
