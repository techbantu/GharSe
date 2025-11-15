/**
 * MIGRATE FROM SQLITE TO PRISMA POSTGRES
 * Copies all data from SQLite backup to Prisma Postgres
 */

import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function migrate() {
  console.log(`\n${colors.cyan}🚀 MIGRATING FROM SQLITE TO PRISMA POSTGRES${colors.reset}\n`);

  // Source: SQLite
  const sqlite = new Database('./prisma/dev.db', { readonly: true });

  // Target: Prisma Postgres (reads from DATABASE_URL with Accelerate)
  const prismaPostgres = new PrismaClient();

  try {
    await prismaPostgres.$connect();
    console.log(`${colors.green}✓${colors.reset} Connected to Prisma Postgres\n`);

    // Clear existing data in Prisma Postgres
    console.log(`${colors.yellow}⚠${colors.reset} Clearing existing data...`);
    await prismaPostgres.receipt.deleteMany({});
    await prismaPostgres.payment.deleteMany({});
    await prismaPostgres.orderItem.deleteMany({});
    await prismaPostgres.order.deleteMany({});
    await prismaPostgres.customer.deleteMany({});
    await prismaPostgres.menuItem.deleteMany({});
    await prismaPostgres.chef.deleteMany({});
    console.log(`${colors.green}✓${colors.reset} Cleared existing data\n`);

    // Migrate Chefs
    console.log(`${colors.blue}▶${colors.reset} Migrating chefs...`);
    const chefs = sqlite.prepare('SELECT * FROM Chef').all();
    for (const chef of chefs) {
      await prismaPostgres.chef.create({ data: chef as any });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${chefs.length} chef(s)`);

    // Migrate Menu Items
    console.log(`${colors.blue}▶${colors.reset} Migrating menu items...`);
    const menuItems = sqlite.prepare('SELECT * FROM MenuItem').all();
    for (const item of menuItems) {
      const i = item as any;
      await prismaPostgres.menuItem.create({
        data: {
          ...i,
          isVegetarian: Boolean(i.isVegetarian),
          isVegan: Boolean(i.isVegan),
          isGlutenFree: Boolean(i.isGlutenFree),
          isAvailable: Boolean(i.isAvailable),
          isPopular: Boolean(i.isPopular),
          inventoryEnabled: Boolean(i.inventoryEnabled),
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt),
        },
      });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${menuItems.length} menu item(s)`);

    // Migrate Customers
    console.log(`${colors.blue}▶${colors.reset} Migrating customers...`);
    const customers = sqlite.prepare('SELECT * FROM Customer').all();
    for (const customer of customers) {
      const c = customer as any;
      const { privacyAccepted, privacyAcceptedAt, emailVerifiedAt, phoneVerifiedAt, ...customerData } = c;
      await prismaPostgres.customer.create({
        data: {
          ...customerData,
          emailVerified: Boolean(c.emailVerified),
          phoneVerified: Boolean(c.phoneVerified),
          termsAccepted: Boolean(c.termsAccepted),
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          emailVerificationExpires: c.emailVerificationExpires ? new Date(c.emailVerificationExpires) : null,
          phoneVerificationExpires: c.phoneVerificationExpires ? new Date(c.phoneVerificationExpires) : null,
          passwordResetExpires: c.passwordResetExpires ? new Date(c.passwordResetExpires) : null,
          lastLoginAt: c.lastLoginAt ? new Date(c.lastLoginAt) : null,
          lastOrderAt: c.lastOrderAt ? new Date(c.lastOrderAt) : null,
          termsAcceptedAt: c.termsAcceptedAt ? new Date(c.termsAcceptedAt) : null,
        },
      });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${customers.length} customer(s)`);

    // Migrate Orders
    console.log(`${colors.blue}▶${colors.reset} Migrating orders...`);
    const orders = sqlite.prepare('SELECT * FROM "Order"').all();
    for (const order of orders) {
      const o = order as any;
      await prismaPostgres.order.create({
        data: {
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
          confirmedAt: o.confirmedAt ? new Date(o.confirmedAt) : null,
          preparingAt: o.preparingAt ? new Date(o.preparingAt) : null,
          readyAt: o.readyAt ? new Date(o.readyAt) : null,
          deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
          cancelledAt: o.cancelledAt ? new Date(o.cancelledAt) : null,
          estimatedDelivery: o.estimatedDelivery ? new Date(o.estimatedDelivery) : null,
        },
      });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${orders.length} order(s)`);

    // Migrate Order Items
    console.log(`${colors.blue}▶${colors.reset} Migrating order items...`);
    const orderItems = sqlite.prepare('SELECT * FROM OrderItem').all();
    for (const item of orderItems) {
      await prismaPostgres.orderItem.create({ data: item as any });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${orderItems.length} order item(s)`);

    // Migrate Payments
    console.log(`${colors.blue}▶${colors.reset} Migrating payments...`);
    const payments = sqlite.prepare('SELECT * FROM Payment').all();
    for (const payment of payments) {
      await prismaPostgres.payment.create({ data: payment as any });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${payments.length} payment(s)`);

    // Migrate Receipts
    console.log(`${colors.blue}▶${colors.reset} Migrating receipts...`);
    const receipts = sqlite.prepare('SELECT * FROM Receipt').all();
    for (const receipt of receipts) {
      const r = receipt as any;
      await prismaPostgres.receipt.create({
        data: {
          id: r.id,
          orderId: r.orderId,
          receiptNumber: r.receiptNumber,
          receiptData: JSON.parse(r.receiptData),
          pdfUrl: r.pdfUrl,
          pdfPublicId: r.pdfPublicId,
          generatedAt: new Date(r.generatedAt),
          emailedAt: r.emailedAt ? new Date(r.emailedAt) : null,
        } as any,
      });
    }
    console.log(`${colors.green}✓${colors.reset} Migrated ${receipts.length} receipt(s)`);

    console.log(`\n${colors.green}🎉 MIGRATION COMPLETED SUCCESSFULLY!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✗ Migration failed:${colors.reset}`, error);
    throw error;
  } finally {
    sqlite.close();
    await prismaPostgres.$disconnect();
  }
}

migrate().catch(console.error);

