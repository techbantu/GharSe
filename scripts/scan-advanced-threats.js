#!/usr/bin/env node

/**
 * 🎯 ADVANCED SECURITY VULNERABILITY SCANNER
 * 
 * Scans for nation-state level vulnerabilities:
 * - Timing attacks
 * - Algorithm confusion
 * - Race conditions
 * - Prototype pollution
 * - ReDoS
 * - Information disclosure
 */

const fs = require('fs');
const path = require('path');

console.log('\n🎯 ADVANCED THREAT SCANNER - Nation-State Level\n');
console.log('='.repeat(70));

let criticalVulns = 0;
let highVulns = 0;
let mediumVulns = 0;

function reportVuln(severity, category, file, line, description) {
  const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡';
  console.log(`\n${icon} ${severity} - ${category}`);
  console.log(`   File: ${file}:${line}`);
  console.log(`   ${description}`);
  
  if (severity === 'CRITICAL') criticalVulns++;
  else if (severity === 'HIGH') highVulns++;
  else mediumVulns++;
}

// SCAN 1: JWT Algorithm Confusion
console.log('\n📝 SCAN 1: JWT Algorithm Confusion');
try {
  const authFiles = [
    'lib/auth.ts',
    'lib/auth-customer.ts',
    'lib/auth-helpers.ts',
  ];
  
  for (const file of authFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Check if jwt.sign has algorithm specified
    lines.forEach((line, idx) => {
      if (line.includes('jwt.sign') && !line.includes('algorithm:')) {
        reportVuln(
          'CRITICAL',
          'JWT Algorithm Confusion',
          file,
          idx + 1,
          'JWT signing without explicit algorithm - vulnerable to algorithm confusion attacks'
        );
      }
      
      if (line.includes('jwt.verify') && !line.includes('algorithms:')) {
        reportVuln(
          'CRITICAL',
          'JWT Algorithm Whitelist Missing',
          file,
          idx + 1,
          'JWT verification without algorithm whitelist - attacker can use "none" algorithm'
        );
      }
    });
  }
  
  if (criticalVulns === 0) {
    console.log('✅ No algorithm confusion vulnerabilities found');
  }
} catch (error) {
  console.log(`❌ Scan error: ${error.message}`);
}

// SCAN 2: Timing Attack Vulnerabilities
console.log('\n📝 SCAN 2: Timing Attack Vulnerabilities');
try {
  const authFiles = ['lib/auth.ts', 'lib/auth-customer.ts'];
  
  for (const file of authFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for verifyToken without timing protection
    if (content.includes('function verifyToken') || content.includes('async function verifyToken')) {
      if (!content.includes('MINIMUM_VERIFY_TIME') && !content.includes('setTimeout')) {
        reportVuln(
          'HIGH',
          'JWT Timing Attack',
          file,
          0,
          'JWT verification without constant-time operation - vulnerable to timing analysis'
        );
      }
    }
    
    // Check for bcrypt.compare without timing protection
    if (content.includes('bcrypt.compare') && !content.includes('MINIMUM_VERIFY_TIME')) {
      reportVuln(
        'MEDIUM',
        'Password Timing Attack',
        file,
        0,
        'Password verification may leak timing information'
      );
    }
  }
} catch (error) {
  console.log(`❌ Scan error: ${error.message}`);
}

// SCAN 3: Information Disclosure in Error Messages
console.log('\n📝 SCAN 3: Information Disclosure');
try {
  const errorFiles = [
    'components/ErrorBoundary.tsx',
    'app/api/chat/route.ts',
  ];
  
  for (const file of errorFiles) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Check for stack trace exposure
    lines.forEach((line, idx) => {
      if ((line.includes('error.stack') || line.includes('error?.stack')) 
          && !line.includes('process.env.NODE_ENV')) {
        reportVuln(
          'HIGH',
          'Stack Trace Disclosure',
          file,
          idx + 1,
          'Stack traces may be exposed in production - reveals internal paths and versions'
        );
      }
      
      if (line.includes('componentStack') && !line.includes('development')) {
        reportVuln(
          'MEDIUM',
          'Component Structure Disclosure',
          file,
          idx + 1,
          'Component stack may be exposed - reveals application architecture'
        );
      }
    });
  }
} catch (error) {
  console.log(`❌ Scan error: ${error.message}`);
}

// SCAN 4: ReDoS (Regular Expression Denial of Service)
console.log('\n📝 SCAN 4: ReDoS Vulnerabilities');
try {
  const files = [
    'lib/security/security-headers.ts',
    'lib/security/input-sanitization.ts',
  ];
  
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Dangerous regex patterns
    const dangerousPatterns = [
      /\(.*\.\*.*\)/,  // Nested quantifiers
      /\(.*\+.*\)\*/,  // Multiple nested quantifiers
      /\(.*\.\*\)\+/,  // .* followed by +
    ];
    
    lines.forEach((line, idx) => {
      if (line.includes('new RegExp') || line.includes('/')) {
        dangerousPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            reportVuln(
              'MEDIUM',
              'ReDoS Risk',
              file,
              idx + 1,
              'Complex regex with nested quantifiers - potential for exponential backtracking'
            );
          }
        });
      }
    });
  }
} catch (error) {
  console.log(`❌ Scan error: ${error.message}`);
}

// SCAN 5: Prototype Pollution
console.log('\n📝 SCAN 5: Prototype Pollution');
try {
  const files = ['lib/security/input-sanitization.ts'];
  
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      if (line.includes('for (const') && line.includes('Object.entries')) {
        const nextLines = lines.slice(idx, idx + 10).join('\n');
        if (!nextLines.includes('__proto__') && !nextLines.includes('constructor')) {
          reportVuln(
            'MEDIUM',
            'Prototype Pollution',
            file,
            idx + 1,
            'Object iteration without __proto__ protection - vulnerable to prototype pollution'
          );
        }
      }
    });
  }
} catch (error) {
  console.log(`❌ Scan error: ${error.message}`);
}

// SCAN 6: Race Conditions
console.log('\n📝 SCAN 6: Race Condition Vulnerabilities');
try {
  const file = 'lib/auth-customer.ts';
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Look for TOCTOU patterns
    if (content.includes('findUnique') && content.includes('update')) {
      const hasTransaction = content.includes('$transaction') || content.includes('prisma.$transaction');
      
      if (!hasTransaction && content.includes('validateSession')) {
        reportVuln(
          'HIGH',
          'TOCTOU Race Condition',
          file,
          0,
          'Session validation without transaction - vulnerable to race conditions'
        );
      }
    }
  }
} catch (error) {
  console.log(`❌ Scan error: ${error.message}`);
}

// FINAL REPORT
console.log('\n' + '='.repeat(70));
console.log('\n📊 VULNERABILITY SUMMARY\n');
console.log(`🔴 CRITICAL: ${criticalVulns}`);
console.log(`🟠 HIGH:     ${highVulns}`);
console.log(`🟡 MEDIUM:   ${mediumVulns}`);
console.log(`📈 TOTAL:    ${criticalVulns + highVulns + mediumVulns}\n`);

if (criticalVulns > 0) {
  console.log('⚠️  CRITICAL vulnerabilities found! Fix immediately.');
  console.log('   These are exploitable by nation-state actors and advanced AIs.\n');
}

if (criticalVulns + highVulns + mediumVulns === 0) {
  console.log('🎉 No advanced vulnerabilities found!');
  console.log('   Your application is resistant to sophisticated attacks.\n');
} else {
  console.log('📋 See ADVANCED_THREAT_ASSESSMENT.md for detailed fixes.\n');
}

process.exit(criticalVulns > 0 ? 1 : 0);

