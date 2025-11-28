/**
 * PWA SERVICE WORKER - Offline-First Mobile Experience
 * 
 * Purpose: Transform website into installable app with offline capabilities
 * 
 * Features:
 * - Cache-first strategy for assets (instant load)
 * - Network-first for API calls (fresh data)
 * - Offline page fallback
 * - Background sync for failed orders
 * - Push notification handling
 * - Auto-update on new version
 * 
 * THIS COMPETES WITH NATIVE APPS - 80% OF MARKET ON MOBILE
 */

const CACHE_VERSION = 'gharse-v1.0.8';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  // Add critical CSS/JS here if using SSR
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        // Force activation immediately (don't wait for all tabs to close)
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old versions
              return cacheName.startsWith('gharse-') && cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== IMAGE_CACHE;
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated, claiming clients');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with smart caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Next.js dev assets - NEVER cache (causes HMR issues)
  if (url.pathname.startsWith('/_next/')) {
    return; // Let browser handle these normally
  }

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images - Cache first with network fallback
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache first
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|ico)$/)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: Network only (don't cache)
  event.respondWith(fetch(request));
});

/**
 * Cache-first strategy: Try cache first, fallback to network
 * Perfect for images and static assets
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the response for next time
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);
    // Return offline placeholder if available
    return caches.match('/offline');
  }
}

/**
 * Network-first strategy: Try network first, fallback to cache
 * Perfect for API calls (want fresh data)
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Both failed, return error response
    return new Response(
      JSON.stringify({ error: 'You are offline', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Network-first with offline page fallback
 * Perfect for HTML pages
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful HTML pages
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Show offline page
    return caches.match('/offline');
  }
}

// Background Sync - Retry failed orders when back online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync event:', event.tag);
  
  if (event.tag === 'sync-failed-orders') {
    event.waitUntil(syncFailedOrders());
  }
});

async function syncFailedOrders() {
  try {
    // Get failed orders from IndexedDB
    const db = await openDB('gharse-offline', 1);
    
    // Create transaction and get object store
    const transaction = db.transaction('failed-orders', 'readwrite');
    const store = transaction.objectStore('failed-orders');
    
    // Get all failed orders using proper IndexedDB API
    const getAllRequest = store.getAll();
    const failedOrders = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    console.log(`[Service Worker] Syncing ${failedOrders.length} failed orders`);
    
    // Retry each order
    for (const order of failedOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order.data),
        });
        
        if (response.ok) {
          // Success! Remove from failed orders using proper IndexedDB API
          const deleteTransaction = db.transaction('failed-orders', 'readwrite');
          const deleteStore = deleteTransaction.objectStore('failed-orders');
          const deleteRequest = deleteStore.delete(order.id);
          
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          
          console.log('[Service Worker] Successfully synced order:', order.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

// Push Notification - Handle incoming push messages
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: event.data.text() };
    }
  }
  
  const title = data.title || 'GharSe Notification';
  const options = {
    body: data.body || 'You have a new update',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    image: data.image,
    tag: data.tag || 'gharse-notification',
    data: data.url || '/',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200], // Vibration pattern
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click - Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  const url = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Message event - Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Helper: Open IndexedDB
async function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('failed-orders')) {
        db.createObjectStore('failed-orders', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

console.log('[Service Worker] Loaded successfully');

