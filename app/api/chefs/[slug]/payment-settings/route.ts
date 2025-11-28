/**
 * CHEF PAYMENT SETTINGS API - UPI Configuration
 *
 * GET /api/chefs/[slug]/payment-settings - Get chef's UPI settings
 * PUT /api/chefs/[slug]/payment-settings - Update chef's UPI settings (auto-generates QR codes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/utils/logger';

// UPI ID validation regex - supports all Indian UPI formats
const UPI_ID_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

// Simple validation - accepts string or null, validates format only if non-empty
function validateUpiId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!UPI_ID_REGEX.test(trimmed)) {
    throw new Error(`Invalid UPI ID format: ${trimmed}`);
  }
  return trimmed;
}

// Validation schema for UPI payment settings
const PaymentSettingsSchema = z.object({
  phonePeUpiId: z.any().transform(validateUpiId).nullable().optional(),
  paytmUpiId: z.any().transform(validateUpiId).nullable().optional(),
  googlePayUpiId: z.any().transform(validateUpiId).nullable().optional(),
});

/**
 * Generate a UPI QR code string (without amount - static QR for display)
 * Format: upi://pay?pa={UPI_ID}&pn={CHEF_NAME}&cu=INR
 */
function generateUPIString(upiId: string, chefName: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: chefName,
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate QR code SVG from UPI string
 */
async function generateQRCodeSVG(upiString: string): Promise<string> {
  try {
    const QRCode = await import('qrcode');

    const svg = await QRCode.toString(upiString, {
      type: 'svg',
      width: 250,
      margin: 2,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF',
      },
    });

    return svg;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * GET /api/chefs/[slug]/payment-settings - Get chef's UPI settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();

  try {
    const { slug } = await params;

    const chef = await prisma.chef.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        businessName: true,
        phonePeUpiId: true,
        paytmUpiId: true,
        googlePayUpiId: true,
        phonePeQrCode: true,
        paytmQrCode: true,
        googlePayQrCode: true,
      },
    });

    if (!chef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;

    logger.info('Chef payment settings fetched', {
      slug,
      chefId: chef.id,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        phonePeUpiId: chef.phonePeUpiId,
        paytmUpiId: chef.paytmUpiId,
        googlePayUpiId: chef.googlePayUpiId,
        phonePeQrCode: chef.phonePeQrCode,
        paytmQrCode: chef.paytmQrCode,
        googlePayQrCode: chef.googlePayQrCode,
      },
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch chef payment settings', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chefs/[slug]/payment-settings - Update chef's UPI settings
 * Auto-generates QR codes when UPI IDs are provided
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();

  try {
    const { slug } = await params;
    const body = await request.json();

    // Validate input
    const validation = PaymentSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if chef exists
    const existingChef = await prisma.chef.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        businessName: true,
      },
    });

    if (!existingChef) {
      return NextResponse.json(
        { success: false, error: 'Chef not found' },
        { status: 404 }
      );
    }

    const chefDisplayName = existingChef.businessName || existingChef.name;

    // Prepare update data with auto-generated QR codes
    const updateData: {
      phonePeUpiId?: string | null;
      paytmUpiId?: string | null;
      googlePayUpiId?: string | null;
      phonePeQrCode?: string | null;
      paytmQrCode?: string | null;
      googlePayQrCode?: string | null;
    } = {};

    // PhonePe UPI
    if (data.phonePeUpiId !== undefined) {
      updateData.phonePeUpiId = data.phonePeUpiId || null;
      if (data.phonePeUpiId) {
        const upiString = generateUPIString(data.phonePeUpiId, chefDisplayName);
        updateData.phonePeQrCode = await generateQRCodeSVG(upiString);
      } else {
        updateData.phonePeQrCode = null;
      }
    }

    // Paytm UPI
    if (data.paytmUpiId !== undefined) {
      updateData.paytmUpiId = data.paytmUpiId || null;
      if (data.paytmUpiId) {
        const upiString = generateUPIString(data.paytmUpiId, chefDisplayName);
        updateData.paytmQrCode = await generateQRCodeSVG(upiString);
      } else {
        updateData.paytmQrCode = null;
      }
    }

    // Google Pay UPI
    if (data.googlePayUpiId !== undefined) {
      updateData.googlePayUpiId = data.googlePayUpiId || null;
      if (data.googlePayUpiId) {
        const upiString = generateUPIString(data.googlePayUpiId, chefDisplayName);
        updateData.googlePayQrCode = await generateQRCodeSVG(upiString);
      } else {
        updateData.googlePayQrCode = null;
      }
    }

    // Update chef payment settings
    const updatedChef = await prisma.chef.update({
      where: { slug },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        phonePeUpiId: true,
        paytmUpiId: true,
        googlePayUpiId: true,
        phonePeQrCode: true,
        paytmQrCode: true,
        googlePayQrCode: true,
      },
    });

    const duration = Date.now() - startTime;

    logger.info('Chef payment settings updated', {
      slug,
      chefId: existingChef.id,
      updatedFields: Object.keys(updateData),
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        phonePeUpiId: updatedChef.phonePeUpiId,
        paytmUpiId: updatedChef.paytmUpiId,
        googlePayUpiId: updatedChef.googlePayUpiId,
        phonePeQrCode: updatedChef.phonePeQrCode,
        paytmQrCode: updatedChef.paytmQrCode,
        googlePayQrCode: updatedChef.googlePayQrCode,
      },
      message: 'Payment settings updated successfully. QR codes have been generated.',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Failed to update chef payment settings', {
      error: errorMessage,
      stack: errorStack,
      duration,
    });

    console.error('Payment settings update error:', errorMessage, errorStack);

    return NextResponse.json(
      { success: false, error: errorMessage || 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
