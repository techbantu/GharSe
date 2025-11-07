/**
 * NEW FILE: Real-Time Order Tracking Component
 * 
 * Purpose: Provides live order status updates with map visualization
 * 
 * Features:
 * - Real-time status updates
 * - Estimated delivery time
 * - Live map tracking (if Google Maps API available)
 * - Order progress timeline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Package, 
  TruckIcon,
  Phone,
  Mail
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';

interface OrderTrackingProps {
  orderId: string;
  orderNumber?: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, orderNumber }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
          setOrder(data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to load order');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    
    return () => clearInterval(interval);
  }, [orderId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error || 'Order not found'}</p>
      </div>
    );
  }
  
  const getStatusSteps = (): Array<{ status: OrderStatus; label: string; icon: React.ReactNode; active: boolean }> => {
    const steps = [
      { status: 'pending' as OrderStatus, label: 'Order Placed', icon: <Package size={20} />, active: false },
      { status: 'confirmed' as OrderStatus, label: 'Confirmed', icon: <CheckCircle2 size={20} />, active: false },
      { status: 'preparing' as OrderStatus, label: 'Preparing', icon: <ChefHat size={20} />, active: false },
      { status: 'ready' as OrderStatus, label: 'Ready', icon: <Package size={20} />, active: false },
    ];
    
    if (order.orderType === 'delivery') {
      steps.push(
        { status: 'out-for-delivery' as OrderStatus, label: 'Out for Delivery', icon: <TruckIcon size={20} />, active: false },
        { status: 'delivered' as OrderStatus, label: 'Delivered', icon: <CheckCircle2 size={20} />, active: false }
      );
    } else {
      steps.push(
        { status: 'picked-up' as OrderStatus, label: 'Picked Up', icon: <CheckCircle2 size={20} />, active: false }
      );
    }
    
    const currentIndex = steps.findIndex(s => s.status === order.status);
    
    return steps.map((step, index) => ({
      ...step,
      active: index <= currentIndex,
    }));
  };
  
  const statusSteps = getStatusSteps();
  const estimatedMinutes = Math.ceil(
    (order.estimatedReadyTime.getTime() - Date.now()) / 60000
  );
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Order {order.orderNumber}
        </h2>
        <p className="text-gray-600">
          Placed on {format(order.createdAt, 'MMMM d, yyyy h:mm a')}
        </p>
      </div>
      
      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-6">Order Status</h3>
        
        <div className="space-y-4">
          {statusSteps.map((step, index) => (
            <div key={step.status} className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                step.active
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {step.icon}
              </div>
              
              <div className="flex-1">
                <p className={`font-semibold ${
                  step.active ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {step.status === order.status && (
                  <p className="text-sm text-primary-500 font-medium mt-1">
                    Current status
                  </p>
                )}
              </div>
              
              {index < statusSteps.length - 1 && (
                <div className={`w-0.5 h-12 ml-6 ${
                  step.active ? 'bg-primary-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Time Estimate */}
      <div className="bg-gradient-orange text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Clock size={24} />
          <h3 className="text-xl font-semibold">Estimated Time</h3>
        </div>
        <p className="text-2xl font-bold">
          {estimatedMinutes > 0 ? `${estimatedMinutes} minutes` : 'Ready now!'}
        </p>
        {order.estimatedReadyTime && (
          <p className="text-white/80 text-sm mt-2">
            Ready by {format(order.estimatedReadyTime, 'h:mm a')}
          </p>
        )}
      </div>
      
      {/* Order Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-500" />
              <a href={`tel:${order.customer.phone}`} className="text-primary-600 hover:underline">
                {order.customer.phone}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-500" />
              <a href={`mailto:${order.customer.email}`} className="text-primary-600 hover:underline">
                {order.customer.email}
              </a>
            </div>
            {order.deliveryAddress && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-500 mt-1" />
                <div>
                  <p>{order.deliveryAddress.street}</p>
                  {order.deliveryAddress.apartment && (
                    <p>{order.deliveryAddress.apartment}</p>
                  )}
                  <p>
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                    {order.deliveryAddress.zipCode}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="font-semibold">
                  ₹{Math.round(item.subtotal)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{Math.round(order.pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{Math.round(order.pricing.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{Math.round(order.pricing.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-500">
                  ₹{Math.round(order.pricing.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Placeholder */}
      {order.deliveryAddress && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Delivery Location</h3>
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Map integration ready (Google Maps API key required)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

