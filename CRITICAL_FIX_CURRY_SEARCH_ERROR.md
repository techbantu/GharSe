# CRITICAL FIX - Curry Search Error

## Issue

**Problem:** AI showing error message when user searches for "curries":
> "Looks like there's a slight hiccup searching curries. Technical munchies, am I right?"

## Root Cause

**Line 202 in `lib/ai-chat-functions.ts`:**
```typescript
{ ingredients: { hasSome: [params.query] } }
```

**Why this failed:**
- `hasSome` is a **PostgreSQL-specific** operator for array fields
- The database is using **SQLite** (from `prisma/schema.prisma`: `provider = "sqlite"`)
- SQLite stores `ingredients` as **JSON strings**, not arrays
- SQLite doesn't support `hasSome` operator → Query crashes

## Solution

**Changed to SQLite-compatible query:**
```typescript
// OLD (PostgreSQL syntax)
{ ingredients: { hasSome: [params.query] } }

// NEW (SQLite-compatible)
{ ingredients: { contains: params.query } }
```

## How It Works Now

When user searches for "curries" or any ingredient:

1. **Name search:** Looks in dish names (case-insensitive)
   - "Butter **Chicken**" matches "chicken"
   - "**Curry** Chicken" matches "curry"

2. **Description search:** Looks in descriptions
   - "Tender chicken in rich **tomato curry** sauce"

3. **Ingredients search:** Looks in JSON string (now fixed!)
   - `["Chicken", "Curry Leaves", "Yogurt"]` → matches "curry"

## Expected Behavior (NOW WORKING)

**User:** "Show me curries"

**AI Response:**
> "Got your curry fix! Butter Chicken at ₹299, Chicken Tikka Masala at ₹329, and Rogan Josh at ₹399. Which one calls your name?"

**Buttons:**
```
[Add Butter Chicken]  [Add Chicken Tikka Masala]  [Add Rogan Josh]

         [Add All 3 Items to Cart (₹927)]
         
            [View Cart & Checkout]
```

## Technical Details

### Database Schema (SQLite)
```prisma
model MenuItem {
  ingredients String? // JSON array string for SQLite compatibility
  // Example: '["Chicken", "Yogurt", "Spices", "Curry Leaves"]'
}
```

### Query Comparison

| Operator | PostgreSQL | SQLite | Status |
|----------|-----------|--------|--------|
| `contains` | ✅ Works | ✅ Works | **SAFE** |
| `hasSome` | ✅ Works | ❌ Fails | **AVOID** |
| `has` | ✅ Works | ❌ Fails | **AVOID** |

### Search Query Logic (Fixed)

```typescript
where.OR = [
  // Search in name
  { name: { contains: 'curry', mode: 'insensitive' } },
  
  // Search in description
  { description: { contains: 'curry', mode: 'insensitive' } },
  
  // Search in ingredients JSON string (FIXED!)
  { ingredients: { contains: 'curry' } }
]
```

## Files Modified

1. **`lib/ai-chat-functions.ts`** (line 202)
   - Changed `hasSome` to `contains`
   - Added comment explaining SQLite compatibility

## Testing

✅ Search for "curry" → Returns Butter Chicken, Tikka Masala, Rogan Josh  
✅ Search for "chicken" → Returns all chicken dishes  
✅ Search for "spicy" → Returns items with spicy in name/description  
✅ Search for "yogurt" → Returns items with yogurt in ingredients  
✅ No more "Technical munchies" error  

## Why This Happened

The original code was written for PostgreSQL (which supports array fields and `hasSome`), but the project is using SQLite for development. This is a common migration issue when switching databases.

## Prevention

**Best Practice:** Always check `prisma/schema.prisma` to confirm the database provider before using provider-specific operators:

```prisma
datasource db {
  provider = "sqlite"  // ← CHECK THIS FIRST!
  url      = env("DATABASE_URL")
}
```

---

**Status:** ✅ FIXED  
**Implementation Date:** November 8, 2025  
**Impact:** All search queries now work correctly in SQLite

