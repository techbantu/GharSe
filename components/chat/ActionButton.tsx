/**
 * GENIUS COMPONENT: Action Button - Interactive AI Chat Actions
 * 
 * Purpose: Renders clickable buttons from AI responses for seamless ordering
 * 
 * Features:
 * - Add to cart with one click
 * - Navigate to checkout
 * - View menu or specific items
 * - Shows loading state during execution
 * - Integrates with Cart Context
 * - Urgency indicators for high-demand items
 * 
 * Usage:
 * <ActionButton action={{type: 'add_to_cart', label: 'Add Butter Chicken', itemId: '...'}} />
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CreditCard, Menu as MenuIcon, Eye, ShoppingBag } from 'lucide-react';

interface ActionButtonProps {
  action: {
    type: 'add_to_cart' | 'add_all_to_cart' | 'checkout' | 'view_menu' | 'view_item';
    label: string;
    itemId?: string;
    itemName?: string;
    price?: number;
    quantity?: number;
    urgency?: {
      level: string;
      message: string;
      demandScore: number;
    };
    // For bulk "Add All" button
    items?: Array<{
      itemId: string;
      name: string;
      quantity: number;
      price: number;
      menuItem?: any; // NEW: Full menu item data from backend
    }>;
    totalPrice?: number;
    itemCount?: number;
  };
  onExecute?: () => void;
  sessionId?: string;
}

export function ActionButton({ action, onExecute, sessionId }: ActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // Track success state
  const [error, setError] = useState<string | null>(null);
  const { addItem, openCart, cart } = useCart();
  const router = useRouter();
  
  // GENIUS FIX: Check cart state on mount to persist success state across refreshes
  useEffect(() => {
    if (action.type === 'add_all_to_cart' && action.items && action.items.length > 0) {
      // Check if all items from "Add All" are already in cart
      const cartItemIds = new Set(
        cart.items.map(item => item.menuItem.id)
      );
      
      const allItemsInCart = action.items.every(item => 
        cartItemIds.has(item.itemId)
      );
      
      if (allItemsInCart) {
        // Items already added - show success state immediately
        setSuccess(true);
      }
    }
  }, [action.type, action.items, cart.items]);

  const handleClick = async () => {
    // Prevent clicking if already successful
    if (success) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      switch (action.type) {
        case 'add_to_cart':
          if (!action.itemId) {
            setError('Item information missing. Please try searching for the item again.');
            setLoading(false);
            return;
          }

          // Fetch menu item details from API
          const response = await fetch(`/api/menu`);
          if (!response.ok) {
            throw new Error('Failed to fetch menu');
          }

          const data = await response.json();
          
          // GENIUS FIX: Try multiple matching strategies
          let menuItem = data.items?.find((item: any) => item.id === action.itemId);
          
          // Fallback 1: Try matching by name (case-insensitive)
          if (!menuItem && action.itemName) {
            menuItem = data.items?.find((item: any) => 
              item.name.toLowerCase() === action.itemName.toLowerCase()
            );
          }
          
          // Fallback 2: Try fuzzy match on name
          if (!menuItem && action.itemName) {
            menuItem = data.items?.find((item: any) => 
              item.name.toLowerCase().includes(action.itemName.toLowerCase()) ||
              action.itemName.toLowerCase().includes(item.name.toLowerCase())
            );
          }

          if (!menuItem) {
            console.error('[ActionButton] Item not found:', {
              itemId: action.itemId,
              itemName: action.itemName,
              availableIds: data.items?.slice(0, 5).map((i: any) => i.id)
            });
            setError('Item not found in menu. Please try again.');
            setLoading(false);
            return;
          }

          // Add to cart using CartContext
          addItem(menuItem, action.quantity || 1);

          // Call onExecute callback
          if (onExecute) {
            onExecute();
          }

          break;

        case 'add_all_to_cart':
          // GENIUS FEATURE: Bulk add all items to cart
          if (!action.items || action.items.length === 0) {
            setError('No items to add.');
            setLoading(false);
            return;
          }

          // GENIUS FIX: Check if items are already in cart before adding
          const cartItemIds = new Set(
            cart.items.map(item => item.menuItem.id)
          );
          
          const itemsToAdd = action.items.filter(item => 
            !cartItemIds.has(item.itemId)
          );
          
          // If all items already in cart, just show success
          if (itemsToAdd.length === 0) {
            setSuccess(true);
            setLoading(false);
            if (onExecute) {
              onExecute();
            }
            return;
          }

          console.log('[ActionButton] Adding all items:', itemsToAdd.map(i => i.name));

          let successCount = 0;

          // Add each item to cart - items already have full menuItem data from backend
          for (const item of itemsToAdd) {
            try {
              // Check if we have menuItem data from backend
              if (item.menuItem) {
                console.log('[ActionButton] Using menuItem from backend:', item.menuItem.name);
                addItem(item.menuItem, item.quantity);
                successCount++;
              } else {
                // Fallback: Fetch from API if menuItem not provided
                console.log('[ActionButton] Fetching from API for:', item.name);
                const menuResponse = await fetch(`/api/menu`);
                if (!menuResponse.ok) {
                  throw new Error('Failed to fetch menu');
                }

                const menuData = await menuResponse.json();
                
                // Try exact ID match first
                let menuItem = menuData.items?.find((mi: any) => mi.id === item.itemId);
                
                // Fallback 1: Match by name
                if (!menuItem) {
                  menuItem = menuData.items?.find((mi: any) => 
                    mi.name.toLowerCase() === item.name.toLowerCase()
                  );
                }
                
                // Fallback 2: Fuzzy match
                if (!menuItem) {
                  menuItem = menuData.items?.find((mi: any) => 
                    mi.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(mi.name.toLowerCase())
                  );
                }
                
                if (menuItem) {
                  addItem(menuItem, item.quantity);
                  successCount++;
                } else {
                  console.warn('[ActionButton] Could not find item:', item.name);
                }
              }
            } catch (err) {
              console.error('[ActionButton] Error adding item:', item.name, err);
            }
          }

          console.log('[ActionButton] Successfully added:', successCount, 'of', itemsToAdd.length);

          if (successCount === 0) {
            setError('Failed to add items. Please try again.');
          } else {
            // SUCCESS! Keep button green permanently (persists across refreshes via useEffect)
            setSuccess(true);
            
            if (successCount < itemsToAdd.length) {
              console.log(`[ActionButton] Partial success: ${successCount} of ${itemsToAdd.length} items`);
            }
          }

          // Call onExecute callback
          if (onExecute) {
            onExecute();
          }

          break;

        case 'checkout':
          // Open cart sidebar which has checkout button
          if (typeof window !== 'undefined') {
            // Dispatch custom event to open cart sidebar
            const event = new CustomEvent('openCart');
            window.dispatchEvent(event);
          }
          break;

        case 'view_menu':
          // Scroll to menu section
          const menuSection = document.getElementById('menu');
          if (menuSection) {
            menuSection.scrollIntoView({ behavior: 'smooth' });
          }
          break;

        case 'view_item':
          if (action.itemId) {
            // Open product detail modal or scroll to item
            const itemElement = document.querySelector(`[data-item-id="${action.itemId}"]`);
            if (itemElement) {
              itemElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (err) {
      console.error('Error executing action:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  // Determine button style based on type and urgency
  const getButtonStyle = () => {
    // Bulk "Add All" button - match green checkout button size (symmetrical!)
    if (action.type === 'add_all_to_cart') {
      // SUCCESS STATE: Green gradient
      if (success) {
        return {
          background: 'linear-gradient(135deg, #10b981, #059669)', // Green success
          color: 'white',
          fontWeight: 600,
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center' as const,
          border: 'none',
          cursor: 'default',
          opacity: 1,
          transition: 'all 0.3s',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          minWidth: '140px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        };
      }
      
      // DEFAULT STATE: Purple gradient
      return {
        background: 'linear-gradient(135deg, #a855f7, #9333ea)', // Purple gradient
        color: 'white',
        fontWeight: 600, // Match checkout button weight
        padding: '10px 16px', // Match checkout button padding
        borderRadius: '8px',
        fontSize: '14px', // Match checkout button size
        textAlign: 'center' as const,
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'all 0.3s',
        boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)', // Lighter shadow
        minWidth: '140px', // Match checkout button
        height: '40px', // Match checkout button height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      };
    }
    
    // Checkout button - green
    if (action.type === 'checkout') {
      return {
        background: 'linear-gradient(135deg, #16a34a, #15803d)',
        color: 'white',
        fontWeight: 600,
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
        minWidth: '140px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      };
    }
    
    // Individual "Add to Cart" buttons - blue gradient (or red/orange for urgency)
    if (action.type === 'add_to_cart') {
      let background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
      let shadowColor = 'rgba(59, 130, 246, 0.3)';
      
      if (action.urgency && action.urgency.demandScore > 75) {
        background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        shadowColor = 'rgba(220, 38, 38, 0.3)';
      } else if (action.urgency && action.urgency.demandScore > 50) {
        background = 'linear-gradient(135deg, #ea580c, #c2410c)';
        shadowColor = 'rgba(234, 88, 12, 0.3)';
      }
      
      return {
        background,
        color: 'white',
        fontWeight: 600,
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'all 0.2s',
        boxShadow: `0 2px 8px ${shadowColor}`,
        minWidth: '140px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      };
    }
    
    // Default (view menu, view item)
    return {
      background: 'linear-gradient(135deg, #4b5563, #374151)',
      color: 'white',
      fontWeight: 500,
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.5 : 1,
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(75, 85, 99, 0.3)',
      minWidth: '140px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    };
  };

  // Get icon for button type
  const getButtonIcon = () => {
    switch (action.type) {
      case 'add_to_cart':
        return <ShoppingCart size={18} />;
      case 'add_all_to_cart':
        return <ShoppingBag size={18} />; // Match icon size with checkout
      case 'checkout':
        return <CreditCard size={18} />;
      case 'view_menu':
        return <MenuIcon size={18} />;
      case 'view_item':
        return <Eye size={18} />;
      default:
        return null;
    }
  };

  // Both buttons inline (side by side) with consistent sizing
  const containerStyle = {
    display: 'inline-block',
    marginRight: '8px',
    marginBottom: '8px',
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={action.label}
        style={getButtonStyle()}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            if (action.type === 'add_all_to_cart') {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.4)';
            } else if (action.type === 'checkout') {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.4)';
            } else {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          if (action.type === 'add_all_to_cart') {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(168, 85, 247, 0.3)';
          } else if (action.type === 'checkout') {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.3)';
          } else {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
          }
        }}
      >
        {loading ? (
          <>
            <div style={{ 
              width: '16px', // Consistent spinner size
              height: '16px', 
              border: '2px solid white', 
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite' 
            }} />
            <span style={{ fontSize: '14px' }}>
              {action.type === 'add_all_to_cart' ? 'Adding All...' : 'Adding...'}
            </span>
          </>
        ) : success && action.type === 'add_all_to_cart' ? (
          <>
            {/* SUCCESS STATE: Show checkmark and "Added X Items!" */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style={{ 
              fontSize: '14px',
              fontWeight: 600
            }}>
              Added {action.itemCount || action.items?.length || 0} Items!
            </span>
          </>
        ) : (
          <>
            {getButtonIcon()}
            <span style={{ 
              fontSize: '14px', // Consistent font size
              fontWeight: 600 // Consistent weight
            }}>
              {action.label.replace(/[🛒🚀📋👀⚡🔥➕]/g, '').replace(/\(₹[\d,]+\)/g, '').trim()}
            </span>
            {action.urgency && action.urgency.demandScore > 50 && (
              <span style={{ 
                fontSize: '11px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontWeight: 600 
              }}>
                Hot
              </span>
            )}
          </>
        )}
      </button>
      
      {error && (
        <p style={{ 
          fontSize: '12px', 
          color: '#f87171', 
          marginTop: '6px',
          marginBottom: 0 
        }}>
          {error}
        </p>
      )}
      
      {action.urgency && action.urgency.message && !error && (
        <p style={{ 
          fontSize: '12px', 
          color: '#fcd34d', 
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: 0
        }}>
          <span style={{ color: '#fbbf24' }}>⚡</span> {action.urgency.message}
        </p>
      )}
    </div>
  );
}

