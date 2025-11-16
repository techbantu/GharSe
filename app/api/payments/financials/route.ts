/**
 * FINANCIAL DASHBOARD API
 * 
 * Purpose: Provides real-time financial data showing:
 * - Actual money received (from payment gateways)
 * - Pending payments (cash on delivery, unpaid orders)
 * - Available balance (money ready to withdraw)
 * - Payout schedule (when money reaches bank)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, all

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get all successful payments
    const successfulPayments = await (prisma.payment.findMany as any)({
      where: {
        status: 'PAID',
        createdAt: { gte: startDate },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
          },
        },
      },
    });

    // Get pending payments (orders not yet paid)
    // CRITICAL FIX: Only count COD orders as "pending collection" - card/online payments are handled by gateways
    const pendingOrders = await (prisma.order.findMany as any)({
      where: {
        paymentStatus: 'PENDING',
        status: { not: 'CANCELLED' },
        createdAt: { gte: startDate },
        // Only COD orders should show in "Pending Collection"
        paymentMethod: { 
          in: ['cash-on-delivery', 'cash', 'cod', 'CASH_ON_DELIVERY', 'Cash On-Delivery']
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        tip: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    // Calculate totals
    const totalReceived = successfulPayments.reduce((sum, p) => sum + p.netAmount + (p.tip || 0), 0);
    const totalGatewayFees = successfulPayments.reduce((sum, p) => sum + p.gatewayFee, 0);
    const totalGross = successfulPayments.reduce((sum, p) => sum + p.amount + (p.tip || 0), 0);
    // Only count unpaid COD orders in pending collection
    const totalPending = pendingOrders.reduce((sum, o) => sum + o.total, 0);

    // Group by payment method
    const byMethod = successfulPayments.reduce((acc, p) => {
      const method = p.paymentGateway;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0, fees: 0 };
      }
      acc[method].count++;
      acc[method].total += p.netAmount;
      acc[method].fees += p.gatewayFee;
      return acc;
    }, {} as Record<string, { count: number; total: number; fees: number }>);

    // Calculate payout status
    // Stripe: Money is available after 2-7 days (T+2 to T+7)
    // Razorpay: Money is available after 1-3 days (T+1 to T+3)
    const recentPayments = successfulPayments.filter(p => {
      const daysSince = (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    const availableNow = successfulPayments
      .filter(p => {
        const daysSince = (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        // Stripe: Available after 2 days, Razorpay: Available after 1 day
        const threshold = p.paymentGateway === 'razorpay' ? 1 : 2;
        return daysSince >= threshold && !p.payoutId;
      })
      .reduce((sum, p) => sum + p.netAmount, 0);

    const inTransit = successfulPayments
      .filter(p => {
        const daysSince = (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const threshold = p.paymentGateway === 'razorpay' ? 1 : 2;
        return daysSince < threshold && !p.payoutId;
      })
      .reduce((sum, p) => sum + p.netAmount, 0);

    return NextResponse.json({
      success: true,
      period,
      summary: {
        // Actual money received (after gateway fees)
        totalReceived,
        totalGross, // Before fees
        totalGatewayFees,
        
        // Pending money (not yet paid)
        totalPending,
        pendingOrderCount: pendingOrders.length,
        
        // Available balance
        availableNow, // Ready to withdraw
        inTransit, // Still processing (1-7 days)
        
        // Transaction counts
        successfulPaymentCount: successfulPayments.length,
      },
      byPaymentMethod: byMethod,
      recentPayments: recentPayments.slice(0, 10).map(p => ({
        id: p.id,
        orderNumber: p.order.orderNumber,
        amount: p.netAmount,
        gateway: p.paymentGateway,
        paidAt: p.paidAt,
        customerName: p.order.customerName,
      })),
      pendingOrders: pendingOrders.map(o => ({
        orderNumber: o.orderNumber,
        amount: o.total,
        tip: o.tip || 0,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching financial data', {
      error: error.message,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch financial data',
      },
      { status: 500 }
    );
  }
}

