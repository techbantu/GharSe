/**
 * API ENDPOINT: GET /api/customer/achievements
 * 
 * Purpose: Calculate and return customer's achievement data
 * 
 * Features:
 * - Returns unlocked achievements
 * - Calculates progress toward locked achievements
 * - Groups achievements by category
 * - Identifies recent unlocks
 * - Suggests next achievements to pursue
 * 
 * Authentication: Required (customer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { calculateAchievements } from '@/lib/achievement-engine';
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

    logger.info('Fetching achievements', { customerId });

    // Calculate achievements
    let achievements;
    try {
      achievements = await calculateAchievements(customerId);
    } catch (achievementError) {
      logger.warn('Achievement calculation failed, returning empty state', {
        customerId,
        error: achievementError instanceof Error ? achievementError.message : String(achievementError),
      });
      
      // Return empty achievements
      achievements = {
        totalUnlocked: 0,
        totalAchievements: 0,
        completionPercentage: 0,
        categories: [],
        recentUnlocks: [],
        nextToUnlock: [],
      };
    }

    logger.info('Achievements fetched successfully', { customerId });

    return NextResponse.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    logger.error('Failed to fetch achievements', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch achievements',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

