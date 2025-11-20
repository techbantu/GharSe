import React from 'react';
import { X, Printer, Phone, MapPin, CreditCard, Clock, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  menuItem: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  pricing: {
    total: number;
  };
  items: OrderItem[];
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    zipCode: string;
  };
  paymentMethod?: string;
  latitude?: number;
  longitude?: number;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#fbbf24',
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

  const updateStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Close modal and refresh orders (parent component should handle refresh, 
        // but for now we'll just close and let the auto-refresh catch it)
        onClose();
        // Ideally we should trigger a refresh callback here
        window.location.reload(); // Temporary force refresh to show new status
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const renderActionButtons = () => {
    const status = order.status.toLowerCase();
    
    switch (status) {
      case 'pending':
      case 'pending-confirmation':
        return (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => updateStatus('cancelled')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reject Order
            </button>
            <button
              onClick={() => updateStatus('confirmed')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Confirm Order
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <button
            onClick={() => updateStatus('preparing')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#a855f7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => updateStatus('ready')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mark as Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => updateStatus(order.deliveryAddress ? 'out-for-delivery' : 'delivered')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f97316',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {order.deliveryAddress ? 'Send for Delivery' : 'Mark Picked Up'}
          </button>
        );
      case 'out-for-delivery':
        return (
          <button
            onClick={() => updateStatus('delivered')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  return (
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
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              Order #{order.orderNumber}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Placed on {format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              color: '#4b5563'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Status Banner */}
          <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: `${getStatusColor(order.status)}15`,
            border: `1px solid ${getStatusColor(order.status)}30`,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(order.status)
              }} />
              <span style={{
                fontWeight: 600,
                color: getStatusColor(order.status),
                textTransform: 'uppercase',
                fontSize: '0.875rem'
              }}>
                {order.status.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Action Buttons - Prominently displayed at top */}
          {renderActionButtons() && (
            <div style={{ 
              marginBottom: '2rem', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              {renderActionButtons()}
            </div>
          )}

          {/* Customer Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Customer Details
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <User size={18} color="#4b5563" />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Name</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                    {order.customer?.name || 'Guest User'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <Phone size={18} color="#4b5563" />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phone</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                    {order.customer?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <MapPin size={18} color="#4b5563" />
                </div>
                <div style={{ width: '100%' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Delivery Address</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                    {order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.zipCode}` : 'Pickup Order'}
                  </p>
                  
                  {/* Map Preview in Modal */}
                  {((order.latitude && order.longitude) || order.deliveryAddress) && (
                    <div 
                      style={{
                        marginTop: '0.75rem',
                        width: '100%',
                        height: '160px',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => {
                        const mapCenter = (order.latitude && order.longitude) 
                          ? `${order.latitude},${order.longitude}`
                          : (order.deliveryAddress
                            ? `${encodeURIComponent(`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`)}`
                            : '');
                        window.open(`https://www.google.com/maps/search/?api=1&query=${mapCenter}`, '_blank');
                      }}
                    >
                      <img 
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${
                          (order.latitude && order.longitude) 
                            ? `${order.latitude},${order.longitude}`
                            : (order.deliveryAddress
                              ? `${encodeURIComponent(`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`)}`
                              : '')
                        }&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${
                          (order.latitude && order.longitude) 
                            ? `${order.latitude},${order.longitude}`
                            : (order.deliveryAddress
                              ? `${encodeURIComponent(`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`)}`
                              : '')
                        }&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                        alt="Delivery Location"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#374151',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        Click to open
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Order Items
            </h3>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Item</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.875rem' }}>
                  {order.items.map((item, idx) => {
                    const price = Number(item.menuItem?.price) || 0;
                    const qty = Number(item.quantity) || 0;
                    return (
                      <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>{item.menuItem?.name || 'Unknown Item'}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#4b5563' }}>{qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#4b5563' }}>₹{price.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500, color: '#111827' }}>
                          ₹{(price * qty).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                  <tr>
                    <td colSpan={3} style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>Total Amount</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#ea580c', fontSize: '1.125rem' }}>
                      ₹{Number(order.pricing?.total || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Payment Information
            </h3>
            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CreditCard size={20} color="#4b5563" />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                    {order.paymentMethod || 'Cash on Delivery'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Payment Method</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} color="#16a34a" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a' }}>
                  Paid
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: '1rem',
          borderBottomRightRadius: '1rem'
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ffffff',
              color: '#4b5563',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <Printer size={18} />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c2410c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
