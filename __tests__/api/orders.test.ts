/**
 * API Route Tests - Orders Endpoint
 * 
 * Comprehensive tests for order creation, validation, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { restaurantInfo } from '@/data/menuData';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/order-storage', () => ({
  addOrder: jest.fn(),
  getOrders: jest.fn(() => []),
  getOrdersCount: jest.fn(() => 0),
}));

jest.mock('@/utils/rate-limit', () => ({
  applyRateLimit: jest.fn(() => ({ isErr: () => false })),
  RATE_LIMITS: {
    CREATE_ORDER: { maxRequests: 10, windowMs: 60000 },
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers(),
      url: 'http://localhost:3000/api/orders',
    } as any;
  };

  const validOrderPayload = {
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 90104 60964',
    },
    items: [
      {
        id: 'item-1',
        menuItem: {
          id: 'menu-1',
          name: 'Biryani',
          price: 299,
        },
        quantity: 2,
        subtotal: 598,
      },
    ],
    pricing: {
      subtotal: 598,
      tax: 29.9,
      deliveryFee: 49,
      total: 676.9,
    },
    orderType: 'delivery' as const,
    paymentMethod: 'cash-on-delivery' as const,
    deliveryAddress: {
      street: '123 Main St',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '501505',
      country: 'India',
    },
  };

  it('should create order successfully', async () => {
    const { POST } = await import('@/app/api/orders/route');
    const prisma = require('@/lib/prisma').default;
    const orderStorage = require('@/lib/order-storage');
    
    // Mock successful transaction - callback doesn't return, just executes
    prisma.$transaction.mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'order-123',
            orderNumber: 'BK-12345',
          }),
        },
        menuItem: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'menu-1',
            name: 'Biryani',
            price: 299,
            inventory: 10,
            inventoryEnabled: true,
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      
      // Execute callback - it doesn't return anything
      await callback(tx);
      // Transaction completes successfully
    });
    
    // Mock order.findUnique to return the created order (called after transaction)
    const mockOrderData = {
      id: 'order-123',
      orderNumber: 'BK-12345',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+91 90104 60964',
      deliveryAddress: '123 Main St',
      deliveryCity: 'Hyderabad',
      deliveryZip: '501505',
      deliveryNotes: '',
      subtotal: 598,
      tax: 29.9,
      deliveryFee: 49,
      discount: 0,
      tip: 0,
      total: 676.9,
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'PENDING',
      paymentMethod: 'cash-on-delivery',
      createdAt: new Date(),
      updatedAt: new Date(),
      gracePeriodExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      items: [
        {
          id: 'item-1',
          menuItemId: 'menu-1',
          quantity: 2,
          price: 299,
          subtotal: 598,
          specialInstructions: null,
          menuItem: {
            id: 'menu-1',
            name: 'Biryani',
            description: 'Delicious biryani',
            price: 299,
            originalPrice: null,
            category: 'Main Course',
            image: '/images/biryani.jpg',
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            spicyLevel: 2,
            preparationTime: 30,
            isAvailable: true,
            isPopular: true,
            calories: null,
            servingSize: null,
            ingredients: [],
            allergens: [],
          },
        },
      ],
    };
    prisma.order.findUnique.mockResolvedValue(mockOrderData);
    
    orderStorage.addOrder.mockImplementation(() => {});

    const request = createMockRequest(validOrderPayload);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.order).toBeDefined();
    expect(data.order.orderNumber).toMatch(/^BK-/);
  });

  it('should reject order below minimum amount', async () => {
    const { POST } = await import('@/app/api/orders/route');
    const payload = {
      ...validOrderPayload,
      pricing: {
        subtotal: restaurantInfo.settings.minimumOrder - 1,
        tax: 0,
        deliveryFee: 0,
        total: restaurantInfo.settings.minimumOrder - 1,
      },
    };

    const request = createMockRequest(payload);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Minimum order amount');
  });

  it('should reject invalid customer data', async () => {
    const { POST } = await import('@/app/api/orders/route');
    const payload = {
      ...validOrderPayload,
      customer: {
        name: '',
        email: 'invalid-email',
        phone: '123',
      },
    };

    const request = createMockRequest(payload);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should reject empty cart', async () => {
    const { POST } = await import('@/app/api/orders/route');
    const payload = {
      ...validOrderPayload,
      items: [],
    };

    const request = createMockRequest(payload);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle insufficient inventory', async () => {
    const { POST } = await import('@/app/api/orders/route');
    const prisma = require('@/lib/prisma').default;
    prisma.$transaction.mockRejectedValue(
      new Error('Insufficient inventory for Biryani. Requested: 2, Available: 1.')
    );

    const request = createMockRequest(validOrderPayload);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('INSUFFICIENT_INVENTORY');
  });

  it('should handle database errors gracefully', async () => {
    const { POST } = await import('@/app/api/orders/route');
    const prisma = require('@/lib/prisma').default;
    prisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest(validOrderPayload);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.code).toBe('DATABASE_ERROR');
  });
});

