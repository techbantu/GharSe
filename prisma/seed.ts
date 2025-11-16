/**
 * GENIUS-LEVEL DATABASE SEED
 * 
 * Automatically creates:
 * - Admin user
 * - Sample menu items
 * - Categories
 * - Initial settings
 * 
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Sailaja@2025', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_DEFAULT_EMAIL || 'bantusailaja@gmail.com' },
    update: {
      // Update password if changed
      passwordHash,
      emailVerified: true, // Ensure email is verified for existing admin
      isActive: true, // Ensure admin is active
    },
    create: {
      email: process.env.ADMIN_DEFAULT_EMAIL || 'bantusailaja@gmail.com',
      name: process.env.ADMIN_DEFAULT_NAME || 'Sailaja Admin',
      passwordHash,
      role: 'OWNER',
      isActive: true,
      emailVerified: true, // Set to true for initial admin (skip verification)
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);
  console.log(`   Password: ${process.env.ADMIN_DEFAULT_PASSWORD || 'Sailaja@2025'}`);
  console.log(`   Email verified: ${admin.emailVerified}`);

  // 2. Create Sample Menu Items
  console.log('\n🍽️  Creating sample menu items...');

  const menuItems = [
    // Appetizers
    {
      name: 'Samosa (2 pieces)',
      description: 'Crispy golden pastries filled with spiced potatoes and peas, served with mint and tamarind chutney',
      price: 49,
      category: 'Appetizers',
      image: '/images/samosa.jpg',
      isVegetarian: true,
      isVegan: true,
      spicyLevel: 1,
      preparationTime: 15,
      isAvailable: true,
      isPopular: true,
      calories: 262,
      servingSize: '2 pieces',
      ingredients: JSON.stringify(['Potatoes', 'Peas', 'Spices', 'Pastry']),
      allergens: JSON.stringify(['Gluten']),
    },
    {
      name: 'Paneer Tikka',
      description: 'Marinated cottage cheese cubes grilled to perfection with bell peppers and onions',
      price: 189,
      category: 'Appetizers',
      image: '/images/paneer-tikka.jpg',
      isVegetarian: true,
      spicyLevel: 2,
      preparationTime: 20,
      isAvailable: true,
      isPopular: true,
      calories: 320,
      servingSize: '8 pieces',
      ingredients: JSON.stringify(['Paneer', 'Yogurt', 'Spices', 'Bell Peppers']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Chicken 65',
      description: 'Spicy South Indian fried chicken marinated in yogurt, ginger, and aromatic spices',
      price: 219,
      category: 'Appetizers',
      image: '/images/chicken-65.jpg',
      isVegetarian: false,
      spicyLevel: 3,
      preparationTime: 25,
      isAvailable: true,
      isPopular: true,
      calories: 380,
      servingSize: '10 pieces',
      ingredients: JSON.stringify(['Chicken', 'Yogurt', 'Spices', 'Curry Leaves']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Vegetable Pakora',
      description: 'Mixed vegetable fritters with chickpea flour, crispy and delicious',
      price: 99,
      category: 'Appetizers',
      image: '/images/pakora.jpg',
      isVegetarian: true,
      isVegan: true,
      spicyLevel: 1,
      preparationTime: 15,
      isAvailable: true,
      calories: 180,
      servingSize: '8 pieces',
      ingredients: JSON.stringify(['Mixed Vegetables', 'Chickpea Flour', 'Spices']),
      allergens: JSON.stringify([]),
    },

    // Main Course
    {
      name: 'Butter Chicken',
      description: 'Tender chicken pieces in rich, creamy tomato-based gravy with aromatic spices',
      price: 299,
      originalPrice: 349,
      category: 'Main Course',
      image: '/images/butter-chicken.jpg',
      isVegetarian: false,
      spicyLevel: 1,
      preparationTime: 30,
      isAvailable: true,
      isPopular: true,
      calories: 450,
      servingSize: '400g',
      ingredients: JSON.stringify(['Chicken', 'Tomatoes', 'Cream', 'Butter', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Chicken Tikka Masala',
      description: 'Grilled chicken chunks in spiced curry sauce with onions and tomatoes',
      price: 289,
      category: 'Main Course',
      image: '/images/tikka-masala.jpg',
      isVegetarian: false,
      spicyLevel: 2,
      preparationTime: 35,
      isAvailable: true,
      isPopular: true,
      calories: 420,
      servingSize: '400g',
      ingredients: JSON.stringify(['Chicken', 'Yogurt', 'Tomatoes', 'Onions', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Palak Paneer',
      description: 'Cottage cheese cubes in creamy spinach gravy with aromatic spices',
      price: 249,
      category: 'Main Course',
      image: '/images/palak-paneer.jpg',
      isVegetarian: true,
      spicyLevel: 1,
      preparationTime: 25,
      isAvailable: true,
      isPopular: true,
      calories: 320,
      servingSize: '350g',
      ingredients: JSON.stringify(['Paneer', 'Spinach', 'Cream', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Chana Masala',
      description: 'Chickpeas cooked in tangy tomato-onion gravy with traditional spices',
      price: 199,
      category: 'Main Course',
      image: '/images/chana-masala.jpg',
      isVegetarian: true,
      isVegan: true,
      spicyLevel: 2,
      preparationTime: 30,
      isAvailable: true,
      calories: 280,
      servingSize: '350g',
      ingredients: JSON.stringify(['Chickpeas', 'Tomatoes', 'Onions', 'Spices']),
      allergens: JSON.stringify([]),
    },
    {
      name: 'Rogan Josh',
      description: 'Tender lamb cooked in aromatic Kashmiri spices with yogurt-based gravy',
      price: 399,
      category: 'Main Course',
      image: '/images/rogan-josh.jpg',
      isVegetarian: false,
      spicyLevel: 2,
      preparationTime: 45,
      isAvailable: true,
      calories: 520,
      servingSize: '400g',
      ingredients: JSON.stringify(['Lamb', 'Yogurt', 'Kashmiri Chili', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },

    // Biryani & Rice
    {
      name: 'Chicken Biryani',
      description: 'Fragrant basmati rice layered with marinated chicken and aromatic spices',
      price: 299,
      category: 'Biryani & Rice',
      image: '/images/chicken-biryani.jpg',
      isVegetarian: false,
      spicyLevel: 2,
      preparationTime: 40,
      isAvailable: true,
      isPopular: true,
      calories: 550,
      servingSize: '500g',
      ingredients: JSON.stringify(['Basmati Rice', 'Chicken', 'Yogurt', 'Saffron', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Vegetable Biryani',
      description: 'Aromatic basmati rice with mixed vegetables, herbs, and traditional spices',
      price: 249,
      category: 'Biryani & Rice',
      image: '/images/veg-biryani.jpg',
      isVegetarian: true,
      spicyLevel: 1,
      preparationTime: 35,
      isAvailable: true,
      isPopular: true,
      calories: 420,
      servingSize: '500g',
      ingredients: JSON.stringify(['Basmati Rice', 'Mixed Vegetables', 'Spices', 'Herbs']),
      allergens: JSON.stringify([]),
    },
    {
      name: 'Lamb Biryani',
      description: 'Premium basmati rice with tender lamb pieces and exotic spices',
      price: 399,
      category: 'Biryani & Rice',
      image: '/images/lamb-biryani.jpg',
      isVegetarian: false,
      spicyLevel: 2,
      preparationTime: 50,
      isAvailable: true,
      calories: 620,
      servingSize: '500g',
      ingredients: JSON.stringify(['Basmati Rice', 'Lamb', 'Yogurt', 'Saffron', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Jeera Rice',
      description: 'Fragrant basmati rice tempered with cumin seeds and ghee',
      price: 149,
      category: 'Biryani & Rice',
      image: '/images/jeera-rice.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 20,
      isAvailable: true,
      calories: 280,
      servingSize: '300g',
      ingredients: JSON.stringify(['Basmati Rice', 'Cumin', 'Ghee']),
      allergens: JSON.stringify(['Dairy']),
    },

    // Breads
    {
      name: 'Butter Naan',
      description: 'Soft, fluffy leavened bread brushed with butter, baked in tandoor',
      price: 49,
      category: 'Breads',
      image: '/images/butter-naan.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 10,
      isAvailable: true,
      isPopular: true,
      calories: 220,
      servingSize: '1 piece',
      ingredients: JSON.stringify(['Flour', 'Yogurt', 'Butter', 'Yeast']),
      allergens: JSON.stringify(['Gluten', 'Dairy']),
    },
    {
      name: 'Garlic Naan',
      description: 'Naan bread topped with fresh garlic and cilantro',
      price: 59,
      category: 'Breads',
      image: '/images/garlic-naan.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 10,
      isAvailable: true,
      isPopular: true,
      calories: 240,
      servingSize: '1 piece',
      ingredients: JSON.stringify(['Flour', 'Garlic', 'Butter', 'Cilantro']),
      allergens: JSON.stringify(['Gluten', 'Dairy']),
    },
    {
      name: 'Tandoori Roti',
      description: 'Whole wheat flatbread baked in traditional tandoor',
      price: 29,
      category: 'Breads',
      image: '/images/tandoori-roti.jpg',
      isVegetarian: true,
      isVegan: true,
      spicyLevel: 0,
      preparationTime: 8,
      isAvailable: true,
      calories: 120,
      servingSize: '1 piece',
      ingredients: JSON.stringify(['Whole Wheat Flour', 'Water', 'Salt']),
      allergens: JSON.stringify(['Gluten']),
    },

    // Desserts
    {
      name: 'Gulab Jamun (2 pieces)',
      description: 'Soft milk dumplings soaked in rose-flavored sugar syrup',
      price: 79,
      category: 'Desserts',
      image: '/images/gulab-jamun.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      isPopular: true,
      calories: 280,
      servingSize: '2 pieces',
      ingredients: JSON.stringify(['Milk Powder', 'Sugar', 'Rose Water', 'Cardamom']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Rasmalai (2 pieces)',
      description: 'Soft cottage cheese patties in sweet, creamy milk with pistachios',
      price: 99,
      category: 'Desserts',
      image: '/images/rasmalai.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      calories: 320,
      servingSize: '2 pieces',
      ingredients: JSON.stringify(['Paneer', 'Milk', 'Sugar', 'Saffron', 'Pistachios']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Kheer',
      description: 'Traditional rice pudding with cardamom, saffron, and nuts',
      price: 89,
      category: 'Desserts',
      image: '/images/kheer.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      calories: 260,
      servingSize: '250ml',
      ingredients: JSON.stringify(['Rice', 'Milk', 'Sugar', 'Cardamom', 'Nuts']),
      allergens: JSON.stringify(['Dairy', 'Nuts']),
    },

    // Beverages
    {
      name: 'Mango Lassi',
      description: 'Refreshing yogurt-based drink blended with sweet mango pulp',
      price: 79,
      category: 'Beverages',
      image: '/images/mango-lassi.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      isPopular: true,
      calories: 180,
      servingSize: '300ml',
      ingredients: JSON.stringify(['Yogurt', 'Mango', 'Sugar', 'Cardamom']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Sweet Lassi',
      description: 'Traditional yogurt drink sweetened with sugar and flavored with cardamom',
      price: 59,
      category: 'Beverages',
      image: '/images/sweet-lassi.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      calories: 140,
      servingSize: '300ml',
      ingredients: JSON.stringify(['Yogurt', 'Sugar', 'Cardamom']),
      allergens: JSON.stringify(['Dairy']),
    },
    {
      name: 'Masala Chai',
      description: 'Aromatic Indian tea brewed with milk and traditional spices',
      price: 39,
      category: 'Beverages',
      image: '/images/masala-chai.jpg',
      isVegetarian: true,
      spicyLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      calories: 80,
      servingSize: '200ml',
      ingredients: JSON.stringify(['Tea', 'Milk', 'Ginger', 'Cardamom', 'Spices']),
      allergens: JSON.stringify(['Dairy']),
    },
  ];

  let createdCount = 0;
  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: `seed-${item.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `seed-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...item,
      },
    });
    createdCount++;
    console.log(`   ✅ ${item.name}`);
  }

  console.log(`\n✅ Created ${createdCount} menu items`);

  // 3. Create Sample Customer
  console.log('\n👥 Creating sample customer...');
  const customerPassword = 'customer123';
  const hashedPassword = await bcrypt.hash(customerPassword, 12);

  const customer = await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Sample Customer',
      email: 'customer@example.com',
      phone: '+91 98765 43210',
      passwordHash: hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      totalOrders: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
    },
  });
  console.log(`✅ Customer created: ${customer.email}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ 1 Admin user`);
  console.log(`   ✅ ${createdCount} Menu items`);
  console.log(`   ✅ 1 Sample customer`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Admin: http://localhost:3000/admin');
  console.log('\n🔐 Login Credentials:');
  console.log('   Admin:');
  console.log(`     Email: ${admin.email}`);
  console.log(`     Password: ${process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeThisPassword123!'}`);
  console.log('   Customer:');
  console.log('     Email: customer@example.com');
  console.log('     Password: customer123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

