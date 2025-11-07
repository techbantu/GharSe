#!/usr/bin/env node

/**
 * OpenAI API Key Test Script
 * Tests if your OpenAI API key is valid and working
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
function loadEnv() {
  try {
    const envPath = join(dirname(__dirname), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          let value = values.join('=').trim();
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.error('Error loading .env file:', error.message);
  }
}

loadEnv();

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOpenAIKey() {
  console.log('');
  log('═'.repeat(70), 'cyan');
  log('  🔑 OpenAI API Key Test', 'bright');
  log('═'.repeat(70), 'cyan');
  console.log('');

  // Check if API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    log('❌ OPENAI_API_KEY not found in .env file!', 'red');
    console.log('');
    log('Add this to your .env file:', 'yellow');
    log('OPENAI_API_KEY="sk-proj-..."', 'yellow');
    console.log('');
    process.exit(1);
  }

  log('✓ API key found in .env', 'green');
  log(`  Key preview: ${apiKey.substring(0, 20)}...`, 'cyan');
  console.log('');

  // Test the API key with a simple completion
  log('🧪 Testing API key with OpenAI...', 'cyan');
  console.log('');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Bantu\'s Kitchen!" in one sentence.',
          },
        ],
        max_tokens: 50,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      log('❌ API Key Test FAILED!', 'red');
      console.log('');
      
      if (response.status === 401) {
        log('Error: Invalid API Key', 'red');
        log('  The API key is not valid or has been revoked.', 'yellow');
        console.log('');
        log('Solutions:', 'cyan');
        log('  1. Check your API key at: https://platform.openai.com/api-keys', 'yellow');
        log('  2. Generate a new API key', 'yellow');
        log('  3. Update .env file with the new key', 'yellow');
      } else if (response.status === 429) {
        log('Error: Rate Limit or Quota Exceeded', 'red');
        log('  You may have hit your usage limit or rate limit.', 'yellow');
        console.log('');
        log('Solutions:', 'cyan');
        log('  1. Check your usage at: https://platform.openai.com/usage', 'yellow');
        log('  2. Add payment method or increase quota', 'yellow');
        log('  3. Wait a few minutes and try again', 'yellow');
      } else {
        log(`Error: ${data.error?.message || 'Unknown error'}`, 'red');
        log(`Status: ${response.status}`, 'yellow');
        console.log('');
        log('Full error:', 'cyan');
        console.log(JSON.stringify(data, null, 2));
      }
      
      console.log('');
      process.exit(1);
    }

    // Success!
    log('━'.repeat(70), 'green');
    log('  ✅ SUCCESS! Your OpenAI API Key is Working!', 'green');
    log('━'.repeat(70), 'green');
    console.log('');
    
    log('API Response:', 'cyan');
    const aiMessage = data.choices[0].message.content;
    log(`  "${aiMessage}"`, 'bright');
    console.log('');
    
    log('Key Details:', 'cyan');
    log(`  Model Used: gpt-3.5-turbo`, 'yellow');
    log(`  Tokens Used: ${data.usage?.total_tokens || 'N/A'}`, 'yellow');
    log(`  Organization: ${data.organization || 'Default'}`, 'yellow');
    console.log('');
    
    log('✨ Your AI chat system is ready to use!', 'green');
    log('   Run: npm run dev', 'cyan');
    console.log('');
    
    process.exit(0);

  } catch (error) {
    log('❌ Connection Error!', 'red');
    console.log('');
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      log('Cannot connect to OpenAI servers', 'red');
      log('  Check your internet connection', 'yellow');
    } else {
      log(`Error: ${error.message}`, 'red');
      console.log('');
      log('Full error:', 'cyan');
      console.error(error);
    }
    
    console.log('');
    process.exit(1);
  }
}

testOpenAIKey();

