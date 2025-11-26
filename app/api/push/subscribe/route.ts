/**
 * PUSH SUBSCRIPTION API - Save Push Subscription
 * 
 * Purpose: Store push notification subscription for a user
 */

import { NextRequest, NextResponse } from 'next/server';

// In production, store subscriptions in database
const subscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    // Store subscription (in production, save to database)
    const key = userId || subscription.endpoint;
    subscriptions.set(key, {
      subscription,
      userId,
      createdAt: new Date().toISOString(),
    });

    console.log(`[Push] New subscription saved: ${key}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

