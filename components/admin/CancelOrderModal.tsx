/**
 * NEW FILE: Cancel Order Modal - UI for order cancellation
 * 
 * Purpose: Modal dialog for cancelling/rejecting orders with reason selection
 * Features:
 * - Role-based reason options (customer/chef/admin)
 * - Custom reason input
 * - Refund confirmation
 * - Loading states
 * - Error handling
 */

'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod?: string; // NEW: Payment method to determine if refund applies
    customerName: string;
  };
  cancelledBy: 'customer' | 'chef' | 'admin';
  onSuccess?: () => void;
}

const CANCELLATION_REASONS = {
  customer: [
    'Changed my mind',
    'Order taking too long',
    'Ordered by mistake',
    'Found a better option',
    "Emergency - can't receive order",
    'Other',
  ],
  chef: [
    'Item not available',
    'Out of ingredients',
    "Too busy - can't fulfill",
    'Kitchen emergency',
    'Unable to deliver to location',
    'Duplicate order',
    'Customer unreachable',
    'Other',
  ],
  admin: [
    'Fraudulent order',
    'Payment issue',
    'Policy violation',
    'System error',
    'Other',
  ],
};

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  cancelledBy,
  onSuccess,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reasons = CANCELLATION_REASONS[cancelledBy];
  const isCustomReason = selectedReason === 'Other';
  
  // CRITICAL FIX: Only show refund for online payments (not cash-on-delivery)
  const isCashOnDelivery = order.paymentMethod?.toLowerCase().includes('cash') || 
                           order.paymentMethod?.toLowerCase().includes('cod') ||
                           order.paymentMethod === 'cash-on-delivery';
  
  const isPaidOnline = (order.paymentStatus?.toLowerCase() === 'paid' || 
                        order.paymentStatus?.toLowerCase() === 'pending') && 
                       !isCashOnDelivery;
  
  const shouldRefund = isPaidOnline;

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
          cancelledBy,
          reason: finalReason,
          additionalNotes,
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
        setAdditionalNotes('');
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
            borderRadius: '20px',
            padding: '32px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                Cancel Order
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#6B7280', marginBottom: '8px' }}>
                Order #{order.orderNumber} • {order.customerName}
              </p>
              {/* CRITICAL: Display Payment Method Prominently */}
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '6px 12px',
                background: isCashOnDelivery ? '#FEF3C7' : '#DBEAFE',
                border: `2px solid ${isCashOnDelivery ? '#FCD34D' : '#93C5FD'}`,
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: isCashOnDelivery ? '#92400E' : '#1E40AF',
              }}>
                <span style={{ fontSize: '1rem' }}>
                  {isCashOnDelivery ? '💵' : '💳'}
                </span>
                <span style={{ textTransform: 'capitalize' }}>
                  {order.paymentMethod 
                    ? order.paymentMethod.replace(/-/g, ' ').replace(/_/g, ' ')
                    : 'Cash on Delivery'}
                </span>
                {!isCashOnDelivery && (
                  <span style={{ 
                    marginLeft: '4px',
                    padding: '2px 6px',
                    background: order.paymentStatus?.toLowerCase() === 'paid' ? '#10B981' : '#F59E0B',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    {order.paymentStatus || 'PENDING'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
                marginLeft: '16px',
              }}
              className="hover:bg-gray-300"
            >
              <X size={20} color="#374151" />
            </button>
          </div>

          {/* Success State */}
          {success && (
            <div
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={24} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '1.0625rem' }}>
                    Order Cancelled Successfully
                  </p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: 0 }}>
                    Order #{order.orderNumber} has been cancelled.
                  </p>
                </div>
              </div>
              {shouldRefund && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}>
                  💰 Refund of ₹{order.total.toFixed(2)} will be processed within 5-7 days.
                </div>
              )}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
              }}>
                ✉️ Customer has been notified via email
                {order.customerName && ` (${order.customerName})`}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={20} />
              <p style={{ fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {/* Refund Warning */}
          {shouldRefund && !success && (
            <div
              style={{
                background: '#FEF3C7',
                border: '2px solid #FCD34D',
                color: '#92400E',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.125rem' }}>⚠️</span>
                <span>Refund Will Be Processed</span>
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                This order was paid online via <strong>{order.paymentMethod ? order.paymentMethod.replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}</strong>. 
                A refund of <strong>₹{order.total.toFixed(2)}</strong> will be processed automatically to the customer's account within 5-7 business days.
              </p>
            </div>
          )}

          {!success && (
            <>
              {/* Reason Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                  Cancellation Reason *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reasons.map((reason) => (
                    <label
                      key={reason}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px',
                        border: `2px solid ${selectedReason === reason ? '#f97316' : '#E5E7EB'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: selectedReason === reason ? '#FFF7ED' : 'white',
                        transition: 'all 0.2s',
                      }}
                      className="hover:border-orange-300"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        style={{ marginRight: '12px', accentColor: '#f97316' }}
                      />
                      <span style={{ fontSize: '0.9375rem', color: '#374151' }}>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Reason Input */}
              {isCustomReason && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Please specify the reason *
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter the reason for cancellation..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                </div>
              )}

              {/* Additional Notes (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional information for the customer..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '60px',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  className="hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading || !selectedReason || (isCustomReason && !customReason.trim())}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: loading || !selectedReason || (isCustomReason && !customReason.trim())
                      ? '#9CA3AF'
                      : 'linear-gradient(135deg, #DC2626, #B91C1C)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: loading || !selectedReason || (isCustomReason && !customReason.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  className="hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
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
    </>
  );
}

