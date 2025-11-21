'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay, isAfter } from 'date-fns';

interface Order {
  id: string;
  total: number;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  items?: Array<{ menuItem: { category: string; name: string } }>;
  pricing?: {
    total: number;
  };
}

interface ChartData {
  date: string;
  fullDate: Date;
  amount: number;
}

interface StatusBreakdown {
  status: string;
  amount: number;
  count: number;
  color: string;
}

interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  count: number;
  color: string;
}

export default function FinancePage() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    pending: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
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

    // Status breakdown tracking
    const statusMap = new Map<string, { amount: number; count: number }>();
    
    // Payment method breakdown tracking
    const paymentMap = new Map<string, { amount: number; count: number }>();

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const amount = Number(order.pricing?.total) || 0;
      
      // Skip cancelled/refunded for revenue stats
      const isValidRevenue = order.status !== 'cancelled' && order.status !== 'refunded';

      if (isValidRevenue) {
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
        } else if (order.status === 'delivered') {
           pendingRev += amount;
        }

        // Chart Data
        const dayStat = last7Days.find(d => isSameDay(d.fullDate, orderDate));
        if (dayStat) {
          dayStat.amount += amount;
        }
      }

      // Status breakdown (include all orders for this week)
      if (isAfter(orderDate, weekAgo)) {
        const statusKey = order.status || 'unknown';
        const existing = statusMap.get(statusKey) || { amount: 0, count: 0 };
        statusMap.set(statusKey, {
          amount: existing.amount + (isValidRevenue ? amount : 0),
          count: existing.count + 1
        });
      }

      // Payment method breakdown (last 30 days, valid revenue only)
      if (isAfter(orderDate, monthAgo) && isValidRevenue) {
        const methodKey = order.paymentMethod || 'cod';
        const existing = paymentMap.get(methodKey) || { amount: 0, count: 0 };
        paymentMap.set(methodKey, {
          amount: existing.amount + amount,
          count: existing.count + 1
        });
      }
    });

    // Convert status map to array with colors
    const statusColors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'preparing': '#8b5cf6',
      'ready': '#10b981',
      'out_for_delivery': '#06b6d4',
      'delivered': '#22c55e',
      'cancelled': '#ef4444',
      'refunded': '#991b1b'
    };

    const statusData: StatusBreakdown[] = Array.from(statusMap.entries())
      .map(([status, data]) => ({
        status,
        amount: data.amount,
        count: data.count,
        color: statusColors[status] || '#6b7280'
      }))
      .sort((a, b) => b.amount - a.amount);

    // Convert payment map to array with colors
    const paymentColors: { [key: string]: string } = {
      'cod': '#f59e0b',
      'razorpay': '#3b82f6',
      'card': '#8b5cf6',
      'upi': '#10b981',
      'wallet': '#06b6d4'
    };

    const paymentData: PaymentMethodBreakdown[] = Array.from(paymentMap.entries())
      .map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        color: paymentColors[method] || '#6b7280'
      }))
      .sort((a, b) => b.amount - a.amount);

    setStats({
      todayRevenue: todayRev,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      pending: pendingRev
    });

    setChartData(last7Days);
    setStatusBreakdown(statusData);
    setPaymentBreakdown(paymentData);
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

  // Simplified Pie Chart Component with CSS-based visualization
  const PieChart = ({ data, title }: { data: Array<{ label: string; value: number; color: string }>; title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0 || data.length === 0) return null;

    // Calculate percentages and create gradient for conic-gradient
    let gradientStops: string[] = [];
    let currentPercent = 0;
    
    data.forEach((item, idx) => {
      const percentage = (item.value / total) * 100;
      gradientStops.push(`${item.color} ${currentPercent}% ${currentPercent + percentage}%`);
      currentPercent += percentage;
    });

    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Pie Chart using conic-gradient */}
          <div 
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: `conic-gradient(${gradientStops.join(', ')})`,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            {data.map((item, idx) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#f9fafb',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      backgroundColor: item.color,
                      flexShrink: 0
                    }} />
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#374151', 
                      textTransform: 'capitalize',
                      fontWeight: 500
                    }}>
                      {item.label.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                      ₹{item.value.toLocaleString('en-IN')}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      backgroundColor: '#ffffff',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontWeight: 500
                    }}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Total Summary */}
          <div style={{
            width: '100%',
            padding: '1rem',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
              Total Revenue
            </span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Simplified Donut Chart Component
  const DonutChart = ({ data, title }: { data: Array<{ label: string; value: number; count: number; color: string }>; title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0 || data.length === 0) return null;

    // Calculate percentages and create gradient for conic-gradient
    let gradientStops: string[] = [];
    let currentPercent = 0;
    
    data.forEach((item, idx) => {
      const percentage = (item.value / total) * 100;
      gradientStops.push(`${item.color} ${currentPercent}% ${currentPercent + percentage}%`);
      currentPercent += percentage;
    });

    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Donut Chart using conic-gradient with center cut-out */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div 
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `conic-gradient(${gradientStops.join(', ')})`,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                position: 'relative'
              }}
            >
              {/* Inner white circle to create donut effect */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                  ₹{total.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {totalCount} orders
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            {data.map((item, idx) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#f9fafb',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      flexShrink: 0
                    }} />
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#374151', 
                      textTransform: 'uppercase',
                      fontWeight: 500
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                      ₹{item.value.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280',
                        backgroundColor: '#ffffff',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontWeight: 500
                      }}>
                        {percentage}%
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        ({item.count})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

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
          height: '250px',
          gap: '0.5rem',
          paddingTop: '2rem',
          position: 'relative'
        }}>
          {chartData.map((day, idx) => {
            const heightPercentage = (day.amount / maxChartValue) * 100;
            const displayHeight = Math.max(heightPercentage, 5); // Minimum 5% so bars are visible
            
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'flex-end',
                flex: 1,
                height: '100%', // Take full height of container
                gap: '0.5rem',
                position: 'relative'
              }}>
                {/* Revenue amount label above bar */}
                <div style={{
                  marginBottom: '4px', // Space between label and bar
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#ea580c',
                  whiteSpace: 'nowrap',
                  backgroundColor: '#fff',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  zIndex: 10
                }}>
                  ₹{day.amount.toLocaleString('en-IN')}
                </div>
                
                {/* Bar */}
                <div 
                  style={{ 
                    width: '100%', 
                    maxWidth: '50px',
                    height: `${displayHeight}%`, 
                    backgroundColor: day.amount === 0 ? '#e5e7eb' : '#ea580c',
                    borderRadius: '0.375rem 0.375rem 0 0',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    boxShadow: day.amount > 0 ? '0 2px 4px rgba(234, 88, 12, 0.2)' : 'none'
                  }}
                />
                
                {/* Date label */}
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280',
                  fontWeight: 500,
                  marginTop: '0.25rem'
                }}>
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Show total for the period */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Total (Last 7 Days)
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            ₹{chartData.reduce((sum, day) => sum + day.amount, 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Order Status Breakdown - Pie Chart */}
        {statusBreakdown.length > 0 && (
          <PieChart
            data={statusBreakdown.map(item => ({
              label: item.status,
              value: item.amount,
              color: item.color
            }))}
            title="Revenue by Order Status (Last 7 Days)"
          />
        )}

        {/* Payment Method Breakdown - Donut Chart */}
        {paymentBreakdown.length > 0 && (
          <DonutChart
            data={paymentBreakdown.map(item => ({
              label: item.method,
              value: item.amount,
              count: item.count,
              color: item.color
            }))}
            title="Payment Methods (Last 30 Days)"
          />
        )}
      </div>

      {/* Empty State if no data */}
      {statusBreakdown.length === 0 && paymentBreakdown.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '3rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <PieChartIcon size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
            No Chart Data Available
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Charts will appear here once you have order data in your system.
          </p>
        </div>
      )}
    </div>
  );
}