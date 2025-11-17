/**
 * Menu Data - Home-Cooked Indian Food Platform
 * 
 * Purpose: Comprehensive menu catalog showcasing GharSe home-cooked specialties.
 * All items feature authentic regional Indian recipes prepared fresh from home kitchens.
 * 
 * Data Strategy: Structured for easy updates, SEO optimization, and analytics.
 * Operated by Sailaja. Technology by TechBantu IT Solutions LLC.
 */

import { MenuItem, Restaurant } from '@/types';

/**
 * Restaurant Information - Brand Identity and Operating Parameters
 * Legal Compliance: FSSAI Registration 23625028002731
 */
export const restaurantInfo: Restaurant = {
  name: "GharSe",
  legalName: "Bantu'S kitchen",
  proprietor: "Sailaja",
  fssaiNumber: "23625028002731",
  fssaiValidUntil: "2027-06-23",
  fssaiCategory: "Petty Retailer - Prepared Foods",
  tagline: "From Real Homes To Your Hungry Heart",
  description: "GharSe is where real home kitchens become your favorite restaurant. We connect you with trusted home chefs who cook the kind of Indian food they serve their own families—fresh rotis, slow-simmered curries, biryanis, tiffins, snacks, and soulful comfort dishes you rarely find in regular takeout. Every meal is cooked to order in small batches, then packed and delivered from their home to yours.",
  logo: "/logo.png",
  contact: {
    phone: "+91 90104 60964",
    email: "orders@gharse.app",
    whatsapp: "+91 90104 60964",
  },
  address: {
    street: "Plot no 17, Road no 3, Padmalaya Nagar, Hayathnagar",
    city: "Hayathnagar",
    district: "Rangareddy",
    state: "Telangana",
    zipCode: "501505",
    country: "India",
  },
  hours: {
    monday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
    tuesday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
    wednesday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
    thursday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
    friday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
    saturday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
    sunday: { open: "10:00 AM", close: "10:00 PM", isClosed: false },
  },
  socialMedia: {
    instagram: "@gharse",
    facebook: "gharse",
  },
  settings: {
    minimumOrder: 49, // GENIUS FIX: Lowered to allow small orders (desserts, snacks)
    deliveryRadius: 5, // 5 kilometers (approximately 40 minutes delivery time)
    deliveryFee: 49,
    freeDeliveryOver: 499,
    taxRate: 0.05,
    preparationBuffer: 10,
    acceptingOrders: true,
    maxAdvanceOrderDays: 3,
  },
};

/**
 * Menu Items - Complete Catalog
 * 
 * Organization: Categorized by course type for intuitive browsing.
 * Each item includes detailed metadata for dietary needs and preferences.
 */
export const menuItems: MenuItem[] = [
  // APPETIZERS - Traditional Indian Starters
  {
    id: 'app-001',
    name: 'Samosa (2 pieces)',
    description: 'Crispy golden pastries filled with spiced potatoes and peas, served with mint and tamarind chutney',
    price: 49,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 1,
    preparationTime: 15,
    isAvailable: true,
    isPopular: true,
    calories: 262,
    servingSize: '2 pieces',
  },
  {
    id: 'app-002',
    name: 'Paneer Tikka',
    description: 'Marinated cottage cheese cubes grilled to perfection with bell peppers and onions',
    price: 189,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 2,
    preparationTime: 20,
    isAvailable: true,
    isPopular: true,
    calories: 320,
    servingSize: '8 pieces',
  },
  {
    id: 'app-003',
    name: 'Chicken 65',
    description: 'Spicy South Indian fried chicken marinated in yogurt, ginger, and aromatic spices',
    price: 229,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&h=600&fit=crop&q=80',
    isVegetarian: false,
    spicyLevel: 3,
    preparationTime: 20,
    isAvailable: true,
    calories: 380,
    servingSize: '10 pieces',
  },
  {
    id: 'app-004',
    name: 'Vegetable Pakora',
    description: 'Mixed vegetable fritters made with gram flour, served with mint chutney',
    price: 79,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 1,
    preparationTime: 15,
    isAvailable: true,
    calories: 210,
    servingSize: '8 pieces',
  },

  // CURRIES - Rich, Flavorful Gravies
  {
    id: 'cur-001',
    name: 'Butter Chicken',
    description: 'Tender chicken in a rich, creamy tomato-based gravy with aromatic spices and butter',
    price: 299,
    originalPrice: 349,
    category: 'Curries',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=600&fit=crop&q=80',
    isVegetarian: false,
    spicyLevel: 1,
    preparationTime: 30,
    isAvailable: true,
    isPopular: true,
    isNew: false,
    calories: 490,
    servingSize: '16 oz',
  },
  {
    id: 'cur-002',
    name: 'Palak Paneer',
    description: 'Fresh cottage cheese cubes in creamy spinach gravy with garlic and ginger',
    price: 299,
    category: 'Curries',
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 25,
    isAvailable: true,
    isPopular: true,
    calories: 380,
    servingSize: '16 oz',
  },
  {
    id: 'cur-003',
    name: 'Chicken Tikka Masala',
    description: 'Grilled chicken tikka in a spiced tomato and cream sauce',
    price: 329,
    category: 'Curries',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop&q=80',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 30,
    isAvailable: true,
    calories: 520,
    servingSize: '16 oz',
  },
  {
    id: 'cur-004',
    name: 'Chana Masala',
    description: 'Chickpeas cooked in tangy tomato-onion gravy with aromatic spices',
    price: 249,
    category: 'Curries',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 2,
    preparationTime: 25,
    isAvailable: true,
    calories: 310,
    servingSize: '16 oz',
  },
  {
    id: 'cur-005',
    name: 'Lamb Rogan Josh',
    description: 'Tender lamb slow-cooked in aromatic spices with Kashmiri chilies',
    price: 399,
    originalPrice: 499,
    category: 'Curries',
    image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=800&h=600&fit=crop&q=80',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 40,
    isAvailable: true,
    calories: 580,
    servingSize: '16 oz',
  },

  // BIRYANIS - Aromatic Rice Dishes
  {
    id: 'bir-001',
    name: 'Hyderabadi Chicken Biryani',
    description: 'Fragrant basmati rice layered with spiced chicken, saffron, and fried onions',
    price: 379,
    category: 'Biryanis',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop&q=80',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 35,
    isAvailable: true,
    isPopular: true,
    calories: 650,
    servingSize: '24 oz',
  },
  {
    id: 'bir-002',
    name: 'Vegetable Biryani',
    description: 'Aromatic basmati rice with mixed vegetables, paneer, and fragrant spices',
    price: 299,
    category: 'Biryanis',
    image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 30,
    isAvailable: true,
    calories: 520,
    servingSize: '24 oz',
  },
  {
    id: 'bir-003',
    name: 'Lamb Biryani',
    description: 'Premium basmati rice with tender lamb pieces, whole spices, and saffron',
    price: 449,
    category: 'Biryanis',
    image: 'https://images.unsplash.com/photo-1633945274417-76be2e575d26?w=800&h=600&fit=crop&q=80',
    isVegetarian: false,
    spicyLevel: 2,
    preparationTime: 40,
    isAvailable: true,
    calories: 720,
    servingSize: '24 oz',
  },

  // RICE & BREADS
  {
    id: 'ric-001',
    name: 'Garlic Naan',
    description: 'Fresh-baked flatbread topped with garlic and cilantro',
    price: 49,
    category: 'Rice & Breads',
    image: 'https://images.unsplash.com/photo-1601050690117-94f5f5e99248?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 10,
    isAvailable: true,
    isPopular: true,
    calories: 260,
    servingSize: '1 piece',
  },
  {
    id: 'ric-002',
    name: 'Butter Naan',
    description: 'Soft, pillowy flatbread brushed with melted butter',
    price: 39,
    category: 'Rice & Breads',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 10,
    isAvailable: true,
    calories: 240,
    servingSize: '1 piece',
  },
  {
    id: 'ric-003',
    name: 'Jeera Rice',
    description: 'Fragrant basmati rice tempered with cumin seeds',
    price: 99,
    category: 'Rice & Breads',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 0,
    preparationTime: 15,
    isAvailable: true,
    calories: 310,
    servingSize: '12 oz',
  },
  {
    id: 'ric-004',
    name: 'Tandoori Roti',
    description: 'Whole wheat flatbread baked in tandoor',
    price: 29,
    category: 'Rice & Breads',
    image: 'https://images.unsplash.com/photo-1619888408286-f2d7d2db9a9b?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    spicyLevel: 0,
    preparationTime: 10,
    isAvailable: true,
    calories: 180,
    servingSize: '1 piece',
  },

  // DESSERTS - Traditional Sweets
  {
    id: 'des-001',
    name: 'Gulab Jamun (3 pieces)',
    description: 'Deep-fried milk dumplings soaked in fragrant rose-cardamom syrup',
    price: 89,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1620895187214-0e4db98f6b6e?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    isPopular: true,
    calories: 340,
    servingSize: '3 pieces',
  },
  {
    id: 'des-002',
    name: 'Rasmalai (2 pieces)',
    description: 'Soft cottage cheese patties in sweetened, thickened milk with cardamom',
    price: 119,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    calories: 290,
    servingSize: '2 pieces',
  },
  {
    id: 'des-003',
    name: 'Kheer',
    description: 'Traditional rice pudding with cardamom, saffron, and nuts',
    price: 79,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    calories: 270,
    servingSize: '8 oz',
  },

  // BEVERAGES
  {
    id: 'bev-001',
    name: 'Mango Lassi',
    description: 'Refreshing yogurt drink blended with ripe mangoes',
    price: 89,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    isPopular: true,
    calories: 220,
    servingSize: '16 oz',
  },
  {
    id: 'bev-002',
    name: 'Masala Chai',
    description: 'Traditional Indian tea with aromatic spices and milk',
    price: 49,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    calories: 120,
    servingSize: '12 oz',
  },
  {
    id: 'bev-003',
    name: 'Sweet Lassi',
    description: 'Chilled yogurt drink with a touch of sweetness and cardamom',
    price: 69,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 0,
    preparationTime: 5,
    isAvailable: true,
    calories: 180,
    servingSize: '16 oz',
  },

  // SPECIALS - Daily Features
  {
    id: 'spc-001',
    name: "Bantu's Special Thali",
    description: 'Complete meal with 2 curries, dal, rice, 2 naans, raita, salad, and dessert',
    price: 399,
    originalPrice: 499,
    category: 'Specials',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop&q=80',
    isVegetarian: true,
    spicyLevel: 1,
    preparationTime: 35,
    isAvailable: true,
    isPopular: true,
    isNew: true,
    calories: 980,
    servingSize: 'Complete meal',
  },
];

/**
 * Helper Functions - Data Access and Filtering
 */

export const getMenuItemById = (id: string): MenuItem | undefined => {
  return menuItems.find(item => item.id === id);
};

export const getMenuItemsByCategory = (category: string): MenuItem[] => {
  return menuItems.filter(item => item.category === category);
};

export const getPopularItems = (): MenuItem[] => {
  return menuItems.filter(item => item.isPopular && item.isAvailable);
};

export const getNewItems = (): MenuItem[] => {
  return menuItems.filter(item => item.isNew && item.isAvailable);
};

export const getVegetarianItems = (): MenuItem[] => {
  return menuItems.filter(item => item.isVegetarian && item.isAvailable);
};

export const getAvailableCategories = (): string[] => {
  const categories = new Set(menuItems.map(item => item.category));
  return Array.from(categories);
};

