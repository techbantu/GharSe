'use client';

/**
 * TIMEZONE REACT HOOKS - IP GEOLOCATION BASED
 *
 * BULLETPROOF timezone detection that NEVER trusts the device clock.
 *
 * Detection chain:
 * 1. Server-side IP geolocation (Vercel headers) - Most accurate
 * 2. Fallback to restaurant timezone (India) - Always safe
 *
 * WHY NOT TRUST THE BROWSER?
 * - User's laptop might be set to wrong timezone
 * - Someone in Hyderabad with Pacific time device would corrupt all orders
 * - Emails, chef prep times, delivery windows would all be wrong
 *
 * THIS APPROACH:
 * - Detects timezone from user's IP address (physical location)
 * - Works even if device clock is completely wrong
 * - Restaurant gets correct times, customers get correct times
 *
 * @author THE ARCHITECT
 * @version 3.0.0 - IP Geolocation Edition
 */

import { useState, useEffect, useCallback } from 'react';
import {
  RegionConfig,
  getRestaurantRegion,
  RESTAURANT_TIMEZONE,
} from './timezone-service';

interface GeoTimezoneResponse {
  success: boolean;
  timezone: string;
  displayName: string;
  detectionMethod: string;
  confidence: 'high' | 'medium' | 'low';
  geo?: {
    country: string | null;
    city: string | null;
    region: string | null;
  };
  restaurantTimezone: string;
  error?: string;
}

/**
 * Fetch timezone from server-side IP geolocation
 */
async function fetchGeoTimezone(): Promise<GeoTimezoneResponse> {
  try {
    const response = await fetch('/api/geo/timezone', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Geo API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Timezone] Geo detection result:', data);
    return data;
  } catch (error) {
    console.error('[Timezone] Geo detection failed:', error);
    // Return fallback response
    return {
      success: false,
      timezone: RESTAURANT_TIMEZONE,
      displayName: 'India',
      detectionMethod: 'fetch-error-fallback',
      confidence: 'low',
      restaurantTimezone: RESTAURANT_TIMEZONE,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a user-specific region config based on geo-detected timezone
 */
function createUserRegionConfig(
  geoTimezone: string,
  displayName: string
): RegionConfig {
  const restaurantRegion = getRestaurantRegion();

  return {
    ...restaurantRegion,
    id: 'GEO',
    name: displayName,
    timezone: geoTimezone,
    // Keep restaurant's business hours, minimumLeadTime, etc.
  };
}

/**
 * REACT HOOK: Use user's region based on IP geolocation
 *
 * This hook:
 * 1. Calls the geo API to detect timezone from IP (not device)
 * 2. Creates a region config with the detected timezone
 * 3. Falls back to restaurant timezone if detection fails
 *
 * NEVER trusts the browser's reported timezone.
 *
 * @returns { region, isLoaded, browserTimezone, geoInfo }
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
  const [geoInfo, setGeoInfo] = useState<{
    detectionMethod: string;
    confidence: 'high' | 'medium' | 'low';
    country: string | null;
    city: string | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function detectTimezone() {
      try {
        // Fetch timezone from server-side IP geolocation
        const geoResult = await fetchGeoTimezone();

        if (!isMounted) return;

        // Use the geo-detected timezone
        const timezone = geoResult.timezone;
        const displayName = geoResult.displayName;

        setBrowserTimezone(timezone);

        // Create region config with geo-detected timezone
        const userRegion = createUserRegionConfig(timezone, displayName);
        setRegion(userRegion);

        // Store geo info for debugging/display
        setGeoInfo({
          detectionMethod: geoResult.detectionMethod,
          confidence: geoResult.confidence,
          country: geoResult.geo?.country || null,
          city: geoResult.geo?.city || null,
        });

        console.log(
          `[Timezone] Region set via ${geoResult.detectionMethod}: ${displayName} (${timezone})`
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

  return { region, isLoaded, browserTimezone, geoInfo };
}

/**
 * REACT HOOK: Get timezone with SSR safety
 *
 * Returns the IP-detected timezone, not the browser's reported timezone.
 *
 * @returns { timezone: string, isLoaded: boolean }
 */
export function useBrowserTimezone(): { timezone: string; isLoaded: boolean } {
  const [timezone, setTimezone] = useState<string>(RESTAURANT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function detectTimezone() {
      try {
        const geoResult = await fetchGeoTimezone();
        if (isMounted) {
          setTimezone(geoResult.timezone);
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
