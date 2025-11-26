'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign, Users, TrendingUp, ShoppingBag, Package, Clock
} from 'lucide-react';
import OrderDetailsModal from '@/components/admin/orders/OrderDetailsModal';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevOrderCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    activeOrders: 0
  });

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Use credentials: 'include' to send httpOnly cookies
        const response = await fetch('/api/orders', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOrders(data.orders as any[]);
            calculateStats(data.orders);
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Play sound notification when new orders arrive
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      // New order detected - play sound
      console.log(`🔔 NEW ORDER ALERT on Dashboard! Order count: ${prevOrderCountRef.current} → ${orders.length}`);
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 1.0; // Set volume to 100% for maximum audibility
        audio.play()
          .then(() => console.log('✅ Dashboard notification sound played successfully'))
          .catch(err => console.log('❌ Could not play sound:', err));
      } catch (err) {
        console.log('❌ Sound playback error:', err);
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders]);

  const calculateStats = (orderData: any[]) => {
    // Use local date, not UTC
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    console.log('🔍 Revenue Debug:', {
      today,
      totalOrders: orderData.length,
      sampleDates: orderData.slice(0, 3).map(o => ({ id: o.orderNumber, createdAt: o.createdAt, status: o.status }))
    });
    
    const todayOrders = orderData.filter((o: any) => 
      o.createdAt && o.createdAt.startsWith(today) && o.status !== 'cancelled'
    );
    
    console.log('📊 Today\'s Orders:', todayOrders.length, todayOrders.map(o => ({ 
      id: o.orderNumber, 
      total: o.total,
      pricingTotal: o.pricing?.total,
      status: o.status 
    })));
    
    // Safe summation with Number() and isNaN check
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => {
      // Try both o.total and o.pricing.total
      const val = Number(o.pricing?.total || o.total || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const activeOrders = orderData.filter((o: any) => 
      !['delivered', 'cancelled', 'refunded'].includes(o.status)
    ).length;

    // Get unique customer count (simplified - count unique IDs)
    const uniqueCustomers = new Set(orderData.map(o => o.id ? o.id.substring(0, 8) : 'unknown')).size;

    // Calculate average with proper zero check
    const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

    setStats({
      todayRevenue: isNaN(todayRevenue) ? 0 : todayRevenue,
      todayOrders: todayOrders.length,
      totalCustomers: uniqueCustomers,
      averageOrderValue: isNaN(avgOrderValue) ? 0 : avgOrderValue,
      activeOrders
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#fbbf24',
      'pending-confirmation': '#fbbf24',
      'confirmed': '#3b82f6',
      'preparing': '#a855f7',
      'ready': '#10b981',
      'out-for-delivery': '#f97316',
      'delivered': '#6b7280',
      'cancelled': '#ef4444',
      'refunded': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
      }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: '#111827' 
        }}>
          Dashboard Overview
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Welcome back, here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }} className="flex flex-col justify-between">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280' }}>
              Today's Revenue
            </p>
            <div style={{
              padding: '0.375rem',
              borderRadius: '0.375rem',
              backgroundColor: '#dcfce7',
              color: '#166534'
            }}>
              <DollarSign size={16} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            ₹{(stats.todayRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </h3>
        </div>
        
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }} className="flex flex-col justify-between">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280' }}>
              Active Orders
            </p>
            <div style={{
              padding: '0.375rem',
              borderRadius: '0.375rem',
              backgroundColor: '#fed7aa',
              color: '#9a3412'
            }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            {stats.activeOrders}
          </h3>
        </div>
        
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }} className="flex flex-col justify-between">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280' }}>
              Total Customers
            </p>
            <div style={{
              padding: '0.375rem',
              borderRadius: '0.375rem',
              backgroundColor: '#dbeafe',
              color: '#1e40af'
            }}>
              <Users size={16} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            {stats.totalCustomers}
          </h3>
        </div>
        
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }} className="flex flex-col justify-between">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280' }}>
              Avg. Order Value
            </p>
            <div style={{
              padding: '0.375rem',
              borderRadius: '0.375rem',
              backgroundColor: '#e9d5ff',
              color: '#6b21a8'
            }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            ₹{Math.round(stats.averageOrderValue || 0).toLocaleString('en-IN')}
          </h3>
        </div>
      </div>

      {/* Recent Orders - Compact Mobile-First Design */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1rem',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
            Recent Orders
          </h2>
          <Link 
            href="/admin/orders"
            style={{ 
              fontSize: '0.8125rem', 
              color: '#ea580c', 
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            View All →
          </Link>
        </div>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <ShoppingBag size={40} style={{ color: '#d1d5db', margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              No orders yet
            </p>
          </div>
        ) : (
          <>
            {/* 2-Column Grid - Mobile & Desktop */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.625rem'
              }}
            >
              {orders.slice(0, 8).map((order) => (
                <div 
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsModalOpen(true);
                  }}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '0.625rem',
                    border: `2px solid ${getStatusColor(order.status)}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                >
                  {/* Status Badge - Top Right */}
                  <span style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '9999px',
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    backgroundColor: getStatusColor(order.status),
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                  }}>
                    {order.status === 'out-for-delivery' ? 'OUT' : 
                     order.status === 'pending-confirmation' ? 'NEW' :
                     order.status === 'delivered' ? 'DONE' :
                     order.status.split('-')[0].substring(0, 4).toUpperCase()}
                  </span>

                  {/* Order Number */}
                  <p style={{ 
                    fontSize: '0.8125rem', 
                    fontWeight: 800, 
                    color: '#111827',
                    marginBottom: '0.125rem'
                  }}>
                    #{order.orderNumber.replace('BK-', '')}
                  </p>
                  
                  {/* Time */}
                  <p style={{ 
                    fontSize: '0.625rem', 
                    color: '#9ca3af',
                    marginBottom: '0.5rem'
                  }}>
                    {format(new Date(order.createdAt), 'h:mm a')}
                  </p>

                  {/* Items + Total Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.375rem',
                    borderTop: `1px dashed ${getStatusColor(order.status)}40`
                  }}>
                    <span style={{ 
                      fontSize: '0.625rem', 
                      color: '#6b7280',
                      fontWeight: 500
                    }}>
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: getStatusColor(order.status)
                    }}>
                      ₹{order.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <OrderDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
