'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Receipt,
  RotateCcw,
  ChevronRight,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ChefHat,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import CustomerCancelOrderModal from '@/components/CustomerCancelOrderModal';

// Order status configuration - Food-themed colors matching website palette
const ORDER_STATUS = {
  PENDING_CONFIRMATION: {
    label: 'Waiting for GharKha confirmation',
    color: '#f59e0b', // Warm amber (waiting)
    bgColor: '#FEF3C7', // Light amber background
    icon: Clock,
  },
  PENDING: {
    label: 'Preparing',
    color: '#f59e0b', // Warm amber (waiting)
    bgColor: '#FEF3C7', // Light amber background
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: '#f97316', // Orange (order confirmed)
    bgColor: '#FFF7ED', // Light orange background
    icon: CheckCircle2,
  },
  PREPARING: {
    label: 'Cooking',
    color: '#ea580c', // Deep orange/red (cooking - like fire)
    bgColor: '#FFEDD5', // Warm orange background
    icon: ChefHat,
  },
  OUT_FOR_DELIVERY: {
    label: 'On the Way',
    color: '#fb923c', // Warm orange (on the way)
    bgColor: '#FFEDD5', // Light orange background
    icon: Truck,
  },
  DELIVERED: {
    label: 'Delivered',
    color: '#10b981', // Fresh green (delivered successfully)
    bgColor: '#D1FAE5', // Light green background
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#dc2626', // Deep red (cancelled)
    bgColor: '#FEE2E2', // Light red background
    icon: XCircle,
  },
};

type OrderStatus = keyof typeof ORDER_STATUS;

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  deliveryAddress?: string;
  restaurantName?: string;
  items: Array<{
    id: string;
    name?: string;
    quantity: number;
    price: number;
    image?: string;
    customizations?: string;
    menuItemId?: string; // Reference to menu item
    menuItem?: {
      id: string;
      name: string;
      image?: string;
      price: number;
    };
  }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/my-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if order can be cancelled (before OUT_FOR_DELIVERY)
  const canCancelOrder = (order: Order): boolean => {
    const status = order.status?.toUpperCase();
    // Can cancel if status is PENDING_CONFIRMATION, PENDING, CONFIRMED, or PREPARING
    // Cannot cancel if OUT_FOR_DELIVERY, DELIVERED, or CANCELLED
    return ['PENDING_CONFIRMATION', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(status || '');
  };

  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    fetchOrders(); // Refresh orders list
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const handleReorder = async (orderId: string) => {
    try {
      // Find the order to reorder
      const orderToReorder = orders.find(order => order.id === orderId);
      
      if (!orderToReorder) {
        toast.error('Order Not Found', 'Could not find the order to reorder.');
        return;
      }

      // Check if order has items
      if (!orderToReorder.items || orderToReorder.items.length === 0) {
        toast.error('Empty Order', 'This order has no items to reorder.');
        return;
      }

      // Fetch current menu items to get latest prices
      const menuResponse = await fetch('/api/menu');
      if (!menuResponse.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const menuResponseData = await menuResponse.json();
      const menuItems = menuResponseData.data || menuResponseData.items || [];
      
      if (!Array.isArray(menuItems) || menuItems.length === 0) {
        console.error('[Reorder] No menu items found in API response:', menuResponseData);
        toast.error('Menu Unavailable', 'Could not fetch menu items. Please try again later.');
        return;
      }
      
      const menuItemsMap = new Map(menuItems.map((item: any) => [item.id, item]));

      // Add each item from the order to cart
      let addedCount = 0;
      let skippedCount = 0;
      const skippedItems: string[] = [];

      for (const orderItem of orderToReorder.items) {
        try {
          // Extract data from nested structure (API returns item.menuItem.id, item.menuItem.name)
          const menuItemId = orderItem.menuItemId || orderItem.menuItem?.id || orderItem.id;
          const itemName = orderItem.menuItem?.name || orderItem.name;
          
          // Try to find the menu item by ID or name
          let menuItem = null;
          
          // First try to find by menuItemId
          if (menuItemId) {
            menuItem = menuItemsMap.get(menuItemId);
          }
          
          // If not found by ID, try to find by name
          if (!menuItem && itemName) {
            menuItem = menuItems.find((item: any) => 
              item.name.toLowerCase() === itemName.toLowerCase()
            );
          }

          if (!menuItem) {
            console.warn('[Reorder] Menu item not found:', itemName || 'Unknown item');
            skippedCount++;
            skippedItems.push(itemName || 'Unknown item');
            continue;
          }

          // Create cart-compatible menu item
          const cartMenuItem = {
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description || '',
            price: menuItem.price,
            category: menuItem.category || 'MAIN_COURSE',
            image: menuItem.image,
            isAvailable: menuItem.isAvailable !== false,
            isVegetarian: menuItem.isVegetarian || false,
            isSpicy: menuItem.isSpicy || false,
            preparationTime: menuItem.preparationTime || 20,
            calories: menuItem.calories,
            ingredients: menuItem.ingredients || [],
            allergens: menuItem.allergens || [],
          };

          // Add item to cart with original quantity
          addItem(cartMenuItem, orderItem.quantity);
          console.log(`[Reorder] Added ${cartMenuItem.name} (quantity: ${orderItem.quantity})`);
          addedCount++;
        } catch (error) {
          const itemName = orderItem.menuItem?.name || orderItem.name || 'Unknown item';
          console.error(`[Reorder] Error adding item ${itemName}:`, error);
          skippedCount++;
          skippedItems.push(itemName);
        }
      }

      // Show success/warning message
      if (addedCount > 0) {
        if (skippedCount > 0) {
          toast.warning(
            'Partial Reorder', 
            `Added ${addedCount} item(s) to cart. ${skippedCount} item(s) skipped: ${skippedItems.join(', ')}`
          );
        } else {
          toast.success('Order Added to Cart', `Added ${addedCount} item(s) from order #${orderToReorder.orderNumber} to your cart.`);
        }
        
        // Navigate to home page with cart open
        router.push('/?openCart=true');
      } else {
        toast.error('Reorder Failed', `Could not add any items to cart. Items may no longer be available: ${skippedItems.join(', ')}`);
      }
    } catch (error) {
      console.error('[Reorder] Error:', error);
      toast.error('Reorder Failed', 'Failed to reorder. Please try again.');
    }
  };

  const activeOrders = orders.filter(
    (order) =>
      order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
  );
  const completedOrders = orders.filter(
    (order) =>
      order.status === 'DELIVERED' || order.status === 'CANCELLED'
  );

  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  // Group orders by date
  const groupedOrders = displayOrders.reduce((acc, order) => {
    const dateKey = format(new Date(order.createdAt), 'MMM dd, yyyy');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      paddingBottom: '2rem',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '0.5rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight
                size={24}
                style={{ transform: 'rotate(180deg)', color: '#111827' }}
              />
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}>
              Orders
            </h1>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
          }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '1.5rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === 'active' ? '#111827' : '#F3F4F6',
                color: activeTab === 'active' ? '#ffffff' : '#6B7280',
              }}
            >
              Active {activeOrders.length > 0 && `(${activeOrders.length})`}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '1.5rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === 'completed' ? '#111827' : '#F3F4F6',
                color: activeTab === 'completed' ? '#ffffff' : '#6B7280',
              }}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '4px solid #F3F4F6',
              borderTop: '4px solid #F97316',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : displayOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
          }}>
            <Package size={64} style={{ color: '#D1D5DB', margin: '0 auto 1rem' }} />
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.5rem',
            }}>
              No {activeTab} orders
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6B7280',
            }}>
              {activeTab === 'active'
                ? 'Your active orders will appear here'
                : 'Your order history will appear here'}
            </p>
          </div>
        ) : (
          Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <div key={date} style={{ marginBottom: '2rem' }}>
              {/* Date Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}>
                <Calendar size={16} style={{ color: '#6B7280' }} />
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                }}>
                  {date}
                </h2>
              </div>

              {/* Order Cards - Grid on Desktop, Stack on Mobile */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem',
              }}>
                {dateOrders.map((order) => {
                  const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <div
                      key={order.id}
                      className="order-card"
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '1rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        border: '1px solid #E5E7EB',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                      }}
                    >
                      {/* Ultra Compact Order Card */}
                      <div
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="order-header"
                        style={{
                          padding: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        {/* Logo with Badge */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div className="restaurant-logo" style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <ChefHat size={24} style={{ color: 'white' }} />
                          </div>
                          {order.items.length > 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              backgroundColor: '#111827',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.5rem',
                              border: '2px solid white',
                            }}>
                              {order.items.length}x
                            </div>
                          )}
                        </div>

                        {/* Info Column */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                            justifyContent: 'space-between',
                              marginBottom: '0.25rem',
                            }}>
                            <h3 className="restaurant-title" style={{
                              fontSize: '0.9375rem',
                                fontWeight: 700,
                                color: '#111827',
                                margin: 0,
                              }}>
                                {order.restaurantName || 'Bantu\'s Kitchen'}
                              </h3>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: '#111827',
                            }}>
                              ${order.total.toFixed(2)}
                            </div>
                          </div>

                          <p style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            margin: '0 0 0.375rem 0',
                          }}>
                            {order.orderNumber}
                          </p>

                        {/* Status Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                          backgroundColor: statusConfig.bgColor,
                            borderRadius: '1rem',
                            border: `1px solid ${statusConfig.color}30`,
                        }}>
                            <StatusIcon size={12} style={{ color: statusConfig.color }} />
                          <span style={{
                              fontSize: '0.75rem',
                            fontWeight: 600,
                            color: statusConfig.color,
                          }}>
                            {statusConfig.label}
                          </span>
                        </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight size={20} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                      </div>

                      {/* Minimal Action Buttons */}
                      <div className="action-buttons" style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.625rem 0.875rem',
                        borderTop: '1px solid #F3F4F6',
                        backgroundColor: '#FAFAFA',
                      }}>
                        <button
                          className="action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.875rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.625rem',
                            backgroundColor: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            color: '#6B7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F9FAFB';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <Receipt size={14} />
                          Receipt
                        </button>

                        {/* Cancel Button - Show for cancellable orders */}
                        {canCancelOrder(order) && (
                          <button
                            className="action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick(order);
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.875rem',
                              border: 'none',
                              borderRadius: '0.625rem',
                              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              color: '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        )}

                        {/* Reorder Button - Show for delivered/cancelled orders */}
                        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                          <button
                            className="action-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(order.id);
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.875rem',
                              border: 'none',
                              borderRadius: '0.625rem',
                              background: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              color: '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <RotateCcw size={14} />
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .order-card {
            margin: 0 0.5rem;
          }

          .order-header {
            padding: 0.875rem !important;
          }

          .restaurant-logo {
            width: 40px !important;
            height: 40px !important;
          }

          .restaurant-title {
            font-size: 0.9375rem !important;
          }

          .item-card {
            width: 48px !important;
            height: 48px !important;
          }

          .action-buttons {
            padding: 0.625rem 0.875rem !important;
            gap: 0.375rem !important;
          }

          .action-button {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          .restaurant-info {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <CustomerCancelOrderModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setOrderToCancel(null);
          }}
          order={{
            id: orderToCancel.id,
            orderNumber: orderToCancel.orderNumber,
            total: orderToCancel.total,
            status: orderToCancel.status,
            paymentStatus: (orderToCancel as any).paymentStatus || 'PENDING',
            paymentMethod: (orderToCancel as any).paymentMethod, // CRITICAL FIX: Pass payment method
            createdAt: orderToCancel.createdAt,
            preparingAt: (orderToCancel as any).preparingAt,
          }}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

