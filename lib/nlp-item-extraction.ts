/**
 * NLP Item Extraction & Fuzzy Matching - Genius Algorithm
 * 
 * Purpose: Extract menu items from AI messages using pattern matching
 * and fuzzy database matching for maximum reliability
 * 
 * Features:
 * - Multi-pattern regex extraction
 * - Levenshtein distance fuzzy matching
 * - Database lookup with normalization
 * - 80%+ confidence threshold
 */

import prisma from '@/lib/prisma';

export interface ExtractedItem {
  name: string;
  price?: number;
  confidence: number;
}

export interface MatchedItem {
  id: string;
  name: string;
  price: number;
  category: string;
  confidence: number;
}

/**
 * Extract item mentions from AI message using NLP patterns
 * Handles multiple formats:
 * - "Butter Chicken at ₹299"
 * - "Chicken 65 for ₹219"
 * - "Butter Naan (₹49)"
 * - "₹299 Butter Chicken"
 */
export function extractItemsFromMessage(message: string): ExtractedItem[] {
  const patterns = [
    // Pattern 1: "Item Name at ₹Price"
    /([A-Z][a-zA-Z\s\d()]+?)\s+at\s+₹(\d+)/g,
    
    // Pattern 2: "Item Name for ₹Price"
    /([A-Z][a-zA-Z\s\d()]+?)\s+for\s+₹(\d+)/g,
    
    // Pattern 3: "Item Name (₹Price)"
    /([A-Z][a-zA-Z\s\d()]+?)\s*\(₹(\d+)\)/g,
    
    // Pattern 4: "₹Price Item Name"
    /₹(\d+)\s+([A-Z][a-zA-Z\s\d()]+?)(?=[.,!?]|\s-|\sfor|\sat|\(|$)/g,
    
    // Pattern 5: "Item Name - ₹Price"
    /([A-Z][a-zA-Z\s\d()]+?)\s*-\s*₹(\d+)/g,
    
    // Pattern 6: Standalone capitalized items (fallback, lower confidence)
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+|\s+\d+)+)(?=\s|[.,!?]|$)/g,
  ];
  
  const items: ExtractedItem[] = [];
  const seenItems = new Set<string>();
  
  // Try each pattern
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    let match;
    
    while ((match = pattern.exec(message)) !== null) {
      let itemName: string;
      let itemPrice: number | undefined;
      let confidence: number;
      
      // Handle different capture groups based on pattern
      if (i === 3) { // Pattern 4: price first
        itemName = match[2].trim();
        itemPrice = parseInt(match[1]);
        confidence = 0.9;
      } else if (i === 5) { // Pattern 6: no price
        itemName = match[1].trim();
        itemPrice = undefined;
        confidence = 0.6; // Lower confidence without price
      } else {
        itemName = match[1].trim();
        itemPrice = parseInt(match[2]);
        confidence = 0.9;
      }
      
      // Clean up item name
      itemName = itemName
        .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical notes
        .replace(/\s+/g, ' ')
        .trim();
      
      // Avoid duplicates
      const itemKey = itemName.toLowerCase();
      if (!seenItems.has(itemKey) && itemName.length > 2) {
        seenItems.add(itemKey);
        items.push({
          name: itemName,
          price: itemPrice,
          confidence,
        });
      }
    }
  }
  
  return items;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching menu items
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Find best matching menu item from database
 * Uses fuzzy matching with 80% similarity threshold
 */
function findBestMatch(
  input: string,
  menuItems: Array<{ id: string; name: string; price: number; category: string }>
): MatchedItem | null {
  let bestMatch: MatchedItem | null = null;
  let highestSimilarity = 0;
  
  const normalizedInput = input.toLowerCase().trim();
  
  for (const item of menuItems) {
    const normalizedName = item.name.toLowerCase().trim();
    
    // Calculate Levenshtein distance
    const distance = levenshteinDistance(normalizedInput, normalizedName);
    
    // Calculate similarity score (0 to 1)
    const maxLen = Math.max(normalizedInput.length, normalizedName.length);
    const similarity = 1 - (distance / maxLen);
    
    // Check if this is the best match so far
    if (similarity > highestSimilarity && similarity >= 0.8) {
      highestSimilarity = similarity;
      bestMatch = {
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        confidence: similarity,
      };
    }
    
    // Perfect match - stop searching
    if (similarity === 1.0) {
      break;
    }
  }
  
  return bestMatch;
}

/**
 * Match extracted item names to actual database items
 * Tries exact match first, then fuzzy match
 */
export async function matchItemsToDatabase(
  extractedItems: ExtractedItem[]
): Promise<MatchedItem[]> {
  if (extractedItems.length === 0) {
    return [];
  }
  
  try {
    // Fetch all available menu items from database
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
      },
    });
    
    const matchedItems: MatchedItem[] = [];
    
    for (const extracted of extractedItems) {
      // Try exact match first (case-insensitive)
      let match = menuItems.find(
        item => item.name.toLowerCase() === extracted.name.toLowerCase()
      );
      
      if (match) {
        matchedItems.push({
          id: match.id,
          name: match.name,
          price: match.price,
          category: match.category,
          confidence: 1.0, // Perfect match
        });
      } else {
        // Try fuzzy match
        const fuzzyMatch = findBestMatch(extracted.name, menuItems);
        if (fuzzyMatch) {
          matchedItems.push(fuzzyMatch);
        }
      }
    }
    
    // Remove duplicates (keep highest confidence)
    const uniqueMatches = new Map<string, MatchedItem>();
    for (const item of matchedItems) {
      const existing = uniqueMatches.get(item.id);
      if (!existing || item.confidence > existing.confidence) {
        uniqueMatches.set(item.id, item);
      }
    }
    
    return Array.from(uniqueMatches.values());
    
  } catch (error) {
    console.error('[NLP] Database matching error:', error);
    return [];
  }
}

/**
 * Deduplicate items by normalized name
 */
export function deduplicateItems(items: ExtractedItem[]): ExtractedItem[] {
  const seen = new Map<string, ExtractedItem>();
  
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    const existing = seen.get(key);
    
    // Keep item with higher confidence
    if (!existing || item.confidence > existing.confidence) {
      seen.set(key, item);
    }
  }
  
  return Array.from(seen.values());
}

