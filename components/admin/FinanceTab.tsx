'use client';

/**
 * FINANCE TAB COMPONENT
 * 
 * Purpose: Separate all money/revenue data from kitchen operations
 * For: Business owner, accountant - NOT for chefs!
 * 
 * Contains:
 * - Revenue metrics
 * - Money status
 * - Payment information
 * - Financial analytics
 */

import React from 'react';
import { IndianRupee, TrendingUp, Clock, DollarSign, CreditCard, Package } from 'lucide-react';

interface FinanceData {
  todayRevenue: number;
  pendingCollection: number;
  availableNow: number;
  inTransit: number;
  todayOrders: number;
  averageOrderValue: number;
}

interface FinanceTabProps {
  financeData: FinanceData;
  onSetupPayments?: () => void;
}

export default function FinanceTab({ financeData, onSetupPayments }: FinanceTabProps) {
  return (
    <div style={{ padding: '2rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
          💰 Financial Overview
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Track your revenue, payments, and financial performance
        </p>
      </div>

      {/* Revenue Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Today's Revenue */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IndianRupee size={24} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>Today's Revenue</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            ₹{financeData.todayRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            {financeData.todayOrders} orders • Avg ₹{financeData.averageOrderValue.toFixed(0)}
          </div>
        </div>

        {/* Pending Collection */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={24} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>Pending Collection</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            ₹{financeData.pendingCollection.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Cash on delivery
          </div>
        </div>

        {/* Available Now */}
        <div
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={24} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>Available Now</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            ₹{financeData.availableNow.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Ready to withdraw
          </div>
        </div>

        {/* In Transit */}
        <div
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={24} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>In Transit</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            ₹{financeData.inTransit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Processing (1-7 days)
          </div>
        </div>
      </div>

      {/* Money Status Detailed */}
      <div
        style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '1.5rem' }}>
          💰 Your Money Status
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600, marginBottom: '0.5rem' }}>
              Available Now
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#15803d', marginBottom: '0.5rem' }}>
              ₹{financeData.availableNow.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>
              Ready to use
            </div>
          </div>

          <div
            style={{
              background: '#fef3c7',
              border: '2px solid #fde68a',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600, marginBottom: '0.5rem' }}>
              In Transit
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#b45309', marginBottom: '0.5rem' }}>
              ₹{financeData.inTransit.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#d97706' }}>
              Processing (1-7 days)
            </div>
          </div>

          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 600, marginBottom: '0.5rem' }}>
              Pending Collection
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#b91c1c', marginBottom: '0.5rem' }}>
              ₹{financeData.pendingCollection.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
              Cash on delivery
            </div>
          </div>
        </div>

        {/* Payment Setup Info */}
        <div
          style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: '#3b82f6',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <CreditCard size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.25rem' }}>
              💡 How to get your money:
            </div>
            <div style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
              Connect your bank account in Stripe/Razorpay dashboard. Money automatically transfers daily.
            </div>
          </div>
          {onSetupPayments && (
            <button
              onClick={onSetupPayments}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ▶ Setup Guide
            </button>
          )}
        </div>
      </div>

      {/* Daily Revenue Chart Placeholder */}
      <div
        style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '1rem',
          padding: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
          📊 Revenue Trends
        </h2>
        <div
          style={{
            height: '300px',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '1rem',
          }}
        >
          Chart coming soon - Connect analytics dashboard
        </div>
      </div>
    </div>
  );
}

