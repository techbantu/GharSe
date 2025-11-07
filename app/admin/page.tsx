/**
 * NEW FILE: Admin Dashboard - Order Management Interface
 * 
 * Purpose: Provides real-time order monitoring, status updates, and business
 * analytics for restaurant operations. Displays new order notifications.
 * 
 * Features:
 * - Real-time order queue
 * - Order status management
 * - Customer contact information
 * - Revenue and sales analytics
 * - Notification system for new orders
 * 
 * Security Note: In production, this would be protected with authentication.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Package,
  TruckIcon,
  CheckCircle,
  Clock,
  IndianRupee,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  X,
  ChefHat,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [latestOrderNumber, setLatestOrderNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch real orders from API
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const fetchedOrders = data.orders || [];
        
        // Check for new orders
        if (fetchedOrders.length > orders.length && orders.length > 0) {
          const newestOrder = fetchedOrders[0];
          setLatestOrderNumber(newestOrder.orderNumber);
          setShowNotification(true);
          setNewOrderCount(prev => prev + 1);
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => setShowNotification(false), 5000);
        }
        
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [orders.length]);
  
  // Update order status - Save to database
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Optimistically update UI
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        )
      );
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      // Save to database and trigger notifications
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        // Revert on error
        await fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      await fetchOrders();
    }
  };
  
  // Calculate stats
  const stats = {
    todayOrders: orders.length,
    todayRevenue: orders.reduce((sum, order) => sum + order.pricing.total, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    activeOrders: orders.filter(o => ['confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(o.status)).length,
  };
  
  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      'out-for-delivery': 'bg-orange-100 text-orange-800',
      delivered: 'bg-gray-100 text-gray-800',
      'picked-up': 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: ChefHat,
      ready: Package,
      'out-for-delivery': TruckIcon,
      delivered: CheckCircle,
      'picked-up': CheckCircle,
      cancelled: X,
      refunded: X,
    };
    const Icon = icons[status];
    return <Icon size={16} />;
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .admin-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            padding-top: 1.5rem !important;
            padding-bottom: 1.5rem !important;
          }
          .admin-header-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .admin-header-title {
            font-size: 1.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .admin-header-subtitle {
            font-size: 0.875rem !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .stat-card {
            padding: 1.25rem !important;
          }
          .orders-card {
            padding: 1.25rem !important;
          }
          .orders-title {
            font-size: 1.5rem !important;
            margin-bottom: 1rem !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}} />
    <div className="min-h-screen bg-gray-50">
      {/* New Order Notification */}
      {showNotification && latestOrderNumber && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm animate-bounce">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Bell size={24} />
            </div>
            <div>
              <p className="font-bold">New Order Received!</p>
              <p className="text-sm text-white/90">Order {latestOrderNumber}</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-auto p-1 hover:bg-white/20 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" style={{ padding: '1.5rem 0' }}>
        <div className="admin-header-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="admin-header-title text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="admin-header-subtitle text-white/80">Bantu's Kitchen - Order Management</p>
            </div>
            <div className="relative">
              <Bell size={28} className="cursor-pointer" />
              {newOrderCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {newOrderCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="admin-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '2rem', paddingBottom: '2rem' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
        <>
        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{stats.todayRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <IndianRupee className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-orange-600">{stats.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="orders-card" style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #f3f4f6'
        }}>
          <h2 className="orders-title text-2xl font-bold mb-6">Current Orders</h2>
          
          {orders.length === 0 ? (
            <div className="text-center" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h3>
              <p className="text-gray-500">New orders will appear here automatically</p>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => (
              <div
                key={order.id}
                style={{
                  border: '1px solid rgb(229, 231, 235)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => setSelectedOrder(order)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'rgb(17, 24, 39)', marginBottom: '8px' }}>{order.orderNumber}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgb(75, 85, 99)', marginBottom: '4px' }}>{order.customer.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>{format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(249, 115, 22)', marginBottom: '8px' }}>₹{order.pricing.total.toFixed(2)}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`} style={{ fontSize: '0.875rem', gap: '6px' }}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: 'rgb(107, 114, 128)', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {order.orderType === 'delivery' ? <TruckIcon size={14} /> : <Package size={14} />}
                    <span style={{ textTransform: 'capitalize' }}>{order.orderType}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgb(209, 213, 219)' }}>•</span>
                  <span>Ready in {Math.ceil((new Date(order.estimatedReadyTime).getTime() - Date.now()) / 60000)} min</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgb(209, 213, 219)' }}>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{order.paymentMethod.replace('-', ' ')}</span>
                </div>
                
                {order.specialInstructions && (
                  <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'rgb(107, 114, 128)', fontStyle: 'italic', paddingLeft: '12px', borderLeft: '3px solid rgb(249, 115, 22)' }}>
                    Note: {order.specialInstructions}
                  </p>
                )}
                
                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  {order.status === 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'confirmed'); }}
                      style={{
                        background: 'rgb(34, 197, 94)',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      className="hover:bg-green-600"
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'preparing'); }}
                      style={{
                        background: 'rgb(139, 92, 246)',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      className="hover:bg-purple-600"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'ready'); }}
                      style={{
                        background: 'rgb(34, 197, 94)',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      className="hover:bg-green-600"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && order.orderType === 'delivery' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'out-for-delivery'); }}
                      style={{
                        background: 'rgb(249, 115, 22)',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      className="hover:bg-orange-600"
                    >
                      Out for Delivery
                    </button>
                  )}
                  {order.status === 'out-for-delivery' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'delivered'); }}
                      style={{
                        background: 'rgb(34, 197, 94)',
                        color: 'white',
                        fontSize: '0.875rem',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      className="hover:bg-green-600"
                    >
                      Mark Delivered
                    </button>
                  )}
                  
                  <a
                    href={`tel:${order.customer.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgb(59, 130, 246)',
                      color: 'white',
                      fontSize: '0.875rem',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.2s ease',
                    }}
                    className="hover:bg-blue-600"
                  >
                    <Phone size={14} className="flex-shrink-0" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
        </>
        )}
      </div>
      
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                  <p className="text-gray-600">{format(new Date(selectedOrder.createdAt), 'MMMM d, yyyy h:mm a')}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    <a href={`tel:${selectedOrder.customer.phone}`} className="text-blue-600 hover:underline">
                      {selectedOrder.customer.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    <a href={`mailto:${selectedOrder.customer.email}`} className="text-blue-600 hover:underline">
                      {selectedOrder.customer.email}
                    </a>
                  </div>
                  {selectedOrder.deliveryAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 mt-1" />
                      <div>
                        <p>{selectedOrder.deliveryAddress.street}</p>
                        {selectedOrder.deliveryAddress.apartment && <p>{selectedOrder.deliveryAddress.apartment}</p>}
                        <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-lg mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>₹{selectedOrder.pricing.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{selectedOrder.pricing.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-orange-600">₹{selectedOrder.pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminDashboard;

