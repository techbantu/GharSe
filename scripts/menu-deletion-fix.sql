-- =====================================================
-- MENU DELETION FIX - Database Migration
-- =====================================================
-- Purpose: Allow admins to delete menu items even if they have order history
-- Strategy: Make OrderItem.menuItemId nullable and add deleted item preservation fields
-- 
-- CRITICAL FIX: This solves the "Cannot delete menu item because it has been ordered before" issue
--
-- Steps:
-- 1. Add columns to preserve deleted item information
-- 2. Make menuItemId nullable
-- 3. Update foreign key constraint to SET NULL on delete
-- 4. Log changes to audit trail
-- =====================================================

BEGIN;

-- Step 1: Add new columns for deleted item preservation
-- These columns store the original item details when a menu item is deleted
ALTER TABLE "OrderItem" 
ADD COLUMN IF NOT EXISTS "deletedItemName" TEXT,
ADD COLUMN IF NOT EXISTS "deletedItemDescription" TEXT,
ADD COLUMN IF NOT EXISTS "deletedItemImage" TEXT;

COMMENT ON COLUMN "OrderItem"."deletedItemName" IS 'Preserves menu item name when item is deleted';
COMMENT ON COLUMN "OrderItem"."deletedItemDescription" IS 'Preserves menu item description when item is deleted';
COMMENT ON COLUMN "OrderItem"."deletedItemImage" IS 'Preserves menu item image URL when item is deleted';

-- Step 2: Drop existing foreign key constraint
ALTER TABLE "OrderItem" 
DROP CONSTRAINT IF EXISTS "OrderItem_menuItemId_fkey";

-- Step 3: Make menuItemId nullable
-- This allows order items to exist even after their menu item is deleted
ALTER TABLE "OrderItem" 
ALTER COLUMN "menuItemId" DROP NOT NULL;

-- Step 4: Re-add foreign key constraint with SET NULL behavior
-- When a menu item is deleted, the menuItemId will be set to NULL automatically
-- The deleted item details will be preserved in deletedItem* columns
ALTER TABLE "OrderItem" 
ADD CONSTRAINT "OrderItem_menuItemId_fkey" 
FOREIGN KEY ("menuItemId") 
REFERENCES "MenuItem"("id") 
ON DELETE SET NULL;

-- Step 5: Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS "OrderItem_deletedItemName_idx" ON "OrderItem"("deletedItemName");

-- Step 6: Log to database_changes table for audit trail
INSERT INTO "DatabaseChange" (
  "id",
  "occurredAt",
  "appName",
  "changeKind",
  "commandTag",
  "objectType",
  "objectIdentity",
  "statement",
  "details"
) VALUES (
  gen_random_uuid()::text,
  NOW(),
  'bantus-kitchen',
  'ddl',
  'ALTER TABLE',
  'table',
  'OrderItem',
  'Allow menu item deletion with order history preservation',
  jsonb_build_object(
    'columnsAdded', ARRAY['deletedItemName', 'deletedItemDescription', 'deletedItemImage'],
    'columnsModified', ARRAY['menuItemId (made nullable)'],
    'constraintsModified', ARRAY['OrderItem_menuItemId_fkey (ON DELETE SET NULL)'],
    'purpose', 'Enable admins to force delete menu items while preserving order history',
    'appliedBy', 'manual-sql-script',
    'appliedAt', NOW()::text
  )
);

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:

-- 1. Check column metadata
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'OrderItem'
AND column_name IN ('menuItemId', 'deletedItemName', 'deletedItemDescription', 'deletedItemImage')
ORDER BY column_name;

-- 2. Check foreign key constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  confdeltype AS on_delete_action
FROM pg_constraint
WHERE conrelid = 'OrderItem'::regclass
AND conname = 'OrderItem_menuItemId_fkey';
-- Expected: on_delete_action should be 'n' (SET NULL)

-- 3. Check recent database changes log
SELECT 
  "occurredAt",
  "changeKind",
  "commandTag",
  "objectIdentity",
  "statement",
  "details"
FROM "DatabaseChange"
WHERE "objectIdentity" = 'OrderItem'
ORDER BY "occurredAt" DESC
LIMIT 1;

-- =====================================================
-- SUCCESS INDICATORS
-- =====================================================
-- ✅ menuItemId is_nullable = 'YES'
-- ✅ deletedItemName, deletedItemDescription, deletedItemImage columns exist
-- ✅ Foreign key constraint has ON DELETE SET NULL
-- ✅ Database change logged in DatabaseChange table

-- =====================================================
-- ROLLBACK (IF NEEDED)
-- =====================================================
-- If something goes wrong, run this to revert:
/*
BEGIN;

-- Remove new columns
ALTER TABLE "OrderItem" 
DROP COLUMN IF EXISTS "deletedItemName",
DROP COLUMN IF EXISTS "deletedItemDescription",
DROP COLUMN IF EXISTS "deletedItemImage";

-- Drop foreign key
ALTER TABLE "OrderItem" 
DROP CONSTRAINT IF EXISTS "OrderItem_menuItemId_fkey";

-- Make menuItemId NOT NULL again
ALTER TABLE "OrderItem" 
ALTER COLUMN "menuItemId" SET NOT NULL;

-- Re-add original foreign key (without SET NULL)
ALTER TABLE "OrderItem" 
ADD CONSTRAINT "OrderItem_menuItemId_fkey" 
FOREIGN KEY ("menuItemId") 
REFERENCES "MenuItem"("id") 
ON DELETE RESTRICT;

COMMIT;
*/

