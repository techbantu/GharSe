/**
 * API ENDPOINT: GET /api/customer/taste-profile
 * 
 * Purpose: Calculate and return customer's taste profile analysis
 * 
 * Features:
 * - Analyzes order history to determine flavor preferences
 * - Returns 8-dimensional taste profile
 * - Identifies flavor archetype
 * - Calculates exploration stats
 * - Lists favorite dishes
 * - Detects order patterns
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { analyzeTasteProfile } from '@/lib/taste-analyzer';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const customerId = decoded.customerId;

    logger.info('Fetching taste profile', { customerId });

    // Analyze taste profile
    let tasteProfile;
    try {
      tasteProfile = await analyzeTasteProfile(customerId);
    } catch (analysisError) {
      // If analysis fails, return default profile
      logger.warn('Taste analysis failed, returning default profile', {
        customerId,
        error: analysisError instanceof Error ? analysisError.message : String(analysisError),
      });
      
      // Return a safe default profile
      tasteProfile = {
        tasteProfile: {
          spicy: 50, creamy: 50, tangy: 50, sweet: 50,
          smoky: 50, herbal: 50, rich: 50, light: 50,
        },
        flavorArchetype: {
          name: 'New Explorer',
          description: 'Your culinary journey is just beginning! Order to discover your taste profile.',
          emoji: '🗺️',
        },
        explorationStats: {
          totalDishes: 0,
          totalMenuItems: 45,
          explorationPercentage: 0,
          categoriesExplored: [],
          totalCategories: 7,
          explorerRank: 'Novice',
        },
        favoriteDishes: [],
        orderPatterns: {
          favoriteDay: 'Not enough data',
          favoriteTime: 'Not enough data',
          averageOrderValue: 0,
          orderFrequency: 'New customer',
          lastOrderDate: null,
          daysSinceLastOrder: 0,
        },
      };
    }

    logger.info('Taste profile fetched successfully', { customerId });

    return NextResponse.json({
      success: true,
      data: tasteProfile,
    });
  } catch (error) {
    logger.error('Failed to fetch taste profile', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch taste profile',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

