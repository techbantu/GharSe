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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('out-of-stock');

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
            // Filter for active kitchen orders - INCLUDE pending-confirmation, confirmed, and preparing
            const kitchenOrders = data.orders.filter((o: any) => 
              ['pending-confirmation', 'pending', 'confirmed', 'preparing'].includes(o.status)
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
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      // Call API to update order status
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: newStatus } : o
        ).filter(o => newStatus !== 'ready')); // Remove from KDS if marked ready
        
        console.log(`Order ${orderId} status updated to ${newStatus}`);
      } else {
        console.error('Failed to update order status');
        alert('Failed to update order status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowRejectModal(true);
  };

  const confirmRejectOrder = async () => {
    if (!selectedOrderId) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      // Call API to reject order with reason
      const response = await fetch(`/api/orders/${selectedOrderId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.ok) {
        // Remove order from local state
        setOrders(prev => prev.filter(o => o.id !== selectedOrderId));
        setShowRejectModal(false);
        setSelectedOrderId(null);
        console.log(`Order ${selectedOrderId} rejected with reason: ${rejectionReason}`);
      } else {
        console.error('Failed to reject order');
        alert('Failed to reject order. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order. Please try again.');
    }
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
                backgroundColor: 
                  order.status === 'preparing' ? '#fff7ed' : 
                  order.status === 'pending-confirmation' || order.status === 'pending' ? '#fef3c7' : 
                  '#f3f4f6',
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
                  backgroundColor: 
                    order.status === 'preparing' ? '#ea580c' : 
                    order.status === 'pending-confirmation' || order.status === 'pending' ? '#f59e0b' : 
                    '#3b82f6',
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  {order.status.replace('-', ' ')}
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
                {(order.status === 'pending-confirmation' || order.status === 'pending') && (
                  <>
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'confirmed')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    >
                      Confirm Order
                    </button>
                  </>
                )}
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c2410c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
              Reject Order
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Please select a reason for rejecting this order. The customer will be notified via email.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                Rejection Reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="out-of-stock">Item(s) Out of Stock</option>
                <option value="kitchen-closed">Kitchen Closed</option>
                <option value="too-busy">Too Busy / High Order Volume</option>
                <option value="delivery-unavailable">Delivery Unavailable to Address</option>
                <option value="payment-issue">Payment Issue</option>
                <option value="other">Other Reason</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedOrderId(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectOrder}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
