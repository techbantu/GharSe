'use client';

/**
 * KITCHEN TICKET COMPONENT
 * 
 * Purpose: Restaurant-style order ticket for chefs
 * Focus: Cooking efficiency, NOT money
 * 
 * Design Philosophy:
 * - Large, readable text for kitchen environment
 * - Delivery address PROMINENT (most important for delivery)
 * - No prices (chefs don't need to see revenue)
 * - Quick action buttons (status changes)
 * - Color-coded by urgency
 */

import React from 'react';
import { Order } from '@/types';
import { Clock, MapPin, Phone, Utensils, AlertCircle, CheckCircle } from 'lucide-react';
import { formatForRestaurant, formatMinutesToHuman } from '@/lib/timezone-service';

interface KitchenTicketProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  isUrgent?: boolean;
}

export default function KitchenTicket({ order, onStatusChange, isUrgent }: KitchenTicketProps) {
  const orderTime = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt;
  const isDelivery = order.orderType === 'delivery';
  const isScheduled = order.scheduledDeliveryAt || order.scheduledWindowStart;
  
  // Calculate time metrics differently for scheduled vs ASAP orders
  const timeMetrics = React.useMemo(() => {
    if (isScheduled) {
      const scheduledDelivery = order.scheduledDeliveryAt || order.scheduledWindowStart;
      const prepTime = order.prepTime || order.estimatedPrepTime || 120;
      const deliveryDuration = order.deliveryDuration || 45;
      
      const mustStartCookingBy = new Date(
        new Date(scheduledDelivery!).getTime() - (prepTime + deliveryDuration) * 60000
      );
      
      const now = new Date();
      const minutesUntilStart = Math.floor((mustStartCookingBy.getTime() - now.getTime()) / 60000);
      
      return {
        isScheduled: true,
        scheduledDelivery: new Date(scheduledDelivery!),
        mustStartCookingBy,
        minutesUntilStart,
        urgencyType: minutesUntilStart < 0 ? 'overdue' : minutesUntilStart <= 15 ? 'urgent' : 'upcoming'
      };
    } else {
      const minutesElapsed = Math.floor((Date.now() - orderTime.getTime()) / 60000);
      return {
        isScheduled: false,
        minutesElapsed,
        urgencyType: minutesElapsed > 30 ? 'overdue' : minutesElapsed > 20 ? 'urgent' : 'normal'
      };
    }
  }, [isScheduled, order, orderTime]);
  
  // Determine urgency color based on time metrics
  const getUrgencyColor = () => {
    if (order.status === 'delivered' || order.status === 'picked-up') return '#10b981'; // Green
    
    if (timeMetrics.isScheduled) {
      if (timeMetrics.minutesUntilStart && timeMetrics.minutesUntilStart < 0) return '#ef4444'; // Red - should have started!
      if (timeMetrics.minutesUntilStart && timeMetrics.minutesUntilStart <= 15) return '#f59e0b'; // Orange - start soon!
      return '#3b82f6'; // Blue - scheduled
    } else {
      if (timeMetrics.minutesElapsed && timeMetrics.minutesElapsed > 30) return '#ef4444'; // Red - URGENT!
      if (timeMetrics.minutesElapsed && timeMetrics.minutesElapsed > 20) return '#f59e0b'; // Orange - Warning
      return '#3b82f6'; // Blue - Normal
    }
  };

  const urgencyColor = getUrgencyColor();

  return (
    <div
      style={{
        background: 'white',
        border: `3px solid ${urgencyColor}`,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: urgencyColor === '#ef4444' 
          ? '0 0 0 4px rgba(239, 68, 68, 0.2), 0 8px 24px rgba(239, 68, 68, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        animation: isUrgent ? 'pulse 2s infinite' : 'none',
      }}
    >
      {/* Urgent Banner */}
      {timeMetrics.urgencyType === 'overdue' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: '#ef4444',
            color: 'white',
            padding: '0.5rem',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.875rem',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          {timeMetrics.isScheduled 
            ? `START NOW! (${Math.abs(timeMetrics.minutesUntilStart ?? 0)} min overdue)` 
            : `URGENT! ${timeMetrics.minutesElapsed ?? 0} MINUTES ELAPSED`
          }
        </div>
      )}

      <div style={{ paddingTop: timeMetrics.urgencyType === 'overdue' ? '2.5rem' : 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Order Header */}
        <div
          style={{
            borderBottom: '2px dashed #e5e7eb',
            paddingBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1f2937', fontFamily: 'monospace' }}>
                {order.orderNumber}
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#6b7280', marginTop: '0.25rem' }}>
                {order.customer.name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {timeMetrics.isScheduled ? (
                <>
                  <div style={{ 
                    fontSize: '0.6875rem', 
                    color: '#667eea',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem',
                    fontWeight: 600
                  }}>
                    📅 Scheduled For
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 700, 
                    color: '#667eea',
                    marginBottom: '0.25rem'
                  }}>
                    {timeMetrics.scheduledDelivery && formatForRestaurant(timeMetrics.scheduledDelivery, 'EEE, MMM d')}
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: '#764ba2'
                  }}>
                    🕐 {timeMetrics.scheduledDelivery && formatForRestaurant(timeMetrics.scheduledDelivery, 'h:mm a')}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: urgencyColor, 
                    marginTop: '0.5rem',
                    fontWeight: 600
                  }}>
                    Start in {(timeMetrics.minutesUntilStart ?? 0) < 0 
                      ? `NOW! (${formatMinutesToHuman(Math.abs(timeMetrics.minutesUntilStart ?? 0))} late)` 
                      : formatMinutesToHuman(timeMetrics.minutesUntilStart ?? 0)
                    }
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    <Clock size={16} />
                    <span style={{ fontWeight: 600 }}>{formatForRestaurant(orderTime, 'h:mm a')}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    {formatMinutesToHuman(timeMetrics.minutesElapsed ?? 0)} ago
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address - MOST IMPORTANT! */}
        {isDelivery && order.deliveryAddress && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #fbbf24',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <MapPin size={18} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🏍️ Delivery Address
              </span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#78350f', lineHeight: 1.5 }}>
              {order.deliveryAddress.street}
              {order.deliveryAddress.apartment && (
                <>, {order.deliveryAddress.apartment}</>
              )}
              <br />
              {order.deliveryAddress.district && `${order.deliveryAddress.district}, `}{order.deliveryAddress.city}
              <br />
              {order.deliveryAddress.zipCode}
            </div>
          </div>
        )}

        {/* Pickup Label */}
        {!isDelivery && (
          <div
            style={{
              background: '#dbeafe',
              border: '2px solid #3b82f6',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#1e40af',
            }}
          >
            🏃 PICKUP ORDER
          </div>
        )}

        {/* Phone Number */}
        <a
          href={`tel:${order.customer.phone}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            color: '#166534',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dcfce7';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f0fdf4';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Phone size={16} />
          </div>
          <span>{order.customer.phone}</span>
        </a>

        {/* Items to Cook */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Utensils size={20} className="text-gray-700" />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>
              Items to Cook
            </span>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
            {order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: index < order.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div
                    style={{
                      minWidth: '36px',
                      height: '36px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.quantity}×
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937' }}>
                      {item.menuItem?.name || 'Unknown Item'}
                    </div>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {Object.entries(item.customizations).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              SPECIAL INSTRUCTIONS
            </div>
            <div style={{ fontSize: '1rem', color: '#7f1d1d', fontWeight: 600 }}>
              {order.specialInstructions}
            </div>
          </div>
        )}

        {/* Status Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '2px dashed #e5e7eb' }}>
          {order.status === 'pending' && (
            <button
              onClick={() => onStatusChange(order.id, 'preparing')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔥 Start Cooking
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => onStatusChange(order.id, 'ready')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ✅ Mark Ready
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => onStatusChange(order.id, isDelivery ? 'out-for-delivery' : 'picked-up')}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isDelivery ? '🏍️ Out for Delivery' : '🏃 Picked Up'}
            </button>
          )}

          {(order.status === 'delivered' || order.status === 'picked-up') && (
            <div
              style={{
                flex: 1,
                padding: '1rem',
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#166534',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={20} />
              COMPLETED
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.4);
          }
        }
      `}</style>
    </div>
  );
}

