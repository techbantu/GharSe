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
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
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
  deliveryAddress?: Address;
  contactPreference: ('email' | 'sms')[];
  notifications: OrderNotification[];
  latitude?: number;
  longitude?: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevOrderCountRef = useRef(0);

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#fbbf24',
      'pending-confirmation': '#fbbf24',
      'confirmed': '#3b82f6',
      'preparing': '#a855f7',
      'ready': '#10b981',
      'out-for-delivery': '#f97316',
      'delivered': '#16a34a',
      'cancelled': '#ef4444',
      'refunded': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const filterOptions = [
    { id: 'all', label: 'All Orders', color: '#6b7280' },
    { id: 'pending', label: 'Pending', color: '#fbbf24' },
    { id: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
    { id: 'preparing', label: 'Preparing', color: '#a855f7' },
    { id: 'ready', label: 'Ready', color: '#10b981' },
    { id: 'out-for-delivery', label: 'Out for Delivery', color: '#f97316' },
    { id: 'delivered', label: 'Delivered', color: '#16a34a' },
    { id: 'cancelled', label: 'Cancelled', color: '#ef4444' },
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

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilterStatus(option.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: filterStatus === option.id ? option.color : '#ffffff',
              color: filterStatus === option.id ? '#ffffff' : '#374151',
              border: filterStatus === option.id ? 'none' : '1px solid #e5e7eb',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: filterStatus === option.id ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            {option.label}
            {option.id !== 'all' && (
              <span style={{ 
                marginLeft: '0.5rem', 
                fontSize: '0.75rem', 
                opacity: 0.8,
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px'
              }}>
                {orders.filter(o => o.status === option.id).length}
              </span>
            )}
          </button>
        ))}
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
                    marginTop: '0.25rem'
                  }}>
                    <Clock size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a') : 'Date unknown'}
                    </span>
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

              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    style={{
                      padding: '0.625rem 2rem 0.625rem 1rem',
                      backgroundColor: '#fff7ed',
                      color: '#ea580c',
                      border: '1px solid #ffedd5',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ea580c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      transition: 'all 0.2s'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out-for-delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button
                  onClick={() => handleViewDetails(order)}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
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
