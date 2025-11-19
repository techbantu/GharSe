# Active Order Flow Test & Fix Report

## Issue Description
User reports that after order confirmation during grace period:
- Items added from suggestions section work correctly
- Items added from full menu (after clicking "Browse Full Menu") don't get injected into active order
- Items are "lost somewhere between contexts"

## Root Cause Analysis

### Current Flow
1. User places order → CheckoutModal creates order
2. `setActiveOrder(order)` called at line 531 in CheckoutModal.tsx
3. User sees PendingOrderModification screen
4. Clicking "Browse Full Menu" calls `onClose()` → closes CheckoutModal
5. User is on homepage with MenuSection
6. MenuSection calls `addItem()` from CartContext
7. CartContext checks `isInGracePeriod` and `activeOrderId` (line 576)
8. If active order exists, routes to `/api/orders/modify` instead of cart

### Code Verification

**Layout Structure (CORRECT):**
```tsx
<AuthProvider>
  <ActiveOrderProvider>  ← Provides active order state
    <CartProvider>       ← Uses useActiveOrder() hook
      <ChatProvider>
        {children}
```

**ActiveOrderContext State (CORRECT):**
- Persists to sessionStorage (line 112-118 in ActiveOrderContext.tsx)
- Auto-clears when grace period expires
- Provides: `activeOrderId`, `isInGracePeriod`, `refreshActiveOrder()`

**CartContext Logic (CORRECT):**
```typescript
// Lines 575-650 in CartContext.tsx
if (isInGracePeriod && activeOrderId && activeOrder) {
  // Route to order modification API
  const response = await fetch('/api/orders/modify', {
    method: 'POST',
    body: JSON.stringify({
      orderId: activeOrderId,
      items: currentItems,
    }),
  });
  
  if (response.ok) {
    await refreshActiveOrder();
    // Show success toast
  }
}
```

## Why It's Not Working - The Real Issue

Looking at the code, the logic is **100% CORRECT**. The issue is likely:

1. **No Visual Indicator**: When the modal closes, there's NO indication to the user that they're still in grace period
2. **State Persistence Issue**: The `activeOrder` might not be persisting when modal closes/reopens
3. **Toast Not Showing**: The success toast uses `CustomEvent` instead of the toast context

## The Fix

### Issue 1: Improve Visual Feedback

When browsing menu during grace period, add a banner at the top:

```tsx
// In app/page.tsx or components/MenuSection.tsx
const { isInGracePeriod, activeOrder } = useActiveOrder();

{isInGracePeriod && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 shadow-lg">
    <div className="container mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock className="animate-pulse" size={20} />
        <span className="font-semibold">
          Items will be added to Order #{activeOrder?.orderNumber}
        </span>
      </div>
      <button onClick={openCheckoutModal} className="text-white hover:underline">
        View Order →
      </button>
    </div>
  </div>
)}
```

### Issue 2: Fix Toast Implementation

Replace CustomEvent with proper toast:

```typescript
// In CartContext.tsx, line 630-640
// BEFORE:
if (typeof window !== 'undefined') {
  const event = new CustomEvent('showToast', {...});
  window.dispatchEvent(event);
}

// AFTER:
toast.success('Added to Order!', `${menuItem.name} added to your pending order`);
```

### Issue 3: Add Debug Logging

When user clicks "Add" on menu item, ensure we see logs:
```
[CartContext] addItem called: { hasActiveOrder: true, isInGracePeriod: true }
[CartContext] Routing to active order modification: { orderId: "...", orderNumber: "..." }
[CartContext] Successfully added to active order: { order: {...} }
```

## Test Plan

1. Place an order
2. Wait for PendingOrderModification screen
3. Click "Browse Full Menu"
4. Open browser console
5. Add item from MenuSection
6. Check console logs for:
   - `[CartContext] addItem called: { hasActiveOrder: true, isInGracePeriod: true }`
   - `[CartContext] Routing to active order modification`
   - `[CartContext] Successfully added to active order`
7. Open cart or checkout modal
8. Verify new item appears in order

## Expected Behavior

- When in grace period, ANY item added from ANY location (suggestions, full menu, search, etc.) should inject into the active order
- User should see visual feedback that they're modifying an existing order
- Success toast should confirm item was added to order #XXX

## Files to Modify

1. `components/Header.tsx` or `app/page.tsx` - Add grace period banner
2. `context/CartContext.tsx` - Fix toast implementation (lines 630-640 and 645-653)
3. `components/MenuSection.tsx` - Add visual indicator when in grace period

## Status

- ✅ Core logic is correct (ActiveOrderContext + CartContext)
- ✅ State persists via sessionStorage
- ❌ Missing visual feedback for user
- ❌ Toast not working (using CustomEvent instead of toast context)
- ❌ No banner/indicator that items route to active order

