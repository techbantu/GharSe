/**
 * TEST EMAIL NOTIFICATIONS API
 * 
 * Purpose: Test all email notification types to verify Gmail SMTP setup
 * Usage: POST /api/test-email with { type: 'order_confirmation' | 'status_update' | 'verification' | 'password_reset', email: 'test@example.com' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getVerificationEmailTemplate, getPasswordResetEmailTemplate } from '@/lib/email-service';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, testData } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required', success: false },
        { status: 400 }
      );
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'order_confirmation':
        subject = `Test Order Confirmation - BK-TEST-${Date.now()}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation Test</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%); padding: 40px 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800;">
                          🍽️ Bantu's Kitchen
                        </h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                          From Real Homes To Your Hungry Heart
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1f2937;">
                          🎉 Test Email - Order Confirmation
                        </h2>
                        
                        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          This is a <strong>test email</strong> to verify your order confirmation emails are working!
                        </p>
                        
                        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #1f2937;">
                            Test Order Details
                          </h3>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Number:</td>
                              <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">BK-TEST-${Date.now()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Items:</td>
                              <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">Test Butter Chicken x2</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total:</td>
                              <td style="padding: 8px 0; color: #f97316; font-weight: 700; text-align: right; font-size: 18px;">₹999.00</td>
                            </tr>
                          </table>
                        </div>
                        
                        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                          ✅ If you received this email, your <strong>order confirmation</strong> emails are working perfectly!
                        </p>
                        
                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-top: 24px;">
                          <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
                            ✓ Gmail SMTP is configured correctly<br/>
                            ✓ Email templates are loading<br/>
                            ✓ Customers will receive order confirmations
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">
                          Bantu's Kitchen - Test Email
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          This is a test email sent on ${new Date().toLocaleString()}
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
        break;

      case 'status_update':
        subject = 'Test - Order Status Update';
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%); padding: 40px; text-align: center;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800;">🍽️ Bantu's Kitchen</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 16px; font-size: 24px; color: #1f2937;">👨‍🍳 Test - Order Status Update</h2>
                        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563;">Your order is now <strong style="color: #f97316;">PREPARING</strong>!</p>
                        <div style="background-color: #fff7ed; padding: 20px; border-radius: 12px; border-left: 4px solid #f97316;">
                          <p style="margin: 0; color: #9a3412; font-weight: 600;">✅ Status update emails working!</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
        break;

      case 'verification':
        subject = 'Test - Email Verification';
        html = getVerificationEmailTemplate(
          'Test User',
          `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=TEST_TOKEN_${Date.now()}`
        );
        break;

      case 'password_reset':
        subject = 'Test - Password Reset';
        html = getPasswordResetEmailTemplate(
          'Test User',
          `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=TEST_TOKEN_${Date.now()}`
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: order_confirmation, status_update, verification, or password_reset', success: false },
          { status: 400 }
        );
    }

    // Send the email
    logger.info('Sending test email', { type, email, subject });
    
    const success = await sendEmail({
      to: email,
      subject,
      html,
    });

    if (success) {
      logger.info('Test email sent successfully', { type, email });
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}!`,
        type,
        details: {
          subject,
          sentAt: new Date().toISOString(),
          provider: 'Gmail SMTP',
          from: process.env.EMAIL_FROM,
        },
      });
    } else {
      logger.error('Failed to send test email', { type, email });
      return NextResponse.json(
        { error: 'Failed to send email', success: false },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Test email API error', { error });
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// GET endpoint to show available test types
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Email Test API - Send POST request to test emails',
    availableTypes: [
      'order_confirmation',
      'status_update',
      'verification',
      'password_reset',
    ],
    usage: {
      method: 'POST',
      body: {
        type: 'order_confirmation',
        email: 'bantusailaja@gmail.com',
      },
    },
    configuration: {
      provider: 'Gmail SMTP',
      from: process.env.EMAIL_FROM,
      smtpHost: process.env.SMTP_HOST,
      configured: !!process.env.SMTP_PASS,
    },
  });
}

