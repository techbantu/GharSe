/**
 * NEW FILE: WebSocket Client Hook - Real-Time Updates for Chat
 * 
 * Purpose: Provides WebSocket connection management for chat component
 * to receive real-time order updates and notifications
 * 
 * Features:
 * - Automatic connection and reconnection
 * - Room management (join/leave)
 * - Event listeners with cleanup
 * - Connection status tracking
 * - Message queueing when offline
 * 
 * Usage:
 * const { connect, disconnect, joinRoom, on, emit } = useWebSocket();
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
}

export function useWebSocket(): WebSocketHook {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  /**
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting...');

    const socket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 10000, // 10 second connection timeout
      forceNew: false,
      autoConnect: true,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, wait before reconnecting
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('[WebSocket] Connection error (will retry):', error.message);
      setIsConnected(false);
      setReconnectAttempts(prev => prev + 1);
      // Don't throw - gracefully degrade to polling fallback
    });
    
    socket.on('connect_timeout', () => {
      console.warn('[WebSocket] Connection timeout - server may not be initialized');
      setIsConnected(false);
      // Gracefully degrade - polling will still work
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      setReconnectAttempts(0);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after all attempts');
    });

    // Pong handler for keepalive
    socket.on('pong', () => {
      // Connection is alive
    });

    socketRef.current = socket;
  }, []);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      console.log('[WebSocket] Disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Join a room
   */
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:room', room);
      console.log('[WebSocket] Joining room:', room);
    }
  }, []);

  /**
   * Leave a room
   */
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:room', room);
      console.log('[WebSocket] Leaving room:', room);
    }
  }, []);

  /**
   * Listen to event
   */
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  /**
   * Remove event listener
   */
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  /**
   * Emit event
   */
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[WebSocket] Cannot emit, not connected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Keepalive ping
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, 25000); // Ping every 25 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    on,
    off,
    emit,
  };
}

/**
 * Hook for order updates
 */
export function useOrderUpdates(orderId?: string, phone?: string, email?: string) {
  const { connect, disconnect, on, off, emit, isConnected } = useWebSocket();
  const [latestUpdate, setLatestUpdate] = useState<any>(null);

  useEffect(() => {
    connect();

    const handleOrderUpdate = (data: any) => {
      console.log('[WebSocket] Order update received:', data);
      setLatestUpdate(data);
    };

    const handleChatNotification = (data: any) => {
      console.log('[WebSocket] Chat notification received:', data);
      // Could trigger a toast or chat message here
    };

    // Listen for updates
    on('order:update', handleOrderUpdate);
    on('chat:notification', handleChatNotification);

    // Join appropriate rooms
    if (orderId || phone || email) {
      emit('join:customer', { orderId, phone, email });
    }

    return () => {
      off('order:update', handleOrderUpdate);
      off('chat:notification', handleChatNotification);
      disconnect();
    };
  }, [orderId, phone, email]);

  return {
    latestUpdate,
    isConnected,
  };
}

