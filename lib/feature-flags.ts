/**
 * FEATURE FLAG SYSTEM
 * 
 * Purpose: Control feature rollout with environment variables
 * 
 * Architecture:
 * - Single source of truth for feature toggles
 * - Environment-based configuration
 * - Type-safe flag access
 * - Easy to enable/disable features without code changes
 * 
 * Usage:
 * ```typescript
 * import { isMultiChefMode, canRegisterChef, FEATURE_FLAGS } from '@/lib/feature-flags';
 * 
 * if (isMultiChefMode()) {
 *   // Show multi-chef UI
 * }
 * ```
 */

// Helper to check both NEXT_PUBLIC_ and regular env vars (client & server compatible)
const getEnvFlag = (key: string): boolean => {
  // For client-side, NEXT_PUBLIC_ prefixed vars are inlined at build time
  // For server-side, both work
  const publicKey = `NEXT_PUBLIC_${key}`;
  
  // Check NEXT_PUBLIC_ version first (works on client)
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore - Dynamic env access
    const publicValue = process.env[publicKey];
    if (publicValue !== undefined) {
      return publicValue === 'true';
    }
    // Fall back to regular env var (server-side only)
    // @ts-ignore - Dynamic env access
    const regularValue = process.env[key];
    return regularValue === 'true';
  }
  return false;
};

// Feature flag definitions
export const FEATURE_FLAGS = {
  // === MULTI-CHEF PLATFORM ===
  
  /**
   * Enable multi-chef mode
   * When disabled: Only default Bantu's Kitchen chef is active
   * When enabled: Platform supports multiple independent chefs
   */
  MULTI_CHEF_ENABLED: getEnvFlag('MULTI_CHEF_ENABLED') || process.env.NEXT_PUBLIC_MULTI_CHEF_ENABLED === 'true' || process.env.MULTI_CHEF_ENABLED === 'true',
  
  /**
   * Allow new chefs to register
   * When disabled: Only existing chefs can operate
   * When enabled: New chefs can submit registration applications
   */
  CHEF_REGISTRATION: getEnvFlag('ALLOW_CHEF_REGISTRATION') || process.env.NEXT_PUBLIC_ALLOW_CHEF_REGISTRATION === 'true' || process.env.ALLOW_CHEF_REGISTRATION === 'true',
  
  /**
   * Show chef discovery page to customers
   * When disabled: Only default restaurant menu is shown
   * When enabled: Customers can browse and order from multiple chefs
   */
  CHEF_DISCOVERY: getEnvFlag('SHOW_CHEF_DISCOVERY') || process.env.NEXT_PUBLIC_SHOW_CHEF_DISCOVERY === 'true' || process.env.SHOW_CHEF_DISCOVERY === 'true',
  
  /**
   * Allow items from multiple chefs in single cart
   * When disabled: Cart can only contain items from one chef
   * When enabled: Cart can mix items from different chefs (separate delivery fees)
   */
  MULTI_CHEF_CART: getEnvFlag('MULTI_CHEF_CART') || process.env.NEXT_PUBLIC_MULTI_CHEF_CART === 'true' || process.env.MULTI_CHEF_CART === 'true',
  
  /**
   * Enable chef analytics dashboard
   * When disabled: Chefs see basic stats only
   * When enabled: Full analytics with charts and trends
   */
  CHEF_ANALYTICS: process.env.CHEF_ANALYTICS !== 'false', // Default enabled
  
  /**
   * Enable automated payouts
   * When disabled: Manual payout processing only
   * When enabled: Automated payout generation and processing
   */
  AUTOMATED_PAYOUTS: process.env.AUTOMATED_PAYOUTS === 'true',
  
  // === CUSTOMER FEATURES ===
  
  /**
   * Enable advanced search with filters
   * When disabled: Basic search only
   * When enabled: Full-featured search with cuisine, price, rating filters
   */
  ADVANCED_SEARCH: process.env.ADVANCED_SEARCH !== 'false', // Default enabled
  
  /**
   * Enable customer reviews and ratings
   * When disabled: No review functionality
   * When enabled: Customers can rate orders and write reviews
   */
  REVIEWS_ENABLED: process.env.REVIEWS_ENABLED === 'true',
  
  /**
   * Enable loyalty program
   * When disabled: No loyalty points
   * When enabled: Earn and redeem points
   */
  LOYALTY_PROGRAM: process.env.LOYALTY_PROGRAM === 'true',
  
  /**
   * Enable referral system
   * When disabled: No referral functionality
   * When enabled: Customers can refer friends for rewards
   */
  REFERRAL_SYSTEM: process.env.REFERRAL_SYSTEM === 'true',
  
  // === PAYMENT FEATURES ===
  
  /**
   * Enable Razorpay (primary for India)
   * When disabled: Razorpay not available
   * When enabled: UPI, cards, net banking, wallets via Razorpay
   */
  RAZORPAY_ENABLED: !!(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ),
  
  /**
   * Enable Stripe (international)
   * When disabled: Stripe not available
   * When enabled: Card payments via Stripe
   */
  STRIPE_ENABLED: !!process.env.STRIPE_SECRET_KEY,
  
  /**
   * Enable cash on delivery
   * When disabled: Online payment only
   * When enabled: COD option available
   */
  COD_ENABLED: process.env.COD_ENABLED !== 'false', // Default enabled
  
  // === NOTIFICATION FEATURES ===
  
  /**
   * Enable email notifications
   * When disabled: No email notifications
   * When enabled: Order confirmations and updates via email
   */
  EMAIL_NOTIFICATIONS: !!(
    process.env.SMTP_USER ||
    process.env.SENDGRID_API_KEY ||
    process.env.RESEND_API_KEY
  ),
  
  /**
   * Enable SMS notifications
   * When disabled: No SMS notifications
   * When enabled: Order updates via SMS (high-value orders)
   */
  SMS_NOTIFICATIONS: !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ENABLED !== 'false'
  ),
  
  /**
   * Enable WhatsApp notifications
   * When disabled: No WhatsApp notifications
   * When enabled: Order updates via WhatsApp
   */
  WHATSAPP_NOTIFICATIONS: process.env.WHATSAPP_NOTIFICATIONS === 'true',
  
  // === STORAGE & CDN ===
  
  /**
   * Enable Cloudinary image uploads
   * When disabled: Local file storage
   * When enabled: Cloudinary CDN with optimization
   */
  CLOUDINARY_ENABLED: !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ),
  
  // === PERFORMANCE & CACHING ===
  
  /**
   * Enable Redis caching
   * When disabled: No caching (slower responses)
   * When enabled: Fast responses with Redis cache
   */
  REDIS_ENABLED: !!process.env.REDIS_URL,
  
  /**
   * Enable rate limiting
   * When disabled: No rate limits (vulnerable to abuse)
   * When enabled: API rate limiting per IP
   */
  RATE_LIMITING: process.env.RATE_LIMITING !== 'false', // Default enabled
  
  // === ADMIN FEATURES ===
  
  /**
   * Enable admin dashboard
   * When disabled: No admin access
   * When enabled: Full admin dashboard
   */
  ADMIN_DASHBOARD: process.env.ADMIN_DASHBOARD !== 'false', // Default enabled
  
  /**
   * Enable kitchen display system
   * When disabled: Basic order list
   * When enabled: Optimized kitchen view with auto-refresh
   */
  KITCHEN_DISPLAY: process.env.KITCHEN_DISPLAY !== 'false', // Default enabled
  
  // === EXPERIMENTAL FEATURES ===
  
  /**
   * Enable AI chat assistant
   * When disabled: No chat functionality
   * When enabled: AI-powered customer support
   */
  AI_CHAT: !!process.env.OPENAI_API_KEY,
  
  /**
   * Enable real-time order tracking
   * When disabled: Basic status updates
   * When enabled: Live order tracking with WebSocket
   */
  REALTIME_TRACKING: process.env.REALTIME_TRACKING !== 'false', // Default enabled
  
  /**
   * Enable A/B testing framework
   * When disabled: No A/B testing
   * When enabled: Run experiments for optimization
   */
  AB_TESTING: process.env.AB_TESTING === 'true',
} as const;

// === HELPER FUNCTIONS ===

/**
 * Check if multi-chef mode is enabled
 */
export const isMultiChefMode = (): boolean => {
  return FEATURE_FLAGS.MULTI_CHEF_ENABLED;
};

/**
 * Check if chef registration is allowed
 */
export const canRegisterChef = (): boolean => {
  return FEATURE_FLAGS.CHEF_REGISTRATION && FEATURE_FLAGS.MULTI_CHEF_ENABLED;
};

/**
 * Check if chef discovery page should be shown
 */
export const showChefDiscovery = (): boolean => {
  return FEATURE_FLAGS.CHEF_DISCOVERY && FEATURE_FLAGS.MULTI_CHEF_ENABLED;
};

/**
 * Check if multi-chef cart is allowed
 */
export const allowMultiChefCart = (): boolean => {
  return FEATURE_FLAGS.MULTI_CHEF_CART && FEATURE_FLAGS.MULTI_CHEF_ENABLED;
};

/**
 * Check if any payment gateway is enabled
 */
export const hasPaymentGateway = (): boolean => {
  return FEATURE_FLAGS.RAZORPAY_ENABLED || FEATURE_FLAGS.STRIPE_ENABLED;
};

/**
 * Check if online payments are available
 */
export const acceptsOnlinePayments = (): boolean => {
  return hasPaymentGateway();
};

/**
 * Check if any notification method is enabled
 */
export const hasNotifications = (): boolean => {
  return (
    FEATURE_FLAGS.EMAIL_NOTIFICATIONS ||
    FEATURE_FLAGS.SMS_NOTIFICATIONS ||
    FEATURE_FLAGS.WHATSAPP_NOTIFICATIONS
  );
};

/**
 * Get available payment methods
 */
export const getAvailablePaymentMethods = (): string[] => {
  const methods: string[] = [];
  
  if (FEATURE_FLAGS.COD_ENABLED) {
    methods.push('cash-on-delivery');
  }
  
  if (FEATURE_FLAGS.RAZORPAY_ENABLED) {
    methods.push('razorpay');
  }
  
  if (FEATURE_FLAGS.STRIPE_ENABLED) {
    methods.push('stripe');
  }
  
  return methods;
};

/**
 * Get enabled notification channels
 */
export const getNotificationChannels = (): string[] => {
  const channels: string[] = [];
  
  if (FEATURE_FLAGS.EMAIL_NOTIFICATIONS) {
    channels.push('email');
  }
  
  if (FEATURE_FLAGS.SMS_NOTIFICATIONS) {
    channels.push('sms');
  }
  
  if (FEATURE_FLAGS.WHATSAPP_NOTIFICATIONS) {
    channels.push('whatsapp');
  }
  
  return channels;
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (featureName: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[featureName] === true;
};

/**
 * Get all enabled features (for debugging/admin)
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature]) => feature);
};

/**
 * Get feature flag status summary (for admin dashboard)
 */
export const getFeatureFlagSummary = () => {
  const enabled = getEnabledFeatures();
  const total = Object.keys(FEATURE_FLAGS).length;
  
  return {
    enabled: enabled.length,
    total,
    percentage: Math.round((enabled.length / total) * 100),
    features: FEATURE_FLAGS,
    enabledList: enabled,
  };
};

export default FEATURE_FLAGS;

