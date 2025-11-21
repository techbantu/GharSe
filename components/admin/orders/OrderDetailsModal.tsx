import React, { useState } from 'react';
import { X, Printer, Phone, MapPin, CreditCard, Clock, CheckCircle, User, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showMap, setShowMap] = useState(false);
  
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

  // Calculate pricing breakdown
  const calculatePricing = () => {
    const subtotal = order.items.reduce((sum, item) => {
      return sum + (Number(item.menuItem?.price || 0) * Number(item.quantity || 0));
    }, 0);
    
    // GST/Tax calculation (assuming 5% GST)
    const taxRate = 0.05;
    const taxAmount = subtotal * taxRate;
    
    // Delivery fee (if applicable)
    const deliveryFee = order.deliveryAddress ? 50 : 0;
    
    const total = subtotal + taxAmount + deliveryFee;
    
    return {
      subtotal,
      taxAmount,
      deliveryFee,
      total
    };
  };

  const pricing = calculatePricing();

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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => updateStatus('cancelled')}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Reject
            </button>
            <button
              onClick={() => updateStatus('confirmed')}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Confirm
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <button
            onClick={() => updateStatus('preparing')}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: '#a855f7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
              padding: '0.375rem 0.75rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
              padding: '0.375rem 0.75rem',
              backgroundColor: '#f97316',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {order.deliveryAddress ? 'Out for Delivery' : 'Picked Up'}
          </button>
        );
      case 'out-for-delivery':
        return (
          <button
            onClick={() => updateStatus('delivered')}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
        {/* Header - Compact */}
        <div style={{
          padding: '1rem',
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
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              Order #{order.orderNumber}
            </h2>
            <p style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.125rem' }}>
              {format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.375rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem' }}>
          {/* Status Banner & Action - Compact */}
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: `${getStatusColor(order.status)}15`,
            border: `1px solid ${getStatusColor(order.status)}30`,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(order.status)
              }} />
              <span style={{
                fontWeight: 600,
                color: getStatusColor(order.status),
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em'
              }}>
                {order.status.replace('-', ' ')}
              </span>
            </div>
            {renderActionButtons()}
          </div>

          {/* Customer Details - Compact 2-Column Grid */}
          <div style={{ 
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              fontSize: '0.75rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <User size={12} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Customer</span>
                </div>
                <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {order.customer?.name || 'Guest User'}
                </p>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <Phone size={12} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Phone</span>
                </div>
                <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {order.customer?.phone || 'Not provided'}
                </p>
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <MapPin size={12} color="#6b7280" />
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Address</span>
                </div>
                <p style={{ color: '#111827', fontWeight: 600, fontSize: '0.8125rem', lineHeight: '1.3' }}>
                  {order.deliveryAddress 
                    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.zipCode}` 
                    : 'Pickup Order'}
                </p>
                
                {/* Collapsible Map */}
                {((order.latitude && order.longitude) || order.deliveryAddress) && (
                  <>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        color: '#4b5563',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {showMap ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {showMap ? 'Hide Map' : 'Show Map'}
                    </button>
                    
                    {showMap && (
                      <div 
                        style={{
                          marginTop: '0.5rem',
                          width: '100%',
                          height: '120px',
                          borderRadius: '0.375rem',
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
                          bottom: '0.375rem',
                          right: '0.375rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: 500,
                          color: '#374151',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                          Click to open
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Items - Compact Table */}
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
              Order Items
            </h3>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.6875rem', color: '#6b7280', fontWeight: 600 }}>Item</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '0.6875rem', color: '#6b7280', fontWeight: 600, width: '50px' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.6875rem', color: '#6b7280', fontWeight: 600, width: '80px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const price = Number(item.menuItem?.price) || 0;
                    const qty = Number(item.quantity) || 0;
                    return (
                      <tr key={idx} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#111827' }}>
                          {item.menuItem?.name || 'Unknown Item'}
                          <span style={{ fontSize: '0.6875rem', color: '#9ca3af', marginLeft: '0.25rem' }}>
                            @₹{price}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#4b5563', fontWeight: 600 }}>
                          {qty}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                          ₹{(price * qty).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Breakdown Card - Beautiful & Compact */}
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #fff5f0 0%, #fff9f5 100%)',
            borderRadius: '0.5rem',
            border: '1px solid #fed7aa',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#111827', 
              marginBottom: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              <CreditCard size={14} color="#ea580c" />
              Order Summary
            </h3>
            
            <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 500 }}>₹{pricing.subtotal.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  GST (5%)
                </span>
                <span style={{ fontWeight: 500 }}>₹{pricing.taxAmount.toFixed(2)}</span>
              </div>
              
              {pricing.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Delivery Fee</span>
                  <span style={{ fontWeight: 500 }}>₹{pricing.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ 
                height: '1px', 
                backgroundColor: '#fed7aa', 
                margin: '0.375rem 0'
              }} />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 700,
                fontSize: '1rem',
                color: '#ea580c'
              }}>
                <span>Total Amount</span>
                <span>₹{pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info - Compact */}
          <div style={{ 
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={14} color="#4b5563" />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827' }}>
                  {order.paymentMethod || 'Cash on Delivery'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <CheckCircle size={14} color="#16a34a" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: '1rem',
          borderBottomRightRadius: '1rem'
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              color: '#4b5563',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
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
