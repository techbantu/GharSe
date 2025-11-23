/**
 * 🍯 HONEYPOT SYSTEM - Detect and Trap Attackers
 * 
 * Creates fake endpoints that look like security vulnerabilities
 * to detect and identify attackers automatically.
 * 
 * Honeypots included:
 * 1. Fake admin panel
 * 2. Fake database backup
 * 3. Fake API keys endpoint
 * 4. Fake .env file
 * 5. Fake SQL injection vulnerability
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { addToBlacklist } from './brute-force-protection';
import { recordAttackAttempt, AttackType } from './ip-tracking';
import { auditLog, AuditEventType, RiskLevel } from './audit-logger';

/**
 * Generate fake realistic data to confuse attackers
 */
function generateFakeData() {
  return {
    // Fake API keys (look real but are useless)
    apiKeys: {
      stripe_key: `sk_live_${crypto.randomBytes(32).toString('hex')}`,
      openai_key: `sk-proj-${crypto.randomBytes(48).toString('base64')}`,
      aws_access_key: `AKIA${crypto.randomBytes(16).toString('hex').toUpperCase()}`,
      aws_secret_key: crypto.randomBytes(40).toString('base64'),
    },
    
    // Fake database credentials
    database: {
      host: 'db.internal.company.com',
      port: 5432,
      username: 'admin_user',
      password: crypto.randomBytes(24).toString('hex'),
      database: 'production_db',
    },
    
    // Fake user data
    users: Array.from({ length: 10 }, (_, i) => ({
      id: crypto.randomUUID(),
      email: `admin${i}@internal.company.com`,
      password_hash: `$2b$12$${crypto.randomBytes(32).toString('base64')}`,
      role: 'ADMIN',
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    
    // Fake internal IPs
    internal_servers: [
      '10.0.1.100',
      '10.0.1.101',
      '192.168.1.50',
      '172.16.0.10',
    ],
  };
}

/**
 * Handle honeypot access
 */
async function handleHoneypotAccess(
  req: NextRequest,
  honeypotName: string
): Promise<NextResponse> {
  const ip = 
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const url = req.url;
  
  // Log the attack
  console.error(`🍯 HONEYPOT TRIGGERED: ${honeypotName}`);
  console.error(`   IP: ${ip}`);
  console.error(`   User-Agent: ${userAgent}`);
  console.error(`   URL: ${url}`);
  
  // Record in IP tracking system
  await recordAttackAttempt(ip, AttackType.HONEYPOT_TRIGGERED, {
    honeypotName,
    userAgent,
    url,
  });
  
  // Add to blacklist immediately
  addToBlacklist(ip, `Accessed honeypot: ${honeypotName}`);
  
  // Log to audit system
  await auditLog.suspiciousActivity(
    undefined,
    ip,
    'Honeypot Triggered',
    {
      honeypotName,
      userAgent,
      url,
    }
  );
  
  // Return fake data to waste attacker's time
  return NextResponse.json(generateFakeData(), { status: 200 });
}

/**
 * Honeypot: Fake admin panel
 * URL: /admin-old, /admin-backup, /admin-v1
 */
export async function honeypotFakeAdminPanel(req: NextRequest) {
  return handleHoneypotAccess(req, 'Fake Admin Panel');
}

/**
 * Honeypot: Fake database backup
 * URL: /backup.sql, /db_backup.sql, /database.sql
 */
export async function honeypotFakeDBBackup(req: NextRequest) {
  await handleHoneypotAccess(req, 'Fake Database Backup');
  
  // Return fake SQL dump
  const fakeSQLDump = `
-- MySQL dump 10.13  Distrib 8.0.32, for Linux (x86_64)
-- Host: localhost    Database: production
-- ------------------------------------------------------

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id varchar(36) PRIMARY KEY,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

${Array.from({ length: 20 }, (_, i) => 
  `INSERT INTO users VALUES ('${crypto.randomUUID()}', 'user${i}@fake.com', '$2b$12$${crypto.randomBytes(32).toString('base64')}', NOW());`
).join('\n')}
`.trim();
  
  return new NextResponse(fakeSQLDump, {
    status: 200,
    headers: {
      'Content-Type': 'application/sql',
      'Content-Disposition': 'attachment; filename="backup.sql"',
    },
  });
}

/**
 * Honeypot: Fake .env file
 * URL: /.env, /.env.backup, /.env.production
 */
export async function honeypotFakeEnvFile(req: NextRequest) {
  await handleHoneypotAccess(req, 'Fake ENV File');
  
  const fakeEnv = `
# Database
DATABASE_URL=postgresql://admin:${crypto.randomBytes(24).toString('hex')}@db.internal.com:5432/prod

# Secrets
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
API_KEY=${crypto.randomBytes(32).toString('hex')}

# AWS
AWS_ACCESS_KEY_ID=AKIA${crypto.randomBytes(16).toString('hex').toUpperCase()}
AWS_SECRET_ACCESS_KEY=${crypto.randomBytes(40).toString('base64')}

# Stripe
STRIPE_SECRET_KEY=sk_live_${crypto.randomBytes(32).toString('hex')}

# OpenAI
OPENAI_API_KEY=sk-proj-${crypto.randomBytes(48).toString('base64')}
`.trim();
  
  return new NextResponse(fakeEnv, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

/**
 * Honeypot: Fake API keys endpoint
 * URL: /api/keys, /api/secrets, /api/config
 */
export async function honeypotFakeAPIKeys(req: NextRequest) {
  return handleHoneypotAccess(req, 'Fake API Keys');
}

/**
 * Honeypot: Fake vulnerable SQL endpoint
 * URL: /api/search?q=', /api/users?id=1 OR 1=1
 */
export async function honeypotFakeSQLInjection(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.toString();
  
  // Check for SQL injection patterns
  const sqlPatterns = ['OR 1=1', 'UNION SELECT', 'DROP TABLE', '--', "';"];
  const hasSQLInjection = sqlPatterns.some(pattern => 
    query.toUpperCase().includes(pattern.toUpperCase())
  );
  
  if (hasSQLInjection) {
    await handleHoneypotAccess(req, 'SQL Injection Attempt');
  }
  
  return NextResponse.json({
    results: generateFakeData().users,
  });
}

/**
 * Honeypot: Fake debug endpoint
 * URL: /debug, /api/debug, /__debug
 */
export async function honeypotFakeDebug(req: NextRequest) {
  await handleHoneypotAccess(req, 'Fake Debug Endpoint');
  
  return NextResponse.json({
    environment: 'production',
    debug_mode: true,
    secrets: generateFakeData().apiKeys,
    database: generateFakeData().database,
    internal_ips: generateFakeData().internal_servers,
  });
}

/**
 * Honeypot: Fake phpMyAdmin
 * URL: /phpmyadmin, /pma, /mysql
 */
export async function honeypotFakePhpMyAdmin(req: NextRequest) {
  await handleHoneypotAccess(req, 'Fake phpMyAdmin');
  
  return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>phpMyAdmin</title>
</head>
<body>
  <h1>Welcome to phpMyAdmin</h1>
  <form>
    <input type="text" name="pma_username" placeholder="Username" />
    <input type="password" name="pma_password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>
</body>
</html>
  `.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

/**
 * List of all honeypot endpoints
 */
export const HONEYPOT_ENDPOINTS = [
  { path: '/admin-old', handler: honeypotFakeAdminPanel },
  { path: '/admin-backup', handler: honeypotFakeAdminPanel },
  { path: '/admin-v1', handler: honeypotFakeAdminPanel },
  { path: '/backup.sql', handler: honeypotFakeDBBackup },
  { path: '/db_backup.sql', handler: honeypotFakeDBBackup },
  { path: '/database.sql', handler: honeypotFakeDBBackup },
  { path: '/.env.backup', handler: honeypotFakeEnvFile },
  { path: '/.env.production', handler: honeypotFakeEnvFile },
  { path: '/api/keys', handler: honeypotFakeAPIKeys },
  { path: '/api/secrets', handler: honeypotFakeAPIKeys },
  { path: '/api/config', handler: honeypotFakeAPIKeys },
  { path: '/debug', handler: honeypotFakeDebug },
  { path: '/api/debug', handler: honeypotFakeDebug },
  { path: '/__debug', handler: honeypotFakeDebug },
  { path: '/phpmyadmin', handler: honeypotFakePhpMyAdmin },
  { path: '/pma', handler: honeypotFakePhpMyAdmin },
  { path: '/mysql', handler: honeypotFakePhpMyAdmin },
];

/**
 * Middleware to detect honeypot access in Next.js
 */
export function honeypotMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Check if path matches any honeypot
  const honeypot = HONEYPOT_ENDPOINTS.find(hp => hp.path === pathname);
  
  if (honeypot) {
    return honeypot.handler(req);
  }
  
  return NextResponse.next();
}

