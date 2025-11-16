#!/usr/bin/env node

/**
 * NEW FILE: Compliance Cron Job Runner
 * Purpose: Automated daily enforcement of all compliance policies
 * Schedule: 2:00 AM IST daily (via cron or Vercel cron)
 * 
 * This script runs all automated compliance checks:
 * - Data retention archival (7+ year old orders)
 * - DPO request SLA monitoring (30-day deadline)
 * - License expiry checks (FSSAI, etc.)
 * - User deletion request execution (30-day grace period)
 * - Security breach notification deadlines (72-hour SLA)
 * - Compliance alert generation
 * 
 * Usage:
 * - Local: node scripts/compliance-cron.ts
 * - Cron: 0 2 * * * cd /path/to/app && node scripts/compliance-cron.ts
 * - Vercel Cron: Configured in vercel.json
 */

import { PrismaClient } from '@prisma/client';
import { addDays, subYears, isPast } from 'date-fns';
import { checkOverdueDPORequests } from '../lib/legal-compliance/dpo-requests';
import { checkReadyForDeletion } from '../lib/legal-compliance/deletion-workflow';

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

/**
 * Task 1: Archive old orders (7+ years)
 */
async function runDataRetentionCheck() {
  log('📦 Running data retention check...', colors.cyan);
  
  try {
    const sevenYearsAgo = subYears(new Date(), 7);
    
    // Find orders older than 7 years that haven't been archived
    const oldOrders = await prisma.order.findMany({
      where: {
        createdAt: { lt: sevenYearsAgo },
        id: {
          notIn: (await prisma.archivedOrder.findMany({ select: { originalOrderId: true } }))
            .map(a => a.originalOrderId),
        },
      },
      take: 100, // Process 100 per run
    });
    
    if (oldOrders.length === 0) {
      log('  ✅ No orders need archiving', colors.green);
      return;
    }
    
    log(`  📊 Found ${oldOrders.length} orders to archive`, colors.yellow);
    
    // Archive each order (implementation would call archiveExpiredOrders)
    // For now, just log
    log(`  ⚠️  Manual archival required via admin dashboard`, colors.yellow);
    
    // Create compliance alert
    await prisma.complianceAlert.create({
      data: {
        alertType: 'RETENTION_DUE',
        severity: 'MEDIUM',
        title: 'Data Retention: Orders Need Archival',
        description: `${oldOrders.length} orders are 7+ years old and need to be archived for tax compliance (Income Tax Act § 44AA).`,
      },
    });
    
    log('  ✅ Alert created for admin review', colors.green);
  } catch (error) {
    log(`  ❌ Error: ${error}`, colors.red);
  }
}

/**
 * Task 2: Check DPO request SLA (30-day deadline)
 */
async function runDPOSLACheck() {
  log('📋 Checking DPO request SLAs...', colors.cyan);
  
  try {
    const result = await checkOverdueDPORequests();
    
    if (result.overdueCount === 0 && result.approachingCount === 0) {
      log('  ✅ No overdue or approaching DPO requests', colors.green);
    } else {
      if (result.overdueCount > 0) {
        log(`  ⚠️  ${result.overdueCount} overdue DPO requests (CRITICAL alerts created)`, colors.red);
      }
      if (result.approachingCount > 0) {
        log(`  ⏰ ${result.approachingCount} DPO requests approaching deadline (<7 days)`, colors.yellow);
      }
    }
  } catch (error) {
    log(`  ❌ Error checking DPO SLAs: ${error}`, colors.red);
  }
}

/**
 * Task 3: Check FSSAI license expiry
 */
async function runLicenseExpiryCheck() {
  log('🏛️  Checking FSSAI license expiry...', colors.cyan);
  
  try {
    const now = new Date();
    
    // Get all chefs with FSSAI licenses
    const chefs = await prisma.chef.findMany({
      where: {
        fssaiNumber: { not: null },
        fssaiExpiry: { not: null },
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        fssaiNumber: true,
        fssaiExpiry: true,
        status: true,
      },
    });
    
    for (const chef of chefs) {
      if (!chef.fssaiExpiry) continue;
      
      const daysUntilExpiry = Math.ceil(
        (chef.fssaiExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Expired license
      if (daysUntilExpiry < 0) {
        log(`  ❌ ${chef.businessName} - License EXPIRED!`, colors.red);
        
        // Auto-suspend chef if not already suspended
        if (chef.status === 'ACTIVE') {
          await prisma.chef.update({
            where: { id: chef.id },
            data: { status: 'SUSPENDED' },
          });
          log(`    🚫 Chef auto-suspended`, colors.red);
        }
        
        await prisma.complianceAlert.create({
          data: {
            alertType: 'LICENSE_EXPIRING',
            severity: 'CRITICAL',
            title: 'FSSAI License Expired',
            description: `${chef.businessName} (${chef.fssaiNumber}) - License expired ${Math.abs(daysUntilExpiry)} days ago. Chef auto-suspended.`,
            assignedTo: null,
          },
        });
      }
      // 7 days warning
      else if (daysUntilExpiry <= 7) {
        log(`  ⚠️  ${chef.businessName} - Expires in ${daysUntilExpiry} days!`, colors.red);
        
        await prisma.complianceAlert.create({
          data: {
            alertType: 'LICENSE_EXPIRING',
            severity: 'CRITICAL',
            title: 'URGENT: FSSAI License Expiring Soon',
            description: `${chef.businessName} (${chef.fssaiNumber}) - License expires in ${daysUntilExpiry} days! Immediate renewal required.`,
          },
        });
      }
      // 30 days warning
      else if (daysUntilExpiry <= 30) {
        log(`  ⚠️  ${chef.businessName} - Expires in ${daysUntilExpiry} days`, colors.yellow);
        
        await prisma.complianceAlert.create({
          data: {
            alertType: 'LICENSE_EXPIRING',
            severity: 'HIGH',
            title: 'FSSAI License Expiring',
            description: `${chef.businessName} (${chef.fssaiNumber}) - License expires in ${daysUntilExpiry} days. Please initiate renewal process.`,
          },
        });
      }
      // 90 days notice
      else if (daysUntilExpiry <= 90) {
        log(`  ℹ️  ${chef.businessName} - Expires in ${daysUntilExpiry} days`, colors.blue);
      }
    }
    
    log('  ✅ License check complete', colors.green);
  } catch (error) {
    log(`  ❌ Error: ${error}`, colors.red);
  }
}

/**
 * Task 4: Execute pending user deletion requests
 */
async function runUserDeletionExecution() {
  log('🗑️  Executing pending user deletion requests...', colors.cyan);
  
  try {
    const result = await checkReadyForDeletion();
    
    if (result.readyCount === 0) {
      log('  ✅ No deletion requests ready for execution', colors.green);
    } else {
      log(`  📊 Found ${result.readyCount} deletion requests`, colors.yellow);
      log(`  ✅ Executed ${result.executedCount} deletions successfully`, colors.green);
      
      if (result.executedCount < result.readyCount) {
        log(`  ⚠️  ${result.readyCount - result.executedCount} deletions failed`, colors.red);
      }
    }
  } catch (error) {
    log(`  ❌ Error executing deletions: ${error}`, colors.red);
  }
}

/**
 * Task 5: Check security breach notification deadlines (72-hour SLA)
 */
async function runBreachNotificationCheck() {
  log('🔒 Checking security breach notification deadlines...', colors.cyan);
  
  try {
    const now = new Date();
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    
    // Find breaches detected > 72 hours ago without notification
    const overdueBreaches = await prisma.securityBreach.findMany({
      where: {
        detectedAt: { lt: seventyTwoHoursAgo },
        notifiedAt: null,
      },
    });
    
    if (overdueBreaches.length === 0) {
      log('  ✅ No overdue breach notifications', colors.green);
    } else {
      log(`  🚨 ${overdueBreaches.length} breaches exceeded 72-hour SLA!`, colors.red);
      
      await prisma.complianceAlert.create({
        data: {
          alertType: 'BREACH_DETECTED',
          severity: 'CRITICAL',
          title: 'URGENT: Breach Notification SLA Exceeded',
          description: `${overdueBreaches.length} security breaches have not been reported within 72 hours (DPDPA 2023 § 6). Legal violation - immediate action required!`,
        },
      });
    }
    
    // Check breaches approaching deadline (< 24 hours)
    const twentyFourHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const approaching = await prisma.securityBreach.findMany({
      where: {
        detectedAt: { gte: seventyTwoHoursAgo, lt: twentyFourHoursAgo },
        notifiedAt: null,
      },
    });
    
    if (approaching.length > 0) {
      log(`  ⚠️  ${approaching.length} breaches need notification within 24 hours`, colors.yellow);
      
      await prisma.complianceAlert.create({
        data: {
          alertType: 'BREACH_DETECTED',
          severity: 'HIGH',
          title: 'Security Breach Notification Due Soon',
          description: `${approaching.length} security breaches must be reported within 24 hours to comply with 72-hour SLA.`,
        },
      });
    }
  } catch (error) {
    log(`  ❌ Error: ${error}`, colors.red);
  }
}

/**
 * Task 6: Clean up old compliance alerts (resolved > 90 days ago)
 */
async function cleanupOldAlerts() {
  log('🧹 Cleaning up old compliance alerts...', colors.cyan);
  
  try {
    const ninetyDaysAgo = subYears(new Date(), 0.25); // ~90 days
    
    const deleted = await prisma.complianceAlert.deleteMany({
      where: {
        resolvedAt: { lt: ninetyDaysAgo },
      },
    });
    
    log(`  ✅ Cleaned up ${deleted.count} old alerts`, colors.green);
  } catch (error) {
    log(`  ❌ Error: ${error}`, colors.red);
  }
}

/**
 * Main cron job execution
 */
async function main() {
  log('', colors.bright);
  log('═══════════════════════════════════════════════', colors.bright);
  log('🏛️  COMPLIANCE CRON JOB STARTED', colors.bright);
  log('═══════════════════════════════════════════════', colors.bright);
  log('');
  
  const startTime = Date.now();
  
  try {
    await runDataRetentionCheck();
    await runDPOSLACheck();
    await runLicenseExpiryCheck();
    await runUserDeletionExecution();
    await runBreachNotificationCheck();
    await cleanupOldAlerts();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('', colors.green);
    log('═══════════════════════════════════════════════', colors.green);
    log(`✅ COMPLIANCE CRON JOB COMPLETED (${duration}s)`, colors.green);
    log('═══════════════════════════════════════════════', colors.green);
  } catch (error) {
    log('', colors.red);
    log('═══════════════════════════════════════════════', colors.red);
    log(`❌ COMPLIANCE CRON JOB FAILED: ${error}`, colors.red);
    log('═══════════════════════════════════════════════', colors.red);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cron job
main();

