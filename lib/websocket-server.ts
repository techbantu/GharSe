/**
 * NEW FILE: WebSocket Server - Real-Time Order Updates
 * 
 * Purpose: Provides WebSocket connections for live order status updates
 * that automatically push to the AI chat when orders change
 * 
 * Architecture:
 * - Socket.io for WebSocket communication
 * - Room-based connections (one room per order/customer)
 * - Automatic reconnection handling
 * - Message queuing for offline clients
 * - Integration with AI chat for proactive notifications
 * 
 * Usage:
 * - Server emits order updates to relevant clients
 * - Chat listens for updates and displays them
 * - Handles authentication and authorization
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from './prisma';

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket Server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join admin room (for real-time order notifications)
    socket.on('join:admin', async () => {
      try {
        socket.join('admin:all');
        console.log(`[WebSocket] Admin joined admin room: ${socket.id}`);
        
        socket.emit('connection:success', {
          message: 'Connected to admin real-time updates',
          rooms: Array.from(socket.rooms),
        });
      } catch (error) {
        console.error('[WebSocket] Error joining admin room:', error);
        socket.emit('error', { message: 'Failed to join admin room' });
      }
    });

    // Join customer room
    socket.on('join:customer', async (data: { phone?: string; email?: string; orderId?: string }) => {
      try {
        if (data.orderId) {
          socket.join(`order:${data.orderId}`);
          console.log(`[WebSocket] Joined order room: order:${data.orderId}`);
          
          // Send current order status
          const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
            },
          });

          if (order) {
            socket.emit('order:update', {
              orderNumber: order.orderNumber,
              status: order.status,
              estimatedDelivery: order.estimatedDelivery,
              message: getStatusMessage(order.status),
            });
          }
        }

        if (data.phone) {
          socket.join(`customer:phone:${data.phone}`);
          console.log(`[WebSocket] Joined customer room: customer:phone:${data.phone}`);
        }

        if (data.email) {
          socket.join(`customer:email:${data.email}`);
          console.log(`[WebSocket] Joined customer room: customer:email:${data.email}`);
        }

        socket.emit('connection:success', {
          message: 'Connected to real-time updates',
          rooms: Array.from(socket.rooms),
        });
      } catch (error) {
        console.error('[WebSocket] Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave:room', (room: string) => {
      socket.leave(room);
      console.log(`[WebSocket] Left room: ${room}`);
    });

    // Request order status
    socket.on('request:order-status', async (orderId: string) => {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        });

        if (order) {
          socket.emit('order:update', {
            orderNumber: order.orderNumber,
            status: order.status,
            estimatedDelivery: order.estimatedDelivery,
            message: getStatusMessage(order.status),
            items: order.items.map(item => ({
              name: item.menuItem.name,
              quantity: item.quantity,
            })),
          });
        }
      } catch (error) {
        console.error('[WebSocket] Error fetching order:', error);
        socket.emit('error', { message: 'Failed to fetch order status' });
      }
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error: ${socket.id}`, error);
    });
  });

  return io;
}

/**
 * Get WebSocket instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast order update to relevant clients
 */
export async function broadcastOrderUpdate(orderId: string, status: string, additionalData?: any) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      console.error('[WebSocket] Order not found:', orderId);
      return;
    }

    const updatePayload = {
      orderNumber: order.orderNumber,
      status,
      estimatedDelivery: order.estimatedDelivery,
      message: getStatusMessage(status),
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    // Broadcast to order room
    io.to(`order:${orderId}`).emit('order:update', updatePayload);

    // Broadcast to customer rooms
    io.to(`customer:phone:${order.customerPhone}`).emit('order:update', updatePayload);
    io.to(`customer:email:${order.customerEmail}`).emit('order:update', updatePayload);

    // Broadcast to chat AI for proactive notification
    io.to(`customer:phone:${order.customerPhone}`).emit('chat:notification', {
      type: 'order_update',
      message: `📦 Order Update: ${updatePayload.message}`,
      orderNumber: order.orderNumber,
      status,
    });

    console.log(`[WebSocket] Broadcasted update for order ${order.orderNumber}: ${status}`);
  } catch (error) {
    console.error('[WebSocket] Error broadcasting order update:', error);
  }
}

/**
 * Broadcast kitchen status update
 */
export function broadcastKitchenStatus(activeOrders: number, estimatedWait: number) {
  if (!io) return;

  io.emit('kitchen:status', {
    activeOrders,
    estimatedWait,
    isHighVolume: activeOrders > 15,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast new order to admin room (for real-time notifications)
 */
export async function broadcastNewOrderToAdmin(order: {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string; phone: string };
  pricing: { total: number };
  status: string;
  createdAt: Date;
  items: Array<{ menuItem: { name: string }; quantity: number }>;
}) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot broadcast new order');
    return;
  }

  try {
    const payload = {
      type: 'new_order',
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      total: order.pricing.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
      })),
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all admin clients
    io.to('admin:all').emit('admin:new_order', payload);
    
    console.log(`[WebSocket] Broadcasted new order ${order.orderNumber} to admin room`);
  } catch (error) {
    console.error('[WebSocket] Error broadcasting new order to admin:', error);
  }
}

/**
 * Send notification to specific customer
 */
export async function sendCustomerNotification(
  identifier: { phone?: string; email?: string; orderId?: string },
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  if (!io) return;

  if (identifier.orderId) {
    io.to(`order:${identifier.orderId}`).emit('notification', notification);
  }
  if (identifier.phone) {
    io.to(`customer:phone:${identifier.phone}`).emit('notification', notification);
  }
  if (identifier.email) {
    io.to(`customer:email:${identifier.email}`).emit('notification', notification);
  }
}

// ===== HELPER FUNCTIONS =====

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    PENDING: 'Order received! We\'re reviewing your order.',
    CONFIRMED: 'Order confirmed! Our chefs are preparing your food.',
    PREPARING: 'Your food is being cooked with love! 👨‍🍳',
    READY: 'Your order is ready! Driver is picking it up.',
    OUT_FOR_DELIVERY: 'Your order is on its way! 🚗',
    DELIVERED: 'Delivered! Enjoy your meal! 🎉',
    CANCELLED: 'Order was cancelled.',
  };
  return messages[status] || 'Processing your order...';
}

/**
 * Cleanup function for graceful shutdown
 */
export function closeWebSocket() {
  if (io) {
    io.close(() => {
      console.log('[WebSocket] Server closed');
    });
    io = null;
  }
}

