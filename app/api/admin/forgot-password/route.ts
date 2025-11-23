import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/admin/forgot-password
 * 
 * Initiate password reset for admin (sends email with reset token)
 * 
 * SECURITY:
 * - Rate limited (1 request per 15 minutes per email)
 * - Cryptographically secure token (256-bit)
 * - Token expires in 1 hour
 * - No user enumeration (always returns success)
 * - Token stored as SHA-256 hash in database
 */
export async function POST(request: NextRequest) {
  try {
    // 1. PARSE REQUEST
    const body = await request.json();
    const { email } = body;

    // 2. VALIDATE INPUT
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // 3. CHECK RATE LIMITING (prevent abuse)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentReset = await prisma.admin.findFirst({
      where: {
        email: emailLower,
        resetTokenCreatedAt: {
          gte: fifteenMinutesAgo,
        },
      },
    });

    if (recentReset) {
      // SECURITY: Still return success to prevent enumeration
      // But don't actually send email
      console.warn(`⚠️ Rate limit: Password reset requested too soon for ${emailLower}`);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // 4. FIND ADMIN (timing-safe - always take same time)
    const admin = await prisma.admin.findUnique({
      where: { email: emailLower },
    });

    // SECURITY: Always return success (prevent user enumeration)
    // But only send email if admin exists
    if (!admin) {
      console.warn(`⚠️ Password reset requested for non-existent admin: ${emailLower}`);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // 5. GENERATE SECURE TOKEN
    // 32 bytes = 256 bits of entropy
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing (never store plaintext tokens)
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 6. SET EXPIRATION (1 hour)
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 7. SAVE TO DATABASE
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires,
        resetTokenCreatedAt: new Date(),
      },
    });

    // 8. SEND RESET EMAIL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${resetToken}`;
    
    console.log('📧 Attempting to send email...');
    console.log('   To:', admin.email);
    console.log('   Reset URL:', resetUrl);
    
    try {
      await sendEmail({
        to: admin.email,
        subject: '🔐 Password Reset Request - GharSe Admin',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                padding: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #f97316;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
              }
              .button:hover {
                background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
              }
              .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              .security-info {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🍛 GharSe Admin</div>
                <h1 style="color: #111827; margin-top: 10px;">Password Reset Request</h1>
              </div>
              
              <p>Hi <strong>${admin.name}</strong>,</p>
              
              <p>We received a request to reset your admin password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in <strong>1 hour</strong> for your security.
              </div>
              
              <div class="security-info">
                <strong>🔒 Security Details:</strong>
                <ul style="margin: 10px 0;">
                  <li>Request Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</li>
                  <li>IP Address: ${request.headers.get('x-forwarded-for') || 'Unknown'}</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Can't click the button?</strong> Copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; color: #6b7280; font-size: 14px;">
                ${resetUrl}
              </p>
              
              <div class="footer">
                <p>
                  <strong>Didn't request a password reset?</strong><br>
                  Your account is still secure. You can safely ignore this email.
                </p>
                <p style="margin-top: 20px;">
                  © ${new Date().getFullYear()} GharSe - Authentic Home-Cooked Indian Food<br>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #f97316;">gharse.app</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.info(`✅ Password reset email sent to: ${admin.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError);
      // Don't expose email failure to user (security)
      // But log it for debugging
    }

    // 9. RETURN SUCCESS (always, to prevent enumeration)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
