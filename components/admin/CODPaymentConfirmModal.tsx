'use client';

/**
 * COD PAYMENT CONFIRMATION MODAL
 *
 * Purpose: Confirm cash on delivery payment receipt
 * Shows when vendor marks order as "delivered" for COD orders
 * Asks: "Did you receive cash payment from customer?"
 * Updates payment status to PAID if confirmed
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, IndianRupee, Clock } from 'lucide-react';

interface CODPaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (received: boolean) => void;
  orderNumber: string;
  orderTotal: number;
  customerName: string;
  paymentMethod: string;
}

export default function CODPaymentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  orderTotal,
  customerName,
  paymentMethod,
}: CODPaymentConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async (received: boolean) => {
    setIsSubmitting(true);
    try {
      await onConfirm(received);
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <IndianRupee size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
            Payment Confirmation
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Order #{orderNumber}
          </p>
        </div>

        {/* Order Details */}
        <div
          style={{
            background: '#f9fafb',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Customer:</span>
            <span style={{ color: '#1f2937', fontSize: '0.875rem', fontWeight: 600 }}>{customerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Payment Method:</span>
            <span style={{ color: '#1f2937', fontSize: '0.875rem', fontWeight: 600 }}>{paymentMethod}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <span style={{ color: '#1f2937', fontSize: '1rem', fontWeight: 700 }}>Total Amount:</span>
            <span style={{ color: '#22c55e', fontSize: '1.25rem', fontWeight: 900 }}>
              ₹{orderTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            background: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={24} color="#d97706" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>
              Did you receive cash payment?
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
              Please confirm that the customer paid ₹{orderTotal.toFixed(2)} in cash
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Yes - Cash Received */}
          <button
            onClick={() => handleConfirm(true)}
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
            }}
          >
            <CheckCircle size={20} />
            <span>Yes, Received</span>
          </button>

          {/* No - Cash Not Received */}
          <button
            onClick={() => handleConfirm(false)}
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
          >
            <XCircle size={20} />
            <span>No, Pending</span>
          </button>
        </div>

        {/* Helper Text */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#eff6ff',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            color: '#1e40af',
            textAlign: 'center',
          }}
        >
          <Clock size={14} style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Selecting "Yes" will mark payment as PAID. Selecting "No" will keep it as PENDING for later confirmation.
        </div>
      </div>
    </div>
  );
}
