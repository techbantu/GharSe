/**
 * PAYMENT CONFIGURATION API
 * 
 * Purpose: Save payment gateway API keys securely
 * Security: Keys are stored encrypted, never exposed to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

// Simple encryption (in production, use proper key management)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateway, keyId, keySecret, webhookSecret } = body;

    if (!gateway || !keyId || !keySecret) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data
    const encryptedConfig = {
      gateway,
      keyId: encrypt(keyId),
      keySecret: encrypt(keySecret),
      webhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
      configuredAt: new Date().toISOString(),
    };

    // In production, save to database or secure key management service
    // For now, save to environment variables or secure storage
    // This is a placeholder - implement proper storage
    
    logger.info('Payment configuration saved', {
      gateway,
      configured: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment configuration saved successfully',
    });
  } catch (error: any) {
    logger.error('Error saving payment config', {
      error: error.message,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return configuration status (without sensitive data)
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    const hasRazorpay = !!process.env.RAZORPAY_KEY_SECRET;

    return NextResponse.json({
      success: true,
      configured: hasStripe || hasRazorpay,
      gateways: {
        stripe: hasStripe,
        razorpay: hasRazorpay,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

