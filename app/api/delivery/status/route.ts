/**
 * DRIVER ONLINE STATUS API
 * 
 * Purpose: Toggle driver online/offline status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, isOnline } = body;

    if (!driverId || isOnline === undefined) {
      return NextResponse.json(
        { error: 'Driver ID and online status are required' },
        { status: 400 }
      );
    }

    await prisma.deliveryPartner.update({
      where: { id: driverId },
      data: {
        isOnline,
        isAvailable: isOnline, // Also update availability
        lastPingAt: isOnline ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, isOnline });
  } catch (error) {
    console.error('[Driver Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

