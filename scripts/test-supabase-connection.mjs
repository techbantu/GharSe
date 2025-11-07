#!/usr/bin/env node

/**
 * Test Supabase connection
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n🔍 Testing Supabase connection...\n');

try {
  await prisma.$connect();
  console.log('✅ Connection successful!');
  
  // Try a simple query
  const result = await prisma.$queryRaw`SELECT version()`;
  console.log('✅ Database version:', result);
  
  await prisma.$disconnect();
  console.log('\n✅ Supabase is connected and ready!\n');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('\n💡 Solutions:');
  console.error('   1. Check your Supabase password is correct');
  console.error('   2. Make sure your IP is allowed (disable RLS or add to allowed IPs)');
  console.error('   3. Try the "Direct connection" string from Supabase dashboard');
  console.error('   4. Go to Supabase → Settings → Database → Connection string\n');
  process.exit(1);
}

