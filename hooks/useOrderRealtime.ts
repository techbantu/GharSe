/**
 * NEW FILE: Real-Time Order Updates Hook
 *
 * Purpose: Connect to WebSocket for live order status updates
 * Provides real-time notifications when order status changes
 *
 * Features:
 * - Auto-connect to order-specific WebSocket room
 * - Listen for status updates, modifications, and notifications
 * - Toast notifications for status changes
 * - Automatic reconnection on connection loss
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/context/ToastContext';
import { OrderStatus } from '@/types';
// import { logger } from '@/utils/logger'; // Temporarily disabled due to build issues

interface OrderUpdateData {
  orderNumber: string;
  status: string;
  estimatedDelivery?: string;
  message: string;
  timestamp?: string;
  modificationType?: string;
  newItemCount?: number;
  totalChanged?: boolean;
  newTotal?: number;
}

interface UseOrderRealtimeOptions {
  orderId?: string;
  customerPhone?: string;
  customerEmail?: string;
  onStatusUpdate?: (data: OrderUpdateData) => void;
  onModification?: (data: OrderUpdateData) => void;
  enabled?: boolean;
}

export function useOrderRealtime(options: UseOrderRealtimeOptions) {
  const {
    orderId,
    customerPhone,
    customerEmail,
    onStatusUpdate,
    onModification,
    enabled = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const toast = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  // Status messages for different order states
  const getStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
      'confirmed': '🎉 Order confirmed! Our chefs are preparing your food.',
      'preparing': '👨‍🍳 Your food is being cooked with love!',
      'ready': '📦 Your order is ready for pickup/delivery!',
      'out-for-delivery': '🚗 Your order is on its way!',
      'delivered': '✅ Order delivered! Enjoy your meal!',
      'cancelled': '❌ Order was cancelled.',
    };
    return messages[status.toLowerCase()] || `Order status: ${status}`;
  };

  // Handle order status updates
  const handleOrderUpdate = useCallback((data: OrderUpdateData) => {
    console.log('Real-time order update received', {
      orderId,
      orderNumber: data.orderNumber,
      status: data.status,
      modificationType: data.modificationType,
    });

    // Show toast notification
    if (data.modificationType === 'item_update') {
      // Handle order modification updates
      toast?.success(
        'Order Updated',
        data.newItemCount
          ? `Order modified! Now has ${data.newItemCount} items.`
          : 'Your order has been updated.'
      );

      onModification?.(data);
    } else {
      // Handle status updates
      const message = getStatusMessage(data.status);
      toast?.info('Order Update', message);

      onStatusUpdate?.(data);
    }
  }, [orderId, toast, onStatusUpdate, onModification]);

  // Handle general notifications
  const handleNotification = useCallback((notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) => {
    console.log('Real-time notification received', {
      orderId,
      type: notification.type,
      title: notification.title,
    });

    // Show appropriate toast based on notification type
    switch (notification.type) {
      case 'order_update':
        toast?.info(notification.title, notification.message);
        break;
      case 'kitchen_update':
        toast?.info('Kitchen Update', notification.message);
        break;
      case 'delivery_update':
        toast?.info('Delivery Update', notification.message);
        break;
      default:
        toast?.info(notification.title, notification.message);
    }
  }, [orderId, toast]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error('WebSocket connection error', {
      orderId,
      error: error.message || String(error),
    });

    // Don't show error toast for connection issues - too noisy
    // toast?.error('Connection Issue', 'Having trouble connecting to real-time updates');
  }, [orderId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || isConnectingRef.current || socketRef.current?.connected) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '/', {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        forceNew: true,
        timeout: 5000,
      });

      socketRef.current = socket;

      // Connection established
      socket.on('connect', () => {
        console.log('WebSocket connected for order updates', { orderId });
        isConnectingRef.current = false;

        // Join relevant rooms
        if (orderId) {
          socket.emit('join:customer', {
            orderId,
            phone: customerPhone,
            email: customerEmail,
          });
        }
      });

      // Handle order updates
      socket.on('order:update', handleOrderUpdate);

      // Handle general notifications
      socket.on('notification', handleNotification);

      // Handle connection errors
      socket.on('connect_error', handleConnectionError);
      socket.on('error', handleConnectionError);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected', { orderId, reason });
        isConnectingRef.current = false;

        // Auto-reconnect unless explicitly closed
        if (reason !== 'io client disconnect' && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      });

    } catch (error) {
      console.error('Failed to create WebSocket connection', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
      isConnectingRef.current = false;
    }
  }, [enabled, orderId, customerPhone, customerEmail, handleOrderUpdate, handleNotification, handleConnectionError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      console.log('Disconnecting WebSocket', { orderId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [orderId]);

  // Send ping to test connection
  const ping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  // Request order status (useful for manual refresh)
  const requestOrderStatus = useCallback(() => {
    if (socketRef.current?.connected && orderId) {
      socketRef.current.emit('request:order-status', orderId);
    }
  }, [orderId]);

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount or when dependencies change
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
    ping,
    requestOrderStatus,
  };
}
