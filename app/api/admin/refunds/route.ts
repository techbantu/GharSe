/**
 * NEW FILE: Refunds & Cancellations API - Admin Dashboard
 * 
 * Purpose: Fetch refund and cancellation data for admin dashboard
 * Features:
 * - List all refunded orders with details
 * - List all cancelled orders
 * - Statistics (total refunds, total cancelled, refund amounts)
 * - Filter by date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

/**
 * GET /api/admin/refunds - Get refunds and cancellations data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeCancelled = searchParams.get('includeCancelled') !== 'false';

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch refunded payments
    // Note: PaymentStatus enum values are uppercase (PENDING, PAID, REFUNDED, etc.)
    // Type assertion needed for Prisma Accelerate compatibility
    const refundedPayments = await (prisma.payment.findMany as any)({
      where: {
        status: 'REFUNDED', // Prisma enum value
        ...dateFilter,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            total: true,
            status: true,
            cancelledAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        refundedAt: 'desc',
      },
    });

    // Fetch cancelled orders (if requested)
    let cancelledOrders: any[] = [];
    if (includeCancelled) {
      cancelledOrders = await (prisma.order.findMany as any)({
        where: {
          status: 'CANCELLED',
          ...dateFilter,
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          total: true,
          status: true,
          cancelledAt: true,
          createdAt: true,
          paymentStatus: true,
        },
        orderBy: {
          cancelledAt: 'desc',
        },
      });
    }

    // Calculate statistics
    const totalRefundedAmount = refundedPayments.reduce(
      (sum: number, payment: any) => sum + payment.amount,
      0
    );
    const totalRefundedCount = refundedPayments.length;
    const totalCancelledCount = cancelledOrders.length;
    const cancelledWithRefund = refundedPayments.length;
    const cancelledWithoutRefund = cancelledOrders.filter(
      (order) => !refundedPayments.some((p) => p.orderId === order.id)
    ).length;

    // Combine refunded orders with payment details
    const refundedOrders = refundedPayments.map((payment) => ({
      orderId: payment.order.orderNumber,
      orderDbId: payment.order.id,
      customerName: payment.order.customerName,
      customerPhone: payment.order.customerPhone,
      customerEmail: payment.order.customerEmail,
      orderTotal: payment.order.total,
      refundAmount: payment.amount,
      refundDate: payment.refundedAt,
      orderDate: payment.order.createdAt,
      cancelledDate: payment.order.cancelledAt,
      paymentGateway: payment.paymentGateway,
      transactionId: payment.transactionId,
      paymentId: payment.id,
      status: 'REFUNDED',
    }));

    // Format cancelled orders (without refunds)
    const cancelledOrdersFormatted = cancelledOrders
      .filter((order) => !refundedPayments.some((p) => p.orderId === order.id))
      .map((order) => ({
        orderId: order.orderNumber,
        orderDbId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        orderTotal: order.total,
        refundAmount: 0,
        refundDate: null,
        orderDate: order.createdAt,
        cancelledDate: order.cancelledAt,
        paymentGateway: order.paymentStatus === 'PAID' ? 'Online' : 'COD',
        transactionId: null,
        paymentId: null,
        status: 'CANCELLED_NO_REFUND',
      }));

    logger.info('Refunds data fetched', {
      refundedCount: totalRefundedCount,
      cancelledCount: totalCancelledCount,
      totalRefundedAmount,
    });

    return NextResponse.json({
      success: true,
      statistics: {
        totalRefundedAmount,
        totalRefundedCount,
        totalCancelledCount,
        cancelledWithRefund,
        cancelledWithoutRefund,
      },
      refundedOrders,
      cancelledOrders: cancelledOrdersFormatted,
      allOrders: [...refundedOrders, ...cancelledOrdersFormatted].sort(
        (a, b) =>
          new Date(b.cancelledDate || b.orderDate).getTime() -
          new Date(a.cancelledDate || a.orderDate).getTime()
      ),
    });
  } catch (error) {
    logger.error('Failed to fetch refunds data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch refunds data', success: false },
      { status: 500 }
    );
  }
}

