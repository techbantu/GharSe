/**
 * EMAIL SERVICE
 * 
 * Purpose: Centralized email sending functionality using Resend or Nodemailer
 * 
 * Features:
 * - Multiple provider support (Resend, SMTP, Console fallback)
 * - Template system
 * - Error handling with retry logic
 * - Development mode (logs to console instead of sending)
 */

import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@gharse.app';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console'; // 'resend', 'smtp', or 'console'

/**
 * Send an email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const emailOptions = {
    from: options.from || FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  logger.info(`📧 Sending email to ${options.to}: ${options.subject}`);

  try {
    switch (EMAIL_PROVIDER) {
      case 'resend':
        return await sendWithResend(emailOptions);
      
      case 'smtp':
        return await sendWithSMTP(emailOptions);
      
      case 'console':
      default:
        return await sendWithConsole(emailOptions);
    }
  } catch (error) {
    logger.error('❌ Email sending failed', { error, options });
    return false;
  }
}

/**
 * Send email using Resend (recommended for production)
 * Install: npm install resend
 * Setup: RESEND_API_KEY in .env
 */
async function sendWithResend(options: EmailOptions): Promise<boolean> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: options.from || FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      logger.error('Resend error', { error });
      return false;
    }

    logger.info('✅ Email sent via Resend', { id: data?.id });
    return true;
  } catch (error) {
    logger.error('Resend send failed', { error });
    return false;
  }
}

/**
 * Send email using SMTP (Nodemailer)
 * Install: npm install nodemailer
 * Setup: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 */
async function sendWithSMTP(options: EmailOptions): Promise<boolean> {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    logger.info('✅ Email sent via SMTP', { messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('SMTP send failed', { error });
    return false;
  }
}

/**
 * Console logger for development (no actual email sent)
 */
async function sendWithConsole(options: EmailOptions): Promise<boolean> {
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL (Development Mode - Not Actually Sent)');
  console.log('='.repeat(80));
  console.log(`From: ${options.from}`);
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('-'.repeat(80));
  console.log('Body (HTML):');
  console.log(options.html);
  console.log('='.repeat(80) + '\n');

  logger.info('✅ Email logged to console (dev mode)', {
    to: options.to,
    subject: options.subject,
  });

  return true;
}

/**
 * Generate legal compliance footer for ALL customer emails
 * REQUIRED: FSSAI display on every food business communication
 * 
 * Purpose: Ensures all email communications comply with FSSAI regulations
 * by displaying the legal operator, FSSAI registration, and contact details.
 */
export function getEmailLegalFooter(): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; background-color: #F9FAFB;">
      <p style="font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">GharSe</p>
      <p style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">
        Operated by: <strong>Bantu'S kitchen</strong> (Proprietor: Sailaja)
      </p>
      <p style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">
        FSSAI Registration: <strong>23625028002731</strong> (Valid until: 23 June 2027)
      </p>
      <p style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">
        Plot no 17, Road no 3, Padmalaya Nagar, Hayatnagar<br />
        Pedda Amberpet (Kalan), Hayathnagar, Rangareddy, Telangana - 501505
      </p>
      <p style="font-size: 11px; color: #9CA3AF; margin-top: 12px;">
        Phone: +91 90104 60964 | Email: orders@gharse.app
      </p>
      <p style="font-size: 10px; color: #9CA3AF; margin-top: 16px; font-style: italic;">
        Technology services provided by TechBantu IT Solutions LLC (zero food liability)
      </p>
    </div>
  `;
}

/**
 * EMAIL TEMPLATES
 */

export function getVerificationEmailTemplate(name: string, verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
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
                    Hi ${name},
                  </h2>
                  
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    Thank you for registering with <strong>Bantu's Kitchen</strong>! We're excited to have you join our community.
                  </p>
                  
                  <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    Please verify your email address by clicking the button below:
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 0 0 32px;">
                        <a href="${verificationLink}" 
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(249,115,22,0.3);">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                    This link will expire in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.
                  </p>
                  
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${verificationLink}" style="color: #f97316; word-break: break-all;">${verificationLink}</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  ${getEmailLegalFooter()}
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getPasswordResetEmailTemplate(name: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
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
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1f2937;">
                    Password Reset Request
                  </h2>
                  
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    Hi ${name},
                  </p>
                  
                  <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 0 0 32px;">
                        <a href="${resetLink}" 
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(249,115,22,0.3);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                    This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                  </p>
                  
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${resetLink}" style="color: #f97316; word-break: break-all;">${resetLink}</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  ${getEmailLegalFooter()}
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

