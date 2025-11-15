/**
 * ItemHighlight Component - Beautiful Dish Name Highlighting
 * 
 * Purpose: Highlights menu item names within AI chat messages
 * with beautiful colors, bold text, and wavy underlines
 * 
 * Features:
 * - Category-based color coding
 * - Bold, prominent text
 * - Wavy underline decoration
 * - Inline display (doesn't break flow)
 */

'use client';

import React from 'react';

interface ItemHighlightProps {
  name: string;
  category?: string;
  price?: number;
}

// Color mapping based on food categories
const getCategoryColor = (category?: string): string => {
  if (!category) return '#ea580c'; // Orange default
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('appetizer') || categoryLower.includes('starter')) {
    return '#f59e0b'; // Amber
  }
  if (categoryLower.includes('main') || categoryLower.includes('curry')) {
    return '#ea580c'; // Orange
  }
  if (categoryLower.includes('bread') || categoryLower.includes('naan') || categoryLower.includes('roti')) {
    return '#eab308'; // Yellow
  }
  if (categoryLower.includes('rice') || categoryLower.includes('biryani')) {
    return '#84cc16'; // Lime
  }
  if (categoryLower.includes('dessert') || categoryLower.includes('sweet')) {
    return '#ec4899'; // Pink
  }
  if (categoryLower.includes('beverage') || categoryLower.includes('drink')) {
    return '#3b82f6'; // Blue
  }
  if (categoryLower.includes('side')) {
    return '#10b981'; // Green
  }
  
  return '#ea580c'; // Orange default
};

export function ItemHighlight({ name, category, price }: ItemHighlightProps) {
  const color = getCategoryColor(category);
  
  return (
    <strong
      style={{
        color,
        fontWeight: 700,
        textDecoration: 'underline',
        textDecorationStyle: 'wavy',
        textDecorationColor: `${color}40`, // 25% opacity
        textUnderlineOffset: '3px',
        textDecorationThickness: '1.5px',
        display: 'inline',
        letterSpacing: '0.3px',
      }}
    >
      {name}
    </strong>
  );
}

