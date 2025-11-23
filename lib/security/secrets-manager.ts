/**
 * 🔒 MILITARY-GRADE SECRETS MANAGER
 * 
 * This module ensures NO SECRETS are ever exposed:
 * - All secrets loaded from environment ONLY
 * - Validates presence before app starts
 * - Throws errors if secrets missing (fail-fast)
 * - Never logs actual secret values
 * - Redacts secrets in error messages
 */

import * as crypto from 'crypto';

/**
 * Secret validation error
 */
export class SecretValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecretValidationError';
  }
}

/**
 * Validate that a secret exists and meets minimum security requirements
 */
function validateSecret(name: string, value: string | undefined, minLength: number = 32): string {
  if (!value || value.trim() === '') {
    throw new SecretValidationError(
      `🚨 CRITICAL: Missing secret "${name}". Add it to your .env file!`
    );
  }

  // Check for placeholder values
  const placeholders = ['your-', 'example', 'test', 'demo', 'changeme', '...', 'xxxxxx'];
  if (placeholders.some(p => value.toLowerCase().includes(p))) {
    throw new SecretValidationError(
      `🚨 CRITICAL: Secret "${name}" contains placeholder value. Set a real value in .env!`
    );
  }

  // Check minimum length for cryptographic secrets
  if (name.includes('SECRET') || name.includes('JWT') || name.includes('KEY')) {
    if (value.length < minLength) {
      throw new SecretValidationError(
        `🚨 CRITICAL: Secret "${name}" is too short (${value.length} chars). Minimum: ${minLength} chars.`
      );
    }
  }

  return value;
}

/**
 * Generate a cryptographically secure random secret
 */
export function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Redact sensitive information from strings (for logging)
 */
export function redactSecret(secret: string): string {
  if (!secret || secret.length < 8) return '[REDACTED]';
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

/**
 * Secrets Manager - Central place for all application secrets
 */
class SecretsManager {
  private secrets: Map<string, string> = new Map();
  private isInitialized = false;

  /**
   * Initialize and validate all secrets
   * MUST be called before accessing any secrets
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('⚠️  SecretsManager already initialized');
      return;
    }

    console.log('🔒 Initializing Secrets Manager...');

    try {
      // Database
      this.set('DATABASE_URL', validateSecret('DATABASE_URL', process.env.DATABASE_URL, 20));

      // Authentication
      this.set('JWT_SECRET', validateSecret('JWT_SECRET', process.env.JWT_SECRET, 32));
      this.set('ADMIN_JWT_SECRET', validateSecret('ADMIN_JWT_SECRET', process.env.ADMIN_JWT_SECRET, 32));
      this.set('CUSTOMER_JWT_SECRET', validateSecret('CUSTOMER_JWT_SECRET', process.env.CUSTOMER_JWT_SECRET, 32));
      this.set('NEXTAUTH_SECRET', validateSecret('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET, 32));

      // Admin credentials (for initial seed only)
      if (process.env.ADMIN_DEFAULT_EMAIL) {
        this.set('ADMIN_DEFAULT_EMAIL', process.env.ADMIN_DEFAULT_EMAIL);
      }
      if (process.env.ADMIN_DEFAULT_PASSWORD) {
        this.set('ADMIN_DEFAULT_PASSWORD', process.env.ADMIN_DEFAULT_PASSWORD);
      }

      // Email
      if (process.env.SMTP_PASSWORD) {
        this.set('SMTP_PASSWORD', process.env.SMTP_PASSWORD);
      }

      // Cloudinary
      if (process.env.CLOUDINARY_API_SECRET) {
        this.set('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET);
      }

      // OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.set('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
      }

      // Payment gateways (optional)
      if (process.env.STRIPE_SECRET_KEY) {
        this.set('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY);
      }

      this.isInitialized = true;
      console.log('✅ Secrets Manager initialized successfully');
      console.log(`   Total secrets loaded: ${this.secrets.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Secrets Manager:', error);
      throw error;
    }
  }

  /**
   * Set a secret (private)
   */
  private set(name: string, value: string): void {
    this.secrets.set(name, value);
  }

  /**
   * Get a secret value
   * @throws {Error} if secret not found or manager not initialized
   */
  get(name: string): string {
    if (!this.isInitialized) {
      throw new Error('❌ SecretsManager not initialized. Call initialize() first!');
    }

    const value = this.secrets.get(name);
    if (!value) {
      throw new Error(`❌ Secret "${name}" not found. Check your .env file.`);
    }

    return value;
  }

  /**
   * Get a secret value safely (returns undefined if not found)
   */
  getSafe(name: string): string | undefined {
    if (!this.isInitialized) {
      return undefined;
    }
    return this.secrets.get(name);
  }

  /**
   * Check if a secret exists
   */
  has(name: string): boolean {
    return this.secrets.has(name);
  }

  /**
   * Clear all secrets from memory (for cleanup)
   */
  clear(): void {
    this.secrets.clear();
    this.isInitialized = false;
    console.log('🔒 Secrets Manager cleared');
  }

  /**
   * Get diagnostic info (NO ACTUAL SECRETS!)
   */
  getDiagnostics(): Record<string, string> {
    const diagnostics: Record<string, string> = {};

    this.secrets.forEach((value, key) => {
      diagnostics[key] = redactSecret(value);
    });

    return diagnostics;
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();

// Helper functions for common secrets
export const getSecret = {
  database: () => secretsManager.get('DATABASE_URL'),
  jwtSecret: () => secretsManager.get('JWT_SECRET'),
  adminJwtSecret: () => secretsManager.get('ADMIN_JWT_SECRET'),
  customerJwtSecret: () => secretsManager.get('CUSTOMER_JWT_SECRET'),
  nextAuthSecret: () => secretsManager.get('NEXTAUTH_SECRET'),
  
  // Optional secrets
  smtpPassword: () => secretsManager.getSafe('SMTP_PASSWORD'),
  cloudinarySecret: () => secretsManager.getSafe('CLOUDINARY_API_SECRET'),
  openAiKey: () => secretsManager.getSafe('OPENAI_API_KEY'),
  stripeSecret: () => secretsManager.getSafe('STRIPE_SECRET_KEY'),
};

