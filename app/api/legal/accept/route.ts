/**
 * NEW FILE: Legal Acceptance API Route
 * Purpose: Record user acceptance of legal documents with IP and user agent tracking
 * Security: Requires authentication, validates document types
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const VALID_DOCUMENT_TYPES = [
  'privacy',
  'terms',
  'refund',
  'referral',
  'food_safety',
  'ip_protection',
];

export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();
    const { documents } = body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Invalid documents array' },
        { status: 400 }
      );
    }

    // Validate document types
    for (const doc of documents) {
      if (!VALID_DOCUMENT_TYPES.includes(doc.type)) {
        return NextResponse.json(
          { error: `Invalid document type: ${doc.type}` },
          { status: 400 }
        );
      }
    }

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record acceptance for each document
    const acceptances = await Promise.all(
      documents.map(async (doc: any) => {
        // Check if already accepted this version
        const existing = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM legal_acceptances
          WHERE customer_id = ${userId}
          AND document_type = ${doc.type}
          AND version = ${doc.version}
        `;

        if (existing.length > 0) {
          // Already accepted this version
          return { type: doc.type, status: 'already_accepted' };
        }

        // Insert new acceptance record
        await prisma.$executeRaw`
          INSERT INTO legal_acceptances (
            customer_id,
            document_type,
            version,
            ip_address,
            user_agent,
            accepted_at
          ) VALUES (
            ${userId},
            ${doc.type},
            ${doc.version},
            ${ipAddress},
            ${userAgent},
            CURRENT_TIMESTAMP
          )
        `;

        return { type: doc.type, status: 'accepted' };
      })
    );

    return NextResponse.json({
      success: true,
      acceptances,
      message: 'Legal documents accepted successfully',
    });

  } catch (error) {
    console.error('Legal acceptance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

