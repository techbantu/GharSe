'use client';

/**
 * NEW FILE: Admin Dashboard - Order Management Interface
 * 
 * Purpose: Provides real-time order monitoring, status updates, and business
 * analytics for restaurant operations. Displays new order notifications.
 * 
 * Features:
 * - Real-time order queue
 * - Order status management
 * - Customer contact information
 * - Revenue and sales analytics
 * - Notification system for new orders
 * 
 * Security Note: In production, this would be protected with authentication.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Package,
  TruckIcon,
  CheckCircle,
  Clock,
  IndianRupee,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  X,
  ChefHat,
  LogOut,
  User,
  Shield,
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Image as ImageIcon,
  Leaf,
  Flame,
  Search,
  Filter,
  AlertCircle,
  Zap,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { useWebSocket } from '@/hooks/useWebSocket';
import CancelOrderModal from '@/components/admin/CancelOrderModal';
import CODPaymentConfirmModal from '@/components/admin/CODPaymentConfirmModal';
import {
  playNotificationSound,
  unlockAudio,
  startRepeatingNotification,
  stopRepeatingNotification
} from '@/utils/notification-sound';
import { useOrderFilters, useExpandedSections, useViewMode } from '@/hooks/useOrderFilters';
import { formatOrderTime, formatDateHeader, calculateOrdersTotal } from '@/lib/order-utils';
import OrderStatsBar from '@/components/admin/OrderStatsBar';
import OrderFilterBar from '@/components/admin/OrderFilterBar';
import CollapsibleOrderSection from '@/components/admin/CollapsibleOrderSection';
import CompactOrderCard from '@/components/admin/CompactOrderCard';
import OrderCalendar from '@/components/admin/OrderCalendar';
import KitchenTicket from '@/components/admin/KitchenTicket';
import FinanceTab from '@/components/admin/FinanceTab';
import Logo from '@/components/Logo';

// Safe wrapper for stopRepeatingNotification to handle import issues
const safeStopNotification = () => {
  try {
    if (typeof stopRepeatingNotification === 'function') {
      stopRepeatingNotification();
    }
  } catch (error) {
    console.warn('[Admin] stopRepeatingNotification error:', error);
  }
};

// Menu Item Interface
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  preparationTime: number;
  isAvailable: boolean;
  isPopular: boolean;
  inventoryEnabled?: boolean;
  inventory?: number | null;
  outOfStockMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Biryani & Rice',
  'Breads',
  'Desserts',
  'Beverages',
];

// Helper function to format phone number for tel: links (works on iOS & Android)
const formatPhoneForCall = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +91, keep it
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  // If it starts with 91 (without +), add +
  if (cleaned.startsWith('91') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // Otherwise, try to add +91 if it looks like an Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // Return as is with + prefix if missing
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Helper function to format email for mailto: links
const formatEmailForMailto = (email: string, subject?: string): string => {
  if (!email) return '';
  const encodedEmail = encodeURIComponent(email);
  if (subject) {
    const encodedSubject = encodeURIComponent(subject);
    return `mailto:${encodedEmail}?subject=${encodedSubject}`;
  }
  return `mailto:${encodedEmail}`;
};

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'refunds' | 'finance'>('orders');
  
  // Refunds & Cancellations state
  const [refundsData, setRefundsData] = useState<any>(null);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [selectedRefundReceipt, setSelectedRefundReceipt] = useState<any>(null);
  const [showRefundReceiptModal, setShowRefundReceiptModal] = useState(false);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [latestOrderNumber, setLatestOrderNumber] = useState<string>('');
  const [latestOrderTotal, setLatestOrderTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlinking, setIsBlinking] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set()); // Track new orders for blinking
  const [confirmedOrderIds, setConfirmedOrderIds] = useState<Set<string>>(new Set()); // Track confirmed orders (stop glow)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<Array<{
    orderId: string;
    orderNumber: string;
    total: number;
    timestamp: Date;
  }>>([]);
  const [showBankSetupGuide, setShowBankSetupGuide] = useState(false);

  // COD Payment Confirmation Modal state
  const [showCODConfirmModal, setShowCODConfirmModal] = useState(false);
  const [orderForCODConfirm, setOrderForCODConfirm] = useState<Order | null>(null);
  
  // Incoming Queue state (orders in grace period)
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [pendingQueueAvgTime, setPendingQueueAvgTime] = useState(0);
  
  // WebSocket connection for real-time order notifications
  const { connect, disconnect, on, off, emit, isConnected} = useWebSocket();
  
  // NEW: Smart order filtering and organization
  const {
    activeOrders,
    completedTodayOrders,
    historyOrdersByDate,
    allFilteredOrders,
    searchQuery,
    statusFilter,
    dateRange,
    setSearchQuery,
    setStatusFilter,
    setDateRange,
    clearFilters,
    isFiltering,
  } = useOrderFilters(orders);
  
  // NEW: Collapsible section management
  const {
    toggleCompletedToday,
    toggleHistoryDate,
    isCompletedTodayExpanded,
    isHistoryDateExpanded,
  } = useExpandedSections();
  
  // NEW: View mode (grid vs list)
  const {
    viewMode,
    toggleViewMode,
    isGridView,
    isListView,
  } = useViewMode();
  
  // Menu Management state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Main Course',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    preparationTime: 30,
    isAvailable: true,
    isPopular: false,
    inventoryEnabled: false,
    inventory: null,
    outOfStockMessage: null,
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuError, setMenuError] = useState<string>('');
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const seenOrderIdsRef = useRef<Set<string>>(new Set()); // Track orders that have been seen/dismissed
  const initialLoadCompleteRef = useRef(false); // Track if initial load has completed
  
  // Load seen order IDs from sessionStorage on mount (persists across refreshes)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSeenIds = sessionStorage.getItem('admin_seen_order_ids');
        if (storedSeenIds) {
          const parsedIds = JSON.parse(storedSeenIds);
          seenOrderIdsRef.current = new Set(parsedIds);
          console.log('[Admin] Loaded seen order IDs from sessionStorage:', parsedIds.length);
        }
      } catch (e) {
        console.warn('[Admin] Failed to load seen order IDs from sessionStorage:', e);
      }
    }
  }, []);
  
  // Save seen order IDs to sessionStorage whenever it changes
  const markOrderAsSeen = React.useCallback((orderId: string) => {
    seenOrderIdsRef.current.add(orderId);
    if (typeof window !== 'undefined') {
      try {
        const idsArray = Array.from(seenOrderIdsRef.current);
        sessionStorage.setItem('admin_seen_order_ids', JSON.stringify(idsArray));
        console.log('[Admin] Marked order as seen:', orderId);
      } catch (e) {
        console.warn('[Admin] Failed to save seen order IDs to sessionStorage:', e);
      }
    }
  }, []);
  
  // Request browser notification permission and unlock audio
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Unlock audio on any user interaction
    const unlockAudioOnInteraction = () => {
      unlockAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', unlockAudioOnInteraction);
      document.removeEventListener('touchstart', unlockAudioOnInteraction);
      document.removeEventListener('keydown', unlockAudioOnInteraction);
    };
    
    document.addEventListener('click', unlockAudioOnInteraction, { once: true });
    document.addEventListener('touchstart', unlockAudioOnInteraction, { once: true });
    document.addEventListener('keydown', unlockAudioOnInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', unlockAudioOnInteraction);
      document.removeEventListener('touchstart', unlockAudioOnInteraction);
      document.removeEventListener('keydown', unlockAudioOnInteraction);
    };
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      console.log('🔐 [Admin Page] Checking auth... Token exists:', !!token);
      console.log('🔐 [Admin Page] Token value:', token ? token.substring(0, 30) + '...' : 'null');
      
      if (!token) {
        console.log('❌ [Admin Page] No token found, redirecting to login');
        router.push('/admin/login');
        return;
      }

      try {
        console.log('📡 [Admin Page] Calling /api/admin/me with token...');
        const response = await fetch('/api/admin/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        console.log('📊 [Admin Page] Response status:', response.status);
        console.log('📊 [Admin Page] Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('📊 [Admin Page] Response data:', data);
        
        if (response.ok && data.success) {
          console.log('✅ [Admin Page] Authentication successful!');
          setIsAuthenticated(true);
          setAdminUser(data.admin);
        } else {
          console.error('❌ [Admin Page] Authentication failed:', {
            status: response.status,
            ok: response.ok,
            success: data.success,
            error: data.error,
          });
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('❌ [Admin Page] Auth check error:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  // Notification sound is now handled by the utility
  
  // Fetch real orders from API (wrapped in useCallback to prevent infinite loops)
  // Using ref to access latest newOrderIds without causing dependency issues
  const newOrderIdsRef = useRef<Set<string>>(new Set());
  
  // Update ref when newOrderIds changes
  useEffect(() => {
    newOrderIdsRef.current = newOrderIds;
  }, [newOrderIds]);
  
  // Fetch pending queue count
  const fetchPendingQueue = React.useCallback(async () => {
    try {
      console.log('[Admin] Fetching pending queue...');
      const response = await fetch('/api/orders/pending-queue');
      if (response.ok) {
        const data = await response.json();
        console.log('[Admin] Pending queue data:', data);
        setPendingQueueCount(data.count || 0);
        setPendingQueueAvgTime(data.avgTimeRemainingSeconds || 0);
      } else {
        console.error('[Admin] Failed to fetch pending queue:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[Admin] Failed to fetch pending queue:', error);
    }
  }, []);
  
  const fetchOrders = React.useCallback(async () => {
    try {
      // Fetch both regular orders and pending queue
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const fetchedOrders = data.orders || [];
        
        // Also fetch pending queue count
        fetchPendingQueue();
        
        // Check for new orders by comparing order IDs (only for polling fallback)
        // WebSocket handles real-time notifications, but we keep polling as backup
        const currentOrderIds = new Set(fetchedOrders.map((o: Order) => o.id));
        const previousOrderIds = previousOrderIdsRef.current;
        const currentNewOrderIds = newOrderIdsRef.current; // Use ref instead of state
        const seenOrderIds = seenOrderIdsRef.current; // Get seen orders
        
        // Skip notification on initial load (when previousOrderIds is empty)
        // This prevents false positives when refreshing the page
        const isInitialLoad = previousOrderIds.size === 0;
        
        // Clear any existing notifications on initial load to prevent stale notifications
        if (isInitialLoad) {
          setShowNotification(false);
          setIsBlinking(false);
          setNewOrderCount(0);
          setLatestOrderNumber('');
          setLatestOrderTotal(0);
          // Stop any playing notification sounds
          safeStopNotification();
          // Mark initial load as complete after a short delay (allows refs to populate)
          setTimeout(() => {
            initialLoadCompleteRef.current = true;
          }, 1000);
        }
        
        // Find new orders (orders that exist now but didn't before)
        // ALSO include orders that just transitioned from PENDING_CONFIRMATION to PENDING
        // Only trigger if WebSocket didn't already handle it (polling fallback)
        // AND it's not the initial load
        // AND it hasn't been seen/dismissed before
        // AND it's actually new (created within last 10 minutes)
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;
        
        const newOrders = !isInitialLoad && initialLoadCompleteRef.current ? fetchedOrders.filter((order: Order) => {
          const orderId = order.id;
          const orderCreatedAt = new Date(order.createdAt).getTime();
          const isRecentOrder = orderCreatedAt > tenMinutesAgo;
          
          // CRITICAL FIX: Include orders that are in 'pending' status and were just created
          // This catches orders that transitioned from PENDING_CONFIRMATION to PENDING
          const isNewPendingOrder = order.status === 'pending' && isRecentOrder && !seenOrderIds.has(orderId);
          
          // Must be: (not in previous fetch OR is newly pending) AND not already notified AND not seen/dismissed
          return (
            isRecentOrder &&
            !currentNewOrderIds.has(orderId) &&
            !seenOrderIds.has(orderId) &&
            (!previousOrderIds.has(orderId) || isNewPendingOrder)
          );
        }) : [];
        
        // ADDITIONAL: Mark any recently created 'pending' orders as new (for glowing button)
        if (!isInitialLoad) {
          fetchedOrders.forEach((order: Order) => {
            const orderCreatedAt = new Date(order.createdAt).getTime();
            const isVeryRecent = orderCreatedAt > (now - 2 * 60 * 1000); // Last 2 minutes
            
            if (order.status === 'pending' && isVeryRecent && !currentNewOrderIds.has(order.id)) {
              console.log('[Admin] Marking recent pending order as new:', order.orderNumber);
              setNewOrderIds(prev => new Set([...prev, order.id]));
            }
          });
        }
        
        if (newOrders.length > 0) {
          // New order detected via polling (WebSocket backup)
          const newestOrder = newOrders[0];
          
          console.log('🔔 [Admin] New order detected via polling:', newestOrder.orderNumber);
          
          setLatestOrderNumber(newestOrder.orderNumber);
          setLatestOrderTotal(newestOrder.pricing.total);
          setShowNotification(true);
          setNewOrderCount(prev => prev + 1);
          setIsBlinking(true);
          
          // Add to notification history
          setNotificationHistory(prev => [{
            orderId: newestOrder.id,
            orderNumber: newestOrder.orderNumber,
            total: newestOrder.pricing.total,
            timestamp: new Date(),
          }, ...prev].slice(0, 10)); // Keep last 10 notifications
          
          // Ensure audio is unlocked and play sound IMMEDIATELY
          try {
            unlockAudio();
            // Play sound immediately (don't wait)
            playNotificationSound();
          } catch (e) {
            console.warn('Audio unlock failed:', e);
          }
          
          // Then start repeating notification sound (Postmates style)
          console.log('🔊 [Admin] Starting repeating notification sound');
          startRepeatingNotification();
          
          // Mark as new order for blinking
          setNewOrderIds(prev => new Set([...prev, newestOrder.id]));
          
          // Stop blinking after 5 seconds
          setTimeout(() => setIsBlinking(false), 5000);
          
          // Auto-hide notification after 10 seconds and mark as seen
          setTimeout(() => {
            safeStopNotification();
            setShowNotification(false);
            setIsBlinking(false);
            markOrderAsSeen(newestOrder.id); // Mark as seen when auto-dismissed
            setNewOrderIds(prev => {
              const next = new Set(prev);
              next.delete(newestOrder.id);
              return next;
            });
          }, 10000);
        }
        
        // Update previous order IDs for next comparison
        // IMPORTANT: Update ref BEFORE setting orders to prevent race conditions
        previousOrderIdsRef.current = currentOrderIds as Set<string>;
        
        // Also clear any orders from newOrderIds that are no longer "new" (older than 30 seconds)
        // This prevents stale orders from triggering notifications on refresh
        if (isInitialLoad) {
          // On initial load, clear all newOrderIds since we're starting fresh
          setNewOrderIds(new Set());
        }
        
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [markOrderAsSeen]); // Add markOrderAsSeen to dependencies
  
  // Unlock audio IMMEDIATELY on page load (prepare for instant sound notifications)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Unlock audio as soon as admin dashboard loads (don't wait for WebSocket)
    try {
      unlockAudio();
      console.log('[Admin] Audio unlocked immediately on page load - ready for instant notifications');
    } catch (e) {
      console.warn('[Admin] Audio unlock failed on page load:', e);
    }
    
    // CRITICAL: Unlock audio on ANY user interaction (click, scroll, keypress)
    const unlockOnInteraction = () => {
      try {
        unlockAudio();
        console.log('[Admin] Audio unlocked via user interaction');
      } catch (e) {
        console.warn('[Admin] Audio unlock failed on interaction:', e);
      }
    };
    
    // Add listeners for all interaction types
    document.addEventListener('click', unlockOnInteraction, { once: true });
    document.addEventListener('keydown', unlockOnInteraction, { once: true });
    document.addEventListener('scroll', unlockOnInteraction, { once: true });
    document.addEventListener('touchstart', unlockOnInteraction, { once: true });
    
    console.log('[Admin] Audio unlock listeners added - will unlock on any interaction');
    
    return () => {
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
      document.removeEventListener('scroll', unlockOnInteraction);
      document.removeEventListener('touchstart', unlockOnInteraction);
    };
  }, [isAuthenticated]);

  // WebSocket connection for real-time notifications (with graceful degradation)
  useEffect(() => {
    if (!isAuthenticated) return;

    let connectionTimeout: NodeJS.Timeout | null = null;
    let mounted = true;

    // Connect to WebSocket with timeout handling
    try {
      connect();
      
      // Set a timeout to prevent hanging if WebSocket server isn't available
      connectionTimeout = setTimeout(() => {
        if (!isConnected && mounted) {
          console.warn('[Admin] WebSocket connection timeout - using polling fallback');
          // Don't disconnect - let it keep trying in background
          // Polling will handle updates in the meantime
        }
      }, 15000); // 15 second timeout
    } catch (error) {
      console.warn('[Admin] WebSocket connection failed - using polling fallback:', error);
      // Gracefully degrade - polling will still work
    }

    // Join admin room when connected
    const handleConnect = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      // Ensure audio is still unlocked when WebSocket connects
      try {
        unlockAudio();
      } catch (e) {
        console.warn('[Admin] Audio unlock failed on WebSocket connect:', e);
      }
      
      try {
        emit('join:admin', {});
        console.log('[Admin] Joined admin room for real-time notifications');
      } catch (error) {
        console.warn('[Admin] Failed to join admin room:', error);
      }
    };

    // Listen for new orders
    const handleNewOrder = (data: {
      orderId: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      total: number;
      status: string;
      createdAt: string;
      items: Array<{ name: string; quantity: number }>;
    }) => {
      if (!mounted) return;
      
      // Wait for initial load to complete before processing WebSocket events
      // This prevents race conditions where WebSocket fires before fetchOrders completes
      if (!initialLoadCompleteRef.current) {
        console.log('[Admin] Initial load not complete, deferring WebSocket notification');
        // Retry after a short delay
        setTimeout(() => {
          if (mounted && initialLoadCompleteRef.current) {
            handleNewOrder(data);
          }
        }, 500);
        return;
      }
      
      // Check if this order was already seen (use refs to avoid stale closure issues)
      // This prevents duplicate notifications on refresh or reconnection
      const currentNewOrderIds = newOrderIdsRef.current;
      const previousOrderIds = previousOrderIdsRef.current;
      const seenOrderIds = seenOrderIdsRef.current;
      
      // Check if order was already seen in previous fetch, already notified, or dismissed
      const orderAlreadySeen = previousOrderIds.has(data.orderId);
      const isAlreadyNotified = currentNewOrderIds.has(data.orderId);
      const wasDismissed = seenOrderIds.has(data.orderId);
      
      // Also check if order is actually new (created within last 5 minutes)
      const orderCreatedAt = new Date(data.createdAt).getTime();
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const isRecentOrder = orderCreatedAt > fiveMinutesAgo;
      
      if (orderAlreadySeen || isAlreadyNotified || wasDismissed || !isRecentOrder) {
        console.log('[Admin] Order already seen/notified/dismissed or too old, skipping:', data.orderNumber, {
          seen: orderAlreadySeen,
          notified: isAlreadyNotified,
          dismissed: wasDismissed,
          isRecent: isRecentOrder,
          createdAt: new Date(data.createdAt).toISOString()
        });
        return;
      }
      
      console.log('[Admin] New order received via WebSocket:', data);
      
      // Mark this order as new (for blinking animation)
      setNewOrderIds(prev => new Set([...prev, data.orderId]));
      
      // Update notification state
      setLatestOrderNumber(data.orderNumber);
      setLatestOrderTotal(data.total);
      setShowNotification(true);
      setNewOrderCount(prev => prev + 1);
      setIsBlinking(true);
      
      // Add to notification history
      setNotificationHistory(prev => [{
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        total: data.total,
        timestamp: new Date(),
      }, ...prev].slice(0, 10)); // Keep last 10 notifications
      
      // Ensure audio is unlocked and play sound IMMEDIATELY
      try {
        unlockAudio();
        // Play sound immediately (don't wait)
        playNotificationSound();
      } catch (e) {
        console.warn('Audio unlock failed:', e);
      }
      
      // Then start repeating notification sound (Postmates style)
      startRepeatingNotification();
      
      // Show browser notification
      if (notificationPermission === 'granted' && 'Notification' in window) {
        try {
          new Notification('🎉 New Order Received!', {
            body: `Order #${data.orderNumber} - ₹${data.total.toFixed(2)} from ${data.customerName}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `order-${data.orderId}`, // Prevent duplicate notifications
            requireInteraction: false,
          });
        } catch (notifError) {
          console.warn('Failed to show browser notification:', notifError);
        }
      }
      
      // Stop blinking after 5 seconds
      setTimeout(() => {
        if (mounted) setIsBlinking(false);
      }, 5000);
      
      // Auto-hide notification after 10 seconds and mark as seen
      setTimeout(() => {
        if (mounted) {
          safeStopNotification();
          setShowNotification(false);
          setIsBlinking(false);
          markOrderAsSeen(data.orderId); // Mark as seen when auto-dismissed
        }
      }, 10000);
      
      // Remove from new orders set after 10 seconds (stop blinking)
      setTimeout(() => {
        if (mounted) {
          setNewOrderIds(prev => {
            const next = new Set(prev);
            next.delete(data.orderId);
            return next;
          });
        }
      }, 10000);
      
      // Refresh orders list to show the new order
      fetchOrders();
    };

    // Set up event listeners with error handling
    try {
      on('connect', handleConnect);
      on('admin:new_order', handleNewOrder);
      
      // Join admin room if already connected
      if (isConnected) {
        handleConnect();
      }
    } catch (error) {
      console.warn('[Admin] Error setting up WebSocket listeners:', error);
    }

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      try {
        off('connect', handleConnect);
        off('admin:new_order', handleNewOrder);
        // Don't disconnect on cleanup - let it stay connected for other components
      } catch (error) {
        console.warn('[Admin] Error cleaning up WebSocket listeners:', error);
      }
    };
  }, [isAuthenticated, isConnected, connect, disconnect, on, off, emit, notificationPermission, markOrderAsSeen]); // Added markOrderAsSeen to deps

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  // Click outside handler for user menu and notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
      if (showNotificationDropdown && !target.closest('[data-notification-dropdown]')) {
        setShowNotificationDropdown(false);
      }
    };
    if (showUserMenu || showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotificationDropdown]);
  
  // Auto-refresh orders (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      // Auto-refresh every 2 seconds for faster fallback if WebSocket fails (Postmates-style)
      // WebSocket should handle instant notifications, but polling ensures no missed orders
      const interval = setInterval(fetchOrders, 2000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOrders]);

  // ========== ORDER TIMER COMPONENT ==========
  
  /**
   * Timer component for displaying countdown with urgent red blinking when <= 5 minutes
   * Shows "Delivered X min faster!" when order is completed ahead of schedule
   */
  const OrderTimer = React.memo(({ 
    estimatedReadyTime, 
    status, 
    actualReadyTime, 
    deliveryTime 
  }: { 
    estimatedReadyTime: Date | string;
    status: OrderStatus;
    actualReadyTime?: Date | string;
    deliveryTime?: Date | string;
  }) => {
    const [timeRemaining, setTimeRemaining] = useState(() => {
      try {
        const diff = new Date(estimatedReadyTime).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 60000)); // minutes
      } catch (error) {
        console.error('Error calculating time remaining:', error);
        return 0;
      }
    });
    
    // Check if order is completed (delivered, ready, cancelled, or refunded)
    const isCompleted = status === 'delivered' || status === 'ready' || status === 'picked-up' || status === 'cancelled' || status === 'refunded';
    
    // Calculate how many minutes faster it was completed
    const calculateTimeSaved = () => {
      if (!isCompleted) return null;
      
      try {
        const estimatedTime = new Date(estimatedReadyTime).getTime();
        let actualTime: number;
        
        // Use deliveryTime if delivered, otherwise use actualReadyTime or current time
        if (status === 'delivered' && deliveryTime) {
          actualTime = new Date(deliveryTime).getTime();
        } else if (actualReadyTime) {
          actualTime = new Date(actualReadyTime).getTime();
        } else {
          // Fallback to current time if no actual time recorded
          actualTime = Date.now();
        }
        
        const minutesSaved = Math.ceil((estimatedTime - actualTime) / 60000);
        return minutesSaved > 0 ? minutesSaved : 0;
      } catch (error) {
        console.error('Error calculating time saved:', error);
        return null;
      }
    };
    
    const minutesSaved = calculateTimeSaved();
    
    useEffect(() => {
      // Stop timer if order is completed
      if (isCompleted) {
        return;
      }
      
      // Update timer every second for active orders
      const interval = setInterval(() => {
        try {
          const diff = new Date(estimatedReadyTime).getTime() - Date.now();
          const minutes = Math.max(0, Math.ceil(diff / 60000));
          setTimeRemaining(minutes);
        } catch (error) {
          console.error('Error updating timer:', error);
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }, [estimatedReadyTime, isCompleted]);
    
    // Helper function to format time difference in human-readable format
    const formatTimeDifference = (minutes: number): string => {
      const absMinutes = Math.abs(minutes);
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;
      
      if (hours > 0 && mins > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${mins} minute${mins > 1 ? 's' : ''}`;
      }
    };

    // For delivered orders: Show only "Delivered" with time difference (faster or late)
    if (status === 'delivered') {
      try {
        const estimatedTime = new Date(estimatedReadyTime).getTime();
        const actualTime = deliveryTime ? new Date(deliveryTime).getTime() : Date.now();
        const timeDifference = Math.ceil((actualTime - estimatedTime) / 60000); // minutes
        
        if (timeDifference < 0) {
          // Delivered early (negative difference means before estimated time)
          const minutesFaster = Math.abs(timeDifference);
          const timeText = formatTimeDifference(minutesFaster);
          return (
            <span className="timer-completed" style={{ 
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#10b981',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }}>
              <CheckCircle size={14} />
              Delivered {timeText} faster! 🚀
            </span>
          );
        } else if (timeDifference > 0) {
          // Delivered late
          const timeText = formatTimeDifference(timeDifference);
          return (
            <span className="timer-completed" style={{ 
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            }}>
              <Clock size={14} />
              Delivered {timeText} late
            </span>
          );
        } else {
          // Delivered exactly on time
          return (
            <span className="timer-completed" style={{ 
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#10b981',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle size={14} />
              Delivered
            </span>
          );
        }
      } catch (error) {
        console.error('Error calculating delivery time:', error);
        return (
          <span className="timer-completed" style={{ 
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#6b7280',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <CheckCircle size={14} />
            Delivered
          </span>
        );
      }
    }
    
    // For other completed statuses (ready, picked-up, cancelled, refunded)
    if (isCompleted) {
      return (
        <span className="timer-completed" style={{ 
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#6b7280',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <CheckCircle size={14} />
          {status === 'ready' ? 'Ready' : status === 'cancelled' ? 'Cancelled' : status === 'refunded' ? 'Refunded' : 'Completed'}
        </span>
      );
    }
    
    // Active countdown timer (only for active orders)
    // Note: If order is completed, we would have returned above, so this code only runs for active orders
    const isUrgent = timeRemaining <= 5 && timeRemaining > 0;
    const isOverdue = timeRemaining === 0;
    
    // Don't blink overdue/urgent timers for completed orders (safety check)
    const shouldBlink = !isCompleted;
    
    if (isOverdue) {
      return (
        <span 
          className={shouldBlink ? "timer-urgent" : ""} 
          style={{ 
            fontSize: '0.875rem',
            color: '#ef4444',
            fontWeight: 700
          }}
        >
          <Clock size={14} />
          OVERDUE!
        </span>
      );
    }
    
    if (isUrgent) {
      return (
        <span 
          className={shouldBlink ? "timer-urgent" : ""} 
          style={{ 
            fontSize: '0.875rem',
            color: '#ef4444',
            fontWeight: 700
          }}
        >
          <Clock size={14} />
          Ready in {timeRemaining} min
        </span>
      );
    }
    
    return (
      <span className="timer-normal" style={{ fontSize: '0.875rem' }}>
        Ready in {timeRemaining} min
      </span>
    );
  });
  
  OrderTimer.displayName = 'OrderTimer';

  // ========== MENU MANAGEMENT FUNCTIONS ==========
  
  // Fetch menu items from database
  const fetchMenuItems = async () => {
    console.log('[Menu] Fetching menu items...');
    try {
      setMenuLoading(true);
      setMenuError('');
      
      await fetch('/api/database/init');
      const response = await fetch('/api/menu');
      console.log('[Menu] API response status:', response.status, response.ok);
      
      const data = await response.json();
      console.log('[Menu] API response data:', {
        success: data.success,
        itemsCount: data.items?.length || 0,
        hasItems: !!data.items,
        fullResponse: data
      });
      
      if (data.success) {
        console.log('[Menu] Setting menu items:', data.items?.length || 0, 'items');
        setMenuItems(data.items || []); // Changed from data.data to data.items
      } else {
        const errorMsg = 'Failed to load menu items: ' + (data.error || 'Unknown error');
        console.error('[Menu] Error:', errorMsg);
        setMenuError(errorMsg);
      }
    } catch (err: any) {
      console.error('[Menu] Exception fetching menu items:', err);
      setMenuError('Failed to connect to database.');
    } finally {
      setMenuLoading(false);
    }
  };

  // Fetch menu items when authenticated and on menu tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'menu') {
      fetchMenuItems();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch refunds data when authenticated and on refunds tab
  const fetchRefundsData = React.useCallback(async () => {
    setRefundsLoading(true);
    try {
      const response = await fetch('/api/admin/refunds');
      if (response.ok) {
        const data = await response.json();
        setRefundsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch refunds data:', error);
    } finally {
      setRefundsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'refunds') {
      fetchRefundsData();
    }
  }, [isAuthenticated, activeTab, fetchRefundsData]);

  const handleInputChange = (field: keyof MenuItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMenuError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMenuError('Image too large. Maximum size is 5MB');
      return;
    }

    setUploadingImage(true);
    setMenuError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('itemId', editingItem?.id || `new-${Date.now()}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        handleInputChange('image', data.url);
      } else {
        setMenuError('Failed to upload image: ' + data.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMenuError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const priceValue = typeof formData.price === 'string' ? formData.price : String(formData.price || '');
    
    if (!formData.name || !formData.description || !priceValue || priceValue === '' || isNaN(Number(priceValue))) {
      setMenuError('Please fill in name, description, and a valid price');
      return;
    }

    setSaving(true);
    setMenuError('');

    try {
      const price = typeof formData.price === 'string' ? parseFloat(formData.price) : (formData.price || 0);
      
      if (!price || isNaN(price) || price <= 0) {
        setMenuError('Please enter a valid price');
        setSaving(false);
        return;
      }

      const menuItemData = {
        name: formData.name,
        description: formData.description,
        price: price,
        category: formData.category,
        image: formData.image || null,
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        spicyLevel: formData.spicyLevel || 0,
        preparationTime: formData.preparationTime || 30,
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        isPopular: formData.isPopular || false,
        inventoryEnabled: formData.inventoryEnabled || false,
        inventory: formData.inventoryEnabled ? (formData.inventory ?? null) : null,
        outOfStockMessage: formData.inventoryEnabled ? (formData.outOfStockMessage || null) : null,
      };

      let response;
      if (editingItem) {
        response = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });
      } else {
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });
      }

      const data = await response.json();

      if (data.success) {
        await fetchMenuItems();
        cancelEdit();
        setMenuError('');
        
        // Show success alert
        alert(data.message || '🎉 Menu item created successfully!');
      } else {
        setMenuError(data.error || 'Failed to save menu item');
      }
    } catch (err) {
      console.error('Save error:', err);
      setMenuError('Failed to save menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchMenuItems();
        setMenuError('');
      } else {
        if (data.hasOrders) {
          const userChoice = confirm(
            `⚠️ ${data.error}\n\n💡 ${data.suggestion}\n\nWould you like to mark this item as "Not Available" instead?`
          );
          
          if (userChoice) {
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
              const updateResponse = await fetch(`/api/menu/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...item,
                  isAvailable: false,
                }),
              });
              
              const updateData = await updateResponse.json();
              if (updateData.success) {
                await fetchMenuItems();
                setMenuError('');
              } else {
                setMenuError('Failed to update menu item availability');
              }
            }
          }
        } else {
          setMenuError(data.error || 'Failed to delete menu item');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      setMenuError('Failed to delete menu item');
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      price: item.price || 0,
    });
    setImagePreview(item.image || '');
    setIsAddingNew(true);
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Main Course',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      spicyLevel: 0,
      preparationTime: 30,
      isAvailable: true,
      isPopular: false,
      inventoryEnabled: false,
      inventory: null,
      outOfStockMessage: null,
    });
    setImagePreview('');
    setMenuError('');
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = !menuSearchQuery || 
      item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const availableCount = menuItems.filter(item => item.isAvailable).length;
  const popularCount = menuItems.filter(item => item.isPopular).length;

  // Helper: Check if order is Cash on Delivery
  const isCODOrder = (order: Order): boolean => {
    const codMethods = ['cash-on-delivery', 'cash', 'cod', 'CASH_ON_DELIVERY', 'Cash On-Delivery'];
    return codMethods.includes(order.paymentMethod?.toLowerCase() || '');
  };

  // Helper: Update payment status
  const updatePaymentStatus = async (orderId: string, paymentStatus: 'PAID' | 'PENDING', paymentReceived: boolean) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus,
          paymentReceivedAt: paymentReceived ? new Date().toISOString() : undefined,
          notes: paymentReceived ? 'Cash received from customer' : 'Payment pending',
        }),
      });

      if (!response.ok) {
        console.error('Failed to update payment status:', await response.text());
      } else {
        console.log('Payment status updated successfully');
        // Refresh financial data
        fetchFinancialData();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  // Handle COD payment confirmation from modal
  const handleCODPaymentConfirm = async (paymentReceived: boolean) => {
    if (!orderForCODConfirm) return;

    // Update payment status
    await updatePaymentStatus(
      orderForCODConfirm.id,
      paymentReceived ? 'PAID' : 'PENDING',
      paymentReceived
    );

    // Close modal
    setShowCODConfirmModal(false);
    setOrderForCODConfirm(null);

    // Refresh orders to show updated payment status
    await fetchOrders();
  };

  // Update order status - Save to database
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // INTERCEPT: If marking as "delivered" and order is COD, show payment confirmation modal
    if (newStatus === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      if (order && isCODOrder(order)) {
        // Show COD payment confirmation modal
        setOrderForCODConfirm(order);
        setShowCODConfirmModal(true);
        // Note: The actual status update will happen after modal confirmation
        // For now, update status to delivered, but payment confirmation happens in modal
      }
    }

    // Remove from blinking set if order is completed (delivered, cancelled, refunded, or picked-up)
    const isCompletedStatus = ['delivered', 'cancelled', 'refunded', 'picked-up'].includes(newStatus);
    if (isCompletedStatus && newOrderIds.has(orderId)) {
      setNewOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }

    // If confirming a new order, remove it from new orders and mark as confirmed
    if (newStatus === 'confirmed' && newOrderIds.has(orderId)) {
      setNewOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setConfirmedOrderIds(prev => new Set([...prev, orderId]));

      // STOP REPEATING NOTIFICATION SOUND (Postmates style)
      safeStopNotification();
    }
    try {
      // Optimistically update UI
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        )
      );
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      // Save to database and trigger notifications
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        // Revert on error
        await fetchOrders();
      } else {
        // Refresh orders after successful status update to ensure consistency
        await fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      await fetchOrders();
    }
  };
  
  // Financial data state
  const [financialData, setFinancialData] = useState<{
    totalReceived: number;
    totalPending: number;
    availableNow: number;
    inTransit: number;
    totalGatewayFees: number;
  } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Fetch financial data
  const fetchFinancialData = async () => {
    try {
      setFinancialLoading(true);
      const response = await fetch('/api/payments/financials?period=today');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFinancialData({
            totalReceived: data.summary.totalReceived,
            totalPending: data.summary.totalPending,
            availableNow: data.summary.availableNow,
            inTransit: data.summary.inTransit,
            totalGatewayFees: data.summary.totalGatewayFees,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setFinancialLoading(false);
    }
  };

  // Fetch financial data on mount and when orders change
  useEffect(() => {
    if (isAuthenticated) {
      fetchFinancialData();
      // Refresh financial data every 30 seconds
      const interval = setInterval(fetchFinancialData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, orders.length]);

  // Calculate stats (excluding cancelled/refunded orders from revenue)
  const stats = {
    todayOrders: orders.length,
    // Only count actually fulfilled orders (delivered/picked-up) toward revenue
    todayRevenue: orders
      .filter(o => ['delivered', 'picked-up'].includes(o.status))
      .reduce((sum, order) => sum + order.pricing.total, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    activeOrders: orders.filter(o => ['confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(o.status)).length,
  };
  
  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      'pending-confirmation': { backgroundColor: '#FEF3C7', color: '#92400E' },
      pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
      confirmed: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      preparing: { backgroundColor: '#E9D5FF', color: '#6B21A8' },
      ready: { backgroundColor: '#D1FAE5', color: '#065F46' },
      'out-for-delivery': { backgroundColor: '#FED7AA', color: '#9A3412' },
      delivered: { backgroundColor: '#F3F4F6', color: '#374151' },
      'picked-up': { backgroundColor: '#F3F4F6', color: '#374151' },
      cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' },
      refunded: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    };
    return colors[status] || { backgroundColor: '#F3F4F6', color: '#374151' };
  };
  
  const getStatusColorClassName = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      'pending-confirmation': 'bg-yellow-100 text-yellow-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      'out-for-delivery': 'bg-orange-100 text-orange-800',
      delivered: 'bg-gray-100 text-gray-800',
      'picked-up': 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ComponentType<{ size?: number }>> = {
      'pending-confirmation': Clock,
      pending: Clock,
      confirmed: CheckCircle,
      preparing: ChefHat,
      ready: Package,
      'out-for-delivery': TruckIcon,
      delivered: CheckCircle,
      'picked-up': CheckCircle,
      cancelled: X,
      refunded: X,
    };
    const Icon = icons[status];
    return <Icon size={16} />;
  };
  
  // Show loading screen while checking authentication
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #F3F4F6',
            borderTopColor: '#F97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New Order Notification - Postmates Style Green Blinking Alert */}
      {showNotification && latestOrderNumber && (
        <div className="fixed top-4 right-4 z-50" style={{ maxWidth: '420px', width: 'calc(100% - 2rem)' }}>
          <div 
            className={`new-order-alert ${isBlinking ? 'blinking' : ''}`}
            onClick={() => {
              // Find and scroll to the specific order by order number
              const orderElement = document.querySelector(`[data-order-number="${latestOrderNumber}"]`);
              if (orderElement) {
                orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight the order briefly
                orderElement.classList.add('highlight-order');
                setTimeout(() => {
                  orderElement.classList.remove('highlight-order');
                }, 2000);
              } else {
                // Fallback: scroll to orders section
                const ordersSection = document.querySelector('.orders-card');
                if (ordersSection) {
                  ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
              
              // Find the order ID from the orders list
              const order = orders.find(o => o.orderNumber === latestOrderNumber);
              if (order) {
                markOrderAsSeen(order.id); // Mark as seen when clicked
              }
              
              // Stop notification sound and clear notification state
              safeStopNotification();
              setShowNotification(false);
              setIsBlinking(false);
            }}
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(34, 197, 94, 0.4), 0 10px 10px -5px rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Animated background pulse */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                animation: isBlinking ? 'pulse 2s ease-in-out infinite' : 'none',
                pointerEvents: 'none'
              }}
            />
            
            {/* Bell Icon with pulse effect */}
            <div 
              style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1
              }}
            >
              <Bell size={28} style={{ color: '#ffffff', fontWeight: 'bold' }} />
            </div>
            
            {/* Order Info */}
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <p style={{ 
                fontSize: '1.125rem', 
                fontWeight: 800, 
                marginBottom: '0.25rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                🎉 New Order!
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                opacity: 0.95,
                fontWeight: 600,
                marginBottom: '0.125rem'
              }}>
                Order #{latestOrderNumber}
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                opacity: 0.9,
                fontWeight: 500
              }}>
                ₹{latestOrderTotal.toFixed(2)} • Tap to view
              </p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent onClick
                
                // Find the order ID from the orders list and mark as seen
                const order = orders.find(o => o.orderNumber === latestOrderNumber);
                if (order) {
                  markOrderAsSeen(order.id); // Mark as seen when dismissed
                }
                
                // Stop notification sound and clear notification state
                safeStopNotification();
                setShowNotification(false);
                setIsBlinking(false);
              }}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <X size={20} style={{ color: '#ffffff' }} />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" style={{ padding: '1.5rem 0' }}>
        <div className="admin-header-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo variant="small" style={{ filter: 'brightness(0) invert(1)' }} />
              <div>
                <h1 className="admin-header-title text-3xl font-bold mb-2">GharSe Admin Dashboard</h1>
                <p className="admin-header-subtitle text-white/80">GharSe - Complete Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell with Dropdown */}
              <div className="relative" style={{ position: 'relative' }} data-notification-dropdown>
                <button
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                    unlockAudio(); // Unlock audio on click
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <Bell size={28} className="text-white" />
                  {newOrderCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                      {newOrderCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.75rem)',
                      right: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                      minWidth: '360px',
                      maxWidth: '420px',
                      maxHeight: '500px',
                      overflowY: 'auto',
                      zIndex: 100,
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F9FAFB'
                    }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Recent Notifications
                      </h3>
                      {newOrderCount > 0 && (
                        <button
                          onClick={() => {
                            setNewOrderCount(0);
                            setNotificationHistory([]);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            color: '#F97316',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF3F2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    
                    {/* Notifications List */}
                    <div>
                      {notificationHistory.length === 0 ? (
                        <div style={{
                          padding: '2rem 1.25rem',
                          textAlign: 'center',
                          color: '#6B7280',
                          fontSize: '0.875rem'
                        }}>
                          <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0 }}>No notifications yet</p>
                        </div>
                      ) : (
                        notificationHistory.map((notification, index) => (
                          <div
                            key={`${notification.orderId}-${index}`}
                            onClick={() => {
                              // Find and select the order
                              const order = orders.find(o => o.id === notification.orderId);
                              if (order) {
                                setSelectedOrder(order);
                                setShowNotificationDropdown(false);
                                // Scroll to order
                                setTimeout(() => {
                                  const orderElement = document.querySelector(`[data-order-id="${order.id}"]`);
                                  if (orderElement) {
                                    orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 100);
                              }
                            }}
                            style={{
                              padding: '1rem 1.25rem',
                              borderBottom: index < notificationHistory.length - 1 ? '1px solid #F3F4F6' : 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F9FAFB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Bell size={18} style={{ color: 'white' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: '#111827',
                                margin: 0,
                                marginBottom: '0.25rem'
                              }}>
                                New Order #{notification.orderNumber}
                              </p>
                              <p style={{
                                fontSize: '0.8125rem',
                                color: '#6B7280',
                                margin: 0,
                                marginBottom: '0.125rem'
                              }}>
                                ₹{notification.total.toFixed(2)}
                              </p>
                              <p style={{
                                fontSize: '0.75rem',
                                color: '#9CA3AF',
                                margin: 0
                              }}>
                                {format(notification.timestamp, 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Menu & Logout */}
              <div style={{ position: 'relative' }} data-user-menu>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <User size={18} />
                  <span>{adminUser?.name || 'Admin'}</span>
                  <Shield size={14} />
                </button>
                
                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.5rem)',
                      right: 0,
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                      minWidth: '240px',
                      zIndex: 50,
                      overflow: 'hidden',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* User Info */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid #F3F4F6' }}>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, marginBottom: '0.25rem', fontWeight: 600 }}>
                        Logged in as:
                      </p>
                      <p style={{ fontSize: '0.9375rem', color: '#111827', margin: 0, fontWeight: 700 }}>
                        {adminUser?.name || 'Admin'}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
                        {adminUser?.email}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#F97316', margin: '0.5rem 0 0 0', fontWeight: 600 }}>
                        Role: {adminUser?.role || 'OWNER'}
                      </p>
                    </div>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#DC2626',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'background-color 0.2s',
                        borderTop: '1px solid #F3F4F6'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEF2F2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Clean, Compact Design */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          paddingLeft: '1rem', 
          paddingRight: '1rem',
          display: 'flex',
          alignItems: 'stretch',
          gap: '0'
        }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'orders' ? '#F97316' : 'transparent',
              color: activeTab === 'orders' ? '#ffffff' : '#4B5563',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid #EA580C' : '3px solid transparent',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'orders' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'orders') {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'orders') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4B5563';
              }
            }}
          >
            <ShoppingBag size={16} />
            <span>Orders</span>
            {orders.length > 0 && (
              <span style={{
                backgroundColor: activeTab === 'orders' ? 'rgba(255,255,255,0.25)' : '#EF4444',
                color: '#ffffff',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.125rem 0.375rem',
                borderRadius: '10px',
                minWidth: '1.25rem',
                textAlign: 'center',
                lineHeight: '1.25rem'
              }}>
                {orders.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'menu' ? '#F97316' : 'transparent',
              color: activeTab === 'menu' ? '#ffffff' : '#4B5563',
              border: 'none',
              borderBottom: activeTab === 'menu' ? '3px solid #EA580C' : '3px solid transparent',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'menu' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'menu') {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'menu') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4B5563';
              }
            }}
          >
            <UtensilsCrossed size={16} />
            <span>Menu</span>
            {menuItems.length > 0 && (
              <span style={{
                backgroundColor: activeTab === 'menu' ? 'rgba(255,255,255,0.25)' : '#10B981',
                color: '#ffffff',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.125rem 0.375rem',
                borderRadius: '10px',
                minWidth: '1.25rem',
                textAlign: 'center',
                lineHeight: '1.25rem'
              }}>
                {menuItems.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('refunds')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'refunds' ? '#F97316' : 'transparent',
              color: activeTab === 'refunds' ? '#ffffff' : '#4B5563',
              border: 'none',
              borderBottom: activeTab === 'refunds' ? '3px solid #EA580C' : '3px solid transparent',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'refunds' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'refunds') {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'refunds') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4B5563';
              }
            }}
          >
            <RotateCcw size={16} />
            <span>Refunds</span>
            {refundsData?.statistics && (
              <span style={{
                backgroundColor: activeTab === 'refunds' ? 'rgba(255,255,255,0.25)' : '#EF4444',
                color: '#ffffff',
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.125rem 0.375rem',
                borderRadius: '10px',
                minWidth: '1.25rem',
                textAlign: 'center',
                lineHeight: '1.25rem'
              }}>
                {refundsData.statistics.totalCancelledCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('finance')}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: activeTab === 'finance' ? '#F97316' : 'transparent',
              color: activeTab === 'finance' ? '#ffffff' : '#4B5563',
              border: 'none',
              borderBottom: activeTab === 'finance' ? '3px solid #EA580C' : '3px solid transparent',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'finance' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'finance') {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'finance') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4B5563';
              }
            }}
          >
            <IndianRupee size={16} />
            <span>Finance</span>
          </button>
          
          <div style={{ flex: 1 }} />
          
          <button
            onClick={() => router.push('/admin/payments/setup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              marginRight: '0.5rem',
              height: 'fit-content'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <Zap size={14} />
            <span>Setup Payments</span>
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="admin-container" style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        paddingLeft: '1rem', 
        paddingRight: '1rem', 
        paddingTop: '1.5rem', 
        paddingBottom: '1.5rem'
      }}>
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
          {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
        <>
        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          {/* Incoming Queue Widget - Orders in Grace Period - ALWAYS VISIBLE FOR DEBUGGING */}
          <div className="stat-card" style={{
            backgroundColor: pendingQueueCount > 0 ? '#FFF7ED' : '#F3F4F6',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: `2px solid ${pendingQueueCount > 0 ? '#F97316' : '#D1D5DB'}`,
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1 font-semibold" style={{ color: pendingQueueCount > 0 ? '#C2410C' : '#6B7280' }}>
                  Incoming Queue
                </p>
                <p className="text-3xl font-bold" style={{ color: pendingQueueCount > 0 ? '#EA580C' : '#9CA3AF' }}>
                  {pendingQueueCount}
                </p>
                <p className="text-xs mt-1" style={{ color: pendingQueueCount > 0 ? '#EA580C' : '#9CA3AF' }}>
                  {pendingQueueCount > 0 ? (
                    pendingQueueAvgTime > 0 ? (
                      `Avg ${Math.ceil(pendingQueueAvgTime / 60)} min to finalize`
                    ) : (
                      'Finalizing soon...'
                    )
                  ) : (
                    'No orders in grace period'
                  )}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                backgroundColor: pendingQueueCount > 0 ? '#FFEDD5' : '#E5E7EB'
              }}>
                <Clock className={pendingQueueCount > 0 ? 'text-orange-600' : 'text-gray-400'} size={24} />
              </div>
            </div>
          </div>
          
          {/* Financial Info Removed - See Finance Tab */}
          <div style={{
            background: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            gridColumn: '1 / -1',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#f59e0b',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}>
              💰
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
                Need to check revenue or payments?
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem' }}>
                Click the <strong>Finance</strong> tab above to see all money-related data
              </p>
            </div>
            <button
              onClick={() => setActiveTab('finance')}
              style={{
                padding: '0.5rem 1rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d97706';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f59e0b';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Go to Finance →
            </button>
          </div>
          
          {/* Hidden button to maintain structure */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              console.log('Setup Guide button clicked, current state:', showBankSetupGuide);
              setShowBankSetupGuide(prev => {
                console.log('Toggling guide, new state will be:', !prev);
                return !prev;
              });
              return false;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-semibold text-sm whitespace-nowrap transition-all shadow-md hover:shadow-lg cursor-pointer"
            type="button"
            style={{ minWidth: '140px', display: 'none' }}
            role="button"
            aria-expanded={showBankSetupGuide}
            aria-controls="bank-setup-guide-content"
          >
            {showBankSetupGuide ? '▼ Hide Guide' : '▶ Setup Guide'}
          </button>
          
          {/* Bank Setup Guide - Expandable Section */}
          {showBankSetupGuide && (
            <div 
              id="bank-setup-guide-content"
              style={{
                marginTop: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                maxHeight: '600px',
                overflowY: 'auto',
                gridColumn: '1 / -1',
              }}
              role="region"
              aria-label="Bank Account Setup Guide"
            >
              <div style={{ maxWidth: '100%' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '1rem',
                  marginTop: 0
                }}>
                  🏦 Bank Account Setup Guide
                </h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '0.5rem',
                    marginTop: 0
                  }}>
                    Current Situation
                  </h4>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    marginBottom: '0.75rem',
                    lineHeight: '1.5',
                    marginTop: 0
                  }}>
                    Your "Today's Revenue" shows <strong style={{ fontWeight: 600 }}>order totals</strong>, but this is <strong style={{ fontWeight: 600 }}>NOT actual money</strong> in your bank account yet.
                  </p>
                        <div style={{
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          marginBottom: '0.75rem'
                        }}>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#991b1b',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            marginTop: 0
                          }}>
                            ❌ What's NOT Working:
                          </p>
                          <ul style={{
                            fontSize: '0.8125rem',
                            color: '#991b1b',
                            margin: 0,
                            paddingLeft: '1.25rem',
                            lineHeight: '1.6'
                          }}>
                            <li style={{ marginBottom: '0.25rem' }}>Money is NOT automatically going to your bank</li>
                            <li style={{ marginBottom: '0.25rem' }}>Payment gateways are not fully connected</li>
                            <li style={{ marginBottom: '0.25rem' }}>No webhook handler to record actual payments</li>
                            <li style={{ marginBottom: '0.25rem' }}>No bank account linked for automatic transfers</li>
                          </ul>
                        </div>
                        <div style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #86efac',
                          borderRadius: '0.375rem',
                          padding: '0.75rem'
                        }}>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#166534',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            marginTop: 0
                          }}>
                            ✅ What We're Building:
                          </p>
                          <ul style={{
                            fontSize: '0.8125rem',
                            color: '#166534',
                            margin: 0,
                            paddingLeft: '1.25rem',
                            lineHeight: '1.6'
                          }}>
                            <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Payment tracking system</strong> - Records every payment received</li>
                            <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Bank account integration</strong> - Automatic transfers to your bank</li>
                            <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Real-time financial dashboard</strong> - See actual money received vs pending</li>
                            <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Payout tracking</strong> - Know when money reaches your bank</li>
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '0.75rem',
                          marginTop: 0
                        }}>
                          🚀 How Money Flows
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '0.375rem',
                            padding: '0.75rem'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#1e3a8a',
                              marginBottom: '0.5rem',
                              marginTop: 0
                            }}>
                              Step 1: Customer Pays
                            </p>
                            <code style={{
                              fontSize: '0.75rem',
                              color: '#1e40af',
                              backgroundColor: '#ffffff',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              display: 'inline-block',
                              fontFamily: 'monospace'
                            }}>
                              Customer → Stripe/Razorpay → Payment Gateway
                            </code>
                          </div>
                          <div style={{
                            backgroundColor: '#fefce8',
                            border: '1px solid #fde047',
                            borderRadius: '0.375rem',
                            padding: '0.75rem'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#854d0e',
                              marginBottom: '0.5rem',
                              marginTop: 0
                            }}>
                              Step 2: Payment Gateway Holds Money
                            </p>
                            <p style={{
                              fontSize: '0.8125rem',
                              color: '#854d0e',
                              margin: 0,
                              lineHeight: '1.5'
                            }}>
                              Holds money for 1-7 days (Stripe: 2-7 days, Razorpay: 1-3 days)
                            </p>
                          </div>
                          <div style={{
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: '0.375rem',
                            padding: '0.75rem'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#166534',
                              marginBottom: '0.5rem',
                              marginTop: 0
                            }}>
                              Step 3: Money Transfers to Your Bank
                            </p>
                            <p style={{
                              fontSize: '0.8125rem',
                              color: '#166534',
                              margin: 0,
                              lineHeight: '1.5'
                            }}>
                              Automatically transfers to your bank account
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '0.75rem',
                          marginTop: 0
                        }}>
                          📋 Quick Setup (Razorpay - Recommended for India)
                        </h4>
                        <ol style={{
                          fontSize: '0.8125rem',
                          color: '#374151',
                          margin: 0,
                          paddingLeft: '1.5rem',
                          lineHeight: '1.6',
                          listStyleType: 'decimal'
                        }}>
                          <li style={{ marginBottom: '0.5rem' }}>
                            Go to <a 
                              href="https://razorpay.com/signup" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                color: '#2563eb',
                                textDecoration: 'underline'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#1d4ed8'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#2563eb'}
                            >
                              razorpay.com/signup
                            </a> and create a Business Account
                          </li>
                          <li style={{ marginBottom: '0.5rem' }}>Complete KYC verification (required for payouts)</li>
                          <li style={{ marginBottom: '0.5rem' }}>
                            Go to <strong style={{ fontWeight: 600 }}>Settings → API Keys</strong> and copy:
                            <ul style={{
                              fontSize: '0.8125rem',
                              margin: '0.25rem 0 0 1.5rem',
                              paddingLeft: '1rem',
                              listStyleType: 'disc',
                              lineHeight: '1.6'
                            }}>
                              <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Key ID</strong> → Add to `.env` as `RAZORPAY_KEY_ID`</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Key Secret</strong> → Add to `.env` as `RAZORPAY_KEY_SECRET`</li>
                            </ul>
                          </li>
                          <li style={{ marginBottom: '0.5rem' }}>Go to <strong style={{ fontWeight: 600 }}>Settings → Bank Accounts</strong> and add your bank account</li>
                          <li style={{ marginBottom: '0.5rem' }}>
                            Go to <strong style={{ fontWeight: 600 }}>Settings → Webhooks</strong> and add webhook URL:{' '}
                            <code style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#f3f4f6',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              fontFamily: 'monospace'
                            }}>
                              https://yourdomain.com/api/payments/webhook
                            </code>
                          </li>
                          <li style={{ marginBottom: '0.5rem' }}>Copy <strong style={{ fontWeight: 600 }}>Webhook Secret</strong> → Add to `.env` as `RAZORPAY_WEBHOOK_SECRET`</li>
                          <li style={{ marginBottom: '0.5rem' }}>Go to <strong style={{ fontWeight: 600 }}>Settings → Settlements</strong> and choose <strong style={{ fontWeight: 600 }}>T+1</strong> (Next day) for fastest payouts</li>
                        </ol>
                        <div style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #86efac',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          marginTop: '0.75rem'
                        }}>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#166534',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            marginTop: 0
                          }}>
                            Why Razorpay?
                          </p>
                          <ul style={{
                            fontSize: '0.8125rem',
                            color: '#166534',
                            margin: 0,
                            paddingLeft: '1.25rem',
                            lineHeight: '1.6'
                          }}>
                            <li style={{ marginBottom: '0.25rem' }}>✅ UPI payments are FREE (0% fees)</li>
                            <li style={{ marginBottom: '0.25rem' }}>✅ Faster payouts (T+1 vs T+7)</li>
                            <li style={{ marginBottom: '0.25rem' }}>✅ Better Indian bank support</li>
                            <li style={{ marginBottom: '0.25rem' }}>✅ Lower fees overall</li>
                          </ul>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '0.5rem',
                          marginTop: 0
                        }}>
                          🔧 Environment Variables
                        </h4>
                        <div style={{
                          backgroundColor: '#111827',
                          color: '#f3f4f6',
                          borderRadius: '0.375rem',
                          padding: '0.75rem',
                          overflowX: 'auto'
                        }}>
                          <pre style={{
                            fontSize: '0.75rem',
                            margin: 0,
                            fontFamily: 'monospace',
                            lineHeight: '1.5',
                            whiteSpace: 'pre'
                          }}>
{`# Razorpay (recommended for India)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Stripe (if using)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...`}
                          </pre>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '0.5rem',
                          marginTop: 0
                        }}>
                          💰 Understanding Your Dashboard
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            padding: '0.5rem'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: '0 0 0.25rem 0'
                            }}>
                              Available Now
                            </p>
                            <p style={{
                              fontSize: '0.8125rem',
                              color: '#374151',
                              margin: 0,
                              lineHeight: '1.5'
                            }}>
                              Money that has cleared payment gateway hold period - ready to use
                            </p>
                          </div>
                          <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            padding: '0.5rem'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: '0 0 0.25rem 0'
                            }}>
                              In Transit
                            </p>
                            <p style={{
                              fontSize: '0.8125rem',
                              color: '#374151',
                              margin: 0,
                              lineHeight: '1.5'
                            }}>
                              Money received but still processing (1-7 days) - automatically transfers to your bank
                            </p>
                          </div>
                          <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            padding: '0.5rem'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#111827',
                              margin: '0 0 0.25rem 0'
                            }}>
                              Pending Collection
                            </p>
                            <p style={{
                              fontSize: '0.8125rem',
                              color: '#374151',
                              margin: 0,
                              lineHeight: '1.5'
                            }}>
                              Cash on delivery orders - you collect when delivering
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#854d0e',
                          fontWeight: 600,
                          marginBottom: '0.5rem',
                          marginTop: 0
                        }}>
                          ⚠️ Important Notes
                        </p>
                        <ul style={{
                          fontSize: '0.8125rem',
                          color: '#854d0e',
                          margin: 0,
                          paddingLeft: '1.25rem',
                          lineHeight: '1.6'
                        }}>
                          <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>KYC Required:</strong> Both Stripe and Razorpay require business verification</li>
                          <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Test Mode:</strong> Start with test mode to verify everything works</li>
                          <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>Bank Verification:</strong> May take 1-2 business days</li>
                          <li style={{ marginBottom: '0.25rem' }}><strong style={{ fontWeight: 600 }}>First Payout:</strong> Usually takes 7-14 days (security check)</li>
                        </ul>
                      </div>

                      <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '0.375rem',
                        padding: '0.75rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#166534',
                          fontWeight: 600,
                          marginBottom: '0.5rem',
                          marginTop: 0
                        }}>
                          ✅ After Setup
                        </p>
                        <p style={{
                          fontSize: '0.8125rem',
                          color: '#166534',
                          margin: 0,
                          lineHeight: '1.5'
                        }}>
                          Your money will automatically transfer to your bank account every day/week (based on your schedule)!
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="stat-card" style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.2s ease'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-orange-600">{stats.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="orders-card" style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #f3f4f6'
        }}>
          <h2 className="orders-title text-2xl font-bold mb-6">Current Orders</h2>
          
          {orders.length === 0 ? (
            <div className="text-center" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h3>
              <p className="text-gray-500">New orders will appear here automatically</p>
            </div>
          ) : (
            <>
              {/* NEW: Smart Order Organization - Kitchen Mode (No Revenue) */}
              <OrderStatsBar orders={orders} showRevenue={false} />
              
              <OrderFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                viewMode={viewMode}
                onViewModeChange={toggleViewMode}
                onClearFilters={clearFilters}
              />

              {/* ACTIVE ORDERS SECTION - Always visible */}
              <CollapsibleOrderSection
                title="Active Orders"
                count={activeOrders.length}
                totalAmount={calculateOrdersTotal(activeOrders)}
                isExpanded={true}
                onToggle={() => {}}
                variant="active"
                icon={<Flame size={24} className="text-orange-600" />}
                emptyMessage="No active orders - You're all caught up!"
              >
                <div className={viewMode === 'grid' ? 'orders-grid' : 'orders-list'}>
                  {activeOrders.map(order => 
                    viewMode === 'list' ? (
                      <CompactOrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={updateOrderStatus}
                        onCall={(phone) => window.location.href = `tel:${phone}`}
                      />
                    ) : (
                      <div key={order.id} style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff',
                      }}
                      onClick={() => setSelectedOrder(order)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div>
                            <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827' }}>
                              {order.orderNumber}
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: '#4B5563' }}>
                              {order.customer.name}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F97316' }}>
                              ₹{order.pricing.total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CollapsibleOrderSection>

              {/* COMPLETED TODAY SECTION - Collapsible */}
              <CollapsibleOrderSection
                title="Completed Today"
                count={completedTodayOrders.length}
                totalAmount={calculateOrdersTotal(completedTodayOrders)}
                isExpanded={isCompletedTodayExpanded}
                onToggle={toggleCompletedToday}
                variant="completed"
                icon={<CheckCircle size={24} className="text-green-600" />}
                emptyMessage="No completed orders yet today"
              >
                <div className={viewMode === 'grid' ? 'orders-grid' : 'orders-list'}>
                  {completedTodayOrders.map(order =>
                    viewMode === 'list' ? (
                      <CompactOrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={updateOrderStatus}
                        onCall={(phone) => window.location.href = `tel:${phone}`}
                      />
                    ) : (
                      <div key={order.id} style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                      }}
                      onClick={() => setSelectedOrder(order)}>
                        <h3 style={{ fontWeight: 600 }}>{order.orderNumber}</h3>
                        <p>{order.customer.name}</p>
                        <p>₹{order.pricing.total.toFixed(2)}</p>
                      </div>
                    )
                  )}
                </div>
              </CollapsibleOrderSection>

              {/* ORDER HISTORY SECTION - Collapsible by date */}
              {Object.keys(historyOrdersByDate).length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
                    Order History
                  </h2>
                  {Object.entries(historyOrdersByDate).map(([date, dateOrders]) => (
                    <CollapsibleOrderSection
                      key={date}
                      title={formatDateHeader(new Date(date))}
                      count={dateOrders.length}
                      totalAmount={calculateOrdersTotal(dateOrders)}
                      isExpanded={isHistoryDateExpanded(date)}
                      onToggle={() => toggleHistoryDate(date)}
                      variant="history"
                      emptyMessage="No orders for this date"
                    >
                      <div className={viewMode === 'grid' ? 'orders-grid' : 'orders-list'}>
                        {dateOrders.map(order =>
                          viewMode === 'list' ? (
                            <CompactOrderCard
                              key={order.id}
                              order={order}
                              onStatusChange={updateOrderStatus}
                              onCall={(phone) => window.location.href = `tel:${phone}`}
                            />
                          ) : (
                            <div key={order.id} style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              cursor: 'pointer',
                              backgroundColor: '#ffffff',
                            }}
                            onClick={() => setSelectedOrder(order)}>
                              <h3>{order.orderNumber}</h3>
                              <p>{order.customer.name}</p>
                              <p>₹{order.pricing.total.toFixed(2)}</p>
                            </div>
                          )
                        )}
                      </div>
                    </CollapsibleOrderSection>
                  ))}
                </div>
              )}

              {/* ALL ORDERS SECTION - Date Organized */}
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                    📦 All Orders
                  </h2>
                  
                  {/* Interactive Calendar */}
                  <div style={{ marginTop: '1rem' }}>
                    <OrderCalendar
                      orders={orders}
                      selectedDate={dateRange.start}
                      onDateSelect={(date) => {
                        const startDate = new Date(date);
                        startDate.setHours(0, 0, 0, 0);
                        const endDate = new Date(date);
                        endDate.setHours(23, 59, 59, 999);
                        setDateRange({ start: startDate, end: endDate });
                      }}
                    />
                  </div>
                </div>
              </div>

              <style>{`
                @media (max-width: 768px) {
                  .orders-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
                @media (min-width: 769px) and (max-width: 1024px) {
                  .orders-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                  }
                }
              `}</style>
              <div 
                className="orders-grid"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem'
                }}
              >
            {allFilteredOrders
              .sort((a, b) => {
                // Sort by date (most recent first)
                const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date(a.createdAt);
                const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
              })
              .map(order => {
              // Only blink for active orders (not delivered, cancelled, or completed)
              const isActiveOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(order.status.toLowerCase());
              const isNewOrder = isActiveOrder && newOrderIds.has(order.id);
              
              // Debug logging for glowing button
              if (order.status === 'pending') {
                console.log(`[Admin] Order ${order.orderNumber}:`, {
                  status: order.status,
                  isActiveOrder,
                  isInNewOrderIds: newOrderIds.has(order.id),
                  isNewOrder,
                  createdAt: order.createdAt,
                  willGlow: isNewOrder,
                });
              }
              
              return (
              <div
                key={order.id}
                data-order-id={order.id}
                data-order-number={order.orderNumber}
                className={isNewOrder ? 'order-card-new' : ''}
                style={{
                  border: isNewOrder ? '2px solid #22c55e' : '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isNewOrder 
                    ? '0 0 0 3px rgba(34, 197, 94, 0.15), 0 2px 8px rgba(34, 197, 94, 0.2)' 
                    : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  backgroundColor: isNewOrder ? '#F0FDF4' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isNewOrder) {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isNewOrder) {
                    e.currentTarget.style.boxShadow = isNewOrder 
                      ? '0 0 0 3px rgba(34, 197, 94, 0.15), 0 2px 8px rgba(34, 197, 94, 0.2)' 
                      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
                onClick={() => {
                  setSelectedOrder(order);
                  if (isNewOrder) {
                    setNewOrderIds(prev => {
                      const next = new Set(prev);
                      next.delete(order.id);
                      return next;
                    });
                  }
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827', marginBottom: '0.25rem', lineHeight: '1.25' }}>
                      {order.orderNumber}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#4B5563', marginBottom: '0.125rem', fontWeight: 500 }}>
                      {order.customer.name}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                      {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '0.75rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F97316', marginBottom: '0.375rem' }}>
                      ₹{order.pricing.total.toFixed(2)}
                    </p>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      gap: '0.25rem',
                      ...getStatusColor(order.status)
                    }}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                {/* Order Details */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.75rem', 
                  color: '#6B7280', 
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {order.orderType === 'delivery' ? <TruckIcon size={12} /> : <Package size={12} />}
                    <span style={{ textTransform: 'capitalize' }}>{order.orderType}</span>
                  </span>
                  <span style={{ fontSize: '0.625rem', color: '#D1D5DB' }}>•</span>
                  <OrderTimer 
                    estimatedReadyTime={order.estimatedReadyTime}
                    status={order.status}
                    actualReadyTime={order.actualReadyTime}
                    deliveryTime={order.deliveryTime}
                  />
                  <span style={{ fontSize: '0.625rem', color: '#D1D5DB' }}>•</span>
                  <span style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                    {order.paymentMethod 
                      ? order.paymentMethod.replace(/-/g, ' ').replace(/_/g, ' ')
                      : 'Cash on Delivery'}
                  </span>
                  {order.pricing.tip && order.pricing.tip > 0 && (
                    <span style={{ fontSize: '0.625rem', color: '#10B981', marginLeft: '4px' }}>
                      💝 ₹{order.pricing.tip}
                    </span>
                  )}
                </div>
                
                {/* Special Instructions */}
                {order.specialInstructions && (
                  <p style={{ 
                    marginBottom: '0.75rem', 
                    fontSize: '0.75rem', 
                    color: '#6B7280', 
                    fontStyle: 'italic', 
                    paddingLeft: '0.5rem', 
                    borderLeft: '2px solid #F97316',
                    lineHeight: '1.4'
                  }}>
                    {order.specialInstructions}
                  </p>
                )}
                
                {/* Quick Actions - Compact */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: 'auto',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #F3F4F6',
                  flexWrap: 'wrap'
                }}>
                  {order.status === 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'confirmed'); }}
                      className={isNewOrder ? 'confirm-button-glow' : ''}
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        flex: '1',
                        minWidth: 'fit-content',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                    >
                      Confirm {isNewOrder && <span className="bell-shake">🔔</span>}
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'preparing'); }}
                      style={{
                        background: '#8b5cf6',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        flex: '1',
                        minWidth: 'fit-content'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                    >
                      Start Prep
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'ready'); }}
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        flex: '1',
                        minWidth: 'fit-content'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                    >
                      Ready
                    </button>
                  )}
                  {order.status === 'ready' && order.orderType === 'delivery' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'out-for-delivery'); }}
                      style={{
                        background: '#F97316',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        flex: '1',
                        minWidth: 'fit-content'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
                    >
                      Out Delivery
                    </button>
                  )}
                  {order.status === 'out-for-delivery' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'delivered'); }}
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        flex: '1',
                        minWidth: 'fit-content'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                    >
                      Delivered
                    </button>
                  )}
                  
                  <a
                    href={`tel:${formatPhoneForCall(order.customer.phone)}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: '#3b82f6',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.15s ease',
                      WebkitTapHighlightColor: 'rgba(37, 99, 235, 0.3)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    <Phone size={12} />
                    <span>Call</span>
                  </a>
                  
                  {/* Cancel Button */}
                  {(['pending', 'confirmed', 'preparing'].includes(order.status)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToCancel(order);
                        setShowCancelModal(true);
                      }}
                      style={{
                        background: '#DC2626',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#B91C1C';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#DC2626';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
            })}
              </div>
              
              {/* Empty State */}
              {allFilteredOrders.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '2px dashed #e5e7eb'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    No orders found
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Try selecting a different date or click "Show All"
                  </p>
                </div>
              )}
            </>
          )}
        </div>
          </>
          )}
          </>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <>
            {/* Menu Manager Header */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '1rem 1.5rem',
              marginBottom: '1rem',
              border: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Menu Manager
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
                  Manage your menu items, prices, and availability
                </p>
              </div>
              <button
                onClick={() => setIsAddingNew(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  background: 'linear-gradient(to right, #10B981, #059669)',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Plus size={16} />
                <span>Add New Dish</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.75rem',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #f3f4f6'
              }}>
                <p style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.25rem', margin: 0, lineHeight: '1.2' }}>
                  Available Dishes
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: '1.2' }}>
                  {availableCount}
                </p>
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.75rem',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #f3f4f6'
              }}>
                <p style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.25rem', margin: 0, lineHeight: '1.2' }}>
                  Popular Items
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F97316', margin: 0, lineHeight: '1.2' }}>
                  {popularCount}
                </p>
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.75rem',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #f3f4f6'
              }}>
                <p style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.25rem', margin: 0, lineHeight: '1.2' }}>
                  Total Items
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: '1.2' }}>
                  {menuItems.length}
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #f3f4f6',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF'
                    }} />
                    <input
                      type="text"
                      placeholder="Search dishes..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.5rem',
                        paddingRight: '0.75rem',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {menuError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '2px solid #FECDD3',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
                <p style={{ color: '#B91C1C', fontSize: '0.875rem', margin: 0 }}>{menuError}</p>
              </div>
            )}

            {/* Loading State */}
            {menuLoading && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  border: '3px solid #F3F4F6',
                  borderTopColor: '#F97316',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
              </div>
            )}

            {/* Menu Items Grid - 4 columns, responsive */}
            {!menuLoading && (
              <>
                <style>{`
                  @media (max-width: 768px) {
                    .menu-items-grid-admin {
                      grid-template-columns: 1fr !important;
                    }
                  }
                  @media (min-width: 769px) and (max-width: 1024px) {
                    .menu-items-grid-admin {
                      grid-template-columns: repeat(2, 1fr) !important;
                    }
                  }
                `}</style>
                <div 
                  className="menu-items-grid-admin"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    width: '100%'
                  }}
                >
                {filteredMenuItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #f3f4f6',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    {/* Image - Smaller for 4-column layout */}
                    <div style={{ position: 'relative', height: '120px', backgroundColor: '#F3F4F6' }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ImageIcon size={48} style={{ color: '#D1D5DB' }} />
                        </div>
                      )}
                      {item.isPopular && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          backgroundColor: '#F97316',
                          color: '#ffffff',
                          paddingLeft: '0.5rem',
                          paddingRight: '0.5rem',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          🔥 Hot Seller
                        </div>
                      )}
                      {!item.isAvailable && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          left: '0.5rem',
                          backgroundColor: '#EF4444',
                          color: '#ffffff',
                          paddingLeft: '0.5rem',
                          paddingRight: '0.5rem',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          Not on Menu
                        </div>
                      )}
                    </div>

                    {/* Content - Compact for 3-column layout */}
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <h3 style={{
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          color: '#111827',
                          margin: 0,
                          flex: 1,
                          lineHeight: '1.3'
                        }}>
                          {item.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', flexShrink: 0 }}>
                          {item.isVegetarian && (
                            <Leaf size={14} style={{ color: '#10B981' }} />
                          )}
                          {item.spicyLevel > 0 && (
                            <Flame size={14} style={{ color: '#EF4444' }} />
                          )}
                        </div>
                      </div>

                      <p style={{
                        fontSize: '0.8125rem',
                        color: '#6B7280',
                        marginBottom: '0.5rem',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <IndianRupee size={14} style={{ color: '#10B981' }} />
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                            ₹{item.price}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#6B7280' }}>
                          <Clock size={12} />
                          <span>{item.preparationTime}m</span>
                        </div>
                      </div>

                      {/* Actions - Compact */}
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button
                          onClick={() => startEdit(item)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                            paddingTop: '0.4375rem',
                            paddingBottom: '0.4375rem',
                            backgroundColor: '#3B82F6',
                            color: '#ffffff',
                            borderRadius: '0.375rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingLeft: '0.625rem',
                            paddingRight: '0.625rem',
                            paddingTop: '0.4375rem',
                            paddingBottom: '0.4375rem',
                            backgroundColor: '#EF4444',
                            color: '#ffffff',
                            borderRadius: '0.375rem',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </>
            )}

            {!menuLoading && filteredMenuItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <ImageIcon size={64} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
                <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
                  {menuSearchQuery || selectedCategory !== 'All' 
                    ? 'No items match your search' 
                    : 'No menu items yet. Add your first dish!'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Refunds & Cancellations Tab */}
        {activeTab === 'refunds' && (
          <div>
            {refundsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" />
                <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading refunds data...</p>
              </div>
            ) : refundsData ? (
              <>
                {/* Statistics Cards */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #FCD34D',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <RotateCcw size={24} color="#92400E" />
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Refunded
                      </h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#78350F', margin: 0 }}>
                      ₹{refundsData.statistics.totalRefundedAmount.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#92400E', marginTop: '0.25rem', margin: 0 }}>
                      {refundsData.statistics.totalRefundedCount} refund{refundsData.statistics.totalRefundedCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #FCA5A5',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <XCircle size={24} color="#991B1B" />
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Cancelled Orders
                      </h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#7F1D1D', margin: 0 }}>
                      {refundsData.statistics.totalCancelledCount}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#991B1B', marginTop: '0.25rem', margin: 0 }}>
                      {refundsData.statistics.cancelledWithRefund} with refund, {refundsData.statistics.cancelledWithoutRefund} without refund
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #93C5FD',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <IndianRupee size={24} color="#1E40AF" />
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Refunded Orders
                      </h3>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1E3A8A', margin: 0 }}>
                      {refundsData.statistics.totalRefundedCount}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1E40AF', marginTop: '0.25rem', margin: 0 }}>
                      All refunds processed
                    </p>
                  </div>
                </div>

                {/* Refunds Table */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    borderBottom: '2px solid #F3F4F6',
                    background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)'
                  }}>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#9A3412',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <RotateCcw size={20} />
                      Refunded & Cancelled Orders
                    </h2>
                  </div>

                  {refundsData.allOrders.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      <XCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '1rem', fontWeight: 600 }}>No refunds or cancellations yet</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>All orders are active</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Order ID
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Customer Name
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Phone Number
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Order Total
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Refund Amount
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Status
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Cancelled Date
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Refund Date
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {refundsData.allOrders.map((order: any, index: number) => (
                            <tr 
                              key={index}
                              style={{
                                borderBottom: '1px solid #F3F4F6',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                              }}
                            >
                              <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                {order.orderId}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                                {order.customerName}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151', fontFamily: 'monospace' }}>
                                <a 
                                  href={`tel:${formatPhoneForCall(order.customerPhone)}`}
                                  style={{
                                    color: '#2563EB',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    WebkitTapHighlightColor: 'rgba(37, 99, 235, 0.3)',
                                    cursor: 'pointer',
                                    display: 'inline-block'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.textDecoration = 'underline';
                                    e.currentTarget.style.color = '#1D4ED8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.textDecoration = 'none';
                                    e.currentTarget.style.color = '#2563EB';
                                  }}
                                >
                                  {order.customerPhone}
                                </a>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                ₹{order.orderTotal.toFixed(2)}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700, color: (order.refundAmount || 0) > 0 ? '#10B981' : '#6B7280' }}>
                                {(order.refundAmount || 0) > 0 ? `₹${order.refundAmount.toFixed(2)}` : 'N/A'}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: order.status === 'REFUNDED' ? '#D1FAE5' : '#FEE2E2',
                                  color: order.status === 'REFUNDED' ? '#065F46' : '#991B1B',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {order.status === 'REFUNDED' ? 'Refunded' : 'Cancelled (No Refund)'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                                {order.cancelledDate ? format(new Date(order.cancelledDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                                {order.refundDate ? format(new Date(order.refundDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => {
                                    setSelectedRefundReceipt(order);
                                    setShowRefundReceiptModal(true);
                                  }}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10 9 9 9 8 9"/>
                                  </svg>
                                  View Receipt
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                <p>No refunds data available</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Menu Add/Edit Modal */}
      {isAddingNew && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Image Upload */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Dish Image *
                  </label>
                  {imagePreview ? (
                    <>
                      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          display: 'flex',
                          gap: '0.5rem'
                        }}>
                          <label style={{
                            padding: '0.5rem',
                            backgroundColor: '#3B82F6',
                            color: '#ffffff',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                          }}
                          title="Change Image"
                          >
                            <Upload size={14} />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <button
                            onClick={() => {
                              setImagePreview('');
                              handleInputChange('image', '');
                            }}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#EF4444',
                              color: '#ffffff',
                              borderRadius: '0.5rem',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Remove Image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          paddingLeft: '0.75rem',
                          paddingRight: '0.75rem',
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem',
                          backgroundColor: '#F3F4F6',
                          border: '2px solid #D1D5DB',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151'
                        }}>
                          <Upload size={16} />
                          <span>Change Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2rem',
                      border: '2px dashed #D1D5DB',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: '#F9FAFB'
                    }}>
                      <Upload size={32} style={{ color: '#9CA3AF', marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Butter Chicken"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the dish..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Price and Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange('price', value === '' ? '' : parseFloat(value));
                      }}
                      min="0"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Options */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                    />
                    <Leaf size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '0.875rem' }}>Vegetarian</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                    />
                    <TrendingUp size={16} style={{ color: '#F97316' }} />
                    <span style={{ fontSize: '0.875rem' }}>Popular</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                    />
                    <CheckCircle size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: '0.875rem' }}>Available</span>
                  </label>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingImage}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      background: 'linear-gradient(to right, #10B981, #059669)',
                      color: '#ffffff',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: (saving || uploadingImage) ? 'not-allowed' : 'pointer',
                      opacity: (saving || uploadingImage) ? 0.5 : 1
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{
                          width: '1rem',
                          height: '1rem',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>{editingItem ? 'Update' : 'Create'} Menu Item</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      paddingLeft: '1.5rem',
                      paddingRight: '1.5rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal - Beautiful Redesign */}
      {selectedOrder && (
          <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 order-modal-backdrop"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedOrder(null)}
            style={{ transition: 'all 0.2s' }}
          />
          <div 
            className="order-modal relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Beautiful Gradient Header */}
            <div 
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #DC2626 100%)',
                padding: '2rem 2rem 1.5rem 2rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative Pattern */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '200px',
                  height: '200px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)'
                }}
              />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      style={{
                        width: '3rem',
                        height: '3rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Package size={24} style={{ color: '#ffffff' }} />
                </div>
                    <div>
                      <h2 
                        style={{
                          fontSize: '1.875rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          margin: 0,
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {selectedOrder.orderNumber}
                      </h2>
                      <p 
                        style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '0.875rem',
                          margin: 0,
                          marginTop: '0.25rem'
                        }}
                      >
                        {format(new Date(selectedOrder.createdAt), 'MMMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div style={{ marginTop: '1rem' }}>
                    <span 
                      className={getStatusColorClassName(selectedOrder.status)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.875rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <X size={24} style={{ color: '#ffffff' }} />
                </button>
              </div>
              </div>
              
            {/* Scrollable Content */}
            <div 
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 180px)' }}
            >
              <div style={{ padding: '2rem' }}>
                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <div 
                        style={{
                          width: '0.25rem',
                          height: '1.25rem',
                          background: 'linear-gradient(135deg, #F97316, #EA580C)',
                          borderRadius: '0.125rem'
                        }}
                      />
                      Order Items
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.25rem',
                            background: 'linear-gradient(to right, #FFFFFF, #F9FAFB)',
                            borderRadius: '0.875rem',
                            border: '1px solid #E5E7EB',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#F97316';
                            e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(249, 115, 22, 0.2), 0 0 0 1px rgba(249, 115, 22, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.background = 'linear-gradient(to right, #FFFFFF, #FFF7ED)';
                            const accentLine = e.currentTarget.querySelector('[data-accent-line]') as HTMLElement;
                            if (accentLine) accentLine.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'linear-gradient(to right, #FFFFFF, #F9FAFB)';
                            const accentLine = e.currentTarget.querySelector('[data-accent-line]') as HTMLElement;
                            if (accentLine) accentLine.style.opacity = '0';
                          }}
                        >
                          {/* Decorative accent line */}
                          <div 
                            data-accent-line
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '4px',
                              background: 'linear-gradient(135deg, #F97316, #EA580C)',
                              borderRadius: '0.875rem 0 0 0.875rem',
                              opacity: 0,
                              transition: 'opacity 0.3s ease'
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0, marginLeft: '0.75rem' }}>
                            <p style={{ 
                              fontWeight: 700, 
                              color: '#111827', 
                              margin: 0, 
                              marginBottom: '0.375rem',
                              fontSize: '0.9375rem',
                              lineHeight: '1.4'
                            }}>
                              {item.menuItem.name}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ 
                                fontSize: '0.8125rem', 
                                color: '#6B7280',
                                background: '#F3F4F6',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '0.375rem',
                                fontWeight: 600
                              }}>
                                Qty: {item.quantity}
                              </span>
                              <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>×</span>
                              <span style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>
                                ₹{item.menuItem.price.toFixed(2)} each
                              </span>
                            </div>
                          </div>
                          <div style={{ 
                            fontWeight: 800, 
                            color: '#111827', 
                            fontSize: '1.125rem',
                            background: 'linear-gradient(135deg, #F97316, #EA580C)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginLeft: '1rem',
                            flexShrink: 0
                          }}>
                            ₹{item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Customer Information - Beautiful Card */}
                <div 
                  style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                    borderRadius: '1rem',
                    border: '1px solid #BAE6FD'
                  }}
                >
                  <h3 
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#0C4A6E',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div 
                      style={{
                        width: '0.25rem',
                        height: '1.25rem',
                        background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                        borderRadius: '0.125rem'
                      }}
                    />
                    Customer Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: '#ffffff',
                        borderRadius: '0.5rem',
                        border: '1px solid #E0F2FE'
                      }}
                    >
                      <div 
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Phone size={18} style={{ color: '#ffffff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, marginBottom: '0.125rem', fontWeight: 600 }}>
                          Phone
                        </p>
                        <a 
                          href={`tel:${formatPhoneForCall(selectedOrder.customer.phone)}`}
                          style={{
                            color: '#2563EB',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            WebkitTapHighlightColor: 'rgba(37, 99, 235, 0.3)',
                            cursor: 'pointer',
                            display: 'inline-block'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                      {selectedOrder.customer.phone}
                    </a>
                  </div>
                    </div>
                    
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: '#ffffff',
                        borderRadius: '0.5rem',
                        border: '1px solid #E0F2FE'
                      }}
                    >
                      <div 
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Mail size={18} style={{ color: '#ffffff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, marginBottom: '0.125rem', fontWeight: 600 }}>
                          Email
                        </p>
                        <a 
                          href={formatEmailForMailto(selectedOrder.customer.email, `Order ${selectedOrder.orderNumber} - Inquiry`)}
                          style={{
                            color: '#7C3AED',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            wordBreak: 'break-all',
                            WebkitTapHighlightColor: 'rgba(124, 58, 237, 0.3)',
                            cursor: 'pointer',
                            display: 'inline-block'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                      {selectedOrder.customer.email}
                    </a>
                  </div>
                    </div>
                    
                  {selectedOrder.deliveryAddress && (
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'start',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          background: '#ffffff',
                          borderRadius: '0.5rem',
                          border: '1px solid #E0F2FE'
                        }}
                      >
                        <div 
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '0.125rem'
                          }}
                        >
                          <MapPin size={18} style={{ color: '#ffffff' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, marginBottom: '0.125rem', fontWeight: 600 }}>
                            Delivery Address
                          </p>
                          <div style={{ color: '#1E293B', fontSize: '0.875rem', lineHeight: '1.5' }}>
                            <p style={{ margin: 0, fontWeight: 500 }}>{selectedOrder.deliveryAddress.street}</p>
                            {selectedOrder.deliveryAddress.apartment && (
                              <p style={{ margin: '0.25rem 0 0 0' }}>{selectedOrder.deliveryAddress.apartment}</p>
                            )}
                            <p style={{ margin: '0.25rem 0 0 0' }}>
                              {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
                            </p>
                          </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
                {/* Order Summary - Beautiful Card */}
                <div 
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                    borderRadius: '1rem',
                    border: '1px solid #FED7AA'
                  }}
                >
                  <h3 
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#9A3412',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div 
                      style={{
                        width: '0.25rem',
                        height: '1.25rem',
                        background: 'linear-gradient(135deg, #F97316, #EA580C)',
                        borderRadius: '0.125rem'
                      }}
                    />
                    Order Summary
                  </h3>
                  <div 
                    style={{
                      background: '#ffffff',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      border: '1px solid #FED7AA'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #FED7AA'
                      }}>
                        <span style={{ 
                          color: '#64748B', 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Subtotal
                        </span>
                        <span style={{ 
                          color: '#1E293B', 
                          fontSize: '0.9375rem', 
                          fontWeight: 700 
                        }}>
                          ₹{selectedOrder.pricing.subtotal.toFixed(2)}
                        </span>
                  </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #FED7AA'
                      }}>
                        <span style={{ 
                          color: '#64748B', 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Delivery Fee
                        </span>
                        <span style={{ 
                          color: selectedOrder.pricing.deliveryFee > 0 ? '#1E293B' : '#10B981', 
                          fontSize: '0.9375rem', 
                          fontWeight: 700 
                        }}>
                          {selectedOrder.pricing.deliveryFee === 0 ? 'FREE' : `₹${selectedOrder.pricing.deliveryFee.toFixed(2)}`}
                        </span>
                  </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #FED7AA'
                      }}>
                        <span style={{ 
                          color: '#64748B', 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Tax (5%)
                        </span>
                        <span style={{ 
                          color: '#1E293B', 
                          fontSize: '0.9375rem', 
                          fontWeight: 700 
                        }}>
                          ₹{selectedOrder.pricing.tax.toFixed(2)}
                        </span>
                  </div>
                      <div 
                        style={{
                          marginTop: '0.75rem',
                          paddingTop: '1.25rem',
                          paddingBottom: '0.5rem',
                          borderTop: '2px solid #FED7AA',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(234, 88, 12, 0.05))',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          marginLeft: '-1rem',
                          marginRight: '-1rem',
                          marginBottom: '-1rem'
                        }}
                      >
                        <span 
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#9A3412',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                          }}
                        >
                          Total Amount
                        </span>
                        <span 
                          style={{
                            fontSize: '1.75rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #F97316, #EA580C)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                            lineHeight: '1'
                          }}
                        >
                          ₹{selectedOrder.pricing.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
            total: orderToCancel.pricing.total,
            status: orderToCancel.status,
            paymentStatus: orderToCancel.paymentStatus,
            paymentMethod: orderToCancel.paymentMethod, // CRITICAL FIX: Pass payment method to check if refund applies
            customerName: orderToCancel.customer.name,
          }}
          cancelledBy="chef" // CRITICAL FIX: Use "chef" for kitchen operations, not "admin"
          onSuccess={() => {
            // Refresh orders list
            fetchOrders();
          }}
        />
      )}

      {/* COD Payment Confirmation Modal */}
      <CODPaymentConfirmModal
        isOpen={showCODConfirmModal}
        onClose={() => {
          setShowCODConfirmModal(false);
          setOrderForCODConfirm(null);
        }}
        onConfirm={handleCODPaymentConfirm}
        orderNumber={orderForCODConfirm?.orderNumber || ''}
        orderTotal={orderForCODConfirm?.pricing.total || 0}
        customerName={orderForCODConfirm?.customer.name || ''}
        paymentMethod={orderForCODConfirm?.paymentMethod || ''}
      />

      {/* Refund Receipt Modal */}
      {showRefundReceiptModal && selectedRefundReceipt && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowRefundReceiptModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '1rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '2px solid #F3F4F6',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              borderRadius: '1rem 1rem 0 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0 }}>
                    {selectedRefundReceipt.status === 'REFUNDED' ? 'Refund Receipt' : 'Cancellation Receipt'}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.25rem' }}>
                    Order #{selectedRefundReceipt.orderId}
                  </p>
                </div>
                <button
                  onClick={() => setShowRefundReceiptModal(false)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '9999px',
                  backgroundColor: selectedRefundReceipt.status === 'REFUNDED' ? '#D1FAE5' : '#FEE2E2',
                  color: selectedRefundReceipt.status === 'REFUNDED' ? '#065F46' : '#991B1B'
                }}>
                  {selectedRefundReceipt.status === 'REFUNDED' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {selectedRefundReceipt.status === 'REFUNDED' ? 'Refund Completed' : 'Cancelled (No Refund)'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Customer Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Name:</span>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{selectedRefundReceipt.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Phone:</span>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', fontFamily: 'monospace' }}>{selectedRefundReceipt.customerPhone}</span>
                  </div>
                  {selectedRefundReceipt.customerEmail && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Email:</span>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{selectedRefundReceipt.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Financial Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Original Order Total:</span>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>₹{selectedRefundReceipt.orderTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                    <span style={{ color: selectedRefundReceipt.refundAmount > 0 ? '#10B981' : '#6B7280', fontSize: '0.875rem', fontWeight: 600 }}>
                      {selectedRefundReceipt.status === 'REFUNDED' ? 'Refunded Amount:' : 'Refund Amount:'}
                    </span>
                    <span style={{ fontWeight: 700, color: selectedRefundReceipt.refundAmount > 0 ? '#10B981' : '#6B7280', fontSize: '1rem' }}>
                      {selectedRefundReceipt.refundAmount > 0 ? `₹${selectedRefundReceipt.refundAmount.toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>
                </div>
              </div>
              {selectedRefundReceipt.status === 'REFUNDED' && (
                <div style={{ padding: '1rem', background: '#EFF6FF', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #BFDBFE' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Transaction Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedRefundReceipt.transactionId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.875rem' }}>Transaction ID:</span>
                        <span style={{ fontWeight: 600, color: '#1E3A8A', fontSize: '0.75rem', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all', maxWidth: '60%' }}>
                          {selectedRefundReceipt.transactionId}
                        </span>
                      </div>
                    )}
                    {selectedRefundReceipt.paymentGateway && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.875rem' }}>Payment Gateway:</span>
                        <span style={{ fontWeight: 600, color: '#1E3A8A', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                          {selectedRefundReceipt.paymentGateway}
                        </span>
                      </div>
                    )}
                    {selectedRefundReceipt.paymentId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.875rem' }}>Payment ID:</span>
                        <span style={{ fontWeight: 600, color: '#1E3A8A', fontSize: '0.75rem', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all', maxWidth: '60%' }}>
                          {selectedRefundReceipt.paymentId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Timeline
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '0.25rem', flexShrink: 0 }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Order Placed</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                        {selectedRefundReceipt.orderDate ? format(new Date(selectedRefundReceipt.orderDate), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginTop: '0.25rem', flexShrink: 0 }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Order Cancelled</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                        {selectedRefundReceipt.cancelledDate ? format(new Date(selectedRefundReceipt.cancelledDate), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {selectedRefundReceipt.refundDate && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', marginTop: '0.25rem', flexShrink: 0 }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Refund Processed</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                          {format(new Date(selectedRefundReceipt.refundDate), 'MMM dd, yyyy • hh:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: '0.75rem', border: '1px solid #FEF3C7' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <AlertCircle size={16} style={{ color: '#D97706', marginTop: '0.125rem', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#92400E', margin: 0, lineHeight: '1.5' }}>
                      {selectedRefundReceipt.status === 'REFUNDED' 
                        ? 'The refund has been processed and the amount has been credited back to the original payment method. Please allow 5-7 business days for the refund to reflect in your account.'
                        : 'This order was cancelled but no refund was processed. This may be because the order was cancelled before payment was completed or payment was made via cash on delivery.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '2px solid #F3F4F6', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print Receipt
              </button>
              <button
                onClick={() => setShowRefundReceiptModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <FinanceTab
            financeData={{
              todayRevenue: stats.todayRevenue,
              pendingCollection: financialData?.totalPending || 0,
              availableNow: financialData?.availableNow || 0,
              inTransit: financialData?.inTransit || 0,
              todayOrders: stats.todayOrders,
              averageOrderValue: stats.todayOrders > 0
                ? stats.todayRevenue / stats.todayOrders
                : 0,
            }}
            onSetupPayments={() => setShowBankSetupGuide(true)}
            onRefresh={() => {
              fetchFinancialData();
              fetchOrders();
            }}
          />
        )}
    </div>
  );
};

export default AdminDashboard;

