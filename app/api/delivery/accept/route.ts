/**
 * ACCEPT DELIVERY API
 * 
 * Purpose: Driver accepts a delivery order
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryId, driverId } = body;

    if (!deliveryId || !driverId) {
      return NextResponse.json(
        { error: 'Delivery ID and Driver ID are required' },
        { status: 400 }
      );
    }

    // Check if delivery is still available
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    if (delivery.partnerId) {
      return NextResponse.json(
        { error: 'This delivery has already been accepted' },
        { status: 400 }
      );
    }

    // Assign driver to delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        partnerId: driverId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        order: {
          include: {
            items: {
              include: { menuItem: true },
            },
          },
        },
        partner: true,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { status: 'OUT_FOR_DELIVERY' },
    });

    // Update driver availability
    await prisma.deliveryPartner.update({
      where: { id: driverId },
      data: { isAvailable: false },
    });

    return NextResponse.json({
      success: true,
      delivery: {
        id: updatedDelivery.id,
        orderId: updatedDelivery.orderId,
        orderNumber: updatedDelivery.order.orderNumber,
        status: updatedDelivery.status,
        customerName: updatedDelivery.order.customerName,
        customerPhone: updatedDelivery.order.customerPhone,
        pickupAddress: 'GharSe Kitchen',
        pickupLat: updatedDelivery.pickupLat,
        pickupLng: updatedDelivery.pickupLng,
        dropoffAddress: updatedDelivery.order.deliveryAddress,
        dropoffLat: updatedDelivery.dropoffLat,
        dropoffLng: updatedDelivery.dropoffLng,
        distanceKm: updatedDelivery.distanceKm,
        estimatedMinutes: updatedDelivery.estimatedMinutes,
        deliveryFee: updatedDelivery.deliveryFee,
        driverPayout: updatedDelivery.driverPayout,
        items: updatedDelivery.order.items.map((item) => ({
          name: item.menuItem?.name || item.deletedItemName || 'Item',
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('[Accept Delivery] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept delivery' },
      { status: 500 }
    );
  }
}

