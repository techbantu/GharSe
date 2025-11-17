/**
 * Socket.IO Server Setup for Real-Time Updates
 *
 * Purpose: Provides WebSocket server for real-time order updates
 * Features:
 * - Order status updates pushed to customers
 * - Kitchen notifications for new orders
 * - Admin dashboard live updates
 * - Connection management and room-based broadcasting
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Order } from '@/types';

let io: SocketIOServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join customer room to receive their order updates
    socket.on('join:customer', (customerId: string) => {
      socket.join(`customer:${customerId}`);
      console.log(`[Socket.IO] Customer ${customerId} joined their room`);
    });

    // Join order room for specific order tracking
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket.IO] Client joined order room: ${orderId}`);
    });

    // Join admin room for dashboard updates
    socket.on('join:admin', (adminId: string) => {
      socket.join('admin');
      console.log(`[Socket.IO] Admin ${adminId} joined admin room`);
    });

    // Join kitchen room for chef order notifications
    socket.on('join:kitchen', (chefId?: string) => {
      const room = chefId ? `kitchen:${chefId}` : 'kitchen';
      socket.join(room);
      console.log(`[Socket.IO] Chef joined kitchen room: ${room}`);
    });

    // Leave rooms on disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });

    // Heartbeat for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

// Event emitters for different types of updates

/**
 * Emit order status update to all relevant parties
 */
export function emitOrderUpdate(order: Order) {
  if (!io) return;

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    estimatedReadyTime: order.estimatedReadyTime,
    timestamp: new Date(),
  };

  // Send to customer
  io.to(`customer:${order.customer.id}`).emit('order:updated', payload);

  // Send to specific order tracking page
  io.to(`order:${order.id}`).emit('order:updated', payload);

  // Send to admin dashboard
  io.to('admin').emit('order:updated', payload);

  // Send to kitchen if relevant
  if (order.chefId) {
    io.to(`kitchen:${order.chefId}`).emit('order:updated', payload);
  }

  console.log(`[Socket.IO] Order update emitted: ${order.orderNumber} -> ${order.status}`);
}

/**
 * Emit new order notification to kitchen and admins
 */
export function emitNewOrder(order: Order) {
  if (!io) return;

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    items: order.items,
    total: order.pricing.total,
    customer: order.customer,
    deliveryAddress: order.deliveryAddress,
    timestamp: new Date(),
  };

  // Notify kitchen
  const kitchenRoom = order.chefId ? `kitchen:${order.chefId}` : 'kitchen';
  io.to(kitchenRoom).emit('order:new', payload);

  // Notify admins
  io.to('admin').emit('order:new', payload);

  // Play sound notification (client-side will handle)
  io.to(kitchenRoom).emit('notification:sound', { type: 'new_order' });

  console.log(`[Socket.IO] New order notification: ${order.orderNumber}`);
}

/**
 * Emit delivery location update (for live tracking)
 */
export function emitDeliveryLocation(orderId: string, location: { lat: number; lng: number }) {
  if (!io) return;

  io.to(`order:${orderId}`).emit('delivery:location', {
    orderId,
    location,
    timestamp: new Date(),
  });

  console.log(`[Socket.IO] Delivery location updated for order: ${orderId}`);
}

/**
 * Emit kitchen capacity update
 */
export function emitKitchenCapacityUpdate(data: {
  currentOrders: number;
  maxCapacity: number;
  utilizationPercent: number;
  estimatedWaitMinutes: number;
}) {
  if (!io) return;

  io.to('admin').emit('kitchen:capacity', data);
}

/**
 * Emit order cancellation
 */
export function emitOrderCancellation(orderId: string, reason: string) {
  if (!io) return;

  const payload = { orderId, reason, timestamp: new Date() };

  io.to(`order:${orderId}`).emit('order:cancelled', payload);
  io.to('admin').emit('order:cancelled', payload);

  console.log(`[Socket.IO] Order cancellation: ${orderId}`);
}

export default {
  initializeSocketServer,
  getSocketServer,
  emitOrderUpdate,
  emitNewOrder,
  emitDeliveryLocation,
  emitKitchenCapacityUpdate,
  emitOrderCancellation,
};
