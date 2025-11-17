/**
 * JOURNEY TIMELINE - Visual Order History
 *
 * Purpose: Replace boring order list with beautiful storytelling cards
 *
 * Features:
 * - Compact horizontal layout showing key info at a glance
 * - Prominent reorder buttons for eligible orders
 * - Status indicators and quick actions
 * - Expandable for detailed information
 *
 * Visual: Clean, information-dense order cards
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Calendar,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  UtensilsCrossed,
  PartyPopper,
  Crown,
  Trophy,
  Flame,
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  category: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date;
  confirmedAt?: Date | null;
  preparingAt?: Date | null;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  loyaltyPointsEarned?: number;
}

interface JourneyTimelineProps {
  orders: Order[];
  onReorder: (orderId: string) => void;
  onCancel?: (order: Order) => void;
}

// Status configurations
const STATUS_CONFIG = {
  PENDING: { color: '#A16207', bgColor: '#FEF3C7', icon: Clock, label: 'Pending' },
  CONFIRMED: { color: '#1D4ED8', bgColor: '#DBEAFE', icon: CheckCircle, label: 'Confirmed' },
  PREPARING: { color: '#C2410C', bgColor: '#FFEDD5', icon: Clock, label: 'Preparing' },
  READY: { color: '#7E22CE', bgColor: '#F3E8FF', icon: Package, label: 'Ready' },
  OUT_FOR_DELIVERY: { color: '#4338CA', bgColor: '#E0E7FF', icon: Truck, label: 'Out for Delivery' },
  DELIVERED: { color: '#15803D', bgColor: '#DCFCE7', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: '#B91C1C', bgColor: '#FEE2E2', icon: CheckCircle, label: 'Cancelled' },
};

// Cancellation window in minutes (should match server-side config)
const CANCELLATION_WINDOW_MINUTES = 10;
const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_MINUTES * 60 * 1000;

/**
 * Check if an order can be cancelled by customer
 * Client-side check (server-side validation is authoritative)
 */
const canCancelOrder = (order: Order): boolean => {
  // Normalize status to uppercase for comparison (handle both cases)
  const normalizedStatus = order.status.toUpperCase();

  // Cannot cancel if already cancelled or delivered
  if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'DELIVERED') {
    return false;
  }

  // Cannot cancel if preparation has started
  if (order.preparingAt) {
    return false;
  }

  // Calculate time since order creation
  const timeSinceCreation = Date.now() - new Date(order.createdAt).getTime();
  const isWithinTimeWindow = timeSinceCreation < CANCELLATION_WINDOW_MS;

  // PENDING orders can be cancelled if within time window
  if (normalizedStatus === 'PENDING') {
    return isWithinTimeWindow;
  }

  // CONFIRMED orders can be cancelled if within time window and not preparing
  if (normalizedStatus === 'CONFIRMED') {
    return isWithinTimeWindow;
  }

  // All other statuses cannot be cancelled
  return false;
};

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ orders, onReorder, onCancel }) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Insert milestone cards
  const cardsWithMilestones = insertMilestoneCards(orders);

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{
          width: '6rem',
          height: '6rem',
          margin: '0 auto 1.5rem',
          background: 'linear-gradient(to bottom right, #FED7AA, #FBCFE8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShoppingBag size={40} style={{ color: '#F97316' }} />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Your Culinary Journey Awaits</h3>
        <p style={{ color: '#4B5563', marginBottom: '1.5rem' }}>Your first order will be the beginning of an amazing food adventure!</p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(to right, #F97316, #EF4444)',
            color: '#ffffff',
            borderRadius: '0.75rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          Explore Menu
        </button>
      </div>
    );
  }

  // Extract milestones for banner display
  const milestones = cardsWithMilestones.filter(card => card.type === 'milestone');
  const orderCards = cardsWithMilestones.filter(card => card.type === 'order');

  return (
    <>
      <style jsx>{`
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Milestone Banner - Show above the grid */}
      {milestones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {milestones.map((card, index) => (
            <MilestoneBanner key={`milestone-${index}`} milestone={card.data} />
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Your Food Story</h2>
        <p style={{ color: '#4B5563', fontSize: '0.875rem', margin: 0 }}>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
      </div>

      {/* Timeline Grid - Orders Only - Responsive */}
      <div
        className="grid"
        style={{
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 320px))',
          justifyContent: 'start',
        }}
      >
        {orderCards.map((card, index) => {
          const order = card.data as Order;
          const uniqueKey = `${order.id}-${index}`;
          const isExpanded = expandedOrders.has(uniqueKey);
          const heroItem = order.items[0];

          // Extract menu item data (handle both structures: direct and nested)
          const getItemName = (item: any) => item.name || item.menuItem?.name || 'Delicious Dish';
          const getItemImage = (item: any) => {
            // Try multiple paths to find the image
            const image = item.image || item.menuItem?.image || item.dish?.image || null;
            
            // If we have an image and it's not a full URL, construct the full path
            if (image && !image.startsWith('http://') && !image.startsWith('https://') && !image.startsWith('/')) {
              // Prepend forward slash if missing
              return `/${image}`;
            }
            
            return image;
          };

          // Safety check: fallback to PENDING if status not found
          const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['PENDING'];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={uniqueKey}
              style={{
                position: 'relative',
                background: '#ffffff',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1,
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
            >
              {/* Metadata Header - Date & Status Badge - Compact */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                left: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                {/* Left: Date Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E5E7EB',
                }}>
                  <Calendar size={12} style={{ color: '#6B7280' }} />
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}>
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Right: Status Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: statusConfig.bgColor,
                  borderRadius: '0.375rem',
                  border: `1.5px solid ${statusConfig.color}`,
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                }}>
                  <StatusIcon size={12} style={{ color: statusConfig.color }} />
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: statusConfig.color,
                    textTransform: 'capitalize',
                  }}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Hero Image Section - Ultra Compact */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '6rem',
                backgroundColor: '#F97316',
                overflow: 'hidden',
              }}>
                {getItemImage(heroItem) ? (
                  <Image
                    src={getItemImage(heroItem)}
                    alt={getItemName(heroItem)}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  }}>
                    <UtensilsCrossed size={48} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  </div>
                )}
              </div>

              {/* Content Section - Ultra Compact */}
              <div style={{
                padding: '0.5rem 0.625rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}>

                {/* Order Title - Smaller */}
                <h3 style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.125rem',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                }}>
                  {generateHeadline(getItemName(heroItem), order.items.length)}
                </h3>

                {/* Order Metadata Row - Compact */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#6B7280',
                  }}>
                    <ShoppingBag size={12} style={{ color: '#6B7280' }} />
                    <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}>
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>

                {/* Action Buttons Row - Compact */}
                <div style={{
                  display: 'flex',
                  gap: '0.375rem',
                  marginTop: '0.125rem',
                }}>
                  {/* Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(uniqueKey);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.375rem 0.625rem',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      color: '#374151',
                      background: '#ffffff',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                  </button>

                  {/* Reorder Button - Show for completed orders */}
                  {order.items && order.items.length > 0 && (order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorder(order.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.375rem 0.625rem',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: '#ffffff',
                        border: 'none',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(249, 115, 22, 0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Reorder</span>
                    </button>
                  )}
                </div>

                {/* Expanded Details Section - Minimal White Space */}
                {isExpanded && (
              <div style={{
                padding: '0.375rem 0.5rem 0.5rem 0.5rem',
                borderTop: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
              }}>
                {/* Order Number & Status - Single Compact Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{
                      fontSize: '0.625rem',
                      color: '#6B7280',
                    }}>Order:</span>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#111827',
                      fontFamily: 'monospace',
                    }}>{order.orderNumber}</span>
                  </div>
                  
                  <div style={{
                    padding: '0.125rem 0.375rem',
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.color,
                    borderRadius: '0.25rem',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <StatusIcon size={10} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                {/* Date & Time - Single Compact Row */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '0.375rem',
                  fontSize: '0.6875rem',
                      color: '#6B7280',
                }}>
                  <span>
                    <strong style={{ color: '#111827' }}>{format(order.createdAt, 'MMM dd, yyyy')}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <strong style={{ color: '#111827' }}>{format(order.createdAt, 'h:mm a')}</strong>
                  </span>
                </div>

                {/* Items - Minimal Spacing */}
                <div style={{ marginBottom: '0.375rem' }}>
                  {order.items.map((item: any, idx: number) => {
                    const getItemName = (item: any) => item.name || item.menuItem?.name || 'Item';
                    const getItemPrice = (item: any) => item.price || item.menuItem?.price || 0;
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.1875rem 0',
                          borderBottom: idx < order.items.length - 1 ? '1px solid #F3F4F6' : 'none',
                        }}
                      >
                        <span style={{
                          fontSize: '0.6875rem',
                          color: '#374151',
                        }}>
                          {item.quantity}x {getItemName(item)}
                        </span>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: '#111827',
                        }}>
                          ₹{(item.quantity * getItemPrice(item)).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Total - Minimal */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.375rem 0.5rem',
                  backgroundColor: '#FFF7ED',
                  borderRadius: '0.25rem',
                  borderLeft: '2px solid #F97316',
                }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#111827',
                  }}>Total Paid</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#F97316',
                  }}>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};

/**
 * Milestone Banner Component - Horizontal banner above orders
 */
interface MilestoneBannerProps {
  milestone: {
    title: string;
    description: string;
    icon: string;
    theme: 'celebration' | 'streak' | 'seasonal';
  };
}

const MilestoneBanner: React.FC<MilestoneBannerProps> = ({ milestone }) => {
  const themeGradients = {
    celebration: 'linear-gradient(to right, #a855f7, #ec4899, #ef4444)',
    streak: 'linear-gradient(to right, #10b981, #059669, #047857)',
    seasonal: 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)',
  };

  return (
    <div style={{
      background: themeGradients[milestone.theme],
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blur */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '5rem',
        height: '5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        marginRight: '-2.5rem',
        marginTop: '-2.5rem',
      }} />

      {/* Icon */}
      <div style={{
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        {milestone.icon === 'celebration' || milestone.icon === '🎉' ? (
          <PartyPopper size={32} />
        ) : milestone.icon === 'crown' || milestone.icon === '👑' ? (
          <Crown size={32} />
        ) : milestone.icon === 'trophy' || milestone.icon === '🏆' ? (
          <Trophy size={32} />
        ) : milestone.icon === 'flame' || milestone.icon === '🔥' ? (
          <Flame size={32} />
        ) : (
          <PartyPopper size={32} />
        )}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: '0.25rem',
          margin: 0,
        }}>
          {milestone.title}
        </h3>
        <p style={{
          fontSize: '0.875rem',
          opacity: 0.95,
          margin: 0,
        }}>
          {milestone.description}
        </p>
      </div>
    </div>
  );
};

/**
 * Insert milestone cards at appropriate positions
 */
function insertMilestoneCards(orders: Order[]): Array<{ type: 'order' | 'milestone'; data: any }> {
  const cards: Array<{ type: 'order' | 'milestone'; data: any }> = [];

  orders.forEach((order, index) => {
    const orderCount = orders.length - index;

    // Add milestone cards at significant order counts
    if (orderCount === 10) {
      cards.push({
        type: 'milestone',
        data: {
          title: '10th Order Celebration!',
          description: "You're officially a regular! Here's to many more delicious meals.",
          icon: 'celebration', // Use string identifier instead of emoji
          theme: 'celebration',
        },
      });
    }

    if (orderCount === 25) {
      cards.push({
        type: 'milestone',
        data: {
          title: '25 Order Milestone!',
          description: "You're a true food enthusiast! Your culinary journey is inspiring.",
          icon: 'crown', // Use string identifier instead of emoji
          theme: 'celebration',
        },
      });
    }

    if (orderCount === 50) {
      cards.push({
        type: 'milestone',
        data: {
          title: 'Half Century!',
          description: "Legendary status achieved! You're part of the family now.",
          icon: 'trophy', // Use string identifier instead of emoji
          theme: 'celebration',
        },
      });
    }

    // Check for streaks (3+ consecutive days)
    if (index >= 2) {
      const isStreak = checkConsecutiveDays(orders.slice(index - 2, index + 1));
      if (isStreak) {
        cards.push({
          type: 'milestone',
          data: {
            title: '3-Day Streak!',
            description: 'You really love our food! We love serving you.',
            icon: 'flame', // Use string identifier instead of emoji
            theme: 'streak',
          },
        });
      }
    }

    cards.push({ type: 'order', data: order });
  });

  return cards;
}

/**
 * Check if orders are on consecutive days
 */
function checkConsecutiveDays(orders: Order[]): boolean {
  if (orders.length < 2) return false;

  for (let i = 0; i < orders.length - 1; i++) {
    const date1 = new Date(orders[i].createdAt);
    const date2 = new Date(orders[i + 1].createdAt);
    const daysDiff = Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff !== 1) return false;
  }

  return true;
}

/**
 * Generate emotional headline for order
 */
function generateHeadline(heroItemName: string, itemCount: number): string {
  const headlines = [
    `Your ${heroItemName} Adventure`,
    `${heroItemName} Night`,
    `${heroItemName} Feast`,
    `The ${heroItemName} Experience`,
    `${heroItemName} Delight`,
  ];

  if (itemCount > 3) {
    return `Grand Feast with ${heroItemName}`;
  }

  return headlines[Math.floor(Math.random() * headlines.length)];
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const orderDate = new Date(date);
  const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Yesterday';
  if (daysDiff < 7) return `${daysDiff} days ago`;

  return orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default JourneyTimeline;