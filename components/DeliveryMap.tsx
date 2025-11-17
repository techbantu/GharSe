/**
 * Delivery Map Component - Live Delivery Tracking
 *
 * Purpose: Shows real-time delivery driver location on Google Maps
 * Features:
 * - Restaurant location marker
 * - Customer delivery address marker
 * - Delivery driver live location (updates via WebSocket)
 * - Route polyline
 * - ETA calculation
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI, calculateTravelTime } from '@/lib/maps/google-maps-loader';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface DeliveryMapProps {
  restaurantLocation: { lat: number; lng: number };
  deliveryLocation: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number } | null;
  orderId?: string;
  className?: string;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  restaurantLocation,
  deliveryLocation,
  driverLocation,
  orderId,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    restaurant?: google.maps.Marker;
    delivery?: google.maps.Marker;
    driver?: google.maps.Marker;
  }>({});
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    loadGoogleMapsAPI({ apiKey })
      .then((maps) => {
        if (!mapRef.current) return;

        // Create map
        const map = new maps.Map(mapRef.current, {
          center: deliveryLocation,
          zoom: 14,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        // Add restaurant marker
        markersRef.current.restaurant = new maps.Marker({
          position: restaurantLocation,
          map,
          title: 'GharSe Kitchen',
          icon: {
            url: '/images/markers/restaurant-marker.svg',
            scaledSize: new maps.Size(40, 40),
          },
        });

        // Add delivery address marker
        markersRef.current.delivery = new maps.Marker({
          position: deliveryLocation,
          map,
          title: 'Delivery Address',
          icon: {
            url: '/images/markers/home-marker.svg',
            scaledSize: new maps.Size(40, 40),
          },
        });

        // Fit bounds to show all markers
        const bounds = new maps.LatLngBounds();
        bounds.extend(restaurantLocation);
        bounds.extend(deliveryLocation);
        map.fitBounds(bounds);

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      // Cleanup markers
      Object.values(markersRef.current).forEach((marker) => marker?.setMap(null));
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
    };
  }, [restaurantLocation, deliveryLocation]);

  // Update driver marker when driver location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation) return;

    const maps = window.google.maps;

    // Remove old driver marker
    if (markersRef.current.driver) {
      markersRef.current.driver.setMap(null);
    }

    // Add new driver marker
    markersRef.current.driver = new maps.Marker({
      position: driverLocation,
      map: mapInstanceRef.current,
      title: 'Delivery Driver',
      icon: {
        url: '/images/markers/driver-marker.svg',
        scaledSize: new maps.Size(40, 40),
        anchor: new maps.Point(20, 20),
      },
      animation: maps.Animation.DROP,
    });

    // Update route from driver to delivery
    drawRoute(driverLocation, deliveryLocation);

    // Calculate ETA
    calculateTravelTime(driverLocation, deliveryLocation, 'DRIVING')
      .then((result) => {
        if (result) {
          setEta(Math.ceil(result.duration / 60)); // Convert to minutes
        }
      })
      .catch(console.error);

    // Recenter map to show driver and delivery
    const bounds = new maps.LatLngBounds();
    bounds.extend(driverLocation);
    bounds.extend(deliveryLocation);
    mapInstanceRef.current.fitBounds(bounds);
  }, [driverLocation, deliveryLocation]);

  // Draw route polyline
  const drawRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;

    const maps = window.google.maps;

    // Remove old route
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    // Create new route
    const directionsService = new maps.DirectionsService();

    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          const route = result.routes[0];
          const path = route.overview_path;

          routePolylineRef.current = new maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#DC2626',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: mapInstanceRef.current,
          });
        }
      }
    );
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg flex items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      {/* ETA Badge */}
      {eta && driverLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          <MapPin size={18} className="text-primary-500" />
          <div>
            <p className="text-xs text-gray-500">Estimated Arrival</p>
            <p className="text-lg font-bold text-gray-900">{eta} min</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-700">Restaurant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-700">Your Location</span>
        </div>
        {driverLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-gray-700">Delivery Driver</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryMap;
