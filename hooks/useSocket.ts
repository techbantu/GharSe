/**
 * useSocket Hook - Real-Time WebSocket Connection
 *
 * Purpose: React hook for managing Socket.IO connections
 * Features:
 * - Auto-connect/disconnect
 * - Event listeners
 * - Connection status tracking
 * - Automatic reconnection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: Error | null;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Initialize Socket.IO client
    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    socketRef.current = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err);
      setError(err);
      setConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket.IO] Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setError(null);
    });

    socket.on('reconnect_error', (err) => {
      console.error('[Socket.IO] Reconnection error:', err);
      setError(err);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket.IO] Reconnection failed');
      setError(new Error('Failed to reconnect after maximum attempts'));
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Every 30 seconds

    // Cleanup
    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[Socket.IO] Cannot emit - socket not connected');
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from event
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error,
    emit,
    on,
    off,
  };
}

/**
 * Hook for tracking a specific order in real-time
 */
export function useOrderTracking(orderId: string | null) {
  const { socket, connected, emit, on, off } = useSocket();
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!connected || !orderId || !socket) return;

    // Join order room
    emit('join:order', orderId);

    // Listen for order updates
    const handleOrderUpdate = (data: any) => {
      if (data.orderId === orderId) {
        setOrderStatus(data);
      }
    };

    const handleDeliveryLocation = (data: any) => {
      if (data.orderId === orderId) {
        setDeliveryLocation(data.location);
      }
    };

    const handleOrderCancelled = (data: any) => {
      if (data.orderId === orderId) {
        setOrderStatus({ ...data, status: 'cancelled' });
      }
    };

    on('order:updated', handleOrderUpdate);
    on('delivery:location', handleDeliveryLocation);
    on('order:cancelled', handleOrderCancelled);

    return () => {
      off('order:updated', handleOrderUpdate);
      off('delivery:location', handleDeliveryLocation);
      off('order:cancelled', handleOrderCancelled);
    };
  }, [connected, orderId, socket, emit, on, off]);

  return {
    orderStatus,
    deliveryLocation,
    connected,
  };
}

/**
 * Hook for admin dashboard real-time updates
 */
export function useAdminSocket(adminId: string | null) {
  const { socket, connected, emit, on, off } = useSocket();
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [orderUpdates, setOrderUpdates] = useState<any[]>([]);
  const [kitchenCapacity, setKitchenCapacity] = useState<any>(null);

  useEffect(() => {
    if (!connected || !adminId || !socket) return;

    // Join admin room
    emit('join:admin', adminId);

    // Listen for events
    const handleNewOrder = (data: any) => {
      setNewOrders((prev) => [data, ...prev]);
      // Play notification sound
      if (typeof Audio !== 'undefined') {
        const audio = new Audio('/sounds/new-order.mp3');
        audio.play().catch(() => console.log('Audio play prevented by browser'));
      }
    };

    const handleOrderUpdate = (data: any) => {
      setOrderUpdates((prev) => [data, ...prev]);
    };

    const handleKitchenCapacity = (data: any) => {
      setKitchenCapacity(data);
    };

    on('order:new', handleNewOrder);
    on('order:updated', handleOrderUpdate);
    on('kitchen:capacity', handleKitchenCapacity);

    return () => {
      off('order:new', handleNewOrder);
      off('order:updated', handleOrderUpdate);
      off('kitchen:capacity', handleKitchenCapacity);
    };
  }, [connected, adminId, socket, emit, on, off]);

  return {
    newOrders,
    orderUpdates,
    kitchenCapacity,
    connected,
    clearNewOrders: () => setNewOrders([]),
    clearOrderUpdates: () => setOrderUpdates([]),
  };
}

/**
 * Hook for kitchen real-time order notifications
 */
export function useKitchenSocket(chefId?: string) {
  const { socket, connected, emit, on, off } = useSocket();
  const [newOrders, setNewOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!connected || !socket) return;

    // Join kitchen room
    emit('join:kitchen', chefId);

    const handleNewOrder = (data: any) => {
      setNewOrders((prev) => [data, ...prev]);
    };

    const handleNotificationSound = () => {
      // Play notification sound
      if (typeof Audio !== 'undefined') {
        const audio = new Audio('/sounds/new-order.mp3');
        audio.play().catch(() => console.log('Audio play prevented by browser'));
      }
    };

    on('order:new', handleNewOrder);
    on('notification:sound', handleNotificationSound);

    return () => {
      off('order:new', handleNewOrder);
      off('notification:sound', handleNotificationSound);
    };
  }, [connected, chefId, socket, emit, on, off]);

  return {
    newOrders,
    connected,
    clearNewOrders: () => setNewOrders([]),
  };
}
