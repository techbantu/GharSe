#!/usr/bin/env tsx

/**
 * AUTOMATED DATA RETENTION CRON JOB
 * Purpose: Daily execution at 2 AM IST for data retention compliance
 * Schedule: 0 2 * * * (Every day at 2:00 AM IST)
 * Actions: Archive old orders, purge expired data, generate alerts
 * 
 * Usage: node --loader tsx scripts/run-retention-check.ts
 * Or add to crontab: 0 2 * * * cd /path/to/app && npm run retention:check
 */

import {
  archiveExpiredOrders,
  purgeExpiredUserData,
  getOrdersApproachingRetention,
  generateRetentionReport,
} from '../lib/legal-compliance/data-retention';
import { prisma } from '../lib/prisma';

async function runRetentionCheck() {
  console.log('\n=== STARTING DATA RETENTION CHECK ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log('=====================================\n');

  try {
    // 1. Archive expired orders (7+ years old)
    console.log('📦 Step 1: Archiving expired orders...');
    const archiveResult = await archiveExpiredOrders();
    console.log(`   ✓ Archived: ${archiveResult.archived} orders`);
    console.log(`   ✗ Errors: ${archiveResult.errors} orders\n`);

    // 2. Purge expired user data (after grace period)
    console.log('🗑️  Step 2: Purging expired user data...');
    const purgeResult = await purgeExpiredUserData();
    console.log(`   ✓ Purged: ${purgeResult.purged} users`);
    console.log(`   ✗ Errors: ${purgeResult.errors} users\n`);

    // 3. Check for orders approaching 7-year mark (90 days warning)
    console.log('⚠️  Step 3: Checking orders approaching retention period...');
    const approaching = await getOrdersApproachingRetention(90);
    console.log(`   ⚠️  Found: ${approaching.length} orders need archival within 90 days\n`);

    // Create alert if orders are approaching retention
    if (approaching.length > 0) {
      await prisma.complianceAlert.create({
        data: {
          alertType: 'RETENTION_DUE',
          severity: 'MEDIUM',
          title: `${approaching.length} Orders Approaching 7-Year Mark`,
          description: `${approaching.length} order(s) will need archival within 90 days for tax compliance`,
        },
      });
      console.log('   📢 Created compliance alert for admin dashboard\n');
    }

    // 4. Generate monthly retention report (on 1st of month)
    const today = new Date();
    if (today.getDate() === 1) {
      console.log('📊 Step 4: Generating monthly retention report...');
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const report = await generateRetentionReport(
        new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        new Date(today.getFullYear(), today.getMonth(), 0)
      );
      
      console.log(`   Total Orders: ${report.totalOrders}`);
      console.log(`   Archived: ${report.archivedOrders}`);
      console.log(`   Active: ${report.activeOrders}`);
      console.log(`   Compliance: ${report.retentionCompliance.toFixed(2)}%\n`);

      // Log report to database
      await prisma.dataRetentionLog.create({
        data: {
          recordType: 'report',
          recordId: `monthly-${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}`,
          action: 'reviewed',
          reason: 'tax_compliance',
          details: report,
        },
      });
    }

    // 5. Log successful completion
    await prisma.dataRetentionLog.create({
      data: {
        recordType: 'system',
        recordId: `cron-${Date.now()}`,
        action: 'retained',
        reason: 'tax_compliance',
        details: {
          archivedOrders: archiveResult.archived,
          archivedErrors: archiveResult.errors,
          purgedUsers: purgeResult.purged,
          purgedErrors: purgeResult.errors,
          approachingRetention: approaching.length,
          timestamp: new Date(),
        },
      },
    });

    console.log('✅ DATA RETENTION CHECK COMPLETED SUCCESSFULLY');
    console.log('=====================================\n');

    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR DURING RETENTION CHECK:', error);
    
    // Create critical alert
    try {
      await prisma.complianceAlert.create({
        data: {
          alertType: 'RETENTION_DUE',
          severity: 'CRITICAL',
          title: 'Data Retention Check Failed',
          description: `Automated retention check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    } catch (alertError) {
      console.error('Failed to create alert:', alertError);
    }

    // Exit with error
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runRetentionCheck();
}

export { runRetentionCheck };

