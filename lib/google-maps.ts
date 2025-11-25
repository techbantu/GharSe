/**
 * GOOGLE MAPS INTEGRATION - Real-Time Delivery Tracking
 * 
 * Purpose: Provide maps functionality for live order tracking
 * 
 * Features:
 * - Initialize Google Maps API
 * - Geocode addresses to coordinates
 * - Calculate routes and ETA
 * - Draw polylines for routes
 * - Animate marker movement
 * - Handle map interactions
 * 
 * THIS IS THE "WOW FACTOR" FOR INVESTOR DEMOS
 */

// TypeScript types for Google Maps
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distance: number; // km
  duration: number; // minutes
  polyline: Coordinates[];
}

export interface MapConfig {
  center: Coordinates;
  zoom: number;
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

let googleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load Google Maps JavaScript API
 */
export async function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only be loaded in browser'));
      return;
    }

    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      console.log('[Google Maps] API loaded successfully');
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Initialize a Google Map instance
 */
export async function initializeMap(
  container: HTMLElement,
  config: MapConfig
): Promise<any> {
  await loadGoogleMaps();

  const defaultConfig = {
    center: config.center,
    zoom: config.zoom,
    disableDefaultUI: config.disableDefaultUI ?? false,
    zoomControl: config.zoomControl ?? true,
    streetViewControl: config.streetViewControl ?? false,
    fullscreenControl: config.fullscreenControl ?? true,
    mapTypeControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  };

  return new window.google.maps.Map(container, defaultConfig);
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(coords: Coordinates): Promise<string> {
  await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    const latlng = new window.google.maps.LatLng(coords.lat, coords.lng);

    geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
}

/**
 * Calculate route between two points with traffic
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteInfo> {
  await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const directionsService = new window.google.maps.DirectionsService();

    const request = {
      origin: new window.google.maps.LatLng(origin.lat, origin.lng),
      destination: new window.google.maps.LatLng(destination.lat, destination.lng),
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
      },
    };

    directionsService.route(request, (result: any, status: string) => {
      if (status === 'OK') {
        const route = result.routes[0];
        const leg = route.legs[0];

        // Extract polyline points
        const polyline: Coordinates[] = [];
        route.overview_path.forEach((point: any) => {
          polyline.push({
            lat: point.lat(),
            lng: point.lng(),
          });
        });

        resolve({
          distance: leg.distance.value / 1000, // Convert meters to km
          duration: Math.ceil(leg.duration.value / 60), // Convert seconds to minutes
          polyline,
        });
      } else {
        reject(new Error(`Route calculation failed: ${status}`));
      }
    });
  });
}

/**
 * Draw route polyline on map
 */
export function drawRoute(
  map: any,
  polyline: Coordinates[],
  color: string = '#4285F4'
): any {
  const path = polyline.map(
    (coord) => new window.google.maps.LatLng(coord.lat, coord.lng)
  );

  return new window.google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 4,
    map,
  });
}

/**
 * Create custom marker
 */
export function createMarker(
  map: any,
  position: Coordinates,
  options: {
    title?: string;
    icon?: string | { url: string; scaledSize?: any; anchor?: any };
    draggable?: boolean;
    animation?: 'DROP' | 'BOUNCE';
  } = {}
): any {
  const markerOptions: any = {
    position: new window.google.maps.LatLng(position.lat, position.lng),
    map,
    title: options.title,
    draggable: options.draggable ?? false,
  };

  if (options.icon) {
    markerOptions.icon = options.icon;
  }

  if (options.animation) {
    markerOptions.animation =
      window.google.maps.Animation[options.animation];
  }

  return new window.google.maps.Marker(markerOptions);
}

/**
 * Create custom markers for delivery tracking
 */
export function createDeliveryMarkers(map: any, pickupCoords: Coordinates, dropoffCoords: Coordinates, driverCoords?: Coordinates) {
  // Pickup marker (chef/restaurant)
  const pickupMarker = createMarker(map, pickupCoords, {
    title: 'Pickup Location',
    icon: {
      url: '/icons/restaurant-marker.svg',
      scaledSize: new window.google.maps.Size(40, 40),
    },
  });

  // Dropoff marker (customer)
  const dropoffMarker = createMarker(map, dropoffCoords, {
    title: 'Delivery Location',
    icon: {
      url: '/icons/home-marker.svg',
      scaledSize: new window.google.maps.Size(40, 40),
    },
  });

  // Driver marker (if available)
  let driverMarker = null;
  if (driverCoords) {
    driverMarker = createMarker(map, driverCoords, {
      title: 'Driver Location',
      icon: {
        url: '/icons/driver-marker.svg',
        scaledSize: new window.google.maps.Size(50, 50),
      },
    });
  }

  return { pickupMarker, dropoffMarker, driverMarker };
}

/**
 * Animate marker to new position (smooth transition)
 */
export function animateMarker(
  marker: any,
  newPosition: Coordinates,
  duration: number = 1000
): void {
  const startPosition = marker.getPosition();
  const endPosition = new window.google.maps.LatLng(newPosition.lat, newPosition.lng);

  const startLat = startPosition.lat();
  const startLng = startPosition.lng();
  const endLat = endPosition.lat();
  const endLng = endPosition.lng();

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (easeInOutQuad)
    const eased = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;

    const currentLat = startLat + (endLat - startLat) * eased;
    const currentLng = startLng + (endLng - startLng) * eased;

    marker.setPosition({ lat: currentLat, lng: currentLng });

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

/**
 * Fit map bounds to show all markers
 */
export function fitBounds(map: any, coordinates: Coordinates[]): void {
  const bounds = new window.google.maps.LatLngBounds();

  coordinates.forEach((coord) => {
    bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
  });

  map.fitBounds(bounds);

  // Add padding
  const padding = 100;
  map.panToBounds(bounds, padding);
}

/**
 * Calculate distance between two points (in km)
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in km

  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate arrival time based on distance and average speed
 */
export function estimateArrivalTime(
  distanceKm: number,
  averageSpeedKmh: number = 30
): {
  minutes: number;
  formattedTime: string;
} {
  const minutes = Math.ceil((distanceKm / averageSpeedKmh) * 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let formattedTime = '';
  if (hours > 0) {
    formattedTime = `${hours}h ${mins}m`;
  } else {
    formattedTime = `${mins} min`;
  }

  return { minutes, formattedTime };
}

/**
 * Get current location (browser geolocation API)
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Watch position (for driver tracking)
 */
export function watchPosition(
  callback: (coords: Coordinates) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

