/**
 * Floating Cart Bubble - Instant Feedback Animation
 * 
 * Purpose: Provides dopamine-inducing visual feedback when items are added to cart.
 * Appears near bottom-right, shows updated count, auto-hides after 2s, or opens cart on tap.
 * 
 * UX Philosophy: "Adding to cart should feel like magic, not a mystery."
 * - Instant feedback (no scrolling needed)
 * - Smooth animations (enters with bounce, exits gracefully)
 * - Interactive (tap to view cart)
 * - Non-intrusive (auto-dismisses)
 */

'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface FloatingCartBubbleProps {
  onCartClick: () => void; // Opens cart modal
}

export default function FloatingCartBubble({ onCartClick }: FloatingCartBubbleProps) {
  const { itemCount } = useCart();
  const [prevCount, setPrevCount] = useState(0);
  const [justChanged, setJustChanged] = useState(false); // Changed to track any change (add/remove)
  const [animationTimeout, setAnimationTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detect when items are added OR removed
    if (itemCount !== prevCount && itemCount >= 0) {
      // Item count changed! Trigger animation
      setJustChanged(true);

      // Clear existing timeout
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }

      // Stop animation after 1 second (but bubble stays visible)
      const timeout = setTimeout(() => {
        setJustChanged(false);
      }, 1000);

      setAnimationTimeout(timeout);
    }

    // Update previous count
    setPrevCount(itemCount);

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, [itemCount]);

  // Don't render if cart is empty
  if (itemCount === 0) {
    return null;
  }

  const handleBubbleClick = () => {
    // Clear animation timeout
    if (animationTimeout) {
      clearTimeout(animationTimeout);
    }
    
    // Stop animation
    setJustChanged(false);
    
    // Open cart modal
    onCartClick();
  };

  return (
    <>
      {/* Floating Cart Bubble - Cute & Magical Design */}
      <div
        onClick={handleBubbleClick}
        className={`
          fixed cursor-pointer
          transition-all duration-300 ease-out
          ${justChanged ? 'animate-bounce-in' : ''}
          hover:scale-105
        `}
        style={{
          bottom: '6.5rem', // 104px - more space above chat bubble
          right: '1.25rem', // 20px from right
          zIndex: 9998,
        }}
      >
        {/* Bubble Container */}
        <div className="relative">
          {/* Magical Glow Ring (when just changed) */}
          {justChanged && (
            <>
              {/* Outer glow */}
              <div 
                className="absolute animate-ping" 
                style={{
                  inset: '-0.25rem', // -4px
                  background: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
                  borderRadius: '9999px',
                }}
              />
              {/* Inner pulse */}
              <div 
                className="absolute animate-pulse" 
                style={{
                  inset: '-0.125rem', // -2px
                  background: 'rgba(34, 197, 94, 0.3)',
                  borderRadius: '9999px',
                  filter: 'blur(6px)',
                }}
              />
            </>
          )}

          {/* Main Bubble - Compact & Cute */}
          <div 
            className="relative text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              borderRadius: '9999px',
              boxShadow: justChanged 
                ? '0 8px 16px rgba(249, 115, 22, 0.4), 0 0 24px rgba(249, 115, 22, 0.2)' 
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              marginBottom: '0.5rem', // 8px extra spacing from chat
            }}
          >
            {/* Compact Content */}
            <div 
              className="flex items-center justify-center"
              style={{
                padding: '0.625rem', // 10px - much more compact
                gap: '0.5rem', // 8px
                minWidth: '3.5rem', // 56px
              }}
            >
              {/* Cart Icon - Smaller */}
              <ShoppingCart 
                style={{
                  width: '1.125rem', // 18px (smaller)
                  height: '1.125rem', // 18px
                  strokeWidth: 2.5,
                }}
              />

              {/* Item Count - Compact */}
              <div 
                className="font-bold leading-none"
                style={{
                  fontSize: '1.125rem', // 18px (smaller but readable)
                  letterSpacing: '-0.025em',
                }}
              >
                {itemCount}
              </div>
            </div>

            {/* Sparkle Effect (when changed) */}
            {justChanged && (
              <>
                {/* Top-right sparkle */}
                <div 
                  className="absolute animate-sparkle-1"
                  style={{
                    top: '-0.25rem', // -4px
                    right: '0.25rem', // 4px
                    width: '0.375rem', // 6px
                    height: '0.375rem', // 6px
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                  }}
                />
                {/* Bottom-left sparkle */}
                <div 
                  className="absolute animate-sparkle-2"
                  style={{
                    bottom: '0.125rem', // 2px
                    left: '0.125rem', // 2px
                    width: '0.25rem', // 4px
                    height: '0.25rem', // 4px
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
                  }}
                />
                {/* Top-left sparkle */}
                <div 
                  className="absolute animate-sparkle-3"
                  style={{
                    top: '0.5rem', // 8px
                    left: '-0.25rem', // -4px
                    width: '0.3rem', // 5px
                    height: '0.3rem', // 5px
                    background: '#fbbf24',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px rgba(251, 191, 36, 0.8)',
                  }}
                />
              </>
            )}

            {/* Success Badge (when just changed) */}
            {justChanged && (
              <div 
                className="absolute bg-green-500 animate-scale-in"
                style={{
                  top: '-0.375rem', // -6px
                  right: '-0.375rem', // -6px
                  borderRadius: '9999px',
                  padding: '0.125rem', // 2px
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
                  border: '1.5px solid white',
                }}
              >
                <Check 
                  style={{
                    width: '0.75rem', // 12px (tiny check)
                    height: '0.75rem', // 12px
                    strokeWidth: 3,
                  }}
                />
              </div>
            )}
          </div>

          {/* Cute Mini Tooltip */}
          <div 
            className="absolute whitespace-nowrap bg-gray-800 text-white pointer-events-none"
            style={{
              top: '-2rem', // -32px
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.625rem', // 10px (tiny text)
              paddingLeft: '0.5rem', // 8px
              paddingRight: '0.5rem', // 8px
              paddingTop: '0.25rem', // 4px
              paddingBottom: '0.25rem', // 4px
              borderRadius: '0.375rem', // 6px
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              opacity: 0.85,
              fontWeight: 500,
            }}
          >
            View cart
            {/* Tiny arrow */}
            <div 
              className="absolute bg-gray-800"
              style={{
                bottom: '-0.125rem', // -2px
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '0.375rem', // 6px
                height: '0.375rem', // 6px
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Sparkle animations - magical! */
        @keyframes sparkle-1 {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          25% {
            opacity: 1;
            transform: scale(1.5) rotate(90deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(1) rotate(180deg);
          }
          75% {
            opacity: 0.5;
            transform: scale(1.2) rotate(270deg);
          }
        }

        @keyframes sparkle-2 {
          0%, 100% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1.3) translateY(-4px);
          }
          60% {
            opacity: 0.6;
            transform: scale(0.8) translateY(-2px);
          }
        }

        @keyframes sparkle-3 {
          0%, 100% {
            opacity: 0;
            transform: scale(0) translateX(0);
          }
          40% {
            opacity: 1;
            transform: scale(1.4) translateX(-3px);
          }
          70% {
            opacity: 0.7;
            transform: scale(1) translateX(-1px);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-sparkle-1 {
          animation: sparkle-1 0.8s ease-out;
        }

        .animate-sparkle-2 {
          animation: sparkle-2 0.6s ease-out 0.1s;
        }

        .animate-sparkle-3 {
          animation: sparkle-3 0.7s ease-out 0.15s;
        }
      `}</style>
    </>
  );
}


