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
        const token = localStorage.getItem('adminToken');
        if (!token) {
          window.location.href = '/admin/login';
          return;
        }

        const response = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.7; // Set volume to 70%
        audio.play().catch(err => console.log('Could not play sound:', err));
        console.log('🔔 New order notification sound played on dashboard');
      } catch (err) {
        console.log('Sound playback error:', err);
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders]);

  const calculateStats = (orderData: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orderData.filter((o: any) => 
      o.createdAt && o.createdAt.startsWith(today) && o.status !== 'cancelled'
    );
    
    // Safe summation with Number() and isNaN check
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => {
      const val = Number(o.total);
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

      {/* Recent Orders */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
            Recent Orders
          </h2>
          <Link 
            href="/admin/orders"
            style={{ 
              fontSize: '0.875rem', 
              color: '#ea580c', 
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            View All
          </Link>
        </div>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ marginBottom: '1rem' }}>
              <ShoppingBag size={48} style={{ color: '#9ca3af', margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#111827' }}>
              No orders yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              New orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.slice(0, 5).map((order) => (
              <div 
                key={order.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0"
                onClick={() => {
                  setSelectedOrder(order);
                  setIsModalOpen(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <ShoppingBag size={18} style={{ color: '#6b7280' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                      Order #{order.orderNumber}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {order.items.length} items • {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: `${getStatusColor(order.status)}20`,
                    color: getStatusColor(order.status)
                  }}>
                    {order.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', minWidth: '80px', textAlign: 'right' }}>
                    ₹{order.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
