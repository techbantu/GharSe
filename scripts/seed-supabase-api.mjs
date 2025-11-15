#!/usr/bin/env node

/**
 * SEED SUPABASE VIA REST API
 * 
 * Uses Supabase REST API to populate database
 * Zero Prisma required - works directly with Supabase
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ================================================
// SUPABASE CONFIGURATION
// ================================================
const SUPABASE_URL = 'https://jkacjjusycmjwtcedeqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWNqanVzeWNtand0Y2VkZXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTk2OTEsImV4cCI6MjA3Nzg3NTY5MX0.b9_hgyRzKW0zUpdkFWQyAxxOCkd-WISo_iqxXW65vmM';

console.log('\n🌱 SEEDING SUPABASE DATABASE\n');
console.log('═'.repeat(70));

// Helper: Supabase REST API call
async function supabaseInsert(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert into ${table}: ${error}`);
  }

  return await response.json();
}

// ================================================
// MENU ITEMS DATA (22 Items)
// ================================================
const menuItems = [
  {
    id: 'samosa',
    name: 'Samosa',
    description: 'Crispy triangular pastries filled with spiced potatoes and peas',
    price: 99,
    category: 'Starters',
    image: '/menu/samosa.jpg',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 20,
    isAvailable: true,
    isPopular: true,
    calories: 150,
    servingSize: '2 pieces',
    ingredients: ['Potatoes', 'Peas', 'Spices', 'Pastry'],
    allergens: ['Gluten']
  },
  {
    id: 'paneer-tikka',
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese cubes marinated in aromatic spices',
    price: 189,
    category: 'Starters',
    image: '/menu/paneer-tikka.jpg',
    isVegetarian: true,
    spicyLevel: 2,
    preparationTime: 25,
    isAvailable: true,
    isPopular: true,
    calories: 280,
    servingSize: '8 pieces',
    ingredients: ['Paneer', 'Yogurt', 'Spices', 'Bell Peppers'],
    allergens: ['Dairy']
  },
  {
    id: 'chicken-65',
    name: 'Chicken 65',
    description: 'Spicy, deep-fried chicken marinated in South Indian spices',
    price: 229,
    category: 'Starters',
    image: '/menu/chicken-65.jpg',
    isVegetarian: false,
    spicyLevel: 3,
    preparationTime: 25,
    isAvailable: true,
    isPopular: true,
    calories: 350,
    servingSize: '250g',
    ingredients: ['Chicken', 'Chili', 'Curry Leaves', 'Spices'],
    allergens: ['Gluten']
  },
  {
    id: 'butter-chicken',
    name: 'Butter Chicken',
    description: 'Tender chicken in creamy tomato-based curry',
    price: 299,
    originalPrice: 349,
    category: 'Main Course',
    image: '/menu/butter-chicken.jpg',
    isVegetarian: false,
    spicyLevel: 1,
    preparationTime: 35,
    isAvailable: true,
    isPopular: true,
    calories: 450,
    servingSize: '400g',
    ingredients: ['Chicken', 'Tomato', 'Cream', 'Butter', 'Spices'],
    allergens: ['Dairy']
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice layered with spiced chicken',
    price: 299,
    originalPrice: 349,
    category: 'Main Course',
    image: '/menu/chicken-biryani.jpg',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 45,
    isAvailable: true,
    isPopular: true,
    calories: 550,
    servingSize: '500g',
    ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Spices'],
    allergens: []
  },
  {
    id: 'palak-paneer',
    name: 'Palak Paneer',
    description: 'Cottage cheese cubes in creamy spinach gravy',
    price: 249,
    category: 'Main Course',
    image: '/menu/palak-paneer.jpg',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 30,
    isAvailable: true,
    isPopular: true,
    calories: 320,
    servingSize: '350g',
    ingredients: ['Spinach', 'Paneer', 'Cream', 'Spices'],
    allergens: ['Dairy']
  },
  {
    id: 'dal-makhani',
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils in butter and cream',
    price: 199,
    category: 'Main Course',
    image: '/menu/dal-makhani.jpg',
    isVegetarian: true,
    isVegan: false,
    spicyLevel: 1,
    preparationTime: 35,
    isAvailable: true,
    isPopular: false,
    calories: 280,
    servingSize: '350g',
    ingredients: ['Black Lentils', 'Kidney Beans', 'Cream', 'Butter'],
    allergens: ['Dairy']
  },
  {
    id: 'rogan-josh',
    name: 'Rogan Josh',
    description: 'Aromatic lamb curry from Kashmir',
    price: 399,
    category: 'Main Course',
    image: '/menu/rogan-josh.jpg',
    isVegetarian: false,
    spicyLevel: 3,
    preparationTime: 50,
    isAvailable: true,
    isPopular: false,
    calories: 480,
    servingSize: '400g',
    ingredients: ['Lamb', 'Yogurt', 'Kashmiri Spices', 'Onions'],
    allergens: ['Dairy']
  },
  {
    id: 'garlic-naan',
    name: 'Garlic Naan',
    description: 'Soft flatbread topped with garlic and butter',
    price: 49,
    category: 'Bread',
    image: '/menu/garlic-naan.jpg',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 15,
    isAvailable: true,
    isPopular: true,
    calories: 200,
    servingSize: '1 piece',
    ingredients: ['Flour', 'Garlic', 'Butter', 'Yeast'],
    allergens: ['Gluten', 'Dairy']
  },
  {
    id: 'tandoori-roti',
    name: 'Tandoori Roti',
    description: 'Whole wheat flatbread baked in tandoor',
    price: 29,
    category: 'Bread',
    image: '/menu/tandoori-roti.jpg',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 0,
    preparationTime: 12,
    isAvailable: true,
    isPopular: false,
    calories: 120,
    servingSize: '1 piece',
    ingredients: ['Whole Wheat Flour', 'Salt', 'Water'],
    allergens: ['Gluten']
  },
  {
    id: 'mango-lassi',
    name: 'Mango Lassi',
    description: 'Sweet yogurt drink with fresh mango',
    price: 89,
    category: 'Beverages',
    image: '/menu/mango-lassi.jpg',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    isPopular: true,
    calories: 180,
    servingSize: '300ml',
    ingredients: ['Mango', 'Yogurt', 'Sugar', 'Cardamom'],
    allergens: ['Dairy']
  },
  {
    id: 'masala-chai',
    name: 'Masala Chai',
    description: 'Spiced Indian tea with milk',
    price: 39,
    category: 'Beverages',
    image: '/menu/masala-chai.jpg',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 10,
    isAvailable: true,
    isPopular: true,
    calories: 80,
    servingSize: '200ml',
    ingredients: ['Tea', 'Milk', 'Ginger', 'Cardamom', 'Sugar'],
    allergens: ['Dairy']
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun',
    description: 'Soft milk dumplings in sweet rose syrup',
    price: 79,
    category: 'Desserts',
    image: '/menu/gulab-jamun.jpg',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 20,
    isAvailable: true,
    isPopular: true,
    calories: 220,
    servingSize: '2 pieces',
    ingredients: ['Milk Powder', 'Flour', 'Sugar Syrup', 'Rose Water'],
    allergens: ['Dairy', 'Gluten']
  },
  {
    id: 'rasgulla',
    name: 'Rasgulla',
    description: 'Spongy cottage cheese balls in sugar syrup',
    price: 69,
    category: 'Desserts',
    image: '/menu/rasgulla.jpg',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 25,
    isAvailable: true,
    isPopular: false,
    calories: 186,
    servingSize: '2 pieces',
    ingredients: ['Cottage Cheese', 'Sugar', 'Cardamom'],
    allergens: ['Dairy']
  },
  {
    id: 'chole-bhature',
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry with fried bread',
    price: 149,
    category: 'Main Course',
    image: '/menu/chole-bhature.jpg',
    isVegetarian: true,
    spicyLevel: 2,
    preparationTime: 35,
    isAvailable: true,
    isPopular: true,
    calories: 450,
    servingSize: '2 bhature + curry',
    ingredients: ['Chickpeas', 'Flour', 'Tomatoes', 'Spices'],
    allergens: ['Gluten']
  },
  {
    id: 'masala-dosa',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe with spiced potato filling',
    price: 119,
    category: 'Main Course',
    image: '/menu/masala-dosa.jpg',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    spicyLevel: 1,
    preparationTime: 25,
    isAvailable: true,
    isPopular: true,
    calories: 280,
    servingSize: '1 dosa',
    ingredients: ['Rice', 'Lentils', 'Potatoes', 'Spices'],
    allergens: []
  },
  {
    id: 'veg-biryani',
    name: 'Vegetable Biryani',
    description: 'Aromatic rice with mixed vegetables and spices',
    price: 229,
    category: 'Main Course',
    image: '/menu/veg-biryani.jpg',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 2,
    preparationTime: 40,
    isAvailable: true,
    isPopular: false,
    calories: 380,
    servingSize: '500g',
    ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Saffron', 'Spices'],
    allergens: []
  },
  {
    id: 'fish-curry',
    name: 'Fish Curry',
    description: 'Fresh fish in tangy coconut curry',
    price: 329,
    category: 'Main Course',
    image: '/menu/fish-curry.jpg',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 35,
    isAvailable: true,
    isPopular: false,
    calories: 320,
    servingSize: '350g',
    ingredients: ['Fish', 'Coconut', 'Tamarind', 'Spices'],
    allergens: ['Fish']
  },
  {
    id: 'aloo-paratha',
    name: 'Aloo Paratha',
    description: 'Wheat flatbread stuffed with spiced potatoes',
    price: 79,
    category: 'Bread',
    image: '/menu/aloo-paratha.jpg',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 20,
    isAvailable: true,
    isPopular: true,
    calories: 240,
    servingSize: '2 pieces',
    ingredients: ['Wheat Flour', 'Potatoes', 'Spices', 'Butter'],
    allergens: ['Gluten', 'Dairy']
  },
  {
    id: 'paneer-butter-masala',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese in rich tomato-cream gravy',
    price: 269,
    category: 'Main Course',
    image: '/menu/paneer-butter-masala.jpg',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 30,
    isAvailable: true,
    isPopular: true,
    calories: 380,
    servingSize: '350g',
    ingredients: ['Paneer', 'Tomato', 'Cream', 'Butter', 'Cashews'],
    allergens: ['Dairy', 'Nuts']
  },
  {
    id: 'kulfi',
    name: 'Kulfi',
    description: 'Traditional Indian ice cream',
    price: 89,
    category: 'Desserts',
    image: '/menu/kulfi.jpg',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    isPopular: false,
    calories: 200,
    servingSize: '1 piece',
    ingredients: ['Milk', 'Sugar', 'Cardamom', 'Pistachios'],
    allergens: ['Dairy', 'Nuts']
  },
  {
    id: 'tandoori-chicken',
    name: 'Tandoori Chicken',
    description: 'Chicken marinated in yogurt and spices, grilled in tandoor',
    price: 319,
    category: 'Main Course',
    image: '/menu/tandoori-chicken.jpg',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 40,
    isAvailable: true,
    isPopular: true,
    calories: 420,
    servingSize: 'Half chicken',
    ingredients: ['Chicken', 'Yogurt', 'Tandoori Spices', 'Lemon'],
    allergens: ['Dairy']
  }
];

// ================================================
// ADMIN USER
// ================================================
const admin = {
  id: 'admin-1',
  email: 'admin@bantuskitchen.com',
  name: 'Kitchen Admin',
  passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', // ChangeThisPassword123!
  role: 'ADMIN',
  isActive: true
};

// ================================================
// MAIN SEED FUNCTION
// ================================================
async function seedDatabase() {
  try {
    // Seed Menu Items
    console.log('\n📋 Seeding Menu Items...');
    for (const item of menuItems) {
      try {
        await supabaseInsert('MenuItem', item);
        console.log(`   ✅ ${item.name}`);
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`   ⏭️  ${item.name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    // Seed Admin
    console.log('\n👤 Creating Admin User...');
    try {
      await supabaseInsert('Admin', admin);
      console.log('   ✅ Admin user created');
      console.log('   📧 Email: admin@bantuskitchen.com');
      console.log('   🔑 Password: ChangeThisPassword123!');
    } catch (error) {
      if (error.message.includes('duplicate')) {
        console.log('   ⏭️  Admin already exists');
      } else {
        throw error;
      }
    }

    // Success!
    console.log('\n' + '═'.repeat(70));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log('\n📊 What was seeded:');
    console.log('   ✅ 22 Menu Items (all categories)');
    console.log('   ✅ 1 Admin User');
    console.log('\n🎯 Now you can:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Place orders → They save to Supabase');
    console.log('   3. Login to admin dashboard');
    console.log('   4. Track orders in real-time');
    console.log('');

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run it!
seedDatabase();

