/**
 * DELIVERY WEBSOCKET - Real-Time GPS Tracking Updates
 * 
 * Purpose: WebSocket events for live delivery tracking
 * 
 * Features:
 * - Driver location updates (every 5 seconds)
 * - Delivery status changes
 * - Customer notifications
 * - ETA recalculation
 */

import { getWebSocketServer } from './websocket-server';
import { prisma } from './prisma';
import { calculateDistance, estimateArrivalTime } from './google-maps';

/**
 * Broadcast driver location update to customers tracking this delivery
 */
export async function broadcastDriverLocation(
  deliveryId: string,
  driverId: string,
  location: { lat: number; lng: number }
) {
  const io = getWebSocketServer();
  if (!io) {
    console.warn('[Delivery WebSocket] Server not initialized');
    return;
  }

  try {
    // Get delivery details
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) return;

    // Calculate distance to destination
    const distanceToDropoff = calculateDistance(
      location,
      { lat: delivery.dropoffLat, lng: delivery.dropoffLng }
    );

    // Estimate new arrival time
    const eta = estimateArrivalTime(distanceToDropoff);

    const payload = {
      deliveryId,
      orderId: delivery.orderId,
      orderNumber: delivery.order.orderNumber,
      driverLocation: location,
      distanceRemaining: distanceToDropoff,
      estimatedMinutes: eta.minutes,
      formattedETA: eta.formattedTime,
      status: delivery.status,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to order tracking room
    io.to(`order:${delivery.orderId}`).emit('delivery:location', payload);
    io.to(`delivery:${deliveryId}`).emit('delivery:location', payload);

    // Also broadcast to customer rooms
    io.to(`customer:phone:${delivery.order.customerPhone}`).emit('delivery:location', payload);

    console.log(`[Delivery WebSocket] Location update for order ${delivery.order.orderNumber}`);
  } catch (error) {
    console.error('[Delivery WebSocket] Error broadcasting location:', error);
  }
}

/**
 * Broadcast delivery status change
 */
export async function broadcastDeliveryStatusChange(
  deliveryId: string,
  status: string,
  additionalData?: any
) {
  const io = getWebSocketServer();
  if (!io) return;

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: true,
        partner: true,
      },
    });

    if (!delivery) return;

    const statusMessages: Record<string, string> = {
      PENDING: 'Looking for a delivery partner...',
      ASSIGNED: `${delivery.partner?.name || 'Driver'} is on the way to pick up your order!`,
      PICKED_UP: 'Your order has been picked up and is on its way!',
      IN_TRANSIT: 'Your order is being delivered to you! 🚗',
      ARRIVED: 'Your delivery partner has arrived!',
      DELIVERED: 'Your order has been delivered! Enjoy! 🎉',
      CANCELLED: 'Delivery has been cancelled.',
    };

    const payload = {
      deliveryId,
      orderId: delivery.orderId,
      orderNumber: delivery.order.orderNumber,
      status,
      message: statusMessages[status] || 'Status updated',
      driver: delivery.partner ? {
        name: delivery.partner.name,
        phone: delivery.partner.phone,
        vehicleType: delivery.partner.vehicleType,
        vehicleNumber: delivery.partner.vehicleNumber,
        rating: delivery.partner.rating,
      } : null,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    // Broadcast to all relevant rooms
    io.to(`order:${delivery.orderId}`).emit('delivery:status', payload);
    io.to(`delivery:${deliveryId}`).emit('delivery:status', payload);
    io.to(`customer:phone:${delivery.order.customerPhone}`).emit('delivery:status', payload);

    // Send push notification
    io.to(`customer:phone:${delivery.order.customerPhone}`).emit('notification', {
      type: 'delivery_update',
      title: 'Delivery Update',
      message: statusMessages[status],
      data: { orderId: delivery.orderId, status },
    });

    console.log(`[Delivery WebSocket] Status update: ${delivery.order.orderNumber} -> ${status}`);
  } catch (error) {
    console.error('[Delivery WebSocket] Error broadcasting status:', error);
  }
}

/**
 * Subscribe customer to delivery updates
 */
export function subscribeToDeliveryUpdates(socket: any, orderId: string) {
  socket.join(`order:${orderId}`);
  console.log(`[Delivery WebSocket] Socket ${socket.id} subscribed to order ${orderId}`);
}

/**
 * Get current delivery status for an order
 */
export async function getDeliveryStatus(orderId: string) {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: {
        partner: true,
        order: true,
      },
    });

    if (!delivery) return null;

    return {
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      orderNumber: delivery.order.orderNumber,
      status: delivery.status,
      driver: delivery.partner ? {
        id: delivery.partner.id,
        name: delivery.partner.name,
        phone: delivery.partner.phone,
        vehicleType: delivery.partner.vehicleType,
        vehicleNumber: delivery.partner.vehicleNumber,
        currentLat: delivery.partner.currentLat,
        currentLng: delivery.partner.currentLng,
        rating: delivery.partner.rating,
      } : null,
      pickup: {
        lat: delivery.pickupLat,
        lng: delivery.pickupLng,
      },
      dropoff: {
        lat: delivery.dropoffLat,
        lng: delivery.dropoffLng,
        address: delivery.order.deliveryAddress,
      },
      distanceKm: delivery.distanceKm,
      estimatedMinutes: delivery.estimatedMinutes,
      pathPoints: delivery.pathPoints,
      assignedAt: delivery.assignedAt,
      pickedUpAt: delivery.pickedUpAt,
      deliveredAt: delivery.deliveredAt,
    };
  } catch (error) {
    console.error('[Delivery WebSocket] Error getting status:', error);
    return null;
  }
}

