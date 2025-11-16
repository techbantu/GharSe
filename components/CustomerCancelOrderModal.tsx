/**
 * NEW FILE: Customer Cancel Order Modal
 * 
 * Purpose: Customer-facing modal for cancelling orders before they reach OUT_FOR_DELIVERY status
 * 
 * Features:
 * - Simple reason selection
 * - Refund information display
 * - Clear cancellation rules
 * - Loading and error states
 */

'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';

interface CustomerCancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod?: string; // NEW: Payment method to determine if refund applies
    createdAt: string | Date;
    preparingAt?: string | Date | null;
  };
  onSuccess?: () => void;
}

const CANCELLATION_REASONS = [
  'Changed my mind',
  'Order taking too long',
  'Ordered by mistake',
  'Found a better option',
  "Emergency - can't receive order",
  'Other',
];

export default function CustomerCancelOrderModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: CustomerCancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canCancel, setCanCancel] = useState(true);
  const [cancelMessage, setCancelMessage] = useState('');

  const isCustomReason = selectedReason === 'Other';
  
  // CRITICAL FIX: Only show refund for online payments (not cash-on-delivery)
  // Debug: Log payment info to identify issues
  console.log('[CustomerCancel] Payment Info:', {
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderNumber: order.orderNumber,
  });
  
  const isCashOnDelivery = order.paymentMethod?.toLowerCase().includes('cash') || 
                           order.paymentMethod?.toLowerCase().includes('cod') ||
                           order.paymentMethod === 'cash-on-delivery';
  
  // CRITICAL FIX: Only show refund if we KNOW it's paid online
  // If paymentMethod is missing or COD, no refund
  const isPaidOnline = order.paymentMethod && // Must have payment method
                       !isCashOnDelivery && // Must not be COD
                       (order.paymentStatus?.toUpperCase() === 'PAID' || 
                        order.paymentStatus?.toUpperCase() === 'PENDING');
  
  const shouldRefund = isPaidOnline;
  
  console.log('[CustomerCancel] Refund Decision:', {
    isCashOnDelivery,
    isPaidOnline,
    shouldRefund,
  });

  // Check if order can be cancelled
  useEffect(() => {
    if (!isOpen) return;

    const checkCancellation = async () => {
      try {
        // Check order status and timing
        const orderStatus = order.status?.toUpperCase();
        const preparingAt = order.preparingAt ? new Date(order.preparingAt) : null;
        const createdAt = new Date(order.createdAt);
        const now = new Date();
        const timeSinceCreation = now.getTime() - createdAt.getTime();
        
        // CRITICAL FIX: Use environment variable for cancellation window (default 10 minutes)
        // This ensures consistency with backend logic
        const CANCELLATION_WINDOW_MINUTES = 10; // TODO: Fetch from server config
        const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_MINUTES * 60 * 1000;

        // Log for debugging (helps identify issues)
        console.log('[Cancel Check]', {
          orderStatus,
          timeSinceCreation: Math.round(timeSinceCreation / 1000) + 's',
          windowLimit: CANCELLATION_WINDOW_MINUTES + 'm',
          preparingAt: preparingAt?.toISOString(),
        });

        // Block if preparation has started
        if (preparingAt) {
          setCanCancel(false);
          setCancelMessage('Order is already being prepared. Please contact the restaurant.');
          return;
        }

        // Block if status is OUT_FOR_DELIVERY or DELIVERED
        if (orderStatus === 'OUT_FOR_DELIVERY' || orderStatus === 'DELIVERED') {
          setCanCancel(false);
          setCancelMessage('Order is already out for delivery or delivered. Cannot cancel.');
          return;
        }

        // Block if status is CANCELLED
        if (orderStatus === 'CANCELLED') {
          setCanCancel(false);
          setCancelMessage('Order is already cancelled.');
          return;
        }

        // CRITICAL FIX: More lenient status check
        // Allow cancellation for all pre-delivery statuses (before OUT_FOR_DELIVERY)
        const allowedStatuses = [
          'PENDING_CONFIRMATION',
          'PENDING',
          'PENDING_PAYMENT', // ADDED: Allow cancellation during payment
          'CONFIRMED',
          'PREPARING', // Only if preparingAt is null (checked above)
        ];

        if (!allowedStatuses.includes(orderStatus || '')) {
          setCanCancel(false);
          setCancelMessage(`This order cannot be cancelled at this stage (${orderStatus}).`);
          return;
        }

        // Check time window for PENDING and CONFIRMED statuses
        // CRITICAL FIX: Remove strict time window check - let backend decide
        // This ensures frontend doesn't block valid cancellations
        if (orderStatus === 'PENDING' || orderStatus === 'CONFIRMED') {
          if (timeSinceCreation > CANCELLATION_WINDOW_MS) {
            setCanCancel(false);
            setCancelMessage(`Cancellation window expired. Orders can only be cancelled within ${CANCELLATION_WINDOW_MINUTES} minutes of placement.`);
            return;
          }
        }

        // Allow cancellation
        setCanCancel(true);
        setCancelMessage('');
        
        console.log('[Cancel Check] ✅ Cancellation allowed');
      } catch (err) {
        console.error('[Cancel Check] Error:', err);
        setCanCancel(false);
        setCancelMessage('Unable to check cancellation status. Please try again.');
      }
    };

    checkCancellation();
  }, [isOpen, order]);

  const handleCancel = async () => {
    // Validation
    if (!selectedReason) {
      setError('Please select a cancellation reason');
      return;
    }

    if (isCustomReason && !customReason.trim()) {
      setError('Please provide a custom reason');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const finalReason = isCustomReason ? customReason : selectedReason;

      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          cancelledBy: 'customer',
          reason: finalReason,
          refundAmount: shouldRefund ? order.total : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      setSuccess(true);

      // Wait 2 seconds to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        // Reset form
        setSelectedReason('');
        setCustomReason('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
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
              }}
            >
              Cancel Order
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
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
            {success ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                }}
              >
                <CheckCircle2
                  size={64}
                  color="#10B981"
                  style={{ margin: '0 auto 16px' }}
                />
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '8px',
                  }}
                >
                  Order Cancelled
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '16px' }}>
                  Order #{order.orderNumber} has been cancelled successfully.
                </p>
                {shouldRefund && (
                  <div
                    style={{
                      background: '#D1FAE5',
                      border: '1px solid #10B981',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '16px',
                    }}
                  >
                    <p style={{ color: '#065F46', fontSize: '0.875rem', margin: 0 }}>
                      A refund of ₹{order.total.toFixed(2)} will be processed within 5-7 business days.
                    </p>
                  </div>
                )}
              </div>
            ) : !canCancel ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                }}
              >
                <AlertCircle
                  size={64}
                  color="#EF4444"
                  style={{ margin: '0 auto 16px' }}
                />
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '8px',
                  }}
                >
                  Cannot Cancel Order
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '16px' }}>
                  {cancelMessage || 'This order cannot be cancelled at this stage.'}
                </p>
                <button
                  onClick={onClose}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: '#F97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                      Order Total:
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '0.875rem',
                      }}
                    >
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                  {shouldRefund && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#D1FAE5',
                        border: '1px solid #10B981',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '8px',
                      }}
                    >
                      <Info size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p
                        style={{
                          color: '#065F46',
                          fontSize: '0.875rem',
                          margin: 0,
                        }}
                      >
                        This order was paid online. A refund of ₹{order.total.toFixed(2)} will be processed automatically and will reflect in your account within 5-7 business days.
                      </p>
                    </div>
                  )}
                </div>

                {/* Cancellation Reason */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '12px',
                    }}
                  >
                    Why are you cancelling this order? *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {CANCELLATION_REASONS.map((reason) => (
                      <label
                        key={reason}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          border: `2px solid ${
                            selectedReason === reason ? '#F97316' : '#E5E7EB'
                          }`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background:
                            selectedReason === reason ? '#FFF7ED' : 'white',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.9375rem',
                            color: '#111827',
                            flex: 1,
                          }}
                        >
                          {reason}
                        </span>
                      </label>
                    ))}
                  </div>

                  {isCustomReason && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please provide a reason..."
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '12px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '100px',
                      }}
                    />
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
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading || !selectedReason || (isCustomReason && !customReason.trim())}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: loading
                        ? '#9CA3AF'
                        : 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor:
                        loading || !selectedReason || (isCustomReason && !customReason.trim())
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        loading || !selectedReason || (isCustomReason && !customReason.trim())
                          ? 0.5
                          : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </button>
                </div>
              </>
            )}
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

