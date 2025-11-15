#!/usr/bin/env node

/**
 * CLEANUP SAMPLE ORDERS SCRIPT
 * 
 * Purpose: Removes all fake/test/sample orders from the database
 * Only keeps real orders placed through the frontend checkout form
 * 
 * Run with: node scripts/cleanup-sample-orders.mjs
 */

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const prisma = new PrismaClient();

async function cleanupSampleOrders() {
  console.log('\n🧹 Cleaning up sample/test orders...\n');

  try {
    // Get all orders first, then filter in JavaScript (SQLite doesn't support all patterns)
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        createdAt: true,
      },
    });

    // Filter test/sample/fake orders
    const sampleOrders = allOrders.filter(order => {
      const email = order.customerEmail.toLowerCase();
      const name = order.customerName.toLowerCase();
      const orderNum = order.orderNumber;
      
      return (
        // Test email domains
        email.includes('@example.com') || 
        email.includes('@test.') || 
        email.includes('test@') || 
        email.includes('sample@') ||
        email.includes('@sample.') ||
        email.includes('dummy@') ||
        email.includes('fake@') ||
        // Test order number patterns
        orderNum.startsWith('BK-2024-') ||
        // Test customer names
        name.includes('test') ||
        name.includes('sample') ||
        name.includes('dummy') ||
        name.includes('fake') ||
        // Suspicious patterns (like "fsdd", "asdf", etc.)
        name.length <= 3 ||
        /^[a-z]{1,4}$/.test(name) || // Very short names (likely test data)
        // Test phone numbers
        order.customerPhone.includes('98765 43210') ||
        order.customerPhone.includes('90104 60964')
      );
    });

    if (sampleOrders.length === 0) {
      console.log('✅ No sample orders found. Database is clean!\n');
      return;
    }

    console.log(`📋 Found ${sampleOrders.length} sample order(s) to delete:\n`);
    sampleOrders.forEach((order) => {
      console.log(`   - ${order.orderNumber}: ${order.customerName} (${order.customerEmail})`);
    });

    // Delete sample orders (cascade will delete order items)
    const deleteResult = await prisma.order.deleteMany({
      where: {
        id: { in: sampleOrders.map((o) => o.id) },
      },
    });

    console.log(`\n✅ Deleted ${deleteResult.count} sample order(s) from database\n`);

    // Count remaining real orders
    const realOrdersCount = await prisma.order.count();
    console.log(`📊 Remaining real orders in database: ${realOrdersCount}\n`);

  } catch (error) {
    console.error('❌ Error cleaning up sample orders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSampleOrders();

