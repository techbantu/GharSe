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
    <div className={`space-y-6 ${className}`}>
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-orange-900 mb-1">
            🏠 Home-Cooked with Love
          </h4>
          <p className="text-sm text-orange-800">
            We need at least <span className="font-bold">{formatLeadTime()}</span> to prepare your fresh home-cooked meal.
            This includes <strong>{Math.floor(prepTime / 60)}h prep time</strong> + <strong>{deliveryTime}min delivery</strong>.
          </p>
        </div>
      </div>
      
      {/* Date Selection */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Calendar className="w-4 h-4" />
          Choose Delivery Date
        </label>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {availableDates.slice(0, 12).map((date) => {
            const slotsAvailable = generateSlotsForDate(date).length;
            const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const displayLabel = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d');
            
            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                onClick={() => handleDateSelect(date)}
                disabled={slotsAvailable === 0}
                className={`
                  relative px-3 py-3 rounded-xl border-2 transition-all
                  ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                      : slotsAvailable === 0
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={`text-xs font-medium ${isSelected ? 'text-orange-700' : 'text-gray-500'}`}>
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-lg font-bold ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                    {format(date, 'd')}
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                    {displayLabel}
                  </div>
                </div>
                
                {isSelected && (
                  <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-orange-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Clock className="w-4 h-4" />
            Choose Delivery Time ({availableTimeSlots.length} slots available)
          </label>
          
          {availableTimeSlots.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <p className="text-gray-600">
                No available time slots for this date.
                <br />
                Please select a different date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {availableTimeSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                
                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    className={`
                      relative px-4 py-3 rounded-xl border-2 transition-all text-left
                      ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex flex-col gap-1">
                      <div className={`font-bold ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                        {slot.label}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                        {slot.sublabel}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-orange-600" />
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
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">
              Delivery Scheduled
            </h4>
            <p className="text-sm text-green-800">
              {format(selectedSlot.startTime, 'EEEE, MMMM d')} between{' '}
              <strong>{format(selectedSlot.startTime, 'h:mm a')}</strong> -{' '}
              <strong>{format(selectedSlot.endTime, 'h:mm a')}</strong>
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-green-600" />
        </div>
      )}
    </div>
  );
};

export default DeliveryTimeSlotPicker;

