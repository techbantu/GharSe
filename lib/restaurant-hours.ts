/**
 * Restaurant Hours Utility
 * 
 * Purpose: Check if restaurant is currently open/closed
 * Used by AI to provide appropriate responses based on operating hours
 */

import { restaurantInfo } from '@/data/menuData';

/**
 * Check if restaurant is currently open
 * Based on Indian Standard Time (IST)
 */
export function isRestaurantOpen(): boolean {
  try {
    // Get current time in IST
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = istTime.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[dayOfWeek] as keyof typeof restaurantInfo.hours;
    
    const todayHours = restaurantInfo.hours[today];
    
    // Check if restaurant is closed today
    if (todayHours.isClosed) {
      return false;
    }
    
    // Parse opening and closing times
    const parseTime = (timeStr: string): number => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    };
    
    const openTime = parseTime(todayHours.open);
    const closeTime = parseTime(todayHours.close);
    
    // Check if current time is within operating hours
    return currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime;
    
  } catch (error) {
    console.error('Error checking restaurant hours:', error);
    // Default to open if there's an error (fail-safe)
    return true;
  }
}

/**
 * Get human-readable status message
 */
export function getRestaurantStatus(): {
  isOpen: boolean;
  message: string;
  hours: string;
} {
  const isOpen = isRestaurantOpen();
  const hours = `${restaurantInfo.hours.monday.open} - ${restaurantInfo.hours.monday.close}`;
  
  if (isOpen) {
    return {
      isOpen: true,
      message: 'Open Now',
      hours,
    };
  }
  
  return {
    isOpen: false,
    message: 'Closed',
    hours: `Opens at ${restaurantInfo.hours.monday.open}`,
  };
}

/**
 * Get next opening time if currently closed
 */
export function getNextOpeningTime(): string {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Get today's hours
  const dayOfWeek = istTime.getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[dayOfWeek] as keyof typeof restaurantInfo.hours;
  const todayHours = restaurantInfo.hours[today];
  
  // Parse opening time
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };
  
  const openTime = parseTime(todayHours.open);
  const closeTime = parseTime(todayHours.close);
  
  // If before opening today, return today's opening time
  if (currentTimeInMinutes < openTime) {
    return `Today at ${todayHours.open}`;
  }
  
  // If after closing today, return tomorrow's opening time
  if (currentTimeInMinutes >= closeTime) {
    return `Tomorrow at ${todayHours.open}`;
  }
  
  // Currently open
  return `Open until ${todayHours.close}`;
}

/**
 * Get time until restaurant opens (in minutes)
 * Returns 0 if already open
 */
export function getMinutesUntilOpen(): number {
  if (isRestaurantOpen()) {
    return 0;
  }
  
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Get today's hours
  const dayOfWeek = istTime.getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[dayOfWeek] as keyof typeof restaurantInfo.hours;
  const todayHours = restaurantInfo.hours[today];
  
  // Parse opening time
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };
  
  const openTime = parseTime(todayHours.open);
  const closeTime = parseTime(todayHours.close);
  
  // If before opening today
  if (currentTimeInMinutes < openTime) {
    return openTime - currentTimeInMinutes;
  }
  
  // If after closing, calculate minutes until tomorrow's opening
  if (currentTimeInMinutes >= closeTime) {
    // Minutes until midnight + minutes from midnight to opening
    const minutesUntilMidnight = (24 * 60) - currentTimeInMinutes;
    return minutesUntilMidnight + openTime;
  }
  
  return 0;
}

