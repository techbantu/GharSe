/**
 * Google Maps API Loader
 *
 * Purpose: Dynamically load Google Maps JavaScript API
 * Features:
 * - Lazy loading to improve performance
 * - Script caching to prevent duplicate loads
 * - Error handling
 * - Type safety with @types/google.maps
 */

let googleMapsPromise: Promise<typeof google.maps> | null = null;
let isLoaded = false;

export interface GoogleMapsConfig {
  apiKey: string;
  version?: string;
  libraries?: string[];
  language?: string;
  region?: string;
}

/**
 * Load Google Maps API script dynamically
 */
export async function loadGoogleMapsAPI(config: GoogleMapsConfig): Promise<typeof google.maps> {
  // Return cached instance if already loaded
  if (isLoaded && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  // Return existing promise if loading in progress
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const {
    apiKey,
    version = 'weekly',
    libraries = ['places', 'geometry'],
    language = 'en',
    region = 'IN',
  } = config;

  if (!apiKey) {
    throw new Error(
      'Google Maps API key is required. ' +
      'Get one from: https://console.cloud.google.com/google/maps-apis/credentials'
    );
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create callback function name
    const callbackName = `__googleMapsCallback_${Date.now()}`;

    // Define global callback
    (window as any)[callbackName] = () => {
      isLoaded = true;
      delete (window as any)[callbackName];
      resolve(window.google.maps);
    };

    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;

    // Build URL with parameters
    const params = new URLSearchParams({
      key: apiKey,
      callback: callbackName,
      v: version,
      libraries: libraries.join(','),
      language,
      region,
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

    // Error handling
    script.onerror = () => {
      delete (window as any)[callbackName];
      googleMapsPromise = null;
      reject(new Error('Failed to load Google Maps API. Check your API key and internet connection.'));
    };

    // Append to document
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Get current loaded Google Maps instance
 */
export function getGoogleMaps(): typeof google.maps | null {
  return isLoaded && window.google?.maps ? window.google.maps : null;
}

/**
 * Check if Google Maps is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded;
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const maps = getGoogleMaps();
  if (!maps) {
    throw new Error('Google Maps not loaded');
  }

  const geocoder = new maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else if (status === 'ZERO_RESULTS') {
        resolve(null);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const maps = getGoogleMaps();
  if (!maps) {
    throw new Error('Google Maps not loaded');
  }

  const from = new maps.LatLng(point1.lat, point1.lng);
  const to = new maps.LatLng(point2.lat, point2.lng);

  // Calculate distance in meters
  return maps.geometry.spherical.computeDistanceBetween(from, to);
}

/**
 * Calculate estimated travel time
 */
export async function calculateTravelTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' = 'DRIVING'
): Promise<{ distance: number; duration: number } | null> {
  const maps = getGoogleMaps();
  if (!maps) {
    throw new Error('Google Maps not loaded');
  }

  const service = new maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [new maps.LatLng(origin.lat, origin.lng)],
        destinations: [new maps.LatLng(destination.lat, destination.lng)],
        travelMode: maps.TravelMode[travelMode],
      },
      (response, status) => {
        if (status === 'OK' && response && response.rows[0]?.elements[0]) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            resolve({
              distance: element.distance.value, // meters
              duration: element.duration.value, // seconds
            });
          } else {
            resolve(null);
          }
        } else {
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      }
    );
  });
}

export default {
  loadGoogleMapsAPI,
  getGoogleMaps,
  isGoogleMapsLoaded,
  geocodeAddress,
  calculateDistance,
  calculateTravelTime,
};
