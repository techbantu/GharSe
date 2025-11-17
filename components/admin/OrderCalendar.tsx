'use client';

/**
 * ORDER CALENDAR COMPONENT
 * 
 * Purpose: Interactive calendar showing orders and revenue per day
 * Features:
 * - Visual order count per day
 * - Revenue display per day
 * - Click to filter orders for specific date
 * - Highlights today and selected date
 * - Month navigation
 * 
 * Design: Clean, modern UI inspired by top calendar implementations
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, IndianRupee, Package } from 'lucide-react';
import { Order } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';

interface OrderCalendarProps {
  orders: Order[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface DayData {
  date: Date;
  orderCount: number;
  revenue: number;
  orders: Order[];
}

export default function OrderCalendar({ orders, selectedDate, onDateSelect }: OrderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate day data for the current month
  const dayDataMap = useMemo(() => {
    const map = new Map<string, DayData>();

    orders.forEach(order => {
      const orderDate = typeof order.createdAt === 'string' 
        ? new Date(order.createdAt) 
        : order.createdAt;
      
      const dateKey = format(orderDate, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: orderDate,
          orderCount: 0,
          revenue: 0,
          orders: []
        });
      }

      const dayData = map.get(dateKey)!;
      dayData.orderCount++;
      // Safely add revenue with validation (using pricing.total from Order type)
      const orderTotal = typeof order.pricing?.total === 'number' ? order.pricing.total : 0;
      dayData.revenue += orderTotal;
      dayData.orders.push(order);
    });

    return map;
  }, [orders]);

  // Get calendar grid days (including padding days from prev/next month)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    setIsExpanded(false); // Collapse after selection
  };

  const today = new Date();

  // Compact view (just the selected date info)
  if (!isExpanded) {
    const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
    const selectedDayData = dayDataMap.get(selectedDateKey);

    return (
      <div
        style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '0.75rem',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
        onClick={() => setIsExpanded(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#f97316';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
              }}
            >
              <div style={{ fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {format(selectedDate, 'MMM')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
                {format(selectedDate, 'd')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                  <Package size={14} />
                  <span style={{ fontWeight: 600 }}>{selectedDayData?.orderCount || 0}</span>
                  <span>orders</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669' }}>
                  <IndianRupee size={14} />
                  <span style={{ fontWeight: 600 }}>
                    {typeof selectedDayData?.revenue === 'number' && !isNaN(selectedDayData.revenue)
                      ? selectedDayData.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={20} className="text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  // Expanded calendar view
  return (
    <div
      style={{
        background: 'white',
        border: '2px solid #f97316',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        minWidth: '600px',
        maxWidth: '800px',
      }}
    >
      {/* Calendar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={handleToday}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#f97316';
              e.currentTarget.style.color = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handlePrevMonth}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
            title="Close calendar"
          >
            <span style={{ fontSize: '1.25rem', color: '#6b7280' }}>×</span>
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#9ca3af',
              padding: '0.5rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
        }}
      >
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayData = dayDataMap.get(dateKey);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasOrders = dayData && dayData.orderCount > 0;

          return (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              style={{
                aspectRatio: '1',
                borderRadius: '0.5rem',
                border: isSelected ? '2px solid #f97316' : '1px solid #f3f4f6',
                background: isSelected 
                  ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
                  : isToday 
                  ? '#f0fdf4' 
                  : hasOrders 
                  ? '#fefce8'
                  : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                opacity: isCurrentMonth ? 1 : 0.3,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#fef3c7';
                  e.currentTarget.style.borderColor = '#fbbf24';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday 
                    ? '#f0fdf4' 
                    : hasOrders 
                    ? '#fefce8'
                    : 'white';
                  e.currentTarget.style.borderColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {/* Day Number */}
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: isToday || isSelected ? 700 : 600,
                  color: isSelected 
                    ? '#f97316' 
                    : isToday 
                    ? '#059669' 
                    : isCurrentMonth 
                    ? '#374151' 
                    : '#9ca3af',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: isToday && !isSelected ? '#d1fae5' : 'transparent',
                }}
              >
                {format(day, 'd')}
              </div>

              {/* Order Count & Revenue */}
              {hasOrders && (
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#f97316',
                      textAlign: 'center',
                      marginBottom: '0.125rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.125rem',
                    }}
                  >
                    <Package size={8} />
                    {dayData.orderCount}
                  </div>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: '#059669',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.125rem',
                    }}
                  >
                    <IndianRupee size={8} />
                    {typeof dayData.revenue === 'number' && !isNaN(dayData.revenue)
                      ? dayData.revenue > 999 
                        ? `${(dayData.revenue / 1000).toFixed(1)}k` 
                        : dayData.revenue.toFixed(0)
                      : '0'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '0.25rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
            }}
          />
          <span>Today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '0.25rem',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '2px solid #f97316',
            }}
          />
          <span>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '0.25rem',
              background: '#fefce8',
              border: '1px solid #fef08a',
            }}
          />
          <span>Has Orders</span>
        </div>
      </div>
    </div>
  );
}

