/**
 * MENU ITEM DELETION TEST SUITE
 * 
 * Purpose: Verify menu item deletion handles order history correctly
 * Tests the genius pattern of preventing deletion when order history exists
 * 
 * CRITICAL: Menu items with order history cannot be deleted (preserves analytics)
 * SOLUTION: Offer to mark as unavailable instead
 */

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/menu/[id]/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    menuItem: {
      delete: jest.fn(),
    },
    orderItem: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('DELETE /api/menu/[id] - Menu Item Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete menu item with no order history', async () => {
    const menuItemId = 'menu-123';

    // Mock: No order history found
    (prisma.orderItem.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.menuItem.delete as jest.Mock).mockResolvedValue({
      id: menuItemId,
      name: 'Test Item',
    });

    const request = new NextRequest('http://localhost:3000/api/menu/menu-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: menuItemId }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted successfully');
    expect(prisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: { menuItemId },
      select: { id: true },
    });
    expect(prisma.menuItem.delete).toHaveBeenCalledWith({
      where: { id: menuItemId },
    });
  });

  it('should prevent deletion and suggest alternative when item has order history', async () => {
    const menuItemId = 'menu-456';

    // Mock: Order history exists
    (prisma.orderItem.findFirst as jest.Mock).mockResolvedValue({
      id: 'order-item-789',
    });

    const request = new NextRequest('http://localhost:3000/api/menu/menu-456', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: menuItemId }),
    });

    const data = await response.json();

    expect(response.status).toBe(409); // Conflict
    expect(data.success).toBe(false);
    expect(data.hasOrders).toBe(true);
    expect(data.error).toContain('ordered before');
    expect(data.suggestion).toContain('Not Available');
    expect(prisma.orderItem.findFirst).toHaveBeenCalled();
    expect(prisma.menuItem.delete).not.toHaveBeenCalled(); // Should NOT attempt deletion
  });

  it('should handle Prisma P2003 error (foreign key constraint)', async () => {
    const menuItemId = 'menu-789';

    // Mock: No order history found (but constraint still fails)
    (prisma.orderItem.findFirst as jest.Mock).mockResolvedValue(null);
    
    // Mock: Prisma throws foreign key constraint error
    (prisma.menuItem.delete as jest.Mock).mockRejectedValue({
      code: 'P2003',
      message: 'Foreign key constraint failed',
    });

    const request = new NextRequest('http://localhost:3000/api/menu/menu-789', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: menuItemId }),
    });

    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.hasOrders).toBe(true);
    expect(data.suggestion).toContain('unavailable');
  });

  it('should handle P2025 error (record not found)', async () => {
    const menuItemId = 'non-existent';

    (prisma.orderItem.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.menuItem.delete as jest.Mock).mockRejectedValue({
      code: 'P2025',
      message: 'Record not found',
    });

    const request = new NextRequest('http://localhost:3000/api/menu/non-existent', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: menuItemId }),
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });

  it('should handle generic database errors gracefully', async () => {
    const menuItemId = 'menu-error';

    (prisma.orderItem.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/menu/menu-error', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: menuItemId }),
    });

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });
});

/**
 * WHY THIS TEST IS GENIUS:
 * 
 * 1. **Preserves Data Integrity**: Tests that we never delete items with order history
 * 2. **User Experience**: Verifies helpful error messages guide admins to correct action
 * 3. **Edge Cases**: Covers foreign key constraints that might slip through initial check
 * 4. **Defensive Coding**: Tests all error paths (P2003, P2025, generic errors)
 * 5. **Business Logic**: Ensures analytics remain intact (can't lose order history)
 * 
 * REAL-WORLD IMPACT:
 * - Prevents "orphaned" order items (referencing deleted menu items)
 * - Maintains historical pricing and order data for reports
 * - Guides admins to proper solution (mark unavailable vs delete)
 * - Prevents accidental data loss that could break financial reports
 */

