/**
 * SEED SAMPLE DATA - Database Population Script
 * 
 * Purpose: Populate database with sample data for testing and demos
 * 
 * Run with: npx ts-node scripts/seed-sample-data.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create sample delivery partners
  console.log('📦 Creating delivery partners...');
  const deliveryPartners = await Promise.all([
    prisma.deliveryPartner.upsert({
      where: { phone: '+919876543210' },
      update: {},
      create: {
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        email: 'rajesh@delivery.com',
        vehicleType: 'bike',
        vehicleNumber: 'TS09AB1234',
        isOnline: true,
        isAvailable: true,
        currentLat: 17.3850,
        currentLng: 78.4867,
        totalDeliveries: 150,
        rating: 4.8,
        completionRate: 98.5,
      },
    }),
    prisma.deliveryPartner.upsert({
      where: { phone: '+919876543211' },
      update: {},
      create: {
        name: 'Suresh Reddy',
        phone: '+919876543211',
        email: 'suresh@delivery.com',
        vehicleType: 'scooter',
        vehicleNumber: 'TS09CD5678',
        isOnline: false,
        isAvailable: true,
        currentLat: 17.4000,
        currentLng: 78.5000,
        totalDeliveries: 89,
        rating: 4.6,
        completionRate: 95.2,
      },
    }),
    prisma.deliveryPartner.upsert({
      where: { phone: '+919876543212' },
      update: {},
      create: {
        name: 'Venkat Rao',
        phone: '+919876543212',
        email: 'venkat@delivery.com',
        vehicleType: 'bike',
        vehicleNumber: 'TS09EF9012',
        isOnline: true,
        isAvailable: true,
        currentLat: 17.3700,
        currentLng: 78.4700,
        totalDeliveries: 210,
        rating: 4.9,
        completionRate: 99.1,
      },
    }),
  ]);
  console.log(`   ✅ Created ${deliveryPartners.length} delivery partners\n`);

  // 2. Create sample tenant
  console.log('🏢 Creating sample tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'delhi-home-chefs' },
    update: {},
    create: {
      slug: 'delhi-home-chefs',
      name: 'Delhi Home Chefs',
      plan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      primaryColor: '#FF6B35',
      secondaryColor: '#FFA500',
      maxChefs: 100,
      maxOrders: 10000,
      maxMenuItems: 500,
      maxStorage: 25,
      monthlyPrice: 299,
      commission: 15,
      ownerName: 'Amit Sharma',
      ownerEmail: 'amit@delhihomechefs.com',
      ownerPhone: '+919999888877',
      isActive: true,
    },
  });
  console.log(`   ✅ Created tenant: ${tenant.name}\n`);

  // 3. Create sample chefs
  console.log('👨‍🍳 Creating sample chefs...');
  const chefs = await Promise.all([
    prisma.chef.upsert({
      where: { slug: 'sailaja-kitchen' },
      update: {},
      create: {
        name: 'Sailaja',
        businessName: "Sailaja's Kitchen",
        slug: 'sailaja-kitchen',
        phone: '+919010460964',
        email: 'sailaja@gharse.app',
        address: JSON.stringify({
          street: 'Padhmalayanagar',
          city: 'Hayathnagar',
          area: 'Hyderabad',
          pincode: '501505',
        }),
        serviceRadius: 5,
        fssaiNumber: 'FSSAI123456789',
        isVerified: true,
        verifiedAt: new Date(),
        bio: 'Authentic home-cooked Andhra and Telangana cuisine made with love.',
        cuisineTypes: JSON.stringify(['Andhra', 'Telangana', 'South Indian']),
        status: 'ACTIVE',
        onboardedAt: new Date(),
        commissionRate: 10,
        isAcceptingOrders: true,
        minOrderAmount: 199,
        tenantId: tenant.id,
      },
    }),
    prisma.chef.upsert({
      where: { slug: 'ranjitha-homefood' },
      update: {},
      create: {
        name: 'Ranjitha',
        businessName: "Ranjitha's Home Food",
        slug: 'ranjitha-homefood',
        phone: '+919876500001',
        email: 'ranjitha@gharse.app',
        address: JSON.stringify({
          street: 'Dilsukhnagar',
          city: 'Hyderabad',
          area: 'Telangana',
          pincode: '500060',
        }),
        serviceRadius: 4,
        fssaiNumber: 'FSSAI987654321',
        isVerified: true,
        verifiedAt: new Date(),
        bio: 'Traditional North Indian recipes passed down through generations.',
        cuisineTypes: JSON.stringify(['North Indian', 'Punjabi', 'Mughlai']),
        status: 'ACTIVE',
        onboardedAt: new Date(),
        commissionRate: 10,
        isAcceptingOrders: true,
        minOrderAmount: 249,
        tenantId: tenant.id,
      },
    }),
    prisma.chef.upsert({
      where: { slug: 'priya-tiffins' },
      update: {},
      create: {
        name: 'Priya',
        businessName: "Priya's Tiffins",
        slug: 'priya-tiffins',
        phone: '+919876500002',
        email: 'priya@gharse.app',
        address: JSON.stringify({
          street: 'Kukatpally',
          city: 'Hyderabad',
          area: 'Telangana',
          pincode: '500072',
        }),
        serviceRadius: 6,
        fssaiNumber: 'FSSAI456789123',
        isVerified: true,
        verifiedAt: new Date(),
        bio: 'Fresh breakfast tiffins and South Indian delicacies.',
        cuisineTypes: JSON.stringify(['South Indian', 'Breakfast', 'Tiffins']),
        status: 'ACTIVE',
        onboardedAt: new Date(),
        commissionRate: 10,
        isAcceptingOrders: true,
        minOrderAmount: 149,
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log(`   ✅ Created ${chefs.length} chefs\n`);

  // 4. Create sample customers
  console.log('👥 Creating sample customers...');
  const passwordHash = await bcrypt.hash('Test@123', 12);
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'test@customer.com' },
      update: {},
      create: {
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '+919999000001',
        passwordHash,
        emailVerified: true,
        phoneVerified: true,
        referralCode: 'TEST-FOOD',
        totalOrders: 5,
        totalSpent: 2500,
        loyaltyPoints: 250,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    }),
    prisma.customer.upsert({
      where: { email: 'demo@gharse.app' },
      update: {},
      create: {
        name: 'Demo User',
        email: 'demo@gharse.app',
        phone: '+919999000002',
        passwordHash,
        emailVerified: true,
        phoneVerified: true,
        referralCode: 'DEMO-FEAST',
        totalOrders: 12,
        totalSpent: 6800,
        loyaltyPoints: 680,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    }),
  ]);
  console.log(`   ✅ Created ${customers.length} customers\n`);

  // 5. Create sample admin
  console.log('👤 Creating sample admin...');
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@gharse.app' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@gharse.app',
      phone: '+919999000000',
      passwordHash: adminPasswordHash,
      role: 'OWNER',
      isActive: true,
      emailVerified: true,
      tenantId: tenant.id,
    },
  });
  console.log(`   ✅ Created admin: ${admin.email}\n`);

  // 6. Create sample menu items
  console.log('🍽️ Creating sample menu items...');
  const menuItems = await Promise.all([
    prisma.menuItem.upsert({
      where: { id: 'menu-item-biryani' },
      update: {},
      create: {
        id: 'menu-item-biryani',
        name: 'Hyderabadi Chicken Biryani',
        description: 'Aromatic basmati rice layered with tender chicken, saffron, and authentic spices.',
        price: 299,
        originalPrice: 349,
        category: 'Biryani',
        image: '/images/biryani.jpg',
        isVegetarian: false,
        spicyLevel: 2,
        preparationTime: 45,
        isAvailable: true,
        isPopular: true,
        calories: 650,
        servingSize: '1 plate',
        chefId: chefs[0].id,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-item-paneer' },
      update: {},
      create: {
        id: 'menu-item-paneer',
        name: 'Paneer Butter Masala',
        description: 'Creamy tomato-based curry with soft paneer cubes.',
        price: 199,
        category: 'Main Course',
        image: '/images/paneer.jpg',
        isVegetarian: true,
        spicyLevel: 1,
        preparationTime: 30,
        isAvailable: true,
        isPopular: true,
        calories: 450,
        servingSize: '1 bowl',
        chefId: chefs[1].id,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-item-dosa' },
      update: {},
      create: {
        id: 'menu-item-dosa',
        name: 'Masala Dosa',
        description: 'Crispy rice crepe filled with spiced potato filling, served with chutneys.',
        price: 99,
        category: 'Breakfast',
        image: '/images/dosa.jpg',
        isVegetarian: true,
        isVegan: true,
        spicyLevel: 1,
        preparationTime: 15,
        isAvailable: true,
        isPopular: true,
        calories: 350,
        servingSize: '2 dosas',
        chefId: chefs[2].id,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-item-dal' },
      update: {},
      create: {
        id: 'menu-item-dal',
        name: 'Dal Makhani',
        description: 'Slow-cooked black lentils in creamy tomato gravy.',
        price: 149,
        category: 'Main Course',
        image: '/images/dal.jpg',
        isVegetarian: true,
        spicyLevel: 1,
        preparationTime: 25,
        isAvailable: true,
        isPopular: false,
        calories: 380,
        servingSize: '1 bowl',
        chefId: chefs[0].id,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-item-idli' },
      update: {},
      create: {
        id: 'menu-item-idli',
        name: 'Idli Sambar',
        description: 'Soft steamed rice cakes served with sambar and coconut chutney.',
        price: 79,
        category: 'Breakfast',
        image: '/images/idli.jpg',
        isVegetarian: true,
        isVegan: true,
        spicyLevel: 0,
        preparationTime: 10,
        isAvailable: true,
        isPopular: true,
        calories: 250,
        servingSize: '4 idlis',
        chefId: chefs[2].id,
      },
    }),
  ]);
  console.log(`   ✅ Created ${menuItems.length} menu items\n`);

  // 7. Create sample coupons
  console.log('🎟️ Creating sample coupons...');
  const coupons = await Promise.all([
    prisma.coupon.upsert({
      where: { code: 'WELCOME20' },
      update: {},
      create: {
        code: 'WELCOME20',
        type: 'MERCHANT',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountCap: 100,
        minOrderAmount: 299,
        maxUsageTotal: 1000,
        maxUsagePerUser: 1,
        firstOrderOnly: true,
        title: 'Welcome Offer',
        description: 'Get 20% off on your first order!',
        isActive: true,
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'FLAT50' },
      update: {},
      create: {
        code: 'FLAT50',
        type: 'MERCHANT',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50,
        minOrderAmount: 399,
        maxUsageTotal: 500,
        maxUsagePerUser: 3,
        title: 'Flat ₹50 Off',
        description: 'Get ₹50 off on orders above ₹399',
        isActive: true,
      },
    }),
  ]);
  console.log(`   ✅ Created ${coupons.length} coupons\n`);

  console.log('✅ Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Delivery Partners: ${deliveryPartners.length}`);
  console.log(`   - Tenants: 1`);
  console.log(`   - Chefs: ${chefs.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Admins: 1`);
  console.log(`   - Menu Items: ${menuItems.length}`);
  console.log(`   - Coupons: ${coupons.length}`);
  console.log('\n🎉 Ready for testing and demos!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

