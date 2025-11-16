/**
 * EMERGENCY ADMIN RECOVERY API
 * 
 * Purpose: Allow locked-out owner to regain access via EMAIL VERIFICATION
 * Security: Sends to OWNER EMAIL only (from .env)
 * 
 * HOW IT WORKS:
 * 1. Owner goes to /admin/emergency-recovery
 * 2. Enters their email (must match admin email in database)
 * 3. System sends verification code to OWNER'S PERSONAL EMAIL (from .env)
 * 4. Owner enters code
 * 5. Creates new password
 * 6. Access restored!
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import crypto from 'crypto';

// Get owner email from environment (YOUR personal email)
const OWNER_RECOVERY_EMAIL = process.env.OWNER_RECOVERY_EMAIL || process.env.EMAIL_FROM || 'bantusailaja@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { email, step } = await request.json();

    // STEP 1: Request recovery code
    if (step === 'request') {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email is required' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if this is THE admin
      const admin = await (prisma.admin.findUnique as any)({
        where: { email: normalizedEmail },
      });

      if (!admin) {
        // Don't reveal if admin exists
        return NextResponse.json({
          success: true,
          message: 'If you are the owner, check your email',
        });
      }

      // Check if this is the OWNER (role = OWNER)
      if (admin.role !== 'OWNER') {
        return NextResponse.json({
          success: true,
          message: 'If you are the owner, check your email',
        });
      }

      // Generate 6-digit code
      const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = crypto.createHash('sha256').update(recoveryCode).digest('hex');
      const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save to database
      await (prisma.admin.update as any)({
        where: { id: admin.id },
        data: {
          passwordResetToken: codeHash,
          passwordResetExpires: codeExpiry,
        },
      });

      // Send to OWNER'S PERSONAL EMAIL (the one in .env)
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Emergency Recovery Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Emergency Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 32px; color: #ffffff;">
                🚨 EMERGENCY RECOVERY
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; font-weight: bold; color: #111827;">
                Hello ${admin.name || 'Owner'},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Someone (hopefully you!) requested emergency access recovery for your admin account at <strong>GharSe</strong>.
              </p>

              <!-- Recovery Code Box -->
              <div style="margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #92400E; text-transform: uppercase; letter-spacing: 1px;">
                  Your Recovery Code
                </p>
                <p style="margin: 0; font-size: 48px; font-weight: 800; color: #DC2626; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${recoveryCode}
                </p>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Enter this code on the recovery page to regain access to your admin dashboard.
              </p>

              <!-- Expiration Warning -->
              <div style="margin: 30px 0; padding: 16px; background-color: #FEE2E2; border-left: 4px solid #EF4444; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991B1B;">
                  <strong>⏰ This code expires in 15 minutes</strong> for security reasons.
                </p>
              </div>

              <!-- Security Alert -->
              <div style="margin: 20px 0; padding: 16px; background-color: #FEF2F2; border-left: 4px solid #DC2626; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F1D1D;">
                  <strong>⚠️ SECURITY ALERT:</strong> If you didn't request this, someone may be trying to access your account. Contact technical support immediately.
                </p>
              </div>

              <p style="margin: 20px 0 0; font-size: 14px; color: #6B7280;">
                This is an automated security email from GharSe Admin System.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #F9FAFB; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                <strong>GharSe</strong> | Emergency Recovery System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Extract email from EMAIL_FROM format: "Name <email@domain.com>"
      const ownerEmail = OWNER_RECOVERY_EMAIL.includes('<') 
        ? OWNER_RECOVERY_EMAIL.match(/<(.+)>/)?.[1] 
        : OWNER_RECOVERY_EMAIL;

      await sendEmail({
        to: ownerEmail || 'bantusailaja@gmail.com',
        subject: '🚨 EMERGENCY: Your Admin Recovery Code - GharSe',
        html: emailHtml,
      });

      console.log(`✅ Emergency recovery code sent to: ${ownerEmail}`);

      return NextResponse.json({
        success: true,
        message: 'Recovery code sent to your personal email',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid step' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Emergency recovery error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process recovery request',
      },
      { status: 500 }
    );
  }
}

