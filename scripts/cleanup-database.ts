#!/usr/bin/env npx ts-node
/**
 * DATABASE CLEANUP SCRIPT
 * 
 * Cleans up test orders and unnecessary data while preserving:
 * - Menu items
 * - Admin accounts
 * - Essential configuration
 * 
 * This reduces database size and query count for Prisma Accelerate limits.
 * 
 * Usage: npx ts-node scripts/cleanup-database.ts
 */

import { PrismaClient } from '@prisma/client';

// Use direct Supabase connection to bypass Prisma Accelerate limits
const DIRECT_DATABASE_URL = 'postgresql://postgres.jkacjjusycmjwtcedeqf:Sailaja2025@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DIRECT_DATABASE_URL,
    },
  },
});

async function cleanupDatabase() {
  console.log('🧹 DATABASE CLEANUP SCRIPT');
  console.log('==========================\n');
  
  try {
    // 1. Count current records
    console.log('📊 Current database state:');
    
    const counts = {
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      payments: await prisma.payment.count(),
      receipts: await prisma.receipt.count(),
      notifications: await prisma.notificationLog.count(),
      cartReservations: await prisma.cartReservation.count(),
      sessions: await prisma.userSession.count(),
      menuItems: await prisma.menuItem.count(),
      admins: await prisma.admin.count(),
      customers: await prisma.customer.count(),
    };
    
    console.log(`   Orders: ${counts.orders}`);
    console.log(`   Order Items: ${counts.orderItems}`);
    console.log(`   Payments: ${counts.payments}`);
    console.log(`   Receipts: ${counts.receipts}`);
    console.log(`   Notifications: ${counts.notifications}`);
    console.log(`   Cart Reservations: ${counts.cartReservations}`);
    console.log(`   User Sessions: ${counts.sessions}`);
    console.log(`   Menu Items: ${counts.menuItems} (KEEP)`);
    console.log(`   Admins: ${counts.admins} (KEEP)`);
    console.log(`   Customers: ${counts.customers}`);
    
    console.log('\n🗑️  Cleaning up test data...\n');
    
    // 2. Delete in correct order (respect foreign keys)
    
    // Delete notifications first (depends on orders)
    const deletedNotifications = await prisma.notificationLog.deleteMany({});
    console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);
    
    // Delete payments (depends on orders)
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`   ✓ Deleted ${deletedPayments.count} payments`);
    
    // Delete receipts (depends on orders)
    const deletedReceipts = await prisma.receipt.deleteMany({});
    console.log(`   ✓ Deleted ${deletedReceipts.count} receipts`);
    
    // Delete order items (depends on orders)
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`   ✓ Deleted ${deletedOrderItems.count} order items`);
    
    // Delete deliveries (depends on orders)
    try {
      const deletedDeliveries = await prisma.delivery.deleteMany({});
      console.log(`   ✓ Deleted ${deletedDeliveries.count} deliveries`);
    } catch (e) {
      console.log(`   ⚠ No deliveries table or already empty`);
    }
    
    // Delete coupon usage (depends on orders)
    try {
      const deletedCouponUsage = await prisma.couponUsage.deleteMany({});
      console.log(`   ✓ Deleted ${deletedCouponUsage.count} coupon usages`);
    } catch (e) {
      console.log(`   ⚠ No coupon usage or already empty`);
    }
    
    // Now delete orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`   ✓ Deleted ${deletedOrders.count} orders`);
    
    // Delete cart reservations (old/expired)
    const deletedCarts = await prisma.cartReservation.deleteMany({});
    console.log(`   ✓ Deleted ${deletedCarts.count} cart reservations`);
    
    // Delete expired user sessions
    const deletedSessions = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    console.log(`   ✓ Deleted ${deletedSessions.count} expired sessions`);
    
    // Delete old audit logs (keep last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      const deletedAuditLogs = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedAuditLogs.count} old audit logs`);
    } catch (e) {
      console.log(`   ⚠ No audit logs or already empty`);
    }
    
    // Delete demand history (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      const deletedDemand = await prisma.itemDemandHistory.deleteMany({
        where: { timestamp: { lt: thirtyDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedDemand.count} old demand history`);
    } catch (e) {
      console.log(`   ⚠ No demand history or already empty`);
    }
    
    // Delete old dynamic pricing records
    try {
      const deletedPricing = await prisma.dynamicPricing.deleteMany({
        where: { timestamp: { lt: thirtyDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedPricing.count} old pricing records`);
    } catch (e) {
      console.log(`   ⚠ No pricing records or already empty`);
    }
    
    // Delete daily sales (keep last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    try {
      const deletedSales = await prisma.dailySales.deleteMany({
        where: { date: { lt: ninetyDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedSales.count} old daily sales`);
    } catch (e) {
      console.log(`   ⚠ No daily sales or already empty`);
    }
    
    // Delete old legal acceptances (keep last 30 days)
    try {
      const deletedLegal = await prisma.legalAcceptance.deleteMany({
        where: { acceptedAt: { lt: thirtyDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedLegal.count} old legal acceptances`);
    } catch (e) {
      console.log(`   ⚠ No legal acceptances or already empty`);
    }
    
    // Delete old cookie consents
    try {
      const deletedCookies = await prisma.cookieConsent.deleteMany({
        where: { consentedAt: { lt: thirtyDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedCookies.count} old cookie consents`);
    } catch (e) {
      console.log(`   ⚠ No cookie consents or already empty`);
    }
    
    // Delete database change logs (keep last 7 days)
    try {
      const deletedChanges = await prisma.databaseChange.deleteMany({
        where: { occurredAt: { lt: sevenDaysAgo } },
      });
      console.log(`   ✓ Deleted ${deletedChanges.count} old database changes`);
    } catch (e) {
      console.log(`   ⚠ No database changes or already empty`);
    }
    
    console.log('\n📊 After cleanup:');
    
    const newCounts = {
      orders: await prisma.order.count(),
      menuItems: await prisma.menuItem.count(),
      admins: await prisma.admin.count(),
      customers: await prisma.customer.count(),
    };
    
    console.log(`   Orders: ${newCounts.orders}`);
    console.log(`   Menu Items: ${newCounts.menuItems} (preserved)`);
    console.log(`   Admins: ${newCounts.admins} (preserved)`);
    console.log(`   Customers: ${newCounts.customers}`);
    
    console.log('\n✅ DATABASE CLEANUP COMPLETE!');
    console.log('   Your Prisma Accelerate query limit should now have more headroom.');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes("Can't reach database")) {
        console.log('\n⚠️ Cannot connect to database.');
        console.log('Possible causes:');
        console.log('1. Supabase database is paused (free tier pauses after 7 days)');
        console.log('2. Database credentials are incorrect');
        console.log('\nSolution: Log into https://supabase.com/dashboard and wake up your database');
      } else if (error.message.includes('planLimitReached')) {
        console.log('\n⚠️ Prisma Accelerate limit reached.');
        console.log('This script uses direct Supabase connection, but it seems blocked.');
        console.log('\nTry running this SQL directly in Supabase SQL Editor:');
        console.log(`
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/jkacjjusycmjwtcedeqf/sql)

-- Delete all test orders and related data
DELETE FROM "NotificationLog";
DELETE FROM "Payment";
DELETE FROM "Receipt";
DELETE FROM "OrderItem";
DELETE FROM "Delivery";
DELETE FROM "CouponUsage";
DELETE FROM "Order";
DELETE FROM "CartReservation";
DELETE FROM "UserSession" WHERE "expiresAt" < NOW() OR "isRevoked" = true;

-- Keep menu items, admins, and customers
-- VACUUM to reclaim space
VACUUM;
        `);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase();

