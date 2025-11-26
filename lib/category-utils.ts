/**
 * CATEGORY UTILITIES - Unified Category Management
 * 
 * Purpose: Normalizes inconsistent category names from database to standard categories.
 * Fixes issues where "Biryani & Rice", "Rice & Biryani", "Biryanis" are treated as different.
 * 
 * Architecture:
 * - Single source of truth for all category names
 * - Normalization map to handle legacy/inconsistent data
 * - Type-safe category definitions
 */

// ============================================================================
// STANDARD CATEGORY DEFINITIONS
// ============================================================================

/**
 * Standard category names used throughout the application.
 * These are the ONLY valid categories that should appear in the UI.
 */
export const STANDARD_CATEGORIES = [
  'Appetizers',
  'Main Course', 
  'Curries',
  'Biryani & Rice', // Standardized name for all rice/biryani items
  'Breads',
  'Tandoori',
  'Desserts',
  'Beverages',
  'Specials',
  'Thali',
] as const;

export type StandardCategory = (typeof STANDARD_CATEGORIES)[number];

// ============================================================================
// CATEGORY NORMALIZATION MAP
// ============================================================================

/**
 * Maps ALL possible category variations to their standard names.
 * Case-insensitive matching is applied during lookup.
 * 
 * This handles:
 * - Typos in admin input
 * - Different naming conventions
 * - Legacy category names from old data
 */
const CATEGORY_NORMALIZATION_MAP: Record<string, StandardCategory> = {
  // Appetizers variations
  'appetizers': 'Appetizers',
  'appetizer': 'Appetizers',
  'starters': 'Appetizers',
  'starter': 'Appetizers',
  'snacks': 'Appetizers',
  'snack': 'Appetizers',
  
  // Main Course variations
  'main course': 'Main Course',
  'maincourse': 'Main Course',
  'mains': 'Main Course',
  'main': 'Main Course',
  'entrees': 'Main Course',
  'entree': 'Main Course',
  
  // Curries variations
  'curries': 'Curries',
  'curry': 'Curries',
  'gravies': 'Curries',
  'gravy': 'Curries',
  
  // Biryani & Rice - THE BIG ONE with many variations
  'biryani & rice': 'Biryani & Rice',
  'biryani and rice': 'Biryani & Rice',
  'rice & biryani': 'Biryani & Rice',
  'rice and biryani': 'Biryani & Rice',
  'biryanis': 'Biryani & Rice',
  'biryani': 'Biryani & Rice',
  'rice & breads': 'Biryani & Rice', // Old category - now merged
  'rice and breads': 'Biryani & Rice',
  'rice': 'Biryani & Rice',
  'pulao': 'Biryani & Rice',
  'pulaos': 'Biryani & Rice',
  'fried rice': 'Biryani & Rice',
  
  // Breads variations
  'breads': 'Breads',
  'bread': 'Breads',
  'roti': 'Breads',
  'rotis': 'Breads',
  'naan': 'Breads',
  'naans': 'Breads',
  'paratha': 'Breads',
  'parathas': 'Breads',
  'indian breads': 'Breads',
  
  // Tandoori variations
  'tandoori': 'Tandoori',
  'tandoor': 'Tandoori',
  'grilled': 'Tandoori',
  'kebabs': 'Tandoori',
  'kebab': 'Tandoori',
  'tikka': 'Tandoori',
  
  // Desserts variations
  'desserts': 'Desserts',
  'dessert': 'Desserts',
  'sweets': 'Desserts',
  'sweet': 'Desserts',
  'mithai': 'Desserts',
  
  // Beverages variations
  'beverages': 'Beverages',
  'beverage': 'Beverages',
  'drinks': 'Beverages',
  'drink': 'Beverages',
  'chai': 'Beverages',
  'lassi': 'Beverages',
  
  // Specials variations
  'specials': 'Specials',
  'special': 'Specials',
  'chef special': 'Specials',
  'chef specials': 'Specials',
  'today special': 'Specials',
  "today's special": 'Specials',
  
  // Thali variations
  'thali': 'Thali',
  'thalis': 'Thali',
  'combo': 'Thali',
  'combos': 'Thali',
  'meal': 'Thali',
  'meals': 'Thali',
};

// ============================================================================
// CATEGORY COLORS
// ============================================================================

/**
 * Beautiful, consistent colors for each category.
 * Used for category buttons and badges.
 */
export const CATEGORY_COLORS: Record<StandardCategory | 'All', { 
  bg: string; 
  bgActive: string;
  hover: string; 
  text: string;
  textActive: string;
  border: string;
}> = {
  'All': { 
    bg: 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
    bgActive: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    hover: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
    text: '#ea580c',
    textActive: '#ffffff',
    border: 'rgba(234, 88, 12, 0.2)',
  },
  'Appetizers': { 
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    bgActive: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    hover: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    text: '#d97706',
    textActive: '#ffffff',
    border: 'rgba(217, 119, 6, 0.2)',
  },
  'Main Course': { 
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    bgActive: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    hover: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    text: '#7c3aed',
    textActive: '#ffffff',
    border: 'rgba(124, 58, 237, 0.2)',
  },
  'Curries': { 
    bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    bgActive: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    hover: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    text: '#dc2626',
    textActive: '#ffffff',
    border: 'rgba(220, 38, 38, 0.2)',
  },
  'Biryani & Rice': { 
    bg: 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
    bgActive: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    hover: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
    text: '#ea580c',
    textActive: '#ffffff',
    border: 'rgba(234, 88, 12, 0.2)',
  },
  'Breads': { 
    bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
    bgActive: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    hover: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)',
    text: '#d97706',
    textActive: '#ffffff',
    border: 'rgba(217, 119, 6, 0.2)',
  },
  'Tandoori': { 
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    bgActive: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    hover: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    text: '#c2410c',
    textActive: '#ffffff',
    border: 'rgba(194, 65, 12, 0.2)',
  },
  'Desserts': { 
    bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    bgActive: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    hover: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    text: '#db2777',
    textActive: '#ffffff',
    border: 'rgba(219, 39, 119, 0.2)',
  },
  'Beverages': { 
    bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
    bgActive: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    hover: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
    text: '#0891b2',
    textActive: '#ffffff',
    border: 'rgba(8, 145, 178, 0.2)',
  },
  'Specials': { 
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    bgActive: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    hover: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    text: '#7c3aed',
    textActive: '#ffffff',
    border: 'rgba(124, 58, 237, 0.2)',
  },
  'Thali': { 
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    bgActive: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    hover: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    text: '#059669',
    textActive: '#ffffff',
    border: 'rgba(5, 150, 105, 0.2)',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes a category string to its standard form.
 * Returns null if the category doesn't match any known pattern.
 * 
 * @param rawCategory - The raw category string from the database
 * @returns The normalized standard category or null if unknown
 * 
 * @example
 * normalizeCategory('Rice & Biryani') // Returns 'Biryani & Rice'
 * normalizeCategory('biryanis') // Returns 'Biryani & Rice'
 * normalizeCategory('unknown xyz') // Returns null
 */
export function normalizeCategory(rawCategory: string | null | undefined): StandardCategory | null {
  if (!rawCategory) return null;
  
  const normalized = rawCategory.toLowerCase().trim();
  
  // Direct lookup in normalization map
  if (normalized in CATEGORY_NORMALIZATION_MAP) {
    return CATEGORY_NORMALIZATION_MAP[normalized];
  }
  
  // Check if it's already a standard category (case-insensitive)
  for (const standard of STANDARD_CATEGORIES) {
    if (standard.toLowerCase() === normalized) {
      return standard;
    }
  }
  
  // Fallback: Check if any standard category is contained in the input
  for (const standard of STANDARD_CATEGORIES) {
    if (normalized.includes(standard.toLowerCase())) {
      return standard;
    }
  }
  
  // Fallback: Check for partial matches
  if (normalized.includes('biryani') || normalized.includes('rice') || normalized.includes('pulao')) {
    return 'Biryani & Rice';
  }
  if (normalized.includes('curry') || normalized.includes('gravy')) {
    return 'Curries';
  }
  if (normalized.includes('bread') || normalized.includes('roti') || normalized.includes('naan')) {
    return 'Breads';
  }
  if (normalized.includes('dessert') || normalized.includes('sweet') || normalized.includes('mithai')) {
    return 'Desserts';
  }
  if (normalized.includes('drink') || normalized.includes('beverage') || normalized.includes('lassi') || normalized.includes('chai')) {
    return 'Beverages';
  }
  if (normalized.includes('starter') || normalized.includes('appetizer') || normalized.includes('snack')) {
    return 'Appetizers';
  }
  if (normalized.includes('tandoor') || normalized.includes('kebab') || normalized.includes('grill')) {
    return 'Tandoori';
  }
  if (normalized.includes('thali') || normalized.includes('combo') || normalized.includes('meal')) {
    return 'Thali';
  }
  if (normalized.includes('special')) {
    return 'Specials';
  }
  
  // If nothing matches, return null (will be treated as 'Main Course' or filtered out)
  console.warn(`[category-utils] Unknown category: "${rawCategory}"`);
  return null;
}

/**
 * Normalizes a category with a fallback to 'Main Course' if unknown.
 * Use this when you need a guaranteed valid category.
 */
export function normalizeCategoryWithFallback(rawCategory: string | null | undefined): StandardCategory {
  return normalizeCategory(rawCategory) || 'Main Course';
}

/**
 * Gets the display color configuration for a category.
 * Handles unknown categories gracefully.
 */
export function getCategoryColors(category: string | null | undefined, isActive: boolean = false) {
  const normalized = normalizeCategory(category);
  const key = normalized || 'All';
  const colors = CATEGORY_COLORS[key] || CATEGORY_COLORS['All'];
  
  return {
    background: isActive ? colors.bgActive : colors.bg,
    hover: colors.hover,
    text: isActive ? colors.textActive : colors.text,
    border: colors.border,
  };
}

/**
 * Groups items by their normalized category.
 * Ensures no duplicates and consistent grouping.
 */
export function groupItemsByCategory<T extends { id: string; category: string }>(
  items: T[]
): Map<StandardCategory, T[]> {
  const groups = new Map<StandardCategory, T[]>();
  const seenIds = new Set<string>();
  
  // Initialize empty arrays for all standard categories
  for (const category of STANDARD_CATEGORIES) {
    groups.set(category, []);
  }
  
  // Group items by normalized category
  for (const item of items) {
    // Skip duplicates
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    
    const normalized = normalizeCategoryWithFallback(item.category);
    const group = groups.get(normalized)!;
    group.push(item);
  }
  
  return groups;
}

/**
 * Gets unique normalized categories from a list of items.
 * Returns categories in the standard order, not alphabetical.
 */
export function getUniqueCategories<T extends { category: string }>(items: T[]): StandardCategory[] {
  const found = new Set<StandardCategory>();
  
  for (const item of items) {
    const normalized = normalizeCategoryWithFallback(item.category);
    found.add(normalized);
  }
  
  // Return in standard order
  return STANDARD_CATEGORIES.filter(cat => found.has(cat));
}

/**
 * Counts items in each category after normalization.
 * Returns a map of category -> count.
 */
export function countByCategory<T extends { category: string; isAvailable?: boolean }>(
  items: T[],
  onlyAvailable: boolean = false
): Map<StandardCategory | 'All', number> {
  const counts = new Map<StandardCategory | 'All', number>();
  const seenIds = new Set<string>();
  
  // Initialize counts
  counts.set('All', 0);
  for (const category of STANDARD_CATEGORIES) {
    counts.set(category, 0);
  }
  
  // Count items
  for (const item of items) {
    // Skip if filtering for available only
    if (onlyAvailable && item.isAvailable === false) continue;
    
    // Skip duplicates (if items have id field)
    const itemWithId = item as T & { id?: string };
    if (itemWithId.id) {
      if (seenIds.has(itemWithId.id)) continue;
      seenIds.add(itemWithId.id);
    }
    
    const normalized = normalizeCategoryWithFallback(item.category);
    counts.set('All', (counts.get('All') || 0) + 1);
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  
  return counts;
}

