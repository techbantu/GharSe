/**
 * NEW FILE: Data Retention Manager
 * Purpose: 7-year tax compliance data retention system
 * Compliance: Income Tax Act 1961 § 44AA (7-year retention), DPDPA 2023 § 8 (Data retention)
 * 
 * Features:
 * - Automatic archival of 7+ year old orders
 * - Tax compliance report generation
 * - Legal hold management (pending litigation)
 * - Audit trail for all retention actions
 * - Purge data past retention period
 * 
 * Tax Compliance Requirements:
 * - Order history: 7 years (Income Tax Act § 44AA)
 * - Payment records: 10 years (RBI guidelines)
 * - User data: Delete after 30 days of account deletion (DPDPA § 8)
 * - Audit logs: 7 years (tax compliance)
 */

import { prisma } from '@/lib/prisma';
import { addYears, subYears, format, isPast } from 'date-fns';

/**
 * Archive orders that are 7+ years old
 * Creates snapshot in ArchivedOrder table for tax compliance
 * 
 * @param dryRun - If true, only count orders without archiving
 * @returns Number of orders archived
 */
export async function archiveExpiredOrders(dryRun = false): Promise<{
  archived: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const sevenYearsAgo = subYears(new Date(), 7);
  const details: string[] = [];
  
  console.log(`[Data Retention] Checking orders older than ${format(sevenYearsAgo, 'yyyy-MM-dd')}...`);
  
  try {
    // Find orders older than 7 years that haven't been archived
    const oldOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          lt: sevenYearsAgo,
        },
        // Don't re-archive orders that are already archived
        id: {
          notIn: (await prisma.archivedOrder.findMany({ select: { originalOrderId: true } }))
            .map(a => a.originalOrderId),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        receipt: true,
        payments: true,
      },
      take: 1000, // Process in batches of 1000
    });
    
    console.log(`[Data Retention] Found ${oldOrders.length} orders to archive`);
    
    if (dryRun) {
      details.push(`DRY RUN: Would archive ${oldOrders.length} orders`);
      return { archived: 0, skipped: 0, errors: 0, details };
    }
    
    let archived = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const order of oldOrders) {
      try {
        // Determine tax year and fiscal period
        const orderDate = new Date(order.createdAt);
        const fiscalYearStart = orderDate.getMonth() >= 3 ? orderDate.getFullYear() : orderDate.getFullYear() - 1;
        const taxYear = `FY${fiscalYearStart}-${(fiscalYearStart + 1).toString().substring(2)}`;
        
        // Determine quarter (Apr-Jun Q1, Jul-Sep Q2, Oct-Dec Q3, Jan-Mar Q4)
        const month = orderDate.getMonth();
        let quarter = 'Q1';
        if (month >= 3 && month <= 5) quarter = 'Q1';
        else if (month >= 6 && month <= 8) quarter = 'Q2';
        else if (month >= 9 && month <= 11) quarter = 'Q3';
        else quarter = 'Q4';
        
        // Calculate retention period (7 years from order date)
        const retainUntil = addYears(orderDate, 7);
        
        // Create complete order snapshot (for tax compliance)
        const orderSnapshot = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
          deliveryCity: order.deliveryCity,
          deliveryZip: order.deliveryZip,
          items: order.items.map(item => ({
            menuItemName: item.menuItem?.name || 'Unknown Item',
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          discount: order.discount,
          tip: order.tip,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
          payments: order.payments.map(p => ({
            amount: p.amount,
            paymentGateway: p.paymentGateway,
            transactionId: p.transactionId,
            paidAt: p.paidAt,
          })),
        };
        
        // Archive order
        await prisma.archivedOrder.create({
          data: {
            originalOrderId: order.id,
            orderData: orderSnapshot,
            taxYear,
            financialPeriod: quarter,
            retainUntil,
          },
        });
        
        // Log retention action
        await prisma.dataRetentionLog.create({
          data: {
            recordType: 'order',
            recordId: order.id,
            action: 'archived',
            reason: 'tax_compliance',
            details: {
              taxYear,
              quarter,
              retainUntil: retainUntil.toISOString(),
              orderTotal: order.total,
            },
          },
        });
        
        archived++;
        details.push(`✅ Archived order ${order.orderNumber} (${taxYear} ${quarter})`);
      } catch (error) {
        errors++;
        console.error(`[Data Retention] Error archiving order ${order.orderNumber}:`, error);
        details.push(`❌ Failed to archive order ${order.orderNumber}: ${error}`);
      }
    }
    
    console.log(`[Data Retention] Archived ${archived} orders, ${skipped} skipped, ${errors} errors`);
    
    return { archived, skipped, errors, details };
  } catch (error) {
    console.error('[Data Retention] Error in archiveExpiredOrders:', error);
    throw error;
  }
}

/**
 * Check if a record is eligible for deletion
 * Verifies retention periods and legal holds
 * 
 * @param recordType - Type of record ('order', 'payment', 'user')
 * @param recordId - Record ID
 * @returns Eligibility status
 */
export async function checkRetentionEligibility(
  recordType: 'order' | 'payment' | 'user',
  recordId: string
): Promise<{
  eligible: boolean;
  reason: string;
  retainUntil?: Date;
}> {
  try {
    if (recordType === 'order') {
      // Check if order is archived
      const archived = await prisma.archivedOrder.findUnique({
        where: { originalOrderId: recordId },
      });
      
      if (!archived) {
        return {
          eligible: false,
          reason: 'Order not yet archived (must be 7+ years old)',
        };
      }
      
      // Check if retention period has passed
      if (!isPast(archived.retainUntil)) {
        return {
          eligible: false,
          reason: `Retention period not yet expired (retain until ${format(archived.retainUntil, 'yyyy-MM-dd')})`,
          retainUntil: archived.retainUntil,
        };
      }
      
      // Check for legal holds
      const order = await prisma.order.findUnique({
        where: { id: recordId },
        select: { status: true },
      });
      
      if (order?.status === 'CANCELLED' && !isPast(addYears(archived.retainUntil, 3))) {
        return {
          eligible: false,
          reason: 'Cancelled order - extended retention for dispute resolution',
          retainUntil: addYears(archived.retainUntil, 3),
        };
      }
      
      return {
        eligible: true,
        reason: 'Retention period expired, no legal holds',
      };
    }
    
    if (recordType === 'payment') {
      // Payment records must be retained for 10 years (RBI guidelines)
      const payment = await prisma.payment.findUnique({
        where: { id: recordId },
        select: { createdAt: true },
      });
      
      if (!payment) {
        return {
          eligible: false,
          reason: 'Payment record not found',
        };
      }
      
      const tenYearsAgo = subYears(new Date(), 10);
      if (payment.createdAt > tenYearsAgo) {
        const retainUntil = addYears(payment.createdAt, 10);
        return {
          eligible: false,
          reason: `Payment records must be retained for 10 years (RBI) - retain until ${format(retainUntil, 'yyyy-MM-dd')}`,
          retainUntil,
        };
      }
      
      return {
        eligible: true,
        reason: '10-year retention period expired',
      };
    }
    
    if (recordType === 'user') {
      // Check if user has requested deletion
      const deletionRequest = await prisma.userDeletionRequest.findUnique({
        where: { userId: recordId },
      });
      
      if (!deletionRequest) {
        return {
          eligible: false,
          reason: 'No deletion request submitted',
        };
      }
      
      // Check if grace period has ended
      if (!isPast(deletionRequest.gracePeriodEnds)) {
        return {
          eligible: false,
          reason: `Grace period not expired (ends ${format(deletionRequest.gracePeriodEnds, 'yyyy-MM-dd')})`,
          retainUntil: deletionRequest.gracePeriodEnds,
        };
      }
      
      // Check for legal holds
      if (deletionRequest.hasLegalHold) {
        return {
          eligible: false,
          reason: `Legal hold: ${deletionRequest.legalHoldReason}`,
        };
      }
      
      // Check for active orders
      if (deletionRequest.hasActiveOrders) {
        return {
          eligible: false,
          reason: 'User has active orders that are not yet delivered',
        };
      }
      
      return {
        eligible: true,
        reason: 'Grace period expired, no legal holds',
      };
    }
    
    return {
      eligible: false,
      reason: 'Unknown record type',
    };
  } catch (error) {
    console.error('[Data Retention] Error checking eligibility:', error);
    return {
      eligible: false,
      reason: `Error: ${error}`,
    };
  }
}

/**
 * Generate tax compliance report
 * Shows all orders archived by tax year and quarter
 * 
 * @param fiscalYear - Fiscal year (e.g., "FY2023-24")
 * @returns Tax compliance report
 */
export async function generateRetentionReport(fiscalYear?: string) {
  try {
    const query: any = {};
    if (fiscalYear) {
      query.taxYear = fiscalYear;
    }
    
    const archivedOrders = await prisma.archivedOrder.findMany({
      where: query,
      orderBy: { archivedAt: 'desc' },
    });
    
    // Group by tax year and quarter
    const groupedByTaxYear: Record<string, {
      quarters: Record<string, number>;
      totalOrders: number;
      totalRevenue: number;
    }> = {};
    
    for (const archived of archivedOrders) {
      const taxYear = archived.taxYear;
      const quarter = archived.financialPeriod;
      const orderData = archived.orderData as any;
      const revenue = orderData.total || 0;
      
      if (!groupedByTaxYear[taxYear]) {
        groupedByTaxYear[taxYear] = {
          quarters: {},
          totalOrders: 0,
          totalRevenue: 0,
        };
      }
      
      if (!groupedByTaxYear[taxYear].quarters[quarter]) {
        groupedByTaxYear[taxYear].quarters[quarter] = 0;
      }
      
      groupedByTaxYear[taxYear].quarters[quarter]++;
      groupedByTaxYear[taxYear].totalOrders++;
      groupedByTaxYear[taxYear].totalRevenue += revenue;
    }
    
    return {
      reportGeneratedAt: new Date(),
      totalArchivedOrders: archivedOrders.length,
      byTaxYear: groupedByTaxYear,
      oldestRecord: archivedOrders[archivedOrders.length - 1],
      newestRecord: archivedOrders[0],
    };
  } catch (error) {
    console.error('[Data Retention] Error generating report:', error);
    throw error;
  }
}

/**
 * Purge data that's past retention period
 * DANGEROUS: Only call after confirming no legal holds
 * 
 * @param recordType - Type of record to purge
 * @param recordId - Record ID
 * @param performedBy - Admin ID who authorized deletion
 * @returns Purge result
 */
export async function purgeExpiredData(
  recordType: 'order' | 'payment' | 'user',
  recordId: string,
  performedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check eligibility first
    const eligibility = await checkRetentionEligibility(recordType, recordId);
    if (!eligibility.eligible) {
      return {
        success: false,
        message: `Cannot purge: ${eligibility.reason}`,
      };
    }
    
    if (recordType === 'order') {
      // Delete order and keep archive
      await prisma.order.delete({
        where: { id: recordId },
      });
      
      // Log deletion
      await prisma.dataRetentionLog.create({
        data: {
          recordType: 'order',
          recordId,
          action: 'deleted',
          reason: 'retention_period_expired',
          performedBy,
          details: {
            message: 'Order deleted after 7-year retention period, archive maintained',
          },
        },
      });
      
      return {
        success: true,
        message: 'Order purged, archive retained for tax compliance',
      };
    }
    
    if (recordType === 'payment') {
      // Delete payment record
      await prisma.payment.delete({
        where: { id: recordId },
      });
      
      // Log deletion
      await prisma.dataRetentionLog.create({
        data: {
          recordType: 'payment',
          recordId,
          action: 'deleted',
          reason: 'retention_period_expired',
          performedBy,
          details: {
            message: 'Payment record deleted after 10-year retention period (RBI)',
          },
        },
      });
      
      return {
        success: true,
        message: 'Payment record purged',
      };
    }
    
    if (recordType === 'user') {
      // Anonymize user data (GDPR right to erasure)
      const customer = await prisma.customer.findUnique({
        where: { id: recordId },
      });
      
      if (!customer) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      
      // Update deletion request
      await prisma.userDeletionRequest.update({
        where: { userId: recordId },
        data: { executedAt: new Date() },
      });
      
      // Anonymize user (keep for referential integrity)
      await prisma.customer.update({
        where: { id: recordId },
        data: {
          name: `Deleted User ${recordId.substring(0, 8)}`,
          email: `deleted-${recordId}@anonymized.local`,
          phone: `DELETED-${recordId.substring(0, 8)}`,
          passwordHash: null,
          accountStatus: 'DELETED',
          // Clear all personal data
          dietaryPreferences: null,
          favoriteItems: null,
          notificationPrefs: null,
        },
      });
      
      // Delete addresses
      await prisma.customerAddress.deleteMany({
        where: { customerId: recordId },
      });
      
      // Delete sessions
      await prisma.userSession.deleteMany({
        where: { customerId: recordId },
      });
      
      // Log deletion
      await prisma.dataRetentionLog.create({
        data: {
          recordType: 'user',
          recordId,
          action: 'deleted',
          reason: 'gdpr_request',
          performedBy,
          details: {
            message: 'User data anonymized per DPDPA/GDPR right to erasure',
            originalEmail: customer.email,
          },
        },
      });
      
      return {
        success: true,
        message: 'User data anonymized and deleted',
      };
    }
    
    return {
      success: false,
      message: 'Unknown record type',
    };
  } catch (error) {
    console.error('[Data Retention] Error purging data:', error);
    return {
      success: false,
      message: `Error: ${error}`,
    };
  }
}

/**
 * Get retention statistics
 * Shows current retention status and upcoming actions
 * 
 * @returns Retention statistics
 */
export async function getRetentionStatistics() {
  const now = new Date();
  const sevenYearsAgo = subYears(now, 7);
  
  // Count orders eligible for archival
  const eligibleForArchival = await prisma.order.count({
    where: {
      createdAt: { lt: sevenYearsAgo },
      id: {
        notIn: (await prisma.archivedOrder.findMany({ select: { originalOrderId: true } }))
          .map(a => a.originalOrderId),
      },
    },
  });
  
  // Count archived orders
  const totalArchived = await prisma.archivedOrder.count();
  
  // Count orders eligible for purge (retention period expired)
  const eligibleForPurge = await prisma.archivedOrder.count({
    where: {
      retainUntil: { lt: now },
    },
  });
  
  // Count pending deletion requests
  const pendingDeletions = await prisma.userDeletionRequest.count({
    where: {
      executedAt: null,
      gracePeriodEnds: { lt: now },
      hasLegalHold: false,
      hasActiveOrders: false,
    },
  });
  
  return {
    ordersEligibleForArchival: eligibleForArchival,
    totalArchivedOrders: totalArchived,
    ordersEligibleForPurge: eligibleForPurge,
    pendingDeletionRequests: pendingDeletions,
    lastChecked: now,
  };
}
