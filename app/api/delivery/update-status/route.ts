/**
 * UPDATE DELIVERY STATUS API
 * 
 * Purpose: Update delivery status (picked up, in transit, delivered)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryId, status } = body;

    if (!deliveryId || !status) {
      return NextResponse.json(
        { error: 'Delivery ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { partner: true },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Update delivery status
    const updateData: any = { status };

    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.actualArrival = new Date();
      
      // Calculate actual time
      if (delivery.assignedAt) {
        const diffMs = Date.now() - delivery.assignedAt.getTime();
        updateData.actualMinutes = Math.round(diffMs / 60000);
      }
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Update order status based on delivery status
    let orderStatus = 'OUT_FOR_DELIVERY';
    if (status === 'DELIVERED') {
      orderStatus = 'DELIVERED';
    } else if (status === 'CANCELLED') {
      orderStatus = 'CANCELLED';
    }

    await prisma.order.update({
      where: { id: delivery.orderId },
      data: { 
        status: orderStatus as any,
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
    });

    // If delivered, update driver stats and availability
    if (status === 'DELIVERED' && delivery.partnerId) {
      await prisma.deliveryPartner.update({
        where: { id: delivery.partnerId },
        data: {
          isAvailable: true,
          totalDeliveries: { increment: 1 },
        },
      });
    }

    // If cancelled, make driver available again
    if (status === 'CANCELLED' && delivery.partnerId) {
      await prisma.deliveryPartner.update({
        where: { id: delivery.partnerId },
        data: { isAvailable: true },
      });
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error('[Update Delivery Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

