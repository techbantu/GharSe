import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching latest 5 orders...');
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    console.log(`Found ${orders.length} orders.`);

    for (const order of orders) {
      console.log('---------------------------------------------------');
      console.log(`Order ID: ${order.id}`);
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Status: ${order.status}`);
      console.log(`Total (DB):`, order.total, typeof order.total);
      console.log(`Subtotal (DB):`, order.subtotal);
      console.log(`Items: ${order.items.length}`);
      
      order.items.forEach((item, index) => {
        console.log(`  Item ${index + 1}:`);
        console.log(`    Name: ${item.menuItem?.name} (from relation)`);
        console.log(`    Quantity: ${item.quantity}`);
        console.log(`    Price (Snapshot):`, item.price, typeof item.price);
        console.log(`    MenuItem Price (Current):`, item.menuItem?.price);
      });
    }

  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
