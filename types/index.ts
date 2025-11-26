/**
 * NEW FILE: TypeScript Type Definitions
 * 
 * Purpose: Centralized type definitions for the entire application ensuring
 * type safety, code intelligence, and self-documenting interfaces.
 * 
 * Architecture: Domain-driven types that model real-world restaurant operations,
 * from menu items to order fulfillment.
 */

/**
 * MenuItem - Represents a dish available for order
 * 
 * Design: Comprehensive product model supporting dietary preferences,
 * pricing variations, and inventory management.
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For showing discounts
  category: MenuCategory;
  image: string;
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: 0 | 1 | 2 | 3; // 0 = mild, 3 = very spicy
  allergens?: string[];
  preparationTime: number; // in minutes
  isAvailable: boolean; // Whether item is on menu (not about stock)
  isPopular?: boolean;
  isNew?: boolean;
  calories?: number;
  servingSize?: string;
  ingredients?: string[];
  customizationOptions?: CustomizationOption[];
  // INVENTORY MANAGEMENT (NEW!)
  inventoryEnabled?: boolean; // Whether to track inventory
  inventory?: number | null; // Current stock count (null = unlimited)
  outOfStockMessage?: string | null; // Funny message when out of stock
  // IMAGE POSITIONING (NEW!)
  imagePosition?: {
    x: number;      // Horizontal position (-100 to 100)
    y: number;      // Vertical position (-100 to 100)
    scale: number;  // Zoom level (1 to 3)
  };
}

/**
 * MenuCategory - Classification system for menu organization
 * 
 * Strategy: Hierarchical categorization for intuitive browsing and
 * efficient filtering.
 */
export type MenuCategory =
  | 'Appetizers'
  | 'Main Course'
  | 'Rice & Breads'
  | 'Curries'
  | 'Tandoori'
  | 'Biryanis'
  | 'Desserts'
  | 'Beverages'
  | 'Specials'
  | 'Thali';

/**
 * CustomizationOption - Allows customers to personalize their orders
 * 
 * Use Case: Spice levels, portion sizes, add-ons (extra paneer, etc.)
 */
export interface CustomizationOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  options: {
    label: string;
    value: string;
    priceModifier?: number; // Additional cost
  }[];
  required: boolean;
}

/**
 * CartItem - Shopping cart line item with customizations
 * 
 * Design: Immutable item snapshot at time of cart addition, preserving
 * price and availability even if menu changes.
 */
export interface CartItem {
  id: string; // Unique cart item ID (not menu item ID)
  menuItem: MenuItem;
  quantity: number;
  customizations?: Record<string, string>;
  specialInstructions?: string;
  subtotal: number;
}

/**
 * Cart - Customer's current order basket
 * 
 * Purpose: Aggregates selected items, calculates totals, and manages
 * the pre-checkout state.
 */
export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  promoCode?: string;
}

/**
 * Order - Complete order record from submission through fulfillment
 * 
 * Architecture: State machine design supporting order lifecycle tracking,
 * from pending → confirmed → preparing → ready → delivered.
 */
export interface Order {
  id: string;
  orderNumber: string; // Human-readable order number (e.g., "BK-1001")
  customer: CustomerInfo;
  items: CartItem[];
  pricing: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount?: number;
    tip?: number;
    total: number;
    promoCode?: string;
  };
  status: OrderStatus;
  orderType: 'delivery' | 'pickup';
  
  // SCHEDULED DELIVERY (matches Prisma schema)
  scheduledTime?: Date; // Deprecated - use scheduledDeliveryAt
  scheduledDeliveryAt?: Date; // Customer's chosen delivery time
  scheduledWindowStart?: Date; // Start of delivery window (e.g., 2:00 PM)
  scheduledWindowEnd?: Date; // End of delivery window (e.g., 2:30 PM)
  minimumLeadTime?: number; // Minimum minutes ahead (2h 45min = 165 min)
  prepTime?: number; // Prep time in minutes (2 hours default)
  deliveryDuration?: number; // Delivery time in minutes (45 min default)
  
  estimatedReadyTime: Date;
  estimatedPrepTime?: number; // Legacy field - use prepTime
  actualReadyTime?: Date;
  deliveryTime?: Date;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryAddress?: Address;
  contactPreference: ContactMethod[];
  notifications: OrderNotification[];
  // Grace period tracking (NEW!)
  modificationCount?: number; // How many times order was modified
  gracePeriodExpiresAt?: Date; // When modification window closes
  lastModifiedAt?: Date; // Last modification timestamp
}

/**
 * OrderStatus - Order lifecycle states
 * 
 * Flow: pending → confirmed → preparing → ready → out-for-delivery → delivered
 * Alternative: pending → confirmed → preparing → ready → picked-up
 */
export type OrderStatus =
  | 'pending-confirmation' // Grace period - customer can still modify (0-8 min)
  | 'pending' // Initial state, awaiting admin confirmation (visible to kitchen)
  | 'confirmed' // Order accepted, payment verified
  | 'preparing' // Cooking in progress
  | 'ready' // Food prepared, awaiting pickup/delivery
  | 'out-for-delivery' // Husband is delivering
  | 'delivered' // Successfully delivered to customer
  | 'picked-up' // Customer collected order
  | 'cancelled' // Order cancelled by customer or restaurant
  | 'refunded'; // Payment returned to customer

/**
 * CustomerInfo - Customer contact and identification
 * 
 * Privacy: Minimal data collection, GDPR-compliant, with consent tracking.
 */
export interface CustomerInfo {
  id?: string; // For returning customers
  name: string;
  email: string;
  phone: string;
  isReturningCustomer?: boolean;
  preferences?: {
    dietaryRestrictions?: string[];
    favoriteItems?: string[];
  };
}

/**
 * Address - Delivery location details
 * 
 * Validation: Structured for accurate delivery, supporting geocoding integration.
 */
export interface Address {
  street: string;
  apartment?: string;
  city: string;
  district?: string;        // NEW: District for FSSAI compliance
  state: string;
  zipCode: string;
  country: string;
  deliveryInstructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * PaymentMethod - Supported payment types
 * 
 * Extensibility: Designed to easily add new payment providers (Stripe, Square, etc.)
 */
export type PaymentMethod =
  | 'cash-on-delivery'
  | 'card'
  | 'upi' // Indian payment system
  | 'paytm'
  | 'razorpay'
  | 'stripe'
  | 'google-pay'
  | 'phonepe'
  | 'form-b'
  | 'netbanking'
  | 'paypal'
  | 'apple-pay';

/**
 * PaymentStatus - Payment transaction states
 * Note: These match the Prisma PaymentStatus enum (uppercase)
 */
export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

/**
 * ContactMethod - How customer prefers to be contacted
 * 
 * Multi-channel: Allows redundant communication to ensure order updates reach customer.
 */
export type ContactMethod = 'email' | 'sms' | 'phone-call' | 'whatsapp';

/**
 * OrderNotification - Audit trail of customer communications
 * 
 * Purpose: Tracks all automated and manual notifications sent to customer,
 * ensuring transparency and debugging capability.
 */
export interface OrderNotification {
  id: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  status: 'sent' | 'delivered' | 'failed';
  subject?: string;
  message: string;
  sentAt: Date;
  deliveredAt?: Date;
}

/**
 * AdminStats - Dashboard analytics for business intelligence
 * 
 * Metrics: Real-time KPIs for operational decision-making.
 */
export interface AdminStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  popularItems: {
    item: MenuItem;
    orderCount: number;
  }[];
  revenueByCategory: {
    category: MenuCategory;
    revenue: number;
  }[];
  customerSatisfaction?: number; // Rating out of 5
}

/**
 * Restaurant - Business information and settings
 * 
 * Configuration: Centralized restaurant metadata for branding and operations.
 */
export interface Restaurant {
  name: string;
  legalName?: string;              // Legal entity name (e.g., "Bantu'S kitchen")
  proprietor?: string;              // Owner/proprietor name
  fssaiNumber?: string;             // FSSAI registration number
  fssaiValidUntil?: string;         // License expiry date
  fssaiCategory?: string;           // Business category (e.g., "Petty Retailer - Prepared Foods")
  tagline: string;
  description: string;
  logo: string;
  contact: {
    phone: string;
    email: string;
    whatsapp?: string;
  };
  address: Address;
  hours: {
    [key: string]: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  settings: {
    minimumOrder: number;
    deliveryRadius: number; // in kilometers
    deliveryFee: number;
    freeDeliveryOver: number;
    taxRate: number;
    preparationBuffer: number; // Extra minutes added to estimates
    acceptingOrders: boolean;
    maxAdvanceOrderDays: number;
  };
}

/**
 * Review - Customer feedback and ratings
 * 
 * Social Proof: Builds trust and provides actionable feedback for improvement.
 */
export interface Review {
  id: string;
  customer: {
    name: string;
    isVerified: boolean;
  };
  order: {
    id: string;
    orderNumber: string;
  };
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  images?: string[];
  itemsReviewed?: {
    menuItemId: string;
    rating: number;
    comment?: string;
  }[];
  createdAt: Date;
  response?: {
    message: string;
    respondedAt: Date;
  };
}

/**
 * PromoCode - Discount campaigns and marketing
 * 
 * Marketing: Flexible promotion system supporting various discount strategies.
 */
export interface PromoCode {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed-amount' | 'free-delivery';
  discountValue: number;
  minimumOrder?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: MenuCategory[];
}

