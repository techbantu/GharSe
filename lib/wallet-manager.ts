/**
 * WALLET MANAGER - Genius Referral Reward System
 * 
 * Purpose: Manage customer wallet credits from referrals, jackpots, and refunds
 * 
 * Features:
 * - Credit wallet (with 24-hour hold for fraud prevention)
 * - Debit wallet (use at checkout)
 * - Balance checking (available + pending)
 * - Transaction history
 * - Automatic clearance of pending credits
 * 
 * Security: All amounts validated, atomic transactions, fraud prevention
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Transaction source types for tracking
 */
export type WalletTransactionSource =
  | 'REFERRAL_REWARD' // ₹50 from successful referral
  | 'JACKPOT' // Mystery jackpot from milestones
  | 'ORDER_PAYMENT' // Using wallet at checkout
  | 'ADMIN_CREDIT' // Manual credit by admin
  | 'REFUND' // Order cancellation/refund
  | 'MONTHLY_CHAMPION'; // Champion prize ₹5000

/**
 * Wallet balance information
 */
export interface WalletBalance {
  available: number; // Ready to spend
  pending: number; // Waiting for clearance (24hr hold)
  total: number; // available + pending
  totalEarned: number; // Lifetime earnings
  totalSpent: number; // Lifetime spending
}

/**
 * Transaction record with details
 */
export interface WalletTransactionDetails {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'PENDING_CREDIT';
  amount: number;
  source: WalletTransactionSource;
  sourceId?: string;
  description: string;
  balanceAfter: number;
  pendingBalanceAfter: number;
  clearsAt?: Date;
  clearedAt?: Date;
  createdAt: Date;
}

/**
 * Get or create customer wallet
 * 
 * @param customerId - Customer ID
 * @returns Promise<Wallet>
 */
export async function getOrCreateWallet(customerId: string) {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { customerId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });

      logger.info('Wallet created for customer', { customerId });
    }

    return wallet;
  } catch (error) {
    logger.error('Failed to get or create wallet', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to access wallet');
  }
}

/**
 * Get wallet balance
 * 
 * @param customerId - Customer ID
 * @returns Promise<WalletBalance>
 */
export async function getWalletBalance(customerId: string): Promise<WalletBalance> {
  try {
    const wallet = await getOrCreateWallet(customerId);

    return {
      available: wallet.balance,
      pending: wallet.pendingBalance,
      total: wallet.balance + wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
    };
  } catch (error) {
    logger.error('Failed to get wallet balance', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to retrieve wallet balance');
  }
}

/**
 * Credit wallet with pending 24-hour hold (fraud prevention)
 * 
 * @param customerId - Customer ID
 * @param amount - Amount to credit
 * @param source - Source of credit
 * @param sourceId - Related record ID (referralId, milestoneId, etc.)
 * @param description - Human-readable description
 * @param skipHold - Skip 24hr hold (for admin credits or refunds)
 * @returns Promise<WalletTransactionDetails>
 */
export async function creditWallet(
  customerId: string,
  amount: number,
  source: WalletTransactionSource,
  sourceId?: string,
  description?: string,
  skipHold: boolean = false
): Promise<WalletTransactionDetails> {
  // Validation
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  if (amount > 10000) {
    throw new Error('Credit amount exceeds maximum limit (₹10,000)');
  }

  try {
    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get wallet
      const wallet = await tx.wallet.findUnique({
        where: { customerId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Calculate clearance time (24 hours from now, unless skipped)
      const clearsAt = skipHold ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update wallet
      const updatedWallet = await tx.wallet.update({
        where: { customerId },
        data: {
          // If skip hold, add directly to balance; otherwise add to pending
          balance: skipHold ? wallet.balance + amount : wallet.balance,
          pendingBalance: skipHold ? wallet.pendingBalance : wallet.pendingBalance + amount,
          totalEarned: wallet.totalEarned + amount,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: skipHold ? 'CREDIT' : 'PENDING_CREDIT',
          amount,
          source,
          sourceId,
          description: description || `${source.replace(/_/g, ' ')} credit`,
          balanceAfter: updatedWallet.balance,
          pendingBalanceAfter: updatedWallet.pendingBalance,
          clearsAt,
          clearedAt: skipHold ? new Date() : null,
        },
      });

      logger.info('Wallet credited', {
        customerId,
        amount,
        source,
        sourceId,
        skipHold,
        balanceAfter: updatedWallet.balance,
        pendingBalanceAfter: updatedWallet.pendingBalance,
      });

      return {
        id: transaction.id,
        type: transaction.type as 'CREDIT' | 'DEBIT' | 'PENDING_CREDIT',
        amount: transaction.amount,
        source: transaction.source as WalletTransactionSource,
        sourceId: transaction.sourceId || undefined,
        description: transaction.description || '',
        balanceAfter: transaction.balanceAfter,
        pendingBalanceAfter: transaction.pendingBalanceAfter,
        clearsAt: transaction.clearsAt || undefined,
        clearedAt: transaction.clearedAt || undefined,
        createdAt: transaction.createdAt,
      };
    });

    return result;
  } catch (error) {
    logger.error('Failed to credit wallet', {
      customerId,
      amount,
      source,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Debit wallet (use at checkout)
 * 
 * @param customerId - Customer ID
 * @param amount - Amount to debit
 * @param orderId - Order ID
 * @param description - Human-readable description
 * @returns Promise<WalletTransactionDetails>
 */
export async function debitWallet(
  customerId: string,
  amount: number,
  orderId: string,
  description?: string
): Promise<WalletTransactionDetails> {
  // Validation
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }

  try {
    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get wallet
      const wallet = await tx.wallet.findUnique({
        where: { customerId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ₹${wallet.balance}, Required: ₹${amount}`);
      }

      // Update wallet
      const updatedWallet = await tx.wallet.update({
        where: { customerId },
        data: {
          balance: wallet.balance - amount,
          totalSpent: wallet.totalSpent + amount,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          source: 'ORDER_PAYMENT',
          sourceId: orderId,
          description: description || `Payment for order`,
          balanceAfter: updatedWallet.balance,
          pendingBalanceAfter: updatedWallet.pendingBalance,
        },
      });

      logger.info('Wallet debited', {
        customerId,
        amount,
        orderId,
        balanceAfter: updatedWallet.balance,
      });

      return {
        id: transaction.id,
        type: transaction.type as 'CREDIT' | 'DEBIT' | 'PENDING_CREDIT',
        amount: transaction.amount,
        source: transaction.source as WalletTransactionSource,
        sourceId: transaction.sourceId || undefined,
        description: transaction.description || '',
        balanceAfter: transaction.balanceAfter,
        pendingBalanceAfter: transaction.pendingBalanceAfter,
        createdAt: transaction.createdAt,
      };
    });

    return result;
  } catch (error) {
    logger.error('Failed to debit wallet', {
      customerId,
      amount,
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Clear pending credits (called by automated job)
 * Moves pending balance to available balance after 24-hour hold
 * 
 * @returns Promise<number> - Number of credits cleared
 */
export async function clearPendingCredits(): Promise<number> {
  try {
    const now = new Date();

    // Find all pending credits that are ready to clear
    const pendingTransactions = await prisma.walletTransaction.findMany({
      where: {
        type: 'PENDING_CREDIT',
        clearsAt: { lte: now },
        clearedAt: null,
      },
      include: {
        wallet: true,
      },
    });

    let clearedCount = 0;

    // Process each pending credit
    for (const transaction of pendingTransactions) {
      try {
        await prisma.$transaction(async (tx) => {
          // Move from pending to available
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balance: transaction.wallet.balance + transaction.amount,
              pendingBalance: transaction.wallet.pendingBalance - transaction.amount,
            },
          });

          // Mark transaction as cleared
          await tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              type: 'CREDIT',
              clearedAt: now,
            },
          });
        });

        clearedCount++;

        logger.info('Pending credit cleared', {
          transactionId: transaction.id,
          customerId: transaction.wallet.customerId,
          amount: transaction.amount,
        });
      } catch (error) {
        logger.error('Failed to clear pending credit', {
          transactionId: transaction.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (clearedCount > 0) {
      logger.info('Pending credits cleared', { count: clearedCount });
    }

    return clearedCount;
  } catch (error) {
    logger.error('Failed to clear pending credits', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Get wallet transaction history
 * 
 * @param customerId - Customer ID
 * @param limit - Number of transactions to return (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns Promise<WalletTransactionDetails[]>
 */
export async function getWalletTransactions(
  customerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<WalletTransactionDetails[]> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        },
      },
    });

    if (!wallet) {
      return [];
    }

    return wallet.transactions.map((tx) => ({
      id: tx.id,
      type: tx.type as 'CREDIT' | 'DEBIT' | 'PENDING_CREDIT',
      amount: tx.amount,
      source: tx.source as WalletTransactionSource,
      sourceId: tx.sourceId || undefined,
      description: tx.description || '',
      balanceAfter: tx.balanceAfter,
      pendingBalanceAfter: tx.pendingBalanceAfter,
      clearsAt: tx.clearsAt || undefined,
      clearedAt: tx.clearedAt || undefined,
      createdAt: tx.createdAt,
    }));
  } catch (error) {
    logger.error('Failed to get wallet transactions', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to retrieve transaction history');
  }
}

/**
 * Calculate maximum wallet amount that can be used for an order
 * 
 * @param customerId - Customer ID
 * @param orderTotal - Order total amount
 * @returns Promise<number> - Maximum wallet amount to use (min of balance and orderTotal)
 */
export async function getMaxWalletUsage(
  customerId: string,
  orderTotal: number
): Promise<number> {
  try {
    const balance = await getWalletBalance(customerId);
    
    // Can't use more than available balance or more than order total
    return Math.min(balance.available, orderTotal);
  } catch (error) {
    logger.error('Failed to calculate max wallet usage', {
      customerId,
      orderTotal,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Admin function: Add credit to wallet (no hold)
 * 
 * @param customerId - Customer ID
 * @param amount - Amount to credit
 * @param adminId - Admin ID who is adding credit
 * @param reason - Reason for manual credit
 * @returns Promise<WalletTransactionDetails>
 */
export async function adminCreditWallet(
  customerId: string,
  amount: number,
  adminId: string,
  reason: string
): Promise<WalletTransactionDetails> {
  return creditWallet(
    customerId,
    amount,
    'ADMIN_CREDIT',
    adminId,
    `Admin credit: ${reason}`,
    true // Skip 24hr hold for admin credits
  );
}

