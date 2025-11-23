/**
 * 🔄 AUTOMATED CREDENTIAL ROTATION SYSTEM
 * 
 * Features:
 * 1. Automatic JWT secret rotation
 * 2. Zero-downtime rotation
 * 3. Old keys still valid during transition
 * 4. Scheduled rotation (every 30 days)
 * 5. Manual emergency rotation
 */

import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface RotationKeyPair {
  current: string;
  previous: string;
  rotatedAt: Date;
  expiresAt: Date;
}

// Store active keys in memory (in production, use Redis or database)
const activeKeys = new Map<string, RotationKeyPair>();

/**
 * Generate cryptographically secure secret
 */
export function generateSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Get current JWT secrets with rotation support
 */
export function getJWTSecrets(): { current: string; previous?: string } {
  const keyPair = activeKeys.get('JWT_SECRET');
  
  if (!keyPair) {
    // First time - use environment variable
    return {
      current: process.env.JWT_SECRET || generateSecret(),
    };
  }
  
  return {
    current: keyPair.current,
    previous: keyPair.previous,
  };
}

/**
 * Rotate JWT secret with zero downtime
 */
export async function rotateJWTSecret(): Promise<{
  success: boolean;
  newSecret: string;
  previousSecret: string;
  message: string;
}> {
  try {
    console.log('🔄 Starting JWT secret rotation...');
    
    // Get current secrets
    const current = activeKeys.get('JWT_SECRET') || {
      current: process.env.JWT_SECRET || generateSecret(),
      previous: '',
      rotatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    
    // Generate new secret
    const newSecret = generateSecret();
    
    // Create new key pair
    const newKeyPair: RotationKeyPair = {
      current: newSecret,
      previous: current.current, // Current becomes previous
      rotatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    
    // Update in memory
    activeKeys.set('JWT_SECRET', newKeyPair);
    
    console.log('✅ JWT secret rotated successfully');
    console.log(`   Previous secret is valid until: ${newKeyPair.expiresAt.toISOString()}`);
    
    return {
      success: true,
      newSecret,
      previousSecret: current.current,
      message: 'JWT secret rotated. Update .env file with new secret.',
    };
    
  } catch (error) {
    console.error('❌ Failed to rotate JWT secret:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      newSecret: '',
      previousSecret: '',
      message: `Rotation failed: ${errorMessage}`,
    };
  }
}

/**
 * Hash secret for storage (never store plaintext)
 */
function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Verify if a secret is valid (current or previous)
 */
export function isSecretValid(secret: string): boolean {
  const keyPair = activeKeys.get('JWT_SECRET');
  
  if (!keyPair) {
    return secret === process.env.JWT_SECRET;
  }
  
  // Check if it's the current secret
  if (secret === keyPair.current) {
    return true;
  }
  
  // Check if it's the previous secret (still in grace period)
  if (secret === keyPair.previous && new Date() < keyPair.expiresAt) {
    return true;
  }
  
  return false;
}

/**
 * Rotate all application secrets
 */
export async function rotateAllSecrets(): Promise<{
  jwtSecret: string;
  adminJwtSecret: string;
  customerJwtSecret: string;
  auditEncryptionKey: string;
}> {
  console.log('🔄 Rotating all application secrets...\n');
  
  const newSecrets = {
    jwtSecret: generateSecret(32),
    adminJwtSecret: generateSecret(32),
    customerJwtSecret: generateSecret(32),
    auditEncryptionKey: generateSecret(32),
  };
  
  // Create backup of current .env
  const envPath = path.join(process.cwd(), '.env');
  const backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);
  
  try {
    const currentEnv = await fs.readFile(envPath, 'utf-8');
    await fs.writeFile(backupPath, currentEnv);
    console.log(`✅ Created backup: ${backupPath}`);
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    throw new Error('Cannot proceed without backup');
  }
  
  // Update .env file
  try {
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    envContent = envContent.replace(
      /JWT_SECRET="[^"]*"/,
      `JWT_SECRET="${newSecrets.jwtSecret}"`
    );
    envContent = envContent.replace(
      /ADMIN_JWT_SECRET="[^"]*"/,
      `ADMIN_JWT_SECRET="${newSecrets.adminJwtSecret}"`
    );
    envContent = envContent.replace(
      /CUSTOMER_JWT_SECRET="[^"]*"/,
      `CUSTOMER_JWT_SECRET="${newSecrets.customerJwtSecret}"`
    );
    
    // Add audit encryption key if missing
    if (!envContent.includes('AUDIT_ENCRYPTION_KEY')) {
      envContent += `\nAUDIT_ENCRYPTION_KEY="${newSecrets.auditEncryptionKey}"\n`;
    } else {
      envContent = envContent.replace(
        /AUDIT_ENCRYPTION_KEY="[^"]*"/,
        `AUDIT_ENCRYPTION_KEY="${newSecrets.auditEncryptionKey}"`
      );
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ Updated .env file with new secrets\n');
    
  } catch (error) {
    console.error('❌ Failed to update .env:', error);
    // Restore from backup
    const backup = await fs.readFile(backupPath, 'utf-8');
    await fs.writeFile(envPath, backup);
    throw new Error('Rotation failed, restored from backup');
  }
  
  console.log('🎉 All secrets rotated successfully!\n');
  console.log('📋 Next steps:');
  console.log('   1. Restart your application');
  console.log('   2. Update production environment variables');
  console.log('   3. Test login functionality');
  console.log('   4. Keep backup file for 7 days then delete\n');
  
  return newSecrets;
}

/**
 * Schedule automatic rotation
 */
export function scheduleAutoRotation(intervalDays: number = 30): NodeJS.Timeout {
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  
  console.log(`📅 Scheduled automatic secret rotation every ${intervalDays} days`);
  
  return setInterval(async () => {
    console.log('🔄 Automatic secret rotation triggered');
    await rotateJWTSecret();
  }, intervalMs);
}

/**
 * CLI script for manual rotation
 */
export async function runRotationScript(): Promise<void> {
  console.log('🔐 CREDENTIAL ROTATION SCRIPT\n');
  console.log('This will rotate all application secrets.\n');
  console.log('⚠️  WARNING: This requires application restart!\n');
  
  // Wait for user confirmation in CLI
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('Do you want to proceed? (yes/no): ', async (answer: string) => {
    if (answer.toLowerCase() === 'yes') {
      try {
        const newSecrets = await rotateAllSecrets();
        console.log('\n✅ Rotation completed successfully!');
        console.log('\n🔑 New secrets generated:');
        console.log('   JWT_SECRET:', newSecrets.jwtSecret.substring(0, 16) + '...');
        console.log('   ADMIN_JWT_SECRET:', newSecrets.adminJwtSecret.substring(0, 16) + '...');
        console.log('   CUSTOMER_JWT_SECRET:', newSecrets.customerJwtSecret.substring(0, 16) + '...');
        console.log('\n⚠️  Remember to restart your application!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('\n❌ Rotation failed:', errorMessage);
      }
    } else {
      console.log('\n❌ Rotation cancelled');
    }
    
    rl.close();
    process.exit(0);
  });
}

// If run directly
if (require.main === module) {
  runRotationScript();
}

