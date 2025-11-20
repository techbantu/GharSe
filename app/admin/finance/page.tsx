'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay, isAfter } from 'date-fns';

interface Order {
  id: string;
  total: number;
  createdAt: string;
  status: string;
  pricing?: {
    total: number;
  };
}

export default function FinancePage() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    pending: 0
  });
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            processFinanceData(data.orders);
          }
        }
      } catch (error) {
        console.error('Error fetching finance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processFinanceData = (orders: Order[]) => {
    const today = new Date();
    const weekAgo = subDays(today, 7);
    const monthAgo = subDays(today, 30);

    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;
    let pendingRev = 0;

    // Chart data: Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      return {
        date: format(d, 'MMM d'),
        fullDate: d,
        amount: 0
      };
    });

    orders.forEach(order => {
      if (order.status === 'cancelled' || order.status === 'refunded') return;

      const orderDate = new Date(order.createdAt);
      const amount = Number(order.pricing?.total) || 0;

      // Stats
      if (isSameDay(orderDate, today)) {
        todayRev += amount;
      }
      if (isAfter(orderDate, weekAgo)) {
        weekRev += amount;
      }
      if (isAfter(orderDate, monthAgo)) {
        monthRev += amount;
      }
      if (order.status === 'delivered' && !isAfter(orderDate, subDays(today, 3))) {
        // Assume payout takes 3 days after delivery
        // This is just a logic placeholder for "pending payout"
      } else if (order.status === 'delivered') {
         pendingRev += amount;
      }

      // Chart Data
      const dayStat = last7Days.find(d => isSameDay(d.fullDate, orderDate));
      if (dayStat) {
        dayStat.amount += amount;
      }
    });

    setStats({
      todayRevenue: todayRev,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      pending: pendingRev
    });

    setChartData(last7Days);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const maxChartValue = Math.max(...chartData.map(d => d.amount), 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Finance Overview</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Track revenue, expenses, and payouts based on real order data
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Today</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
                ₹{stats.todayRevenue.toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#dcfce7'
            }}>
              <DollarSign size={20} style={{ color: '#166534' }} />
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>This Week</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
                ₹{stats.weekRevenue.toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#dbeafe'
            }}>
              <Calendar size={20} style={{ color: '#1e40af' }} />
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>This Month</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
                ₹{stats.monthRevenue.toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#e9d5ff'
            }}>
              <TrendingUp size={20} style={{ color: '#6b21a8' }} />
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Pending Payout</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
                ₹{stats.pending.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Estimated
              </p>
            </div>
            <div style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fed7aa'
            }}>
              <CreditCard size={20} style={{ color: '#9a3412' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
          Last 7 Days Revenue
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          height: '200px',
          gap: '0.5rem'
        }}>
          {chartData.map((day, idx) => {
            const heightPercentage = (day.amount / maxChartValue) * 100;
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                flex: 1,
                gap: '0.5rem'
              }}>
                <div 
                  style={{ 
                    width: '100%', 
                    maxWidth: '40px',
                    height: `${Math.max(heightPercentage, 2)}%`, 
                    backgroundColor: '#ea580c', 
                    borderRadius: '0.25rem',
                    transition: 'height 0.5s ease-in-out',
                    position: 'relative'
                  }} 
                  title={`₹${day.amount}`}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
