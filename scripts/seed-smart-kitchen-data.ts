/**
 * SMART KITCHEN INTELLIGENCE - Seed Data Script
 * 
 * Purpose: Add sample data for testing the system
 * Creates:
 * - Sample ingredients with expiry dates
 * - Initial kitchen capacity records
 * - Order metrics for ML training
 * 
 * Run: npx ts-node scripts/seed-smart-kitchen-data.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedSmartKitchenData() {
  console.log('='.repeat(60));
  console.log('SMART KITCHEN INTELLIGENCE - Seeding Test Data');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Get existing menu items
    console.log('[1/4] Fetching menu items...');
    const menuItems = await prisma.menuItem.findMany({
      select: { id: true, name: true },
    });
    console.log(`Found ${menuItems.length} menu items`);
    console.log('');

    // Step 2: Create sample ingredients
    console.log('[2/4] Creating sample ingredients...');
    
    const ingredients = [
      // Expiring soon (critical - 1.5 hours)
      {
        name: 'Chicken Breast',
        currentStock: 3.5,
        unit: 'kg',
        costPerUnit: 250,
        expiryDate: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
        hoursUntilExpiry: 1.5,
        minimumStock: 2.0,
        affectedMenuItems: JSON.stringify([
          menuItems.find(m => m.name.includes('Butter Chicken'))?.id,
          menuItems.find(m => m.name.includes('Chicken Tikka'))?.id,
          menuItems.find(m => m.name.includes('Chicken 65'))?.id,
        ].filter(Boolean)),
      },
      // Expiring soon (high priority - 3 hours)
      {
        name: 'Paneer',
        currentStock: 2.0,
        unit: 'kg',
        costPerUnit: 180,
        expiryDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
        hoursUntilExpiry: 3,
        minimumStock: 1.0,
        affectedMenuItems: JSON.stringify([
          menuItems.find(m => m.name.includes('Paneer'))?.id,
        ].filter(Boolean)),
      },
      // Medium priority (6 hours)
      {
        name: 'Tomatoes',
        currentStock: 5.0,
        unit: 'kg',
        costPerUnit: 40,
        expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        hoursUntilExpiry: 6,
        minimumStock: 2.0,
        affectedMenuItems: JSON.stringify([
          menuItems.find(m => m.name.includes('Butter Chicken'))?.id,
          menuItems.find(m => m.name.includes('Tikka'))?.id,
        ].filter(Boolean)),
      },
      // Fresh (12 hours)
      {
        name: 'Basmati Rice',
        currentStock: 10.0,
        unit: 'kg',
        costPerUnit: 120,
        expiryDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        hoursUntilExpiry: 12,
        minimumStock: 5.0,
        affectedMenuItems: JSON.stringify([
          menuItems.find(m => m.name.includes('Biryani'))?.id,
          menuItems.find(m => m.name.includes('Rice'))?.id,
        ].filter(Boolean)),
      },
      // Low stock alert
      {
        name: 'Butter',
        currentStock: 0.5,
        unit: 'kg',
        costPerUnit: 400,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        hoursUntilExpiry: 24,
        minimumStock: 2.0, // Below minimum!
        affectedMenuItems: JSON.stringify([
          menuItems.find(m => m.name.includes('Butter'))?.id,
          menuItems.find(m => m.name.includes('Naan'))?.id,
        ].filter(Boolean)),
      },
    ];

    for (const ingredient of ingredients) {
      await prisma.ingredientInventory.create({
        data: {
          ...ingredient,
          restaurantId: 'default',
        },
      });
      console.log(`✓ Created ingredient: ${ingredient.name} (${ingredient.hoursUntilExpiry}h to expiry)`);
    }
    console.log('');

    // Step 3: Create initial kitchen capacity record
    console.log('[3/4] Creating initial kitchen capacity record...');
    await prisma.kitchenCapacity.create({
      data: {
        restaurantId: 'default',
        timestamp: new Date(),
        currentOrders: 3,
        maxCapacity: 15,
        utilizationPercent: 20,
        estimatedWaitMinutes: 25,
        staffOnDuty: 3,
        status: 'OPERATIONAL',
      },
    });
    console.log('✓ Kitchen capacity initialized');
    console.log('');

    // Step 4: Create sample order metrics for ML training
    console.log('[4/4] Creating sample order metrics for ML training...');
    
    // Create metrics for the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: 'DELIVERED',
      },
      include: {
        items: {
          select: {
            menuItemId: true,
            quantity: true,
            price: true,
          },
        },
      },
      take: 50,
    });

    console.log(`Found ${recentOrders.length} recent orders to process`);

    for (const order of recentOrders) {
      const orderDate = new Date(order.createdAt);
      
      await prisma.orderMetrics.create({
        data: {
          orderId: order.id,
          timestamp: orderDate,
          orderPlacedHour: orderDate.getHours(),
          orderPlacedDay: orderDate.getDay(),
          orderPlacedMinute: orderDate.getMinutes(),
          preparationTime: 25, // Estimated
          kitchenUtilization: Math.random() * 60 + 20, // 20-80%
          ordersInQueue: Math.floor(Math.random() * 5) + 1,
          staffOnDuty: 3,
          itemsPurchased: JSON.stringify(order.items),
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          totalValue: order.total,
          customerIsReturning: Math.random() > 0.5,
          wasCompleted: true,
          wasCancelled: false,
        },
      });
    }

    console.log(`✓ Created ${recentOrders.length} order metrics for ML training`);
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('SEEDING COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log(`- Ingredients created: ${ingredients.length}`);
    console.log(`- Kitchen capacity initialized: 1 record`);
    console.log(`- Order metrics created: ${recentOrders.length}`);
    console.log('');
    console.log('Test the system:');
    console.log('1. curl http://localhost:3000/api/ingredients/expiry-alerts | json_pp');
    console.log('2. curl http://localhost:3000/api/kitchen/capacity | json_pp');
    console.log('3. curl http://localhost:3000/api/pricing/dynamic/[itemId] | json_pp');
    console.log('');
    console.log('Next step: Run ML training');
    console.log('npx ts-node scripts/train-demand-model.ts');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('SEEDING FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('');
    throw error;
  }
}

// Run the seeding
seedSmartKitchenData()
  .then(async () => {
    console.log('Seeding finished successfully');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

