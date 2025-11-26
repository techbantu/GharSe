'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  MoreVertical, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Timer,
  Zap,
  CreditCard,
  Banknote
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes, differenceInSeconds } from 'date-fns';
import OrderDetailsModal from '@/components/admin/orders/OrderDetailsModal';
import { 
  CartItem, 
  OrderStatus, 
  PaymentMethod, 
  PaymentStatus, 
  Address, 
  OrderNotification 
} from '@/types';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  pricing: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount?: number;
    total: number;
  };
  status: OrderStatus;
  orderType: 'delivery' | 'pickup';
  estimatedReadyTime: string;
  actualReadyTime?: string;
  deliveryTime?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  // Timestamp tracking for performance metrics
  confirmedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
  estimatedPrepTime?: number;
  deliveryAddress?: Address;
  contactPreference: ('email' | 'sms')[];
  notifications: OrderNotification[];
  latitude?: number;
  longitude?: number;
}

// Performance indicator component
function OrderPerformanceIndicator({ order, currentTime }: { order: Order; currentTime: Date }) {
  // Simplified for compact view
  const createdAt = new Date(order.createdAt);
  const elapsedMinutes = differenceInMinutes(currentTime, createdAt);
  
  let color = '#10b981'; // Green
  if (elapsedMinutes > 45) color = '#f59e0b'; // Amber
  if (elapsedMinutes > 60) color = '#ef4444'; // Red
  
  if (order.status === 'delivered' || order.status === 'cancelled') return null;

  return (
    <div style={{
      fontSize: '0.75rem',
      color: color,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <Timer size={12} />
      {elapsedMinutes}m
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevOrderCountRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(new Date()); // For real-time updates

  const fetchOrders = async () => {
    try {
      // Use credentials: 'include' to send httpOnly cookies
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every minute (seconds not needed for this view)
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  // Play sound notification when new orders arrive
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 1.0;
        audio.play().catch(err => console.log('Could not play sound:', err));
      } catch (err) {
        console.log('Sound playback error:', err);
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus as OrderStatus } : order
      ));

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on failure
        fetchOrders();
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      fetchOrders(); // Revert
      alert('An error occurred while updating status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#f59e0b',
      'pending-confirmation': '#f59e0b',
      'confirmed': '#f97316',
      'preparing': '#ea580c',
      'ready': '#10b981', // Green for Ready (High Priority)
      'out-for-delivery': '#fb923c',
      'delivered': '#6b7280', // Gray for history
      'cancelled': '#dc2626',
      'refunded': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  // Custom Sorting Logic: Ready > Out for Delivery > Preparing > Confirmed > Pending > Delivered > Cancelled
  const sortOrders = (ordersToSort: Order[]) => {
    const statusPriority: Record<string, number> = {
      'ready': 1,
      'out-for-delivery': 2,
      'preparing': 3,
      'confirmed': 4,
      'pending': 5,
      'pending-confirmation': 6,
      'delivered': 7,
      'cancelled': 8,
      'refunded': 9
    };

    return [...ordersToSort].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 10;
      const priorityB = statusPriority[b.status] || 10;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Secondary sort: Time (FIFO for active orders, LIFO for history)
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();

      if (priorityA <= 6) {
        // Active orders: FIFO (Oldest first)
        return timeA - timeB;
      } else {
        // History: LIFO (Newest first)
        return timeB - timeA;
      }
    });
  };

  const filterOptions = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'out-for-delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = sortOrders(
    filterStatus === 'all' 
      ? orders 
      : orders.filter(o => o.status === filterStatus)
  );

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Helper for Payment Icons and Text
  const renderPaymentInfo = (method: string) => {
    const m = method?.toLowerCase() || 'cash';
    if (m === 'cash' || m === 'cash-on-delivery') {
      return (
        <>
          <Banknote size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
          <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0, lineHeight: '1' }}>Cash in Hand</p>
        </>
      );
    }
    return (
      <>
        <CreditCard size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
        <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0, lineHeight: '1' }}>Card (Coming Soon)</p>
      </>
    );
  };

  // Helper for Primary Action Button on Card
  const renderPrimaryAction = (order: Order) => {
    if (order.status === 'ready') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusUpdate(order.id, 'out-for-delivery');
          }}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: '#f97316', // Orange
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'auto',
            marginBottom: '0.5rem'
          }}
        >
          Out for Delivery
        </button>
      );
    }
    if (order.status === 'out-for-delivery') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusUpdate(order.id, 'delivered');
          }}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: '#10b981', // Green
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'auto',
            marginBottom: '0.5rem'
          }}
        >
          Mark Delivered
        </button>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f4f6',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          Order Management
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Real-time dashboard
        </p>
      </div>
      
      {/* Filter Pills */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        overflowX: 'auto', 
        paddingBottom: '0.5rem',
      }}>
        {filterOptions.map((option) => {
          const isActive = filterStatus === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setFilterStatus(option.id)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: isActive ? '#111827' : '#f3f4f6',
                color: isActive ? '#ffffff' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '3rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <ShoppingBag size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
            No orders found
          </h3>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Header: ID, Status, Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                    #{order.orderNumber}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <User size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>
                      {order.customer?.name || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {format(new Date(order.createdAt), 'h:mm a')}
                    </span>
                    <OrderPerformanceIndicator order={order} currentTime={currentTime} />
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: `${getStatusColor(order.status)}15`,
                  color: getStatusColor(order.status),
                  textTransform: 'uppercase'
                }}>
                  {order.status.replace('-', ' ')}
                </span>
              </div>

              {/* Address (Critical Info) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={14} style={{ color: '#6b7280', marginTop: '0.125rem', flexShrink: 0 }} />
                <p style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: '1.4' }}>
                  {order.deliveryAddress 
                    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` 
                    : 'Pickup Order'}
                </p>
              </div>

              {/* Payment (Critical Info) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {renderPaymentInfo(order.paymentMethod)}
              </div>

              {/* Items Summary */}
              <div style={{ 
                fontSize: '0.8125rem', 
                color: '#6b7280', 
                backgroundColor: '#f9fafb', 
                padding: '0.5rem', 
                borderRadius: '0.375rem' 
              }}>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.pricing.total.toLocaleString('en-IN')}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto' }}>
                {renderPrimaryAction(order)}
                
                <button
                  onClick={() => handleViewDetails(order)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrderDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}