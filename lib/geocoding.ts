import { logger } from '@/utils/logger';

/**
 * Geocode an address string to latitude and longitude using Google Maps API
 * @param address Full address string
 * @returns Object containing lat and lng, or null if failed
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      logger.warn('Google Maps API key not configured, skipping geocoding');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      logger.warn('Geocoding failed', { status: data.status, address });
      return null;
    }
  } catch (error) {
    logger.error('Error geocoding address', { error });
    return null;
  }
}
