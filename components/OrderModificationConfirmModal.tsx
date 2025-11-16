/**
 * NEW FILE: Order Modification Confirmation Modal
 * 
 * Purpose: Confirmation dialog before adding items to existing orders
 * Ensures customers confirm changes and understand payment implications
 * 
 * Features:
 * - Shows current order total vs new total
 * - Lists items being added
 * - Payment method display
 * - Clear confirmation action
 */

'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, ShoppingBag, Plus } from 'lucide-react';

interface OrderModificationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    paymentMethod?: string;
  };
  itemsToAdd: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  newTotal: number;
  newSubtotal: number;
  newTax: number;
  onConfirm: () => Promise<void>;
}

export default function OrderModificationConfirmModal({
  isOpen,
  onClose,
  order,
  itemsToAdd,
  newTotal,
  newSubtotal,
  newTax,
  onConfirm,
}: OrderModificationConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const priceDifference = newTotal - order.total;
  const hasPriceIncrease = priceDifference > 0;

  const handleConfirm = async () => {
    setError('');
    setLoading(true);

    try {
      await onConfirm();
      // Modal will be closed by parent component after success
    } catch (err: any) {
      setError(err.message || 'Failed to update order. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShoppingBag size={24} color="#F97316" />
              Confirm Order Changes
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px',
                border: 'none',
                background: 'transparent',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={20} color="#6B7280" />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Order Info */}
            <div
              style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  Order Number:
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: '0.875rem',
                  }}
                >
                  #{order.orderNumber}
                </span>
              </div>
              {order.paymentMethod && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    Payment Method:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#111827',
                      fontSize: '0.875rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {order.paymentMethod.replace(/-/g, ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Items Being Added */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} color="#10B981" />
                Items Being Added:
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {itemsToAdd.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#111827',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          marginTop: '2px',
                        }}
                      >
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: '#10B981',
                      }}
                    >
                      +₹{(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Comparison */}
            <div
              style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  color: '#6B7280',
                }}
              >
                <span>Current Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  color: '#6B7280',
                }}
              >
                <span>New Subtotal:</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  ₹{newSubtotal.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  color: '#6B7280',
                }}
              >
                <span>Tax:</span>
                <span>₹{newTax.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  color: '#6B7280',
                }}
              >
                <span>Delivery Fee:</span>
                <span>₹{order.deliveryFee.toFixed(2)}</span>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '2px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Current Total:
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#6B7280',
                    textDecoration: 'line-through',
                  }}
                >
                  ₹{order.total.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  New Total:
                </span>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: hasPriceIncrease ? '#10B981' : '#111827',
                  }}
                >
                  ₹{newTotal.toFixed(2)}
                </span>
              </div>
              {hasPriceIncrease && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p
                      style={{
                        color: '#92400E',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        margin: '0 0 4px 0',
                      }}
                    >
                      Additional Payment Required
                    </p>
                    <p
                      style={{
                        color: '#92400E',
                        fontSize: '0.8125rem',
                        margin: 0,
                      }}
                    >
                      You will need to pay an additional ₹{priceDifference.toFixed(2)} for the added items.
                      {order.paymentMethod?.toLowerCase().includes('cash') && ' Please have cash ready for delivery.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '12px',
                  background: '#FEE2E2',
                  border: '1px solid #EF4444',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} color="#EF4444" />
                <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
              }}
            >
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'white',
                  color: '#6B7280',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: loading
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirm Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

