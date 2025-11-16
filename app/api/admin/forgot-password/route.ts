/**
 * ADMIN FORGOT PASSWORD API
 * 
 * Purpose: Send password reset email to admin
 * Security: Generates secure token with 1-hour expiration
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if admin exists
    const admin = await (prisma.admin.findUnique as any)({
      where: { email: normalizedEmail },
    });

    // Always return success for security (don't reveal if email exists)
    if (!admin) {
      console.log(`Password reset requested for non-existent admin: ${normalizedEmail}`);
      return NextResponse.json({
        success: true,
        message: 'If that email exists, we sent a reset link',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await (prisma.admin.update as any)({
      where: { id: admin.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: resetTokenExpiry,
      },
    });

    // Create reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

    // Send email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Admin Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">
                🔐 Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Hello <strong>${admin.name || 'Admin'}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                We received a request to reset your admin password for <strong>GharSe</strong>. 
                Click the button below to create a new password:
              </p>

              <!-- Reset Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(to right, #F97316, #EA580C); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #6B7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px; padding: 12px; background-color: #F3F4F6; border-radius: 8px; font-size: 12px; word-break: break-all; color: #374151;">
                ${resetUrl}
              </p>

              <!-- Security Note -->
              <div style="margin: 30px 0; padding: 16px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400E;">
                  <strong>⏰ This link expires in 1 hour</strong> for security reasons.
                </p>
              </div>

              <div style="margin: 20px 0; padding: 16px; background-color: #FEE2E2; border-left: 4px solid #EF4444; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991B1B;">
                  <strong>⚠️ Didn't request this?</strong> Ignore this email and your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #F9FAFB; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6B7280;">
                <strong>GharSe</strong> Admin Dashboard
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                This is an automated email. Please do not reply.
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

    await sendEmail({
      to: admin.email,
      subject: '🔐 Reset Your Admin Password - GharSe',
      html: emailHtml,
    });

    console.log(`✅ Password reset email sent to: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email',
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process reset request',
      },
      { status: 500 }
    );
  }
}

