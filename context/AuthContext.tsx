/**
 * AUTHENTICATION CONTEXT - CROSS-TAB SYNCHRONIZED
 * 
 * Purpose: Global authentication state management with genius-level cross-tab sync
 * 
 * Features:
 * - Login/logout state synced across ALL browser tabs instantly
 * - User profile data with real-time updates
 * - Token management (httpOnly cookies)
 * - BroadcastChannel API for instant cross-tab communication
 * - localStorage fallback for older browsers
 * - Window focus detection to refresh stale state
 * - Periodic auth validation to detect cookie expiration
 * - Exponential backoff retry for network failures
 * - Self-healing on network errors
 * 
 * Architecture: Production-grade React Context with cross-tab sync
 * Inspired by: Joe Armstrong's "let it crash" + Margaret Hamilton's fault-tolerance
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode?: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
}

interface AuthContextType {
  user: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  referredBy?: string;
}

/**
 * Auth events for cross-tab synchronization
 */
type AuthEvent = 
  | { type: 'login'; user: Customer }
  | { type: 'logout' }
  | { type: 'refresh' }
  | { type: 'user_updated'; user: Customer };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for cross-tab sync fallback
const AUTH_SYNC_KEY = 'bantu_auth_sync';
const AUTH_CHANNEL_NAME = 'bantu_auth_channel';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // Track if we've completed initial hydration (SSR fix)
  const [isHydrated, setIsHydrated] = useState(false);
  
  // BroadcastChannel for cross-tab communication (modern browsers)
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  
  // Track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  
  // Track last fetch time for debouncing
  const lastFetchTime = useRef(0);
  
  // Periodic auth check interval
  const authCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Check if current page is an admin page
   * Admin pages use separate authentication, so skip customer auth check
   */
  const isAdminPage = pathname?.startsWith('/admin') ?? false;

  /**
   * Fetch current authenticated user with retry logic
   * Uses exponential backoff for network failures
   * Skips on admin pages (admin uses separate auth system)
   */
  const fetchCurrentUser = useCallback(async (retryCount = 0): Promise<boolean> => {
    // Skip customer auth check on admin pages (admin uses separate auth)
    // Check both pathname hook and window.location for reliability
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const isOnAdminPage = currentPath?.startsWith('/admin') ?? false;
    
    console.log('[AuthContext] fetchCurrentUser check:', {
      pathname,
      windowPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
      currentPath,
      isOnAdminPage,
    });
    
    if (isOnAdminPage) {
      console.log('[AuthContext] Skipping customer auth check - on admin page');
      setIsLoading(false);
      return false; // No customer auth on admin pages
    }
    
    // Debounce: Don't fetch if we fetched less than 1 second ago
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) {
      return false;
    }
    
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current) {
      return false;
    }
    
    isFetchingRef.current = true;
    lastFetchTime.current = now;
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include httpOnly cookies
        cache: 'no-store', // Never cache auth state
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.customer) {
          setUser(data.customer);
          setIsLoading(false);
          return true;
        }
      }
      
      // No valid session - clear user
      setUser(null);
      setIsLoading(false);
      return false;
      
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      
      // Exponential backoff retry (max 3 attempts)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchCurrentUser(retryCount + 1);
      }
      
      // After all retries failed, assume logged out
      setUser(null);
      setIsLoading(false);
      return false;
      
    } finally {
      isFetchingRef.current = false;
    }
  }, [pathname]);
  
  /**
   * Broadcast auth event to other tabs
   * Uses BroadcastChannel (modern) + localStorage (fallback)
   */
  const broadcastAuthEvent = useCallback((event: AuthEvent) => {
    // Try BroadcastChannel first (modern browsers)
    if (broadcastChannel.current) {
      try {
        broadcastChannel.current.postMessage(event);
        logger.debug('Broadcasted auth event via BroadcastChannel', { type: event.type });
      } catch (error) {
        console.error('BroadcastChannel error:', error);
      }
    }
    
    // Fallback: localStorage for older browsers
    try {
      const payload = {
        event,
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(payload));
      // Remove immediately to trigger storage event in other tabs
      // (storage events only fire in OTHER tabs, not the current one)
      localStorage.removeItem(AUTH_SYNC_KEY);
      logger.debug('Broadcasted auth event via localStorage', { type: event.type });
    } catch (error) {
      console.error('localStorage sync error:', error);
    }
  }, []);
  
  /**
   * Handle auth events from other tabs
   */
  const handleAuthEvent = useCallback((event: AuthEvent) => {
    logger.debug('Received auth event from another tab', { type: event.type });
    
    switch (event.type) {
      case 'login':
      case 'user_updated':
        // Another tab logged in or updated user - sync immediately
        setUser(event.user);
        setIsLoading(false);
        break;
        
      case 'logout':
        // Another tab logged out - clear local state
        setUser(null);
        setIsLoading(false);
        break;
        
      case 'refresh':
        // Another tab requested refresh - fetch current user
        fetchCurrentUser();
        break;
    }
  }, [fetchCurrentUser]);
  
  /**
   * Mark as hydrated on client-side mount (SSR fix)
   */
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  /**
   * Initialize cross-tab sync on mount
   */
  useEffect(() => {
    // Wait for hydration before fetching (prevents SSR/CSR mismatch)
    if (!isHydrated) return;
    
    // Skip customer auth check on admin pages (admin uses separate auth)
    // Check both pathname hook and window.location for reliability
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (currentPath.startsWith('/admin')) {
      setIsLoading(false);
      return;
    }
    
    // 1. Fetch initial user state
    fetchCurrentUser();
    
    // 2. Setup BroadcastChannel for modern browsers
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        broadcastChannel.current = channel;
        
        channel.onmessage = (event) => {
          handleAuthEvent(event.data as AuthEvent);
        };
        
        logger.info('BroadcastChannel initialized for cross-tab auth sync');
      } catch (error) {
        console.error('Failed to initialize BroadcastChannel:', error);
      }
    }
    
    // 3. Setup localStorage event listener (fallback for older browsers)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === AUTH_SYNC_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleAuthEvent(data.event as AuthEvent);
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // 4. Setup window focus handler to refresh auth when switching tabs
    // Only refresh if we're not currently loading (prevents race conditions on page refresh)
    const handleWindowFocus = () => {
      // Skip on admin pages (admin uses separate auth)
      const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
      if (currentPath.startsWith('/admin')) {
        return;
      }
      // Don't refresh if we're already loading or if we just mounted (prevents double-fetch on refresh)
      if (isLoading || isFetchingRef.current) {
        logger.debug('Skipping focus refresh - already loading');
        return;
      }
      // Refresh auth state when tab regains focus (catches cookie expiration)
      logger.debug('Tab gained focus - refreshing auth state');
      fetchCurrentUser();
    };
    
    // Add a small delay before attaching focus handler to prevent immediate trigger on page load
    const focusHandlerTimeout = setTimeout(() => {
      window.addEventListener('focus', handleWindowFocus);
    }, 1000); // Wait 1 second after mount before enabling focus refresh
    
    // 5. Setup periodic auth validation (every 5 minutes)
    // Skip on admin pages (admin uses separate auth)
    authCheckInterval.current = setInterval(() => {
      const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
      if (currentPath.startsWith('/admin')) {
        return; // Skip periodic check on admin pages
      }
      logger.debug('Periodic auth check');
      fetchCurrentUser();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Cleanup on unmount
    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
      }
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('focus', handleWindowFocus);
      if (authCheckInterval.current) {
        clearInterval(authCheckInterval.current);
      }
      clearTimeout(focusHandlerTimeout);
    };
  }, [isHydrated, fetchCurrentUser, handleAuthEvent, isLoading, pathname]);
  
  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.customer);
        
        // Broadcast login event to other tabs
        broadcastAuthEvent({
          type: 'login',
          user: data.customer,
        });
        
        logger.info('User logged in successfully', { userId: data.customer.id });
        
        return { success: true };
      }
      
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  };
  
  /**
   * Register new account
   */
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setUser(result.customer);
        
        // Broadcast login event to other tabs (registration auto-logs in)
        broadcastAuthEvent({
          type: 'login',
          user: result.customer,
        });
        
        logger.info('User registered successfully', { userId: result.customer.id });
        
        return { success: true };
      }
      
      return {
        success: false,
        error: result.error || 'Registration failed',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  };
  
  /**
   * Logout
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      
      // Broadcast logout event to other tabs
      broadcastAuthEvent({ type: 'logout' });
      
      logger.info('User logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      
      // Still broadcast logout event
      broadcastAuthEvent({ type: 'logout' });
    }
  };
  
  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    await fetchCurrentUser();
  };
  
  const value: AuthContextType = {
    user,
    isLoading: isLoading || !isHydrated, // Keep loading until hydration completes
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
