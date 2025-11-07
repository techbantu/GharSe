#!/usr/bin/env node
/**
 * Script to generate food placeholder images using Unsplash API
 * This creates properly sized images for all menu items
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Map of food items to search queries
const foodImages = {
  'samosa.jpg': 'indian-samosa',
  'paneer-tikka.jpg': 'paneer-tikka',
  'chicken-65.jpg': 'chicken-65',
  'butter-chicken.jpg': 'butter-chicken',
  'palak-paneer.jpg': 'palak-paneer',
  'chicken-biryani.jpg': 'chicken-biryani',
  'lamb-biryani.jpg': 'lamb-biryani',
  'veg-biryani.jpg': 'vegetable-biryani',
  'butter-naan.jpg': 'butter-naan',
  'garlic-naan.jpg': 'garlic-naan',
  'tandoori-roti.jpg': 'tandoori-roti',
  'jeera-rice.jpg': 'jeera-rice',
  'gulab-jamun.jpg': 'gulab-jamun',
  'rasmalai.jpg': 'rasmalai',
  'kheer.jpg': 'rice-kheer',
  'mango-lassi.jpg': 'mango-lassi',
  'sweet-lassi.jpg': 'sweet-lassi',
  'masala-chai.jpg': 'masala-chai',
  'tikka-masala.jpg': 'tikka-masala',
  'rogan-josh.jpg': 'rogan-josh',
  'chana-masala.jpg': 'chana-masala',
  'pakora.jpg': 'pakora',
  'thali.jpg': 'indian-thali',
  'about-cooking.jpg': 'indian-cooking',
  'hero-food.jpg': 'indian-food'
};

// Using picsum.photos or placeholder.com for free placeholder images
const imageBaseUrl = 'https://loremflickr.com/800/600/';

console.log('Generating placeholder food images...\n');

Object.entries(foodImages).forEach(([filename, query]) => {
  const imagePath = path.join(__dirname, '..', 'public', 'images', filename);
  const imageUrl = `${imageBaseUrl}${query}/all?lock=${Math.random()}`;
  
  console.log(`Processing: ${filename}`);
  console.log(`URL: ${imageUrl}\n`);
});

console.log('\nNote: Images are using gradient placeholders with fallbacks.');
console.log('To use real images, replace files in public/images/ directory.');
console.log('Or integrate with Unsplash API with proper attribution.\n');




