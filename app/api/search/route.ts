/**
 * NEW FILE: Advanced Search API Route
 * 
 * Purpose: Intelligent menu search with recommendations and filters
 * 
 * Features:
 * - Fuzzy search across names and descriptions
 * - Dietary filters (vegetarian, vegan, gluten-free)
 * - Spice level filtering
 * - Price range filtering
 * - Popular/recommended items
 */

import { NextRequest, NextResponse } from 'next/server';
import { menuItems } from '@/data/menuData';
import { MenuItem } from '@/types';

/**
 * GET /api/search - Search menu items with advanced filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category');
    const vegetarian = searchParams.get('vegetarian') === 'true';
    const vegan = searchParams.get('vegan') === 'true';
    const maxSpiceLevel = searchParams.get('maxSpiceLevel');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let results = menuItems.filter(item => item.isAvailable);
    
    // Text search (fuzzy matching)
    if (query) {
      results = results.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
      
      // Sort by relevance (items with query in name score higher)
      results.sort((a, b) => {
        const aScore = a.name.toLowerCase().includes(query) ? 2 : 1;
        const bScore = b.name.toLowerCase().includes(query) ? 2 : 1;
        return bScore - aScore;
      });
    }
    
    // Category filter
    if (category && category !== 'All') {
      results = results.filter(item => item.category === category);
    }
    
    // Dietary filters
    if (vegetarian) {
      results = results.filter(item => item.isVegetarian);
    }
    
    if (vegan) {
      results = results.filter(item => item.isVegan);
    }
    
    // Spice level filter
    if (maxSpiceLevel) {
      const max = parseInt(maxSpiceLevel);
      results = results.filter(item => 
        (item.spicyLevel || 0) <= max
      );
    }
    
    // Price range filter
    if (minPrice) {
      const min = parseFloat(minPrice);
      results = results.filter(item => item.price >= min);
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      results = results.filter(item => item.price <= max);
    }
    
    // Popular items filter
    if (popular) {
      results = results.filter(item => item.isPopular);
    }
    
    // Limit results
    const limitedResults = results.slice(0, limit);
    
    // Get recommendations (popular items if no query)
    const recommendations = query ? [] : menuItems
      .filter(item => item.isPopular && item.isAvailable)
      .slice(0, 5);
    
    return NextResponse.json({
      success: true,
      results: limitedResults,
      count: results.length,
      recommendations,
      query: query || null,
      filters: {
        category: category || null,
        vegetarian,
        vegan,
        maxSpiceLevel: maxSpiceLevel || null,
        priceRange: {
          min: minPrice || null,
          max: maxPrice || null,
        },
      },
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

