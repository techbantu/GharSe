/**
 * COMPACT ORDER CARD COMPONENT
 * 
 * List view variant of order card:
 * - Single row layout with all key info visible
 * - Quick action buttons
 * - Click to expand details
 * - Priority indicators (delayed, waiting)
 * - Mobile optimized
 */

'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { 
  formatOrderTime, 
  getStatusColor, 
  getStatusText,
  isOrderDelayed,
  isOrderWaitingLong,
  getTimeAgo,
} from '@/lib/order-utils';
import { Phone, MapPin, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface CompactOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: Order['status']) => void;
  onCall?: (phone: string) => void;
  className?: string;
}

export default function CompactOrderCard({
  order,
  onStatusChange,
  onCall,
  className = '',
}: CompactOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const delayed = isOrderDelayed(order);
  const waitingLong = isOrderWaitingLong(order);
  const statusColor = getStatusColor(order.status);
  const statusText = getStatusText(order.status);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCall) {
      onCall(order.customer.phone);
    } else {
      window.location.href = `tel:${order.customer.phone}`;
    }
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: Order['status']) => {
    e.stopPropagation();
    onStatusChange(order.id, newStatus);
  };

  return (
    <div 
      className={`compact-order-card ${className} ${delayed ? 'delayed' : ''} ${waitingLong ? 'waiting-long' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Main Row */}
      <div className="card-main-row">
        {/* Left: Order Info */}
        <div className="order-info">
          <div className="order-number-row">
            <span className="order-number">{order.orderNumber}</span>
            <span className={`status-badge status-${statusColor}`}>{statusText}</span>
            {delayed && (
              <span className="warning-badge">
                <AlertTriangle size={14} />
                Delayed
              </span>
            )}
            {waitingLong && (
              <span className="warning-badge warning-waiting">
                <Clock size={14} />
                Waiting
              </span>
            )}
          </div>
          <div className="order-details-row">
            <span className="customer-name">{order.customer.name}</span>
            <span className="order-time">{getTimeAgo(order.createdAt)}</span>
          </div>
        </div>

        {/* Center: Amount */}
        <div className="order-amount">
          <span className="amount-label">Total</span>
          <span className="amount-value">₹{order.pricing.total.toLocaleString('en-IN')}</span>
        </div>

        {/* Right: Actions */}
        <div className="order-actions">
          <button 
            onClick={handleCall} 
            className="action-button action-call"
            title="Call customer"
          >
            <Phone size={18} />
          </button>
          
          {order.status === 'pending' && (
            <button 
              onClick={(e) => handleStatusChange(e, 'preparing')} 
              className="action-button action-accept"
              title="Start preparing"
            >
              Accept
            </button>
          )}
          
          {order.status === 'preparing' && (
            <button 
              onClick={(e) => handleStatusChange(e, 'ready')} 
              className="action-button action-ready"
              title="Mark as ready"
            >
              Ready
            </button>
          )}
          
          {order.status === 'ready' && (
            <button 
              onClick={(e) => handleStatusChange(e, 'delivered')} 
              className="action-button action-deliver"
              title="Mark as delivered"
            >
              Deliver
            </button>
          )}

          <button className="expand-button" title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="card-expanded">
          <div className="expanded-grid">
            {/* Items */}
            <div className="detail-section">
              <h4>Items ({order.items.length})</h4>
              <div className="items-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <span className="item-name">{item.quantity}x {item.menuItem?.name || 'Unknown Item'}</span>
                    <span className="item-price">₹{item.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="detail-section">
              <h4>Delivery Info</h4>
              <div className="info-list">
                <div className="info-row">
                  <Phone size={16} />
                  <span>{order.customer.phone}</span>
                </div>
                {order.deliveryAddress && (
                  <div className="info-row">
                    <MapPin size={16} />
                    <span>
                      {order.deliveryAddress.street}
                      {order.deliveryAddress.apartment && `, ${order.deliveryAddress.apartment}`}, 
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                    </span>
                  </div>
                )}
                <div className="info-row">
                  <Clock size={16} />
                  <span>{formatOrderTime(order.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="detail-section">
              <h4>Payment</h4>
              <div className="payment-details">
                <div className="payment-row">
                  <span>Subtotal</span>
                  <span>₹{order.pricing.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.pricing.deliveryFee > 0 && (
                  <div className="payment-row">
                    <span>Delivery Fee</span>
                    <span>₹{order.pricing.deliveryFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.pricing.discount && order.pricing.discount > 0 && (
                  <div className="payment-row discount">
                    <span>Discount</span>
                    <span>-₹{order.pricing.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="payment-row total">
                  <span>Total</span>
                  <span>₹{order.pricing.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="payment-method">
                  {order.paymentMethod 
                    ? order.paymentMethod.replace(/-/g, ' ').replace(/_/g, ' ')
                    : 'Cash on Delivery'}
                  {order.pricing?.tip && order.pricing.tip > 0 && (
                    <span style={{ color: '#10B981', marginLeft: '8px' }}>
                      💝 ₹{order.pricing.tip}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .compact-order-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .compact-order-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .compact-order-card.delayed {
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .compact-order-card.waiting-long {
          border-color: #fbbf24;
          background: #fffbeb;
        }

        .card-main-row {
          display: grid;
          grid-template-columns: 2fr 1fr auto;
          gap: 1.5rem;
          align-items: center;
        }

        .order-info {
          min-width: 0;
        }

        .order-number-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .order-number {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-red {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-yellow {
          background: #fef3c7;
          color: #d97706;
        }

        .status-green {
          background: #d1fae5;
          color: #059669;
        }

        .status-blue {
          background: #dbeafe;
          color: #2563eb;
        }

        .status-gray {
          background: #f1f5f9;
          color: #64748b;
        }

        .warning-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          border-radius: 12px;
          background: #fee2e2;
          color: #dc2626;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .warning-badge.warning-waiting {
          background: #fef3c7;
          color: #d97706;
        }

        .order-details-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .customer-name {
          font-weight: 500;
          color: #475569;
        }

        .order-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .order-amount {
          text-align: right;
        }

        .amount-label {
          display: block;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.25rem;
        }

        .amount-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #10b981;
        }

        .order-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-button {
          padding: 0.625rem 1rem;
          border: none;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .action-call {
          background: #dbeafe;
          color: #2563eb;
          padding: 0.625rem;
        }

        .action-call:hover {
          background: #bfdbfe;
        }

        .action-accept {
          background: #fef3c7;
          color: #d97706;
        }

        .action-accept:hover {
          background: #fde68a;
        }

        .action-ready {
          background: #d1fae5;
          color: #059669;
        }

        .action-ready:hover {
          background: #a7f3d0;
        }

        .action-deliver {
          background: #dbeafe;
          color: #2563eb;
        }

        .action-deliver:hover {
          background: #bfdbfe;
        }

        .expand-button {
          padding: 0.625rem;
          border: none;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .expand-button:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .card-expanded {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .expanded-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .detail-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin: 0 0 0.75rem 0;
        }

        .items-list, .info-list, .payment-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .item-row, .info-row, .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .item-name {
          flex: 1;
          color: #475569;
        }

        .item-price {
          font-weight: 600;
          color: #1e293b;
        }

        .info-row {
          justify-content: flex-start;
        }

        .payment-row.discount {
          color: #10b981;
        }

        .payment-row.total {
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
          font-weight: 600;
          color: #1e293b;
        }

        .payment-method {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 6px;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
          text-transform: capitalize;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .card-main-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .order-amount {
            display: none;
          }

          .order-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .action-button {
            padding: 0.5rem 0.875rem;
            font-size: 0.8125rem;
          }

          .expanded-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

