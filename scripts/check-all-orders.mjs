#!/usr/bin/env node

/**
 * CHECK ALL ORDERS SCRIPT
 * 
 * Purpose: Lists all orders in the database to identify fake/test data
 */

import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const prisma = new PrismaClient();

async function checkAllOrders() {
  console.log('\n📋 Checking ALL orders in database...\n');

  try {
    const allOrders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total orders in database: ${allOrders.length}\n`);

    if (allOrders.length === 0) {
      console.log('✅ Database is empty - no orders found.\n');
      return;
    }

    // Categorize orders
    const realOrders = [];
    const fakeOrders = [];

    allOrders.forEach(order => {
      const email = order.customerEmail.toLowerCase();
      const orderNum = order.orderNumber;
      
      const isFake = 
        email.includes('@example.com') || 
        email.includes('test@') || 
        email.includes('sample@') ||
        orderNum.startsWith('BK-2024-') ||
        email.includes('dummy') ||
        email.includes('fake') ||
        order.customerName.toLowerCase().includes('test') ||
        order.customerName.toLowerCase().includes('sample') ||
        order.customerName.toLowerCase().includes('dummy') ||
        order.customerName.toLowerCase().includes('fake');

      if (isFake) {
        fakeOrders.push(order);
      } else {
        realOrders.push(order);
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ REAL ORDERS: ${realOrders.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    realOrders.forEach(order => {
      console.log(`\n📦 ${order.orderNumber}`);
      console.log(`   Customer: ${order.customerName}`);
      console.log(`   Email: ${order.customerEmail}`);
      console.log(`   Phone: ${order.customerPhone}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: ₹${order.total}`);
      console.log(`   Created: ${order.createdAt.toISOString()}`);
      console.log(`   Items: ${order.items.length}`);
    });

    if (fakeOrders.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`❌ FAKE/TEST ORDERS: ${fakeOrders.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      fakeOrders.forEach(order => {
        console.log(`\n🗑️  ${order.orderNumber}`);
        console.log(`   Customer: ${order.customerName}`);
        console.log(`   Email: ${order.customerEmail}`);
        console.log(`   Phone: ${order.customerPhone}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: ₹${order.total}`);
        console.log(`   Created: ${order.createdAt.toISOString()}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error checking orders:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllOrders();

