# 🧬 ARCHITECTURE DOCUMENTATION
## Bantu's Kitchen - System Design & Code Flow

**Version:** 2.0 (ARCHITECT-Enhanced)  
**Last Updated:** 2025-01-XX  
**Philosophy:** Production-ready, self-healing, future-proof architecture

---

## 📐 SYSTEM OVERVIEW

Bantu's Kitchen is a Next.js 14 full-stack application for food ordering, built with TypeScript, React 19, and Tailwind CSS. The architecture follows **THE ARCHITECT** principles: self-healing systems, defensive coding, and zero-downtime evolution.

### Core Principles

1. **Result-Type Error Handling** (Erlang-inspired): Every operation that can fail returns `Result<T, E>` instead of throwing
2. **Circuit Breakers** (Joe Armstrong): Auto-recover from external service failures
3. **Rate Limiting** (Carmack): Protect hot paths from abuse
4. **Observability First** (NASA JPL): Structured logging, metrics, and traces
5. **Type Safety** (Anders Hejlsberg): TypeScript with strict mode, no `any` escapes
6. **Memory Safety** (Ken Thompson): Bounded caches, cleanup on unmount

---

## 🏗️ ARCHITECTURE LAYERS

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  React Components (Client-Side Rendered with SSR support)   │
│  - Header, MenuSection, CartSidebar, CheckoutModal         │
│  - Uses CartContext for state management                    │
│  - Optimistic UI updates with rollback on failure          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Next.js API Routes (Server-Side)                            │
│  - /api/orders      → Order management                       │
│  - /api/search      → Menu search with filters              │
│  - /api/analytics   → Event tracking                        │
│  - /api/payments    → Payment processing (Stripe)            │
│                                                              │
│  Features:                                                     │
│  - Request validation (Zod schemas)                         │
│  - Rate limiting (per IP, per route)                        │
│  - Circuit breakers for external services                   │
│  - Structured logging                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    DOMAIN LAYER                              │
│  Business Logic (Pure Functions)                             │
│  - Cart calculations (calculateTotals)                      │
│  - Order lifecycle management                                │
│  - Menu filtering and search                                 │
│  - Price formatting                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    DATA LAYER                                │
│  Current: In-memory storage (menuItems, orders arrays)        │
│  Future: PostgreSQL + Redis (for production)                  │
│                                                              │
│  Note: Easy migration path - just swap implementations     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 CODE FLOW DIAGRAMS

### Order Creation Flow (Happy Path)

```
User clicks "Place Order"
    │
    ▼
CheckoutModal.validateForm()
    │
    ├─ [Invalid] → Show errors, stop
    │
    └─ [Valid] → CheckoutModal.handleSubmit()
            │
            ▼
        API: POST /api/orders
            │
            ├─ Rate Limiter (10 req/sec per IP)
            │   │
            │   ├─ [Exceeded] → Return 429, stop
            │   │
            │   └─ [OK] → Continue
            │
            ├─ Request Validator (Zod schema)
            │   │
            │   ├─ [Invalid] → Return 400 with details
            │   │
            │   └─ [Valid] → Continue
            │
            ├─ Create Order Object
            │   │
            │   ├─ Generate unique ID (UUID)
            │   ├─ Calculate pricing (tax, delivery)
            │   └─ Set estimated ready time
            │
            ├─ Save to Storage (in-memory → DB in production)
            │
            ├─ Send Notifications (email, SMS)
            │   │
            │   └─ Circuit Breaker (if service down, queue for retry)
            │
            └─ Return 201 { order, orderNumber }
                    │
                    ▼
            CheckoutModal receives success
                    │
                    ▼
            clearCart() → localStorage.clear()
                    │
                    ▼
            Show confirmation screen
```

### Error Recovery Flow (Order Creation Failure)

```
User clicks "Place Order"
    │
    ▼
API: POST /api/orders fails (network timeout)
    │
    ▼
Result<Order, ApiError>.isErr() === true
    │
    ▼
CheckoutModal error handler
    │
    ├─ Check error type:
    │   │
    │   ├─ TimeoutError → Show "Network slow, retrying..."
    │   │   │
    │   │   └─ Auto-retry with exponential backoff (3 attempts)
    │   │
    │   ├─ ValidationError → Show field-level errors
    │   │
    │   ├─ RateLimitError → Show "Too many requests, wait 1 minute"
    │   │
    │   └─ ServerError → Show "Service unavailable, try later"
    │       │
    │       └─ Enable "Save Order Draft" button (localStorage)
    │
    └─ User can:
        ├─ Retry manually
        ├─ Save draft and continue later
        └─ Contact support
```

### Cart State Management Flow

```
User adds item to cart
    │
    ▼
MenuSection.handleAddToCart()
    │
    ▼
CartContext.addItem(menuItem, quantity)
    │
    ├─ Optimistic UI update (immediate)
    │   └─ CartSidebar shows item instantly
    │
    ▼
cartReducer('ADD_ITEM', { menuItem, quantity })
    │
    ├─ Check if identical item exists (same customizations)
    │   │
    │   ├─ [Yes] → Update quantity, recalculate subtotal
    │   │
    │   └─ [No] → Create new CartItem with unique ID
    │
    ▼
calculateTotals(items)
    │
    ├─ Sum item subtotals
    ├─ Check free delivery threshold
    ├─ Calculate tax (5% on subtotal)
    └─ Compute final total
    │
    ▼
Return new Cart state (immutable)
    │
    ▼
useEffect(() => { localStorage.setItem(...) })
    │
    ├─ Persist to localStorage (survives refresh)
    │
    └─ On page reload → useEffect(() => { localStorage.getItem(...) })
                            │
                            └─ Restore cart state
```

---

## 🛡️ ERROR HANDLING STRATEGY

### Result Type Pattern (Rust/Haskell-inspired)

Every operation that can fail returns `Result<T, E>` instead of throwing exceptions:

```typescript
// ❌ OLD WAY (throws, breaks call chain)
async function createOrder(data: OrderData): Promise<Order> {
  if (!data.items.length) throw new Error('Empty cart');
  const order = await db.orders.create(data);
  return order;
}

// ✅ ARCHITECT WAY (returns Result, never throws)
async function createOrder(data: OrderData): Promise<Result<Order, AppError>> {
  if (!data.items.length) {
    return Err(new ValidationError('Cart is empty'));
  }
  
  const result = await db.orders.create(data);
  if (result.isErr()) {
    return Err(result.error);
  }
  
  return Ok(result.value);
}

// Usage:
const result = await createOrder(orderData);
if (result.isErr()) {
  // Handle error gracefully
  showToast(result.error.message);
  return;
}
// Use result.value safely
```

### Error Classification

```
AppError (base)
├─ ValidationError (400) - User input invalid, show field errors
├─ NotFoundError (404) - Resource doesn't exist, show "not found
├─ RateLimitError (429) - Too many requests, show wait time
├─ TimeoutError (408) - Request took too long, auto-retry
├─ NetworkError (network) - No internet, show offline message
├─ ServerError (500) - Backend issue, show "service unavailable"
└─ UnknownError (?) - Unexpected, log and show generic message
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Hot Path Optimizations

1. **Cart Calculations** (`calculateTotals`)
   - O(n) complexity, where n = cart items
   - Memoized with `useMemo` in CartContext
   - Recalculates only when items change

2. **Menu Search** (`/api/search`)
   - Linear scan O(n) - acceptable for <100 items
   - Future: Add full-text search index (Postgres, Algolia)
   - Debounced input (300ms) to reduce API calls

3. **Image Loading**
   - Next.js Image component (automatic optimization)
   - Lazy loading for below-fold images
   - WebP/AVIF formats with fallback

4. **State Updates**
   - Optimistic UI updates (instant feedback)
   - Batch localStorage writes (debounced)
   - React.memo for expensive components

### Memory Management

1. **Cart Persistence**
   - localStorage (max 5MB per domain)
   - Cleanup: Remove items older than 7 days
   - Compression: JSON.stringify (acceptable for small carts)

2. **Component Cleanup**
   - All `useEffect` hooks return cleanup functions
   - Event listeners removed on unmount
   - Polling intervals cleared (order tracking)

3. **API Response Caching**
   - Menu items: Cache in memory (never change during session)
   - Orders: No cache (real-time data)
   - Search results: 5-minute TTL cache

---

## 🔒 SECURITY MEASURES

### Input Validation

- **Client-Side**: React Hook Form + Zod schemas
- **Server-Side**: Zod validation in API routes (never trust client)
- **SQL Injection**: Not applicable (no raw SQL), but future-proof with parameterized queries

### Rate Limiting

- **Per IP**: 10 requests/second for order creation
- **Per Route**: Different limits per endpoint (analytics more lenient)
- **Implementation**: Token bucket algorithm (in-memory for now, Redis in production)

### Data Sanitization

- **XSS Prevention**: React escapes HTML by default, no `dangerouslySetInnerHTML`
- **CSRF**: SameSite cookies, no state-changing GET requests
- **Sensitive Data**: Never log passwords, payment cards, full addresses in production

---

## 📊 OBSERVABILITY

### Logging Levels

```
DEBUG   → Development only (request/response bodies)
INFO    → Normal operations (order created, payment processed)
WARN    → Recoverable issues (retry succeeded, slow query)
ERROR   → Failures (API error, validation failure)
FATAL   → System cannot recover (database down, memory leak)
```

### Structured Logs

```typescript
logger.info({
  userId: user.id,
  orderId: order.id,
  amount: order.total,
  duration: 142, // ms
  ip: req.ip,
}, 'Order created successfully');
```

### Metrics (Future)

- **RED Metrics**: Rate (req/sec), Errors (% of requests), Duration (p95, p99)
- **Business Metrics**: Orders/day, Revenue, Average order value
- **Health Checks**: `/api/health` endpoint for uptime monitoring

---

## 🔄 EVOLUTION PATH

### Phase 1: Current (In-Memory)
- Menu items: Static array
- Orders: In-memory array (lost on restart)
- Cart: localStorage

### Phase 2: Database Migration (Next)
- PostgreSQL for orders, menu items
- Redis for session cache, rate limiting
- Prisma ORM for type-safe queries

### Phase 3: Production Scale
- CDN for static assets (Vercel Edge Network)
- Database connection pooling
- Read replicas for analytics queries
- Background jobs (email, SMS) via queue (Bull/BullMQ)

### Migration Strategy

1. **Dual-Write Period**: Write to both in-memory and DB for 1 week
2. **Read from DB**: Switch reads to DB, verify parity
3. **Remove Old Code**: Delete in-memory implementation

**Zero Downtime**: Feature flags control rollout percentage.

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Pure functions: `calculateTotals`, `formatPrice`
- Reducers: `cartReducer` (all action types)
- Validators: Zod schemas

### Integration Tests
- API routes: Test request/response cycle
- Cart flow: Add → Update → Remove → Checkout

### E2E Tests
- User journey: Browse menu → Add items → Checkout → Confirm order
- Error scenarios: Network failure, validation errors

### Property-Based Tests (Future)
- Cart calculations are associative and commutative
- Order totals match sum of line items

---

## 📁 FILE ORGANIZATION

```
bantus-kitchen/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (server-side)
│   │   ├── orders/
│   │   │   ├── route.ts         # POST (create), GET (list)
│   │   │   └── [id]/
│   │   │       └── route.ts     # GET (read), PATCH (update)
│   │   ├── search/
│   │   │   └── route.ts         # GET (search menu)
│   │   ├── analytics/
│   │   │   └── route.ts         # POST (track), GET (stats)
│   │   └── payments/
│   │       └── create-intent/
│   │           └── route.ts    # POST (Stripe integration)
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                 # Homepage
│   └── globals.css              # Global styles
│
├── components/                   # React Components (client-side)
│   ├── Header.tsx
│   ├── MenuSection.tsx
│   ├── CartSidebar.tsx
│   ├── CheckoutModal.tsx
│   └── ...
│
├── context/                      # React Context
│   └── CartContext.tsx          # Cart state management
│
├── utils/                        # Utility Functions
│   ├── currency.ts              # Price formatting
│   ├── result.ts                # Result<T, E> type
│   ├── logger.ts                 # Structured logging
│   ├── retry.ts                  # Retry with backoff
│   └── rate-limit.ts            # Rate limiting
│
├── types/                        # TypeScript Definitions
│   └── index.ts                  # All types
│
├── data/                         # Static Data
│   └── menuData.ts              # Menu items, restaurant info
│
└── scripts/                      # Build & Test Scripts
    └── smoke.mjs                 # Smoke tests
```

---

## 🎯 KEY DECISIONS (ADRs)

### ADR-001: Result Type Over Exceptions
**Decision**: Use `Result<T, E>` pattern instead of try/catch everywhere.  
**Rationale**: Forces error handling at compile time, prevents silent failures.  
**Trade-off**: More verbose, but safer in production.

### ADR-002: In-Memory Storage Initially
**Decision**: Start with in-memory arrays, migrate to DB later.  
**Rationale**: Faster development, easier testing, clear migration path.  
**Trade-off**: Data lost on restart, but acceptable for MVP.

### ADR-003: Client-Side Cart Persistence
**Decision**: Use localStorage for cart recovery.  
**Rationale**: Works offline, survives refresh, no server dependency.  
**Trade-off**: Not synced across devices (future: add user accounts).

---

## 🚀 QUICK REFERENCE

### How to Add a New API Route

1. Create `app/api/[route]/route.ts`
2. Export `GET`/`POST`/`PATCH`/`DELETE` functions
3. Add Zod validation schema
4. Use `Result<T, E>` for operations that can fail
5. Add rate limiting middleware
6. Log structured events
7. Return proper HTTP status codes

### How to Add a New Component

1. Create `.tsx` file in `components/`
2. Use TypeScript with strict types
3. Handle loading/error states
4. Clean up event listeners in `useEffect` cleanup
5. Use `React.memo` if component is expensive

### How to Debug Production Issues

1. Check structured logs (search for `orderId`, `userId`)
2. Review metrics dashboard (error rate, latency)
3. Test in staging with same data
4. Enable debug logging for specific request IDs

---

## 📚 FURTHER READING

- [Result Type Pattern](https://github.com/badrap/result)
- [Circuit Breakers](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Rate Limiting Strategies](https://stripe.com/blog/rate-limiters)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Built with THE ARCHITECT philosophy: Code that outlives you.**

