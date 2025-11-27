/**
 * EMAIL VERIFICATION SERVICE
 * 
 * Purpose: Handle email verification tokens and sending verification emails
 * 
 * Features:
 * - Generate verification tokens (32-byte hex)
 * - Send verification emails via Resend
 * - Token expiry: 24 hours
 * - Re-send with rate limiting
 * 
 * Architecture: Production-grade email handling with circuit breaker pattern
 */

import { generateRandomToken } from './auth-customer';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Generate and store email verification token
 * 
 * @param customerId - Customer ID
 * @param email - Customer email
 * @returns Promise<string> - Verification token
 */
export async function generateEmailVerificationToken(
  customerId: string,
  email: string
): Promise<string> {
  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      },
    });
    
    logger.info('Email verification token generated', {
      customerId,
      email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
      expiresAt,
    });
    
    return token;
  } catch (error) {
    logger.error('Failed to generate email verification token', {
      customerId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to generate verification token');
  }
}

/**
 * Verify email verification token
 * 
 * @param token - Verification token
 * @returns Promise<{ valid: boolean; customerId?: string; message?: string }>
 */
export async function verifyEmailToken(
  token: string
): Promise<{ valid: boolean; customerId?: string; message?: string }> {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });
    
    if (!customer) {
      return {
        valid: false,
        message: 'Invalid or expired verification token',
      };
    }
    
    // Mark email as verified
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
    
    logger.info('Email verified successfully', {
      customerId: customer.id,
      email: customer.email.substring(0, 3) + '***',
    });
    
    return {
      valid: true,
      customerId: customer.id,
    };
  } catch (error) {
    logger.error('Email verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      valid: false,
      message: 'Verification failed. Please try again.',
    };
  }
}

/**
 * Send verification email
 * 
 * @param email - Customer email
 * @param name - Customer name
 * @param token - Verification token
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  try {
    // Import email service
    const { sendEmail, getVerificationEmailTemplate } = await import('./email-service');
    
    // Send email with template
    const htmlContent = getVerificationEmailTemplate(name, verificationUrl);
    const sent = await sendEmail({
      to: email,
      subject: 'Verify Your Email Address for Bantu\'s Kitchen',
      html: htmlContent,
    });
    
    if (sent) {
      logger.info('Email verification sent successfully', {
        email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
        name,
      });
    }
    
    return sent;
  } catch (error) {
    logger.error('Failed to send verification email', {
      email: email.substring(0, 3) + '***',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Generate and send password reset token
 * 
 * @param email - Customer email
 * @returns Promise<{ success: boolean; message: string }>
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; message: string; emailExists?: boolean }> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      // CHANGED: Now explicitly tell user email doesn't exist
      // User requested clear feedback instead of ambiguous security message
      logger.info('Password reset attempted for non-existent email', {
        email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
      });

      return {
        success: false,
        emailExists: false,
        message: 'No account found with this email address. Please register to create an account.',
      };
    }
    
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
    
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    // Send password reset email
    const { sendEmail, getPasswordResetEmailTemplate } = await import('./email-service');
    const htmlContent = getPasswordResetEmailTemplate(customer.name, resetUrl);
    const emailSent = await sendEmail({
      to: email,
      subject: 'Reset Your Password for Bantu\'s Kitchen',
      html: htmlContent,
    });
    
    if (emailSent) {
      logger.info('Password reset email sent', {
        customerId: customer.id,
        email: email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
      });

      return {
        success: true,
        emailExists: true,
        message: 'Password reset link has been sent to your email address.',
      };
    } else {
      logger.warn('Password reset email failed to send', {
        customerId: customer.id,
        email: email.substring(0, 3) + '***',
      });

      return {
        success: false,
        emailExists: true,
        message: 'Failed to send password reset email. Please try again.',
      };
    }
  } catch (error) {
    logger.error('Failed to send password reset email', {
      email: email.substring(0, 3) + '***',
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to send password reset email. Please try again.',
    };
  }
}

/**
 * Verify password reset token
 * 
 * @param token - Reset token
 * @returns Promise<{ valid: boolean; customerId?: string; message?: string }>
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ valid: boolean; customerId?: string; message?: string }> {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });
    
    if (!customer) {
      return {
        valid: false,
        message: 'Invalid or expired reset token',
      };
    }
    
    return {
      valid: true,
      customerId: customer.id,
    };
  } catch (error) {
    logger.error('Password reset token verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      valid: false,
      message: 'Verification failed. Please try again.',
    };
  }
}

