/**
 * NEW FILE: Menu Section - Interactive Menu Display
 * 
 * Purpose: Showcases all menu items with filtering, search, and quick add-to-cart.
 * Implements card-based layout with hover effects and detailed item information.
 * 
 * UX: Category filtering, dietary badges, and instant cart addition without
 * leaving the page.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ShoppingBag, Plus, Minus, X, ChevronDown, Filter, MapPin, UtensilsCrossed, Flame, Leaf, ChefHat, XCircle, Wheat, WheatOff, Palmtree, Store, Waves, Castle, PackageX, RefreshCw } from 'lucide-react';
import { MenuItem, MenuCategory } from '@/types';
import { useCart } from '@/context/CartContext';
import { useMenu } from '@/context/MenuContext';
import ProductDetailModal from './ProductDetailModal';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  STANDARD_CATEGORIES,
  StandardCategory,
  normalizeCategoryWithFallback,
  getCategoryColors,
  CATEGORY_COLORS
} from '@/lib/category-utils';

interface MenuSectionProps {
  onItemClick?: (item: MenuItem) => void;
}

// Regional cuisine configuration with proper icons
const REGIONAL_CUISINES = [
  { id: 'north-indian', name: 'North Indian', icon: MapPin, color: '#DC2626' },
  { id: 'south-indian', name: 'South Indian', icon: Palmtree, color: '#EA580C' },
  { id: 'street-food', name: 'Street Food', icon: Store, color: '#F97316' },
  { id: 'gujarati', name: 'Gujarati', icon: Wheat, color: '#F59E0B' },
  { id: 'bengali', name: 'Bengali', icon: Waves, color: '#10B981' },
  { id: 'rajasthani', name: 'Rajasthani', icon: Castle, color: '#8B5CF6' },
];

const MenuSection: React.FC<MenuSectionProps> = ({ onItemClick }) => {
  const { addItem, cart, updateQuantity, removeItem } = useCart();
  const { menuItems, isLoading: contextLoading, error: contextError, hasNewUpdate, clearUpdateFlag, refreshMenu } = useMenu();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [dietaryFilters, setDietaryFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, number>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  // Note: showUpdateNotification now comes from context as hasNewUpdate
  
  // Derived state from context
  const loading = contextLoading && menuItems.length === 0;
  const error = contextError;
  
  // Get actual quantity from cart for each item
  const getCartQuantity = (itemId: string): number => {
    const cartItem = cart.items.find(item => item.menuItem.id === itemId);
    return cartItem?.quantity || 0;
  };
  
  const isItemInCart = (itemId: string): boolean => {
    return cart.items.some(cartItem => cartItem.menuItem.id === itemId);
  };
  
  // Track window width for responsive design
  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);
  
  // =========================================================================
  // NORMALIZED MENU ITEMS - Single source of truth with consistent categories
  // =========================================================================
  const normalizedMenuItems = useMemo(() => {
    const seenIds = new Set<string>();
    
    return menuItems
      .filter(item => {
        // Remove duplicates
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
      .map(item => ({
        ...item,
        // Normalize category to standard form
        category: normalizeCategoryWithFallback(item.category) as MenuCategory,
        // Keep original for reference if needed
        _originalCategory: item.category,
      }));
  }, [menuItems]);

  // =========================================================================
  // CATEGORIES - Using standard categories, only showing those with items
  // IMPORTANT: Must be defined BEFORE useEffect that uses it
  // =========================================================================
  const categories = useMemo(() => {
    // Find which standard categories have items
    const categoriesWithItems = new Set<string>();
    for (const item of normalizedMenuItems) {
      categoriesWithItems.add(item.category);
    }
    
    // Return 'All' plus only categories that have items, in standard order
    return ['All', ...STANDARD_CATEGORIES.filter(cat => categoriesWithItems.has(cat))];
  }, [normalizedMenuItems]);

  // Handle URL parameters for regional filtering and category filtering
  useEffect(() => {
    const region = searchParams?.get('region');
    const category = searchParams?.get('category');
    
    if (region && REGIONAL_CUISINES.some(r => r.id === region)) {
      setSelectedRegion(region);
      // Scroll to menu section
      setTimeout(() => {
        const menuElement = document.getElementById('menu');
        if (menuElement) {
          menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    // Set category filter from URL parameter (wait for normalized items to load)
    if (category && normalizedMenuItems.length > 0) {
      const decodedCategory = decodeURIComponent(category);
      // Normalize the requested category to match our standard categories
      const normalizedRequestedCategory = normalizeCategoryWithFallback(decodedCategory);
      
      // Check if this category exists in our normalized menu
      if (categories.includes(normalizedRequestedCategory)) {
        setSelectedCategory(normalizedRequestedCategory);
      }
      // Scroll to menu section
      setTimeout(() => {
        const menuElement = document.getElementById('menu');
        if (menuElement) {
          menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [searchParams, normalizedMenuItems, categories]);
  
  // 🔔 Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (hasNewUpdate) {
      console.log('[MenuSection] 🔔 Real admin update detected - showing notification');
      const timer = setTimeout(() => {
        clearUpdateFlag();
      }, 5000); // Auto-hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [hasNewUpdate, clearUpdateFlag]);
  
  // Initialize database on first load (one-time)
  useEffect(() => {
    fetch('/api/database/init').catch(() => {
      // Ignore - might already be initialized
    });
  }, []);

  // =========================================================================
  // CATEGORY COUNTS - Accurate counts based on actual filtering
  // =========================================================================
  const getCategoryCount = useCallback((category: string): number => {
    // Count items that would show for this category
    // This must match the exact same logic as filteredItems!
    let items = normalizedMenuItems;
    
    // Apply category filter
    if (category !== 'All') {
      items = items.filter(item => item.category === category);
    }
    
    return items.length;
  }, [normalizedMenuItems]);
  
  // =========================================================================
  // CATEGORY COLORS - Using centralized color definitions
  // =========================================================================
  const getCategoryColor = useCallback((category: string, isActive: boolean) => {
    const colorKey = (category as StandardCategory | 'All') in CATEGORY_COLORS 
      ? (category as StandardCategory | 'All')
      : 'All';
    const colors = CATEGORY_COLORS[colorKey];
    
    return {
      bg: isActive ? colors.bgActive : colors.bg,
      hover: colors.hover,
      text: isActive ? colors.textActive : colors.text,
    };
  }, []);
  
  // =========================================================================
  // REGION DETECTION - Keyword-based (OPTIONAL - only as supplementary filter)
  // NOTE: This is a soft filter. If no items match, show all items.
  // =========================================================================
  const getItemRegion = useCallback((item: MenuItem): string | null => {
    const name = item.name.toLowerCase();
    const desc = item.description.toLowerCase();
    const category = item.category.toLowerCase();
    
    // North Indian - very specific keywords only
    if (name.includes('butter chicken') || name.includes('dal makhani') || 
        name.includes('naan') || name.includes('roti') || name.includes('paratha') ||
        desc.includes('punjabi') || desc.includes('north indian')) {
      return 'north-indian';
    }
    
    // South Indian - specific keywords
    if (name.includes('dosa') || name.includes('idli') || name.includes('sambar') ||
        name.includes('vada') || name.includes('uttapam') || name.includes('rasam') ||
        desc.includes('south indian') || desc.includes('tamil') || desc.includes('kerala')) {
      return 'south-indian';
    }
    
    // Street Food - specific items
    if (name.includes('pani puri') || name.includes('vada pav') || name.includes('chaat') ||
        name.includes('pav bhaji') || name.includes('samosa') || name.includes('bhel') ||
        desc.includes('street food')) {
      return 'street-food';
    }
    
    // Gujarati - specific items
    if (name.includes('dhokla') || name.includes('thepla') || name.includes('undhiyu') ||
        name.includes('khandvi') || name.includes('fafda') ||
        desc.includes('gujarati')) {
      return 'gujarati';
    }
    
    // Bengali - specific items  
    if (name.includes('ilish') || name.includes('mishti doi') || name.includes('rasgulla') ||
        name.includes('sandesh') || name.includes('macher jhol') ||
        desc.includes('bengali')) {
      return 'bengali';
    }
    
    // Rajasthani - specific items
    if (name.includes('dal baati') || name.includes('laal maas') || name.includes('ghewar') ||
        name.includes('ker sangri') || 
        desc.includes('rajasthani')) {
      return 'rajasthani';
    }
    
    // Return null - item doesn't clearly belong to a region
    return null;
  }, []);
  
  // =========================================================================
  // FILTERED ITEMS - Clean, predictable filtering logic
  // Uses normalized categories for accurate matching
  // =========================================================================
  const filteredItems = useMemo(() => {
    let items = normalizedMenuItems;
    
    // 1. Apply search filter (if searching, ignore category filter)
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      });
    } else {
      // 2. Apply category filter (only if not searching)
      if (selectedCategory !== 'All') {
        items = items.filter(item => item.category === selectedCategory);
      }
    }
    
    // 3. Apply regional filter (only if region is selected AND matches exist)
    if (selectedRegion !== 'all') {
      const regionFiltered = items.filter(item => {
        const itemRegion = getItemRegion(item);
        return itemRegion === selectedRegion;
      });
      // Only apply filter if there are matches, otherwise show all
      if (regionFiltered.length > 0) {
        items = regionFiltered;
      }
    }
    
    // 4. Apply dietary filters
    if (dietaryFilters.size > 0) {
      items = items.filter(item => {
        if (dietaryFilters.has('vegetarian') && !item.isVegetarian) return false;
        if (dietaryFilters.has('non-vegetarian') && item.isVegetarian) return false;
        if (dietaryFilters.has('vegan') && !item.isVegan) return false;
        if (dietaryFilters.has('spicy') && (item.spicyLevel == null || item.spicyLevel === 0)) return false;
        return true;
      });
    }
    
    return items;
  }, [normalizedMenuItems, searchQuery, selectedCategory, selectedRegion, dietaryFilters, getItemRegion]);

  // Toggle dietary filter
  const toggleDietaryFilter = (filter: string) => {
    setDietaryFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };
  
  // Helper function to check if item is in stock
  const isInStock = (item: MenuItem): boolean => {
    if (!item.isAvailable) return false; // Item removed from menu
    if (!item.inventoryEnabled) return true; // Inventory not tracked = always available
    if (item.inventory === null || item.inventory === undefined) return true; // Unlimited
    return item.inventory > 0; // Check stock count
  };

  // Helper function to get stock message
  const getStockMessage = (item: MenuItem): string => {
    if (!item.isAvailable) return 'Not on menu';
    if (!item.inventoryEnabled) return '';
    if (item.inventory === null || item.inventory === undefined) return '';
    if (item.inventory === 0) {
      return item.outOfStockMessage || 'Out of stock - Check back later!';
    }
    if (item.inventory <= 3) {
      return `Only ${item.inventory} left!`;
    }
    return '';
  };
  
  // Autocomplete dropdown results - only show when typing (limit to 8 items)
  const autocompleteResults = useMemo(() => {
    if (searchQuery.length === 0) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const seenIds = new Set<string>();
    
    return normalizedMenuItems
      .filter(item => {
        // Skip duplicates
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [normalizedMenuItems, searchQuery]);
  
  // Count total available items - LIVE FROM DATABASE (using normalized items)
  const totalAvailableItems = normalizedMenuItems.filter(item => isInStock(item)).length;
  const searchResultCount = filteredItems.length;
  
  // Increment quantity for a specific item in cart
  const incrementQuantity = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentQty = getCartQuantity(item.id);
    
    // Check inventory limit
    if (item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined) {
      if (currentQty >= item.inventory) {
        alert(`Sorry, only ${item.inventory} available!`);
        return;
      }
    }
    
    // Check max limit
    if (currentQty >= 10) {
      return;
    }
    
    addItem(item, 1); // Add one more
  };

  // Decrement quantity for a specific item in cart - allows going to zero
  const decrementQuantity = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentQty = getCartQuantity(item.id);
    const cartItem = cart.items.find(cartItem => cartItem.menuItem.id === item.id);
    
    if (!cartItem) {
      return; // Item not in cart
    }
    
    const newQty = currentQty - 1;
    
    if (newQty <= 0) {
      // Remove item from cart when quantity reaches zero
      removeItem(cartItem.id);
    } else {
      // Update quantity using updateQuantity (handles zero correctly)
      updateQuantity(cartItem.id, newQty);
    }
  };

  // Handle add to cart - always adds 1
  const handleAddToCart = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if item is in stock
    if (!isInStock(item)) {
      return;
    }
    
    const currentQty = getCartQuantity(item.id);
    
    // Check if enough inventory
    if (item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined) {
      if (currentQty + 1 > item.inventory) {
        alert(`Sorry, only ${item.inventory} available!`);
        return;
      }
    }
    
    addItem(item, 1);
    
    // Show temporary feedback
    setRecentlyAdded(prev => ({ ...prev, [item.id]: currentQty + 1 }));
    
    setTimeout(() => {
      setRecentlyAdded(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
    }, 800);
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1920px) {
          .menu-section {
            padding-top: 3rem !important;
            padding-bottom: 3rem !important;
          }
          .menu-header {
            margin-bottom: 1.5rem !important;
          }
          .menu-title {
            margin-bottom: 0.75rem !important;
          }
        }
        @keyframes slideInFromTop {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .menu-update-notification {
          animation: slideInFromTop 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
        }
      `}} />
      
      {/* Real-time Update Notification - only shows on REAL admin updates */}
      {hasNewUpdate && (
        <div 
          className="menu-update-notification"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(34, 197, 94, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <RefreshCw size={18} className="animate-spin" style={{ animationDuration: '2s' }} />
          Menu updated! Showing latest items.
        </div>
      )}
      
      <section id="menu" className="section bg-white py-16 md:py-20 lg:py-24 menu-section" suppressHydrationWarning>
      <div className="container-custom">
        {/* Section Header - Perfectly Centered */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
          paddingLeft: '16px',
          paddingRight: '16px'
          }} className="animate-slide-up menu-header">
          <h2 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            marginBottom: '32px',
            lineHeight: '1.1',
            letterSpacing: '-0.04em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            textAlign: 'center',
            color: '#1d1d1f'
            }} className="menu-title">
            Our <span className="text-gradient-orange" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite' }}>Menu</span>
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#4B5563',
            fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
            maxWidth: '768px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.75',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.011em'
          }}>
            Explore our selection of authentic Indian dishes, each prepared with fresh ingredients and traditional recipes.
          </p>
        </div>

        {/* Backdrop Overlay - Click to close search */}
        {showDropdown && searchQuery && (
          <div
            onClick={() => {
              setSearchQuery('');
              setShowDropdown(false);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
              cursor: 'pointer'
            }}
          />
        )}

        {/* Beautiful Search Bar with Autocomplete Dropdown - REDESIGNED */}
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto 40px auto',
          padding: '0 24px',
          position: 'relative',
          zIndex: 50
        }}>
          <div style={{ position: 'relative' }}>
            {/* Search Input Container with Background */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: isSearchFocused 
                  ? '0 12px 40px rgba(249, 115, 22, 0.25)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                border: isSearchFocused ? '3px solid #f97316' : '3px solid #f3f4f6',
                transition: 'all 0.3s ease',
                transform: isSearchFocused ? 'translateY(-2px)' : 'translateY(0)'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search 
                  size={24}
                  style={{ 
                    position: 'absolute',
                    left: '28px',
                    color: isSearchFocused ? '#f97316' : '#9ca3af',
                    transition: 'color 0.3s'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search for biryani, paneer, chicken curry..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '17px',
                    padding: '22px 28px 22px 68px',
                    background: 'transparent',
                    color: '#1f2937'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '24px',
                      background: '#e5e7eb',
                      border: 'none',
                      borderRadius: '50%',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  >
                    <X size={18} color="#6b7280" />
                  </button>
                )}
              </div>
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && searchQuery && autocompleteResults.length > 0 && (
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  left: '0',
                  right: '0',
                  background: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                  border: '2px solid #f3f4f6',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  zIndex: 51
                }}
              >
                {/* Results Header */}
                <div style={{ 
                  padding: '12px 16px', 
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Search size={16} className="text-white" />
                  <span className="text-white font-bold text-sm">
                    Search Results ({autocompleteResults.length})
                  </span>
                </div>

                {/* Results List */}
                <div>
                  {autocompleteResults.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDetailOpen(true);
                        setShowDropdown(false);
                      }}
                      className="border-b border-gray-100 hover:bg-orange-50 cursor-pointer transition-colors"
                      style={{ 
                        display: 'flex', 
                        padding: '12px 16px', 
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      {/* Item Image */}
                      <div 
                        className="flex-shrink-0 bg-gray-100 overflow-hidden"
                        style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '10px'
                        }}
                      >
                        <img
                          src={item.image}
                          alt={`${item.name} - ${item.description} | Order online from Bantu's Kitchen in Hayathnagar, Hyderabad`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: item.imagePosition 
                              ? `${50 + item.imagePosition.x}% ${50 + item.imagePosition.y}%`
                              : 'center 30%',
                            transform: item.imagePosition 
                              ? `scale(${item.imagePosition.scale})` 
                              : 'scale(1)'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f3f4f6;"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>';
                            }
                          }}
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-600 truncate" style={{ marginTop: '2px' }}>
                          {item.description}
                        </p>
                        <div className="flex items-center mt-1" style={{ gap: '6px' }}>
                          <span className="text-orange-600 font-black text-sm">
                            ₹{item.price}
                          </span>
                          {item.isVegetarian && <Leaf size={14} className="text-green-600" />}
                          {item.isVegan && <Leaf size={14} className="text-green-800" fill="currentColor" />}
                          {item.isGlutenFree && <WheatOff size={14} className="text-amber-600" />}
                          {item.spicyLevel && item.spicyLevel > 0 && <Flame size={14} className="text-red-500" fill="currentColor" />}
                        </div>
                      </div>

                      {/* Quick Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, e);
                        }}
                        className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:shadow-lg transition-all hover:scale-105"
                        style={{ padding: '8px 12px' }}
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State in Dropdown */}
            {showDropdown && searchQuery && autocompleteResults.length === 0 && (
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  left: '0',
                  right: '0',
                  background: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                  border: '2px solid #f3f4f6',
                  padding: '40px 24px',
                  textAlign: 'center',
                  zIndex: 51
                }}
              >
                <Search size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-800 text-base mb-2">No dishes found</p>
                <p className="text-sm text-gray-600">
                  Try searching for "biryani", "curry", or "naan"
                </p>
              </div>
            )}
          </div>
          
          {/* Search Results Counter - Only show when NOT typing */}
          {!searchQuery && (
            <div className="text-center" style={{ marginTop: '12px' }}>
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredItems.length}</span> {filteredItems.length === 1 ? 'dish' : 'dishes'}
              </p>
            </div>
          )}
        </div>

        {/* Apple-Level Category Tabs & Dietary Filters - STICKY */}
        <div 
          className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          style={{ marginTop: '32px', marginBottom: '40px' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            {/* Category Tabs - Compact on Mobile, Spacious on Desktop */}
            <div style={{ paddingTop: '1.25rem', paddingBottom: '1rem' }}>
              <div 
                className="grid grid-cols-3"
                style={{ 
                  gap: isDesktop ? '1rem' : '0.5rem',
                  paddingBottom: '0.5rem',
                  display: isDesktop ? 'flex' : 'grid',
                  flexWrap: isDesktop ? 'wrap' : 'nowrap',
                  justifyContent: isDesktop ? 'center' : 'stretch',
                  gridTemplateColumns: isDesktop ? 'none' : 'repeat(3, 1fr)'
                }}
              >
                {categories.map((category) => {
                  const count = getCategoryCount(category);
                  const isActive = selectedCategory === category;
                  const colors = getCategoryColor(category, isActive);
                  
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSearchQuery(''); // Clear search when switching categories
                      }}
                      className="flex items-center justify-center rounded-xl font-bold transition-all duration-200 whitespace-nowrap"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        gap: isDesktop ? '0.75rem' : '0.5rem',
                        padding: isDesktop ? '0.875rem 1.25rem' : '0.625rem 0.75rem',
                        fontSize: isDesktop ? '0.9375rem' : '0.75rem',
                        width: isDesktop ? 'auto' : '100%',
                        boxShadow: isActive 
                          ? '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                        transform: isActive ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                        border: isActive ? 'none' : `2px solid ${colors.text}15`,
                        fontWeight: isActive ? 800 : 700,
                        letterSpacing: '0.01em'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = colors.hover;
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = colors.bg;
                          e.currentTarget.style.color = colors.text;
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }
                      }}
                    >
                      <span>{category}</span>
                      <span 
                        className="rounded-full font-black"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.25)' : `${colors.text}15`,
                          color: isActive ? '#ffffff' : colors.text,
                          lineHeight: '1.2',
                          minWidth: isDesktop ? '24px' : '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: isDesktop ? '0.6875rem' : '0.625rem',
                          padding: isDesktop ? '0.125rem 0.5rem' : '0.125rem 0.375rem'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Regional Cuisine Filters - NEW! */}
            <div style={{ paddingBottom: '1rem', paddingTop: '0.5rem', borderBottom: '2px solid #F3F4F6' }}>
              <h3 style={{
                fontSize: isDesktop ? '1rem' : '0.875rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '0.75rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}>
                <MapPin size={18} style={{ color: '#F97316' }} />
                Explore by Region
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: isDesktop ? '0.75rem' : '0.5rem',
                justifyContent: 'center',
              }}>
                {/* All Regions Button */}
                <button
                  onClick={() => setSelectedRegion('all')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: isDesktop ? '0.75rem 1rem' : '0.5rem 0.75rem',
                    borderRadius: '1rem',
                    border: selectedRegion === 'all' ? 'none' : '2px solid #E5E7EB',
                    background: selectedRegion === 'all' 
                      ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' 
                      : '#ffffff',
                    color: selectedRegion === 'all' ? '#ffffff' : '#6B7280',
                    fontSize: isDesktop ? '0.875rem' : '0.75rem',
                    fontWeight: selectedRegion === 'all' ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedRegion === 'all'
                      ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRegion !== 'all') {
                      e.currentTarget.style.borderColor = '#F97316';
                      e.currentTarget.style.color = '#F97316';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRegion !== 'all') {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  <UtensilsCrossed size={16} />
                  All Cuisines
                </button>

                {/* Individual Region Buttons */}
                {REGIONAL_CUISINES.map((region) => {
                  const RegionIcon = region.icon;
                  const isActive = selectedRegion === region.id;
                  
                  return (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: isDesktop ? '0.75rem 1rem' : '0.5rem 0.75rem',
                        borderRadius: '1rem',
                        border: isActive ? 'none' : `2px solid ${region.color}40`,
                        background: isActive 
                          ? `linear-gradient(135deg, ${region.color} 0%, ${region.color}CC 100%)` 
                          : '#ffffff',
                        color: isActive ? '#ffffff' : region.color,
                        fontSize: isDesktop ? '0.875rem' : '0.75rem',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive
                          ? `0 4px 12px ${region.color}40`
                          : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = `${region.color}15`;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <RegionIcon size={16} />
                      {region.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary Filter Chips - Compact on Mobile, Spacious on Desktop */}
            <div style={{ paddingBottom: '1.25rem', paddingTop: '0.5rem' }}>
              <div 
                className="grid grid-cols-3"
                style={{ 
                  gap: isDesktop ? '1rem' : '0.5rem',
                  display: isDesktop ? 'flex' : 'grid',
                  flexWrap: isDesktop ? 'wrap' : 'nowrap',
                  justifyContent: isDesktop ? 'center' : 'stretch',
                  gridTemplateColumns: isDesktop ? 'none' : 'repeat(3, 1fr)'
                }}
              >
                {/* Vegetarian Filter */}
                <button
                  onClick={() => toggleDietaryFilter('vegetarian')}
                  className="flex items-center justify-center rounded-xl font-semibold transition-all duration-200"
                  style={{
                    background: dietaryFilters.has('vegetarian') 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    color: dietaryFilters.has('vegetarian') ? '#ffffff' : '#059669',
                    gap: isDesktop ? '0.75rem' : '0.5rem',
                    padding: isDesktop ? '0.875rem 1.25rem' : '0.625rem 0.75rem',
                    fontSize: isDesktop ? '0.9375rem' : '0.75rem',
                    width: isDesktop ? 'auto' : '100%',
                    boxShadow: dietaryFilters.has('vegetarian') 
                      ? '0 4px 16px rgba(16, 185, 129, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                    border: dietaryFilters.has('vegetarian') ? 'none' : '2px solid rgba(16, 185, 129, 0.2)',
                    fontWeight: dietaryFilters.has('vegetarian') ? 700 : 600,
                    letterSpacing: '0.01em',
                    transform: dietaryFilters.has('vegetarian') ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!dietaryFilters.has('vegetarian')) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dietaryFilters.has('vegetarian')) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                      e.currentTarget.style.color = '#059669';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    }
                  }}
                >
                  <Leaf size={isDesktop ? 18 : 16} style={{ color: dietaryFilters.has('vegetarian') ? '#ffffff' : '#10b981' }} />
                  <span>Vegetarian</span>
                </button>

                {/* Non-Vegetarian Filter */}
                <button
                  onClick={() => toggleDietaryFilter('non-vegetarian')}
                  className="flex items-center justify-center rounded-xl font-semibold transition-all duration-200"
                  style={{
                    background: dietaryFilters.has('non-vegetarian') 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                      : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    color: dietaryFilters.has('non-vegetarian') ? '#ffffff' : '#dc2626',
                    gap: isDesktop ? '0.75rem' : '0.5rem',
                    padding: isDesktop ? '0.875rem 1.25rem' : '0.625rem 0.75rem',
                    fontSize: isDesktop ? '0.9375rem' : '0.75rem',
                    width: isDesktop ? 'auto' : '100%',
                    boxShadow: dietaryFilters.has('non-vegetarian') 
                      ? '0 4px 16px rgba(239, 68, 68, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                    border: dietaryFilters.has('non-vegetarian') ? 'none' : '2px solid rgba(239, 68, 68, 0.2)',
                    fontWeight: dietaryFilters.has('non-vegetarian') ? 700 : 600,
                    letterSpacing: '0.01em',
                    transform: dietaryFilters.has('non-vegetarian') ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!dietaryFilters.has('non-vegetarian')) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dietaryFilters.has('non-vegetarian')) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    }
                  }}
                >
                  <ChefHat size={isDesktop ? 18 : 16} style={{ color: dietaryFilters.has('non-vegetarian') ? '#ffffff' : '#ef4444' }} />
                  <span>Non-Veg</span>
                </button>

                {/* Spicy Filter */}
                <button
                  onClick={() => toggleDietaryFilter('spicy')}
                  className="flex items-center justify-center rounded-xl font-semibold transition-all duration-200"
                  style={{
                    background: dietaryFilters.has('spicy') 
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' 
                      : 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
                    color: dietaryFilters.has('spicy') ? '#ffffff' : '#ea580c',
                    gap: isDesktop ? '0.75rem' : '0.5rem',
                    padding: isDesktop ? '0.875rem 1.25rem' : '0.625rem 0.75rem',
                    fontSize: isDesktop ? '0.9375rem' : '0.75rem',
                    width: isDesktop ? 'auto' : '100%',
                    boxShadow: dietaryFilters.has('spicy') 
                      ? '0 4px 16px rgba(249, 115, 22, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                    border: dietaryFilters.has('spicy') ? 'none' : '2px solid rgba(249, 115, 22, 0.2)',
                    fontWeight: dietaryFilters.has('spicy') ? 700 : 600,
                    letterSpacing: '0.01em',
                    transform: dietaryFilters.has('spicy') ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!dietaryFilters.has('spicy')) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dietaryFilters.has('spicy')) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)';
                      e.currentTarget.style.color = '#ea580c';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    }
                  }}
                >
                  <Flame size={isDesktop ? 18 : 16} style={{ color: dietaryFilters.has('spicy') ? '#ffffff' : '#f97316' }} fill={dietaryFilters.has('spicy') ? '#ffffff' : '#f97316'} />
                  <span>Spicy</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items Grid - Premium Layout with Inner Padding */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-10">
          {loading ? (
            /* Loading State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Loading menu...</h3>
              <p className="text-gray-600">Please wait while we fetch your delicious dishes.</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Unable to Load Menu</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                style={{ padding: '12px 24px' }}
              >
                Retry
              </button>
              <p className="text-sm text-gray-500 mt-4">
                If this persists, check your database connection or add menu items via the admin dashboard.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                <Search size={40} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No dishes found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `We couldn't find any dishes matching "${searchQuery}". Try different keywords or browse all dishes.`
                  : normalizedMenuItems.length === 0
                  ? 'No menu items found. Please add dishes via the admin dashboard.'
                  : 'No dishes available in this category. Try selecting a different category or clearing filters.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  style={{ padding: '12px 24px' }}
                >
                  <X size={18} />
                  Clear Search
                </button>
              )}
              {normalizedMenuItems.length === 0 && (
                <div className="mt-6">
                  <a
                    href="/admin/dashboard"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    style={{ padding: '12px 24px' }}
                  >
                    Go to Admin Dashboard
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: '1.25rem' }}>
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="card card-premium rounded-2xl overflow-hidden cursor-pointer group animate-scale-in relative gpu-accelerated"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  padding: 0
                }}
                onClick={() => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 107, 53, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Image Container - Full Cover with No Gaps */}
                <div className="relative bg-gray-100 overflow-hidden" style={{ 
                  aspectRatio: '4/3',
                  minHeight: isDesktop ? '200px' : '160px',
                  maxHeight: isDesktop ? '240px' : '200px',
                  borderTopLeftRadius: '1rem',
                  borderTopRightRadius: '1rem',
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  margin: 0,
                  padding: 0,
                  width: '100%'
                }}>
                  {imageLoading.has(item.id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!imageErrors.has(item.id) && item.image ? (
                    <img
                      key={item.id}
                      src={item.image}
                      alt={`${item.name} - Authentic Indian ${item.category.toLowerCase()} dish from Bantu's Kitchen in Hyderabad`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: item.imagePosition 
                          ? `${50 + item.imagePosition.x}% ${50 + item.imagePosition.y}%`
                          : 'center 30%',
                        transform: item.imagePosition 
                          ? `scale(${item.imagePosition.scale})` 
                          : 'scale(1)',
                        transition: 'transform 0.3s ease',
                        display: 'block',
                        margin: 0,
                        padding: 0
                      }}
                      className="group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      onLoad={() => {
                        setImageLoading(prev => {
                          const next = new Set(prev);
                          next.delete(item.id);
                          return next;
                        });
                      }}
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(item.id));
                        setImageLoading(prev => {
                          const next = new Set(prev);
                          next.delete(item.id);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <UtensilsCrossed size={48} className="text-gray-400" strokeWidth={1.5} />
                        <span className="text-gray-500 text-xs font-semibold">No Image</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Price Badge - Top Left of Image - Compact on mobile */}
                  <div className="absolute" style={{ top: '6px', left: '6px', zIndex: 5 }}>
                    <div style={{
                      padding: isDesktop ? '5px 10px' : '3px 6px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: isDesktop ? '8px' : '6px',
                      border: '1px solid rgba(251, 146, 60, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '1px'
                    }}>
                      <span style={{
                        fontSize: isDesktop ? '11px' : '9px',
                        fontWeight: 600,
                        color: '#ea580c',
                        lineHeight: 1
                      }}>₹</span>
                      <span style={{
                        fontSize: isDesktop ? '15px' : '12px',
                        fontWeight: 700,
                        color: '#ea580c',
                        lineHeight: 1
                      }}>{item.price}</span>
                    </div>
                  </div>
                  
                  {/* 🔥 Responsive Badge Layout - Wraps on mobile, row on desktop */}
                  <div 
                    className="absolute"
                    style={{ 
                      top: '6px', 
                      right: '6px', 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      zIndex: 5,
                      maxWidth: isDesktop ? 'none' : 'calc(100% - 70px)' // Leave room for price badge
                    }}
                  >
                    {/* Stock Status Badge - Top (most important) */}
                    <span style={{
                      padding: isDesktop ? '3px 8px' : '2px 6px',
                      borderRadius: '10px',
                      fontSize: isDesktop ? '10px' : '9px',
                      fontWeight: 600,
                      backgroundColor: isInStock(item) ? '#dcfce7' : '#fee2e2',
                      color: isInStock(item) ? '#166534' : '#991b1b',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      whiteSpace: 'nowrap'
                    }}>
                      {isInStock(item) ? 'In Stock' : 'Out'}
                    </span>
                    
                    {/* Dietary + Spicy Icons Row - Below stock */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '3px',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}>
                      {/* Dietary Icons - Vegan (filled) takes priority over Vegetarian (outline) */}
                      {item.isVegan === true ? (
                        <div style={{
                          width: isDesktop ? '22px' : '20px',
                          height: isDesktop ? '22px' : '20px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                          flexShrink: 0
                        }} title="Vegan (Plant-based)">
                          <Leaf size={isDesktop ? 12 : 10} className="text-green-700" strokeWidth={2.5} fill="currentColor" />
                        </div>
                      ) : item.isVegetarian === true ? (
                        <div style={{
                          width: isDesktop ? '22px' : '20px',
                          height: isDesktop ? '22px' : '20px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                          flexShrink: 0
                        }} title="Vegetarian">
                          <Leaf size={isDesktop ? 12 : 10} className="text-green-600" strokeWidth={2.5} />
                        </div>
                      ) : null}
                      
                      {/* Gluten-Free Icon - Hidden on very small screens */}
                      {item.isGlutenFree === true && isDesktop && (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                          flexShrink: 0
                        }} title="Gluten-Free">
                          <WheatOff size={12} className="text-amber-600" strokeWidth={2.5} />
                        </div>
                      )}
                      
                      {/* Spicy Level - Single chili icon with number */}
                      {typeof item.spicyLevel === 'number' && item.spicyLevel > 0 && (
                        <div style={{
                          height: isDesktop ? '22px' : '20px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '5px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '1px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                          padding: '0 3px',
                          flexShrink: 0
                        }} title={`Spicy Level: ${item.spicyLevel}`}>
                          <Flame size={isDesktop ? 11 : 9} className="text-red-500" fill="currentColor" />
                          {item.spicyLevel > 1 && (
                            <span style={{ 
                              fontSize: isDesktop ? '9px' : '8px', 
                              fontWeight: 700, 
                              color: '#EF4444',
                              marginLeft: '1px'
                            }}>
                              ×{Math.min(item.spicyLevel, 3)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Out of Stock / Not Available Overlay */}
                  {!isInStock(item) && (
                    <div 
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                      style={{ zIndex: 10 }}
                    >
                      <div className="text-center px-4">
                        <div className="flex items-center justify-center mb-2">
                          {!item.isAvailable ? (
                            <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                              <XCircle size={32} className="text-white" strokeWidth={2.5} />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center">
                              <ShoppingBag size={32} className="text-white" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                        <div className="text-white font-bold text-sm">
                          {getStockMessage(item)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content - Compact and Balanced */}
                <div style={{ padding: '0.75rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Dish Name - Prominent and Always Visible */}
                  <div style={{ marginBottom: '0.375rem' }}>
                    <h3 
                      style={{
                        fontSize: isDesktop ? '1.0625rem' : '1rem',
                        fontWeight: 700,
                        color: '#1d1d1f',
                        letterSpacing: '-0.02em',
                        lineHeight: '1.3',
                        margin: 0,
                        marginBottom: '0.25rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
                        transition: 'color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      className="group-hover:text-orange-600"
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>{item.name}</span>
                      {/* Quantity Badge - Next to Name (Mobile) */}
                      {getCartQuantity(item.id) > 1 && (
                        <div className="md:hidden flex-shrink-0">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white leading-none">
                              {getCartQuantity(item.id)}
                            </span>
                          </div>
                        </div>
                      )}
                    </h3>
                    {/* Description - Compact, Hidden on mobile, visible on tablet+ */}
                    <p 
                      className="hidden md:block" 
                      style={{ 
                        fontSize: '0.8125rem',
                        lineHeight: '1.5',
                        margin: 0,
                        marginTop: '0.25rem',
                        color: '#6b7280',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                        fontWeight: 400,
                        letterSpacing: '-0.011em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  {/* Price and Add Buttons - Compact Spacing */}
                  <div className="border-t border-gray-100" style={{ paddingTop: '0.625rem', marginTop: 'auto' }}>
                    {/* Low Stock Warning Banner - Proper Spacing */}
                    {isInStock(item) && item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined && item.inventory <= 3 && item.inventory > 0 && (
                      <div style={{
                        background: 'linear-gradient(to right, #FEF3C7, #FDE68A)',
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#92400E' }}>
                          ⚡ Only {item.inventory} left!
                        </span>
                      </div>
                    )}
                    
                    {/* Mobile: Separate Quantity Controls and Add Button */}
                    <div className="md:hidden flex flex-col items-center" style={{ gap: '0.5rem', width: '100%' }}>
                      {/* Quantity Controls - Top Row (Mobile Only) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          maxWidth: '200px'
                        }}
                      >
                        {/* Minus Button */}
                        <button
                          onClick={(e) => decrementQuantity(item, e)}
                          disabled={getCartQuantity(item.id) <= 0}
                          style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: getCartQuantity(item.id) <= 0
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'linear-gradient(to right, #F97316, #EA580C)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: getCartQuantity(item.id) <= 0 ? 'not-allowed' : 'pointer',
                            color: 'white',
                            opacity: getCartQuantity(item.id) <= 0 ? 0.5 : 1,
                            transition: 'all 0.15s',
                            boxShadow: getCartQuantity(item.id) <= 0 ? 'none' : '0 2px 4px rgba(249, 115, 22, 0.3)'
                          }}
                          className="hover:shadow-md active:scale-95"
                          type="button"
                        >
                          <Minus size={18} strokeWidth={2.5} />
                        </button>

                        {/* Quantity Display */}
                        <div style={{
                          minWidth: '40px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fff7ed',
                          borderRadius: '0.5rem',
                          border: '2px solid rgba(249, 115, 22, 0.2)'
                        }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#ea580c',
                            userSelect: 'none'
                          }}>
                            {getCartQuantity(item.id)}
                          </span>
                        </div>

                        {/* Plus Button */}
                        <button
                          onClick={(e) => incrementQuantity(item, e)}
                          disabled={getCartQuantity(item.id) >= 10}
                          style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: getCartQuantity(item.id) >= 10
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'linear-gradient(to right, #F97316, #EA580C)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: getCartQuantity(item.id) >= 10 ? 'not-allowed' : 'pointer',
                            color: 'white',
                            opacity: getCartQuantity(item.id) >= 10 ? 0.5 : 1,
                            transition: 'all 0.15s',
                            boxShadow: getCartQuantity(item.id) >= 10 ? 'none' : '0 2px 4px rgba(249, 115, 22, 0.3)'
                          }}
                          className="hover:shadow-md active:scale-95"
                          type="button"
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Add Button - Bottom Row (Mobile Only) */}
                      {!isInStock(item) ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            padding: '0.5rem 0.75rem',
                            border: '1.5px solid #EF4444',
                            cursor: 'not-allowed',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            width: '100%',
                            maxWidth: '200px',
                            minHeight: '36px',
                            opacity: 0.8
                          }}
                        >
                          {!item.isAvailable ? (
                            <>
                              <XCircle size={14} strokeWidth={2.5} />
                              <span>Unavailable</span>
                            </>
                          ) : (
                            <>
                              <PackageX size={14} strokeWidth={2.5} />
                              <span>Sold Out</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(item, e)}
                          style={{
                            position: 'relative',
                            overflow: 'visible',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: recentlyAdded[item.id]
                              ? '0 0 0 2px rgba(34, 197, 94, 0.2)' 
                              : '0 1px 3px rgba(249, 115, 22, 0.2)',
                            transform: recentlyAdded[item.id] ? 'scale(0.98)' : 'scale(1)',
                            whiteSpace: 'nowrap',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            cursor: 'pointer',
                            background: recentlyAdded[item.id]
                              ? 'linear-gradient(to right, #22C55E, #16A34A)'
                              : 'linear-gradient(to right, #F97316, #EA580C)',
                            color: 'white',
                            width: '100%',
                            maxWidth: '200px',
                            minHeight: '36px'
                          }}
                          className="hover:shadow-lg hover:scale-105 active:scale-95"
                          type="button"
                        >
                          {getCartQuantity(item.id) > 0 ? `${getCartQuantity(item.id)} Add` : 'Add to Cart'}
                          {/* Ripple effect */}
                          {recentlyAdded[item.id] && (
                            <span
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.3)',
                                animation: 'ripple 0.6s ease-out'
                              }}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Desktop: Combined Button (Original Design) */}
                    <div className="hidden md:flex flex-col items-center" style={{ gap: '0.5rem' }}>
                      {/* Beautiful Centered Add Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        {!isInStock(item) ? (
                          // Out of Stock Button (disabled) - Proper Size
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              borderRadius: '0.5rem',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              padding: '0.5rem 0.75rem',
                              border: '1.5px solid #EF4444',
                              cursor: 'not-allowed',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              width: '100%',
                              maxWidth: '200px',
                              minHeight: '36px',
                              opacity: 0.8
                            }}
                          >
                            {!item.isAvailable ? (
                              <>
                                <XCircle size={14} strokeWidth={2.5} />
                                <span>Unavailable</span>
                              </>
                            ) : (
                              <>
                                <PackageX size={14} strokeWidth={2.5} />
                                <span>Sold Out</span>
                              </>
                            )}
                          </div>
                        ) : (
                          // Beautiful Centered Add to Cart Button - Proper Size
                          <button
                          onClick={(e) => handleAddToCart(item, e)}
                          style={{
                            position: 'relative',
                            overflow: 'visible',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: (recentlyAdded[item.id] || isItemInCart(item.id))
                              ? '0 0 0 2px rgba(34, 197, 94, 0.2)' 
                              : '0 1px 3px rgba(249, 115, 22, 0.2)',
                            transform: (recentlyAdded[item.id] || isItemInCart(item.id)) ? 'scale(0.98)' : 'scale(1)',
                            whiteSpace: 'nowrap',
                            padding: '0',
                            border: 'none',
                            cursor: 'pointer',
                            background: (recentlyAdded[item.id] || isItemInCart(item.id))
                              ? 'linear-gradient(to right, #22C55E, #16A34A)'
                              : 'linear-gradient(to right, #F97316, #EA580C)',
                            color: 'white',
                            width: '100%',
                            maxWidth: '200px',
                            minWidth: '90px',
                            minHeight: '36px',
                            height: '36px'
                          }}
                          className="hover:shadow-lg hover:scale-105 active:scale-95"
                          type="button"
                        >
                          {/* Beautiful Centered Quantity Controls - Proper Gap */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0 0.75rem',
                              height: '100%',
                              width: '100%',
                              pointerEvents: 'none'
                            }}
                          >
                            {/* Minus Button */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (getCartQuantity(item.id) > 0) {
                                  decrementQuantity(item, e);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (getCartQuantity(item.id) > 0) {
                                    decrementQuantity(item, e as any);
                                  }
                                }
                              }}
                              style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                cursor: getCartQuantity(item.id) <= 0 ? 'not-allowed' : 'pointer',
                                color: 'white',
                                opacity: getCartQuantity(item.id) <= 0 ? 0.4 : 1,
                                transition: 'all 0.15s',
                                padding: 0,
                                flexShrink: 0,
                                pointerEvents: 'auto'
                              }}
                              className="hover:bg-white/30 active:scale-90"
                              tabIndex={0}
                            >
                              <Minus size={10} strokeWidth={2.5} />
                            </div>

                            {/* Quantity Display - Compact */}
                            <span style={{
                              minWidth: '16px',
                              textAlign: 'center',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: 'white',
                              userSelect: 'none',
                              flexShrink: 0,
                              padding: '0 0.25rem'
                            }}>
                              {getCartQuantity(item.id)}
                            </span>

                            {/* Plus Button */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (getCartQuantity(item.id) < 10) {
                                  incrementQuantity(item, e);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (getCartQuantity(item.id) < 10) {
                                    incrementQuantity(item, e as any);
                                  }
                                }
                              }}
                              style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                cursor: getCartQuantity(item.id) >= 10 ? 'not-allowed' : 'pointer',
                                color: 'white',
                                opacity: getCartQuantity(item.id) >= 10 ? 0.4 : 1,
                                transition: 'all 0.15s',
                                padding: 0,
                                flexShrink: 0,
                                pointerEvents: 'auto'
                              }}
                              className="hover:bg-white/30 active:scale-90"
                              tabIndex={0}
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </div>

                            {/* Add Text - Shows quantity when > 0 */}
                          <span style={{
                              marginLeft: '0.5rem',
                              paddingLeft: '0.5rem',
                              borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              paddingRight: '0.5rem',
                              minWidth: '2.5rem'
                            }}>
                                {getCartQuantity(item.id) > 0 ? `${getCartQuantity(item.id)} Add` : 'Add'}
                              </span>
                          </div>
                          
                          {/* Ripple effect - only show on recent add, not persistent cart state */}
                          {recentlyAdded[item.id] && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '0',
                                height: '0',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.3)',
                                transform: 'translate(-50%, -50%)',
                                animation: 'ripple 0.6s ease-out',
                                pointerEvents: 'none'
                              }}
                            />
                          )}
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-orange-300 transition-all duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
          )}
      </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          item={selectedItem}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      </div>
    </section>
    </>
  );
};

export default MenuSection;

