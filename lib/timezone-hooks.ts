'use client';

/**
 * TIMEZONE REACT HOOKS
 *
 * Client-side only React hooks for timezone handling.
 *
 * KEY PRINCIPLE:
 * - Restaurant operates in ONE timezone (India/IST)
 * - ALL customers see times in THEIR OWN browser timezone
 * - Business hours are restaurant's hours, displayed in user's timezone
 * - When user picks "2 PM", it means 2 PM in THEIR timezone
 *
 * @author THE ARCHITECT
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import {
  RegionConfig,
  getRestaurantRegion,
  RESTAURANT_TIMEZONE,
  REGIONS,
} from './timezone-service';

/**
 * Get the user's ACTUAL browser timezone
 * This is the real timezone from the device, no mapping or caching
 */
function getBrowserTimezoneDirectly(): string {
  if (typeof window === 'undefined') {
    return RESTAURANT_TIMEZONE; // SSR fallback
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`[Timezone] Browser timezone detected: ${tz}`);
    return tz || RESTAURANT_TIMEZONE;
  } catch {
    console.warn('[Timezone] Failed to detect browser timezone, using restaurant timezone');
    return RESTAURANT_TIMEZONE;
  }
}

/**
 * Create a user-specific region config based on their browser timezone
 * Uses restaurant's business hours but with user's display timezone
 */
function createUserRegionConfig(browserTimezone: string): RegionConfig {
  const restaurantRegion = getRestaurantRegion();

  // Create a custom region for this user that:
  // - Uses the restaurant's business hours (when the kitchen is open)
  // - But displays times in the user's timezone
  return {
    ...restaurantRegion,
    id: 'USER',
    name: getTimezoneDisplayName(browserTimezone),
    timezone: browserTimezone, // Use user's actual timezone for display
    // Keep restaurant's business hours, minimumLeadTime, etc.
  };
}

/**
 * Get a friendly display name for a timezone
 */
function getTimezoneDisplayName(timezone: string): string {
  // Map common timezones to friendly names
  const timezoneNames: Record<string, string> = {
    'Asia/Kolkata': 'India',
    'Asia/Calcutta': 'India',
    'Asia/Mumbai': 'India',
    'Asia/Chennai': 'India',
    'Asia/Delhi': 'India',
    'America/Los_Angeles': 'USA (Pacific)',
    'America/New_York': 'USA (Eastern)',
    'America/Chicago': 'USA (Central)',
    'America/Denver': 'USA (Mountain)',
    'Europe/London': 'United Kingdom',
    'Europe/Paris': 'France',
    'Europe/Berlin': 'Germany',
    'Asia/Tokyo': 'Japan',
    'Asia/Singapore': 'Singapore',
    'Asia/Dubai': 'UAE',
    'Australia/Sydney': 'Australia (Sydney)',
  };

  if (timezoneNames[timezone]) {
    return timezoneNames[timezone];
  }

  // Extract region from timezone string (e.g., "Asia/Kolkata" -> "Kolkata")
  const parts = timezone.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  return timezone;
}

/**
 * REACT HOOK: Use user's region with proper SSR handling
 *
 * IMPORTANT: This hook now:
 * 1. Always uses the restaurant's business hours (India)
 * 2. Always displays times in the user's ACTUAL browser timezone
 * 3. No region mapping - just direct timezone detection
 *
 * @returns { region: RegionConfig, isLoaded: boolean, browserTimezone: string }
 */
export function useUserRegion(): {
  region: RegionConfig;
  isLoaded: boolean;
  browserTimezone: string;
} {
  // Start with restaurant region for SSR consistency
  const [region, setRegion] = useState<RegionConfig>(getRestaurantRegion());
  const [browserTimezone, setBrowserTimezone] = useState<string>(RESTAURANT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Always detect the ACTUAL browser timezone - no caching, no mapping
    const actualTimezone = getBrowserTimezoneDirectly();
    setBrowserTimezone(actualTimezone);

    // Create a region config that uses user's timezone for display
    // but keeps restaurant's business hours
    const userRegion = createUserRegionConfig(actualTimezone);
    setRegion(userRegion);

    console.log(`[Timezone] User region set: ${userRegion.name} (${actualTimezone})`);
    setIsLoaded(true);
  }, []);

  return { region, isLoaded, browserTimezone };
}

/**
 * REACT HOOK: Get browser timezone with SSR safety
 *
 * Returns the user's ACTUAL browser timezone, not a mapped region timezone
 *
 * @returns { timezone: string, isLoaded: boolean }
 */
export function useBrowserTimezone(): { timezone: string; isLoaded: boolean } {
  const [timezone, setTimezone] = useState<string>(RESTAURANT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const actualTimezone = getBrowserTimezoneDirectly();
    setTimezone(actualTimezone);
    setIsLoaded(true);
  }, []);

  return { timezone, isLoaded };
}

/**
 * Clear any cached timezone data
 * Call this if user reports timezone issues
 */
export function clearTimezoneCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('user_region_cache');
    console.log('[Timezone] Cache cleared');
  } catch {
    // Ignore
  }
}
