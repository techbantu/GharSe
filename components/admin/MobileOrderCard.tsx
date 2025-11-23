import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Phone, 
  User, 
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';

interface MobileOrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

const MobileOrderCard: React.FC<MobileOrderCardProps> = ({ 
  order, 
  onStatusUpdate, 
  onViewDetails 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<string, string> = {
      'pending-confirmation': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'preparing': 'bg-purple-100 text-purple-800 border-purple-200',
      'ready': 'bg-green-100 text-green-800 border-green-200',
      'out-for-delivery': 'bg-orange-100 text-orange-800 border-orange-200',
      'delivered': 'bg-gray-100 text-gray-800 border-gray-200',
      'picked-up': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'refunded': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActionButtons = () => {
    switch (order.status) {
      case 'pending-confirmation':
      case 'pending':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'confirmed');
            }}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm shadow-sm active:scale-95 transition-transform"
          >
            Accept Order
          </button>
        );
      case 'confirmed':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'preparing');
            }}
            className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium text-sm shadow-sm active:scale-95 transition-transform"
          >
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'ready');
            }}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm shadow-sm active:scale-95 transition-transform"
          >
            Mark Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, order.orderType === 'delivery' ? 'out-for-delivery' : 'picked-up');
            }}
            className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-medium text-sm shadow-sm active:scale-95 transition-transform"
          >
            {order.orderType === 'delivery' ? 'Send for Delivery' : 'Mark Picked Up'}
          </button>
        );
      case 'out-for-delivery':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, 'delivered');
            }}
            className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-medium text-sm shadow-sm active:scale-95 transition-transform"
          >
            Complete Delivery
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3 active:border-orange-200 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">#{order.orderNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
              {order.status.replace(/-/g, ' ')}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {format(new Date(order.createdAt), 'h:mm a')}
          </span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-gray-700">
            <User size={16} className="text-gray-400" />
            <span className="font-medium text-sm">{order.customer.name}</span>
          </div>
          <div className="font-bold text-gray-900 flex items-center gap-1">
            <span className="text-xs text-gray-500 font-normal">Total:</span>
            ₹{order.pricing.total.toFixed(2)}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <ShoppingBag size={14} />
            <span>{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</span>
          </div>
          <div className="flex items-center gap-1">
            {order.orderType === 'delivery' ? <MapPin size={14} /> : <ShoppingBag size={14} />}
            <span className="capitalize">{order.orderType}</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2 mt-1">
          {getActionButtons()}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(order);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm active:bg-gray-200 transition-colors"
          >
            Details
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-gray-900">{item.quantity}x</span>
                  <span className="text-gray-700">{item.menuItem?.name || 'Unknown Item'}</span>
                </div>
                <span className="text-gray-500">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          {order.specialInstructions && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800">
              <span className="font-bold">Note:</span> {order.specialInstructions}
            </div>
          )}
          
          <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-sm font-medium">
            <span className="text-gray-500">Payment</span>
            <span className={order.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'}>
              {order.paymentStatus} ({order.paymentMethod})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOrderCard;
