/**
 * Kitchen Orders - Kanban-Style KOT Display
 * 
 * Purpose: Beautiful, compact kitchen ticket cards organized in workflow columns
 * 
 * Workflow: NEW → CONFIRMED → COOKING → READY
 * 
 * Features:
 * - 4 distinct columns (kanban style)
 * - Compact ticket cards (like real kitchen KOTs)
 * - One-click status progression
 * - Smooth transitions between columns
 * - Real-time updates
 * 
 * Last Updated: Nov 26, 2025 - Kanban redesign
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  X,
  RefreshCw,
  Package,
  Bell,
  Flame,
  Timer,
  Check,
  Play,
  AlertCircle,
  Inbox,
  ThumbsUp,
  UtensilsCrossed
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { formatForRestaurant, getRestaurantRegion, formatMinutesToHuman } from '@/lib/timezone-service';

interface KitchenOrdersProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const KitchenDisplay: React.FC<KitchenOrdersProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const audioUnlockedRef = useRef(false);
  const region = getRestaurantRegion();

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch('/api/orders?status=pending-confirmation,pending,confirmed,preparing,ready&includePendingConfirmation=true', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.orders)) {
        const processedOrders = data.orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          estimatedReadyTime: new Date(order.estimatedReadyTime),
        }));
        
        const currentOrderIds = new Set<string>(processedOrders.map((o: Order) => o.id));
        const prevOrderIds = prevOrderIdsRef.current;
        
        const newOrderIds: string[] = [];
        currentOrderIds.forEach((id: string) => {
          if (!prevOrderIds.has(id)) {
            newOrderIds.push(id);
          }
        });
        
        if (prevOrderIds.size > 0 && newOrderIds.length > 0) {
          playNewOrderSound();
          setNewOrderCount(prev => prev + newOrderIds.length);
          setShowNotificationBanner(true);
          setTimeout(() => setShowNotificationBanner(false), 5000);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🍳 ${newOrderIds.length} New Order${newOrderIds.length > 1 ? 's' : ''}!`, {
              body: 'Check the kitchen display',
              icon: '/logo.png',
              tag: 'new-kitchen-order',
            });
          }
        }
        
        prevOrderIdsRef.current = currentOrderIds;
        setOrders(processedOrders);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Unlock audio
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    try {
      const silentAudio = new Audio();
      silentAudio.volume = 0.01;
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      silentAudio.play().then(() => {
        silentAudio.pause();
        audioUnlockedRef.current = true;
      }).catch(() => {});
    } catch (e) {}
  };

  // Play notification sound
  const playNewOrderSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => playWebAudioNotification());
    } catch {
      playWebAudioNotification();
    }
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300]);
    }
  };

  const playWebAudioNotification = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const frequencies = [523, 659, 784];
      const delays = [0, 0.15, 0.30];
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = now + delays[i];
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const handleFirstClick = () => {
      unlockAudio();
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    return () => document.removeEventListener('click', handleFirstClick);
  }, []);

  // Update order status with optimistic UI
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const previousOrders = [...orders];

    // Optimistic update
    setOrders(currentOrders => 
      currentOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setTimeout(() => fetchOrders(), 500);
    } catch {
      setOrders(previousOrders);
      alert('Failed to update order status');
    }
  };

  // Mark as picked up (remove from display)
  const handlePickedUp = async (orderId: string) => {
    setOrders(currentOrders => currentOrders.filter(o => o.id !== orderId));
    
    fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'out-for-delivery' }),
    }).catch(err => console.error(err));
  };

  // Group orders by status
  const newOrders = orders.filter(o => ['pending', 'pending-confirmation'].includes(o.status));
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const cookingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
    
  // Compact Kitchen Ticket Card
  const KitchenTicket = ({ order, column }: { order: Order; column: 'new' | 'confirmed' | 'cooking' | 'ready' }) => {
    const isPaid = order.paymentStatus === 'PAID';
    const isUPI = order.paymentMethod?.toLowerCase().includes('upi') || 
                  order.paymentMethod?.toLowerCase().includes('gpay') || 
                  order.paymentMethod?.toLowerCase().includes('phonepe');
    
    // Check if scheduled order and calculate time remaining
    const isScheduled = order.scheduledDeliveryAt || order.scheduledWindowStart;
    const scheduledTime = isScheduled 
      ? new Date(order.scheduledWindowStart || order.scheduledDeliveryAt || 0)
      : null;
    
    // Calculate minutes remaining until delivery
    const getTimeRemaining = () => {
      if (!scheduledTime) return null;
      const now = new Date();
      const diffMs = scheduledTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins;
    };
    
    const timeRemaining = getTimeRemaining();
    
    // Format time remaining for display
    const formatTimeRemaining = (mins: number | null) => {
      if (mins === null) return null;
      if (mins < 0) {
        const overdue = Math.abs(mins);
        if (overdue < 60) return `${overdue}m overdue!`;
        const hours = Math.floor(overdue / 60);
        const minutes = overdue % 60;
        return `${hours}h ${minutes}m overdue!`;
      }
      if (mins < 60) return `${mins}m left`;
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
    };
    
    // Urgency based on time remaining
    const getUrgencyColor = () => {
      if (timeRemaining === null) return null;
      if (timeRemaining < 0) return '#EF4444'; // Red - overdue
      if (timeRemaining <= 30) return '#EF4444'; // Red - urgent
      if (timeRemaining <= 60) return '#F97316'; // Orange - soon
      return '#10B981'; // Green - plenty of time
    };
    
    const urgencyColor = getUrgencyColor();
    
    // Column-specific styles
    const columnStyles = {
      new: { accent: '#3B82F6', bg: '#EFF6FF', border: '#93C5FD' },
      confirmed: { accent: '#8B5CF6', bg: '#F5F3FF', border: '#C4B5FD' },
      cooking: { accent: '#F97316', bg: '#FFF7ED', border: '#FDBA74' },
      ready: { accent: '#10B981', bg: '#ECFDF5', border: '#6EE7B7' },
    };
    
    const style = columnStyles[column];
    
    // Next action based on column
    const getNextAction = () => {
      switch (column) {
        case 'new':
    return {
            label: 'Confirm',
            icon: Check,
            onClick: () => updateOrderStatus(order.id, 'confirmed'),
            color: '#8B5CF6'
          };
        case 'confirmed':
          return {
            label: 'Start',
            icon: Play,
            onClick: () => updateOrderStatus(order.id, 'preparing'),
            color: '#F97316'
          };
        case 'cooking':
      return {
            label: 'Ready',
            icon: CheckCircle,
            onClick: () => updateOrderStatus(order.id, 'ready'),
            color: '#10B981'
          };
        case 'ready':
      return {
            label: 'Picked Up',
            icon: Package,
            onClick: () => handlePickedUp(order.id),
            color: '#10B981'
      };
    }
  };

    const action = getNextAction();
    const ActionIcon = action.icon;
    
    return (
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          border: `2px solid ${style.border}`,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
      >
        {/* Header - Order Number + Time */}
          <div style={{ 
          background: style.bg,
          padding: '6px 10px',
            display: 'flex',
          justifyContent: 'space-between',
            alignItems: 'center',
          borderBottom: `1px solid ${style.border}`
          }}>
              <span style={{ 
            fontWeight: 700, 
            fontSize: '13px', 
            color: style.accent,
            fontFamily: 'monospace'
              }}>
            #{order.orderNumber}
              </span>
          <span style={{ fontSize: '10px', color: '#6B7280' }}>
            {formatForRestaurant(order.createdAt, 'h:mm a')}
              </span>
            </div>
        
        {/* Scheduled Delivery Banner - Shows time remaining */}
        {isScheduled && scheduledTime && (
          <div style={{
            background: urgencyColor ? `${urgencyColor}15` : '#F0FDF4',
            padding: '6px 10px',
            borderBottom: `2px solid ${urgencyColor || '#10B981'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🕐</span>
              <div>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: urgencyColor || '#059669'
                }}>
                  {formatForRestaurant(scheduledTime, 'h:mm a')}
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  color: '#6B7280'
                }}>
                  {formatForRestaurant(scheduledTime, 'EEE, MMM d')}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              background: urgencyColor || '#10B981',
              color: 'white',
              whiteSpace: 'nowrap'
            }}>
              {formatTimeRemaining(timeRemaining)}
            </div>
          </div>
        )}
            
        {/* Body - Customer + Items */}
        <div style={{ padding: '8px 10px' }}>
          {/* Customer Name */}
            <div style={{
            fontSize: '11px', 
            color: '#374151', 
            fontWeight: 600,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                  <span style={{ 
              width: '16px', 
              height: '16px', 
              background: style.bg, 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px'
                  }}>
              👤
                  </span>
            {order.customer?.name || 'Customer'}
            </div>
            
          {/* Items List - Compact */}
            <div style={{
            fontSize: '11px', 
            color: '#1F2937',
            lineHeight: '1.5'
          }}>
            {order.items.slice(0, 4).map((item, idx) => (
              <div key={idx} style={{ 
            display: 'flex',
                gap: '4px',
                padding: '1px 0'
          }}>
                <span style={{ 
                  fontWeight: 700,
                  color: style.accent,
                  minWidth: '16px'
                }}>
                  {item.quantity}×
                </span>
            <span style={{
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  flex: 1
            }}>
                  {item.menuItem?.name || 'Item'}
            </span>
            </div>
          ))}
            {order.items.length > 4 && (
              <div style={{ 
                fontSize: '10px', 
                color: '#9CA3AF', 
                fontStyle: 'italic',
                marginTop: '2px' 
              }}>
                +{order.items.length - 4} more items
              </div>
            )}
        </div>
        
          {/* Payment Badge */}
        <div style={{
            marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
            gap: '4px'
          }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background: isUPI ? '#F3E8FF' : '#FEF3C7',
              color: isUPI ? '#7C3AED' : '#92400E'
            }}>
              {isUPI ? '📱 UPI' : '💵 Cash'}
                </span>
          <span style={{
              fontSize: '9px',
            fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: isPaid ? '#D1FAE5' : '#FEE2E2',
              color: isPaid ? '#065F46' : '#B91C1C'
          }}>
              {isPaid ? '✓ PAID' : 'COLLECT'}
          </span>
          </div>
        </div>

        {/* Action Button - Full Width */}
            <button
          onClick={action.onClick}
              style={{
                width: '100%',
            padding: '8px',
            background: action.color,
            color: 'white',
                border: 'none',
            fontSize: '12px',
            fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
          <ActionIcon size={14} />
          {action.label}
              </button>

        {/* Cancel option for non-ready orders */}
        {column !== 'ready' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                style={{
                  width: '100%',
              padding: '4px',
              background: '#FEF2F2',
              color: '#DC2626',
                  border: 'none',
              fontSize: '10px',
                  fontWeight: 600,
              cursor: 'pointer',
              borderTop: '1px solid #FECACA',
                }}
              >
            ✕ Cancel
              </button>
        )}
      </div>
    );
  };

  // Column Component
  const Column = ({ 
    title, 
    count, 
    orders, 
    column, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    count: number; 
    orders: Order[]; 
    column: 'new' | 'confirmed' | 'cooking' | 'ready';
    icon: any;
    color: string;
  }) => (
    <div style={{
      flex: 1,
      minWidth: '180px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Column Header */}
      <div style={{
        background: 'white',
        borderRadius: '10px 10px 0 0',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `3px solid ${color}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '13px', 
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </span>
        </div>
        <span style={{
          background: color,
          color: 'white',
          fontSize: '12px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '10px',
          minWidth: '24px',
          textAlign: 'center'
        }}>
          {count}
        </span>
      </div>

      {/* Orders Container */}
      <div style={{
        flex: 1,
        background: '#F9FAFB',
        borderRadius: '0 0 10px 10px',
        padding: '8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 10px',
            color: '#9CA3AF',
            fontSize: '12px'
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              margin: '0 auto 12px',
              borderRadius: '50%',
              backgroundColor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {column === 'new' && <Inbox size={24} style={{ color, opacity: 0.7 }} />}
              {column === 'confirmed' && <ThumbsUp size={24} style={{ color, opacity: 0.7 }} />}
              {column === 'cooking' && <Flame size={24} style={{ color, opacity: 0.7 }} />}
              {column === 'ready' && <UtensilsCrossed size={24} style={{ color, opacity: 0.7 }} />}
            </div>
            <span style={{ color: '#9CA3AF', fontWeight: 500 }}>No orders</span>
          </div>
        ) : (
          orders.map(order => (
            <KitchenTicket key={order.id} order={order} column={column} />
          ))
        )}
      </div>
    </div>
  );

  if (loading && orders.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '300px',
        color: '#6B7280'
      }}>
        <RefreshCw className="animate-spin" size={24} />
        <span style={{ marginLeft: '8px' }}>Loading orders...</span>
      </div>
    );
  }

  return (
    <>
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />

      {/* New Order Banner */}
      {showNotificationBanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <Bell size={24} style={{ color: 'white', animation: 'pulse 0.5s ease-in-out infinite' }} />
          <span style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>
            🔔 NEW ORDER RECEIVED!
          </span>
          <button
            onClick={() => setShowNotificationBanner(false)}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

        <div style={{
        height: '100%', 
                display: 'flex',
                flexDirection: 'column',
        background: '#F3F4F6',
        padding: '12px'
              }}>
        {/* Compact Header */}
              <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '12px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
          alignItems: 'center'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
              width: '36px',
              height: '36px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <ChefHat size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 style={{ 
                fontSize: '16px', 
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                }}>
                  Kitchen Display
                </h1>
                <p style={{ 
                fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: 0
                }}>
                Updated {formatForRestaurant(lastRefresh, 'h:mm a')}
                </p>
              </div>
            </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Notification Bell */}
              <button
                onClick={() => {
                unlockAudio();
                  playNewOrderSound();
                setNewOrderCount(0);
                }}
                style={{
                  position: 'relative',
                width: '36px',
                height: '36px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  backgroundColor: newOrderCount > 0 ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
              <Bell size={18} />
                {newOrderCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                  fontSize: '10px',
                    fontWeight: 700,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {newOrderCount > 9 ? '9+' : newOrderCount}
                  </span>
                )}
              </button>
              
            {/* Refresh */}
              <button 
              onClick={fetchOrders}
                disabled={isRefreshing}
                style={{ 
                width: '36px',
                height: '36px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  backgroundColor: isRefreshing ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

        {/* 4-Column Kanban Board */}
            <div style={{
              flex: 1,
              display: 'flex',
          gap: '12px',
          overflow: 'hidden'
            }}>
          <Column 
            title="New" 
            count={newOrders.length} 
            orders={newOrders} 
            column="new"
            icon={Clock}
            color="#3B82F6"
          />
          <Column 
            title="Confirmed" 
            count={confirmedOrders.length} 
            orders={confirmedOrders} 
            column="confirmed"
            icon={Check}
            color="#8B5CF6"
          />
          <Column 
            title="Cooking" 
            count={cookingOrders.length} 
            orders={cookingOrders} 
            column="cooking"
            icon={Flame}
            color="#F97316"
          />
          <Column 
            title="Ready" 
            count={readyOrders.length} 
            orders={readyOrders} 
            column="ready"
            icon={CheckCircle}
            color="#10B981"
          />
            </div>

        {/* Quick Stats Row */}
            <div style={{
          marginTop: '12px',
              display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
            <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#6B7280',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontWeight: 700, color: '#111827' }}>
              {orders.length}
            </span>
            Active Orders
              </div>
        <div style={{ 
            background: 'white',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#6B7280',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
            <Timer size={14} />
            Auto-refresh: {refreshInterval / 1000}s
          </div>
        </div>
      </div>
    </>
  );
};

export default KitchenDisplay;
