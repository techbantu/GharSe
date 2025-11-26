/**
 * STRIPE BILLING API - Subscription Management
 * 
 * Purpose: Handle tenant subscription billing via Stripe
 * 
 * Features:
 * - Create checkout session
 * - Manage subscriptions
 * - Handle webhooks
 * - Usage-based billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Stripe price IDs (configure in Stripe dashboard)
const STRIPE_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tenantId, plan, returnUrl } = body;

    switch (action) {
      case 'create-checkout':
        return createCheckoutSession(tenantId, plan, returnUrl);
      case 'get-subscription':
        return getSubscription(tenantId);
      case 'cancel-subscription':
        return cancelSubscription(tenantId);
      case 'update-plan':
        return updatePlan(tenantId, plan);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Billing API] Error:', error);
    return NextResponse.json({ error: 'Billing operation failed' }, { status: 500 });
  }
}

async function createCheckoutSession(tenantId: string, plan: string, returnUrl: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const priceId = STRIPE_PRICES[plan];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // In production, create actual Stripe checkout session
  // For now, return mock data
  const checkoutUrl = `${returnUrl}?success=true&session_id=mock_session_${Date.now()}`;

  return NextResponse.json({
    success: true,
    checkoutUrl,
    sessionId: `mock_session_${Date.now()}`,
  });
}

async function getSubscription(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    subscription: {
      plan: tenant.plan,
      status: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
      monthlyPrice: tenant.monthlyPrice,
      currentUsage: {
        chefs: tenant.currentChefs,
        orders: tenant.currentOrders,
        storage: tenant.currentStorage,
      },
      limits: {
        maxChefs: tenant.maxChefs,
        maxOrders: tenant.maxOrders,
        maxStorage: tenant.maxStorage,
      },
    },
  });
}

async function cancelSubscription(tenantId: string) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionStatus: 'CANCELLED',
      plan: 'FREE',
      maxChefs: 5,
      maxOrders: 100,
      maxMenuItems: 50,
      maxStorage: 1,
      monthlyPrice: 0,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Subscription cancelled. Downgraded to free plan.',
  });
}

async function updatePlan(tenantId: string, newPlan: string) {
  const planConfig: Record<string, any> = {
    FREE: { maxChefs: 5, maxOrders: 100, maxMenuItems: 50, maxStorage: 1, monthlyPrice: 0 },
    STARTER: { maxChefs: 25, maxOrders: 1000, maxMenuItems: 200, maxStorage: 5, monthlyPrice: 99 },
    PROFESSIONAL: { maxChefs: 100, maxOrders: 10000, maxMenuItems: 500, maxStorage: 25, monthlyPrice: 299 },
    ENTERPRISE: { maxChefs: 999999, maxOrders: 999999, maxMenuItems: 999999, maxStorage: 100, monthlyPrice: 999 },
  };

  const config = planConfig[newPlan.toUpperCase()];
  if (!config) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan: newPlan.toUpperCase(),
      subscriptionStatus: 'ACTIVE',
      ...config,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Plan updated to ${newPlan}`,
  });
}

// Webhook handler for Stripe events
export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // In production, verify Stripe signature
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const event = JSON.parse(body);

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        console.log('[Stripe Webhook] Checkout completed');
        break;
      case 'invoice.paid':
        // Handle successful payment
        console.log('[Stripe Webhook] Invoice paid');
        break;
      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('[Stripe Webhook] Payment failed');
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        console.log('[Stripe Webhook] Subscription cancelled');
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}

