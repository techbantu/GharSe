/**
 * DATABASE CONNECTION HELPER
 * 
 * Automatically detects and uses the correct database based on DATABASE_URL
 * - SQLite for local development (file:./dev.db)
 * - PostgreSQL/Supabase for production (postgresql://...)
 */

import { PrismaClient } from '@prisma/client';

// Detect database type from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';

const isSQLite = databaseUrl.startsWith('file:');
const isPostgreSQL = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

// Create Prisma client with appropriate configuration
const prismaClientConfig: any = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

// Add SQLite-specific config if needed
if (isSQLite) {
  prismaClientConfig.datasources = {
    db: {
      url: databaseUrl,
    },
  };
}

const prisma = new PrismaClient(prismaClientConfig);

// Test connection on startup
prisma.$connect()
  .then(() => {
    const dbType = isSQLite ? 'SQLite' : isPostgreSQL ? 'PostgreSQL' : 'Unknown';
    console.log(`✅ Database connected: ${dbType}`);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Make sure DATABASE_URL is set correctly in .env');
    
    if (isPostgreSQL) {
      console.error('💡 For Supabase, check:');
      console.error('   1. Connection string format: postgresql://postgres:PASSWORD@HOST:5432/postgres');
      console.error('   2. Password is URL-encoded (%40 for @, etc.)');
      console.error('   3. Database exists and credentials are correct');
    }
  });

export default prisma;

