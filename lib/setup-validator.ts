/**
 * SETUP VALIDATOR - Complete Configuration Checker
 * 
 * Purpose: Validate all API keys, configurations, and integrations
 * 
 * This checks EVERY service and tells you EXACTLY what's missing
 */

import { logger } from '@/utils/logger';

export interface ValidationResult {
  category: string;
  service: string;
  status: 'configured' | 'missing' | 'error';
  required: boolean;
  message: string;
  envVars?: string[];
  setupInstructions?: string;
}

export interface SetupStatus {
  overallStatus: 'complete' | 'partial' | 'missing-critical';
  score: number;
  totalChecks: number;
  passedChecks: number;
  results: ValidationResult[];
  criticalIssues: string[];
  recommendations: string[];
}

/**
 * Check if environment variable exists and is not empty
 */
function checkEnv(varName: string): boolean {
  const value = process.env[varName];
  return !!(value && value.trim() !== '' && value !== 'your-' && value !== 'sk-...' && value !== 'pk_test_...');
}

/**
 * Validate Database Configuration
 */
function validateDatabase(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Database URL
  const hasDatabaseUrl = checkEnv('DATABASE_URL');
  results.push({
    category: 'Database',
    service: 'Database Connection',
    status: hasDatabaseUrl ? 'configured' : 'missing',
    required: true,
    message: hasDatabaseUrl 
      ? '✅ Database URL configured' 
      : '❌ DATABASE_URL missing - App cannot function without database',
    envVars: ['DATABASE_URL'],
    setupInstructions: hasDatabaseUrl ? undefined : 
      'Set DATABASE_URL in .env file. For development: file:./dev.db (SQLite) or postgresql://... (PostgreSQL)',
  });

  return results;
}

/**
 * Validate Email Configuration
 */
function validateEmail(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const provider = process.env.EMAIL_PROVIDER || 'smtp';

  // Check SMTP (Gmail)
  if (provider === 'smtp' || !provider) {
    const hasSmtp = checkEnv('SMTP_USER') && checkEnv('SMTP_PASSWORD');
    results.push({
      category: 'Notifications',
      service: 'Email (SMTP/Gmail)',
      status: hasSmtp ? 'configured' : 'missing',
      required: false,
      message: hasSmtp
        ? '✅ SMTP email configured'
        : '⚠️ SMTP not configured - Email notifications won\'t work',
      envVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'],
      setupInstructions: hasSmtp ? undefined :
        'For Gmail: Enable 2FA and create App Password at https://myaccount.google.com/apppasswords\n' +
        'Then set: SMTP_USER=your-email@gmail.com, SMTP_PASSWORD=your-app-password',
    });
  }

  // Check SendGrid
  if (provider === 'sendgrid') {
    const hasSendGrid = checkEnv('SENDGRID_API_KEY');
    results.push({
      category: 'Notifications',
      service: 'Email (SendGrid)',
      status: hasSendGrid ? 'configured' : 'missing',
      required: false,
      message: hasSendGrid
        ? '✅ SendGrid configured'
        : '⚠️ SENDGRID_API_KEY missing - Email notifications won\'t work',
      envVars: ['SENDGRID_API_KEY'],
      setupInstructions: hasSendGrid ? undefined :
        'Sign up at https://sendgrid.com and get API key from Settings > API Keys',
    });
  }

  // Check Resend
  if (provider === 'resend') {
    const hasResend = checkEnv('RESEND_API_KEY');
    results.push({
      category: 'Notifications',
      service: 'Email (Resend)',
      status: hasResend ? 'configured' : 'missing',
      required: false,
      message: hasResend
        ? '✅ Resend configured'
        : '⚠️ RESEND_API_KEY missing - Email notifications won\'t work',
      envVars: ['RESEND_API_KEY'],
      setupInstructions: hasResend ? undefined :
        'Sign up at https://resend.com and get API key from API Keys section',
    });
  }

  return results;
}

/**
 * Validate SMS Configuration
 */
function validateSMS(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const hasTwilio = checkEnv('TWILIO_ACCOUNT_SID') && 
                    checkEnv('TWILIO_AUTH_TOKEN') && 
                    checkEnv('TWILIO_PHONE_NUMBER');

  results.push({
    category: 'Notifications',
    service: 'SMS (Twilio)',
    status: hasTwilio ? 'configured' : 'missing',
    required: false,
    message: hasTwilio
      ? '✅ Twilio SMS configured'
      : '⚠️ Twilio not configured - SMS notifications won\'t work',
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    setupInstructions: hasTwilio ? undefined :
      'Sign up at https://www.twilio.com (₹500 free credit for India)\n' +
      'Get: Account SID, Auth Token from Console Dashboard\n' +
      'Get Phone Number from Phone Numbers > Manage > Buy a Number',
  });

  return results;
}

/**
 * Validate Payment Gateways
 */
function validatePayments(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Razorpay (Primary for India)
  const hasRazorpay = checkEnv('RAZORPAY_KEY_ID') && checkEnv('RAZORPAY_KEY_SECRET');
  results.push({
    category: 'Payments',
    service: 'Razorpay (India)',
    status: hasRazorpay ? 'configured' : 'missing',
    required: false,
    message: hasRazorpay
      ? '✅ Razorpay configured - UPI, Cards, Net Banking, Wallets available'
      : '⚠️ Razorpay not configured - Online payments won\'t work (COD only)',
    envVars: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'],
    setupInstructions: hasRazorpay ? undefined :
      'Sign up at https://razorpay.com\n' +
      'Get API Keys from Dashboard > Settings > API Keys\n' +
      'For webhooks: Dashboard > Settings > Webhooks > Generate Secret',
  });

  // Stripe (International)
  const hasStripe = checkEnv('STRIPE_SECRET_KEY');
  results.push({
    category: 'Payments',
    service: 'Stripe (International)',
    status: hasStripe ? 'configured' : 'missing',
    required: false,
    message: hasStripe
      ? '✅ Stripe configured - Card payments available'
      : '⚠️ Stripe not configured - International payments won\'t work',
    envVars: ['STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    setupInstructions: hasStripe ? undefined :
      'Sign up at https://stripe.com\n' +
      'Get keys from Dashboard > Developers > API keys\n' +
      'For webhooks: Developers > Webhooks > Add endpoint',
  });

  // Check if at least COD is enabled
  const codEnabled = process.env.COD_ENABLED !== 'false';
  if (!hasRazorpay && !hasStripe && !codEnabled) {
    results.push({
      category: 'Payments',
      service: 'Cash on Delivery',
      status: 'missing',
      required: true,
      message: '❌ CRITICAL: No payment method available! Enable COD_ENABLED=true in .env',
      envVars: ['COD_ENABLED'],
      setupInstructions: 'Set COD_ENABLED=true in .env to allow cash on delivery',
    });
  }

  return results;
}

/**
 * Validate Image Storage
 */
function validateImageStorage(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const hasCloudinary = checkEnv('CLOUDINARY_CLOUD_NAME') && 
                        checkEnv('CLOUDINARY_API_KEY') && 
                        checkEnv('CLOUDINARY_API_SECRET');

  results.push({
    category: 'Storage',
    service: 'Cloudinary (Image CDN)',
    status: hasCloudinary ? 'configured' : 'missing',
    required: false,
    message: hasCloudinary
      ? '✅ Cloudinary configured - Images will be optimized and served from CDN'
      : '⚠️ Cloudinary not configured - Images will be stored locally (not recommended for production)',
    envVars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    setupInstructions: hasCloudinary ? undefined :
      'Sign up at https://cloudinary.com (free tier available)\n' +
      'Get credentials from Dashboard > Settings > Access Keys',
  });

  return results;
}

/**
 * Validate Caching
 */
function validateCaching(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const hasRedis = checkEnv('REDIS_URL');

  results.push({
    category: 'Performance',
    service: 'Redis Cache',
    status: hasRedis ? 'configured' : 'missing',
    required: false,
    message: hasRedis
      ? '✅ Redis configured - Fast caching enabled'
      : '⚠️ Redis not configured - App will be slower without caching',
    envVars: ['REDIS_URL'],
    setupInstructions: hasRedis ? undefined :
      'For production: Use Redis Cloud (https://redis.com) or Upstash (https://upstash.com)\n' +
      'For local: docker run -d -p 6379:6379 redis\n' +
      'Then set: REDIS_URL=redis://localhost:6379',
  });

  return results;
}

/**
 * Validate AI Chat
 */
function validateAI(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const hasOpenAI = checkEnv('OPENAI_API_KEY');

  results.push({
    category: 'Features',
    service: 'AI Chat (OpenAI)',
    status: hasOpenAI ? 'configured' : 'missing',
    required: false,
    message: hasOpenAI
      ? '✅ OpenAI configured - AI chat assistant available'
      : '⚠️ OpenAI not configured - AI chat won\'t work',
    envVars: ['OPENAI_API_KEY'],
    setupInstructions: hasOpenAI ? undefined :
      'Sign up at https://platform.openai.com\n' +
      'Get API key from Dashboard > API Keys',
  });

  return results;
}

/**
 * Validate Admin Access
 */
function validateAdmin(): ValidationResult[] {
  const results: ValidationResult[] = [];

  const hasAdminCreds = checkEnv('ADMIN_DEFAULT_EMAIL') && checkEnv('ADMIN_DEFAULT_PASSWORD');

  results.push({
    category: 'Security',
    service: 'Admin Credentials',
    status: hasAdminCreds ? 'configured' : 'missing',
    required: true,
    message: hasAdminCreds
      ? '✅ Admin credentials set'
      : '❌ Admin credentials missing - Cannot access admin dashboard',
    envVars: ['ADMIN_DEFAULT_EMAIL', 'ADMIN_DEFAULT_PASSWORD'],
    setupInstructions: hasAdminCreds ? undefined :
      'Set admin credentials in .env:\n' +
      'ADMIN_DEFAULT_EMAIL=admin@bantuskitchen.com\n' +
      'ADMIN_DEFAULT_PASSWORD=YourSecurePassword123!',
  });

  return results;
}

/**
 * RUN COMPLETE VALIDATION
 */
export async function validateSetup(): Promise<SetupStatus> {
  logger.info('Running complete setup validation...');

  const allResults: ValidationResult[] = [
    ...validateDatabase(),
    ...validateEmail(),
    ...validateSMS(),
    ...validatePayments(),
    ...validateImageStorage(),
    ...validateCaching(),
    ...validateAI(),
    ...validateAdmin(),
  ];

  const totalChecks = allResults.length;
  const passedChecks = allResults.filter(r => r.status === 'configured').length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  // Identify critical issues
  const criticalIssues: string[] = [];
  allResults
    .filter(r => r.required && r.status !== 'configured')
    .forEach(r => {
      criticalIssues.push(`${r.service}: ${r.message}`);
    });

  // Generate recommendations
  const recommendations: string[] = [];
  
  // Email recommendations
  const hasEmail = allResults.some(r => r.category === 'Notifications' && r.service.includes('Email') && r.status === 'configured');
  if (!hasEmail) {
    recommendations.push('🔔 Configure email to send order confirmations to customers');
  }

  // Payment recommendations
  const hasOnlinePayment = allResults.some(r => r.category === 'Payments' && r.status === 'configured');
  if (!hasOnlinePayment) {
    recommendations.push('💳 Configure Razorpay to accept online payments (UPI, cards, etc.)');
  }

  // Cloudinary recommendation
  const hasCloudinary = allResults.some(r => r.service.includes('Cloudinary') && r.status === 'configured');
  if (!hasCloudinary) {
    recommendations.push('📸 Configure Cloudinary for optimized image delivery');
  }

  // Redis recommendation
  const hasRedis = allResults.some(r => r.service.includes('Redis') && r.status === 'configured');
  if (!hasRedis && process.env.NODE_ENV === 'production') {
    recommendations.push('⚡ Configure Redis for better performance in production');
  }

  // Determine overall status
  let overallStatus: 'complete' | 'partial' | 'missing-critical';
  if (criticalIssues.length > 0) {
    overallStatus = 'missing-critical';
  } else if (passedChecks === totalChecks) {
    overallStatus = 'complete';
  } else {
    overallStatus = 'partial';
  }

  logger.info('Setup validation complete', {
    score,
    passedChecks,
    totalChecks,
    criticalIssues: criticalIssues.length,
  });

  return {
    overallStatus,
    score,
    totalChecks,
    passedChecks,
    results: allResults,
    criticalIssues,
    recommendations,
  };
}

/**
 * Test specific service connection
 */
export async function testService(serviceName: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    switch (serviceName) {
      case 'database':
        const { default: prisma } = await import('./prisma');
        await prisma.$queryRaw`SELECT 1`;
        return { success: true, message: 'Database connection successful' };

      case 'redis':
        const { getCached } = await import('./redis-cache');
        await getCached('test');
        return { success: true, message: 'Redis connection successful' };

      case 'email':
        const { default: emailService } = await import('./notifications/email-service');
        const emailConnected = await emailService.testConnection();
        return emailConnected
          ? { success: true, message: 'Email service connected' }
          : { success: false, message: 'Email service connection failed' };

      default:
        return { success: false, message: 'Unknown service' };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Service test failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default {
  validateSetup,
  testService,
};


