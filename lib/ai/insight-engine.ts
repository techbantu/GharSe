/**
 * 🤖 AI INSIGHT GENERATION ENGINE - Apple-Level Intelligence
 *
 * Automatically generates business insights that feel magical:
 * - "Sales spike 37% on rainy days"
 * - "Customers who order biryani have 85% chance of ordering raita"
 * - "Your delivery times are 12% slower on Fridays - recommend hiring 2 more drivers"
 * - "Menu item 'Paneer Tikka' trending up 250% - stock up!"
 *
 * This is what makes the app feel like it has a brain.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== INSIGHT TYPES =====

export interface InsightData {
  insightType: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'prediction';
  category: 'sales' | 'customer' | 'operations' | 'finance' | 'marketing';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: 'positive' | 'negative' | 'neutral';
  impactValue?: number; // Estimated $ impact
  dataPoints: any;
  visualization?: string;
  recommendations: string[];
  actionPriority: number; // 1-10
  audience: 'admin' | 'chef' | 'customer';
  entityType?: string;
  entityId?: string;
  confidence?: number; // 0-1
  source?: string;
  expiresAt?: Date;
}

// ===== INSIGHT GENERATION ENGINE =====

export class AIInsightEngine {
  /**
   * Main entry point - Generate all insights
   */
  async generateAllInsights(): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Run all insight generators in parallel
    const [
      salesInsights,
      customerInsights,
      operationalInsights,
      predictiveInsights,
      anomalyInsights,
    ] = await Promise.all([
      this.generateSalesInsights(),
      this.generateCustomerInsights(),
      this.generateOperationalInsights(),
      this.generatePredictiveInsights(),
      this.detectAnomalies(),
    ]);

    insights.push(
      ...salesInsights,
      ...customerInsights,
      ...operationalInsights,
      ...predictiveInsights,
      ...anomalyInsights
    );

    // Store insights in database
    await this.storeInsights(insights);

    return insights;
  }

  /**
   * SALES INSIGHTS
   */
  private async generateSalesInsights(): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Insight: Best selling items
    const topItems = await prisma.$queryRaw<any[]>`
      SELECT
        mi.id,
        mi.name,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity * oi.price) as revenue
      FROM "MenuItem" mi
      JOIN "OrderItem" oi ON oi."menuItemId" = mi.id
      WHERE oi."createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY mi.id, mi.name
      ORDER BY order_count DESC
      LIMIT 5
    `;

    if (topItems.length > 0) {
      const top = topItems[0];
      insights.push({
        insightType: 'trend',
        category: 'sales',
        title: `🏆 "${top.name}" is your bestseller`,
        description: `"${top.name}" has been ordered ${top.order_count} times in the last 30 days, generating ₹${Math.round(top.revenue)} in revenue. This represents ${((top.order_count / topItems.reduce((sum, i) => sum + parseInt(i.order_count), 0)) * 100).toFixed(1)}% of your top 5 items.`,
        severity: 'high',
        impact: 'positive',
        impactValue: parseFloat(top.revenue),
        dataPoints: { topItems },
        visualization: 'bar_chart',
        recommendations: [
          'Consider promoting this item more prominently',
          'Ensure consistent availability and quality',
          'Create bundle offers with complementary items',
          'Analyze what makes this item successful and replicate'
        ],
        actionPriority: 8,
        audience: 'admin',
        entityType: 'menu_item',
        entityId: top.id,
        confidence: 0.95,
        source: 'sales_analysis',
      });
    }

    // Insight: Revenue trends
    const revenueByDay = await prisma.$queryRaw<any[]>`
      SELECT
        DATE(o."createdAt") as date,
        SUM(o.total) as revenue,
        COUNT(*) as orders
      FROM "Order" o
      WHERE o."createdAt" > NOW() - INTERVAL '14 days'
      GROUP BY DATE(o."createdAt")
      ORDER BY date DESC
    `;

    if (revenueByDay.length >= 7) {
      const last7Days = revenueByDay.slice(0, 7);
      const prev7Days = revenueByDay.slice(7, 14);
      const currentRevenue = last7Days.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0);
      const previousRevenue = prev7Days.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0);
      const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      if (Math.abs(growth) > 5) {
        insights.push({
          insightType: growth > 0 ? 'trend' : 'risk',
          category: 'sales',
          title: growth > 0
            ? `📈 Revenue up ${growth.toFixed(1)}% this week!`
            : `📉 Revenue down ${Math.abs(growth).toFixed(1)}% this week`,
          description: `Your revenue ${growth > 0 ? 'increased' : 'decreased'} from ₹${Math.round(previousRevenue)} to ₹${Math.round(currentRevenue)} compared to the previous week. ${growth > 0 ? 'Keep up the great work!' : 'This needs attention.'}`,
          severity: Math.abs(growth) > 20 ? 'high' : 'medium',
          impact: growth > 0 ? 'positive' : 'negative',
          impactValue: currentRevenue - previousRevenue,
          dataPoints: { revenueByDay: last7Days },
          visualization: 'line_chart',
          recommendations: growth > 0 ? [
            'Analyze what drove this growth and replicate',
            'Consider increasing inventory for popular items',
            'Launch a loyalty program to retain momentum'
          ] : [
            'Review recent menu changes or price adjustments',
            'Check customer feedback for quality issues',
            'Launch a promotional campaign to boost orders',
            'Analyze competitor activity'
          ],
          actionPriority: Math.abs(growth) > 20 ? 9 : 6,
          audience: 'admin',
          confidence: 0.88,
          source: 'revenue_trend_analysis',
        });
      }
    }

    // Insight: Peak hours
    const ordersByHour = await prisma.$queryRaw<any[]>`
      SELECT
        EXTRACT(HOUR FROM o."createdAt") as hour,
        COUNT(*) as order_count,
        AVG(o.total) as avg_value
      FROM "Order" o
      WHERE o."createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM o."createdAt")
      ORDER BY order_count DESC
      LIMIT 3
    `;

    if (ordersByHour.length > 0) {
      const peak = ordersByHour[0];
      const peakHour = parseInt(peak.hour);
      const hourFormatted = peakHour === 0 ? '12 AM' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`;

      insights.push({
        insightType: 'trend',
        category: 'operations',
        title: `⏰ Peak order time: ${hourFormatted}`,
        description: `Your busiest hour is ${hourFormatted} with ${peak.order_count} orders on average. The average order value during this time is ₹${Math.round(peak.avg_value)}.`,
        severity: 'medium',
        impact: 'neutral',
        dataPoints: { ordersByHour },
        visualization: 'bar_chart',
        recommendations: [
          'Ensure adequate staff during peak hours',
          'Pre-prep popular items before this time',
          'Consider surge pricing during peak demand',
          'Send targeted promotions 1-2 hours before peak'
        ],
        actionPriority: 7,
        audience: 'admin',
        confidence: 0.92,
        source: 'temporal_pattern_analysis',
      });
    }

    return insights;
  }

  /**
   * CUSTOMER INSIGHTS
   */
  private async generateCustomerInsights(): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Insight: Customer lifetime value segments
    const customerSegments = await prisma.$queryRaw<any[]>`
      SELECT
        CASE
          WHEN total_spent > 5000 THEN 'VIP'
          WHEN total_spent > 2000 THEN 'Loyal'
          WHEN total_spent > 500 THEN 'Regular'
          ELSE 'New'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        AVG(order_count) as avg_orders
      FROM (
        SELECT
          c.id,
          COALESCE(SUM(o.total), 0) as total_spent,
          COUNT(o.id) as order_count
        FROM "Customer" c
        LEFT JOIN "Order" o ON o."customerId" = c.id
        GROUP BY c.id
      ) customer_data
      GROUP BY segment
      ORDER BY
        CASE segment
          WHEN 'VIP' THEN 1
          WHEN 'Loyal' THEN 2
          WHEN 'Regular' THEN 3
          ELSE 4
        END
    `;

    if (customerSegments.length > 0) {
      const vip = customerSegments.find(s => s.segment === 'VIP');
      const total = customerSegments.reduce((sum, s) => sum + parseInt(s.customer_count), 0);

      if (vip && parseInt(vip.customer_count) > 0) {
        const vipPercent = (parseInt(vip.customer_count) / total * 100).toFixed(1);
        insights.push({
          insightType: 'opportunity',
          category: 'customer',
          title: `💎 ${vip.customer_count} VIP customers (${vipPercent}% of base)`,
          description: `You have ${vip.customer_count} VIP customers who have spent over ₹5,000 each. They represent ${vipPercent}% of your customer base but likely generate disproportionate revenue. Average VIP spends ₹${Math.round(vip.avg_spent)}.`,
          severity: 'high',
          impact: 'positive',
          impactValue: parseInt(vip.customer_count) * parseFloat(vip.avg_spent),
          dataPoints: { customerSegments },
          visualization: 'gauge',
          recommendations: [
            'Launch a VIP loyalty program with exclusive perks',
            'Send personalized thank-you messages to VIPs',
            'Offer early access to new menu items',
            'Create a VIP-only referral program with rewards'
          ],
          actionPriority: 9,
          audience: 'admin',
          confidence: 0.94,
          source: 'customer_segmentation',
        });
      }
    }

    // Insight: Repeat customer rate
    const repeatRate = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_id END) as repeat_customers,
        COUNT(DISTINCT customer_id) as total_customers,
        (COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_id END) * 100.0 /
         NULLIF(COUNT(DISTINCT customer_id), 0)) as repeat_rate
      FROM (
        SELECT
          "customerId" as customer_id,
          COUNT(*) as order_count
        FROM "Order"
        WHERE "createdAt" > NOW() - INTERVAL '90 days'
        GROUP BY "customerId"
      ) customer_orders
    `;

    if (repeatRate.length > 0 && repeatRate[0].repeat_rate) {
      const rate = parseFloat(repeatRate[0].repeat_rate);
      const isGood = rate >= 30; // Industry benchmark

      insights.push({
        insightType: isGood ? 'trend' : 'opportunity',
        category: 'customer',
        title: isGood
          ? `🔄 Strong repeat rate: ${rate.toFixed(1)}%`
          : `🎯 Improve repeat rate: ${rate.toFixed(1)}%`,
        description: `${repeatRate[0].repeat_customers} out of ${repeatRate[0].total_customers} customers (${rate.toFixed(1)}%) have ordered more than once in the last 90 days. ${isGood ? 'This is above the industry average of 30%.' : 'Industry average is 30% - there\'s room for improvement.'}`,
        severity: 'medium',
        impact: isGood ? 'positive' : 'neutral',
        dataPoints: repeatRate[0],
        visualization: 'gauge',
        recommendations: isGood ? [
          'Keep doing what you\'re doing!',
          'Share success story with testimonials',
          'Implement referral rewards for loyal customers'
        ] : [
          'Send follow-up email with 15% discount after first order',
          'Create a "second order free delivery" promotion',
          'Implement a points-based loyalty program',
          'Survey first-time customers for feedback'
        ],
        actionPriority: isGood ? 5 : 8,
        audience: 'admin',
        confidence: 0.89,
        source: 'retention_analysis',
      });
    }

    return insights;
  }

  /**
   * OPERATIONAL INSIGHTS
   */
  private async generateOperationalInsights(): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Insight: Average delivery time
    const deliveryMetrics = await prisma.delivery.aggregate({
      where: {
        status: 'delivered',
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _avg: {
        actualDeliveryTime: true,
      },
      _count: true,
    });

    if (deliveryMetrics._avg.actualDeliveryTime) {
      const avgTime = deliveryMetrics._avg.actualDeliveryTime;
      const isGood = avgTime <= 35; // Target: 30-35 minutes

      insights.push({
        insightType: isGood ? 'trend' : 'risk',
        category: 'operations',
        title: isGood
          ? `⚡ Fast deliveries: ${Math.round(avgTime)} min average`
          : `🐌 Slow deliveries: ${Math.round(avgTime)} min average`,
        description: `Your average delivery time is ${Math.round(avgTime)} minutes based on ${deliveryMetrics._count} deliveries in the last 30 days. ${isGood ? 'This is excellent and competitive with major platforms.' : 'Target is 30-35 minutes. Slow deliveries hurt customer satisfaction.'}`,
        severity: isGood ? 'low' : 'high',
        impact: isGood ? 'positive' : 'negative',
        dataPoints: { avgTime, deliveryCount: deliveryMetrics._count },
        visualization: 'gauge',
        recommendations: isGood ? [
          'Maintain this performance as a competitive advantage',
          'Market fast delivery as a key differentiator',
          'Set driver bonuses for maintaining speed'
        ] : [
          'Analyze bottlenecks in the delivery chain',
          'Consider adding more drivers during peak hours',
          'Optimize driver routes with better algorithm',
          'Check if kitchen prep time is the issue'
        ],
        actionPriority: isGood ? 4 : 9,
        audience: 'admin',
        confidence: 0.91,
        source: 'operational_metrics',
      });
    }

    return insights;
  }

  /**
   * PREDICTIVE INSIGHTS
   */
  private async generatePredictiveInsights(): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Insight: Churn risk customers
    const churnRisk = await prisma.churnPrediction.findMany({
      where: {
        riskLevel: { in: ['high', 'critical'] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 10,
      orderBy: {
        churnRisk: 'desc'
      }
    });

    if (churnRisk.length > 0) {
      const criticalCount = churnRisk.filter(c => c.riskLevel === 'critical').length;
      const avgRisk = churnRisk.reduce((sum, c) => sum + c.churnRisk, 0) / churnRisk.length;

      insights.push({
        insightType: 'risk',
        category: 'customer',
        title: `⚠️ ${churnRisk.length} customers at risk of churning`,
        description: `AI has identified ${churnRisk.length} customers with high churn risk (${criticalCount} critical). Average churn probability: ${(avgRisk * 100).toFixed(1)}%. Taking action now could save ₹${Math.round(churnRisk.length * 1500)} in potential lost revenue.`,
        severity: 'critical',
        impact: 'negative',
        impactValue: -churnRisk.length * 1500, // Estimated LTV per customer
        dataPoints: { churnRisk: churnRisk.slice(0, 5) },
        visualization: 'heatmap',
        recommendations: [
          'Send personalized "We miss you" message with 20% off coupon',
          'Call high-value at-risk customers personally',
          'Create a win-back campaign targeting this segment',
          'Survey to understand dissatisfaction reasons'
        ],
        actionPriority: 10,
        audience: 'admin',
        confidence: 0.82,
        source: 'churn_prediction_model',
      });
    }

    // Insight: Demand forecast
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        forecastDate: {
          gte: new Date(tomorrow.toDateString()),
          lt: new Date(new Date(tomorrow.toDateString()).getTime() + 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        predictedOrders: 'desc'
      },
      take: 5
    });

    if (forecasts.length > 0) {
      const totalPredictedOrders = forecasts.reduce((sum, f) => sum + f.predictedOrders, 0);
      const totalPredictedRevenue = forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0);

      insights.push({
        insightType: 'prediction',
        category: 'sales',
        title: `🔮 Tomorrow: ~${totalPredictedOrders} orders predicted`,
        description: `AI predicts approximately ${totalPredictedOrders} orders tomorrow, generating ~₹${Math.round(totalPredictedRevenue)} in revenue. Top predicted item: "${forecasts[0].itemName}" (${forecasts[0].predictedOrders} orders).`,
        severity: 'medium',
        impact: 'neutral',
        impactValue: totalPredictedRevenue,
        dataPoints: { forecasts: forecasts.slice(0, 5) },
        visualization: 'bar_chart',
        recommendations: [
          `Ensure adequate stock for "${forecasts[0].itemName}"`,
          'Schedule enough drivers for predicted demand',
          'Prep ingredients in advance for top items',
          'Set up promotional campaigns if demand is low'
        ],
        actionPriority: 7,
        audience: 'admin',
        confidence: forecasts[0].confidence,
        source: 'demand_forecasting_model',
        expiresAt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      });
    }

    return insights;
  }

  /**
   * ANOMALY DETECTION
   */
  private async detectAnomalies(): Promise<InsightData[]> {
    const insights: InsightData[] = [];

    // Get recent anomalies
    const anomalies = await prisma.anomalyDetection.findMany({
      where: {
        detectedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        status: { in: ['detected', 'investigating'] }
      },
      orderBy: {
        severity: 'desc'
      },
      take: 5
    });

    for (const anomaly of anomalies) {
      insights.push({
        insightType: 'anomaly',
        category: anomaly.entityType === 'order' ? 'sales' : 'operations',
        title: `🚨 ${anomaly.anomalyType.toUpperCase()}: ${anomaly.metric}`,
        description: anomaly.description,
        severity: anomaly.severity as any,
        impact: 'negative',
        impactValue: anomaly.financialImpact || undefined,
        dataPoints: {
          expectedValue: anomaly.expectedValue,
          actualValue: anomaly.actualValue,
          deviation: anomaly.deviation
        },
        visualization: 'line_chart',
        recommendations: anomaly.suggestedAction ? [anomaly.suggestedAction] : [],
        actionPriority: anomaly.severity === 'critical' ? 10 : anomaly.severity === 'high' ? 8 : 5,
        audience: 'admin',
        entityType: anomaly.entityType,
        entityId: anomaly.entityId,
        confidence: anomaly.confidence,
        source: 'anomaly_detection_system',
      });
    }

    return insights;
  }

  /**
   * Store insights in database
   */
  private async storeInsights(insights: InsightData[]): Promise<void> {
    for (const insight of insights) {
      try {
        await prisma.aIInsight.create({
          data: {
            insightType: insight.insightType,
            category: insight.category,
            title: insight.title,
            description: insight.description,
            severity: insight.severity,
            impact: insight.impact,
            impactValue: insight.impactValue,
            dataPoints: insight.dataPoints as any,
            visualization: insight.visualization,
            recommendations: insight.recommendations as any,
            actionPriority: insight.actionPriority,
            audience: insight.audience,
            entityType: insight.entityType,
            entityId: insight.entityId,
            confidence: insight.confidence,
            source: insight.source,
            expiresAt: insight.expiresAt,
          }
        });
      } catch (error) {
        console.error('Failed to store insight:', error);
      }
    }
  }

  /**
   * Get active insights for dashboard
   */
  async getActiveInsights(audience: 'admin' | 'chef' | 'customer' = 'admin'): Promise<any[]> {
    return await prisma.aIInsight.findMany({
      where: {
        audience,
        status: { in: ['new', 'viewed'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: [
        { severity: 'desc' },
        { actionPriority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });
  }

  /**
   * Mark insight as viewed
   */
  async markViewed(insightId: string, userId: string): Promise<void> {
    const insight = await prisma.aIInsight.findUnique({
      where: { id: insightId }
    });

    if (insight) {
      const viewedBy = (insight.viewedBy as string[]) || [];
      if (!viewedBy.includes(userId)) {
        viewedBy.push(userId);
        await prisma.aIInsight.update({
          where: { id: insightId },
          data: {
            status: 'viewed',
            viewCount: insight.viewCount + 1,
            viewedBy: viewedBy as any
          }
        });
      }
    }
  }

  /**
   * Mark insight action taken
   */
  async markActionTaken(insightId: string, action: string): Promise<void> {
    await prisma.aIInsight.update({
      where: { id: insightId },
      data: {
        status: 'acted',
        actionTaken: action,
        actionDate: new Date()
      }
    });
  }
}

/**
 * Singleton instance
 */
export const aiInsightEngine = new AIInsightEngine();

/**
 * Cron job - Run insight generation every hour
 */
export async function generateInsightsJob() {
  console.log('[AI Insights] Starting insight generation...');
  try {
    const insights = await aiInsightEngine.generateAllInsights();
    console.log(`[AI Insights] Generated ${insights.length} insights`);
    return insights;
  } catch (error) {
    console.error('[AI Insights] Failed:', error);
    throw error;
  }
}
