/**
 * BUSINESS HOURS UTILITY - Indian Standard Time (IST)
 * 
 * Purpose: Manages restaurant operating hours with automatic timezone handling
 * for Indian Standard Time (IST - UTC+5:30)
 * 
 * Features:
 * - Automatic IST time calculation
 * - Real-time open/closed status
 * - Order scheduling for closed hours
 * - Next opening time calculation
 */

/**
 * Get current time in Indian Standard Time (IST)
 */
export function getISTTime(): Date {
  // Get current UTC time
  const now = new Date();
  
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  
  return istTime;
}

/**
 * Get current IST time formatted as string
 */
export function getISTTimeString(): string {
  const istTime = getISTTime();
  return istTime.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Restaurant operating hours (IST)
 * Open every day: 10:00 AM - 10:00 PM
 */
export const BUSINESS_HOURS = {
  openTime: { hour: 10, minute: 0 }, // 10:00 AM
  closeTime: { hour: 22, minute: 0 }, // 10:00 PM (22:00)
  timezone: 'Asia/Kolkata',
  displayOpen: '10:00 AM',
  displayClose: '10:00 PM',
};

/**
 * Check if restaurant is currently open
 */
export function isRestaurantOpen(): boolean {
  const now = new Date();
  
  // Get IST time
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = BUSINESS_HOURS.openTime.hour * 60 + BUSINESS_HOURS.openTime.minute;
  const closeTimeInMinutes = BUSINESS_HOURS.closeTime.hour * 60 + BUSINESS_HOURS.closeTime.minute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
}

/**
 * Get time until opening (in minutes)
 * Returns 0 if already open
 */
export function getMinutesUntilOpen(): number {
  if (isRestaurantOpen()) return 0;
  
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  const openTimeInMinutes = BUSINESS_HOURS.openTime.hour * 60 + BUSINESS_HOURS.openTime.minute;
  const closeTimeInMinutes = BUSINESS_HOURS.closeTime.hour * 60 + BUSINESS_HOURS.closeTime.minute;
  
  // If before opening time today
  if (currentTimeInMinutes < openTimeInMinutes) {
    return openTimeInMinutes - currentTimeInMinutes;
  }
  
  // If after closing time, calculate time until tomorrow's opening
  const minutesUntilMidnight = (24 * 60) - currentTimeInMinutes;
  return minutesUntilMidnight + openTimeInMinutes;
}

/**
 * Get next opening time as formatted string
 */
export function getNextOpeningTime(): string {
  const minutesUntilOpen = getMinutesUntilOpen();
  
  if (minutesUntilOpen === 0) {
    return 'Open Now';
  }
  
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const currentHour = istTime.getHours();
  
  // If after closing time, opens tomorrow
  if (currentHour >= BUSINESS_HOURS.closeTime.hour) {
    return `Opens Tomorrow at ${BUSINESS_HOURS.displayOpen}`;
  }
  
  // If before opening time today
  return `Opens Today at ${BUSINESS_HOURS.displayOpen}`;
}

/**
 * Get time until closing (in minutes)
 * Returns 0 if closed
 */
export function getMinutesUntilClose(): number {
  if (!isRestaurantOpen()) return 0;
  
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  const closeTimeInMinutes = BUSINESS_HOURS.closeTime.hour * 60 + BUSINESS_HOURS.closeTime.minute;
  
  return closeTimeInMinutes - currentTimeInMinutes;
}

/**
 * Get closing soon warning (returns true if less than 30 minutes until close)
 */
export function isClosingSoon(): boolean {
  const minutesUntilClose = getMinutesUntilClose();
  return minutesUntilClose > 0 && minutesUntilClose <= 30;
}

/**
 * Get available delivery dates for scheduling
 * (Today if open, or next 7 days)
 */
export function getAvailableDeliveryDates(): Array<{ date: Date; label: string; isToday: boolean }> {
  const dates: Array<{ date: Date; label: string; isToday: boolean }> = [];
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // If currently open, add "Today" option
  if (isRestaurantOpen()) {
    dates.push({
      date: istTime,
      label: 'Today',
      isToday: true,
    });
  }
  
  // Add next 7 days
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(istTime);
    futureDate.setDate(futureDate.getDate() + i);
    
    const dayName = futureDate.toLocaleDateString('en-IN', { weekday: 'long' });
    const dateStr = futureDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    dates.push({
      date: futureDate,
      label: i === 1 ? 'Tomorrow' : `${dayName}, ${dateStr}`,
      isToday: false,
    });
  }
  
  return dates;
}

/**
 * Get available delivery time slots for a given date
 */
export function getAvailableTimeSlots(date: Date): Array<{ time: string; label: string }> {
  const slots: Array<{ time: string; label: string }> = [];
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const isToday = date.toDateString() === istTime.toDateString();
  
  // Generate slots from 10 AM to 10 PM (every 30 minutes)
  for (let hour = BUSINESS_HOURS.openTime.hour; hour < BUSINESS_HOURS.closeTime.hour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);
      
      // If today, only show future slots (at least 45 minutes from now for prep time)
      if (isToday) {
        const minTime = new Date(istTime.getTime() + 45 * 60 * 1000);
        if (slotTime < minTime) continue;
      }
      
      const timeStr = slotTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      
      slots.push({
        time: slotTime.toISOString(),
        label: timeStr,
      });
    }
  }
  
  return slots;
}

/**
 * Format IST time for display
 */
export function formatISTTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get business status message
 */
export function getBusinessStatusMessage(): {
  isOpen: boolean;
  message: string;
  color: 'green' | 'red' | 'yellow';
} {
  const isOpen = isRestaurantOpen();
  
  if (isOpen) {
    const minutesUntilClose = getMinutesUntilClose();
    
    if (isClosingSoon()) {
      return {
        isOpen: true,
        message: `Closing in ${minutesUntilClose} minutes`,
        color: 'yellow',
      };
    }
    
    return {
      isOpen: true,
      message: 'Open Now - Accepting Orders',
      color: 'green',
    };
  }
  
  return {
    isOpen: false,
    message: getNextOpeningTime(),
    color: 'red',
  };
}

