/**
 * NEW FILE: Kitchen Orders - KOT (Kitchen Order Ticket) Display
 * 
 * Purpose: Beautiful, printable KOT cards for kitchen staff to view all order details.
 * Displays orders in a card format with all necessary information for food preparation.
 * 
 * Features:
 * - Real-time order fetching from API
 * - KOT card format (printable, kitchen-friendly)
 * - Order status management
 * - Customer contact information
 * - Item details with quantities
 * - Special instructions
 * - Delivery/pickup information
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Phone,
  Mail,
  MapPin,
  Package,
  CheckCircle,
  X,
  RefreshCw,
  Printer,
  Truck,
  User,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';

interface KitchenOrdersProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

const KitchenOrders: React.FC<KitchenOrdersProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/orders?status=pending,confirmed,preparing');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.orders)) {
        // Convert date strings to Date objects
        const processedOrders = data.orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          estimatedReadyTime: new Date(order.estimatedReadyTime),
        }));
        
        setOrders(processedOrders);
        setLastRefresh(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchOrders();

    if (autoRefresh) {
      const interval = setInterval(fetchOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };

  // Print KOT
  const printKOT = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const kotHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT - ${order.orderNumber}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
              max-width: 4in;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #f97316;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #f97316;
              font-weight: 800;
            }
            .header p {
              margin: 5px 0;
              font-size: 12px;
              color: #666;
            }
            .order-info {
              margin-bottom: 20px;
            }
            .order-info h2 {
              font-size: 18px;
              margin: 0 0 10px 0;
              color: #1F2937;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 14px;
            }
            .items {
              margin: 20px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .item-name {
              font-weight: 600;
            }
            .item-qty {
              color: #f97316;
              font-weight: 700;
            }
            .special-instructions {
              margin-top: 20px;
              padding: 15px;
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              font-size: 13px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 2px solid #E5E7EB;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BANTU'S KITCHEN</h1>
            <p>Kitchen Order Ticket (KOT)</p>
          </div>
          <div class="order-info">
            <h2>Order #${order.orderNumber}</h2>
            <div class="info-row">
              <span>Time:</span>
              <span>${format(order.createdAt, 'MMM d, yyyy h:mm a')}</span>
            </div>
            <div class="info-row">
              <span>Type:</span>
              <span>${order.orderType.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span>Customer:</span>
              <span>${order.customer.name}</span>
            </div>
            <div class="info-row">
              <span>Phone:</span>
              <span>${order.customer.phone}</span>
            </div>
            ${order.deliveryAddress ? `
              <div class="info-row">
                <span>Address:</span>
                <span>${order.deliveryAddress.street}, ${order.deliveryAddress.city}</span>
              </div>
            ` : ''}
          </div>
          <div class="items">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Items:</h3>
            ${order.items.map(item => `
              <div class="item">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">Qty: ${item.quantity}</span>
              </div>
            `).join('')}
          </div>
          ${order.specialInstructions ? `
            <div class="special-instructions">
              <strong>Special Instructions:</strong><br>
              ${order.specialInstructions}
            </div>
          ` : ''}
          <div class="footer">
            <p>Estimated Ready: ${format(order.estimatedReadyTime, 'h:mm a')}</p>
            <p>Total: ₹${Math.round(order.pricing.total)}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(kotHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
      confirmed: { bg: '#DBEAFE', text: '#1E40AF', border: '#60A5FA' },
      preparing: { bg: '#E9D5FF', text: '#6B21A8', border: '#A78BFA' },
      ready: { bg: '#D1FAE5', text: '#065F46', border: '#34D399' },
      'out-for-delivery': { bg: '#FED7AA', text: '#9A3412', border: '#FB923C' },
      delivered: { bg: '#E5E7EB', text: '#374151', border: '#9CA3AF' },
      'picked-up': { bg: '#E5E7EB', text: '#374151', border: '#9CA3AF' },
      cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' },
      refunded: { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' },
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: ChefHat,
      ready: Package,
      'out-for-delivery': Truck,
      delivered: CheckCircle,
      'picked-up': CheckCircle,
      cancelled: X,
      refunded: X,
    };
    const Icon = icons[status];
    return <Icon size={18} />;
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px'
      }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#f97316' }} />
        <p style={{ fontSize: '1rem', color: '#6B7280', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif' }}>
          Loading orders...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '32px',
        background: '#FEE2E2',
        borderRadius: '16px',
        border: '2px solid #F87171',
        textAlign: 'center'
      }}>
        <X size={32} style={{ color: '#DC2626', marginBottom: '12px' }} />
        <p style={{ fontSize: '1rem', color: '#991B1B', fontWeight: 600, marginBottom: '8px' }}>
          Error loading orders
        </p>
        <p style={{ fontSize: '0.875rem', color: '#7F1D1D', marginBottom: '16px' }}>
          {error}
        </p>
        <button
          onClick={fetchOrders}
          style={{
            padding: '10px 20px',
            background: '#DC2626',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Refresh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#1F2937',
            marginBottom: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            Kitchen Orders
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6B7280',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
          }}>
            Last updated: {format(lastRefresh, 'h:mm:ss a')}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white',
            borderRadius: '12px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.9375rem',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
            }
          }}
        >
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <Package size={64} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
          }}>
            No active orders
          </p>
          <p style={{
            fontSize: '0.9375rem',
            color: '#6B7280',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
          }}>
            New orders will appear here automatically
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            const StatusIcon = getStatusIcon(order.status);

            return (
              <div
                key={order.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                  border: `2px solid ${statusColor.border}`,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)';
                }}
              >
                {/* Header - Order Number & Status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#1F2937',
                      marginBottom: '4px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.02em'
                    }}>
                      {order.orderNumber}
                    </h3>
                    <p style={{
                      fontSize: '0.8125rem',
                      color: '#6B7280',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      {format(order.createdAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: statusColor.bg,
                    color: statusColor.text,
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    border: `1px solid ${statusColor.border}`
                  }}>
                    <StatusIcon size={16} />
                    <span style={{ textTransform: 'capitalize' }}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <User size={18} style={{ color: '#f97316' }} />
                    <span style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: '#1F2937',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      {order.customer.name}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} style={{ color: '#6B7280' }} />
                      <span>{order.customer.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} style={{ color: '#6B7280' }} />
                      <span>{order.customer.email}</span>
                    </div>
                    {order.deliveryAddress && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={14} style={{ color: '#6B7280', marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {order.deliveryAddress.street}
                          {order.deliveryAddress.apartment && `, ${order.deliveryAddress.apartment}`}
                          <br />
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Type */}
                <div style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  background: order.orderType === 'delivery' ? '#FEF3C7' : '#DBEAFE',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: order.orderType === 'delivery' ? '#92400E' : '#1E40AF'
                }}>
                  {order.orderType === 'delivery' ? <Truck size={16} /> : <Package size={16} />}
                  <span style={{ textTransform: 'capitalize' }}>{order.orderType}</span>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    Items:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#F9FAFB',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <span style={{
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          color: '#1F2937',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                        }}>
                          {item.name}
                        </span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#f97316',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
                        }}>
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '14px',
                    background: '#FEF3C7',
                    borderRadius: '10px',
                    borderLeft: '4px solid #F59E0B'
                  }}>
                    <p style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#92400E',
                      marginBottom: '6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      Special Instructions:
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#78350F',
                      lineHeight: '1.5',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      {order.specialInstructions}
                    </p>
                  </div>
                )}

                {/* Order Total */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                  borderRadius: '12px',
                  border: '2px solid #FED7AA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    Total:
                  </span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#f97316',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.02em'
                  }}>
                    ₹{Math.round(order.pricing.total)}
                  </span>
                </div>

                {/* Estimated Ready Time */}
                <div style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  background: '#F0FDF4',
                  borderRadius: '10px',
                  border: '1px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Clock size={18} style={{ color: '#16A34A' }} />
                  <div>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      marginBottom: '2px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      Estimated Ready:
                    </p>
                    <p style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#16A34A',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      {format(order.estimatedReadyTime, 'h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => printKOT(order)}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '12px 20px',
                      background: 'white',
                      color: '#374151',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <Printer size={16} />
                    Print KOT
                  </button>
                  
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      <CheckCircle size={16} />
                      Confirm
                    </button>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                      }}
                    >
                      <ChefHat size={16} />
                      Start Cooking
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <Package size={16} />
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          [data-kitchen-orders] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default KitchenOrders;

