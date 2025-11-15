'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  ChefHat,
  Receipt,
  CreditCard,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

// Order status configuration
const ORDER_STATUS = {
  PENDING_CONFIRMATION: { label: 'Confirming Order', color: '#F97316', icon: Clock },
  PENDING: { label: 'Order Placed', color: '#F59E0B', icon: Package },
  CONFIRMED: { label: 'Confirmed', color: '#3B82F6', icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', color: '#8B5CF6', icon: ChefHat },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#F97316', icon: Truck },
  DELIVERED: { label: 'Delivered', color: '#10B981', icon: Home },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', icon: AlertCircle },
};

type OrderStatus = keyof typeof ORDER_STATUS;

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount?: number;
  tip?: number;
  createdAt: Date;
  estimatedDelivery?: Date;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  restaurantName?: string;
  dasherName?: string;
  dasherPhone?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    customizations?: string;
  }>;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
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
    );
  }

  if (!order) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: '2rem',
      }}>
        <Package size={64} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.5rem',
        }}>
          Order not found
        </h2>
        <button
          onClick={() => router.push('/orders')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#F97316',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
  const StatusIcon = statusConfig.icon;

  // Progress tracker
  const statusSteps: OrderStatus[] = ['PENDING_CONFIRMATION', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

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
              <ChevronLeft size={24} style={{ color: '#111827' }} />
            </button>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
              }}>
                Order Complete
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0,
              }}>
                {format(new Date(order.createdAt), 'EEEE, MMM dd, yyyy \'at\' h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem',
      }}>
        {/* Progress Tracker - Perfectly Aligned */}
        {!isCancelled && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              {/* Progress Line - Perfectly Centered */}
              <div style={{
                position: 'absolute',
                top: '24px', // Half of icon size (48px / 2)
                left: '10%',
                right: '10%',
                height: '3px',
                backgroundColor: '#E5E7EB',
                zIndex: 0,
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981 0%, #F97316 50%, #EF4444 100%)',
                  width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Status Steps - All Perfectly Aligned */}
              {statusSteps.map((step, index) => {
                const stepConfig = ORDER_STATUS[step];
                const StepIcon = stepConfig.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                // Define nice colors for each step
                const colors = {
                  PENDING: '#10B981',      // Green
                  CONFIRMED: '#3B82F6',    // Blue
                  PREPARING: '#8B5CF6',    // Purple
                  OUT_FOR_DELIVERY: '#F97316', // Orange
                  DELIVERED: '#10B981',    // Green
                };

                return (
                  <div
                    key={step}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {/* Icon Circle */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? colors[step] : '#ffffff',
                      border: `3px solid ${isCompleted ? colors[step] : '#E5E7EB'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                      transition: 'all 0.3s ease',
                      boxShadow: isCurrent ? `0 4px 12px ${colors[step]}40` : 'none',
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      <StepIcon
                        size={20}
                        style={{ color: isCompleted ? '#ffffff' : '#9CA3AF' }}
                      />
                    </div>
                    
                    {/* Label */}
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCompleted ? '#111827' : '#9CA3AF',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: '1.2',
                      maxWidth: '80px',
                    }}>
                      {stepConfig.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <p style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              fontSize: '0.875rem',
              color: '#6B7280',
              margin: '1.25rem 0 0 0',
            }}>
              {order.status === 'DELIVERED'
                ? 'Your order is complete. Enjoy!'
                : 'Your order is on its way!'}
            </p>
          </div>
        )}

        {/* Delivery Photo (if delivered) */}
        {order.status === 'DELIVERED' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem',
            }}>
              Order dropped off
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              marginBottom: '1rem',
            }}>
              If you are having trouble finding your order, message your Dasher or tap Help.
            </p>
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '0.75rem',
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={48} style={{ color: '#D1D5DB' }} />
            </div>
          </div>
        )}

        {/* Dasher Info */}
        {order.dasherName && order.status !== 'DELIVERED' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: '#F97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}>
                  {order.dasherName.charAt(0)}
                </div>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    margin: '0 0 0.25rem 0',
                  }}>
                    Your Dasher
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0,
                  }}>
                    {order.dasherName}
                  </p>
                </div>
              </div>
              <button
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={20} style={{ color: '#374151' }} />
              </button>
            </div>
          </div>
        )}

        {/* Restaurant & Items */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              backgroundColor: '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ChefHat size={24} style={{ color: '#F97316' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
              }}>
                {order.restaurantName || 'Bantu\'s Kitchen'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0,
              }}>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div style={{ marginBottom: '1.5rem' }}>
            {order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem 0',
                  borderBottom: index < order.items.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  backgroundColor: '#F97316',
                  flexShrink: 0,
                  position: 'relative',
                }}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ChefHat size={24} style={{ color: 'white' }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0,
                    }}>
                      {item.quantity}× {item.name}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0,
                    }}>
                      ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                    </p>
                  </div>
                  {item.customizations && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      margin: 0,
                    }}>
                      {item.customizations}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#F9FAFB',
            borderRadius: '0.75rem',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Subtotal</span>
              <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                ${order.subtotal?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Delivery Fee</span>
              <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                ${order.deliveryFee?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Estimated Tax</span>
              <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                ${order.tax?.toFixed(2) || '0.00'}
              </span>
            </div>
            {order.discount && order.discount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '0.875rem', color: '#10B981' }}>Discount</span>
                <span style={{ fontSize: '0.875rem', color: '#10B981' }}>
                  -${order.discount?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}
            <div style={{
              height: '1px',
              backgroundColor: '#E5E7EB',
              margin: '0.75rem 0',
            }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Total</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F97316' }}>
                ${order.total?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

