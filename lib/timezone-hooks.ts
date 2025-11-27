'use client';

/**
 * TIMEZONE REACT HOOKS
 *
 * Client-side only React hooks for timezone handling.
 * These hooks must be used in client components only.
 *
 * @author THE ARCHITECT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import {
  RegionConfig,
  getRestaurantRegion,
  getCachedUserRegion,
  cacheUserRegion,
  detectBrowserRegion,
  detectBrowserTimezone,
  RESTAURANT_TIMEZONE,
} from './timezone-service';

/**
 * REACT HOOK: Use user's region with proper SSR handling
 *
 * Returns restaurant region during SSR, switches to browser region on client
 * This ensures hydration matches and UI updates smoothly
 *
 * @returns { region: RegionConfig, isLoaded: boolean }
 */
export function useUserRegion(): { region: RegionConfig; isLoaded: boolean } {
  const [region, setRegion] = useState<RegionConfig>(getRestaurantRegion());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Try cache first
    const cached = getCachedUserRegion();
    if (cached) {
      setRegion(cached);
      setIsLoaded(true);
      return;
    }

    // Detect from browser
    const browserRegion = detectBrowserRegion();
    if (browserRegion) {
      setRegion(browserRegion);
      cacheUserRegion(browserRegion);
    }
    setIsLoaded(true);
  }, []);

  return { region, isLoaded };
}

/**
 * REACT HOOK: Get browser timezone with SSR safety
 *
 * Returns restaurant timezone during SSR, switches to browser timezone on client
 *
 * @returns { timezone: string, isLoaded: boolean }
 */
export function useBrowserTimezone(): { timezone: string; isLoaded: boolean } {
  const [timezone, setTimezone] = useState<string>(RESTAURANT_TIMEZONE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const browserTz = detectBrowserTimezone();
    if (browserTz) {
      setTimezone(browserTz);
    }
    setIsLoaded(true);
  }, []);

  return { timezone, isLoaded };
}
