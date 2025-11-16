/**
 * API ENDPOINT: GET /api/referral/leaderboard
 * 
 * Purpose: Get monthly referral leaderboard
 * 
 * Features:
 * - Top 10 referrers of current month
 * - User's current rank (if authenticated)
 * - Gamification and social proof
 * 
 * Authentication: Optional (public leaderboard, but shows personal rank if logged in)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-customer';
import { getMonthlyLeaderboard } from '@/lib/referral-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (optional)
    const token = request.cookies.get('auth_token')?.value;
    let customerId: string | null = null;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        customerId = decoded.customerId;
      }
    }

    // Get leaderboard
    const leaderboard = await getMonthlyLeaderboard(10);

    // If user is authenticated, find their rank
    let userRank = null;
    if (customerId) {
      const userRankIndex = leaderboard.findIndex((entry) => entry.customerId === customerId);
      
      if (userRankIndex >= 0) {
        userRank = {
          rank: userRankIndex + 1,
          referralCount: leaderboard[userRankIndex].referralCount,
          totalEarned: leaderboard[userRankIndex].totalEarned,
        };
      } else {
        // User not in top 10, calculate their actual rank
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const userReferralCount = await (prisma.referral.count as any)({
          where: {
            referrerId: customerId,
            status: 'COMPLETED',
            completedAt: { gte: startOfMonth },
          },
        });

        if (userReferralCount > 0) {
          // Count users with more referrals
          const usersAbove = await (prisma.referral.groupBy as any)({
            by: ['referrerId'],
            where: {
              status: 'COMPLETED',
              completedAt: { gte: startOfMonth },
            },
            _count: { id: true },
            having: {
              id: { _count: { gt: userReferralCount } },
            },
          });

          const totalEarned = await (prisma.referral.aggregate as any)({
            where: {
              referrerId: customerId,
              status: 'COMPLETED',
              completedAt: { gte: startOfMonth },
            },
            _sum: { referrerReward: true },
          });

          userRank = {
            rank: usersAbove.length + 1,
            referralCount: userReferralCount,
            totalEarned: totalEarned._sum.referrerReward || 0,
          };
        }
      }
    }

    logger.info('Leaderboard retrieved', {
      customerId,
      leaderboardSize: leaderboard.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        userRank,
        championPrize: 5000, // ₹5000 for #1
      },
    });
  } catch (error) {
    logger.error('Failed to get leaderboard', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve leaderboard',
      },
      { status: 500 }
    );
  }
}

