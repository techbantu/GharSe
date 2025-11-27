/**
 * GEOLOCATION TIMEZONE DETECTION API
 *
 * Detects user's REAL timezone based on their IP address, not their device settings.
 * This prevents users with misconfigured device clocks from corrupting the ordering flow.
 *
 * Detection chain:
 * 1. Vercel's x-vercel-ip-timezone header (most accurate, free on Vercel)
 * 2. Vercel's x-vercel-ip-country → map to timezone
 * 3. Fallback to restaurant timezone (India)
 *
 * @author THE ARCHITECT
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// Country to timezone mapping for common countries
const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  // India
  IN: 'Asia/Kolkata',

  // United States (use most common timezone)
  US: 'America/New_York',

  // Other countries
  GB: 'Europe/London',
  UK: 'Europe/London',
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  JP: 'Asia/Tokyo',
  SG: 'Asia/Singapore',
  AE: 'Asia/Dubai',
  NZ: 'Pacific/Auckland',
  BR: 'America/Sao_Paulo',
  MX: 'America/Mexico_City',
  ZA: 'Africa/Johannesburg',
  KR: 'Asia/Seoul',
  CN: 'Asia/Shanghai',
  HK: 'Asia/Hong_Kong',
  TW: 'Asia/Taipei',
  TH: 'Asia/Bangkok',
  MY: 'Asia/Kuala_Lumpur',
  ID: 'Asia/Jakarta',
  PH: 'Asia/Manila',
  VN: 'Asia/Ho_Chi_Minh',
  PK: 'Asia/Karachi',
  BD: 'Asia/Dhaka',
  LK: 'Asia/Colombo',
  NP: 'Asia/Kathmandu',
  RU: 'Europe/Moscow',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels',
  CH: 'Europe/Zurich',
  AT: 'Europe/Vienna',
  PL: 'Europe/Warsaw',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki',
  IE: 'Europe/Dublin',
  PT: 'Europe/Lisbon',
  GR: 'Europe/Athens',
  TR: 'Europe/Istanbul',
  IL: 'Asia/Jerusalem',
  SA: 'Asia/Riyadh',
  EG: 'Africa/Cairo',
  NG: 'Africa/Lagos',
  KE: 'Africa/Nairobi',
  AR: 'America/Argentina/Buenos_Aires',
  CL: 'America/Santiago',
  CO: 'America/Bogota',
  PE: 'America/Lima',
};

// Friendly names for display
const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'America/New_York': 'USA (Eastern)',
  'America/Los_Angeles': 'USA (Pacific)',
  'America/Chicago': 'USA (Central)',
  'America/Denver': 'USA (Mountain)',
  'Europe/London': 'United Kingdom',
  'Asia/Tokyo': 'Japan',
  'Asia/Singapore': 'Singapore',
  'Asia/Dubai': 'UAE',
  'Australia/Sydney': 'Australia',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
};

// Restaurant default timezone
const RESTAURANT_TIMEZONE = process.env.RESTAURANT_TIMEZONE || 'Asia/Kolkata';

export async function GET(request: NextRequest) {
  try {
    // Method 1: Vercel's IP-based timezone detection (most accurate)
    const vercelTimezone = request.headers.get('x-vercel-ip-timezone');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelRegion = request.headers.get('x-vercel-ip-country-region');

    let detectedTimezone: string | null = null;
    let detectionMethod: string = 'fallback';
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Try Vercel's direct timezone header first
    if (vercelTimezone && vercelTimezone !== 'unknown') {
      detectedTimezone = vercelTimezone;
      detectionMethod = 'vercel-timezone';
      confidence = 'high';
      console.log(`[Geo] Detected timezone from Vercel header: ${vercelTimezone}`);
    }
    // Fall back to country-based detection
    else if (vercelCountry && COUNTRY_TIMEZONE_MAP[vercelCountry]) {
      detectedTimezone = COUNTRY_TIMEZONE_MAP[vercelCountry];
      detectionMethod = 'vercel-country';
      confidence = 'medium';
      console.log(`[Geo] Detected timezone from country ${vercelCountry}: ${detectedTimezone}`);
    }
    // Final fallback to restaurant timezone
    else {
      detectedTimezone = RESTAURANT_TIMEZONE;
      detectionMethod = 'restaurant-default';
      confidence = 'low';
      console.log(`[Geo] Using restaurant default timezone: ${detectedTimezone}`);
    }

    // Get display name
    const displayName = TIMEZONE_DISPLAY_NAMES[detectedTimezone] ||
      getDisplayNameFromTimezone(detectedTimezone);

    return NextResponse.json({
      success: true,
      timezone: detectedTimezone,
      displayName,
      detectionMethod,
      confidence,
      geo: {
        country: vercelCountry || null,
        city: vercelCity || null,
        region: vercelRegion || null,
      },
      // Include restaurant timezone for reference
      restaurantTimezone: RESTAURANT_TIMEZONE,
    });
  } catch (error) {
    console.error('[Geo] Timezone detection failed:', error);

    // Always return restaurant timezone on error
    return NextResponse.json({
      success: false,
      timezone: RESTAURANT_TIMEZONE,
      displayName: 'India',
      detectionMethod: 'error-fallback',
      confidence: 'low',
      error: 'Detection failed, using restaurant default',
      restaurantTimezone: RESTAURANT_TIMEZONE,
    });
  }
}

/**
 * Extract a friendly display name from a timezone string
 */
function getDisplayNameFromTimezone(timezone: string): string {
  // Extract city from timezone (e.g., "Asia/Kolkata" -> "Kolkata")
  const parts = timezone.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 1].replace(/_/g, ' ');
  }
  return timezone;
}
