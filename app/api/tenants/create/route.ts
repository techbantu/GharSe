/**
 * CREATE TENANT API - White-Label Platform Creation
 * 
 * Purpose: Create a new tenant/platform instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platformName,
      slug,
      ownerName,
      ownerEmail,
      ownerPhone,
      city,
      selectedPlan,
      primaryColor,
    } = body;

    // Validate required fields
    if (!platformName || !slug || !ownerEmail || !ownerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'This platform URL is already taken' },
        { status: 400 }
      );
    }

    // Plan configuration
    const planConfig: Record<string, { maxChefs: number; maxOrders: number; maxMenuItems: number; maxStorage: number; monthlyPrice: number }> = {
      free: { maxChefs: 5, maxOrders: 100, maxMenuItems: 50, maxStorage: 1, monthlyPrice: 0 },
      starter: { maxChefs: 25, maxOrders: 1000, maxMenuItems: 200, maxStorage: 5, monthlyPrice: 99 },
      professional: { maxChefs: 100, maxOrders: 10000, maxMenuItems: 500, maxStorage: 25, monthlyPrice: 299 },
      enterprise: { maxChefs: 999999, maxOrders: 999999, maxMenuItems: 999999, maxStorage: 100, monthlyPrice: 999 },
    };

    const plan = planConfig[selectedPlan] || planConfig.free;

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: platformName,
        plan: selectedPlan.toUpperCase(),
        subscriptionStatus: selectedPlan === 'free' ? 'ACTIVE' : 'TRIAL',
        trialEndsAt: selectedPlan !== 'free' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null, // 14-day trial
        primaryColor: primaryColor || '#FF6B35',
        secondaryColor: '#FFA500',
        maxChefs: plan.maxChefs,
        maxOrders: plan.maxOrders,
        maxMenuItems: plan.maxMenuItems,
        maxStorage: plan.maxStorage,
        monthlyPrice: plan.monthlyPrice,
        ownerName,
        ownerEmail,
        ownerPhone,
        commission: 15, // 15% platform commission
      },
    });

    // Create admin account for tenant owner
    const passwordHash = await bcrypt.hash('TempPassword123!', 12);
    
    await prisma.admin.create({
      data: {
        email: ownerEmail,
        name: ownerName,
        phone: ownerPhone,
        passwordHash,
        role: 'OWNER',
        tenantId: tenant.id,
        emailVerified: false,
      },
    });

    // TODO: Send welcome email with login credentials
    // await sendWelcomeEmail(ownerEmail, platformName, slug);

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        url: `${slug}.gharse.app`,
        plan: tenant.plan,
        trialEndsAt: tenant.trialEndsAt,
      },
      message: 'Platform created successfully!',
    });
  } catch (error) {
    console.error('[Create Tenant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    );
  }
}

