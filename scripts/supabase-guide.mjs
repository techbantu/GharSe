#!/usr/bin/env node

/**
 * INTERACTIVE SUPABASE SETUP GUIDE
 * Shows step-by-step instructions
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.clear();
console.log('\n' + '═'.repeat(80));
console.log('🎯 SUPABASE SETUP GUIDE - GET YOUR ORDERS INTO THE CLOUD');
console.log('═'.repeat(80));

console.log('\n📊 CURRENT STATUS:');
console.log('   ✅ Your app is running');
console.log('   ✅ Orders are saving (to local SQLite file)');
console.log('   ❌ Supabase database is empty');
console.log('\n🎯 GOAL: Move everything to Supabase in 2 steps\n');

console.log('═'.repeat(80));
console.log('📋 STEP 1: CREATE TABLES IN SUPABASE (30 SECONDS)');
console.log('═'.repeat(80));

console.log('\n🔗 1. Open this URL in your browser:\n');
console.log('   👉 https://supabase.com/dashboard/project/jkacjjusycmjwtcedeqf/sql/new\n');

console.log('📄 2. Copy the SQL schema (I\'ll show it below)\n');
console.log('📋 3. Paste into Supabase SQL Editor\n');
console.log('▶️  4. Click the "RUN" button\n');
console.log('✅ 5. Wait 2 seconds - Done!\n');

console.log('─'.repeat(80));
console.log('📄 SQL TO COPY (select all and copy):');
console.log('─'.repeat(80));
console.log('');

// Read and display first 20 lines of SQL
const sqlPath = join(projectRoot, 'supabase-schema.sql');
if (existsSync(sqlPath)) {
  const sqlContent = readFileSync(sqlPath, 'utf-8');
  const lines = sqlContent.split('\n');
  
  console.log('File location: supabase-schema.sql');
  console.log('');
  console.log('First few lines (preview):');
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  lines.slice(0, 20).forEach(line => {
    console.log('│ ' + line.padEnd(63) + '│');
  });
  console.log('│ ... (and more - copy the entire file)                          │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('📌 To copy the entire file:');
  console.log('   Mac:   cat supabase-schema.sql | pbcopy');
  console.log('   Or:    Open supabase-schema.sql and Cmd+A, Cmd+C');
} else {
  console.log('❌ supabase-schema.sql not found!');
}

console.log('\n' + '═'.repeat(80));
console.log('✅ AFTER STEP 1: You should see this in Supabase:');
console.log('═'.repeat(80));
console.log('');
console.log('   Supabase Dashboard → Database → Tables:');
console.log('   ✅ MenuItem');
console.log('   ✅ Customer');
console.log('   ✅ CustomerAddress');
console.log('   ✅ Order');
console.log('   ✅ OrderItem');
console.log('   ✅ Admin');
console.log('   ✅ Receipt');
console.log('   ✅ ConversationAnalytics');
console.log('');

console.log('═'.repeat(80));
console.log('🌱 STEP 2: SEED DATA (FULLY AUTOMATED - 10 SECONDS)');
console.log('═'.repeat(80));
console.log('');
console.log('   After Step 1 is done, run this command:');
console.log('');
console.log('   👉 npm run seed:supabase');
console.log('');
console.log('   This will automatically:');
console.log('   ✅ Insert 22 menu items (Butter Chicken, Biryani, etc.)');
console.log('   ✅ Create admin user (admin@bantuskitchen.com)');
console.log('   ✅ Set up all data via REST API');
console.log('   ✅ Zero manual data entry!');
console.log('');

console.log('═'.repeat(80));
console.log('🚀 STEP 3: SWITCH YOUR APP TO SUPABASE (5 SECONDS)');
console.log('═'.repeat(80));
console.log('');
console.log('   After Step 2 completes, switch your app:');
console.log('');
console.log('   👉 Update DATABASE_URL in .env to:');
console.log('');
console.log('   DATABASE_URL="postgresql://postgres:PASSWORD@db.jkacjjusycmjwtcedeqf.supabase.co:5432/postgres"');
console.log('');
console.log('   (Replace PASSWORD with your actual password)');
console.log('');
console.log('   Then run:');
console.log('   👉 npm run dev');
console.log('');

console.log('═'.repeat(80));
console.log('🎉 FINAL RESULT:');
console.log('═'.repeat(80));
console.log('');
console.log('   ✅ Orders save to Supabase PostgreSQL');
console.log('   ✅ Admin dashboard shows orders from Supabase');
console.log('   ✅ AI chat reads real-time data from Supabase');
console.log('   ✅ Database accessible from anywhere');
console.log('   ✅ Auto-backups by Supabase');
console.log('   ✅ Scales to millions of orders');
console.log('');

console.log('═'.repeat(80));
console.log('🎯 READY? START WITH STEP 1 NOW!');
console.log('═'.repeat(80));
console.log('');
console.log('   Go to: https://supabase.com/dashboard/project/jkacjjusycmjwtcedeqf/sql/new');
console.log('');
console.log('   Questions? Check: DATABASE_STATUS.md');
console.log('');

