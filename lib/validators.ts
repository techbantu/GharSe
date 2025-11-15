/**
 * Zod Validation Schemas - Type-Safe Database Layer
 * 
 * Purpose: Validate all inputs/outputs to eliminate runtime type errors.
 * Every database interaction goes through these schemas.
 * 
 * Pattern: Zod infers TypeScript types from runtime validators,
 * ensuring type safety without duplication.
 */

import { z } from 'zod';

// ===== ORDER SCHEMAS =====

export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
]);

export const OrderItemSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string().cuid(),
  menuItemId: z.string().cuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  specialInstructions: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string().cuid(),
  orderNumber: z.string().min(1),
  chefId: z.string().cuid().optional().nullable(),
  parentOrderId: z.string().cuid().optional().nullable(),
  
  // Customer
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  
  // Delivery
  deliveryAddress: z.string(),
  deliveryCity: z.string(),
  deliveryZip: z.string(),
  deliveryNotes: z.string().optional(),
  
  // Pricing
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  
  // Status
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  paymentMethod: z.string().optional().nullable(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  confirmedAt: z.date().optional().nullable(),
  preparingAt: z.date().optional().nullable(),
  readyAt: z.date().optional().nullable(),
  deliveredAt: z.date().optional().nullable(),
  cancelledAt: z.date().optional().nullable(),
  
  // Estimated times
  estimatedPrepTime: z.number().int().positive().default(30),
  estimatedDelivery: z.date().optional().nullable(),
});

export const CreateOrderInputSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  
  deliveryAddress: z.string().min(5),
  deliveryCity: z.string().min(1),
  deliveryZip: z.string().min(3),
  deliveryNotes: z.string().optional(),
  
  items: z.array(z.object({
    menuItemId: z.string().cuid(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
    specialInstructions: z.string().optional(),
  })).min(1, 'Order must have at least one item'),
  
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  
  paymentMethod: z.string().optional(),
  
  chefId: z.string().cuid().optional(),
  
  // Idempotency
  idempotencyKey: z.string().min(16).max(255).optional(),
});

// ===== MENU ITEM SCHEMAS =====

export const MenuItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional().nullable(),
  category: z.string(),
  image: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  
  // Dietary
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  spicyLevel: z.number().int().min(0).max(5).default(0),
  
  // Operational
  preparationTime: z.number().int().positive().default(30),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  
  // Inventory
  inventoryEnabled: z.boolean().default(false),
  inventory: z.number().int().nonnegative().optional().nullable(),
  outOfStockMessage: z.string().optional().nullable(),
  
  // Chef
  chefId: z.string().cuid().optional().nullable(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMenuItemInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(1000),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  category: z.string().min(1),
  image: z.string().url().optional(),
  
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  spicyLevel: z.number().int().min(0).max(5).optional(),
  preparationTime: z.number().int().positive().optional(),
  
  inventoryEnabled: z.boolean().optional(),
  inventory: z.number().int().nonnegative().optional(),
  
  chefId: z.string().cuid().optional(),
});

export const UpdateMenuItemInputSchema = CreateMenuItemInputSchema.partial();

// ===== PAYMENT SCHEMAS =====

export const PaymentSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string().cuid(),
  
  paymentGateway: z.string(),
  paymentIntentId: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  gatewayResponse: z.string().optional().nullable(),
  
  amount: z.number().nonnegative(),
  currency: z.string().default('INR'),
  gatewayFee: z.number().nonnegative().default(0),
  netAmount: z.number().nonnegative(),
  
  status: PaymentStatusSchema,
  failureReason: z.string().optional().nullable(),
  
  payoutId: z.string().optional().nullable(),
  payoutStatus: z.string().optional().nullable(),
  payoutDate: z.date().optional().nullable(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
  paidAt: z.date().optional().nullable(),
  refundedAt: z.date().optional().nullable(),
});

export const CreatePaymentInputSchema = z.object({
  orderId: z.string().cuid(),
  paymentGateway: z.enum(['stripe', 'razorpay', 'cash', 'cod']),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentIntentId: z.string().optional(),
  transactionId: z.string().optional(),
});

// ===== CHEF SCHEMAS =====

export const ChefStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'REJECTED',
]);

export const SubscriptionTierSchema = z.enum(['free', 'basic', 'premium']);

export const ChefSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().optional().nullable(),
  serviceRadius: z.number().int().positive().default(3),
  
  fssaiNumber: z.string().optional().nullable(),
  fssaiExpiry: z.date().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  isVerified: z.boolean().default(false),
  verifiedAt: z.date().optional().nullable(),
  
  bio: z.string().optional().nullable(),
  cuisineTypes: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  
  status: ChefStatusSchema,
  onboardedAt: z.date().optional().nullable(),
  
  commissionRate: z.number().min(0).max(100).default(10),
  subscriptionTier: SubscriptionTierSchema,
  subscriptionPaid: z.date().optional().nullable(),
  
  isAcceptingOrders: z.boolean().default(true),
  preparationBuffer: z.number().int().nonnegative().default(10),
  minOrderAmount: z.number().nonnegative().default(199),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateChefInputSchema = z.object({
  name: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().optional(),
  
  fssaiNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  
  bio: z.string().optional(),
  cuisineTypes: z.array(z.string()).optional(),
});

// ===== TYPE EXPORTS =====

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemInputSchema>;
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemInputSchema>;

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;

export type Chef = z.infer<typeof ChefSchema>;
export type CreateChefInput = z.infer<typeof CreateChefInputSchema>;
export type ChefStatus = z.infer<typeof ChefStatusSchema>;
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

