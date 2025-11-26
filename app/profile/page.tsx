/**
 * CUSTOMER PROFILE PAGE - Premium Tabbed Dashboard
 * 
 * Purpose: Modern tabbed navigation for organized profile management
 * 
 * Features:
 * - Smart Tab Navigation (Overview, Orders, Taste Profile, Account, Referrals)
 * - Culinary Passport hero section
 * - Journey Timeline (order history as stories)
 * - Referral Command Center
 * - Achievement Gallery (gamification)
 * - Taste Profile Wheel (flavor preferences)
 * - Smart Insights (data analytics)
 * - Profile Settings (organized sections)
 * - Mobile-first responsive design
 * - Loading states with skeleton loaders
 * - Error handling
 * 
 * Architecture: Next.js 14 App Router with client components
 * Inspired by: Instagram Settings + Twitter Profile + Spotify
 * Design Philosophy: Each section in its own dedicated space
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import FooterSimple from '@/components/FooterSimple';
import CheckoutModal from '@/components/CheckoutModal';
import CartSidebar from '@/components/CartSidebar';
import CulinaryPassport from '@/components/CulinaryPassport';
import JourneyTimeline from '@/components/JourneyTimeline';
import ReferralCenter from '@/components/ReferralCenter';
import ProfileSettings from '@/components/ProfileSettings';
import TasteProfileWheel from '@/components/TasteProfileWheel';
import SmartInsights from '@/components/SmartInsights';
import CancelOrderModal from '@/components/admin/CancelOrderModal';
import { playAlertSound } from '@/utils/notification-sound';
import { 
  Loader2, 
  Home, 
  ShoppingBag, 
  Utensils, 
  Settings, 
  Gift,
  User,
} from 'lucide-react';
import { MenuItem, MenuCategory } from '@/types';

// Inner component that uses CartContext (must be inside CartProvider)
function ProfilePageContent() {
  const { user, isLoading: authLoading, refreshUser, isAuthenticated } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { addItem, cart } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const pendingReorderItemsRef = useRef<number>(0);
  const redirectedRef = useRef(false);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [tasteProfile, setTasteProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  // Loading states
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Referral data
  const [referralStats, setReferralStats] = useState({
    friendsReferred: 0,
    rewardsEarned: 0,
  });

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'taste' | 'settings' | 'referrals'>('overview');

  // Authentication check with proper timing and safeguards
  useEffect(() => {
    // Clear any pending timeout
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
      authCheckTimeoutRef.current = null;
    }

    // If user is authenticated, clear redirect flag and cancel any pending checks
    if (isAuthenticated && user) {
      redirectedRef.current = false;
      return;
    }

    // If still loading, wait for it to complete
    if (authLoading) {
      return;
    }

    // Add a small delay to ensure fetch has completed
    // This prevents race conditions where isLoading becomes false
    // but the user fetch is still in progress
    authCheckTimeoutRef.current = setTimeout(() => {
      // Re-check all conditions after delay (using current state, not closure)
      // If user became authenticated during the delay, don't redirect
      if (isAuthenticated || user) {
        redirectedRef.current = false;
        return;
      }

      // Only redirect if we're truly not authenticated after the grace period
      // Check both isAuthenticated and user to be safe
      if (!isAuthenticated && !user && !redirectedRef.current) {
        redirectedRef.current = true;
        toast.info('Please Login', 'You need to be logged in to view your profile.');
        router.push('/');
      }
    }, 500); // 500ms grace period for fetch to complete

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
        authCheckTimeoutRef.current = null;
      }
    };
  }, [user, authLoading, isAuthenticated, router, toast]);

  // Watch cart changes and open sidebar if we're waiting for reorder items
  useEffect(() => {
    console.log('[Reorder Effect] Checking cart state:', {
      pendingReorderItems: pendingReorderItemsRef.current,
      cartItemsLength: cart.items.length,
      showCart,
      cartItems: cart.items.map(item => ({ name: item.menuItem?.name || 'Unknown Item', quantity: item.quantity }))
    });
    
    if (pendingReorderItemsRef.current > 0 && cart.items.length > 0 && !showCart) {
      console.log('[Reorder Effect] Opening cart sidebar with items:', cart.items.length);
      setShowCart(true);
      pendingReorderItemsRef.current = 0;
    }
  }, [cart.items.length, showCart, cart.items]);

  // Fetch all data
  useEffect(() => {
    if (!user) return;

    // Auto-link orphan orders first (orders placed before customerId feature)
    const linkOrphanOrders = async () => {
      try {
        await fetch('/api/customer/link-orders', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error linking orders:', error);
        // Non-critical error, continue loading
      }
    };

    // Fetch orders
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        
        // First, try to link any orphan orders
        await linkOrphanOrders();
        
        // Then fetch all orders (including newly linked ones)
        const response = await fetch('/api/orders/my-orders', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    // Fetch taste profile
    const fetchTasteProfile = async () => {
      try {
        setIsLoadingProfile(true);
        console.log('🔍 Fetching taste profile from API...');
        console.log('🔐 Auth Token Present:', document.cookie.includes('authToken'));
        console.log('👤 Current User:', user?.name, user?.email);
        
        const response = await fetch('/api/customer/taste-profile', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        
        console.log('📡 API Response Status:', response.status, response.statusText);
        
        // Log response headers
        console.log('📋 Response Headers:', {
          contentType: response.headers.get('content-type'),
          cacheControl: response.headers.get('cache-control'),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Taste Profile Data Received:', {
            dishes: data.data?.explorationStats?.totalDishes,
            exploration: data.data?.explorationStats?.explorationPercentage,
            categories: data.data?.explorationStats?.categoriesExplored?.length,
            archetype: data.data?.flavorArchetype?.name,
            tasteValues: data.data?.tasteProfile,
          });
          console.log('🎨 Full Taste Profile Object:', JSON.stringify(data.data, null, 2));
          setTasteProfile(data.data);
        } else {
          const errorData = await response.text();
          console.error('❌ API returned non-OK status:', response.status, errorData);
          // Still show cards with default data instead of hiding them
          setTasteProfile({
            tasteProfile: {
              spicy: 50, creamy: 50, tangy: 50, sweet: 50,
              smoky: 50, herbal: 50, rich: 50, light: 50,
            },
            flavorArchetype: {
              name: 'New Explorer',
              description: 'Your culinary journey is just beginning! Order to discover your taste profile.',
              emoji: '🗺️',
            },
            explorationStats: {
              totalDishes: 0,
              totalMenuItems: 45,
              explorationPercentage: 0,
              categoriesExplored: [],
              totalCategories: 7,
              explorerRank: 'Novice',
            },
            favoriteDishes: [],
            orderPatterns: {
              favoriteDay: 'Not enough data',
              favoriteTime: 'Not enough data',
              averageOrderValue: 0,
              orderFrequency: 'New customer',
              lastOrderDate: null,
              daysSinceLastOrder: 0,
            },
          });
        }
      } catch (error) {
        console.error('❌ Error fetching taste profile:', error);
        // Still show cards with default data instead of hiding them
        setTasteProfile({
          tasteProfile: {
            spicy: 50, creamy: 50, tangy: 50, sweet: 50,
            smoky: 50, herbal: 50, rich: 50, light: 50,
          },
          flavorArchetype: {
            name: 'New Explorer',
            description: 'Your culinary journey is just beginning! Order to discover your taste profile.',
            emoji: '🗺️',
          },
          explorationStats: {
            totalDishes: 0,
            totalMenuItems: 45,
            explorationPercentage: 0,
            categoriesExplored: [],
            totalCategories: 7,
            explorerRank: 'Novice',
          },
          favoriteDishes: [],
          orderPatterns: {
            favoriteDay: 'Not enough data',
            favoriteTime: 'Not enough data',
            averageOrderValue: 0,
            orderFrequency: 'New customer',
            lastOrderDate: null,
            daysSinceLastOrder: 0,
          },
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // Fetch achievements
    const fetchAchievements = async () => {
      try {
        setIsLoadingAchievements(true);
        const response = await fetch('/api/customer/achievements', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setAchievements(data.data);
        }
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setIsLoadingAchievements(false);
      }
    };

    // Fetch insights
    const fetchInsights = async () => {
      try {
        setIsLoadingInsights(true);
        const response = await fetch('/api/customer/insights', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setInsights(data.data);
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    // Fetch referral stats
    const fetchReferralStats = async () => {
      try {
        const response = await fetch('/api/customer/referral-stats', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setReferralStats(data.data || { friendsReferred: 0, rewardsEarned: 0 });
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };

    // Fetch all data in parallel
    Promise.all([
      fetchOrders(),
      fetchTasteProfile(),
      fetchAchievements(),
      fetchInsights(),
      fetchReferralStats(),
    ]);
  }, [user?.id]);

  // Handlers
  const handleUpdateProfile = async (data: { name: string; email: string; phone: string }) => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile Updated!', 'Your profile information has been updated successfully.');
        refreshUser();
      } else {
        toast.error('Update Failed', result.error || 'Failed to update profile.');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while updating your profile.');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success('Password Changed!', 'Your password has been updated successfully.');
    } else {
      // Throw error so ProfileSettings can catch it and display feedback
      throw new Error(data.error || 'Please check your current password.');
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Email Sent!', 'Verification email has been sent to your inbox.');
      } else {
        toast.error('Failed to Send Email', data.error || 'Please try again later.');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while sending verification email.');
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      // Find the order in the orders array (raw database order with nested menuItem)
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

      // CRITICAL: Fetch current menu items to ensure we have latest prices
      // Prices may have changed since the original order (e.g., ordering after 2 years)
      // We always use current/live prices from the menu API, never historical prices
      const menuResponse = await fetch('/api/menu');
      if (!menuResponse.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const menuResponseData = await menuResponse.json();
      
      // API returns { success: true, data: items, count: number }
      const menuItems = menuResponseData.data || menuResponseData.items || [];
      
      if (!Array.isArray(menuItems) || menuItems.length === 0) {
        console.error('[Reorder] No menu items found in API response:', menuResponseData);
        toast.error('Menu Unavailable', 'Could not fetch menu items. Please try again later.');
        return;
      }
      
      // Log menu items count and sample prices for debugging
      console.log(`[Reorder] Fetched ${menuItems.length} menu items from API`);
      const samplePrices = menuItems.slice(0, 5).map((item: any) => ({
        name: item.name,
        price: item.price
      }));
      console.log('[Reorder] Sample prices:', samplePrices);
      
      const menuItemsMap = new Map(menuItems.map((item: any) => [item.id, item]));

      // Add each item from the order to cart
      let addedCount = 0;
      let skippedCount = 0;
      const skippedItems: string[] = [];

      for (const orderItem of orderToReorder.items) {
        try {
          // Order items from database have nested menuItem structure
          // Handle both: orderItem.menuItem (from DB) or orderItem.name (from transformed)
          const menuItemId = orderItem.menuItemId || orderItem.menuItem?.id;
          const itemName = orderItem.menuItem?.name || orderItem.name;
          
          console.log('[Reorder] Processing item:', { menuItemId, itemName, orderItem });
          
          if (!menuItemId && !itemName) {
            console.warn('[Reorder] Order item missing both ID and name:', orderItem);
            skippedCount++;
            continue;
          }

          // Try to find menu item by ID first (most reliable)
          let menuItem = menuItemId ? menuItemsMap.get(menuItemId) : null;
          
          // Normalize name for matching (remove extra spaces, parentheses content, etc.)
          const normalizeName = (name: string) => {
            return name
              .toLowerCase()
              .replace(/\s*\([^)]*\)\s*/g, '') // Remove parentheses and content
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
          };
          
          // Fallback: Try to find by name if ID lookup failed
          if (!menuItem && itemName) {
            const normalizedOrderName = normalizeName(itemName);
            
            // Try exact match first
            menuItem = menuItems.find((item: any) => 
              item.name.toLowerCase() === itemName.toLowerCase()
            );
            
            // Try normalized match (handles "Gulab Jamun (2 pieces)" vs "Gulab Jamun (3 pieces)")
            if (!menuItem) {
              menuItem = menuItems.find((item: any) => 
                normalizeName(item.name) === normalizedOrderName
              );
            }
            
            // Try partial match (handles "Gulab Jamun" vs "Gulab Jamun (2 pieces)")
            // Extract base name (first 2-3 words, ignoring pieces/quantity info)
            if (!menuItem) {
              const orderNameWords = normalizedOrderName.split(' ').filter(w => 
                w.length > 2 && 
                !['pieces', 'piece', 'pcs', 'pc'].includes(w) &&
                !/^\d+$/.test(w) // Not just a number
              );
              const orderNameBase = orderNameWords.slice(0, 3).join(' '); // First 2-3 meaningful words
              
              menuItem = menuItems.find((item: any) => {
                const normalizedItemName = normalizeName(item.name);
                const itemNameWords = normalizedItemName.split(' ').filter(w => 
                  w.length > 2 && 
                  !['pieces', 'piece', 'pcs', 'pc'].includes(w) &&
                  !/^\d+$/.test(w)
                );
                const itemNameBase = itemNameWords.slice(0, 3).join(' ');
                
                // Check if base names match (either contains the other)
                return orderNameBase && itemNameBase && (
                  normalizedItemName.includes(orderNameBase) || 
                  normalizedOrderName.includes(itemNameBase) ||
                  orderNameBase === itemNameBase
                );
              });
            }
            
            // Last resort: Try fuzzy word matching
            if (!menuItem) {
              const orderNameWords = normalizedOrderName.split(' ').filter(w => 
                w.length > 3 && 
                !['pieces', 'piece', 'pcs', 'pc'].includes(w) &&
                !/^\d+$/.test(w)
              );
              
              menuItem = menuItems.find((item: any) => {
                const normalizedItemName = normalizeName(item.name);
                const itemNameWords = normalizedItemName.split(' ').filter(w => 
                  w.length > 3 && 
                  !['pieces', 'piece', 'pcs', 'pc'].includes(w) &&
                  !/^\d+$/.test(w)
                );
                
                // Check if at least 2 words match
                const matchingWords = orderNameWords.filter(word => 
                  itemNameWords.some(itemWord => 
                    itemWord.includes(word) || word.includes(itemWord)
                  )
                );
                
                return matchingWords.length >= Math.min(2, orderNameWords.length);
              });
            }
          }

          if (!menuItem) {
            const normalizedName = itemName ? normalizeName(itemName) : null;
            console.warn(`[Reorder] Menu item not found for: ${itemName || menuItemId}`, {
              availableItems: menuItems.slice(0, 10).map((i: any) => i.name), // Log first 10 for debugging
              totalMenuItems: menuItems.length,
              searchedName: itemName,
              normalizedName: normalizedName,
              menuItemId: menuItemId
            });
            skippedCount++;
            skippedItems.push(itemName || 'Unknown item');
            continue;
          }
          
          console.log(`[Reorder] Found menu item: ${menuItem.name} (matched from: ${itemName})`);

          // Check if item is available
          if (!menuItem.isAvailable) {
            console.warn(`[Reorder] Item not available: ${menuItem.name}`);
            skippedCount++;
            skippedItems.push(menuItem.name);
            continue;
          }

          // Validate price exists and is valid
          const currentPrice = menuItem.price;
          if (!currentPrice || currentPrice <= 0 || isNaN(currentPrice)) {
            console.error(`[Reorder] Invalid price for ${menuItem.name}:`, currentPrice);
            toast.warning(
              'Price Issue',
              `${menuItem.name} has an invalid price (₹${currentPrice || 0}). Please add it manually from the menu.`
            );
            skippedCount++;
            skippedItems.push(`${menuItem.name} (invalid price)`);
            continue;
          }

          // Validate quantity
          const quantity = orderItem.quantity || 1;
          if (quantity <= 0) {
            console.warn(`[Reorder] Invalid quantity for ${menuItem.name}: ${quantity}`);
            skippedCount++;
            skippedItems.push(`${menuItem.name} (invalid quantity)`);
            continue;
          }

          // Convert to MenuItem format matching the exact type definition
          const cartMenuItem: MenuItem = {
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description || '',
            price: currentPrice, // Use current price from menu API (always up-to-date)
            category: (menuItem.category || 'Main Course') as MenuCategory,
            image: menuItem.image || '/images/placeholder.jpg',
            isVegetarian: menuItem.isVegetarian || false,
            isVegan: menuItem.isVegan || false,
            isGlutenFree: menuItem.isGlutenFree || false,
            spicyLevel: (menuItem.spicyLevel !== undefined && menuItem.spicyLevel >= 0 && menuItem.spicyLevel <= 3) 
              ? (menuItem.spicyLevel as 0 | 1 | 2 | 3)
              : 0,
            preparationTime: menuItem.preparationTime || 30,
            isAvailable: menuItem.isAvailable !== undefined ? menuItem.isAvailable : true,
            isPopular: menuItem.isPopular || false,
            inventoryEnabled: menuItem.inventoryEnabled || false,
            inventory: menuItem.inventory !== undefined ? menuItem.inventory : null,
          };
          
          console.log(`[Reorder] Adding ${cartMenuItem.name} with current price: ₹${cartMenuItem.price} (quantity: ${quantity})`);
          console.log(`[Reorder] MenuItem data:`, {
            id: cartMenuItem.id,
            name: cartMenuItem.name,
            price: cartMenuItem.price,
            category: cartMenuItem.category,
            isAvailable: cartMenuItem.isAvailable
          });

          // Add item to cart with original quantity and special instructions
          try {
            addItem(
              cartMenuItem, 
              quantity, 
              undefined, // customizations (not stored in order items)
              orderItem.specialInstructions || undefined
            );
            console.log(`[Reorder] Successfully dispatched addItem for ${cartMenuItem.name} (quantity: ${quantity})`);
            addedCount++;
          } catch (error) {
            console.error(`[Reorder] Error calling addItem for ${cartMenuItem.name}:`, error);
            skippedCount++;
            skippedItems.push(`${cartMenuItem.name} (add error)`);
          }
        } catch (error) {
          const itemName = orderItem.menuItem?.name || orderItem.name || 'Unknown item';
          console.error(`[Reorder] Error adding item ${itemName}:`, error);
          skippedCount++;
          skippedItems.push(itemName);
        }
      }

      // Show success message and mark that we're expecting cart updates
      if (addedCount > 0) {
        if (skippedCount > 0) {
          toast.warning(
            'Partial Reorder', 
            `Added ${addedCount} item(s) to cart. ${skippedCount} item(s) skipped: ${skippedItems.join(', ')}`
          );
        } else {
          toast.success('Order Added to Cart', `Added ${addedCount} item(s) from order #${orderToReorder.orderNumber} to your cart.`);
        }
        
        // Mark that we're expecting items to be added
        // The useEffect watching cart.items will open the sidebar when items appear
        pendingReorderItemsRef.current = addedCount;
        
        console.log('[Reorder] Marked pending reorder items:', {
          addedCount,
          currentCartLength: cart.items.length
        });
        
        // Open cart sidebar after a brief delay to ensure state has updated
        // Use a longer delay to ensure React has batched all state updates
        setTimeout(() => {
          console.log('[Reorder] Opening cart sidebar after delay, current cart items:', cart.items.length);
          setShowCart(true);
        }, 300);
      } else {
        toast.error('Reorder Failed', `Could not add any items to cart. Items may no longer be available: ${skippedItems.join(', ')}`);
      }
    } catch (error) {
      console.error('[Reorder] Error:', error);
      toast.error('Reorder Failed', 'Failed to reorder. Please try again.');
    }
  };

  const handleCancelOrder = (order: any) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = async () => {
    // Play alert sound for cancellation (red alert)
    try {
      playAlertSound();
    } catch (error) {
      console.warn('Failed to play alert sound:', error);
    }
    
    // Refresh orders after cancellation
    try {
      setIsLoadingOrders(true);
      const response = await fetch('/api/orders/my-orders', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
    
    // Show error toast notification (red) for cancellation
    toast.error('Order Cancelled', 'Your order has been cancelled successfully. Refund will be processed within 5-7 business days if payment was made.');
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  const isLoading = isLoadingOrders || isLoadingProfile || isLoadingAchievements || isLoadingInsights;

  return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', position: 'relative', zIndex: 0 }}>
        <Header onCartClick={() => setShowCart(true)} />
        
        {/* Consolidated styles for dashboard layout */}
        <style jsx>{`
          /* Mobile First Approach */
          .dashboard-main-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .dashboard-sidebar {
            display: none;
          }
          
          .mobile-referral-section {
            display: block;
          }
          
          /* Tablet - Show sidebar below content */
          @media (min-width: 768px) {
            .insights-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
          
          /* Desktop - Sidebar layout */
          @media (min-width: 1280px) {
            .dashboard-main-grid {
              grid-template-columns: 1fr 380px !important;
              gap: 2rem !important;
            }
            
            .dashboard-sidebar {
              display: flex !important;
            }
            
            .mobile-referral-section {
              display: none !important;
            }
          }
          
          /* Hero Grid - Responsive Layout */
          .hero-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            align-items: stretch;
            width: 100%;
          }
          
          @media (min-width: 768px) {
            .hero-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 2rem;
            }
          }
          
          /* Extra Large Screens */
          @media (min-width: 1536px) {
            .dashboard-main-grid {
              grid-template-columns: 1fr 420px !important;
            }
          }
          
          /* Container Responsive Padding - Unified centering */
          .profile-container {
            padding: 90px 16px 40px !important;
            width: 100%;
          }
          
          @media (min-width: 640px) {
            .profile-container {
              padding: 100px 24px 40px !important;
            }
          }
          
          @media (min-width: 1024px) {
            .profile-container {
              padding: 100px 32px 60px !important;
            }
          }
          
          @media (min-width: 1400px) {
            .profile-container {
              padding: 100px 48px 60px !important;
            }
          }
          
          /* Centered content sections */
          .centered-section {
            max-width: 100%;
            margin: 0 auto;
            width: 100%;
          }
        `}</style>
        
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '90px 16px 40px', position: 'relative', zIndex: 1 }} className="profile-container">
          {/* Hero Section - Culinary Passport & Taste Profile */}
          <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
            {isLoadingProfile ? (
              <SkeletonHero />
            ) : tasteProfile ? (
              <div className="hero-grid">
              <CulinaryPassport
                customerName={user.name}
                explorerRank={tasteProfile.explorationStats.explorerRank}
                totalOrders={user.totalOrders}
                dishesDiscovered={tasteProfile.explorationStats.totalDishes}
                totalDishes={tasteProfile.explorationStats.totalMenuItems}
                explorationPercentage={tasteProfile.explorationStats.explorationPercentage}
                categoriesExplored={tasteProfile.explorationStats.categoriesExplored.length}
                totalCategories={tasteProfile.explorationStats.totalCategories}
              />
                <TasteProfileWheel
                  tasteProfile={tasteProfile.tasteProfile}
                  flavorArchetype={tasteProfile.flavorArchetype}
                />
              </div>
            ) : (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '1.25rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                padding: '2.5rem 2rem',
                textAlign: 'center',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Subtle gradient background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.03) 0%, rgba(255, 255, 255, 0) 100%)',
                  pointerEvents: 'none',
                }} />
                
                {/* Map Icon - Real looking */}
                <div style={{ 
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  marginBottom: '1.25rem',
                }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Map background */}
                    <rect x="8" y="12" width="48" height="40" rx="4" fill="#667eea" fillOpacity="0.1" />
                    
                    {/* Map fold lines */}
                    <line x1="24" y1="12" x2="24" y2="52" stroke="#667eea" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="2 2" />
                    <line x1="40" y1="12" x2="40" y2="52" stroke="#667eea" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="2 2" />
                    
                    {/* Location pin */}
                    <circle cx="32" cy="28" r="6" fill="#667eea" />
                    <circle cx="32" cy="28" r="3" fill="white" />
                    <path d="M32 34L28 40H36L32 34Z" fill="#667eea" />
                    
                    {/* Small route dots */}
                    <circle cx="20" cy="24" r="2" fill="#764ba2" fillOpacity="0.5" />
                    <circle cx="44" cy="36" r="2" fill="#764ba2" fillOpacity="0.5" />
                    
                    {/* Connecting lines */}
                    <path d="M20 24 Q 26 26 32 28" stroke="#764ba2" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
                    <path d="M32 28 Q 38 32 44 36" stroke="#764ba2" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
                  </svg>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '600', 
                    color: '#1d1d1f',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em',
                  }}>
                    Welcome, {user.name}
                  </h2>
                  <p style={{ 
                    fontSize: '1.0625rem', 
                    color: '#6e6e73',
                    marginBottom: '0.25rem',
                    fontWeight: '400',
                  }}>
                    Your culinary journey begins here
                  </p>
                  <p style={{ 
                    fontSize: '0.9375rem', 
                    color: '#86868b',
                    maxWidth: '28rem', 
                    margin: '0 auto',
                    lineHeight: '1.5',
                  }}>
                    Place your first order to unlock your taste profile and start earning rewards
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation - Instagram/Twitter Style */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '0.5rem',
            marginBottom: '2rem',
            width: '100%',
          }}>
            <style dangerouslySetInnerHTML={{
              __html: `
                .profile-tabs::-webkit-scrollbar {
                  display: none;
                }
              `
            }} />
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }} className="profile-tabs">
              
              {/* Overview Tab */}
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'overview' ? '#111827' : 'transparent',
                  color: activeTab === 'overview' ? '#ffffff' : '#6B7280',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'overview') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'overview') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Home size={18} />
                <span>Overview</span>
              </button>

              {/* Orders Tab */}
              <button
                onClick={() => setActiveTab('orders')}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'orders' ? '#111827' : 'transparent',
                  color: activeTab === 'orders' ? '#ffffff' : '#6B7280',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'orders') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'orders') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <ShoppingBag size={18} />
                <span>Orders</span>
                {orders.length > 0 && (
                  <span style={{
                    backgroundColor: activeTab === 'orders' ? '#F97316' : '#E5E7EB',
                    color: activeTab === 'orders' ? '#fff' : '#6B7280',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '999px',
                    minWidth: '1.25rem',
                    textAlign: 'center',
                  }}>
                    {orders.length}
                  </span>
                )}
              </button>

              {/* Taste Profile Tab */}
              <button
                onClick={() => setActiveTab('taste')}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'taste' ? '#111827' : 'transparent',
                  color: activeTab === 'taste' ? '#ffffff' : '#6B7280',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'taste') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'taste') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Utensils size={18} />
                <span>Taste Profile</span>
              </button>

              {/* Account Settings Tab */}
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'settings' ? '#111827' : 'transparent',
                  color: activeTab === 'settings' ? '#ffffff' : '#6B7280',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'settings') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'settings') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Settings size={18} />
                <span>Account</span>
              </button>

              {/* Referrals Tab */}
              <button
                onClick={() => setActiveTab('referrals')}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'referrals' ? '#111827' : 'transparent',
                  color: activeTab === 'referrals' ? '#ffffff' : '#6B7280',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'referrals') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'referrals') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Gift size={18} />
                <span>Referrals</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ position: 'relative' }}>
            {/* OVERVIEW TAB - Dashboard Summary */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }} className="centered-section">
            {/* Left Column - Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, width: '100%' }}>
              {/* Journey Timeline */}
              <section style={{ width: '100%' }}>
                {/* Header with View All Orders button */}
                {!isLoadingOrders && orders.length > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                    }}>
                      Recent Orders
                    </h2>
                    <button
                      onClick={() => router.push('/orders')}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#F97316',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EA580C';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F97316';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      View All Orders
                    </button>
                  </div>
                )}
                
                {isLoadingOrders ? (
                  <SkeletonTimeline />
                ) : orders.length > 0 ? (
                  <JourneyTimeline
                    orders={orders.slice(0, 6).map(order => ({
                      ...order,
                      createdAt: new Date(order.createdAt),
                      confirmedAt: order.confirmedAt ? new Date(order.confirmedAt) : null,
                      preparingAt: order.preparingAt ? new Date(order.preparingAt) : null,
                    }))}
                    onReorder={handleReorder}
                    onCancel={handleCancelOrder}
                  />
                ) : (
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    padding: '2rem',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#4b5563', margin: 0 }}>No orders yet. Start your culinary journey!</p>
                  </div>
                )}
              </section>

              {/* Smart Insights */}
              {!isLoadingInsights && insights && tasteProfile && (
                  <SmartInsights
                    favoriteDishes={tasteProfile.favoriteDishes}
                    monthlySpending={insights.monthlySpending}
                    totalSpent={insights.totalSpent}
                    averageOrderValue={insights.averageOrderValue}
                    categoryExploration={insights.categoryExploration}
                    favoriteDay={insights.favoriteDay}
                    favoriteTime={insights.favoriteTimeOfDay}
                    orderFrequency={insights.orderFrequency}
                    nextOrderPrediction={insights.nextOrderPrediction}
                    onReorder={handleReorder}
                  />
              )}
            </div>
          </div>
            )}

            {/* ORDERS TAB - Full Order History */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }} className="centered-section">
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  width: '100%',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                    }}>Your Orders</h2>
                    <button
                      onClick={() => router.push('/orders')}
                      style={{
                        padding: '0.625rem 1.25rem',
                        backgroundColor: '#F97316',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EA580C';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F97316';
                      }}
                    >
                      View All
                    </button>
                  </div>
                  
                  {isLoadingOrders ? (
                    <SkeletonTimeline />
                  ) : orders.length > 0 ? (
                    <JourneyTimeline
                      orders={orders.map(order => ({
                        ...order,
                        createdAt: new Date(order.createdAt),
                        confirmedAt: order.confirmedAt ? new Date(order.confirmedAt) : null,
                        preparingAt: order.preparingAt ? new Date(order.preparingAt) : null,
                      }))}
                      onReorder={handleReorder}
                      onCancel={handleCancelOrder}
                    />
                  ) : (
                    <div style={{
                      padding: '3rem',
                      textAlign: 'center',
                      color: '#6B7280',
                    }}>
                      <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                      <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>No orders yet</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Start your culinary journey today!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TASTE PROFILE TAB - Flavor Preferences & Insights */}
            {activeTab === 'taste' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', width: '100%' }} className="insights-grid centered-section">
                {/* Taste Profile Wheel */}
                {!isLoadingProfile && tasteProfile ? (
                  <TasteProfileWheel
                    tasteProfile={tasteProfile.tasteProfile}
                    flavorArchetype={tasteProfile.flavorArchetype}
                  />
                ) : (
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '1rem',
                    padding: '3rem',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}>
                    <Utensils size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, color: '#6B7280' }} />
                    <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#111827', margin: 0 }}>
                      No taste profile yet
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>
                      Place your first order to unlock your personalized taste profile
                    </p>
                  </div>
                )}

                {/* Smart Insights */}
                {!isLoadingInsights && insights && tasteProfile && (
                  <SmartInsights
                    favoriteDishes={tasteProfile.favoriteDishes}
                    monthlySpending={insights.monthlySpending}
                    totalSpent={insights.totalSpent}
                    averageOrderValue={insights.averageOrderValue}
                    categoryExploration={insights.categoryExploration}
                    favoriteDay={insights.favoriteDay}
                    favoriteTime={insights.favoriteTimeOfDay}
                    orderFrequency={insights.orderFrequency}
                    nextOrderPrediction={insights.nextOrderPrediction}
                    onReorder={handleReorder}
                  />
                )}
              </div>
            )}

            {/* ACCOUNT SETTINGS TAB - Profile & Security */}
            {activeTab === 'settings' && (
              <div style={{ width: '100%' }} className="centered-section">
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginBottom: '1.5rem',
                  width: '100%',
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#111827',
                    marginTop: 0,
                    marginBottom: '1.5rem',
                  }}>Account Settings</h2>
                  
                  <ProfileSettings
                    customer={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      phone: user.phone,
                      emailVerified: user.emailVerified,
                      phoneVerified: user.phoneVerified || false,
                    }}
                    onUpdateProfile={handleUpdateProfile}
                    onChangePassword={handleChangePassword}
                    onResendVerification={handleResendVerification}
                  />
                </div>
              </div>
            )}

            {/* REFERRALS TAB - Share & Earn Rewards */}
            {activeTab === 'referrals' && (
              <div style={{ maxWidth: '48rem', margin: '0 auto', width: '100%' }} className="centered-section">
                <ReferralCenter
                  referralCode={user.referralCode || 'N/A'}
                  friendsReferred={referralStats.friendsReferred}
                  rewardsEarned={referralStats.rewardsEarned}
                  customerName={user.name}
                />
              </div>
            )}
          </div>
        </div>

        <FooterSimple />
        
        {/* Cart Sidebar - Shows cart items for review after reorder */}
        <CartSidebar
          isOpen={showCart && !showCheckout}
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
        
        {/* Checkout Modal - Opens when user clicks checkout from cart */}
        <CheckoutModal 
          isOpen={showCheckout} 
          onClose={() => {
            setShowCheckout(false);
            // Don't close cart sidebar if there are items
            if (cart.items.length === 0) {
              setShowCart(false);
            }
          }} 
        />

        {/* Cancel Order Modal */}
        {orderToCancel && (
          <CancelOrderModal
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
              paymentStatus: (orderToCancel.paymentStatus || 'PENDING').toLowerCase(),
              customerName: user?.name || 'Customer',
            }}
            cancelledBy="customer"
            onSuccess={handleCancelSuccess}
          />
        )}
      </div>
  );
}

// Export the component directly (CartProvider is now in root layout)
export default ProfilePageContent;

// Skeleton Loaders
function SkeletonHero() {
  return (
    <div className="bg-gray-200 rounded-3xl h-96 animate-pulse" />
  );
}

function SkeletonTimeline() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse" />
      ))}
    </div>
  );
}
