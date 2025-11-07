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

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Flame, Leaf, Clock, Search, X, UtensilsCrossed, XCircle, ShoppingBag, PackageX, ChefHat, Soup, Fish, Beef } from 'lucide-react';
import { MenuItem, MenuCategory } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductDetailModal from './ProductDetailModal';

interface MenuSectionProps {
  onItemClick?: (item: MenuItem) => void;
}

const MenuSection: React.FC<MenuSectionProps> = ({ onItemClick }) => {
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilters, setDietaryFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, number>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Track window width for responsive design
  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);
  
  // Fetch menu items from database
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menu'); // Remove ?available=true to get ALL items
        const data = await response.json();
        
        if (data.success) {
          // Transform database items to MenuItem format
          const transformedItems: MenuItem[] = (data.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            originalPrice: item.originalPrice,
            category: item.category,
            image: item.image,
            isVegetarian: item.isVegetarian,
            isVegan: item.isVegan,
            isGlutenFree: item.isGlutenFree,
            spicyLevel: item.spicyLevel,
            preparationTime: item.preparationTime,
            isAvailable: item.isAvailable,
            isPopular: item.isPopular,
            calories: item.calories,
            servingSize: item.servingSize,
            // NEW: Inventory fields
            inventoryEnabled: item.inventoryEnabled || false,
            inventory: item.inventory ?? null,
            outOfStockMessage: item.outOfStockMessage || null,
          }));
          
          setMenuItems(transformedItems);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
    // Auto-refresh every 30 seconds to get latest inventory
    const interval = setInterval(fetchMenuItems, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get unique categories from fetched items
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  // Get category counts
  const getCategoryCount = (category: string): number => {
    if (category === 'All') return menuItems.filter(item => item.isAvailable).length;
    return menuItems.filter(item => item.category === category && item.isAvailable).length;
  };
  
  // Get food-inspired colors for each category
  const getCategoryColor = (category: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; hover: string; text: string; icon?: string }> = {
      'All': { 
        bg: isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
        hover: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
        text: isActive ? '#ffffff' : '#ea580c'
      },
      'Biryanis': { 
        bg: isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
        hover: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
        text: isActive ? '#ffffff' : '#ea580c'
      },
      'Biryani & Rice': { 
        bg: isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
        hover: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
        text: isActive ? '#ffffff' : '#ea580c'
      },
      'Appetizers': { 
        bg: isActive ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        hover: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        text: isActive ? '#ffffff' : '#d97706'
      },
      'Curries': { 
        bg: isActive ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        hover: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        text: isActive ? '#ffffff' : '#dc2626'
      },
      'Main Course': { 
        bg: isActive ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
        hover: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        text: isActive ? '#ffffff' : '#7c3aed'
      },
      'Tandoori': { 
        bg: isActive ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        hover: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        text: isActive ? '#ffffff' : '#c2410c'
      },
      'Rice & Breads': { 
        bg: isActive ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
        hover: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)',
        text: isActive ? '#ffffff' : '#d97706'
      },
      'Breads': { 
        bg: isActive ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
        hover: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)',
        text: isActive ? '#ffffff' : '#d97706'
      },
      'Desserts': { 
        bg: isActive ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        hover: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
        text: isActive ? '#ffffff' : '#db2777'
      },
      'Beverages': { 
        bg: isActive ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
        hover: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
        text: isActive ? '#ffffff' : '#0891b2'
      },
      'Specials': { 
        bg: isActive ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
        hover: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        text: isActive ? '#ffffff' : '#7c3aed'
      },
      'Thali': { 
        bg: isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        hover: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        text: isActive ? '#ffffff' : '#059669'
      }
    };
    
    return colors[category] || { 
      bg: isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)',
      hover: 'linear-gradient(135deg, #ff8c42 0%, #f97316 100%)',
      text: isActive ? '#ffffff' : '#ea580c'
    };
  };
  
  // Filter menu items for main display - SHOW ALL ITEMS (don't hide unavailable)
  const filteredItems = menuItems.filter(item => {
    // Only filter by isAvailable if item is completely removed from menu
    // Otherwise show it with out-of-stock badge
    
    // If user is searching, IGNORE category filter and search everywhere
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(query) ||
             item.description.toLowerCase().includes(query) ||
             item.category.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    } else {
      // If no search, filter by category
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
    }
    
    // Apply dietary filters
    if (dietaryFilters.size > 0) {
      if (dietaryFilters.has('vegetarian') && !item.isVegetarian) return false;
      if (dietaryFilters.has('non-vegetarian') && item.isVegetarian) return false;
      if (dietaryFilters.has('vegan') && !item.isVegan) return false;
      if (dietaryFilters.has('spicy') && (!item.spicyLevel || item.spicyLevel === 0)) return false;
    }
    
    return true;
  });

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
  const autocompleteResults = searchQuery.length > 0 
    ? menuItems
        .filter(item => {
          const query = searchQuery.toLowerCase();
          return (
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
          );
        })
        .slice(0, 8)
    : [];
  
  // Count total available items - LIVE FROM DATABASE
  const totalAvailableItems = menuItems.filter(item => isInStock(item)).length;
  const searchResultCount = filteredItems.length;
  
  // Handle quantity change - integrated in button
  const handleQuantityChange = (itemId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemQuantities(prev => {
      const currentQty = prev[itemId] || 1;
      const newQty = Math.max(1, Math.min(10, currentQty + delta)); // Limit 1-10
      return { ...prev, [itemId]: newQty };
    });
  };

  // Handle add to cart - uses quantity from state
  const handleAddToCart = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if item is in stock
    if (!isInStock(item)) {
      return; // Don't add if out of stock
    }
    
    const quantity = itemQuantities[item.id] || 1;
    
    // Check if enough inventory
    if (item.inventoryEnabled && item.inventory !== null && item.inventory !== undefined) {
      if (quantity > item.inventory) {
        alert(`Sorry, only ${item.inventory} available!`);
        return;
      }
    }
    
    addItem(item, quantity);
    
    // Natural feedback - show quantity added briefly
    setRecentlyAdded(prev => ({ ...prev, [item.id]: quantity }));
    
    // Reset quantity after adding
    setItemQuantities(prev => {
      const newState = { ...prev };
      delete newState[item.id];
      return newState;
    });
    
    setTimeout(() => {
      setRecentlyAdded(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
    }, 800);
  };
  
  return (
    <section id="menu" className="section bg-white py-16 md:py-20 lg:py-24">
      <div className="container-custom">
        {/* Section Header - Perfectly Centered */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }} className="animate-slide-up">
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.75rem)',
            fontWeight: 800,
            marginBottom: '24px',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            textAlign: 'center'
          }}>
            Our <span className="text-gradient-orange">Menu</span>
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            maxWidth: '768px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.7',
            paddingLeft: '16px',
            paddingRight: '16px'
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
                          alt={item.name}
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
                          {item.isVegetarian && (
                            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                              <Leaf size={10} className="text-green-600" />
                            </div>
                          )}
                          {item.spicyLevel && item.spicyLevel > 0 && (
                            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                              <Flame size={10} className="text-red-600" />
                            </div>
                          )}
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
          {filteredItems.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                <Search size={40} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No dishes found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `We couldn't find any dishes matching "${searchQuery}". Try different keywords or browse all dishes.`
                  : 'No dishes available in this category.'
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
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="card rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group animate-scale-in relative"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
              >
                {/* Image Container - Proper Height with Background */}
                <div className="relative bg-gray-100 overflow-hidden" style={{ height: isDesktop ? '280px' : '220px' }}>
                  {imageLoading.has(item.id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!imageErrors.has(item.id) && item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
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
                        transition: 'transform 0.3s ease'
                      }}
                      className="group-hover:scale-110"
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
                  
                  {/* Price Badge - Top Left of Image - All Screen Sizes */}
                  <div className="absolute" style={{ top: '0.75rem', left: '0.75rem', zIndex: 5 }}>
                    <div style={{
                      padding: isDesktop ? '0.375rem 0.625rem' : '0.25rem 0.5rem',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(251, 146, 60, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.125rem'
                    }}>
                      <span style={{
                        fontSize: isDesktop ? '0.6875rem' : '0.625rem',
                        fontWeight: 600,
                        color: '#ea580c',
                        lineHeight: 1,
                        marginRight: '0.125rem'
                      }}>₹</span>
                      <span style={{
                        fontSize: isDesktop ? '1rem' : '0.875rem',
                        fontWeight: 700,
                        color: '#ea580c',
                        lineHeight: 1
                      }}>{item.price}</span>
                    </div>
                  </div>
                  
                  {/* Clean Icon Badges - Top Right - All Screen Sizes */}
                  <div className="absolute flex items-center" style={{ top: '0.75rem', right: '0.75rem', gap: '0.5rem', zIndex: 5 }}>
                    {item.isVegetarian === true && (
                      <div style={{
                        width: isDesktop ? '36px' : '28px',
                        height: isDesktop ? '36px' : '28px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        padding: '0.25rem'
                      }} title="Vegetarian">
                        <Leaf size={isDesktop ? 20 : 16} className="text-green-600" strokeWidth={2.5} />
                      </div>
                    )}
                    {typeof item.spicyLevel === 'number' && item.spicyLevel > 0 && (
                      <div style={{
                        width: isDesktop ? '36px' : '28px',
                        height: isDesktop ? '36px' : '28px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        padding: '0.25rem'
                      }} title="Spicy">
                        <Flame size={isDesktop ? 20 : 16} className="text-red-600" strokeWidth={2.5} fill="currentColor" />
                      </div>
                    )}
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

                {/* Content - Proper Vertical Spacing */}
                <div style={{ padding: '0.875rem', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
                  {/* Dish Name - Prominent and Always Visible */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 
                      style={{
                        fontSize: isDesktop ? '1.125rem' : '1rem',
                        fontWeight: 600,
                        color: '#1d1d1f',
                        letterSpacing: '-0.015em',
                        lineHeight: '1.3',
                        margin: 0,
                        marginBottom: '0.25rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
                        transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                      {itemQuantities[item.id] && itemQuantities[item.id] > 1 && (
                        <div className="md:hidden flex-shrink-0">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white leading-none">
                              {itemQuantities[item.id]}
                            </span>
                          </div>
                        </div>
                      )}
                    </h3>
                    {/* Description - Hidden on mobile, visible on tablet+ */}
                    <p 
                      className="hidden md:block text-gray-500" 
                      style={{ 
                        fontSize: '0.8125rem',
                        lineHeight: '1.4',
                        margin: 0,
                        marginTop: '0.25rem',
                        color: '#6b7280'
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  {/* Price and Add Buttons - Proper Spacing */}
                  <div className="border-t border-gray-100" style={{ paddingTop: '0.75rem', marginTop: '0.75rem' }}>
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
                          onClick={(e) => handleQuantityChange(item.id, -1, e)}
                          disabled={(itemQuantities[item.id] || 1) <= 1}
                          style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (itemQuantities[item.id] || 1) <= 1
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'linear-gradient(to right, #F97316, #EA580C)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: (itemQuantities[item.id] || 1) <= 1 ? 'not-allowed' : 'pointer',
                            color: 'white',
                            opacity: (itemQuantities[item.id] || 1) <= 1 ? 0.5 : 1,
                            transition: 'all 0.15s',
                            boxShadow: (itemQuantities[item.id] || 1) <= 1 ? 'none' : '0 2px 4px rgba(249, 115, 22, 0.3)'
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
                            {itemQuantities[item.id] || 1}
                          </span>
                        </div>

                        {/* Plus Button */}
                        <button
                          onClick={(e) => handleQuantityChange(item.id, 1, e)}
                          disabled={(itemQuantities[item.id] || 1) >= 10}
                          style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (itemQuantities[item.id] || 1) >= 10
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'linear-gradient(to right, #F97316, #EA580C)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: (itemQuantities[item.id] || 1) >= 10 ? 'not-allowed' : 'pointer',
                            color: 'white',
                            opacity: (itemQuantities[item.id] || 1) >= 10 ? 0.5 : 1,
                            transition: 'all 0.15s',
                            boxShadow: (itemQuantities[item.id] || 1) >= 10 ? 'none' : '0 2px 4px rgba(249, 115, 22, 0.3)'
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
                          Add to Cart
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
                          <div
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
                            boxShadow: recentlyAdded[item.id]
                              ? '0 0 0 2px rgba(34, 197, 94, 0.2)' 
                              : '0 1px 3px rgba(249, 115, 22, 0.2)',
                            transform: recentlyAdded[item.id] ? 'scale(0.98)' : 'scale(1)',
                            whiteSpace: 'nowrap',
                            padding: '0',
                            border: 'none',
                            cursor: 'pointer',
                            background: recentlyAdded[item.id]
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
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleAddToCart(item, e as any);
                            }
                          }}
                        >
                          {/* Beautiful Centered Quantity Controls - Proper Gap */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0 0.75rem',
                              height: '100%',
                              width: '100%'
                            }}
                          >
                            {/* Minus Button */}
                            <button
                              onClick={(e) => handleQuantityChange(item.id, -1, e)}
                              disabled={(itemQuantities[item.id] || 1) <= 1}
                              style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: (itemQuantities[item.id] || 1) <= 1 ? 'not-allowed' : 'pointer',
                                color: 'white',
                                opacity: (itemQuantities[item.id] || 1) <= 1 ? 0.4 : 1,
                                transition: 'all 0.15s',
                                padding: 0,
                                flexShrink: 0
                              }}
                              className="hover:bg-white/30 active:scale-90"
                              type="button"
                            >
                              <Minus size={10} strokeWidth={2.5} />
                            </button>

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
                              {itemQuantities[item.id] || 1}
                            </span>

                            {/* Plus Button */}
                            <button
                              onClick={(e) => handleQuantityChange(item.id, 1, e)}
                              disabled={(itemQuantities[item.id] || 1) >= 10}
                              style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: (itemQuantities[item.id] || 1) >= 10 ? 'not-allowed' : 'pointer',
                                color: 'white',
                                opacity: (itemQuantities[item.id] || 1) >= 10 ? 0.4 : 1,
                                transition: 'all 0.15s',
                                padding: 0,
                                flexShrink: 0
                              }}
                              className="hover:bg-white/30 active:scale-90"
                              type="button"
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </button>

                            {/* Add Text - Properly Spaced with Min Width */}
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
                                Add
                              </span>
                          </div>
                          
                          {/* Ripple effect */}
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
                        </div>
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
  );
};

export default MenuSection;

