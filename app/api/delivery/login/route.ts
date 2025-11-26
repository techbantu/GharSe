/**
 * DELIVERY PARTNER LOGIN API
 * 
 * Purpose: Authenticate delivery partners by phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Find delivery partner by phone
    const driver = await prisma.deliveryPartner.findUnique({
      where: { phone },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'No delivery partner found with this phone number' },
        { status: 404 }
      );
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = await prisma.delivery.count({
      where: {
        partnerId: driver.id,
        deliveredAt: { gte: today },
        status: 'DELIVERED',
      },
    });

    const todayEarnings = await prisma.delivery.aggregate({
      where: {
        partnerId: driver.id,
        deliveredAt: { gte: today },
        status: 'DELIVERED',
      },
      _sum: { driverPayout: true },
    });

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        isOnline: driver.isOnline,
        rating: driver.rating,
      },
      stats: {
        totalDeliveries: driver.totalDeliveries,
        todayDeliveries,
        todayEarnings: todayEarnings._sum.driverPayout || 0,
        rating: driver.rating,
        completionRate: driver.completionRate,
      },
    });
  } catch (error) {
    console.error('[Delivery Login] Error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

