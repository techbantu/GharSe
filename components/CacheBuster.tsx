/**
 * CLIENT-SIDE CACHE BUSTER & AUTO-RECOVERY
 * 
 * Purpose: Automatically detect and fix stale cache issues without user intervention
 * 
 * Features:
 * - Detects when wrong API is being called (indicates stale cache)
 * - Auto-reloads page with cache bypass
 * - Version checking to force updates
 * - Service worker cleanup
 * - Automatic token validation and refresh
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BUILD_VERSION } from '@/lib/build-version';

// Version checking to force updates
const VERSION_KEY = 'app_version';
const RELOAD_ATTEMPT_KEY = 'cache_reload_attempt';
const MAX_RELOAD_ATTEMPTS = 2;

export function CacheBuster() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ALWAYS unregister service workers to prevent stale cache issues
    // This runs for ALL pages, not just admin
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('🧹 Unregistering service worker for fresh content');
          registration.unregister();
        });
      });
      
      // Also clear Cache API to ensure fresh bundles
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            console.log(`🧹 Clearing cache: ${name}`);
            caches.delete(name);
          });
        });
      }
    }
    
    // ONLY ENABLE AUTO-RELOAD FOR ADMIN PAGES
    // Regular users don't need aggressive cache management
    const isAdminPage = pathname?.startsWith('/admin');
    
    if (!isAdminPage) {
      // For regular pages, just update version silently without reloading
      const storedVersion = localStorage.getItem(VERSION_KEY);
      if (!storedVersion || storedVersion !== BUILD_VERSION) {
        localStorage.setItem(VERSION_KEY, BUILD_VERSION);
      }
      return; // Exit early - no auto-reload for regular users
    }

    // === ADMIN PAGES ONLY BELOW THIS LINE ===

    // Skip if already reloading
    if (sessionStorage.getItem('is_reloading') === 'true') {
      sessionStorage.removeItem('is_reloading');
      return;
    }

    // Skip if cache buster was disabled due to too many issues
    if (localStorage.getItem('cache_buster_disabled') === 'true') {
      console.log('ℹ️ Cache buster disabled due to previous issues');
      return;
    }

    // 1. Check if app version changed (ADMIN ONLY)
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion && storedVersion !== BUILD_VERSION) {
      // Check reload attempts to prevent infinite loop
      const attempts = parseInt(sessionStorage.getItem(RELOAD_ATTEMPT_KEY) || '0', 10);
      
      if (attempts < MAX_RELOAD_ATTEMPTS) {
        console.log(`🔄 Admin page updated (${storedVersion} → ${BUILD_VERSION}), clearing caches...`);
        sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(attempts + 1));
        sessionStorage.setItem('is_reloading', 'true');
        
        clearAllCaches();
        localStorage.setItem(VERSION_KEY, BUILD_VERSION);
        
        // Force hard reload
        window.location.reload();
        return;
      } else {
        // Too many attempts, disable cache buster and continue
        console.warn('⚠️ Too many reload attempts detected');
        console.log('🛡️ Disabling automatic cache management to prevent loops');
        console.log('ℹ️ Page will work normally, but may not auto-update');
        
        localStorage.setItem(VERSION_KEY, BUILD_VERSION);
        localStorage.setItem('cache_buster_disabled', 'true');
        sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
        
        // Show user-friendly notification (non-blocking)
        console.info('💡 Tip: If you see stale content, manually refresh with Cmd+Shift+R');
      }
    }
    
    // Set version if not set
    if (!storedVersion) {
      localStorage.setItem(VERSION_KEY, BUILD_VERSION);
    }

    // 2. Only detect stale cache on admin pages, and only ONCE
    if (!sessionStorage.getItem('cache_check_done')) {
      sessionStorage.setItem('cache_check_done', 'true');
      detectAndFixStaleCacheForAdmin();
    }

    // 3. Clear old reload attempt counter after successful load
    const clearAttemptTimer = setTimeout(() => {
      sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
    }, 5000);

    return () => clearTimeout(clearAttemptTimer);
  }, [pathname, router]);

  return null; // This is a utility component, renders nothing
}

/**
 * Detect stale cache for admin pages
 * DISABLED FOR NOW - Too aggressive, causing infinite loops
 */
function detectAndFixStaleCacheForAdmin() {
  // Temporarily disabled - the version check is enough
  console.log('🔍 Cache check: Admin page loaded successfully');
  
  /* DISABLED: Too aggressive
  const originalFetch = window.fetch;
  
  let wrongApiDetected = false;

  window.fetch = async function(...args) {
    const url = args[0] instanceof Request ? args[0].url : args[0];
    
    if (window.location.pathname.startsWith('/admin') && 
        typeof url === 'string' && 
        url.includes('/api/auth/me') && 
        !url.includes('/api/admin/')) {
      
      if (!wrongApiDetected) {
        wrongApiDetected = true;
        console.error('❌ STALE CACHE DETECTED: Admin page calling customer API!');
        console.log('🔄 Auto-fixing: Reloading with cache bypass...');
        
        const attempts = parseInt(sessionStorage.getItem(RELOAD_ATTEMPT_KEY) || '0', 10);
        
        if (attempts < MAX_RELOAD_ATTEMPTS) {
          sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(attempts + 1));
          clearAllCaches();
          window.location.reload();
        } else {
          console.error('❌ Too many reload attempts, showing error to user');
          alert('Unable to load page properly. Please:\n1. Close all browser tabs\n2. Clear browser cache\n3. Try again');
        }
      }
      
      return Promise.reject(new Error('Stale cache detected, reloading...'));
    }
    
    return originalFetch.apply(this, args);
  };
  */
}

/**
 * Clear all possible caches
 */
function clearAllCaches() {
  console.log('🧹 Clearing all caches...');
  
  // 1. Clear localStorage (except version)
  const version = localStorage.getItem(VERSION_KEY);
  localStorage.clear();
  if (version) localStorage.setItem(VERSION_KEY, version);
  
  // 2. Clear sessionStorage
  sessionStorage.clear();
  
  // 3. Clear cookies (admin token)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // 4. Clear Cache API if available
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  console.log('✅ All caches cleared');
}

/**
 * Hook for admin pages to validate token and auto-refresh if needed
 */
export function useAdminAuthWithRecovery() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      // No token, redirect to login (expected behavior)
      router.push('/admin/login');
      return;
    }

    // Validate token by calling the API
    const validateToken = async () => {
      try {
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token invalid, clear and redirect
          console.log('🔑 Token invalid, clearing and redirecting to login');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('❌ Token validation failed:', error);
        // Network error, don't redirect (might be temporary)
      }
    };

    validateToken();
  }, [router]);
}

export default CacheBuster;

