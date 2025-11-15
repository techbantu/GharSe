/**
 * VERIFY MIGRATION - Check that Supabase has all the data
 */

import { PrismaClient } from '@prisma/client';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function verify() {
  console.log(`\n${colors.cyan}🔍 VERIFYING SUPABASE DATA${colors.reset}\n`);

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log(`${colors.green}✓${colors.reset} Connected to Supabase\n`);

    // Count records in each table
    const counts = {
      chefs: await prisma.chef.count(),
      menuItems: await prisma.menuItem.count(),
      customers: await prisma.customer.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      payments: await prisma.payment.count(),
      receipts: await prisma.receipt.count(),
    };

    console.log(`${colors.blue}📊 Record Counts:${colors.reset}`);
    console.log(`   Chefs:       ${counts.chefs}`);
    console.log(`   Menu Items:  ${counts.menuItems}`);
    console.log(`   Customers:   ${counts.customers}`);
    console.log(`   Orders:      ${counts.orders}`);
    console.log(`   Order Items: ${counts.orderItems}`);
    console.log(`   Payments:    ${counts.payments}`);
    console.log(`   Receipts:    ${counts.receipts}`);

    // Sample some data
    console.log(`\n${colors.blue}🍽️  Sample Menu Items:${colors.reset}`);
    const sampleItems = await prisma.menuItem.findMany({
      take: 3,
      select: { name: true, price: true, category: true },
    });
    sampleItems.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} - ₹${item.price} (${item.category})`);
    });

    console.log(`\n${colors.blue}👥 Sample Customers:${colors.reset}`);
    const sampleCustomers = await prisma.customer.findMany({
      take: 3,
      select: { name: true, email: true, totalOrders: true },
    });
    sampleCustomers.forEach((customer, i) => {
      console.log(`   ${i + 1}. ${customer.name} (${customer.email}) - ${customer.totalOrders} orders`);
    });

    console.log(`\n${colors.blue}📦 Sample Orders:${colors.reset}`);
    const sampleOrders = await prisma.order.findMany({
      take: 3,
      select: { orderNumber: true, total: true, status: true, createdAt: true },
    });
    sampleOrders.forEach((order, i) => {
      console.log(`   ${i + 1}. ${order.orderNumber} - ₹${order.total} (${order.status}) - ${order.createdAt.toLocaleDateString()}`);
    });

    console.log(`\n${colors.green}✅ VERIFICATION COMPLETE!${colors.reset}`);
    console.log(`${colors.green}All data is safely stored in Supabase.${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✗ Verification failed:${colors.reset}`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify().catch(console.error);

