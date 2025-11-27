/**
 * ProductDetailModal - Unified Product Detail View
 * 
 * DESIGN PRINCIPLES:
 * 1. ONE consistent layout for ALL items (available or not)
 * 2. Structure: Image → Name → Description → Stats → Price → Action
 * 3. Top-left: Dietary icons (Veg, Vegan, Gluten-free, Spicy)
 * 4. Top-right: Close button (ALWAYS visible, high z-index)
 * 5. Available items: Quantity selector + Add to Cart
 * 6. Unavailable items: Same layout, disabled "Currently Unavailable" button
 * 
 * NO conditional layouts. NO missing elements. ONE unified template.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Clock, Flame, Utensils, Leaf, WheatOff, Star, Ban } from 'lucide-react';
import { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  // Reset quantity when modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, item?.id]);

  // Don't render if not open or no item
  if (!isOpen || !item) return null;

  // Determine if item can be ordered
  const isAvailable = item.isAvailable !== false;
  const hasInventory = !item.inventoryEnabled || 
                       item.inventory === null || 
                       item.inventory === undefined || 
                       item.inventory > 0;
  const canOrder = isAvailable && hasInventory;

  // Handle add to cart
  const handleAddToCart = () => {
    if (!canOrder) return;
    addItem(item, quantity);
    setQuantity(1);
    onClose();
  };

  // Handle quantity changes
  const decrementQuantity = () => setQuantity(Math.max(1, quantity - 1));
  const incrementQuantity = () => setQuantity(Math.min(10, quantity + 1));

  // Build dietary badges array (only show icons that apply)
  const dietaryBadges: { icon: React.ReactNode; title: string; color: string }[] = [];
  
  if (item.isVegetarian) {
    dietaryBadges.push({
      icon: <Leaf size={16} />,
      title: 'Vegetarian',
      color: '#10b981'
    });
  }
  if (item.isVegan) {
    dietaryBadges.push({
      icon: <Leaf size={16} fill="currentColor" />,
      title: 'Vegan',
      color: '#059669'
    });
  }
  if (item.isGlutenFree) {
    dietaryBadges.push({
      icon: <WheatOff size={16} />,
      title: 'Gluten Free',
      color: '#d97706'
    });
  }
  if (item.spicyLevel && item.spicyLevel > 0) {
    dietaryBadges.push({
      icon: <Flame size={16} fill="currentColor" />,
      title: `Spicy Level ${item.spicyLevel}`,
      color: '#ef4444'
    });
  }
  if (item.isPopular) {
    dietaryBadges.push({
      icon: <Star size={16} fill="currentColor" />,
      title: 'Popular',
      color: '#f59e0b'
    });
  }

  return (
    <>
      {/* Backdrop - Click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {/* Modal Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          {/* ============================================ */}
          {/* IMAGE SECTION */}
          {/* ============================================ */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '280px',
              backgroundColor: '#f3f4f6',
              flexShrink: 0,
            }}
          >
            {/* Product Image */}
            <img
              src={item.image || '/images/placeholder-food.jpg'}
              alt={item.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.currentTarget.src = '/images/placeholder-food.jpg';
              }}
            />

            {/* CLOSE BUTTON - Top Right - ALWAYS visible */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                zIndex: 20, // Always on top
              }}
            >
              <X size={20} color="#374151" />
            </button>

            {/* DIETARY BADGES - Top Left */}
            {dietaryBadges.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  maxWidth: 'calc(100% - 70px)', // Leave room for close button
                  zIndex: 10,
                }}
              >
                {dietaryBadges.map((badge, index) => (
                  <div
                    key={index}
                    title={badge.title}
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                      color: badge.color,
                    }}
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
            )}

            {/* UNAVAILABLE OVERLAY - Only shows when item cannot be ordered */}
            {!canOrder && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 15, // Above image, below close button
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: '#dc2626',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Ban size={28} color="#ffffff" />
                </div>
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  Currently Unavailable
                </span>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* CONTENT SECTION */}
          {/* ============================================ */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {/* Product Name */}
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#1f2937',
                margin: '0 0 8px 0',
                lineHeight: 1.2,
              }}
            >
              {item.name}
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0 0 16px 0',
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </p>

            {/* Stats Row - Prep Time, Calories, Serving Size */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {item.preparationTime && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#fff7ed',
                    borderRadius: '8px',
                    border: '1px solid #fed7aa',
                    fontSize: '13px',
                    color: '#c2410c',
                  }}
                >
                  <Clock size={14} />
                  <span>{item.preparationTime} mins</span>
                </div>
              )}
              {item.calories && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                    fontSize: '13px',
                    color: '#16a34a',
                  }}
                >
                  <Flame size={14} />
                  <span>{item.calories} kcal</span>
                </div>
              )}
              {item.servingSize && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    fontSize: '13px',
                    color: '#2563eb',
                  }}
                >
                  <Utensils size={14} />
                  <span>{item.servingSize}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#ea580c',
                }}
              >
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span
                  style={{
                    fontSize: '16px',
                    color: '#9ca3af',
                    textDecoration: 'line-through',
                  }}
                >
                  ₹{item.originalPrice}
                </span>
              )}
            </div>

            {/* ============================================ */}
            {/* ACTION SECTION - Same structure, different state */}
            {/* ============================================ */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {/* Quantity Selector - Always same structure */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: canOrder ? '#f3f4f6' : '#f9fafb',
                  borderRadius: '12px',
                  padding: '6px',
                  opacity: canOrder ? 1 : 0.5,
                }}
              >
                <button
                  onClick={decrementQuantity}
                  disabled={!canOrder || quantity <= 1}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: canOrder ? 'pointer' : 'not-allowed',
                    opacity: quantity <= 1 ? 0.4 : 1,
                  }}
                >
                  <Minus size={18} color="#374151" />
                </button>
                <span
                  style={{
                    minWidth: '32px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1f2937',
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  disabled={!canOrder || quantity >= 10}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: canOrder ? 'pointer' : 'not-allowed',
                    opacity: quantity >= 10 ? 0.4 : 1,
                  }}
                >
                  <Plus size={18} color="#374151" />
                </button>
              </div>

              {/* Add to Cart / Unavailable Button */}
              <button
                onClick={canOrder ? handleAddToCart : undefined}
                disabled={!canOrder}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: canOrder ? 'none' : '2px solid #fecaca',
                  backgroundColor: canOrder 
                    ? '#ea580c' 
                    : '#fef2f2',
                  color: canOrder ? '#ffffff' : '#dc2626',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: canOrder ? 'pointer' : 'not-allowed',
                  boxShadow: canOrder 
                    ? '0 4px 12px rgba(234, 88, 12, 0.3)' 
                    : 'none',
                }}
              >
                {canOrder ? (
                  <>
                    <Plus size={20} />
                    <span>Add to Cart</span>
                  </>
                ) : (
                  <>
                    <Ban size={18} />
                    <span>Currently Unavailable</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer Info */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '10px',
                border: '1px solid #bae6fd',
                fontSize: '12px',
                color: '#0369a1',
                lineHeight: 1.5,
              }}
            >
              ✓ Fresh ingredients • ✓ Home-cooked • ✓ Authentic recipes • ✓ Free delivery over ₹499
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;
