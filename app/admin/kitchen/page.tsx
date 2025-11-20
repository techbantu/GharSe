'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ChefHat } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  name: string;
  quantity: number;
  specialInstructions?: string;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
  estimatedReadyTime?: string;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Filter for active kitchen orders
            const kitchenOrders = data.orders.filter((o: any) => 
              ['confirmed', 'preparing'].includes(o.status)
            );
            setOrders(kitchenOrders);
          }
        }
      } catch (error) {
        console.error('Error fetching kitchen orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    // In a real app, call API to update status
    // For now, update local state
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ).filter(o => newStatus !== 'ready')); // Remove from KDS if ready (optional workflow)
    
    alert(`Order ${orderId} marked as ${newStatus}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Kitchen Display System</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Real-time order queue for kitchen staff
          </p>
        </div>
        <div style={{ 
          padding: '0.5rem 1rem', 
          backgroundColor: '#fff7ed', 
          color: '#c2410c', 
          borderRadius: '0.5rem',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ChefHat size={18} />
          {orders.length} Active Orders
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '4rem 2rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <CheckCircle size={64} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>All caught up!</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            No active orders in the kitchen queue.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {orders.map((order) => (
            <div 
              key={order.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ 
                padding: '1rem', 
                backgroundColor: order.status === 'preparing' ? '#fff7ed' : '#f3f4f6',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                    #{order.orderNumber}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Clock size={14} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {format(new Date(order.createdAt), 'h:mm a')}
                    </span>
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: order.status === 'preparing' ? '#ea580c' : '#3b82f6',
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  {order.status}
                </span>
              </div>

              <div style={{ padding: '1rem', flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ 
                        backgroundColor: '#f3f4f6', 
                        color: '#111827', 
                        fontWeight: 700, 
                        width: '1.5rem', 
                        height: '1.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        flexShrink: 0
                      }}>
                        {item.quantity}
                      </span>
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
                          {item.menuItem?.name || item.name}
                        </span>
                        {item.specialInstructions && (
                          <div style={{ 
                            marginTop: '0.25rem', 
                            padding: '0.5rem', 
                            backgroundColor: '#fef2f2', 
                            color: '#b91c1c', 
                            fontSize: '0.75rem',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            gap: '0.375rem',
                            alignItems: 'flex-start'
                          }}>
                            <AlertCircle size={12} style={{ marginTop: '2px' }} />
                            {item.specialInstructions}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem' }}>
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus(order.id, 'preparing')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateStatus(order.id, 'ready')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
