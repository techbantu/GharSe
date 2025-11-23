/**
 * DEBUG SCRIPT: Check Taste Profile Data
 * 
 * This script helps diagnose why taste profile shows 0% exploration
 * despite having orders in the database.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTasteProfile() {
  try {
    console.log('🔍 DEBUG: Taste Profile Data\n');
    console.log('='.repeat(60));

    // 1. Check all customers
    console.log('\n1️⃣ CHECKING CUSTOMERS...');
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    console.log(`Found ${customers.length} customers:`);
    customers.forEach(c => {
      console.log(`  - ${c.name} (${c.email}): ${c._count.orders} orders`);
    });

    // 2. Pick a customer with orders
    const customerWithOrders = customers.find(c => c._count.orders > 0);
    
    if (!customerWithOrders) {
      console.log('\n❌ No customers with orders found!');
      return;
    }

    console.log(`\n2️⃣ ANALYZING CUSTOMER: ${customerWithOrders.name}`);
    console.log('='.repeat(60));

    // 3. Fetch their orders with full details
    const orders = await prisma.order.findMany({
      where: {
        customerId: customerWithOrders.id,
        status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n📦 Total Orders: ${orders.length}`);

    // 4. Analyze each order
    const uniqueDishes = new Set<string>();
    const categories = new Set<string>();
    let totalItems = 0;

    orders.forEach((order, idx) => {
      console.log(`\n  Order #${idx + 1} (${order.orderNumber}):`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Items: ${order.items.length}`);
      
      order.items.forEach((item, itemIdx) => {
        totalItems++;
        console.log(`\n    Item ${itemIdx + 1}:`);
        console.log(`      - Item ID: ${item.id}`);
        console.log(`      - Menu Item ID: ${item.menuItemId}`);
        console.log(`      - Quantity: ${item.quantity}`);
        console.log(`      - Price: ₹${item.price}`);
        
        if (item.menuItem) {
          console.log(`      - Dish Name: ${item.menuItem?.name || 'Unknown Item'}`);
          console.log(`      - Category: ${item.menuItem.category}`);
          console.log(`      - Available: ${item.menuItem.isAvailable}`);
          
          uniqueDishes.add(item.menuItemId);
          if (item.menuItem.category) {
            categories.add(item.menuItem.category);
          }
        } else {
          console.log(`      ⚠️  WARNING: menuItem is NULL!`);
        }
      });
    });

    console.log('\n='.repeat(60));
    console.log('📊 STATISTICS:');
    console.log(`  Total Orders: ${orders.length}`);
    console.log(`  Total Items Ordered: ${totalItems}`);
    console.log(`  Unique Dishes: ${uniqueDishes.size}`);
    console.log(`  Categories Explored: ${categories.size}`);
    console.log(`  Categories: ${Array.from(categories).join(', ')}`);

    // 5. Check total menu
    const totalMenuItems = await prisma.menuItem.count({
      where: { isAvailable: true },
    });

    const allCategories = await prisma.menuItem.groupBy({
      by: ['category'],
      where: { isAvailable: true },
    });

    console.log(`\n📋 MENU STATS:`);
    console.log(`  Total Menu Items: ${totalMenuItems}`);
    console.log(`  Total Categories: ${allCategories.length}`);
    console.log(`  All Categories: ${allCategories.map(c => c.category).join(', ')}`);

    // 6. Calculate exploration
    const explorationPercentage = totalMenuItems > 0 
      ? Math.round((uniqueDishes.size / totalMenuItems) * 100)
      : 0;

    console.log(`\n🎯 EXPLORATION:`);
    console.log(`  ${uniqueDishes.size} / ${totalMenuItems} dishes = ${explorationPercentage}%`);

    // 7. Check for data issues
    console.log(`\n🔧 POTENTIAL ISSUES:`);
    
    const ordersWithoutItems = orders.filter(o => !o.items || o.items.length === 0);
    if (ordersWithoutItems.length > 0) {
      console.log(`  ⚠️  ${ordersWithoutItems.length} orders have no items!`);
    }

    const itemsWithoutMenuItem = orders.flatMap(o => o.items).filter(i => !i.menuItem);
    if (itemsWithoutMenuItem.length > 0) {
      console.log(`  ⚠️  ${itemsWithoutMenuItem.length} order items have no menuItem!`);
      console.log(`  Affected item IDs: ${itemsWithoutMenuItem.map(i => i.menuItemId).join(', ')}`);
    }

    const itemsWithoutCategory = orders.flatMap(o => o.items).filter(i => i.menuItem && !i.menuItem.category);
    if (itemsWithoutCategory.length > 0) {
      console.log(`  ⚠️  ${itemsWithoutCategory.length} menu items have no category!`);
    }

    if (uniqueDishes.size === 0) {
      console.log(`  ❌ CRITICAL: No dishes were counted! Check the data structure.`);
    }

    if (categories.size === 0) {
      console.log(`  ❌ CRITICAL: No categories were found! Check the category field.`);
    }

    console.log('\n='.repeat(60));
    console.log('✅ Debug complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugTasteProfile();

