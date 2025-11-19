/**
 * NEW FILE: Cart Sidebar - Sliding Cart Panel
 * 
 * Purpose: Provides a slide-out cart view allowing users to review items,
 * adjust quantities, and proceed to checkout without leaving current page.
 * 
 * UX: Smooth slide animation, backdrop overlay, and persistent cart state.
 */

'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Trash } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { restaurantInfo } from '@/data/menuData';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, onCheckout }) => {
  const { cart, updateQuantity, removeItem, itemCount, clearCart } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };
  
  const handleCheckout = () => {
    if (cart.items.length > 0) {
      onCheckout();
      onClose();
    }
  };
  
  return (
    <>
      <style jsx>{`
        /* 2-column grid for all screen sizes */
        .cart-items-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 0.75rem !important;
        }
        
        .cart-item-card {
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Mobile: Extra compact */
        @media (max-width: 640px) {
          .cart-items-grid {
            gap: 0.5rem !important;
          }
          
          .cart-item-card {
            padding: 0.5rem !important;
          }
          
          .cart-item-image {
            width: 55px !important;
            height: 55px !important;
          }
          
          .cart-item-name {
            font-size: 0.75rem !important;
            line-height: 1.2 !important;
            margin-bottom: 0.25rem !important;
            min-height: auto !important;
          }
          
          .cart-item-price {
            font-size: 0.875rem !important;
            font-weight: 700 !important;
          }
          
          .cart-quantity-controls {
            padding: 2px !important;
            gap: 4px !important;
          }
          
          .cart-quantity-btn {
            width: 24px !important;
            height: 24px !important;
          }
          
          .cart-quantity-display {
            width: 24px !important;
            font-size: 0.8125rem !important;
          }
          
          .cart-delete-btn {
            width: 24px !important;
            height: 24px !important;
          }
          
          .cart-item-details {
            gap: 0.375rem !important;
          }
        }
        
        /* Desktop: Slightly larger but still 2 columns */
        @media (min-width: 641px) {
          .cart-item-image {
            width: 65px !important;
            height: 65px !important;
          }
          
          .cart-item-name {
            font-size: 0.875rem !important;
            line-height: 1.3 !important;
          }
          
          .cart-item-price {
            font-size: 1rem !important;
          }
          
          .cart-quantity-btn {
            width: 28px !important;
            height: 28px !important;
          }
          
          .cart-delete-btn {
            width: 26px !important;
            height: 26px !important;
          }
        }
      `}</style>
      
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Cart Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header - Premium Design with Clear All Button */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Top Row: Title and Close Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {/* Restaurant Logo */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  flexShrink: 0
                }}>
                  <img
                    src="/images/GharSe.png"
                    alt="Bantu's Kitchen"
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      // Fallback to shopping bag icon if logo doesn't load
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.style.background = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
                        parent.style.backdropFilter = 'blur(10px)';
                        parent.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
                      }
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    marginBottom: '4px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Your Cart
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    lineHeight: '1.4'
                  }}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Clear All Button Row */}
            {cart.items.length > 0 && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1.5px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Trash size={16} strokeWidth={2.5} />
                <span>Clear All Items</span>
              </button>
            )}
            
            {/* Clear Confirmation */}
            {showClearConfirm && (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  marginBottom: '10px',
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  Remove all items from cart?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearCart}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      border: '1px solid rgba(220, 38, 38, 0.5)',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Cart Items - Auto-height with smart scrolling */}
          <div className="overflow-y-auto custom-scrollbar" style={{ 
            padding: '24px',
            flex: '0 1 auto',
            maxHeight: 'calc(100vh - 400px)' // Auto-height up to available space minus header + footer
          }}>
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center" style={{ padding: '48px 24px', minHeight: '200px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
                }}>
                  <ShoppingBag size={48} style={{ color: 'white' }} strokeWidth={2} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#1F2937',
                  marginBottom: '12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
                }}>
                  Your cart is empty
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#6B7280',
                  marginBottom: '32px',
                  lineHeight: '1.6'
                }}>
                  Add some delicious items to get started!
                </p>
                <button
                  onClick={onClose}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(to right, #f97316, #ea580c)',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                  }}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="cart-items-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="cart-item-card"
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Item Image - Centered and Compact */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <div className="cart-item-image" style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)'
                      }}>
                        <img
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 24px;">${item.menuItem.name.charAt(0)}</div>`;
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Item Details */}
                    <div className="cart-item-details" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Title and Remove Button */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                        <h3 className="cart-item-name" style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#1F2937',
                          lineHeight: '1.4',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          letterSpacing: '-0.01em',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {item.menuItem.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="cart-delete-btn"
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                        
                        {/* Customizations */}
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            marginBottom: '8px',
                            lineHeight: '1.5'
                          }}>
                            {Object.entries(item.customizations).map(([key, value]) => (
                              <div key={key} style={{ marginBottom: '2px' }}>
                                {key}: <span style={{ fontWeight: 600 }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Special Instructions */}
                        {item.specialInstructions && (
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            marginBottom: '8px',
                            fontStyle: 'italic',
                            lineHeight: '1.5'
                          }}>
                            Note: {item.specialInstructions}
                          </p>
                        )}
                        
                      {/* Quantity Controls and Price */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        paddingTop: '6px'
                      }}>
                        <div className="cart-quantity-controls" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#F9FAFB',
                          borderRadius: '10px',
                          padding: '3px'
                        }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="cart-quantity-btn"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #E5E7EB',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F3F4F6';
                              e.currentTarget.style.borderColor = '#D1D5DB';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#E5E7EB';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="cart-quantity-display" style={{
                            width: '32px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.9375rem',
                            color: '#1F2937'
                          }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="cart-quantity-btn"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, #f97316, #ea580c)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(249, 115, 22, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #ea580c, #dc2626)';
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(249, 115, 22, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(249, 115, 22, 0.3)';
                            }}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                        
                        <span className="cart-item-price" style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#f97316',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
                        }}>
                          ₹{Math.round(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer - Order Summary and Checkout */}
          {cart.items.length > 0 && (
            <div style={{
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              padding: '24px',
              background: 'linear-gradient(to bottom, #FFFFFF, #F9FAFB)'
            }}>
              {/* Delivery Notice - Premium Design */}
              {cart.subtotal < restaurantInfo.settings.freeDeliveryOver && (
                <div style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #DBEAFE, #E0F2FE)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>!</span>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#1E40AF',
                    fontWeight: 600,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    Add <span style={{ fontWeight: 700 }}>₹{Math.round(restaurantInfo.settings.freeDeliveryOver - cart.subtotal)}</span> more for free delivery!
                  </p>
                </div>
              )}
              
              {/* Price Breakdown - Premium Typography */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
                padding: '20px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9375rem',
                  color: '#4B5563',
                  lineHeight: '1.5'
                }}>
                  <span style={{ fontWeight: 500 }}>Subtotal</span>
                  <span style={{
                    fontWeight: 700,
                    color: '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    ₹{Math.round(cart.subtotal)}
                  </span>
                </div>
                
                {/* Only show discount if it exists and is greater than 0 */}
                {(cart.discount || 0) > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9375rem',
                    color: '#10B981',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ fontWeight: 500 }}>Discount</span>
                    <span style={{
                      fontWeight: 700,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      -₹{Math.round(cart.discount || 0)}
                    </span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9375rem',
                  color: '#4B5563',
                  lineHeight: '1.5'
                }}>
                  <span style={{ fontWeight: 500 }}>Delivery Fee</span>
                  <span style={{
                    fontWeight: 700,
                    color: cart.deliveryFee === 0 ? '#10B981' : '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    {cart.deliveryFee === 0 ? 'FREE' : `₹${Math.round(cart.deliveryFee)}`}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9375rem',
                  color: '#4B5563',
                  lineHeight: '1.5'
                }}>
                  <span style={{ fontWeight: 500 }}>Tax (GST 5%)</span>
                  <span style={{
                    fontWeight: 700,
                    color: '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    ₹{Math.round(cart.tax)}
                  </span>
                </div>
                
                <div style={{
                  paddingTop: '16px',
                  borderTop: '2px solid #E5E7EB',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Total
                  </span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#f97316',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.02em'
                  }}>
                    ₹{Math.round(cart.total)}
                  </span>
                </div>
              </div>
              
              {/* Checkout Button - Premium Design */}
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                  color: 'white',
                  padding: '18px 32px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '1.0625rem',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                Proceed to Checkout
                <ArrowRight size={20} strokeWidth={2.5} style={{ transition: 'transform 0.25s' }} />
              </button>
              
              {/* Continue Shopping - Refined Secondary Button */}
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  marginTop: '14px',
                  textAlign: 'center',
                  color: '#6B7280',
                  fontWeight: 600,
                  padding: '12px',
                  transition: 'all 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  borderRadius: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1F2937';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6B7280';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;

