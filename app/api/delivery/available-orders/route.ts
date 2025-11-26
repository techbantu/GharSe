/**
 * AVAILABLE ORDERS API FOR DELIVERY PARTNERS
 * 
 * Purpose: Get list of orders available for delivery pickup
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get deliveries that need a driver
    const availableDeliveries = await prisma.delivery.findMany({
      where: {
        status: 'PENDING',
        partnerId: null,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const orders = availableDeliveries.map((delivery) => ({
      id: delivery.id,
      orderId: delivery.orderId,
      orderNumber: delivery.order.orderNumber,
      status: delivery.status,
      customerName: delivery.order.customerName,
      customerPhone: delivery.order.customerPhone,
      pickupAddress: 'GharSe Kitchen', // Default pickup
      pickupLat: delivery.pickupLat,
      pickupLng: delivery.pickupLng,
      dropoffAddress: delivery.order.deliveryAddress,
      dropoffLat: delivery.dropoffLat,
      dropoffLng: delivery.dropoffLng,
      distanceKm: delivery.distanceKm,
      estimatedMinutes: delivery.estimatedMinutes,
      deliveryFee: delivery.deliveryFee,
      driverPayout: delivery.driverPayout,
      items: delivery.order.items.map((item) => ({
        name: item.menuItem?.name || item.deletedItemName || 'Item',
        quantity: item.quantity,
      })),
      createdAt: delivery.createdAt.toISOString(),
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[Available Orders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', orders: [] },
      { status: 500 }
    );
  }
}

