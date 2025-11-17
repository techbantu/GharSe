/**
 * CART PRICE DIAGNOSIS SCRIPT
 * 
 * This script helps diagnose why cart items show ₹0 when database has ₹299
 * 
 * Possible causes:
 * 1. Cart stored in localStorage with old price (₹0)
 * 2. Cart in database (if using persistent carts) with old price
 * 3. Menu item was temporarily ₹0 and someone added it to cart then
 * 
 * Solution: Clear all cart storage and force fresh data fetch
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 DIAGNOSING CART PRICE ISSUE...\n');

  // Check if there are any orders with Butter Chicken at ₹0
  const ordersWithZeroPrice = await prisma.orderItem.findMany({
    where: {
      menuItem: {
        name: {
          contains: 'Butter Chicken',
          mode: 'insensitive',
        },
      },
      price: 0,
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
        },
      },
      menuItem: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
  });

  if (ordersWithZeroPrice.length > 0) {
    console.log(`⚠️  Found ${ordersWithZeroPrice.length} order items with Butter Chicken at ₹0:`);
    ordersWithZeroPrice.forEach((item) => {
      console.log(`   Order #${item.order.orderNumber} - Status: ${item.order.status}`);
      console.log(`   Order Item Price: ₹${item.price}`);
      console.log(`   Current Menu Price: ₹${item.menuItem.price}`);
      console.log('');
    });
  } else {
    console.log('✅ No orders found with Butter Chicken at ₹0');
  }

  // Check current menu item price
  const butterChicken = await prisma.menuItem.findFirst({
    where: {
      name: 'Butter Chicken',
      isAvailable: true,
    },
  });

  if (butterChicken) {
    console.log('\n📋 CURRENT MENU ITEM DATA:');
    console.log(`   ID: ${butterChicken.id}`);
    console.log(`   Name: ${butterChicken.name}`);
    console.log(`   Price: ₹${butterChicken.price}`);
    console.log(`   Original Price: ₹${butterChicken.originalPrice || 'N/A'}`);
    console.log(`   Category: ${butterChicken.category}`);
    console.log(`   Available: ${butterChicken.isAvailable}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 DIAGNOSIS:');
  console.log('='.repeat(60));
  console.log('\nThe issue is likely STALE CART DATA in browser localStorage.');
  console.log('\nWhen users have items in cart from BEFORE you fixed the price,');
  console.log('those old items still show the old price (₹0).');
  console.log('\n📝 SOLUTION OPTIONS:');
  console.log('\n1. FORCE CART REFRESH:');
  console.log('   - Clear localStorage on app load');
  console.log('   - Re-fetch all cart item prices from database');
  console.log('\n2. CART PRICE VALIDATION:');
  console.log('   - When displaying cart, validate each item price');
  console.log('   - If price mismatch, update from database');
  console.log('\n3. USER ACTION:');
  console.log('   - Ask users to clear their cart and re-add items');
  console.log('   - Add "Refresh Prices" button in cart');
  console.log('\n✅ RECOMMENDED: Implement automatic price refresh on cart load');
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ ERROR:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

