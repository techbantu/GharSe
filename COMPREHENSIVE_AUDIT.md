# GharSe Codebase - Comprehensive Audit & Architecture Report

**Project Name:** GharSe (घर से - "From Home")
**Version:** 1.0.0 - Production-Ready  
**Type:** Full-Stack Food Delivery Marketplace (Home Chef Platform)
**Framework:** Next.js 14 + TypeScript + React 19  
**Database:** PostgreSQL + Prisma ORM  
**Status:** Active with Multi-Chef Support

---

## TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Database Schema & Models](#database-schema--models)
5. [Core Features & Flows](#core-features--flows)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Authentication System](#authentication-system)
8. [Payment Integration](#payment-integration)
9. [Key Components](#key-components)
10. [Critical Libraries & Utilities](#critical-libraries--utilities)
11. [External Integrations](#external-integrations)
12. [Configuration & Environment Setup](#configuration--environment-setup)
13. [Known Issues & Bug Tracking](#known-issues--bug-tracking)
14. [Testing & Quality Assurance](#testing--quality-assurance)

---

## PROJECT OVERVIEW

### Mission
GharSe is a revolutionary home chef marketplace connecting authentic home chefs with food lovers. Unlike traditional food delivery, it focuses on homemade cuisine with cultural heritage.

### Key Stakeholders
- **Customers:** Browse, order, track deliveries, earn rewards
- **Home Chefs:** Register, manage menus, fulfill orders, track earnings
- **Administrators:** Monitor platform, manage users, handle disputes
- **Delivery Partners:** Real-time order tracking and delivery

### Core Value Propositions
- **For Customers:** AI-powered recommendations, loyalty rewards, multi-chef ordering
- **For Chefs:** Instant payouts, demand forecasting, kitchen intelligence
- **For Platform:** Fraud detection, dynamic pricing, automated compliance

---

## TECHNOLOGY STACK

### Frontend
- **Next.js 14** - Full-stack React framework with App Router
- **React 19** - Latest React with hooks and context API
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS with PostCSS
- **Framer Motion 12** - Animation library
- **React Hook Form 7.65** - Form state management
- **Zod 4.1** - Runtime type validation

### Backend
- **Next.js API Routes** - Server-side functions
- **Prisma 6.18** - Type-safe ORM
- **PostgreSQL 15** - Production database
- **Prisma Accelerate** - Connection pooling & caching
- **jsonwebtoken 9** - JWT authentication
- **bcryptjs 2.4.3** - Password hashing
- **Socket.io 4.7** - Real-time communications

### External Services
- **OpenAI** - GPT-4 for AI chat
- **Stripe** - International payment processing
- **Razorpay** - Indian payment gateway
- **Cloudinary** - Image hosting & CDN
- **SendGrid/Resend** - Email delivery
- **Twilio** - SMS notifications
- **Supabase** - Optional backend-as-a-service

### Developer Tools
- **Jest 29** - Unit testing
- **Playwright 1.48** - E2E testing
- **ESLint 9** - Code linting
- **Prisma Studio** - Database GUI
- **ts-node** - TypeScript execution

---

## DIRECTORY STRUCTURE

```
/home/user/GharSe/
├── app/                              # Next.js 14 App Router
│   ├── api/                          # Backend API Routes (27 directories)
│   │   ├── auth/                     # Authentication (register, login, verify, reset password)
│   │   │   ├── register/route.ts     # Customer registration with referral support
│   │   │   ├── login/route.ts        # Customer login with account locking
│   │   │   ├── logout/route.ts       # Session cleanup
│   │   │   ├── me/route.ts           # Get current customer
│   │   │   ├── verify-email/route.ts # Email verification
│   │   │   ├── resend-verification/  # Resend OTP
│   │   │   ├── forgot-password/      # Password reset flow
│   │   │   ├── reset-password/       # Confirm password reset
│   │   │   ├── change-password/      # Change existing password
│   │   │   └── update-profile/       # Profile updates
│   │   │
│   │   ├── admin/                    # Admin Authentication
│   │   │   ├── login/route.ts        # Admin login (separate JWT)
│   │   │   ├── me/route.ts           # Get current admin
│   │   │   ├── refunds/route.ts      # Handle refunds
│   │   │   └── payment-config/       # Admin payment settings
│   │   │
│   │   ├── orders/                   # Order Management (8 files)
│   │   │   ├── route.ts              # POST: Create order, GET: List orders
│   │   │   ├── [id]/route.ts         # GET/PATCH order details
│   │   │   ├── [id]/status/route.ts  # Update order status
│   │   │   ├── cancel/route.ts       # Cancel order
│   │   │   ├── modify/route.ts       # Modify during grace period
│   │   │   ├── finalize/route.ts     # Finalize delivery
│   │   │   ├── my-orders/route.ts    # Get customer's orders
│   │   │   └── pending-queue/route.ts # Kitchen queue
│   │   │
│   │   ├── payments/                 # Payment Processing
│   │   │   ├── create-intent/route.ts # Create payment intent (Stripe/Razorpay)
│   │   │   ├── webhook/route.ts      # Handle payment callbacks
│   │   │   ├── instant/route.ts      # Instant payment processing
│   │   │   ├── financials/route.ts   # Financial reports
│   │   │   └── test/route.ts         # Test payment endpoints
│   │   │
│   │   ├── menu/                     # Menu Management
│   │   │   ├── route.ts              # GET all items, POST create
│   │   │   └── [id]/route.ts         # PATCH/DELETE menu item
│   │   │
│   │   ├── search/route.ts           # Advanced menu search with filters
│   │   ├── chat/route.ts             # AI chat API (OpenAI integration)
│   │   ├── upload/route.ts           # Image upload (Cloudinary)
│   │   ├── socket/route.ts           # WebSocket upgrade
│   │   │
│   │   ├── chefs/                    # Multi-Chef Support
│   │   │   ├── route.ts              # List/register chefs
│   │   │   └── [slug]/               # Individual chef pages
│   │   │       ├── route.ts
│   │   │       ├── menu/route.ts     # Chef-specific menu
│   │   │       └── analytics/route.ts # Chef performance
│   │   │
│   │   ├── customer/                 # Customer Features
│   │   │   ├── link-orders/route.ts  # Link orders to account
│   │   │   ├── taste-profile/route.ts # AI taste preferences
│   │   │   ├── achievements/route.ts  # Unlocked badges
│   │   │   ├── insights/route.ts     # Smart recommendations
│   │   │   └── referral-stats/route.ts # Referral metrics
│   │   │
│   │   ├── wallet/                   # Wallet & Credits
│   │   │   ├── balance/route.ts      # Check balance
│   │   │   └── transactions/route.ts # Transaction history
│   │   │
│   │   ├── referral/                 # Referral System
│   │   │   ├── history/route.ts      # Referral records
│   │   │   ├── leaderboard/route.ts  # Top referrers
│   │   │   └── milestones/route.ts   # Jackpot tracking
│   │   │
│   │   ├── coupons/validate/route.ts # Coupon validation
│   │   ├── kitchen/capacity/route.ts # Kitchen utilization
│   │   ├── ingredients/expiry-alerts/ # Inventory tracking
│   │   ├── pricing/dynamic/[itemId]/  # Dynamic pricing
│   │   ├── forecast/demand/route.ts   # Demand forecasting
│   │   ├── payouts/                   # Chef payouts
│   │   ├── analytics/route.ts         # Platform analytics
│   │   ├── database/                  # DB management
│   │   ├── legal/                     # T&C acceptance
│   │   ├── setup/validate/            # Initial setup
│   │   └── diagnostic/route.ts        # Health checks
│   │
│   ├── admin/                        # Admin Portal
│   │   ├── page.tsx                  # Main dashboard
│   │   ├── login/page.tsx            # Admin login
│   │   ├── dashboard/page.tsx        # Analytics dashboard
│   │   ├── kitchen/page.tsx          # Kitchen management
│   │   ├── kitchen-intelligence/page.tsx # Smart insights
│   │   ├── menu-manager/page.tsx     # Menu CRUD
│   │   ├── payments/setup/page.tsx   # Payment config
│   │   ├── bank-setup/page.tsx       # Payout setup
│   │   ├── chefs/page.tsx            # Chef management
│   │   └── setup/page.tsx            # Initial setup wizard
│   │
│   ├── chef/                         # Chef Dashboard
│   │   └── dashboard/page.tsx        # Chef orders & earnings
│   │
│   ├── chefs/page.tsx                # Browse chefs directory
│   ├── orders/page.tsx               # Customer order history
│   ├── orders/[id]/page.tsx          # Order detail & tracking
│   ├── profile/page.tsx              # User profile
│   │
│   ├── legal/                        # Compliance
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── cookies/page.tsx
│   │
│   ├── auth/                         # Auth Pages
│   │   ├── verify-email/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── resend-verification/page.tsx
│   │
│   ├── page.tsx                      # Homepage (root)
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
│
├── components/                       # React Components (~50+ components)
│   ├── Header.tsx                    # Navigation header
│   ├── Hero.tsx                      # Landing section
│   ├── CheckoutModal.tsx             # Checkout flow
│   ├── CartSidebar.tsx               # Shopping cart
│   ├── OrderTracking.tsx             # Real-time order tracking
│   ├── AdvancedSearch.tsx            # Menu search
│   ├── ReviewsSection.tsx            # Customer reviews
│   ├── ContactSection.tsx            # Contact info
│   ├── CulinaryPassport.tsx          # Food journey tracker
│   ├── TasteProfileWheel.tsx         # AI taste profile
│   ├── AchievementGallery.tsx        # Badges & unlocks
│   ├── SmartInsights.tsx             # Personalized recommendations
│   ├── PendingOrderModification.tsx  # Grace period UI
│   ├── CacheBuster.tsx               # Cache management
│   │
│   ├── admin/                        # Admin Components
│   │   ├── KitchenOrders.tsx         # Live order board
│   │   ├── KitchenIntelligenceTab.tsx # Smart insights
│   │   ├── CompactOrderCard.tsx      # Order card
│   │   ├── OrderStatsBar.tsx         # Metrics display
│   │   ├── OrderFilterBar.tsx        # Order filters
│   │   ├── ImagePositioner.tsx       # Image editor
│   │   └── CancelOrderModal.tsx      # Cancel flow
│   │
│   ├── auth/                         # Auth Components
│   │   ├── LoginModal.tsx
│   │   ├── RegisterModal.tsx
│   │   └── AuthGuard.tsx
│   │
│   ├── chat/                         # Chat Components
│   │   └── ChatWindow.tsx            # AI chat interface
│   │
│   └── legal/                        # Legal Components
│       └── TermsAcceptance.tsx
│
├── context/                          # React Context (Global State)
│   ├── CartContext.tsx               # Shopping cart state
│   ├── AuthContext.tsx               # Authentication state (cross-tab sync!)
│   ├── ChatContext.tsx               # Chat messages state
│   └── ToastContext.tsx              # Notifications
│
├── hooks/                            # Custom React Hooks
│   ├── useOrderFilters.ts            # Filter logic
│   └── useWebSocket.ts               # WebSocket connection
│
├── lib/                              # Business Logic & Utilities (~40 files, 16KB+ code)
│   ├── prisma.ts                     # Prisma singleton client
│   ├── auth.ts                       # Admin auth utilities
│   ├── auth-customer.ts              # Customer auth (JWT, bcrypt)
│   ├── auth-middleware.ts            # Auth guards
│   │
│   ├── prisma-helper.ts              # Database helpers
│   ├── database-init.ts              # DB initialization
│   ├── order-storage.ts              # Order persistence
│   ├── prisma-auto-setup.ts          # Auto-setup migration
│   │
│   ├── coupon-validator.ts           # Coupon business logic
│   ├── referral-engine.ts            # Referral rewards system
│   ├── wallet-manager.ts             # Wallet credits
│   ├── fraud-detector.ts             # Fraud detection
│   │
│   ├── ai-chat-functions.ts          # AI tool definitions
│   ├── nlp-item-extraction.ts        # NLP for order parsing
│   ├── chat-analytics.ts             # Chat insights
│   │
│   ├── pricing-engine.ts             # Dynamic pricing
│   ├── demand-forecaster.ts          # ML demand prediction
│   ├── ml/                           # ML Models
│   │   └── demand-forecaster.ts
│   │
│   ├── achievement-engine.ts         # Gamification badges
│   ├── taste-analyzer.ts             # Taste profile AI
│   ├── ingredient-tracker.ts         # Inventory alerts
│   ├── cart-inventory-tracker.ts     # Cart reservations
│   ├── kitchen-monitor.ts            # Kitchen capacity
│   │
│   ├── commission-calculator.ts      # Chef payouts
│   ├── order-router.ts               # Multi-chef routing
│   ├── cart-multi-chef-helper.ts     # Cart splitting
│   ├── feature-flags.ts              # Feature toggles
│   │
│   ├── logger.ts                     # Structured logging
│   ├── monitoring.ts                 # System health
│   ├── websocket-server.ts           # Real-time updates
│   ├── redis-cache.ts                # Redis caching
│   ├── setup-validator.ts            # Setup validation
│   ├── icon-mapper.ts                # Icon utilities
│   ├── correlation.ts                # Request correlation
│   ├── supabase-migrator.ts          # DB migration
│   │
│   ├── email-verification.ts         # Email OTP
│   ├── referral-notifications.ts     # Referral alerts
│   │
│   └── legal/                        # Legal helpers
│       └── terms-generator.ts        # T&C generation
│
├── utils/                            # Pure Utility Functions (~20 files)
│   ├── result.ts                     # Result<T,E> type (Erlang-style error handling)
│   ├── logger.ts                     # Logger export
│   ├── rate-limit.ts                 # Rate limiting (token bucket)
│   ├── retry.ts                      # Exponential backoff retry
│   ├── currency.ts                   # Price formatting
│   ├── business-hours.ts             # Hours calculation
│   ├── notification-sound.ts         # Audio notifications
│   ├── classnames.ts                 # CSS class utilities
│   ├── performance-monitor.ts        # Perf tracking
│   ├── memory-leak-detector.ts       # Memory safety
│   └── ... (more utilities)
│
├── types/                            # TypeScript Definitions
│   └── index.ts                      # All types (MenuItem, Order, Payment, etc.)
│
├── context/                          # React Context
│   └── ... (state management)
│
├── prisma/                           # Database Schema
│   ├── schema.prisma                 # Complete data model
│   ├── seed.ts                       # Seed data
│   └── add-sample-orders.ts          # Sample orders
│
├── data/                             # Static Data
│   └── menuData.ts                   # Menu items, restaurant info
│
├── public/                           # Static Assets
│   └── images/                       # Image files
│
├── styles/                           # CSS
│   └── globals.css
│
├── __tests__/                        # Tests
│   ├── api/                          # API tests
│   ├── context/                      # Context tests
│   └── integration/                  # Integration tests
│
├── e2e/                              # End-to-End Tests
│   └── order-flow.spec.ts            # Playwright E2E
│
├── scripts/                          # Build & Dev Scripts (~20 scripts)
│   ├── setup-database.mjs            # Initial DB setup
│   ├── create-admin-user.mjs         # Admin creation
│   ├── verify-admin-email.mjs        # Email verification
│   ├── seed-supabase-api.mjs         # Supabase seeding
│   ├── auto-db-sync.js               # Auto DB sync
│   ├── cleanup-dev.mjs               # Dev cleanup
│   ├── start-chat-system.mjs         # Chat startup
│   ├── migration-*.ts                # Migration helpers
│   └── ... (more scripts)
│
├── .env.example                      # Environment template (120+ vars)
├── .gitignore                        # Git exclusions
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind setup
├── next.config.ts                    # Next.js config
├── jest.config.ts                    # Jest setup
├── playwright.config.ts              # Playwright config
├── README.md                         # Main documentation
├── ARCHITECTURE.md                   # Architecture guide
└── ... (50+ markdown docs)
```

---

## DATABASE SCHEMA & MODELS

### Core Models (16 main entities)

#### 1. **Chef** (Multi-Tenancy Support)
- Registration & verification (FSSAI, GST)
- Business profile (name, logo, cuisines)
- Service area & delivery radius
- Commission tracking
- Status: PENDING, ACTIVE, SUSPENDED, REJECTED
- Relations: menuItems, orders, analytics, payouts

#### 2. **MenuItem** (Menu Management)
- Detailed product info (name, description, price)
- Dietary info (vegan, vegetarian, gluten-free)
- Inventory tracking (optional)
- Image positioning (fine-tuned display)
- Availability tracking
- Relations: orderItems, cartReservations, demandHistory

#### 3. **Order** (Order Fulfillment)
- Multi-chef support (parentOrderId for grouped orders)
- Status tracking (PENDING_CONFIRMATION → PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED)
- Grace period tracking (8-min window for modifications)
- Pricing breakdown (subtotal, tax, delivery, discount, tip)
- Payment & delivery details
- Relations: items, customer, payments, notifications, receipt

#### 4. **OrderItem** (Line Items)
- References to menu items
- Quantity & price snapshot
- Special instructions
- Relations: order, menuItem

#### 5. **Customer** (User Accounts)
- Email & phone authentication
- Email verification (token + expiry)
- Phone OTP verification
- Password reset flow
- Account status: ACTIVE, SUSPENDED, DELETED
- Referral code & referrer tracking
- Login attempt tracking (5 max before lock)
- Relations: addresses, sessions, couponsUsed, referrals, orders, wallet

#### 6. **Admin** (Staff Management)
- Role-based access: STAFF, MANAGER, OWNER
- Email verification
- Password reset
- Last login tracking
- Relations: (no direct relations, used for authorization)

#### 7. **Payment** (Payment Processing)
- Multi-gateway support (Stripe, Razorpay, Cash, UPI, etc.)
- Amount & gateway fee tracking
- Webhook response storage
- Payout tracking (pending → in_transit → paid)
- Status: PENDING, PAID, FAILED, REFUNDED
- Relations: order

#### 8. **Receipt** (Invoice Generation)
- PDF storage (Cloudinary)
- Complete order snapshot as JSON
- Email tracking
- Relations: order (1:1)

#### 9. **Coupon** (Discount System)
- Type: MERCHANT (admin) or REFERRAL (user-generated)
- Discount: percentage or fixed amount
- Usage limits (total & per-user)
- Validity date range
- First-order restriction
- Category restrictions
- Relations: usages

#### 10. **CouponUsage** (Usage Tracking)
- Links coupon → customer → order
- Fraud prevention via IP tracking
- Relations: coupon, customer, order

#### 11. **Referral** (Growth System)
- Referrer ↔ Referee relationship
- Status: PENDING, COMPLETED, EXPIRED
- Fraud detection (score 0-100)
- Reward tracking (referrer & referee amounts)
- First order trigger
- Relations: referrer (Customer), referee (Customer)

#### 12. **Wallet** (Credits System)
- Balance: available + pending (24hr hold)
- Total earned & spent tracking
- Pending balance for fraud prevention
- Relations: transactions, customer

#### 13. **WalletTransaction** (Transaction History)
- Type: CREDIT, DEBIT, PENDING_CREDIT
- Source: REFERRAL_REWARD, JACKPOT, ORDER_PAYMENT, ADMIN_CREDIT, REFUND, MONTHLY_CHAMPION
- Clearance tracking (pending → cleared)
- Balance snapshots
- Relations: wallet

#### 14. **ReferralMilestone** (Gamification)
- Milestone types: FIFTH_REFERRAL, TENTH_REFERRAL, TWENTIETH_REFERRAL, MONTHLY_CHAMPION
- Reward amounts (₹200-₹5000)
- Status: PENDING, PAID, CANCELLED
- Relations: customer

#### 15. **NotificationLog** (Audit Trail)
- Type: email, sms, push, whatsapp
- Channel: order_confirmation, status_update, payment_confirmation
- Status: sent, failed, pending
- Retry tracking
- Relations: order

#### 16. **DailySales** (Analytics)
- Aggregated daily metrics
- Total orders, revenue, tax, delivery fees
- Average order value

#### Additional Models
- **CartReservation** - Soft locks for inventory urgency
- **ItemDemandHistory** - Demand patterns (adds to cart, orders, views)
- **KitchenCapacity** - Real-time kitchen utilization
- **IngredientInventory** - Stock tracking with expiry
- **DemandPrediction** - ML training data
- **DynamicPricing** - Price adjustment analytics
- **OrderMetrics** - ML features for predictions
- **ChefAnalytics** - Chef performance metrics
- **Payout** - Chef payout records
- **CustomerAddress** - Saved delivery addresses
- **UserSession** - Session token tracking

---

## CORE FEATURES & FLOWS

### 1. AUTHENTICATION FLOW

#### **Customer Registration** (`POST /api/auth/register`)
```
User Input (name, email, phone, password, referral code)
    ↓
Zod Validation (format, length, regex)
    ↓
Email & Phone Uniqueness Check
    ↓
Password Strength Validation (8+ chars, complexity)
    ↓
bcrypt Hash (12 rounds)
    ↓
Create Customer Record
    ↓
Generate Referral Code (e.g., "RAVI-FEAST")
    ↓
Create Wallet (initialized with ₹0)
    ↓
Process Referral (if referredBy provided)
    → Check for fraud (IP, device fingerprint)
    → Create Referral record (status: PENDING)
    → Apply ₹50 referee discount (auto-applied at checkout)
    ↓
Generate JWT Token (7-day expiry)
    ↓
Create Session Record
    ↓
Generate Email Verification Token
    ↓
Send Verification Email (async)
    ↓
Return 201 + token + customer object
    ↓
Set httpOnly cookie (secure, same-site: lax)
```

**Key Details:**
- Password: bcrypt with 12 rounds (slowest, most secure)
- Email/Phone: Unique constraints at DB level
- Referral Code: Generated from name (e.g., "Ravi Kumar" → "RAVI-FEAST")
- JWT Secret: environment-specific (CUSTOMER_JWT_SECRET)
- Cookie: httpOnly (prevents XSS), secure (HTTPS only in production)

#### **Customer Login** (`POST /api/auth/login`)
```
Email & Password Input
    ↓
Zod Validation
    ↓
Find Customer by Email
    ↓
Check if Account Locked (loginAttempts >= 5)
    → Yes: Return 403 "Account locked, reset password"
    ↓
Check Account Status (must be ACTIVE)
    → Not ACTIVE: Return 403 "Account suspended"
    ↓
Verify Password with bcrypt.compare()
    ↓
If Invalid:
    → Increment loginAttempts
    → Return 401 (generic "Invalid credentials")
    → After 5 attempts: Account locked
    ↓
If Valid:
    → Reset loginAttempts to 0
    → Update lastLoginAt & lastLoginIP
    → Generate JWT Token
    → Create Session
    → Return 200 + token + customer object
    ↓
Set httpOnly cookie
```

**Security Features:**
- Account locking after 5 failed attempts
- Generic error messages (don't reveal email existence)
- IP tracking for suspicious activity
- Password verification never exposed to logs
- 7-day session with automatic expiry

#### **Email Verification**
```
Registration generates random token (32 bytes)
    ↓
Token stored in Customer.emailVerificationToken
    ↓
Token expires in 24 hours (emailVerificationExpires)
    ↓
Verification email sent with token link
    ↓
User clicks link → POST /api/auth/verify-email?token=xxx
    ↓
Token validated (exists, not expired)
    ↓
Update Customer.emailVerified = true
    ↓
Clear token from DB
    ↓
Return success message
```

#### **Password Reset Flow**
1. User requests reset → `POST /api/auth/forgot-password` with email
2. System generates reset token (32 bytes, 1-hour expiry)
3. Email sent with reset link
4. User clicks link, submits new password
5. Token validated and password updated
6. Old token cleared from DB

#### **Admin Authentication** (Separate)
- Different JWT_SECRET (ADMIN_JWT_SECRET)
- Role-based access control (STAFF < MANAGER < OWNER)
- Email-based login only (no phone)
- Separate cookie domain handling

---

### 2. ORDER CREATION FLOW

#### **Complete Order Lifecycle**
```
STEP 1: VALIDATION
  ├─ Zod schema validation (customer, items, pricing, address)
  ├─ Cart not empty check
  ├─ Pricing integrity check (subtotal matches items)
  └─ Delivery address validation

STEP 2: CUSTOMER LINKING
  ├─ Extract customer ID from JWT token (if logged in)
  ├─ Create/link customer record
  └─ Validate customer exists

STEP 3: COUPON & REFERRAL VALIDATION
  ├─ If promoCode provided:
  │  ├─ Validate coupon code
  │  ├─ Check eligibility (user verified, order amount, usage limits)
  │  ├─ Calculate discount
  │  └─ Apply discount to pricing
  └─ If referee (first-time user with referral):
     ├─ Check if eligible (not already referred)
     ├─ Apply ₹50 discount automatically
     └─ Record referral usage

STEP 4: WALLET USAGE (If customer has credits)
  ├─ Check wallet balance (available, not pending)
  ├─ Calculate max usable amount
  ├─ Debit wallet (if walletAmount provided)
  ├─ Record transaction
  └─ Reduce order total

STEP 5: ORDER CREATION
  ├─ Generate unique orderNumber (e.g., "BK-2025-0123")
  ├─ Create Order with status: PENDING_CONFIRMATION
  ├─ Create OrderItems (line items)
  ├─ Store pricing breakdown
  ├─ Set grace period (8 minutes for modifications)
  └─ Store payment method details

STEP 6: INVENTORY MANAGEMENT
  ├─ If inventory tracking enabled:
  │  ├─ Check stock for each item
  │  ├─ Reserve inventory (CartReservation)
  │  └─ Auto-cleanup after 30 minutes
  └─ Track demand (ItemDemandHistory)

STEP 7: MULTI-CHEF ROUTING (If applicable)
  ├─ Route order to nearest chef(s)
  ├─ Split order if items from different chefs
  ├─ Create parent order group
  └─ Link child orders

STEP 8: NOTIFICATIONS
  ├─ Emit WebSocket event (admin receives notification)
  ├─ Send email confirmation (async)
  ├─ Log notification in NotificationLog
  └─ Sound alert on admin dashboard

STEP 9: ANALYTICS & ML
  ├─ Record OrderMetrics (timing, context, weather)
  ├─ Update ChefAnalytics (daily counts)
  ├─ Feed demand forecaster
  └─ Track customer behavior

STEP 10: RETURN
  ├─ 201 Created
  ├─ Return order object (id, orderNumber, status, estimatedReadyTime)
  └─ Return payment intent (if needed)

GRACE PERIOD (PENDING_CONFIRMATION state):
  ├─ Lasts 8 minutes
  ├─ Customer can modify order
  ├─ Hidden from kitchen
  ├─ Auto-confirms after grace period expires
  └─ Becomes PENDING (visible to kitchen)

ERROR HANDLING (Result<T,E> Pattern):
  ├─ ValidationError → 400 with field info
  ├─ RateLimitError → 429
  ├─ NotFoundError → 404
  ├─ ServerError → 500
  └─ NetworkError → 503 (with retry info)
```

**Key Validations:**
- Subtotal must equal sum of item prices × quantities
- Delivery address required for delivery orders
- Phone number format validation (10+ digits)
- Tax calculation: (subtotal - discount) × 5%
- Free delivery if subtotal ≥ ₹299

---

### 3. PAYMENT FLOW

#### **Payment Intent Creation** (`POST /api/payments/create-intent`)
```
REQUEST: { orderId, amount, paymentMethod, customerId }
    ↓
Validate order exists & status is valid
    ↓
GATEWAY SELECTION:
  ├─ If currency = INR → Use Razorpay (primary)
  └─ Else → Use Stripe (international)

FOR RAZORPAY:
  ├─ Create Razorpay order:
  │  └─ POST to Razorpay API (amount, currency, notes)
  ├─ Razorpay returns: orderId, shortUrl, amount
  ├─ Store in DB: Payment(status: PENDING, paymentIntentId: razorpayOrderId)
  └─ Return: { orderId, shortUrl, method: 'razorpay' }

FOR STRIPE:
  ├─ Create Stripe PaymentIntent:
  │  └─ POST to Stripe API (amount, currency, metadata)
  ├─ Stripe returns: clientSecret, paymentIntentId
  ├─ Store in DB: Payment(status: PENDING, paymentIntentId)
  └─ Return: { clientSecret, method: 'stripe' }

CLIENT:
  ├─ Receive payment intent
  └─ Use method-specific UI (Razorpay modal, Stripe checkout)

USER COMPLETES PAYMENT:
  ├─ Submit to payment gateway
  └─ Gateway sends webhook confirmation

WEBHOOK HANDLER (`/api/payments/webhook`):
  ├─ Verify signature (gateway-specific HMAC)
  ├─ Extract payment details
  ├─ Update Payment record: status = PAID
  ├─ Update Order: paymentStatus = PAID
  ├─ Calculate gateway fee
  ├─ Record payout info (if applicable)
  └─ Emit WebSocket event (kitchen receives order)
```

**Multiple Payment Methods Supported:**
- Stripe: International cards, Apple Pay, Google Pay
- Razorpay: UPI, cards, netbanking, Paytm
- Cash on Delivery: No payment needed (flag in paymentMethod)

---

### 4. REFERRAL & REWARDS SYSTEM

#### **Complete Referral Flow**
```
NEW USER SIGNUP WITH REFERRAL CODE:
  ├─ Enter referral code (e.g., "RAVI-FEAST") during registration
  ├─ Process new referral:
  │  ├─ Find referrer by code
  │  ├─ Run fraud detection (IP, device fingerprint, email, phone)
  │  ├─ Calculate fraud score (0-100)
  │  ├─ If fraud_score > threshold:
  │  │  └─ Mark referral as PENDING_VERIFICATION (requires admin review)
  │  ├─ Create Referral record (status: PENDING)
  │  ├─ Initialize wallet for referee (₹0)
  │  └─ Schedule ₹50 referee discount (auto-applied at first checkout)
  │
  └─ FRAUD CHECKS:
     ├─ Same IP as referrer? (+30 points)
     ├─ New device? (-10 points)
     ├─ Email domain suspicious? (+20 points)
     ├─ Phone number pattern suspicious? (+15 points)
     └─ Score determination: >50 = risky

REFEREE'S FIRST CHECKOUT:
  ├─ Check eligibility:
  │  ├─ Referral status = PENDING (not yet completed)
  │  ├─ Referee discount not yet applied
  │  └─ Referee email/phone verified
  │
  ├─ If eligible:
  │  ├─ Auto-apply ₹50 discount
  │  ├─ Create CouponUsage record
  │  ├─ Reduce order total by ₹50
  │  ├─ Calculate price after discount
  │  └─ Mark discount as applied
  │
  └─ Process payment with discounted total

REFEREE'S ORDER DELIVERED:
  ├─ Order status → DELIVERED
  ├─ Check referral completion:
  │  ├─ referral.status = PENDING
  │  ├─ firstOrderId now filled
  │  ├─ deliveryConfirmed = true
  │  └─ Fraud score was acceptable
  │
  ├─ REWARD REFERRER:
  │  ├─ Credit referrer wallet: +₹50 (or variable amount)
  │  ├─ Type: PENDING_CREDIT (24-hour hold)
  │  ├─ Create WalletTransaction:
  │  │  ├─ type: PENDING_CREDIT
  │  │  ├─ amount: 50
  │  │  ├─ source: REFERRAL_REWARD
  │  │  ├─ clearsAt: now + 24 hours
  │  │  └─ sourceId: referralId
  │  └─ Update Referral: status = COMPLETED
  │
  └─ AFTER 24 HOURS:
     ├─ Fraud detection confirms no suspicious activity
     ├─ Convert PENDING_CREDIT → CREDIT
     ├─ Update wallet balance
     └─ Referrer can now use credits

MILESTONE TRACKING:
  ├─ Track referrer's successful referrals
  ├─ MILESTONES (with random jackpot):
  │  ├─ 5th referral → ₹200-₹500 jackpot
  │  ├─ 10th referral → ₹500-₹1000 jackpot
  │  ├─ 20th referral → ₹1000-₹2000 jackpot
  │  └─ Monthly champion → ₹5000 (top referrer)
  │
  └─ WHEN MILESTONE HIT:
     ├─ Create ReferralMilestone record
     ├─ Emit celebration notification
     ├─ Credit wallet with jackpot amount
     └─ Leaderboard updated in real-time

REFERRAL VALIDATION PREVENTS:
  ├─ Same person with multiple accounts
  ├─ Fake referrals from same IP
  ├─ Suspicious device patterns
  ├─ Email address abuse
  ├─ Phone number farming
  └─ Coordinated fraud rings

LEADERBOARD (`/api/referral/leaderboard`):
  ├─ Top referrers by count
  ├─ Top by earnings
  ├─ Monthly champions
  └─ Real-time stats
```

---

### 5. WALLET & CREDITS SYSTEM

```
WALLET BALANCE COMPOSITION:
  ├─ Available: Ready to spend (past 24-hour hold)
  ├─ Pending: Earning clearance (24-hour fraud prevention hold)
  └─ Total: available + pending

WALLET TRANSACTION SOURCES:
  ├─ REFERRAL_REWARD: ₹50 per successful referral
  ├─ JACKPOT: Milestone bonuses (₹200-₹2000)
  ├─ MONTHLY_CHAMPION: Top referrer monthly prize (₹5000)
  ├─ ADMIN_CREDIT: Manual admin credit
  ├─ ORDER_PAYMENT: Using credits at checkout
  └─ REFUND: Order cancellation refunds

USING WALLET AT CHECKOUT:
  ├─ Customer can use available balance only
  ├─ Specify walletAmount in order request
  ├─ Validate customer has sufficient balance
  ├─ Create DEBIT transaction
  ├─ Update order pricing
  ├─ Reduce order total
  └─ Process payment for remaining amount

AUTOMATIC CLEARANCE:
  ├─ Pending transactions clear after 24 hours
  ├─ System checks for fraudulent activity
  ├─ If fraud detected: Hold extends or reversal
  ├─ If clean: Move to available balance
  └─ Async background job (scheduled task)
```

---

### 6. AI CHAT SYSTEM

#### **Chat Architecture** (`POST /api/chat`)
```
USER MESSAGE:
  ├─ Extract user message & sessionId
  ├─ Store message history (20 messages max)
  └─ Pass to OpenAI with system prompt

SYSTEM PROMPT CONFIGURATION:
  ├─ Personality: Food-obsessed sales genius
  ├─ Max length: 60 words per response
  ├─ Style: Funny, punchy, no bullets/markdown/emojis
  ├─ Critical rule: Show EXACT prices from DB
  └─ Urgency protocol: Check demand before recommending

AI FUNCTION CALLING (Tools):
  ├─ searchMenuItems(query, category, dietary, price)
  │  └─ Find dishes by text, filters
  │
  ├─ getPopularItems(category, vegetarian, limit)
  │  └─ Return bestselling items
  │
  ├─ getOrderStatus(orderNumber, phone, email)
  │  └─ Real-time order tracking
  │
  ├─ getDeliveryEstimate(zipCode, time)
  │  └─ Estimated delivery time
  │
  ├─ checkItemAvailability(itemNames[])
  │  └─ Check if items in stock
  │
  ├─ getCustomerOrderHistory(phone/email, limit)
  │  └─ Past orders for recommendations
  │
  ├─ calculateOrderTotal(items[], zipCode, promoCode)
  │  └─ Final pricing with all fees
  │
  ├─ addItemToCart(sessionId, itemId, quantity)
  │  └─ Add to cart with quantity
  │
  ├─ removeItemFromCart(sessionId, itemId)
  │  └─ Remove item from cart
  │
  ├─ proceedToCheckout(sessionId)
  │  └─ Finalize cart and redirect
  │
  └─ getItemDemandPressure(itemId)
     └─ Check urgency (high demand = higher price)

AI PRICING ACCURACY (CRITICAL):
  ├─ NEVER guess prices
  ├─ ALWAYS call searchMenuItems FIRST
  ├─ Quote EXACT price from DB
  ├─ Wrong price = lost customer trust

AI URGENCY PROTOCOL:
  ├─ Call getItemDemandPressure(itemId)
  ├─ If demand_score > 50:
  │  ├─ Lead with urgency message
  │  ├─ "This is HOT right now..."
  │  └─ Emphasize limited availability
  └─ Dynamic pricing adjusts based on demand

STREAMING RESPONSE:
  ├─ Use OpenAI streaming API
  ├─ Send chunks as they arrive
  ├─ Client receives real-time text
  ├─ Faster perceived response
  └─ Better UX (no "loading...")

CONVERSATION MEMORY:
  ├─ Store last 20 messages
  ├─ Include context in system prompt
  ├─ AI knows previous recommendations
  └─ Personalized for user history
```

**Function Definitions (Zod Schemas):**
- All functions have strict parameter validation
- Return type consistency (always include error handling)
- Time-based caching for performance
- Rate limiting per user per minute

---

### 7. COUPON & DISCOUNT SYSTEM

```
COUPON TYPES:
  ├─ MERCHANT: Created by admin (e.g., "WELCOME20")
  └─ REFERRAL: Auto-generated from referral code (e.g., "RAVI-FEAST")

COUPON CREATION (Admin):
  ├─ Code (unique, uppercase)
  ├─ Discount type: PERCENTAGE or FIXED_AMOUNT
  ├─ Discount value: 20 for 20%, 50 for ₹50
  ├─ Validity: validFrom → validUntil
  ├─ Max uses: total & per-user
  ├─ Restrictions:
  │  ├─ First order only
  │  ├─ Minimum order amount
  │  ├─ Applicable categories only
  │  └─ Max discount cap (for percentage)
  └─ Active flag: true/false

VALIDATION FLOW (`POST /api/coupons/validate`):
  ├─ Input: code, customerId, orderAmount, items
  │
  ├─ CHECKS:
  │  ├─ Code exists & active
  │  ├─ Not expired (date range valid)
  │  ├─ Customer logged in (for coupons)
  │  ├─ Email/phone verified
  │  ├─ Not exceeded usage limit
  │  ├─ Not exceeded per-user limit
  │  ├─ Order amount >= minimum
  │  ├─ If first-order-only: customer.totalOrders == 0
  │  ├─ If category-restricted: items match categories
  │  └─ Fraud checks (IP consistency, device)
  │
  ├─ DISCOUNT CALCULATION:
  │  ├─ If PERCENTAGE:
  │  │  ├─ discount = orderAmount × (percentValue / 100)
  │  │  ├─ If maxDiscountCap: discount = min(discount, cap)
  │  │  └─ Example: 20% on ₹500 = ₹100 (capped at ₹80) = ₹80
  │  │
  │  └─ If FIXED_AMOUNT:
  │     ├─ discount = fixedValue
  │     └─ Example: ₹50 off = ₹50
  │
  ├─ FRAUD DETECTION:
  │  ├─ Check IP (changed recently?)
  │  ├─ Check device (new device?)
  │  ├─ Email domain suspicious?
  │  ├─ Multiple accounts from same network?
  │  └─ Rapid coupon usage pattern?
  │
  └─ RETURN: { valid, discount, discountType, message }

COUPON USAGE AT CHECKOUT:
  ├─ Apply discount to order pricing
  ├─ Update tax calculation (on discounted amount)
  ├─ Create CouponUsage record
  ├─ Increment coupon.usageCount
  ├─ Mark customer as used (for per-user limits)
  └─ Log IP address for fraud prevention

AUTOMATIC COUPON APPLICATION:
  ├─ Referral discount (₹50 for referee) - auto-applied
  ├─ First-order discount - auto-applied if eligible
  ├─ Birthday discount - auto-applied if birthday
  └─ Loyalty discount - auto-applied based on totalOrders
```

---

### 8. MULTI-CHEF ORDERING

```
CHEF REGISTRATION FLOW:
  ├─ Basic info: name, businessName, phone, email
  ├─ Verification: FSSAI number, GST
  ├─ Location: address, service radius
  ├─ Cuisines: array of specialty cuisines
  ├─ Status: PENDING → (admin review) → ACTIVE or REJECTED
  └─ Commission: configurable percentage (default 10%)

MULTI-CHEF SUPPORT IN ORDERS:
  ├─ SINGLE-CHEF ORDER (default):
  │  ├─ All items from one chef
  │  ├─ Single order record (chefId set)
  │  └─ Simple fulfillment
  │
  └─ MULTI-CHEF ORDER:
     ├─ Items from different chefs
     ├─ Parent order created (parentOrderId = null)
     ├─ Child orders created (parentOrderId = parentId, chefId set)
     ├─ Each chef manages their portion
     ├─ Coordinated delivery (wait for all parts)
     └─ Combined receipt/invoice

ROUTING ALGORITHM:
  ├─ Find all chefs with items in stock
  ├─ Filter by:
  │  ├─ Service radius includes delivery address
  │  ├─ Chef status = ACTIVE
  │  ├─ Currently accepting orders
  │  └─ Min order amount met
  ├─ Score chefs by:
  │  ├─ Distance to customer
  │  ├─ Current kitchen capacity
  │  ├─ Average delivery time
  │  └─ Rating/reviews
  └─ Assign to best-scoring chef(s)

CHEF DASHBOARD:
  ├─ View pending orders
  ├─ Smart urgency indicator:
  │  ├─ Color-coded by priority
  │  ├─ Red: High demand, need to start now
  │  ├─ Yellow: Medium urgency
  │  └─ Green: Can wait
  ├─ Real-time demand forecaster
  │  ├─ Next 2 hours predictions
  │  ├─ Ingredient recommendations
  │  └─ Prep time estimates
  ├─ Menu manager
  │  ├─ Mark items unavailable
  │  ├─ Set preparation times
  │  └─ Manage inventory
  └─ Performance analytics
     ├─ Revenue (daily, weekly, monthly)
     ├─ Order count
     ├─ Average rating
     ├─ Popular items
     └─ Customer retention
```

---

## API ENDPOINTS REFERENCE

### **Authentication APIs** (8 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/register` | Create customer account | None |
| POST | `/api/auth/login` | Authenticate customer | None |
| POST | `/api/auth/logout` | Clear session | JWT |
| GET | `/api/auth/me` | Get current user | JWT |
| POST | `/api/auth/verify-email` | Verify email token | None |
| POST | `/api/auth/resend-verification` | Resend OTP | None |
| POST | `/api/auth/forgot-password` | Request reset | None |
| POST | `/api/auth/reset-password` | Confirm reset | None |
| POST | `/api/auth/change-password` | Change password | JWT |
| PATCH | `/api/auth/update-profile` | Update profile | JWT |

### **Order APIs** (8 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/orders` | Create order | Optional JWT |
| GET | `/api/orders` | List all orders (admin) | Admin JWT |
| GET | `/api/orders/my-orders` | Customer's orders | JWT |
| GET | `/api/orders/[id]` | Get order details | Optional |
| PATCH | `/api/orders/[id]` | Update order | Admin |
| PUT | `/api/orders/[id]/status` | Update status | Admin |
| POST | `/api/orders/cancel` | Cancel order | JWT |
| POST | `/api/orders/modify` | Modify (grace period) | JWT |
| POST | `/api/orders/finalize` | Mark delivered | Admin |
| GET | `/api/orders/pending-queue` | Kitchen queue | Admin |

### **Payment APIs** (5 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/payments/create-intent` | Create payment intent | JWT |
| POST | `/api/payments/webhook` | Handle webhook | None |
| POST | `/api/payments/instant` | Instant payment | JWT |
| GET | `/api/payments/financials` | Financial reports | Admin |
| POST | `/api/payments/test` | Test payment | Dev |

### **Menu APIs** (2 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/menu` | Get all items | None |
| POST | `/api/menu` | Create item | Admin |
| PATCH | `/api/menu/[id]` | Update item | Admin |
| DELETE | `/api/menu/[id]` | Delete item | Admin |

### **Search APIs** (2 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/search` | Search menu with filters | None |
| POST | `/api/search` | Advanced search | None |

### **Chat API** (1 endpoint)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/chat` | AI chat (streaming) | Optional JWT |

### **Chef APIs** (3 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/chefs` | List chefs | None |
| POST | `/api/chefs` | Register chef | None |
| GET | `/api/chefs/[slug]` | Chef profile | None |
| GET | `/api/chefs/[slug]/menu` | Chef's menu | None |
| GET | `/api/chefs/[slug]/analytics` | Chef stats | Chef JWT |

### **Wallet APIs** (2 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/wallet/balance` | Check balance | JWT |
| GET | `/api/wallet/transactions` | Transaction history | JWT |

### **Referral APIs** (3 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/referral/history` | Referral records | JWT |
| GET | `/api/referral/leaderboard` | Top referrers | None |
| GET | `/api/referral/milestones` | Milestone tracking | JWT |

### **Customer APIs** (4 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/customer/taste-profile` | AI taste analysis | JWT |
| GET | `/api/customer/achievements` | Earned badges | JWT |
| GET | `/api/customer/insights` | Smart recommendations | JWT |
| GET | `/api/customer/referral-stats` | Referral metrics | JWT |

### **Admin APIs** (3 endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/admin/login` | Admin login | None |
| GET | `/api/admin/me` | Current admin | Admin JWT |
| POST | `/api/admin/refunds` | Process refund | Admin |

### **Utility APIs** (5+ endpoints)
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/coupons/validate` | Validate coupon | JWT |
| GET | `/api/kitchen/capacity` | Kitchen status | Admin |
| GET | `/api/ingredients/expiry-alerts` | Expiring stock | Admin |
| GET | `/api/forecast/demand` | Demand prediction | Admin |
| POST | `/api/analytics` | Track events | Optional |
| POST | `/api/upload` | Upload image | JWT |
| POST | `/api/legal/accept` | Accept T&C | Optional |

---

## AUTHENTICATION SYSTEM

### **Customer Authentication**
- **Method:** JWT (7-day expiry)
- **Secret:** `JWT_SECRET` or `CUSTOMER_JWT_SECRET`
- **Payload:**
  ```json
  {
    "customerId": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "phoneVerified": false,
    "iat": 1234567890,
    "exp": 1234654290
  }
  ```
- **Token Location:** httpOnly cookie + Authorization header
- **Verification:** Checked on every request requiring auth
- **Session Tracking:** UserSession table stores token hash + metadata

### **Admin Authentication**
- **Method:** JWT (7-day expiry)
- **Secret:** `ADMIN_JWT_SECRET` (separate from customer)
- **Payload:**
  ```json
  {
    "adminId": "uuid",
    "email": "admin@example.com",
    "role": "MANAGER"
  }
  ```
- **Permissions by Role:**
  - **STAFF:** View/update orders only
  - **MANAGER:** + Menu management + Analytics
  - **OWNER:** All permissions + User management

### **Password Security**
- **Hashing:** bcrypt with 12 rounds
- **Storage:** passwordHash in Customer/Admin table (never plain text)
- **Verification:** bcrypt.compare() on login
- **Reset:** Token-based (32-byte random token, 1-hour expiry)

### **Email Verification**
- **Token:** 32-byte random hex string
- **Expiry:** 24 hours
- **Purpose:** Verify email ownership before allowing coupons
- **Resend:** Available 5 times per 24 hours

### **Phone Verification** (Optional)
- **Method:** OTP via SMS/WhatsApp
- **Expiry:** 10 minutes
- **Attempts:** Max 3 per OTP

### **Session Management**
- **Storage:** UserSession table
- **Fields:** customerId, tokenHash, expiresAt, isRevoked, userAgent, ipAddress
- **Cleanup:** Automatic expiry on logout or token expiration
- **Cross-tab Sync:** BroadcastChannel API for real-time logout

---

## PAYMENT INTEGRATION

### **Supported Gateways**
1. **Stripe** (International)
   - Cards (Visa, Mastercard, Amex)
   - Apple Pay, Google Pay
   - ACH transfers
   - 2.9% + 30¢ fee per transaction
   - Webhook verification: HMAC-SHA256

2. **Razorpay** (India Primary)
   - UPI, cards, netbanking, Paytm
   - NEFT/RTGS payouts
   - 2-2.36% fee + ₹0-5 per transaction
   - Webhook verification: HMAC-SHA256

3. **Cash on Delivery**
   - No payment processing needed
   - Manual collection at delivery
   - Flag: paymentMethod = "cash-on-delivery"
   - Manual mark-paid in admin

### **Payment Flow**
1. **Order Creation:** Status = PENDING (awaiting payment)
2. **Intent Creation:** Generate payment intent
3. **Client Redirect:** User enters payment details
4. **Gateway Processing:** Gateway collects payment
5. **Webhook Confirmation:** Async callback with signature verification
6. **Order Confirmation:** Status = CONFIRMED (after payment)
7. **Delivery:** Normal fulfillment flow

### **Webhook Security**
- **Verification:** HMAC signature validation
- **Idempotency:** Check if payment already recorded
- **Logging:** All webhook calls logged for debugging
- **Retry:** Webhook retried if processing fails

### **Refund Flow**
- **Admin Initiates:** POST `/api/admin/refunds`
- **Full/Partial:** Support both types
- **Destination:** Refund to original payment method
- **Status Tracking:** Separate refund transaction record
- **Timeline:** 3-5 business days (gateway dependent)

---

## KEY COMPONENTS

### **Frontend Components**

#### **Header.tsx**
- Navigation bar with logo
- Cart icon with item count
- Login/Logout buttons
- Search bar

#### **CheckoutModal.tsx**
- Multi-step form:
  1. Customer info (name, email, phone)
  2. Delivery address (street, city, zip)
  3. Payment method selection
  4. Coupon/promo code
  5. Order review & confirmation
- Uses React Hook Form + Zod
- Optimistic cart updates
- Error handling with retries

#### **CartSidebar.tsx**
- Real-time cart display
- Add/remove/update quantity
- Subtotal, tax, delivery fee, total
- Apply coupon code
- Checkout button
- Persistent to localStorage

#### **OrderTracking.tsx**
- Real-time order status
- Status: PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
- Estimated time remaining
- Map view (optional)
- Notifications on status change

#### **AdvancedSearch.tsx**
- Text search (fuzzy matching)
- Filters:
  - Category
  - Dietary (vegan, vegetarian)
  - Spice level
  - Price range
- Results with sorting options

#### **TasteProfileWheel.tsx**
- Visual taste preference selector
- AI-powered recommendations based on selections
- Real-time filtering of menu

#### **CulinaryPassport.tsx**
- Track global food journey
- Map view of cuisines tried
- Achievements unlocked
- Badges earned
- Cultural storytelling

#### **AchievementGallery.tsx**
- All unlocked badges
- Progress toward next milestones
- Sharing capabilities
- Celebration animations

### **Admin Components**

#### **KitchenOrders.tsx**
- Real-time order board
- Color-coded by urgency:
  - Red: High demand, start NOW
  - Yellow: Medium urgency
  - Green: Can wait
- Quick actions: Start preparing, ready, pickup
- Filter by status, customer, time

#### **KitchenIntelligenceTab.tsx**
- AI-powered insights:
  - Next 2-hour demand forecast
  - Recommended prep items
  - Ingredient shortage alerts
  - Peak hour predictions

#### **Menu Manager Components**
- Add/edit/delete menu items
- Image upload with positioning
- Dietary labels
- Inventory tracking
- Pricing & discounts

---

## CRITICAL LIBRARIES & UTILITIES

### **Result Type Pattern** (`utils/result.ts`)
```typescript
// Erlang-inspired error handling
type Result<T, E> = Ok<T> | Err<E>

// Usage:
const result = await createOrder(data);
if (result.isErr()) {
  // Handle error
  console.error(result.error.message);
} else {
  // Use result.value
  console.log(result.value.id);
}
```

**Error Types:**
- `ValidationError` - Input validation failed
- `NotFoundError` - Resource not found
- `RateLimitError` - Too many requests
- `TimeoutError` - Request timeout
- `NetworkError` - Network failure
- `ServerError` - Server error
- `RetriableError` - Automatic retry candidate
- `PermanentError` - Should not retry

### **Logger** (`utils/logger.ts`)
```typescript
logger.info('Order created', {
  orderId: order.id,
  customerId: customer.id,
  amount: order.total,
  duration: 142, // ms
});

logger.error('Payment failed', {
  orderId: order.id,
  error: error.message,
});
```

**Log Levels:** DEBUG, INFO, WARN, ERROR, FATAL
**Structured Output:** JSON format for log aggregation

### **Rate Limiting** (`utils/rate-limit.ts`)
```typescript
// Token bucket algorithm
applyRateLimit(req, limit: {
  max: 10,        // 10 requests
  window: '1m',   // per minute
  id: 'user:123'
});
```

**Built-in Limits:**
- Orders: 10/minute per IP
- Auth: 5/minute per IP (login attempts)
- Chat: 30/hour per user
- Analytics: 100/minute per IP

### **Retry Mechanism** (`utils/retry.ts`)
```typescript
retry(async () => {
  return await externalAPI.call();
}, {
  maxAttempts: 3,
  initialDelay: 100,
  backoff: 'exponential' // 100ms, 200ms, 400ms
});
```

### **Currency Formatting** (`utils/currency.ts`)
```typescript
formatPrice(299.99); // "₹299.99"
parseCurrency("₹500"); // 500
```

---

## EXTERNAL INTEGRATIONS

### **OpenAI Integration**
- **Model:** GPT-4o (latest available)
- **Features:** Text completion, function calling, streaming
- **Rate Limit:** 200k tokens/month (shared)
- **Cost:** ~$5-10/month for typical usage
- **Fallback:** Graceful degradation if API unavailable

### **Stripe Integration**
- **Purpose:** International payment processing
- **Features:** PaymentIntent, Webhooks, Refunds
- **Test Keys:** pk_test_*, sk_test_*
- **Webhook Events:** payment_intent.succeeded, payment_intent.payment_failed
- **Fees:** 2.9% + $0.30 per transaction

### **Razorpay Integration**
- **Purpose:** Indian payment gateway (primary)
- **Features:** Orders, Payments, Refunds, Payouts
- **API:** REST + Webhooks
- **Test Keys:** Available on dashboard
- **Webhook Events:** payment.captured, payment.failed, refund.created
- **Fees:** 2-2.36% per transaction

### **Cloudinary Integration**
- **Purpose:** Image hosting & optimization
- **Features:** Upload, transform, CDN delivery
- **Configuration:**
  ```
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  ```
- **Usage:** Menu item images, chef logos
- **Benefits:** Automatic optimization, responsive images, caching

### **Email Services**
- **Primary:** Resend (modern email API)
- **Fallback:** Nodemailer (SMTP)
- **Templates:**
  - Welcome email
  - Email verification OTP
  - Order confirmation
  - Status updates
  - Password reset

### **SMS/Notifications**
- **Twilio:** SMS & WhatsApp messages
- **Purpose:** Order alerts, verification OTPs
- **Optional:** Can disable if not configured

### **WebSocket Integration**
- **Socket.io:** Real-time order updates
- **Use Cases:**
  - Live order status (admin sees new orders instantly)
  - Customer notifications
  - Chat messaging
  - Kitchen urgency indicators

---

## CONFIGURATION & ENVIRONMENT SETUP

### **Database Configuration**
```bash
# PostgreSQL (production)
DATABASE_URL="postgresql://user:pass@localhost:5432/gharse"

# Or Supabase
DATABASE_URL="postgresql://user:pass@db.supabasehost.com:5432/postgres"

# Or with Prisma Accelerate (connection pooling)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=xxxx"
```

### **Authentication Secrets**
```bash
JWT_SECRET="your-super-secret-jwt-key-change-this"
CUSTOMER_JWT_SECRET="customer-secret-key"
ADMIN_JWT_SECRET="admin-secret-key"
NEXTAUTH_SECRET="nextauth-secret"
```

### **Payment Keys**
```bash
# Stripe
STRIPE_PUBLIC_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="xxx"
RAZORPAY_WEBHOOK_SECRET="xxx"
```

### **AI Configuration**
```bash
OPENAI_API_KEY="sk-xxx"
OPENAI_MODEL="gpt-4o"
CHAT_MAX_HISTORY=20
CHAT_TEMPERATURE=0.9
```

### **Image Upload**
```bash
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
```

### **Email Configuration**
```bash
EMAIL_PROVIDER="resend" # or "smtp"
RESEND_API_KEY="re_xxx"
# OR SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"
```

### **Feature Flags**
```bash
ENABLE_AI_CHAT=true
ENABLE_REFERRALS=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_FRAUD_DETECTION=true
MULTI_CHEF_MODE=false # Enable for marketplace
```

### **Server Configuration**
```bash
NODE_ENV="development" # or production
PORT="3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
LOG_LEVEL="info"
RATE_LIMIT_MAX=100
SESSION_EXPIRY=604800 # 7 days in seconds
```

---

## KNOWN ISSUES & BUG TRACKING

### **Recent Fixes Documented** (from repo)
1. **Curry Search Error** - Fixed search algorithm for spice filters
2. **Cart Z-Index Issues** - Fixed modal stacking with Tailwind
3. **Item Matching** - Improved cart item reconciliation
4. **Reload Loop** - Fixed infinite reload on auth
5. **HMR Issues** - Next.js hot reload optimization
6. **Login Fixes** - Email case-sensitivity resolution
7. **Password Reset** - Database migration & token handling
8. **Checkout UX** - Button disable states, loading indicators
9. **Auth Modals** - Pixel-perfect conversion optimizations
10. **Admin Dashboard** - Performance optimizations for large datasets

### **Critical Areas for Audit**
1. **Cross-Tab Auth Sync** - BroadcastChannel API reliability
2. **WebSocket Stability** - Reconnection handling
3. **Payment Webhooks** - Idempotency & race conditions
4. **Referral Fraud** - ML model accuracy
5. **Inventory Tracking** - Race conditions in concurrent orders
6. **Cache Invalidation** - Redis key expiration
7. **Rate Limiting** - Token bucket accuracy
8. **Email Delivery** - Spam scoring & deliverability

---

## TESTING & QUALITY ASSURANCE

### **Test Files & Coverage**
```
__tests__/
  ├── api/                      # API route tests
  │   ├── auth.test.ts
  │   ├── orders.test.ts
  │   └── payments.test.ts
  ├── context/                  # Context tests
  │   └── CartContext.test.ts
  └── integration/              # End-to-end flows
      └── checkout-flow.test.ts

e2e/
  └── order-flow.spec.ts        # Playwright E2E
```

### **Running Tests**
```bash
npm run test              # Jest unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e        # Playwright tests
npm run test:all        # All tests
npm run green:all       # Full validation (lint, build, test, smoke)
```

### **Quality Checks**
```bash
npm run lint             # ESLint
npm run type-check       # TypeScript strict check
npm run build            # Next.js build
npm run smoke            # Smoke tests
```

---

## CRITICAL SECURITY MEASURES

1. **Input Validation:** Zod schemas on all API endpoints
2. **SQL Injection:** Prisma parameterized queries (no raw SQL)
3. **XSS Prevention:** React auto-escaping, no dangerouslySetInnerHTML
4. **CSRF Protection:** SameSite cookies, no state-changing GET requests
5. **Rate Limiting:** Token bucket algorithm per IP/user
6. **Password Hashing:** bcrypt 12 rounds (not MD5/SHA1)
7. **JWT Secrets:** Environment-specific, rotated in production
8. **Webhook Verification:** HMAC signature validation
9. **Fraud Detection:** ML model + manual flags
10. **Logging:** No passwords/cards/sensitive data logged

---

## DEPLOYMENT CHECKLIST

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Email service configured
- [ ] Payment gateway keys added
- [ ] AI API keys validated
- [ ] Image upload tested
- [ ] Redis configured (if using cache)
- [ ] WebSocket tested
- [ ] Rate limiting configured
- [ ] Backups scheduled
- [ ] Monitoring set up (Sentry, etc.)
- [ ] SSL/HTTPS enabled
- [ ] Security headers set
- [ ] CORS configured
- [ ] Logging aggregation active

---

## MONITORING & OBSERVABILITY

### **Metrics to Track**
- Orders/hour
- Conversion rate
- Checkout success rate
- Payment failure rate
- API response times (p50, p95, p99)
- Error rates by endpoint
- WebSocket connection stability
- Database query performance
- Cache hit rates
- Email delivery rates

### **Alerts to Set Up**
- Payment failure spike
- API timeout spike
- Database connection pool exhaustion
- High error rate (>5%)
- WebSocket connection drops
- Rate limit attacks
- Email delivery failures
- Fraud score threshold breached

---

**Report Generated:** 2025-01-15
**Total Codebase Size:** ~233 TypeScript/React files
**Total Lines of Code:** 10,000+ (excluding node_modules)
**API Endpoints:** 60+
**Database Tables:** 20+
**Documented Flows:** 8 major flows
**External Integrations:** 6+
**Test Files:** 15+

