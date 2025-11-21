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
  Zap
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

// Real-time elapsed time component
function OrderElapsedTime({ order, currentTime }: { order: Order; currentTime: Date }) {
  const [elapsed, setElapsed] = useState<string>('');
  const [timeInStatus, setTimeInStatus] = useState<string>('');
  
  useEffect(() => {
    if (!order.createdAt) return;
    
    const updateTimes = () => {
      const createdAt = new Date(order.createdAt);
      const totalSeconds = differenceInSeconds(currentTime, createdAt);
      
      // Total elapsed time
      if (totalSeconds < 60) {
        setElapsed(`${totalSeconds}s`);
      } else if (totalSeconds < 3600) {
        const minutes = Math.floor(totalSeconds / 60);
        setElapsed(`${minutes}m`);
      } else {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        setElapsed(`${hours}h ${minutes}m`);
      }
      
      // Time in current status
      const getStatusStartTime = () => {
        switch (order.status) {
          case 'confirmed':
            return order.confirmedAt ? new Date(order.confirmedAt) : createdAt;
          case 'preparing':
            return order.preparingAt ? new Date(order.preparingAt) : (order.confirmedAt ? new Date(order.confirmedAt) : createdAt);
          case 'ready':
            return order.readyAt ? new Date(order.readyAt) : createdAt;
          case 'out-for-delivery':
            return order.readyAt ? new Date(order.readyAt) : createdAt;
          default:
            return createdAt;
        }
      };
      
      const statusStart = getStatusStartTime();
      const statusSeconds = differenceInSeconds(currentTime, statusStart);
      
      if (statusSeconds < 60) {
        setTimeInStatus(`${statusSeconds}s`);
      } else {
        const minutes = Math.floor(statusSeconds / 60);
        setTimeInStatus(`${minutes}m`);
      }
    };
    
    updateTimes();
  }, [order, currentTime]);
  
  if (!elapsed) return null;
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      marginTop: '0.25rem',
      fontSize: '0.75rem',
      color: '#6b7280'
    }}>
      <Timer size={12} style={{ color: '#9ca3af' }} />
      <span style={{ fontWeight: 600, color: '#374151' }}>{elapsed}</span>
      {timeInStatus && order.status !== 'pending' && order.status !== 'pending-confirmation' && (
        <>
          <span style={{ color: '#d1d5db' }}>•</span>
          <span style={{ color: '#9ca3af' }}>In {order.status}: {timeInStatus}</span>
        </>
      )}
    </div>
  );
}

// Performance indicator component
function OrderPerformanceIndicator({ order, currentTime }: { order: Order; currentTime: Date }) {
  const metrics = calculateOrderPerformance(order);
  
  if (order.status === 'cancelled') return null;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.625rem',
      borderRadius: '0.5rem',
      backgroundColor: `${metrics.performanceColor}15`,
      border: `1px solid ${metrics.performanceColor}40`,
      fontSize: '0.75rem',
      fontWeight: 600,
      color: metrics.performanceColor,
    }}>
      {metrics.performanceIcon}
      <span>{metrics.performanceText}</span>
    </div>
  );
}

// Calculate order performance metrics
function calculateOrderPerformance(order: Order) {
  const now = new Date();
  const createdAt = new Date(order.createdAt);
  const totalElapsed = differenceInMinutes(now, createdAt);
  
  // Get status start time
  const getStatusStartTime = () => {
    switch (order.status) {
      case 'confirmed':
        return order.confirmedAt ? new Date(order.confirmedAt) : createdAt;
      case 'preparing':
        return order.preparingAt ? new Date(order.preparingAt) : (order.confirmedAt ? new Date(order.confirmedAt) : createdAt);
      case 'ready':
        return order.readyAt ? new Date(order.readyAt) : createdAt;
      case 'out-for-delivery':
        return order.readyAt ? new Date(order.readyAt) : createdAt;
      case 'delivered':
        return order.deliveredAt ? new Date(order.deliveredAt) : createdAt;
      default:
        return createdAt;
    }
  };
  
  const statusStartTime = getStatusStartTime();
  const timeInStatus = differenceInMinutes(now, statusStartTime);
  
  // Calculate performance
  let performance: 'fast' | 'on-time' | 'slow' | 'late' = 'on-time';
  let performanceColor = '#10b981'; // Green
  let performanceIcon = <TrendingUp size={14} />;
  let performanceText = 'On Time';
  
  if (order.status === 'delivered' && order.deliveredAt) {
    const deliveredAt = new Date(order.deliveredAt);
    const totalTime = differenceInMinutes(deliveredAt, createdAt);
    const estimatedTime = order.estimatedPrepTime || 40; // Default 40 minutes
    
    if (totalTime < estimatedTime * 0.8) {
      performance = 'fast';
      performanceColor = '#10b981';
      performanceIcon = <Zap size={14} />;
      performanceText = 'Fast Delivery';
    } else if (totalTime <= estimatedTime * 1.2) {
      performance = 'on-time';
      performanceColor = '#10b981';
      performanceIcon = <CheckCircle size={14} />;
      performanceText = 'On Time';
    } else if (totalTime <= estimatedTime * 1.5) {
      performance = 'slow';
      performanceColor = '#f59e0b';
      performanceIcon = <Clock size={14} />;
      performanceText = 'Slightly Slow';
    } else {
      performance = 'late';
      performanceColor = '#ef4444';
      performanceIcon = <TrendingDown size={14} />;
      performanceText = 'Late Delivery';
    }
  } else if (order.status !== 'delivered' && order.status !== 'cancelled') {
    // For active orders, check if they're taking longer than expected
    const estimatedTime = order.estimatedPrepTime || 40;
    const expectedCompletion = new Date(createdAt.getTime() + estimatedTime * 60000);
    
    if (now > expectedCompletion) {
      const delay = differenceInMinutes(now, expectedCompletion);
      if (delay > 20) {
        performance = 'late';
        performanceColor = '#ef4444';
        performanceIcon = <TrendingDown size={14} />;
        performanceText = `${delay}m Overdue`;
      } else {
        performance = 'slow';
        performanceColor = '#f59e0b';
        performanceIcon = <Clock size={14} />;
        performanceText = `${delay}m Overdue`;
      }
    } else {
      const remaining = differenceInMinutes(expectedCompletion, now);
      if (remaining < 10) {
        performance = 'slow';
        performanceColor = '#f59e0b';
        performanceIcon = <Clock size={14} />;
        performanceText = `${remaining}m Remaining`;
      } else {
        performance = 'on-time';
        performanceColor = '#10b981';
        performanceIcon = <CheckCircle size={14} />;
        performanceText = `${remaining}m Remaining`;
      }
    }
  }
  
  return {
    totalElapsed,
    timeInStatus,
    performance,
    performanceColor,
    performanceIcon,
    performanceText,
  };
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
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('📦 Orders fetched:', data.orders.map((o: any) => ({ 
            id: o.id, 
            lat: o.latitude, 
            lng: o.longitude, 
            address: o.deliveryAddress 
          })));
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

  // Update current time every second for real-time metrics
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Play sound notification when new orders arrive
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      // New order detected - play sound
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.7; // Set volume to 70%
        audio.play().catch(err => console.log('Could not play sound:', err));
        console.log('🔔 New order notification sound played');
      } catch (err) {
        console.log('Sound playback error:', err);
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders]);

  // Food-themed status colors matching website palette
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#f59e0b', // Warm amber (waiting)
      'pending-confirmation': '#f59e0b', // Warm amber
      'confirmed': '#f97316', // Orange (order confirmed)
      'preparing': '#ea580c', // Deep orange/red (cooking - like fire)
      'ready': '#fbbf24', // Golden yellow (ready to serve)
      'out-for-delivery': '#fb923c', // Warm orange (on the way)
      'delivered': '#10b981', // Fresh green (delivered successfully)
      'cancelled': '#dc2626', // Deep red (cancelled)
      'refunded': '#dc2626' // Deep red (refunded)
    };
    return colors[status] || '#6b7280';
  };

  // Get next logical status based on current status (workflow-based)
  // Using food-themed colors matching website palette
  const getNextActions = (currentStatus: string): { status: string; label: string; color: string; icon?: string }[] => {
    const statusWorkflow: Record<string, { status: string; label: string; color: string }[]> = {
      'pending': [
        { status: 'confirmed', label: 'Confirm Order', color: '#f97316' }, // Orange
      ],
      'confirmed': [
        { status: 'preparing', label: 'Start Preparing', color: '#ea580c' }, // Deep orange/red (cooking)
      ],
      'preparing': [
        { status: 'ready', label: 'Mark as Ready', color: '#fbbf24' }, // Golden yellow
      ],
      'ready': [
        { status: 'out-for-delivery', label: 'Out for Delivery', color: '#fb923c' }, // Warm orange
      ],
      'out-for-delivery': [
        { status: 'delivered', label: 'Mark Delivered', color: '#10b981' }, // Fresh green
      ],
      'delivered': [],
      'cancelled': [],
    };

    return statusWorkflow[currentStatus] || [];
  };

  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);

  // Food-themed colors matching website palette
  const filterOptions = [
    { id: 'all', label: 'All Orders', color: '#6b7280' }, // Neutral gray
    { id: 'pending', label: 'Pending', color: '#f59e0b' }, // Warm amber (waiting)
    { id: 'confirmed', label: 'Confirmed', color: '#f97316' }, // Orange (order confirmed)
    { id: 'preparing', label: 'Preparing', color: '#ea580c' }, // Deep orange/red (cooking - like fire)
    { id: 'ready', label: 'Ready', color: '#fbbf24' }, // Golden yellow (ready to serve)
    { id: 'out-for-delivery', label: 'Out for Delivery', color: '#fb923c' }, // Warm orange (on the way)
    { id: 'delivered', label: 'Delivered', color: '#10b981' }, // Fresh green (delivered successfully)
    { id: 'cancelled', label: 'Cancelled', color: '#dc2626' }, // Deep red (cancelled)
  ];

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus as OrderStatus } : order
      ));

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
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
          Track and manage all customer orders in real-time
        </p>
      </div>
      
      {/* Rich Filter Pills */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        overflowX: 'auto', 
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="hide-scrollbar">
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        {filterOptions.map((option) => {
          const isActive = filterStatus === option.id;
          // For "All Orders", use neutral gray, otherwise use food-themed colors
          const bgColor = option.id === 'all' 
            ? (isActive ? '#6b7280' : '#f3f4f6')
            : (isActive ? option.color : `${option.color}20`); // 20% opacity when inactive
          const textColor = option.id === 'all'
            ? (isActive ? '#ffffff' : '#374151')
            : (isActive ? '#ffffff' : option.color); // Full color text when inactive
          
          return (
            <button
              key={option.id}
              onClick={() => setFilterStatus(option.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: bgColor,
                color: textColor,
                border: isActive ? 'none' : `2px solid ${option.id === 'all' ? '#e5e7eb' : option.color}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = option.id === 'all' ? '#e5e7eb' : `${option.color}30`;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = bgColor;
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {option.label}
              {option.id !== 'all' && (
                <span style={{ 
                  marginLeft: '0.5rem', 
                  fontSize: '0.75rem', 
                  opacity: isActive ? 0.9 : 0.8,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${option.color}40`,
                  color: isActive ? '#ffffff' : option.color,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}>
                  {orders.filter(o => o.status === option.id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '4rem 2rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <ShoppingBag size={64} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
            No orders found
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {filterStatus === 'all' 
              ? 'New orders will appear here automatically.'
              : `No ${filterStatus} orders at the moment.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                    Order #{order.orderNumber}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginTop: '0.25rem',
                    flexWrap: 'wrap'
                  }}>
                    <Clock size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a') : 'Date unknown'}
                    </span>
                    {/* Real-time elapsed time */}
                    {order.createdAt && (
                      <OrderElapsedTime order={order} currentTime={currentTime} />
                    )}
                  </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <User size={20} color="#4b5563" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {order.customer?.name || order.customer?.email || 'Guest User'}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customer?.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MapPin size={16} color="#9ca3af" />
                <div className="text-sm text-gray-600 mt-1">
                  {order.deliveryAddress ? (
                    <>
                      <p>{order.deliveryAddress.street}</p>
                      <p>{order.deliveryAddress.city}, {order.deliveryAddress.zipCode}</p>
                      {/* Map Preview */}
                      {/* Map Preview */}
                      {((order.latitude && order.longitude) || order.deliveryAddress) && (
                        <div 
                          className="mt-2 w-full h-40 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            const query = (order.latitude && order.longitude) 
                              ? `${order.latitude},${order.longitude}`
                              : `${encodeURIComponent(`${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`)}`;
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                          }}
                        >
                          <img 
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${
                              (order.latitude && order.longitude) 
                                ? `${order.latitude},${order.longitude}`
                                : `${encodeURIComponent(`${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`)}`
                            }&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${
                              (order.latitude && order.longitude) 
                                ? `${order.latitude},${order.longitude}`
                                : `${encodeURIComponent(`${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`)}`
                            }&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt="Delivery Location"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1 rounded-full text-xs font-medium shadow-sm text-gray-700 transform translate-y-2 group-hover:translate-y-0 transition-all">
                              Open in Maps
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="italic text-gray-400">Pickup Order</span>
                  )}
                </div>
              </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-end',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: `${getStatusColor(order.status)}20`,
                    color: getStatusColor(order.status),
                    textTransform: 'uppercase'
                  }}>
                    {order.status.replace('-', ' ')}
                  </span>
                  {/* Performance indicator */}
                  <OrderPerformanceIndicator order={order} currentTime={currentTime} />
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                    ₹{Number(order.pricing?.total || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  Items ({order.items?.length || 0})
                </p>
                {order.items?.map((item: any, idx: number) => {
                  const price = Number(item.menuItem?.price) || 0;
                  const qty = Number(item.quantity) || 0;
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginTop: idx > 0 ? '0.25rem' : 0
                    }}>
                      <span>{qty}x {item.menuItem?.name || 'Unknown Item'}</span>
                      <span>₹{(price * qty).toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons - Contextual based on current status */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Next Action Buttons */}
                {getNextActions(order.status).map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusUpdate(order.id, action.status)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: action.color,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <CheckCircle size={16} />
                    {action.label}
                  </button>
                ))}

                {/* View Details Button */}
                <button
                  onClick={() => handleViewDetails(order)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#ffffff',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  View Details
                </button>

                {/* Cancel Button - Only show for active orders */}
                {!['delivered', 'cancelled'].includes(order.status) && (
                  <button
                    onClick={() => setShowCancelDialog(order.id)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#ffffff',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                      e.currentTarget.style.borderColor = '#f87171';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                  >
                    <XCircle size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Cancel Confirmation Dialog */}
              {showCancelDialog === order.id && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                      }}>
                        <AlertCircle size={24} style={{ color: '#ef4444' }} />
                      </div>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 700, 
                        color: '#111827',
                        textAlign: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        Cancel Order #{order.orderNumber}?
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        This action cannot be undone. The customer will be notified.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => setShowCancelDialog(null)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#ffffff',
                          color: '#6b7280',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Keep Order
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(order.id, 'cancelled');
                          setShowCancelDialog(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Yes, Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
