/**
 * NEW FILE: Multi-Tab Authentication Sync (BroadcastChannel)
 * Purpose: Sync login/logout events across all browser tabs in real-time
 * Pattern: Steve Jobs UX - "It Just Works" across all tabs
 * 
 * Features:
 * - Login in Tab A instantly reflects in Tab B
 * - Logout in any tab logs out all tabs
 * - Token refresh propagates to all tabs
 * - Session expiry handled uniformly
 * - No polling needed (event-driven)
 * 
 * Technical: Uses BroadcastChannel API (modern browsers) with localStorage fallback
 */

export type AuthEventType = 'login' | 'logout' | 'token_refresh' | 'session_expired';

export interface AuthBroadcastMessage {
  type: AuthEventType;
  timestamp: number;
  userId?: string;
  token?: string; // Only for server-side sync, not localStorage
  metadata?: Record<string, any>;
}

/**
 * BroadcastChannel for auth events
 * Creates a communication channel across tabs in same origin
 */
let authChannel: BroadcastChannel | null = null;
let eventListeners: Map<AuthEventType, Set<(message: AuthBroadcastMessage) => void>> = new Map();
let storageListener: ((e: StorageEvent) => void) | null = null;

/**
 * Initialize auth broadcast system
 * Call this once in your app root (e.g., _app.tsx or layout.tsx)
 */
export function initAuthBroadcast(): void {
  // Check if already initialized
  if (authChannel) {
    console.log('[Auth Broadcast] Already initialized');
    return;
  }

  // Check if BroadcastChannel is supported
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      authChannel = new BroadcastChannel('auth-sync');
      
      authChannel.onmessage = (event) => {
        const message = event.data as AuthBroadcastMessage;
        console.log('[Auth Broadcast] Received event:', message.type);
        
        // Call registered listeners
        const listeners = eventListeners.get(message.type);
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener(message);
            } catch (error) {
              console.error('[Auth Broadcast] Listener error:', error);
            }
          });
        }
      };
      
      console.log('[Auth Broadcast] Initialized with BroadcastChannel');
    } catch (error) {
      console.error('[Auth Broadcast] BroadcastChannel failed:', error);
      setupStorageFallback();
    }
  } else {
    console.warn('[Auth Broadcast] BroadcastChannel not supported, using localStorage fallback');
    setupStorageFallback();
  }
}

/**
 * Fallback to localStorage events for older browsers
 * Less efficient but still works
 */
function setupStorageFallback(): void {
  if (storageListener) return; // Already set up
  
  storageListener = (e: StorageEvent) => {
    // Only handle auth-related storage events
    if (e.key === 'auth-broadcast-event' && e.newValue) {
      try {
        const message = JSON.parse(e.newValue) as AuthBroadcastMessage;
        
        // Call registered listeners
        const listeners = eventListeners.get(message.type);
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener(message);
            } catch (error) {
              console.error('[Auth Broadcast] Listener error:', error);
            }
          });
        }
      } catch (error) {
        console.error('[Auth Broadcast] Failed to parse storage event:', error);
      }
    }
  };
  
  window.addEventListener('storage', storageListener);
  console.log('[Auth Broadcast] Initialized with localStorage fallback');
}

/**
 * Broadcast an auth event to all tabs
 * 
 * Usage:
 * ```typescript
 * import { broadcastAuthEvent } from '@/lib/auth-broadcast';
 * 
 * // After successful login
 * broadcastAuthEvent('login', { userId: user.id });
 * 
 * // On logout
 * broadcastAuthEvent('logout');
 * ```
 */
export function broadcastAuthEvent(
  type: AuthEventType,
  metadata?: Record<string, any>
): void {
  const message: AuthBroadcastMessage = {
    type,
    timestamp: Date.now(),
    metadata,
  };
  
  if (authChannel) {
    // Use BroadcastChannel
    authChannel.postMessage(message);
    console.log('[Auth Broadcast] Sent via BroadcastChannel:', type);
  } else {
    // Use localStorage fallback
    localStorage.setItem('auth-broadcast-event', JSON.stringify(message));
    // Clear after a short delay to allow other tabs to pick it up
    setTimeout(() => {
      localStorage.removeItem('auth-broadcast-event');
    }, 100);
    console.log('[Auth Broadcast] Sent via localStorage:', type);
  }
}

/**
 * Listen for specific auth event types
 * 
 * Usage:
 * ```typescript
 * import { onAuthEvent } from '@/lib/auth-broadcast';
 * 
 * // Listen for logout events
 * const unsubscribe = onAuthEvent('logout', (message) => {
 *   console.log('User logged out in another tab');
 *   window.location.reload(); // Reload to clear state
 * });
 * 
 * // Cleanup when component unmounts
 * return () => unsubscribe();
 * ```
 */
export function onAuthEvent(
  type: AuthEventType,
  listener: (message: AuthBroadcastMessage) => void
): () => void {
  // Ensure broadcast system is initialized
  if (!authChannel && !storageListener) {
    initAuthBroadcast();
  }
  
  // Add listener to set
  if (!eventListeners.has(type)) {
    eventListeners.set(type, new Set());
  }
  eventListeners.get(type)!.add(listener);
  
  console.log(`[Auth Broadcast] Registered listener for '${type}'`);
  
  // Return unsubscribe function
  return () => {
    eventListeners.get(type)?.delete(listener);
    console.log(`[Auth Broadcast] Unregistered listener for '${type}'`);
  };
}

/**
 * Cleanup auth broadcast system
 * Call this when unmounting app root (rare)
 */
export function cleanupAuthBroadcast(): void {
  if (authChannel) {
    authChannel.close();
    authChannel = null;
  }
  
  if (storageListener) {
    window.removeEventListener('storage', storageListener);
    storageListener = null;
  }
  
  eventListeners.clear();
  console.log('[Auth Broadcast] Cleaned up');
}

/**
 * Convenience functions for common auth actions
 */

/**
 * Broadcast login event
 */
export function broadcastLogin(userId: string, metadata?: Record<string, any>): void {
  broadcastAuthEvent('login', { userId, ...metadata });
}

/**
 * Broadcast logout event
 */
export function broadcastLogout(metadata?: Record<string, any>): void {
  broadcastAuthEvent('logout', metadata);
}

/**
 * Broadcast token refresh event
 */
export function broadcastTokenRefresh(token?: string, metadata?: Record<string, any>): void {
  broadcastAuthEvent('token_refresh', { token, ...metadata });
}

/**
 * Broadcast session expired event
 */
export function broadcastSessionExpired(metadata?: Record<string, any>): void {
  broadcastAuthEvent('session_expired', metadata);
}

/**
 * React hook for listening to auth events
 * 
 * Usage:
 * ```tsx
 * import { useAuthBroadcast } from '@/lib/auth-broadcast';
 * 
 * function MyComponent() {
 *   useAuthBroadcast('logout', () => {
 *     console.log('User logged out in another tab');
 *     router.push('/login');
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAuthBroadcast(
  type: AuthEventType,
  handler: (message: AuthBroadcastMessage) => void
): void {
  if (typeof window === 'undefined') return; // SSR guard
  
  // Use useEffect pattern (must be called from React component)
  const { useEffect } = require('react');
  
  useEffect(() => {
    const unsubscribe = onAuthEvent(type, handler);
    return unsubscribe;
  }, [type, handler]);
}

/**
 * Get broadcast channel stats (for debugging)
 */
export function getAuthBroadcastStats(): {
  channelType: 'BroadcastChannel' | 'localStorage' | 'uninitialized';
  listeners: Record<AuthEventType, number>;
  isInitialized: boolean;
} {
  const listeners: Record<string, number> = {};
  
  for (const [type, listenerSet] of eventListeners.entries()) {
    listeners[type] = listenerSet.size;
  }
  
  return {
    channelType: authChannel ? 'BroadcastChannel' : storageListener ? 'localStorage' : 'uninitialized',
    listeners: listeners as Record<AuthEventType, number>,
    isInitialized: !!(authChannel || storageListener),
  };
}

