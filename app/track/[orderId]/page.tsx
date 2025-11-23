/**
 * LIVE ORDER TRACKING PAGE - Real-Time GPS Delivery Tracking
 * 
 * Purpose: Show customer their order delivery in real-time on map
 * 
 * Features:
 * - Full-screen Google Map
 * - Driver marker moving in real-time (updates every 5s)
 * - Route polyline from restaurant to customer
 * - ETA countdown
 * - Driver details panel
 * - "Call Driver" button
 * - Order summary overlay
 * 
 * THIS IS THE INVESTOR "WOW FACTOR" - UBER EATS LEVEL TRACKING
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Navigation, Phone, Clock, Package, User, Bike } from 'lucide-react';
import {
  initializeMap,
  createDeliveryMarkers,
  drawRoute,
  animateMarker,
  fitBounds,
  estimateArrivalTime,
  calculateDistance,
  type Coordinates,
} from '@/lib/google-maps';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: any[];
  pricing: {
    total: number;
  };
}

interface Delivery {
  id: string;
  orderId: string;
  partnerId: string | null;
  partner: {
    name: string;
    phone: string;
    vehicleType: string;
    currentLat?: number; // Current GPS location
    currentLng?: number; // Current GPS location
  } | null;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  status: string;
  estimatedArrival: string | null;
  distanceKm: number | null;
  estimatedMinutes: number | null;
}

export default function LiveTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any>(null);
  const [routeLine, setRouteLine] = useState<any>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);
  const [eta, setEta] = useState<{ minutes: number; formattedTime: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // WebSocket connection for real-time updates
  const { socket, isConnected } = useWebSocket();

  // Fetch order and delivery data
  useEffect(() => {
    fetchOrderAndDelivery();
  }, [orderId]);

  // Initialize map when delivery data is loaded
  useEffect(() => {
    if (delivery && mapRef.current && !map) {
      initMap();
    }
  }, [delivery, map]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (socket && delivery) {
      // Join delivery room
      socket.emit('join:delivery', { orderId: delivery.orderId });

      // Listen for location updates
      socket.on('delivery:location-update', handleLocationUpdate);

      // Listen for status changes
      socket.on('delivery:status-change', handleStatusChange);

      return () => {
        socket.off('delivery:location-update', handleLocationUpdate);
        socket.off('delivery:status-change', handleStatusChange);
      };
    }
  }, [socket, delivery]);

  async function fetchOrderAndDelivery() {
    try {
      // Fetch order details
      const orderRes = await fetch(`/api/orders/${orderId}`);
      if (!orderRes.ok) {
        throw new Error('Order not found');
      }
      const orderData = await orderRes.json();
      setOrder(orderData.order);

      // Fetch delivery details
      const deliveryRes = await fetch(`/api/delivery/${orderId}`);
      if (!deliveryRes.ok) {
        throw new Error('Delivery information not available');
      }
      const deliveryData = await deliveryRes.json();
      setDelivery(deliveryData.delivery);

      // Set initial driver location if available
      if (deliveryData.delivery.partner?.currentLat) {
        setDriverLocation({
          lat: deliveryData.delivery.partner.currentLat,
          lng: deliveryData.delivery.partner.currentLng,
        });
      }

      // Calculate ETA
      if (deliveryData.delivery.estimatedMinutes) {
        const distance = deliveryData.delivery.distanceKm || 0;
        const etaInfo = estimateArrivalTime(distance);
        setEta(etaInfo);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking');
    } finally {
      setLoading(false);
    }
  }

  async function initMap() {
    if (!delivery || !mapRef.current) return;

    try {
      // Initialize Google Map
      const googleMap = await initializeMap(mapRef.current, {
        center: {
          lat: (delivery.pickupLat + delivery.dropoffLat) / 2,
          lng: (delivery.pickupLng + delivery.dropoffLng) / 2,
        },
        zoom: 13,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(googleMap);

      // Create markers
      const pickupCoords = { lat: delivery.pickupLat, lng: delivery.pickupLng };
      const dropoffCoords = { lat: delivery.dropoffLat, lng: delivery.dropoffLng };
      const driverCoords = driverLocation || pickupCoords;

      const mapMarkers = createDeliveryMarkers(
        googleMap,
        pickupCoords,
        dropoffCoords,
        driverCoords
      );

      setMarkers(mapMarkers);

      // Draw route
      const route = drawRoute(googleMap, [pickupCoords, dropoffCoords], '#FF6B35');
      setRouteLine(route);

      // Fit map to show all markers
      const bounds = [pickupCoords, dropoffCoords];
      if (driverLocation) {
        bounds.push(driverLocation);
      }
      fitBounds(googleMap, bounds);

    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to load map');
    }
  }

  function handleLocationUpdate(data: { lat: number; lng: number; timestamp: string }) {
    console.log('Driver location update:', data);

    setDriverLocation({ lat: data.lat, lng: data.lng });

    // Update driver marker position with animation
    if (markers && markers.driverMarker) {
      animateMarker(markers.driverMarker, { lat: data.lat, lng: data.lng }, 1000);
    }

    // Recalculate ETA based on new position
    if (delivery) {
      const distance = calculateDistance(
        { lat: data.lat, lng: data.lng },
        { lat: delivery.dropoffLat, lng: delivery.dropoffLng }
      );
      const newEta = estimateArrivalTime(distance);
      setEta(newEta);
    }
  }

  function handleStatusChange(data: { status: string; timestamp: string }) {
    console.log('Delivery status changed:', data);

    setDelivery(prev => prev ? { ...prev, status: data.status } : null);

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Delivery Update', {
        body: getStatusMessage(data.status),
        icon: '/icon-192.png',
      });
    }
  }

  function getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      PENDING: 'Waiting for driver assignment',
      ASSIGNED: 'Driver has been assigned',
      PICKED_UP: 'Order picked up from restaurant',
      IN_TRANSIT: 'Driver is on the way',
      ARRIVED: 'Driver has arrived at your location',
      DELIVERED: 'Order delivered successfully',
    };
    return messages[status] || status;
  }

  function handleCallDriver() {
    if (delivery?.partner?.phone) {
      window.location.href = `tel:${delivery.partner.phone}`;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tracking Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Status Bar - Top */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-orange-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Order #{order?.orderNumber}
                </h1>
                <p className="text-sm text-gray-500">{getStatusMessage(delivery?.status || 'PENDING')}</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>

          {/* ETA Banner */}
          {eta && delivery?.status !== 'DELIVERED' && (
            <div className="mt-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Arriving in {eta.formattedTime}
                    </p>
                    <p className="text-xs text-gray-600">Estimated time</p>
                  </div>
                </div>
                {delivery?.distanceKm && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">
                      {delivery.distanceKm.toFixed(1)} km
                    </p>
                    <p className="text-xs text-gray-600">Distance</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Driver Info Panel - Bottom */}
      {delivery?.partner && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-2xl">
          <div className="px-6 py-4">
            {/* Handle Bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            {/* Driver Info */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{delivery.partner.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Bike className="w-4 h-4" />
                  {delivery.partner.vehicleType}
                </p>
              </div>
              <button
                onClick={handleCallDriver}
                className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Order Summary */}
            {order && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-800">Order Items</h4>
                </div>
                <div className="space-y-1">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {item.quantity}x {item.menuItem.name}
                    </p>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-lg font-bold text-gray-800">
                    Total: ₹{order.pricing.total}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Driver Assigned */}
      {!delivery?.partner && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-2xl p-6">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Finding a delivery partner...
            </h3>
            <p className="text-sm text-gray-600">
              We're assigning the nearest driver to your order
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

