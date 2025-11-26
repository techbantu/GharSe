/**
 * UPDATE DRIVER LOCATION API
 * 
 * Purpose: Real-time GPS location updates from delivery partner
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, lat, lng } = body;

    if (!driverId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Driver ID and coordinates are required' },
        { status: 400 }
      );
    }

    // Update driver location
    await prisma.deliveryPartner.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastPingAt: new Date(),
      },
    });

    // Find active delivery for this driver and update path
    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        partnerId: driverId,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
      },
    });

    if (activeDelivery) {
      // Add to path points for tracking history
      const currentPath = (activeDelivery.pathPoints as any[]) || [];
      currentPath.push({
        lat,
        lng,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 100 points to avoid huge arrays
      const trimmedPath = currentPath.slice(-100);

      await prisma.delivery.update({
        where: { id: activeDelivery.id },
        data: {
          pathPoints: trimmedPath,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Update Location] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

