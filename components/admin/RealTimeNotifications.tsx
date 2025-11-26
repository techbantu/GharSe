/**
 * REAL-TIME NOTIFICATIONS COMPONENT - Chef Dashboard
 * 
 * Purpose: Show real-time order notifications with sound alerts
 * 
 * Features:
 * - WebSocket connection for live updates
 * - Sound notification on new orders
 * - Desktop notification API
 * - One-click accept/reject
 * - Toast notifications
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Bell, BellRing, Volume2, VolumeX, X, 
  Check, Clock, Package, AlertCircle 
} from 'lucide-react';

interface OrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
  createdAt: string;
  status: string;
}

interface RealTimeNotificationsProps {
  onNewOrder?: (order: OrderNotification) => void;
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
}

export default function RealTimeNotifications({
  onNewOrder,
  onAcceptOrder,
  onRejectOrder,
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed (user hasn't interacted with page yet)
      });
    }
  }, [soundEnabled]);

  // Show desktop notification
  const showDesktopNotification = useCallback((order: OrderNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🍽️ New Order!', {
        body: `Order #${order.orderNumber} - ₹${order.total}\n${order.customerName}`,
        icon: '/icon-192.png',
        tag: order.orderId,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        setShowPanel(true);
        notification.close();
      };
    }
  }, []);

  // Handle new order notification
  const handleNewOrder = useCallback((order: OrderNotification) => {
    setNotifications(prev => [order, ...prev].slice(0, 20)); // Keep last 20
    setUnreadCount(prev => prev + 1);
    playNotificationSound();
    showDesktopNotification(order);
    onNewOrder?.(order);
  }, [playNotificationSound, showDesktopNotification, onNewOrder]);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/socket`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('[WS] Connected to notification server');
          setIsConnected(true);
          
          // Join admin room
          wsRef.current?.send(JSON.stringify({ type: 'join:admin' }));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'admin:new_order') {
              handleNewOrder(data);
            }
          } catch (error) {
            console.error('[WS] Error parsing message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('[WS] Disconnected, reconnecting...');
          setIsConnected(false);
          
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('[WS] Error:', error);
        };
      } catch (error) {
        console.error('[WS] Connection failed:', error);
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [handleNewOrder]);

  // Poll for new orders as fallback
  useEffect(() => {
    const pollOrders = async () => {
      try {
        const response = await fetch('/api/admin/notifications?unread=true');
        if (response.ok) {
          const data = await response.json();
          if (data.newOrders?.length > 0) {
            data.newOrders.forEach((order: OrderNotification) => {
              handleNewOrder(order);
            });
          }
        }
      } catch (error) {
        // Polling failed, will retry
      }
    };

    // Poll every 30 seconds as fallback
    const interval = setInterval(pollOrders, 30000);
    return () => clearInterval(interval);
  }, [handleNewOrder]);

  // Handle accept order
  const handleAccept = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.orderId !== orderId));
        onAcceptOrder?.(orderId);
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  // Handle reject order
  const handleReject = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Kitchen busy' }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.orderId !== orderId));
        onRejectOrder?.(orderId);
      }
    } catch (error) {
      console.error('Failed to reject order:', error);
    }
  };

  // Clear notification
  const clearNotification = (orderId: string) => {
    setNotifications(prev => prev.filter(n => n.orderId !== orderId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPanel(!showPanel);
            if (!showPanel) setUnreadCount(0);
          }}
          className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-6 h-6 animate-bounce text-orange-400" />
          ) : (
            <Bell className="w-6 h-6" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Connection Status */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>

      {/* Notification Panel */}
      {showPanel && (
        <div className="fixed right-4 top-16 w-96 max-h-[80vh] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No new notifications</p>
                <p className="text-gray-500 text-sm mt-1">
                  New orders will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-700/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">
                            Order #{notification.orderNumber}
                          </p>
                          <span className="text-green-400 font-bold">
                            ₹{notification.total}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {notification.customerName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleAccept(notification.orderId)}
                            className="flex-1 bg-green-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(notification.orderId)}
                            className="flex-1 bg-red-500/20 text-red-400 text-sm font-medium py-2 rounded-lg hover:bg-red-500/30 flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => clearNotification(notification.orderId)}
                        className="text-gray-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => setNotifications([])}
                className="w-full text-center text-sm text-gray-400 hover:text-white"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating New Order Alert */}
      {notifications.length > 0 && !showPanel && (
        <div 
          className="fixed bottom-24 right-4 max-w-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl shadow-2xl p-4 cursor-pointer animate-bounce z-50"
          onClick={() => setShowPanel(true)}
        >
          <div className="flex items-center gap-3">
            <BellRing className="w-8 h-8" />
            <div>
              <p className="font-bold">New Order!</p>
              <p className="text-sm opacity-90">
                #{notifications[0].orderNumber} - ₹{notifications[0].total}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

