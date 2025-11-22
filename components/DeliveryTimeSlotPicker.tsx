/**
 * Delivery Time Slot Picker Component
 * 
 * Purpose: Allow customers to schedule delivery with minimum 2h 45min lead time
 * Features:
 * - Minimum lead time: 2 hours prep + 45 minutes delivery = 2h 45min
 * - Maximum advance booking: 30 days
 * - 30-minute delivery windows
 * - Smart time slot generation
 * - Beautiful UX with date and time selection
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { format, addMinutes, addDays, startOfDay, isToday, isTomorrow, parseISO, isBefore, isAfter } from 'date-fns';

interface DeliveryTimeSlot {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  label: string;
  sublabel: string;
}

interface DeliveryTimeSlotPickerProps {
  onSelectSlot: (slot: {
    scheduledDeliveryAt: Date;
    scheduledWindowStart: Date;
    scheduledWindowEnd: Date;
    prepTime: number;
    deliveryTime: number;
    minimumLeadTime: number;
  }) => void;
  prepTime?: number; // Default: 120 minutes (2 hours)
  deliveryTime?: number; // Default: 45 minutes
  minimumLeadTime?: number; // Default: 165 minutes (2h 45min)
  maxAdvanceDays?: number; // Default: 30 days
  className?: string;
}

export const DeliveryTimeSlotPicker: React.FC<DeliveryTimeSlotPickerProps> = ({
  onSelectSlot,
  prepTime = 120,
  deliveryTime = 45,
  minimumLeadTime = 165,
  maxAdvanceDays = 30,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<DeliveryTimeSlot | null>(null);
  
  // Calculate minimum delivery time (now + minimum lead time)
  const minimumDeliveryTime = useMemo(() => {
    return addMinutes(new Date(), minimumLeadTime);
  }, [minimumLeadTime]);
  
  // Generate available dates (today + next 30 days)
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i <= maxAdvanceDays; i++) {
      dates.push(addDays(startOfDay(new Date()), i));
    }
    return dates;
  }, [maxAdvanceDays]);
  
  // Helper to get user-friendly sublabel for time slot
  const getSlotSublabel = (time: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((time.getTime() - now.getTime()) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 180) {
      return `In ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    } else if (diffHours < 24) {
      return `In ${diffHours} hours`;
    } else if (isToday(time)) {
      return 'Today';
    } else if (isTomorrow(time)) {
      return 'Tomorrow';
    } else {
      const days = Math.floor(diffHours / 24);
      return `In ${days} days`;
    }
  };
  
  // Generate time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const slots: DeliveryTimeSlot[] = [];
    const selectedDateStart = startOfDay(selectedDate);
    
    // Operating hours: 9 AM to 9 PM
    const startHour = 9;
    const endHour = 21;
    
    // Generate 30-minute slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(selectedDateStart);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = addMinutes(slotStart, 30);
        const slotCenter = addMinutes(slotStart, 15); // Middle of 30-min window
        
        // Only include slots that are at least minimumLeadTime in the future
        if (isAfter(slotStart, minimumDeliveryTime)) {
          const formattedStartTime = format(slotStart, 'h:mm a');
          const formattedEndTime = format(slotEnd, 'h:mm a');
          
          slots.push({
            id: `${format(slotStart, 'yyyy-MM-dd')}-${hour}-${minute}`,
            date: selectedDate,
            startTime: slotStart,
            endTime: slotEnd,
            label: `${formattedStartTime} - ${formattedEndTime}`,
            sublabel: getSlotSublabel(slotStart),
          });
        }
      }
    }
    
    return slots;
  }, [selectedDate, minimumDeliveryTime]);
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when changing date
  };
  
  // Handle time slot selection
  const handleSlotSelect = (slot: DeliveryTimeSlot) => {
    setSelectedSlot(slot);
    
    onSelectSlot({
      scheduledDeliveryAt: addMinutes(slot.startTime, 15), // Center of window
      scheduledWindowStart: slot.startTime,
      scheduledWindowEnd: slot.endTime,
      prepTime,
      deliveryTime,
      minimumLeadTime,
    });
  };
  
  // Auto-select first available date
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      // Find first date with available slots
      const firstAvailableDate = availableDates.find((date) => {
        const testSlots = generateSlotsForDate(date);
        return testSlots.length > 0;
      });
      
      if (firstAvailableDate) {
        setSelectedDate(firstAvailableDate);
      }
    }
  }, [availableDates, selectedDate]);
  
  // Helper to generate slots for a specific date (for auto-selection)
  const generateSlotsForDate = (date: Date): DeliveryTimeSlot[] => {
    const slots: DeliveryTimeSlot[] = [];
    const dateStart = startOfDay(date);
    
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(dateStart);
        slotStart.setHours(hour, minute, 0, 0);
        
        if (isAfter(slotStart, minimumDeliveryTime)) {
          slots.push({
            id: `${format(slotStart, 'yyyy-MM-dd')}-${hour}-${minute}`,
            date,
            startTime: slotStart,
            endTime: addMinutes(slotStart, 30),
            label: '',
            sublabel: '',
          });
        }
      }
    }
    
    return slots;
  };
  
  const formatLeadTime = () => {
    const hours = Math.floor(minimumLeadTime / 60);
    const minutes = minimumLeadTime % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
  };
  
  return (
    <div className={`${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Info Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        background: 'linear-gradient(to right, #fff7ed, #fef3c7)',
        border: '1px solid #fed7aa',
        borderRadius: '0.75rem',
      }}>
        <AlertCircle style={{ 
          width: '20px', 
          height: '20px', 
          color: '#ea580c', 
          flexShrink: 0, 
          marginTop: '2px' 
        }} />
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontWeight: 600,
            color: '#7c2d12',
            marginBottom: '0.25rem',
            fontSize: '0.9375rem',
            lineHeight: '1.4'
          }}>
            🏠 Home-Cooked with Love
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#9a3412',
            lineHeight: '1.5'
          }}>
            We need at least <span style={{ fontWeight: 700 }}>{formatLeadTime()}</span> to prepare your fresh home-cooked meal.
            This includes <strong>{Math.floor(prepTime / 60)}h prep time</strong> + <strong>{deliveryTime}min delivery</strong>.
          </p>
        </div>
      </div>
      
      {/* Date Selection */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '0.75rem'
        }}>
          <Calendar style={{ width: '16px', height: '16px' }} />
          Choose Delivery Date
        </label>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem'
        }}>
          {availableDates.slice(0, 12).map((date) => {
            const slotsAvailable = generateSlotsForDate(date).length;
            const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const displayLabel = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d');
            
            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                onClick={() => handleDateSelect(date)}
                disabled={slotsAvailable === 0}
                style={{
                  position: 'relative',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${isSelected ? '#f97316' : slotsAvailable === 0 ? '#e5e7eb' : '#e5e7eb'}`,
                  background: isSelected ? '#fff7ed' : slotsAvailable === 0 ? '#f9fafb' : 'white',
                  cursor: slotsAvailable === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && slotsAvailable > 0) {
                    e.currentTarget.style.borderColor = '#fed7aa';
                    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && slotsAvailable > 0) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: isSelected ? '#c2410c' : '#6b7280'
                  }}>
                    {format(date, 'EEE')}
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: isSelected ? '#ea580c' : '#111827'
                  }}>
                    {format(date, 'd')}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isSelected ? '#ea580c' : '#6b7280'
                  }}>
                    {displayLabel}
                  </div>
                </div>
                
                {isSelected && (
                  <CheckCircle2 style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '16px',
                    height: '16px',
                    color: '#ea580c'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.75rem'
          }}>
            <Clock style={{ width: '16px', height: '16px' }} />
            Choose Delivery Time ({availableTimeSlots.length} slots available)
          </label>
          
          {availableTimeSlots.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: '1.5' }}>
                No available time slots for this date.
                <br />
                Please select a different date.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {availableTimeSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                
                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    style={{
                      position: 'relative',
                      padding: '0.875rem',
                      borderRadius: '0.75rem',
                      border: `2px solid ${isSelected ? '#f97316' : '#e5e7eb'}`,
                      background: isSelected ? '#fff7ed' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#fed7aa';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        color: isSelected ? '#ea580c' : '#111827',
                        lineHeight: '1.3'
                      }}>
                        {slot.label}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: isSelected ? '#ea580c' : '#6b7280'
                      }}>
                        {slot.sublabel}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <CheckCircle2 style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        color: '#ea580c'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Selection Summary */}
      {selectedSlot && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          background: 'linear-gradient(to right, #f0fdf4, #d1fae5)',
          border: '1px solid #86efac',
          borderRadius: '0.75rem'
        }}>
          <CheckCircle2 style={{
            width: '24px',
            height: '24px',
            color: '#16a34a',
            flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontWeight: 600,
              color: '#14532d',
              fontSize: '0.9375rem',
              marginBottom: '0.25rem'
            }}>
              Delivery Scheduled
            </h4>
            <p style={{
              fontSize: '0.875rem',
              color: '#166534',
              lineHeight: '1.5'
            }}>
              {format(selectedSlot.startTime, 'EEEE, MMMM d')} between{' '}
              <strong>{format(selectedSlot.startTime, 'h:mm a')}</strong> -{' '}
              <strong>{format(selectedSlot.endTime, 'h:mm a')}</strong>
            </p>
          </div>
          <ChevronRight style={{
            width: '20px',
            height: '20px',
            color: '#16a34a'
          }} />
        </div>
      )}
    </div>
  );
};

export default DeliveryTimeSlotPicker;

