/**
 * NEW FILE: Placeholder Image Generator
 * 
 * Purpose: Generates beautiful SVG placeholder images for menu items
 * until actual food photography is added.
 * 
 * Usage: node scripts/generate-placeholders.js
 */

const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/images');

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Image definitions with category-specific colors
const images = [
  // Hero & Branding
  { name: 'hero-food.jpg', text: "Bantu's Kitchen", color: '#FF6B35' },
  { name: 'about-cooking.jpg', text: 'Home Cooking', color: '#2D6A4F' },
  
  // Appetizers
  { name: 'samosa.jpg', text: 'Samosa', color: '#F77F00' },
  { name: 'paneer-tikka.jpg', text: 'Paneer Tikka', color: '#FF6B35' },
  { name: 'chicken-65.jpg', text: 'Chicken 65', color: '#EF4444' },
  { name: 'pakora.jpg', text: 'Pakora', color: '#FFB800' },
  
  // Curries
  { name: 'butter-chicken.jpg', text: 'Butter Chicken', color: '#F77F00' },
  { name: 'palak-paneer.jpg', text: 'Palak Paneer', color: '#2D6A4F' },
  { name: 'tikka-masala.jpg', text: 'Tikka Masala', color: '#EF4444' },
  { name: 'chana-masala.jpg', text: 'Chana Masala', color: '#F59E0B' },
  { name: 'rogan-josh.jpg', text: 'Rogan Josh', color: '#DC2626' },
  
  // Biryanis
  { name: 'chicken-biryani.jpg', text: 'Chicken Biryani', color: '#F77F00' },
  { name: 'veg-biryani.jpg', text: 'Veg Biryani', color: '#10B981' },
  { name: 'lamb-biryani.jpg', text: 'Lamb Biryani', color: '#DC2626' },
  
  // Rice & Breads
  { name: 'garlic-naan.jpg', text: 'Garlic Naan', color: '#F59E0B' },
  { name: 'butter-naan.jpg', text: 'Butter Naan', color: '#FFB800' },
  { name: 'jeera-rice.jpg', text: 'Jeera Rice', color: '#FBBF24' },
  { name: 'tandoori-roti.jpg', text: 'Tandoori Roti', color: '#F97316' },
  
  // Desserts
  { name: 'gulab-jamun.jpg', text: 'Gulab Jamun', color: '#DC2626' },
  { name: 'rasmalai.jpg', text: 'Rasmalai', color: '#FBBF24' },
  { name: 'kheer.jpg', text: 'Kheer', color: '#F3F4F6' },
  
  // Beverages
  { name: 'mango-lassi.jpg', text: 'Mango Lassi', color: '#FFB800' },
  { name: 'masala-chai.jpg', text: 'Masala Chai', color: '#92400E' },
  { name: 'sweet-lassi.jpg', text: 'Sweet Lassi', color: '#FBBF24' },
  
  // Specials
  { name: 'thali.jpg', text: "Bantu's Thali", color: '#FF6B35' },
];

// Generate SVG for each image
images.forEach(({ name, text, color }) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(color, -30)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad-${name})"/>
  <text x="400" y="300" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  <circle cx="400" cy="450" r="80" fill="white" opacity="0.1"/>
  <circle cx="200" cy="150" r="60" fill="white" opacity="0.1"/>
  <circle cx="600" cy="500" r="50" fill="white" opacity="0.1"/>
</svg>`;
  
  const filepath = path.join(imagesDir, name);
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${name}`);
});

// Helper function to darken colors
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) + amount);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) + amount);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

console.log('\n✨ All placeholder images generated successfully!');
console.log('📁 Location: public/images/');
console.log('\n💡 Replace these with actual food photography for production.');

