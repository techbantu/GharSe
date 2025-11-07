-- ================================================
-- BANTU'S KITCHEN - COMPLETE DATABASE SCHEMA
-- AUTOMATICALLY EXECUTED VIA /api/database/migrate
-- Uses DATABASE_URL from .env - NO MANUAL STEPS REQUIRED!
-- ================================================

-- Create database_changes tracking table first
CREATE TABLE IF NOT EXISTS "database_changes" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "table" TEXT NOT NULL,
  "sql" TEXT NOT NULL,
  "description" TEXT,
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error" TEXT
);

CREATE INDEX IF NOT EXISTS "database_changes_table_idx" ON "database_changes"("table");
CREATE INDEX IF NOT EXISTS "database_changes_executedAt_idx" ON "database_changes"("executedAt");

-- Drop existing tables if any (careful!)
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "MenuItem" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "CustomerAddress" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;
DROP TABLE IF EXISTS "Receipt" CASCADE;
DROP TABLE IF EXISTS "ConversationAnalytics" CASCADE;

-- ================================================
-- MENU ITEMS TABLE
-- ================================================
CREATE TABLE "MenuItem" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "originalPrice" DOUBLE PRECISION,
  "category" TEXT NOT NULL,
  "image" TEXT,
  "imagePublicId" TEXT,
  "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
  "isVegan" BOOLEAN NOT NULL DEFAULT false,
  "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
  "spicyLevel" INTEGER NOT NULL DEFAULT 0,
  "preparationTime" INTEGER NOT NULL DEFAULT 30,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "calories" INTEGER,
  "servingSize" TEXT,
  "ingredients" TEXT[],
  "allergens" TEXT[],
  "inventoryEnabled" BOOLEAN NOT NULL DEFAULT false,
  "inventory" INTEGER,
  "outOfStockMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "isNew" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX "MenuItem_category_idx" ON "MenuItem"("category");
CREATE INDEX "MenuItem_isAvailable_idx" ON "MenuItem"("isAvailable");
CREATE INDEX "MenuItem_isPopular_idx" ON "MenuItem"("isPopular");

-- ================================================
-- CUSTOMERS TABLE
-- ================================================
CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT NOT NULL,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
  "dietaryPreferences" TEXT[],
  "favoriteItems" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastOrderAt" TIMESTAMP(3)
);

CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- ================================================
-- CUSTOMER ADDRESSES TABLE
-- ================================================
CREATE TABLE "CustomerAddress" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "label" TEXT,
  "street" TEXT NOT NULL,
  "apartment" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'India',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "deliveryInstructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);

-- ================================================
-- ORDERS TABLE
-- ================================================
CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "orderType" TEXT NOT NULL DEFAULT 'delivery',
  "paymentMethod" TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
  "subtotal" DOUBLE PRECISION NOT NULL,
  "tax" DOUBLE PRECISION NOT NULL,
  "deliveryFee" DOUBLE PRECISION NOT NULL,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL,
  "deliveryAddress" TEXT,
  "deliveryCity" TEXT,
  "deliveryState" TEXT,
  "deliveryZip" TEXT,
  "deliveryCountry" TEXT,
  "specialInstructions" TEXT,
  "estimatedPrepTime" INTEGER NOT NULL DEFAULT 40,
  "estimatedDelivery" TIMESTAMP(3),
  "actualDeliveryTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL
);

CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_customerPhone_idx" ON "Order"("customerPhone");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- ================================================
-- ORDER ITEMS TABLE
-- ================================================
CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "specialRequests" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT
);

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");

-- ================================================
-- ADMIN TABLE
-- ================================================
CREATE TABLE "Admin" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'STAFF',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- ================================================
-- RECEIPTS TABLE
-- ================================================
CREATE TABLE "Receipt" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "receiptNumber" TEXT NOT NULL UNIQUE,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pdfUrl" TEXT,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);

CREATE INDEX "Receipt_orderId_idx" ON "Receipt"("orderId");

-- ================================================
-- CONVERSATION ANALYTICS TABLE
-- ================================================
CREATE TABLE "ConversationAnalytics" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT,
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3),
  "topicsDiscussed" TEXT[],
  "sentimentScore" DOUBLE PRECISION,
  "conversionOutcome" TEXT,
  "orderId" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL
);

CREATE INDEX "ConversationAnalytics_sessionId_idx" ON "ConversationAnalytics"("sessionId");
CREATE INDEX "ConversationAnalytics_userId_idx" ON "ConversationAnalytics"("userId");

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '✅ All tables created successfully!';
  RAISE NOTICE '📊 Tables created: MenuItem, Customer, CustomerAddress, Order, OrderItem, Admin, Receipt, ConversationAnalytics';
  RAISE NOTICE '🎯 Next: Run npm run seed:supabase to populate data';
END $$;

