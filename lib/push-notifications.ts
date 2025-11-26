/**
 * PUSH NOTIFICATIONS - Web Push Setup
 * 
 * Purpose: Handle web push notifications for order updates
 * 
 * Features:
 * - VAPID key generation
 * - Subscription management
 * - Send push notifications
 * - Topic-based subscriptions
 */

// VAPID keys (generate your own for production)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Send subscription to server
      await saveSubscription(subscription);
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await deleteSubscription(subscription);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Get current subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
}

/**
 * Save subscription to server
 */
async function saveSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });
  } catch (error) {
    console.error('Failed to save subscription:', error);
  }
}

/**
 * Delete subscription from server
 */
async function deleteSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });
  } catch (error) {
    console.error('Failed to delete subscription:', error);
  }
}

/**
 * Show local notification (without server push)
 */
export async function showLocalNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<void> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  });
}

/**
 * Helper: Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
  orderConfirmed: (orderNumber: string) => ({
    title: '✅ Order Confirmed!',
    body: `Your order #${orderNumber} has been confirmed and is being prepared.`,
    tag: `order-${orderNumber}`,
    data: { type: 'order_confirmed', orderNumber },
  }),

  orderReady: (orderNumber: string) => ({
    title: '🍽️ Order Ready!',
    body: `Your order #${orderNumber} is ready for pickup/delivery.`,
    tag: `order-${orderNumber}`,
    data: { type: 'order_ready', orderNumber },
  }),

  orderOutForDelivery: (orderNumber: string, driverName: string) => ({
    title: '🚗 Out for Delivery!',
    body: `${driverName} is on the way with your order #${orderNumber}.`,
    tag: `order-${orderNumber}`,
    data: { type: 'out_for_delivery', orderNumber },
  }),

  orderDelivered: (orderNumber: string) => ({
    title: '🎉 Order Delivered!',
    body: `Your order #${orderNumber} has been delivered. Enjoy your meal!`,
    tag: `order-${orderNumber}`,
    data: { type: 'order_delivered', orderNumber },
  }),

  newOrderForChef: (orderNumber: string, total: number) => ({
    title: '🔔 New Order!',
    body: `Order #${orderNumber} - ₹${total}. Tap to view details.`,
    tag: `chef-order-${orderNumber}`,
    requireInteraction: true,
    data: { type: 'new_order', orderNumber },
  }),

  promotionalOffer: (title: string, message: string) => ({
    title: `🎁 ${title}`,
    body: message,
    tag: 'promo',
    data: { type: 'promotion' },
  }),
};

