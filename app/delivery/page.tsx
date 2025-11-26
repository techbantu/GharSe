/**
 * DELIVERY PARTNER APP - Driver Dashboard
 * 
 * Purpose: Mobile-first dashboard for delivery partners to manage deliveries
 * 
 * Features:
 * - Login for delivery partners
 * - View available/assigned orders
 * - Accept/Reject orders
 * - Real-time GPS location sharing
 * - Mark as Picked Up / Delivered
 * - Earnings overview
 * - Call customer functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, Phone, Navigation, Package, CheckCircle, 
  XCircle, Clock, DollarSign, User, LogOut, 
  AlertCircle, Loader2, RefreshCw, ChevronRight,
  Play, Pause, Home, Store
} from 'lucide-react';

interface DeliveryOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED';
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  estimatedMinutes: number;
  deliveryFee: number;
  driverPayout: number;
  items: Array<{ name: string; quantity: number }>;
  createdAt: string;
}

interface DriverStats {
  totalDeliveries: number;
  todayDeliveries: number;
  todayEarnings: number;
  rating: number;
  completionRate: number;
}

export default function DeliveryPartnerPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isOnline, setIsOnline] = useState(false);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [stats, setStats] = useState<DriverStats>({
    totalDeliveries: 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    rating: 0,
    completionRate: 0,
  });
  
  const [activeTab, setActiveTab] = useState<'orders' | 'active' | 'earnings'>('orders');

  // Check if driver is logged in
  useEffect(() => {
    const savedDriver = localStorage.getItem('delivery-driver');
    if (savedDriver) {
      try {
        const parsed = JSON.parse(savedDriver);
        setDriver(parsed);
        setIsLoggedIn(true);
        setIsOnline(parsed.isOnline || false);
      } catch (e) {
        localStorage.removeItem('delivery-driver');
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch available orders
  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn || !isOnline) return;
    
    try {
      const response = await fetch('/api/delivery/available-orders');
      if (response.ok) {
        const data = await response.json();
        setAvailableOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [isLoggedIn, isOnline]);

  // Poll for new orders every 10 seconds
  useEffect(() => {
    if (isLoggedIn && isOnline) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, isOnline, fetchOrders]);

  // Start location sharing
  const startLocationSharing = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Send location to server
        try {
          await fetch('/api/delivery/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverId: driver?.id,
              lat: latitude,
              lng: longitude,
            }),
          });
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocationSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setLocationWatchId(watchId);
    setIsLocationSharing(true);
  }, [driver]);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
    setIsLocationSharing(false);
  }, [locationWatchId]);

  // Toggle online status
  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    if (newStatus) {
      startLocationSharing();
    } else {
      stopLocationSharing();
    }
    
    // Update server
    try {
      await fetch('/api/delivery/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver?.id,
          isOnline: newStatus,
        }),
      });
      
      // Update local storage
      const updatedDriver = { ...driver, isOnline: newStatus };
      localStorage.setItem('delivery-driver', JSON.stringify(updatedDriver));
      setDriver(updatedDriver);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginPhone || loginPhone.length < 10) {
      setLoginError('Please enter a valid phone number');
      return;
    }
    
    try {
      const response = await fetch('/api/delivery/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.driver) {
        setDriver(data.driver);
        setIsLoggedIn(true);
        setStats(data.stats || stats);
        localStorage.setItem('delivery-driver', JSON.stringify(data.driver));
      } else {
        setLoginError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    stopLocationSharing();
    setIsLoggedIn(false);
    setDriver(null);
    setIsOnline(false);
    localStorage.removeItem('delivery-driver');
  };

  // Accept order
  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/delivery/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId: orderId,
          driverId: driver?.id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveDelivery(data.delivery);
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        setActiveTab('active');
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (status: string) => {
    if (!activeDelivery) return;
    
    try {
      const response = await fetch('/api/delivery/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId: activeDelivery.id,
          status,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (status === 'DELIVERED') {
          setActiveDelivery(null);
          setStats(prev => ({
            ...prev,
            todayDeliveries: prev.todayDeliveries + 1,
            todayEarnings: prev.todayEarnings + (activeDelivery.driverPayout || 0),
            totalDeliveries: prev.totalDeliveries + 1,
          }));
          setActiveTab('orders');
        } else {
          setActiveDelivery({ ...activeDelivery, status: status as any });
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Open navigation
  const openNavigation = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Call customer
  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-4">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">GharSe Delivery</h1>
            <p className="text-gray-400 mt-2">Partner Login</p>
          </div>
          
          <form onSubmit={handleLogin} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              Login
            </button>
            
            <p className="text-center text-gray-500 text-sm mt-4">
              Not a partner yet? Contact support to register.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">{driver?.name || 'Driver'}</h2>
                <p className="text-xs text-gray-400">{driver?.vehicleType} • {driver?.vehicleNumber}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Online Toggle */}
          <div className="mt-3 flex items-center justify-between bg-gray-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-white font-medium">
                {isOnline ? 'Online - Accepting Orders' : 'Offline'}
              </span>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isOnline ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isOnline ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {/* Location Status */}
          {isOnline && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {currentLocation 
                ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                : 'Getting location...'
              }
              {isLocationSharing && <span className="text-green-400">• Live</span>}
            </div>
          )}
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-3 border-t border-gray-700">
          <div className="p-3 text-center border-r border-gray-700">
            <p className="text-lg font-bold text-white">{stats.todayDeliveries}</p>
            <p className="text-xs text-gray-400">Today</p>
          </div>
          <div className="p-3 text-center border-r border-gray-700">
            <p className="text-lg font-bold text-green-400">₹{stats.todayEarnings}</p>
            <p className="text-xs text-gray-400">Earnings</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-amber-400">⭐ {stats.rating || '-'}</p>
            <p className="text-xs text-gray-400">Rating</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {/* Active Delivery Card */}
        {activeDelivery && (
          <div className="mb-4 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-orange-400 font-semibold text-sm">ACTIVE DELIVERY</span>
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {activeDelivery.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Order #{activeDelivery.orderNumber}</h3>
                <p className="text-sm text-gray-400">{activeDelivery.items.length} items • {activeDelivery.distanceKm?.toFixed(1)} km</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold text-green-400">₹{activeDelivery.driverPayout}</p>
                <p className="text-xs text-gray-400">Payout</p>
              </div>
            </div>
            
            {/* Pickup Location */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">PICKUP FROM</p>
                  <p className="text-white text-sm">{activeDelivery.pickupAddress}</p>
                </div>
                <button
                  onClick={() => openNavigation(activeDelivery.pickupLat, activeDelivery.pickupLng, 'Pickup')}
                  className="bg-blue-500 text-white p-2 rounded-lg"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Dropoff Location */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">DELIVER TO</p>
                  <p className="text-white text-sm">{activeDelivery.dropoffAddress}</p>
                  <p className="text-orange-400 text-sm font-medium mt-1">{activeDelivery.customerName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => callCustomer(activeDelivery.customerPhone)}
                    className="bg-green-500 text-white p-2 rounded-lg"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openNavigation(activeDelivery.dropoffLat, activeDelivery.dropoffLng, 'Delivery')}
                    className="bg-blue-500 text-white p-2 rounded-lg"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {activeDelivery.status === 'ASSIGNED' && (
                <button
                  onClick={() => updateDeliveryStatus('PICKED_UP')}
                  className="col-span-2 bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Mark as Picked Up
                </button>
              )}
              {activeDelivery.status === 'PICKED_UP' && (
                <button
                  onClick={() => updateDeliveryStatus('IN_TRANSIT')}
                  className="col-span-2 bg-amber-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Start Delivery
                </button>
              )}
              {(activeDelivery.status === 'IN_TRANSIT' || activeDelivery.status === 'ARRIVED') && (
                <button
                  onClick={() => updateDeliveryStatus('DELIVERED')}
                  className="col-span-2 bg-green-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        )}

        {/* Available Orders */}
        {!activeDelivery && isOnline && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Available Orders</h3>
              <button onClick={fetchOrders} className="text-orange-400 p-2">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            {availableOrders.length === 0 ? (
              <div className="bg-gray-800/50 rounded-2xl p-8 text-center">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No orders available</p>
                <p className="text-gray-500 text-sm mt-1">New orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((order) => (
                  <div key={order.id} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-white">#{order.orderNumber}</span>
                      </div>
                      <span className="text-green-400 font-bold">₹{order.driverPayout}</span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Store className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300 truncate">{order.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 truncate">{order.dropoffAddress}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>{order.distanceKm?.toFixed(1)} km</span>
                        <span>•</span>
                        <span>~{order.estimatedMinutes} min</span>
                      </div>
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1"
                      >
                        Accept
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offline Message */}
        {!isOnline && !activeDelivery && (
          <div className="bg-gray-800/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pause className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">You&apos;re Offline</h3>
            <p className="text-gray-400 mb-4">Go online to start receiving delivery requests</p>
            <button
              onClick={toggleOnlineStatus}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              Go Online
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${
              activeTab === 'orders' ? 'text-orange-400 bg-orange-500/10' : 'text-gray-400'
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs mt-1">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${
              activeTab === 'active' ? 'text-orange-400 bg-orange-500/10' : 'text-gray-400'
            }`}
          >
            <Navigation className="w-6 h-6" />
            <span className="text-xs mt-1">Active</span>
            {activeDelivery && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${
              activeTab === 'earnings' ? 'text-orange-400 bg-orange-500/10' : 'text-gray-400'
            }`}
          >
            <DollarSign className="w-6 h-6" />
            <span className="text-xs mt-1">Earnings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

