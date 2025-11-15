/**
 * COLLAPSIBLE ORDER SECTION COMPONENT
 * 
 * Reusable collapsible section for grouping orders:
 * - Header with title, count, total amount
 * - Expand/collapse button with smooth animation
 * - Content area for order cards
 * - Customizable styling (active, completed, history)
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleOrderSectionProps {
  title: string;
  count: number;
  totalAmount?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  variant?: 'active' | 'completed' | 'history';
  icon?: ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function CollapsibleOrderSection({
  title,
  count,
  totalAmount,
  isExpanded,
  onToggle,
  children,
  variant = 'history',
  icon,
  emptyMessage = 'No orders in this section',
  className = '',
}: CollapsibleOrderSectionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation state
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle();
  };

  return (
    <div className={`collapsible-section section-${variant} ${className}`}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="section-header"
        aria-expanded={isExpanded}
        aria-controls={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="header-left">
          {icon && <span className="header-icon">{icon}</span>}
          <h2 className="section-title">{title}</h2>
          <span className="order-count">{count}</span>
        </div>

        <div className="header-right">
          {totalAmount !== undefined && (
            <span className="total-amount">₹{totalAmount.toLocaleString('en-IN')}</span>
          )}
          <span className="expand-icon">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </div>
      </button>

      {/* Content */}
      <div
        id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`section-content ${isExpanded ? 'expanded' : 'collapsed'} ${isAnimating ? 'animating' : ''}`}
        aria-hidden={!isExpanded}
      >
        <div className="content-wrapper">
          {count === 0 ? (
            <div className="empty-state">
              <p>{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      <style jsx>{`
        .collapsible-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .collapsible-section:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        /* Variant styles */
        .section-active {
          border: 2px solid #fed7aa;
          background: linear-gradient(to bottom, #fffbf5, white);
        }

        .section-active .section-header {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          border-bottom: 1px solid #fed7aa;
        }

        .section-completed {
          border: 1px solid #d1fae5;
        }

        .section-completed .section-header {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-bottom: 1px solid #d1fae5;
        }

        .section-history {
          border: 1px solid #e2e8f0;
        }

        .section-history .section-header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .section-header:hover {
          background: rgba(249, 115, 22, 0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .order-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 10px;
          border-radius: 16px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .section-active .order-count {
          background: #fed7aa;
          color: #ea580c;
        }

        .section-completed .order-count {
          background: #d1fae5;
          color: #059669;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .total-amount {
          font-size: 1rem;
          font-weight: 600;
          color: #10b981;
        }

        .expand-icon {
          display: flex;
          align-items: center;
          color: #94a3b8;
          transition: transform 0.3s ease;
        }

        .section-header:hover .expand-icon {
          color: #64748b;
        }

        .section-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .section-content.expanded {
          max-height: 10000px;
        }

        .section-content.animating {
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .content-wrapper {
          padding: 1.5rem;
        }

        .empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
          color: #94a3b8;
        }

        .empty-state p {
          margin: 0;
          font-size: 1rem;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .section-header {
            padding: 1rem;
          }

          .header-left {
            gap: 0.5rem;
          }

          .section-title {
            font-size: 1rem;
          }

          .order-count {
            min-width: 28px;
            height: 28px;
            font-size: 0.8125rem;
          }

          .header-right {
            gap: 0.5rem;
          }

          .total-amount {
            font-size: 0.875rem;
          }

          .content-wrapper {
            padding: 1rem;
          }

          .empty-state {
            padding: 2rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .total-amount {
            display: none;
          }

          .header-icon {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

