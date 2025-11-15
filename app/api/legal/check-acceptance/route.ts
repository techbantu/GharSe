/**
 * NEW FILE: Check Legal Acceptance API Route
 * Purpose: Check if user has accepted all current versions of legal documents
 * Security: Requires authentication
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const REQUIRED_DOCUMENTS = [
  { type: 'privacy', version: '1.0' },
  { type: 'terms', version: '1.0' },
  { type: 'refund', version: '1.0' },
  { type: 'referral', version: '1.0' },
  { type: 'food_safety', version: '1.0' },
  { type: 'ip_protection', version: '1.0' },
];

export async function GET(request: Request) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check which documents user has accepted
    const acceptances = await prisma.$queryRaw<Array<{
      document_type: string;
      version: string;
      accepted_at: string;
    }>>`
      SELECT document_type, version, accepted_at
      FROM legal_acceptances
      WHERE customer_id = ${userId}
      ORDER BY accepted_at DESC
    `;

    // Create map of accepted documents
    const acceptedMap = new Map<string, { version: string; acceptedAt: string }>();
    for (const acceptance of acceptances) {
      const key = `${acceptance.document_type}:${acceptance.version}`;
      if (!acceptedMap.has(key)) {
        acceptedMap.set(key, {
          version: acceptance.version,
          acceptedAt: acceptance.accepted_at,
        });
      }
    }

    // Check if all required documents are accepted
    const missing: Array<{ type: string; version: string }> = [];
    for (const required of REQUIRED_DOCUMENTS) {
      const key = `${required.type}:${required.version}`;
      if (!acceptedMap.has(key)) {
        missing.push(required);
      }
    }

    const allAccepted = missing.length === 0;

    return NextResponse.json({
      allAccepted,
      missing,
      accepted: Array.from(acceptedMap.entries()).map(([key, data]) => {
        const [type] = key.split(':');
        return {
          type,
          version: data.version,
          acceptedAt: data.acceptedAt,
        };
      }),
    });

  } catch (error) {
    console.error('Check acceptance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

