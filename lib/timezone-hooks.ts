'use client';

/**
 * TIMEZONE REACT HOOKS - BROWSER-BASED DETECTION
 *
 * Uses the browser's actual timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`
 * to display times in the customer's local timezone.
 *
 * CORRECT BEHAVIOR:
 * - Business hours (10 AM - 10 PM) are ALWAYS in RESTAURANT timezone (India)
 * - Times are DISPLAYED in the USER's browser timezone
 * - Database stores UTC, frontend converts for display
 *
 * WHY TRUST THE BROWSER?
 * - Professional delivery apps (Uber Eats, DoorDash, Swiggy) all use browser timezone
 * - Users expect to see times in THEIR local timezone
 * - The browser's Intl API reflects what the user sees on their device
 * - If a user's clock is wrong, that's their device setting - we respect it
 *
 * @author THE ARCHITECT
 * @version 4.0.0 - Browser Timezone Edition
 */

import { useState, useEffect, useCallback } from 'react';
import {
  RegionConfig,
  getRestaurantRegion,
  RESTAURANT_TIMEZONE,
  getBrowserTimezone,
} from './timezone-service';

// Timezone display name mapping
const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'America/New_York': 'USA (Eastern)',
  'America/Los_Angeles': 'USA (Pacific)',
  'America/Chicago': 'USA (Central)',
  'America/Denver': 'USA (Mountain)',
  'America/Phoenix': 'USA (Arizona)',
  'Europe/London': 'United Kingdom',
  'Asia/Tokyo': 'Japan',
  'Asia/Singapore': 'Singapore',
  'Asia/Dubai': 'UAE',
  'Australia/Sydney': 'Australia (Sydney)',
  'Australia/Melbourne': 'Australia (Melbourne)',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Pacific/Auckland': 'New Zealand',
  'America/Toronto': 'Canada (Eastern)',
  'America/Vancouver': 'Canada (Pacific)',
};

/**
 * Get a friendly display name for a timezone
 */
function getTimezoneDisplayName(timezone: string): string {
  // Check for exact match
  if (TIMEZONE_DISPLAY_NAMES[timezone]) {
    return TIMEZONE_DISPLAY_NAMES[timezone];
  }

  // Extract city from timezone (e.g., "Asia/Kolkata" -> "Kolkata")
  const parts = timezone.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  return timezone;
}

/**
 * Detect timezone directly from browser
 * Returns the browser's Intl timezone or falls back to restaurant timezone
 */
function detectBrowserTimezoneDirectly(): {
  timezone: string;
  displayName: string;
  detectionMethod: string;
} {
  try {
    const browserTz = getBrowserTimezone();

    // If we got a valid timezone from the browser
    if (browserTz && browserTz !== 'UTC') {
      console.log(`[Timezone] Detected from browser: ${browserTz}`);
      return {
        timezone: browserTz,
        displayName: getTimezoneDisplayName(browserTz),
        detectionMethod: 'browser-intl',
      };
    }

    // Fallback to restaurant timezone
    console.log(`[Timezone] Browser returned ${browserTz}, using restaurant default`);
    return {
      timezone: RESTAURANT_TIMEZONE,
      displayName: 'India',
      detectionMethod: 'restaurant-fallback',
    };
  } catch (error) {
    console.error('[Timezone] Browser detection failed:', error);
    return {
      timezone: RESTAURANT_TIMEZONE,
      displayName: 'India',
      detectionMethod: 'error-fallback',
    };
  }
}

/**
 * Create a user-specific region config based on browser timezone
 *
 * CORRECT BEHAVIOR:
 * - Business hours (10 AM - 10 PM) are in RESTAURANT timezone (India)
 * - But we DISPLAY times in the USER's browser timezone
 * - So if kitchen closes at 10 PM India time, a US user sees that as 11:30 AM EST
 *
 * The timezone field controls how times are DISPLAYED to the user.
 * The businessHours are always interpreted as restaurant time (India).
 */
function createUserRegionConfig(
  browserTimezone: string,
  displayName: string
): RegionConfig {
  const restaurantRegion = getRestaurantRegion();

  return {
    ...restaurantRegion,
    id: 'IN', // Use 'IN' so API works correctly
    name: displayName, // Show user's detected location
    timezone: browserTimezone, // DISPLAY in user's browser timezone
    // Keep restaurant's business hours (these are in India time)
  };
}

/**
 * REACT HOOK: Use user's region based on browser timezone
 *
 * This hook:
 * 1. Detects timezone from browser's Intl API (user's device setting)
 * 2. Creates a region config with the detected timezone
 * 3. Falls back to restaurant timezone if detection fails
 *
 * TRUSTS the browser's reported timezone because:
 * - Users expect times shown in THEIR local timezone
 * - Professional apps (Uber Eats, DoorDash) all do this
 * - The browser timezone reflects what the user sees on their device
 *
 * @returns { region, isLoaded, browserTimezone, detectionInfo }
 */
export function useUserRegion(): {
  region: RegionConfig;
  isLoaded: boolean;
  browserTimezone: string;
  geoInfo: {
    detectionMethod: string;
    confidence: 'high' | 'medium' | 'low';
    country: string | null;
    city: string | null;
  } | null;
} {
  // Start with restaurant region for SSR consistency
  const [region, setRegion] = useState<RegionConfig>(getRestaurantRegion());
  const [browserTimezone, setBrowserTimezone] = useState<string>(RESTAURANT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [detectionInfo, setDetectionInfo] = useState<{
    detectionMethod: string;
    confidence: 'high' | 'medium' | 'low';
    country: string | null;
    city: string | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    function detectTimezone() {
      try {
        // Detect timezone directly from browser's Intl API
        const result = detectBrowserTimezoneDirectly();

        if (!isMounted) return;

        // Use the browser-detected timezone for DISPLAY
        // Business hours are still in India time, but we show times in user's timezone
        const timezone = result.timezone;
        const displayName = result.displayName;

        setBrowserTimezone(timezone);

        // Create region config with browser-detected timezone
        const userRegion = createUserRegionConfig(timezone, displayName);
        setRegion(userRegion);

        // Store detection info for debugging/display
        setDetectionInfo({
          detectionMethod: result.detectionMethod,
          confidence: result.detectionMethod === 'browser-intl' ? 'high' : 'low',
          country: null, // Browser doesn't tell us country
          city: null, // Browser doesn't tell us city
        });

        console.log(
          `[Timezone] Region set via ${result.detectionMethod}: ${displayName} (${timezone})`
        );
      } catch (error) {
        console.error('[Timezone] Detection failed:', error);
        // Keep restaurant defaults (already set in initial state)
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    detectTimezone();

    return () => {
      isMounted = false;
    };
  }, []);

  return { region, isLoaded, browserTimezone, geoInfo: detectionInfo };
}

/**
 * REACT HOOK: Get timezone with SSR safety
 *
 * Returns the user's browser timezone for DISPLAY purposes.
 * Business hours are still in India time, but we show times in user's timezone.
 *
 * @returns { timezone: string, isLoaded: boolean }
 */
export function useBrowserTimezone(): { timezone: string; isLoaded: boolean } {
  const [timezone, setTimezone] = useState<string>(RESTAURANT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    function detectTimezone() {
      try {
        const result = detectBrowserTimezoneDirectly();
        if (isMounted) {
          setTimezone(result.timezone);
        }
      } catch {
        // Keep restaurant default
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    detectTimezone();

    return () => {
      isMounted = false;
    };
  }, []);

  return { timezone, isLoaded };
}

/**
 * Force refresh timezone detection
 * Useful if user reports incorrect timezone
 */
export function useRefreshTimezone() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_region_cache');
      }
      // Force a page reload to re-detect
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return { refresh, isRefreshing };
}
