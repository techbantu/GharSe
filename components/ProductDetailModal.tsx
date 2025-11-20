/**
 * NEW FILE: Product Detail Modal
 * 
 * Purpose: Shows beautiful product details in an interactive modal when items are clicked
 * Features: Full product info, images, reviews, add to cart functionality
 */

'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Star, Flame, Leaf, WheatOff, Clock, Utensils, Scale } from 'lucide-react';
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
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem } = useCart();

  if (!isOpen || !item) return null;

  const handleAddToCart = () => {
    addItem(item, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Compact Vertical Card */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ padding: '16px' }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '420px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Section - Square, Clean */}
          <div 
            className="relative"
            style={{
              width: '100%',
              height: '320px',
              backgroundColor: '#f9fafb',
              overflow: 'hidden'
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: item.imagePosition 
                  ? `${50 + item.imagePosition.x}% ${50 + item.imagePosition.y}%`
                  : 'center center',
                transform: item.imagePosition 
                  ? `scale(${item.imagePosition.scale})` 
                  : 'scale(1)',
                display: 'block'
              }}
              onError={(e) => {
                e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='320'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='420' height='320' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='white' font-family='system-ui' font-weight='600'%3E${encodeURIComponent(item.name)}%3C/text%3E%3C/svg%3E`;
              }}
            />

            {/* Close Button - Top Right */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={20} style={{ color: '#374151' }} />
            </button>

            {/* Icon Badges - Top Left, Circular */}
            <div 
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              {item.isVegetarian && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  title="Vegetarian"
                >
                  <Leaf size={18} style={{ color: '#10b981' }} />
                </div>
              )}
              {item.spicyLevel && item.spicyLevel > 0 && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  title="Spicy"
                >
                  <Flame size={18} style={{ color: '#f97316' }} fill="#f97316" />
                </div>
              )}
              {item.isPopular && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  title="Popular"
                >
                  <Star size={18} style={{ color: '#fbbf24' }} fill="#fbbf24" />
                </div>
              )}
              {item.isVegan && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  title="Vegan"
                >
                  <Leaf size={18} className="text-green-800" fill="currentColor" />
                </div>
              )}
              {item.isGlutenFree && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  title="Gluten Free"
                >
                  <WheatOff size={18} className="text-amber-600" />
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div style={{ padding: '20px' }}>
            {/* Title */}
            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#1f2937',
              marginBottom: '12px',
              lineHeight: '1.2'
            }}>
              {item.name}
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.6',
              marginBottom: '16px'
            }}>
              {item.description}
            </p>

            {/* Key Stats Row */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              {item.preparationTime && (
                <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                  <Clock size={14} className="text-orange-500" />
                  <span>{item.preparationTime} mins</span>
                </div>
              )}
              {item.calories && (
                <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                  <Flame size={14} className="text-green-500" />
                  <span>{item.calories} kcal</span>
                </div>
              )}
              {item.servingSize && (
                <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  <Utensils size={14} className="text-blue-500" />
                  <span>{item.servingSize}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <span style={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#f97316'
              }}>
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span style={{
                  fontSize: '18px',
                  color: '#9ca3af',
                  textDecoration: 'line-through'
                }}>
                  ₹{item.originalPrice}
                </span>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {/* Quantity Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f3f4f6',
                borderRadius: '12px',
                padding: '8px 12px',
                minWidth: '120px'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Minus size={18} style={{ color: '#374151' }} />
                </button>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1f2937',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Plus size={18} style={{ color: '#374151' }} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '16px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s ease'
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
                <Plus size={20} />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Additional Info - Compact */}
            <div style={{
              padding: '12px 16px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#0369a1',
              lineHeight: '1.5'
            }}>
              ✓ Fresh ingredients • ✓ Home-cooked • ✓ Authentic recipes • ✓ Free delivery over ₹499
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;
