# 🧹 DATABASE CLEANUP - Run in Supabase SQL Editor

## Step 1: Login to Supabase
1. Go to: https://supabase.com/dashboard
2. Login with your account
3. Select your project: `jkacjjusycmjwtcedeqf`
4. Go to **SQL Editor** (left sidebar)

## Step 2: Run This Cleanup SQL

Copy and paste this entire SQL block into the SQL Editor and click "Run":

```sql
-- ============================================
-- 🧹 DATABASE CLEANUP SCRIPT FOR GHARSE
-- ============================================
-- This will delete test orders and unnecessary data
-- while preserving menu items, admins, and customers
-- ============================================

-- 1. Delete notifications (depends on orders)
DELETE FROM "NotificationLog";

-- 2. Delete payments (depends on orders)
DELETE FROM "Payment";

-- 3. Delete receipts (depends on orders)
DELETE FROM "Receipt";

-- 4. Delete order items (depends on orders)
DELETE FROM "OrderItem";

-- 5. Delete deliveries (depends on orders)
DELETE FROM "Delivery";

-- 6. Delete coupon usage (depends on orders)
DELETE FROM "CouponUsage";

-- 7. Delete all orders
DELETE FROM "Order";

-- 8. Delete cart reservations
DELETE FROM "CartReservation";

-- 9. Delete expired sessions
DELETE FROM "UserSession" WHERE "expiresAt" < NOW() OR "isRevoked" = true;

-- 10. Delete old audit logs (keep last 7 days)
DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '7 days';

-- 11. Delete old demand history (keep last 30 days)
DELETE FROM "ItemDemandHistory" WHERE "timestamp" < NOW() - INTERVAL '30 days';

-- 12. Delete old dynamic pricing (keep last 30 days)
DELETE FROM "DynamicPricing" WHERE "timestamp" < NOW() - INTERVAL '30 days';

-- 13. Delete old legal acceptances (keep last 30 days)
DELETE FROM "LegalAcceptance" WHERE "acceptedAt" < NOW() - INTERVAL '30 days';

-- 14. Delete old cookie consents (keep last 30 days)
DELETE FROM "CookieConsent" WHERE "consentedAt" < NOW() - INTERVAL '30 days';

-- 15. Delete old database changes (keep last 7 days)
DELETE FROM "database_changes" WHERE "occurredAt" < NOW() - INTERVAL '7 days';

-- 16. Delete old daily sales (keep last 90 days)
DELETE FROM "DailySales" WHERE "date" < NOW() - INTERVAL '90 days';

-- 17. Delete old order metrics
DELETE FROM "OrderMetrics" WHERE "timestamp" < NOW() - INTERVAL '90 days';

-- 18. Delete old kitchen capacity records
DELETE FROM "KitchenCapacity" WHERE "timestamp" < NOW() - INTERVAL '7 days';

-- 19. Delete old demand predictions
DELETE FROM "DemandPrediction" WHERE "timestamp" < NOW() - INTERVAL '30 days';

-- 20. Reclaim disk space
VACUUM;

-- ============================================
-- ✅ CLEANUP COMPLETE!
-- ============================================
-- Your database should now have much less data
-- and your Prisma Accelerate queries will work again
-- ============================================

-- Verify what's left:
SELECT 'Orders' as table_name, COUNT(*) as count FROM "Order"
UNION ALL
SELECT 'Menu Items', COUNT(*) FROM "MenuItem"
UNION ALL
SELECT 'Admins', COUNT(*) FROM "Admin"
UNION ALL
SELECT 'Customers', COUNT(*) FROM "Customer";
```

## Step 3: Reset Admin Password

After cleanup, run this to ensure your admin account works:

```sql
-- Update admin password (bcrypt hash for 'GharSe@Admin2025!')
UPDATE "Admin" 
SET 
  "passwordHash" = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S8n0Qd5xQFWQ2W',
  "isActive" = true,
  "emailVerified" = true,
  "resetToken" = NULL,
  "resetTokenExpires" = NULL
WHERE "email" = 'bantusailaja@gmail.com';

-- If admin doesn't exist, create it:
INSERT INTO "Admin" ("id", "email", "name", "passwordHash", "role", "isActive", "emailVerified", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  'bantusailaja@gmail.com',
  'Sailaja Bantu',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S8n0Qd5xQFWQ2W',
  'OWNER',
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Admin" WHERE "email" = 'bantusailaja@gmail.com'
);
```

## Step 4: Verify Connection

After running the cleanup, your app should work again. The Prisma Accelerate query limit is based on number of queries, not data size, but cleaning up reduces the load.

## Alternative: Check Prisma Accelerate Usage

1. Go to: https://console.prisma.io
2. Login with your account
3. Check "Usage" tab to see your query count
4. If limit is reached, wait for monthly reset or upgrade plan

---

**Important**: After running the cleanup, restart your Next.js server:
```bash
cd /Users/rbantu/bantus-kitchen
pkill -f "next dev"
npm run dev
```

**Login Credentials**:
- Email: `bantusailaja@gmail.com`
- Password: `GharSe@Admin2025!`

