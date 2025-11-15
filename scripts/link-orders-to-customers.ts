/**
 * LINK ORDERS TO CUSTOMERS - Migration Script
 * 
 * Purpose: Link existing orders to customer accounts by matching email addresses
 * 
 * Run this once to fix orders that were placed before the customerId fix
 * 
 * Usage:
 * npx tsx scripts/link-orders-to-customers.ts
 */

import prisma from '../lib/prisma';

async function linkOrdersToCustomers() {
  console.log('🔗 Starting to link orders to customers...\n');
  
  try {
    // Find all orders without a customerId
    const orphanOrders = await prisma.order.findMany({
      where: {
        customerId: null,
      },
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        customerName: true,
        createdAt: true,
      },
    });
    
    console.log(`📊 Found ${orphanOrders.length} orders without customer link\n`);
    
    if (orphanOrders.length === 0) {
      console.log('✅ All orders are already linked to customers!');
      return;
    }
    
    let linkedCount = 0;
    let notFoundCount = 0;
    
    for (const order of orphanOrders) {
      // Find customer by email
      const customer = await prisma.customer.findUnique({
        where: {
          email: order.customerEmail,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      
      if (customer) {
        // Link order to customer
        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            customerId: customer.id,
          },
        });
        
        linkedCount++;
        console.log(`✅ Linked order ${order.orderNumber} to customer ${customer.name} (${customer.email})`);
      } else {
        notFoundCount++;
        console.log(`⚠️  No customer found for order ${order.orderNumber} (${order.customerEmail})`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Linked: ${linkedCount} orders`);
    console.log(`   ⚠️  No customer found: ${notFoundCount} orders`);
    console.log(`\n🎉 Migration complete!`);
    
  } catch (error) {
    console.error('❌ Error linking orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
linkOrdersToCustomers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

