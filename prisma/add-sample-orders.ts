import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛒 Creating sample orders for testing...\n');

  // Get menu items
  const butterChicken = await prisma.menuItem.findFirst({ where: { name: { contains: 'Butter Chicken' } } });
  const biryani = await prisma.menuItem.findFirst({ where: { name: { contains: 'Chicken Biryani' } } });
  const naan = await prisma.menuItem.findFirst({ where: { name: { contains: 'Garlic Naan' } } });

  if (!butterChicken || !biryani || !naan) {
    throw new Error('Menu items not found. Run seed first.');
  }

  // Create sample orders with Indian phone numbers
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'BK-2024-001',
      customerName: 'Raj Kumar',
      customerEmail: 'raj@example.com',
      customerPhone: '+91 98765 43210',
      deliveryAddress: 'Flat 12, Green Valley',
      deliveryCity: 'Hyderabad',
      deliveryZip: '501505',
      status: 'PREPARING',
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE',
      subtotal: 398,
      deliveryFee: 0,
      tax: 19.9,
      total: 417.9,
      estimatedPrepTime: 30,
      items: {
        create: [
          {
            menuItemId: butterChicken.id,
            quantity: 1,
            price: butterChicken.price,
            subtotal: butterChicken.price,
          },
          {
            menuItemId: naan.id,
            quantity: 2,
            price: naan.price,
            subtotal: naan.price * 2,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'BK-2024-002',
      customerName: 'Priya Sharma',
      customerEmail: 'priya@example.com',
      customerPhone: '+91 90104 60964',
      deliveryAddress: 'Plot 45, Sunrise Apartments',
      deliveryCity: 'Hayathnagar',
      deliveryZip: '501505',
      status: 'OUT_FOR_DELIVERY',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      subtotal: 379,
      deliveryFee: 0,
      tax: 18.95,
      total: 397.95,
      estimatedPrepTime: 35,
      items: {
        create: [
          {
            menuItemId: biryani.id,
            quantity: 1,
            price: biryani.price,
            subtotal: biryani.price,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample orders:');
  console.log(`   📦 ${order1.orderNumber} - ${order1.customerName} (${order1.customerPhone})`);
  console.log(`   📦 ${order2.orderNumber} - ${order2.customerName} (${order2.customerPhone})`);
  console.log('\n🧪 Test with these:');
  console.log(`   - "Track order: ${order1.orderNumber}"`);
  console.log(`   - "Track order: ${order1.customerPhone}"`);
  console.log(`   - "Track order: ${order2.customerPhone}"`);
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

