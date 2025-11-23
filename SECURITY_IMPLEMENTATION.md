# 🔐 SECURITY IMPLEMENTATION GUIDE

## Quick Start

### 1. Secure Your Environment

**Immediate Actions:**

```bash
# 1. Change admin password in .env
ADMIN_DEFAULT_PASSWORD="YourNewStrong123!Password"

# 2. Rotate all secrets
node scripts/rotate-credentials.js

# 3. Restart application
npm run dev
```

### 2. Apply Security Middleware

Create `middleware.ts` in your project root:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { securityHeadersMiddleware } from './lib/security/security-headers';
import { honeypotMiddleware } from './lib/security/honeypots';
import { rateLimitMiddleware, RATE_LIMITS } from './lib/security/advanced-rate-limiting';

export async function middleware(request: NextRequest) {
  // 1. Check honeypots first (auto-blacklist attackers)
  const honeypotResponse = honeypotMiddleware(request);
  if (honeypotResponse.status !== 200 || request.nextUrl.pathname.match(/^\/api/)) {
    return honeypotResponse;
  }

  // 2. Apply rate limiting to auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname.startsWith('/api/admin/login')) {
    const rateLimitResponse = await rateLimitMiddleware(RATE_LIMITS.AUTH)(request);
    if (rateLimitResponse && rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // 3. Add security headers to all responses
  const response = NextResponse.next();
  return securityHeadersMiddleware(request, response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 3. Integrate Brute Force Protection

Update `/app/api/admin/login/route.ts`:

```typescript
import { bruteForceMiddleware, recordFailedAttempt, resetAttempts, applyDelay } from '@/lib/security/brute-force-protection';
import { auditLog } from '@/lib/security/audit-logger';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  
  try {
    const { email, password } = await req.json();
    
    // Check if IP is locked out
    const middleware = bruteForceMiddleware();
    const middlewareResponse = await middleware(req, NextResponse.next(), () => {});
    if (middlewareResponse.status === 403 || middlewareResponse.status === 429) {
      return middlewareResponse;
    }
    
    // Validate credentials
    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin || !await bcrypt.compare(password, admin.passwordHash)) {
      // Record failed attempt
      const result = await recordFailedAttempt(ip);
      
      // Apply delay to slow down attacker
      await applyDelay(result.delay);
      
      // Log failed attempt
      await auditLog.loginFailed(email, ip, 'Invalid credentials', req.headers.get('user-agent'));
      
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        remainingAttempts: result.remainingAttempts,
      }, { status: 401 });
    }
    
    // Success - reset attempts
    resetAttempts(ip);
    
    // Log successful login
    await auditLog.loginSuccess(admin.id, admin.email, ip, req.headers.get('user-agent'));
    
    // Generate token
    const token = generateToken(admin);
    
    return NextResponse.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
    }, { status: 500 });
  }
}
```

### 4. Enable Audit Logging

In any security-sensitive operation:

```typescript
import { auditLog, AuditEventType, RiskLevel } from '@/lib/security/audit-logger';

// Example: Log data access
await auditLog.dataAccess(
  userId,
  userEmail,
  'customer_orders',
  ipAddress
);

// Example: Log suspicious activity
await auditLog.suspiciousActivity(
  userId,
  ipAddress,
  'Multiple password reset requests',
  { count: 5, timeframe: '5 minutes' }
);
```

### 5. Initialize Secrets Manager

In your main application entry point (`app/layout.tsx` or `pages/_app.tsx`):

```typescript
import { secretsManager } from '@/lib/security/secrets-manager';

// Initialize on server startup
if (typeof window === 'undefined') {
  secretsManager.initialize();
}
```

### 6. Set Up Database Tables

```bash
# Run migration to create security tables
npx prisma db push
```

## Features Enabled

✅ **Hardcoded Password Removal** - All passwords now from .env only  
✅ **Rate Limiting** - 5 attempts per 15 minutes on auth endpoints  
✅ **Brute Force Protection** - Auto-lockout and IP blacklisting  
✅ **Security Headers** - CSP, HSTS, XSS protection  
✅ **Encrypted Audit Logging** - All security events logged and encrypted  
✅ **IP Attack Tracking** - Real-time threat detection  
✅ **Honeypot Detection** - Fake endpoints to trap attackers  
✅ **Credential Rotation** - Automated secret rotation system  
✅ **CSRF Protection** - Origin validation and tokens  
✅ **Input Sanitization** - XSS prevention

## Monitoring Dashboard

View security metrics:

```bash
# In your admin panel, create an endpoint:
GET /api/admin/security/dashboard
```

```typescript
import { getStats as getBruteForceStats } from '@/lib/security/brute-force-protection';
import { getRateLimitStats } from '@/lib/security/advanced-rate-limiting';
import { generateThreatReport } from '@/lib/security/ip-tracking';

export async function GET(req: NextRequest) {
  const threatReport = await generateThreatReport();
  const bruteForceStats = getBruteForceStats();
  const rateLimitStats = getRateLimitStats();
  
  return NextResponse.json({
    threats: threatReport,
    bruteForce: bruteForceStats,
    rateLimit: rateLimitStats,
  });
}
```

## Maintenance

### Weekly Tasks
- Review audit logs for suspicious activity
- Check IP threat report
- Verify rate limit effectiveness

### Monthly Tasks
- Rotate JWT secrets (automated)
- Review and update honeypot endpoints
- Security penetration testing

### Quarterly Tasks
- Full security audit
- Update dependencies
- Review and update security policies

## Emergency Procedures

### If credentials are compromised:
```bash
# 1. Immediately rotate all secrets
node scripts/rotate-credentials.js

# 2. Revoke all active sessions (add to your code)
await prisma.securitySession.updateMany({
  where: { isValid: true },
  data: { isValid: false, revokedReason: 'Emergency rotation' }
});

# 3. Force all users to re-login

# 4. Review audit logs for breach
await queryAuditLogs({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  riskLevel: RiskLevel.CRITICAL
});
```

### If under attack:
```bash
# View top attackers
const report = await generateThreatReport();
console.log(report.topAttackers);

# Manually blacklist IP
addToBlacklist('192.168.1.100', 'Manual blacklist during attack');
```

## Support

For security issues:
- Review `SECURITY_AUDIT_REPORT.md`
- Check implementation logs
- Contact security team

---

**Remember:** Security is not a one-time setup. Monitor, maintain, and update regularly.

🛡️ **Stay Secure!**

