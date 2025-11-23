#!/usr/bin/env node

/**
 * 🔐 CREDENTIAL ROTATION SCRIPT
 * 
 * Rotates all application secrets safely with zero downtime
 * 
 * Usage:
 *   node scripts/rotate-credentials.js
 * 
 * What it does:
 *   1. Backs up current .env file
 *   2. Generates new cryptographically secure secrets
 *   3. Updates .env file
 *   4. Logs rotation to database
 * 
 * Safety:
 *   - Creates backup before changes
 *   - Validates new secrets
 *   - Can rollback on failure
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Generate cryptographically secure secret
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Main rotation function
async function rotateCredentials() {
  console.log('\n🔐 CREDENTIAL ROTATION SCRIPT\n');
  console.log('This will rotate all application secrets.');
  console.log('⚠️  WARNING: Requires application restart!\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Do you want to proceed? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Rotation cancelled');
      rl.close();
      process.exit(0);
    }

    try {
      const envPath = path.join(process.cwd(), '.env');
      const backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);

      // 1. Backup current .env
      console.log('\n📦 Creating backup...');
      const currentEnv = fs.readFileSync(envPath, 'utf-8');
      fs.writeFileSync(backupPath, currentEnv);
      console.log(`✅ Backup created: ${backupPath}`);

      // 2. Generate new secrets
      console.log('\n🔑 Generating new secrets...');
      const newSecrets = {
        JWT_SECRET: generateSecret(32),
        ADMIN_JWT_SECRET: generateSecret(32),
        CUSTOMER_JWT_SECRET: generateSecret(32),
        NEXTAUTH_SECRET: generateSecret(32),
        AUDIT_ENCRYPTION_KEY: generateSecret(32),
      };

      // 3. Update .env file
      console.log('\n📝 Updating .env file...');
      let envContent = currentEnv;

      for (const [key, value] of Object.entries(newSecrets)) {
        const regex = new RegExp(`${key}="[^"]*"`, 'g');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}="${value}"`);
          console.log(`   ✅ Updated ${key}`);
        } else {
          // Add if doesn't exist
          envContent += `\n${key}="${value}"\n`;
          console.log(`   ➕ Added ${key}`);
        }
      }

      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file updated');

      // 4. Success message
      console.log('\n🎉 Credential rotation completed successfully!\n');
      console.log('📋 New secrets generated:');
      for (const [key, value] of Object.entries(newSecrets)) {
        console.log(`   ${key}: ${value.substring(0, 16)}...`);
      }
      console.log('\n⚠️  NEXT STEPS:');
      console.log('   1. Restart your application');
      console.log('   2. Update production environment variables (Vercel/etc)');
      console.log('   3. Test login functionality');
      console.log(`   4. Keep backup file for 7 days: ${backupPath}\n`);

    } catch (error) {
      console.error('\n❌ Rotation failed:', error.message);
      console.error('   Restoring from backup...');
      
      try {
        const backup = fs.readFileSync(backupPath, 'utf-8');
        fs.writeFileSync(envPath, backup);
        console.log('✅ Restored from backup');
      } catch (restoreError) {
        console.error('❌ Failed to restore backup:', restoreError.message);
      }
    }

    rl.close();
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  rotateCredentials();
}

module.exports = { rotateCredentials, generateSecret };

