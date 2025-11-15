/**
 * ORDER STATS BAR COMPONENT
 * 
 * Real-time statistics banner showing key metrics:
 * - Pending orders count
 * - Preparing orders count
 * - Today's revenue
 * - Total orders today
 * 
 * Updates automatically via WebSocket and order state changes
 */

'use client';

import { useMemo } from 'react';
import { Order } from '@/types';
import { isOrderToday, calculateOrdersTotal } from '@/lib/order-utils';
import { Clock, ChefHat, IndianRupee, ShoppingBag } from 'lucide-react';

interface OrderStatsBarProps {
  orders: Order[];
  className?: string;
}

export default function OrderStatsBar({ orders, className = '' }: OrderStatsBarProps) {
  // Calculate real-time stats
  const stats = useMemo(() => {
    const todayOrders = orders.filter(isOrderToday);
    
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      todayRevenue: calculateOrdersTotal(todayOrders),
      totalOrders: todayOrders.length,
    };
  }, [orders]);

  return (
    <div className={`order-stats-bar ${className}`}>
      <div className="stats-grid">
        {/* Pending Orders */}
        <div className="stat-card stat-pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          {stats.pending > 0 && <div className="stat-pulse"></div>}
        </div>

        {/* Preparing Orders */}
        <div className="stat-card stat-preparing">
          <div className="stat-icon">
            <ChefHat size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Preparing</div>
            <div className="stat-value">{stats.preparing}</div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="stat-card stat-revenue">
          <div className="stat-icon">
            <IndianRupee size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value">₹{stats.todayRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Total Orders Today */}
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .order-stats-bar {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .stat-pending .stat-icon {
          color: #ef4444;
          background: #fef2f2;
        }

        .stat-preparing .stat-icon {
          color: #f59e0b;
          background: #fffbeb;
        }

        .stat-revenue .stat-icon {
          color: #10b981;
          background: #ecfdf5;
        }

        .stat-total .stat-icon {
          color: #3b82f6;
          background: #eff6ff;
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .stat-pulse {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .order-stats-bar {
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .stat-card {
            padding: 1rem;
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .stat-label {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .stat-value {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

