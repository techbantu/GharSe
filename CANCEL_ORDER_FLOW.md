# 🔄 Cancel Order Flow - Complete Journey

## The Complete Flow (After Fix)

### Scenario 1: Already Cancelled Order

```
USER ACTION: Clicks "Cancel Order" on order #BK-584263
     ↓
SYSTEM DETECTS: Order status = "CANCELLED"
     ↓
MODAL SHOWS:
┌─────────────────────────────────────────┐
│              ⚠️ [Red Alert Icon]        │
│                                         │
│        Cannot Cancel Order              │
│                                         │
│   Order is already cancelled.           │
│                                         │
│   Redirecting in 3 seconds...           │
│                                         │
│         [ Close Now ]                   │
└─────────────────────────────────────────┘
     ↓
COUNTDOWN: 3... 2... 1...
     ↓
AUTO-CLOSE (after 3 seconds)
     ↓
REDIRECT: router.push('/profile')
     ↓
DESTINATION: /profile page
     ↓
USER SEES:
┌─────────────────────────────────────────┐
│   My Orders                             │
│   ─────────────────                     │
│   [Current Orders]                      │
│   [Order History]                       │
│   [Referral Program]                    │
│                                         │
│   Order #BK-584263 ❌ CANCELLED        │
│   Status: Cancelled                     │
│   Date: Nov 18, 2025                   │
└─────────────────────────────────────────┘
```

### Scenario 2: User Clicks "Close Now" (Immediate)

```
USER ACTION: Clicks "Cancel Order" on already-cancelled order
     ↓
MODAL SHOWS: "Redirecting in 3 seconds..."
     ↓
USER CLICKS: "Close Now" button (before countdown ends)
     ↓
IMMEDIATE CLOSE (no waiting)
     ↓
REDIRECT: router.push('/profile')
     ↓
USER AT: /profile page
```

### Scenario 3: Normal Cancellation (Order CAN Be Cancelled)

```
USER ACTION: Clicks "Cancel Order" on active order
     ↓
SYSTEM CHECKS:
  ✅ Status = PENDING or CONFIRMED
  ✅ Within 10-minute window
  ✅ Not being prepared yet
     ↓
MODAL SHOWS:
┌─────────────────────────────────────────┐
│        Cancel Order                     │
│                                         │
│   Order Number: #BK-584263             │
│   Order Total: ₹402.85                 │
│                                         │
│   ℹ️ Refund of ₹402.85 will be         │
│      processed in 5-7 days             │
│                                         │
│   Why are you cancelling? *            │
│   ○ Changed my mind                    │
│   ● Order taking too long              │
│   ○ Ordered by mistake                 │
│   ○ Found a better option              │
│   ○ Emergency - can't receive          │
│   ○ Other                              │
│                                         │
│   [Keep Order]  [Cancel Order]         │
└─────────────────────────────────────────┘
     ↓
USER SELECTS: "Order taking too long"
     ↓
USER CLICKS: "Cancel Order" button
     ↓
API CALL: POST /api/orders/cancel
  {
    orderId: "...",
    cancelledBy: "customer",
    reason: "Order taking too long",
    refundAmount: 402.85
  }
     ↓
SUCCESS RESPONSE: { success: true, refundAmount: 402.85 }
     ↓
MODAL SHOWS:
┌─────────────────────────────────────────┐
│        ✅ Order Cancelled               │
│                                         │
│   Order #BK-584263 has been            │
│   cancelled successfully.              │
│                                         │
│   ℹ️ A refund of ₹402.85 will be       │
│      processed within 5-7 days.        │
└─────────────────────────────────────────┘
     ↓
WAIT: 2 seconds (show success message)
     ↓
onSuccess() CALLBACK:
  1. Clear timer
  2. Play alert sound 🔔
  3. Show toast: "Order Cancelled"
  4. Close modal
  5. router.push('/profile')
     ↓
USER AT: /profile page (sees cancelled order)
```

## Edge Cases Handled

### 1. User Tries to Cancel During Preparation

```
SYSTEM DETECTS: preparingAt = "2025-11-18T10:30:00Z"
     ↓
MODAL SHOWS:
┌─────────────────────────────────────────┐
│              ⚠️                         │
│   Cannot Cancel Order                   │
│                                         │
│   Order is already being prepared.      │
│   Please contact the restaurant.       │
│                                         │
│   Redirecting in 3 seconds...           │
│                                         │
│         [ Close Now ]                   │
└─────────────────────────────────────────┘
     ↓
AUTO-REDIRECT to /profile
```

### 2. User Tries to Cancel After Delivery

```
SYSTEM DETECTS: status = "OUT_FOR_DELIVERY"
     ↓
MODAL SHOWS:
┌─────────────────────────────────────────┐
│              ⚠️                         │
│   Cannot Cancel Order                   │
│                                         │
│   Order is already out for delivery     │
│   or delivered. Cannot cancel.          │
│                                         │
│   Redirecting in 3 seconds...           │
│                                         │
│         [ Close Now ]                   │
└─────────────────────────────────────────┘
     ↓
AUTO-REDIRECT to /profile
```

### 3. Cancellation Window Expired

```
SYSTEM DETECTS: 
  createdAt = "2025-11-18T09:00:00Z"
  now = "2025-11-18T09:15:00Z"
  timeSinceCreation = 15 minutes > 10 minutes
     ↓
MODAL SHOWS:
┌─────────────────────────────────────────┐
│              ⚠️                         │
│   Cannot Cancel Order                   │
│                                         │
│   Cancellation window expired.          │
│   Orders can only be cancelled          │
│   within 10 minutes of placement.       │
│                                         │
│   Redirecting in 3 seconds...           │
│                                         │
│         [ Close Now ]                   │
└─────────────────────────────────────────┘
     ↓
AUTO-REDIRECT to /profile
```

## Technical Details

### Files Involved

| File | Role |
|------|------|
| `components/CustomerCancelOrderModal.tsx` | Main cancel modal (customer-facing) |
| `components/CheckoutModal.tsx` | Parent component, handles redirect |
| `app/api/orders/cancel/route.ts` | Backend API for cancellation |
| `app/profile/page.tsx` | Destination after cancellation |

### State Management

```typescript
// CustomerCancelOrderModal.tsx
const [canCancel, setCanCancel] = useState(true);        // Can order be cancelled?
const [cancelMessage, setCancelMessage] = useState('');  // Error message
const [countdown, setCountdown] = useState(3);           // Timer countdown
const [loading, setLoading] = useState(false);           // API call in progress
const [success, setSuccess] = useState(false);           // Cancellation successful
```

### Auto-Close Logic

```typescript
useEffect(() => {
  if (!canCancel && isOpen && cancelMessage) {
    // Start countdown
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    
    // Close after 3 seconds
    const closeTimer = setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess(); // Triggers redirect
    }, 3000);
    
    // Cleanup
    return () => {
      clearInterval(countdownInterval);
      clearTimeout(closeTimer);
    };
  }
}, [canCancel, isOpen, cancelMessage, onClose, onSuccess]);
```

### Redirect Logic

```typescript
// CheckoutModal.tsx (lines 2644-2668)
<CancelOrderModal
  onSuccess={() => {
    // 1. Clean up
    clearInterval(timerIntervalRef.current);
    
    // 2. Audio feedback
    playAlertSound();
    
    // 3. Visual feedback
    toast.error('Order Cancelled', 'Refund will be processed...');
    
    // 4. Close modals
    setShowCancelModal(false);
    handleClose();
    
    // 5. 🎯 REDIRECT
    router.push('/profile');
  }}
/>
```

## Benefits of This Fix

### Before
❌ User confused when seeing "already cancelled" message  
❌ Had to manually discover "Close" button  
❌ No guidance on what happens next  
❌ Stayed on same page (no redirect)  
❌ Felt stuck, needed to figure out next step  

### After
✅ Clear message: "Order is already cancelled"  
✅ Visual countdown: "Redirecting in 3 seconds..."  
✅ Option to skip wait: "Close Now" button  
✅ Auto-redirect to /profile page  
✅ Smooth, professional UX  
✅ Zero confusion, zero manual intervention needed  

## Timing Philosophy

**Why 3 seconds?**

| Duration | User Experience |
|----------|----------------|
| 1 second | Too fast - user can't read message |
| 2 seconds | Fast but feels rushed |
| **3 seconds** | **Perfect - reads message, sees countdown, feels informed** ✅ |
| 5 seconds | Too slow - feels sluggish |
| 10 seconds | Frustrating wait |

**User can always click "Close Now" to skip the wait.**

## Testing Checklist

- [ ] Test already cancelled order → shows countdown → auto-redirects
- [ ] Test "Close Now" button → immediate redirect
- [ ] Test order being prepared → shows message → auto-redirects
- [ ] Test order out for delivery → shows message → auto-redirects
- [ ] Test cancellation window expired → shows message → auto-redirects
- [ ] Test normal cancellation → success message → redirects after 2s
- [ ] Verify redirect destination is `/profile` page
- [ ] Verify toast notification appears
- [ ] Verify alert sound plays (if enabled)
- [ ] Test on mobile and desktop

---

## Status: ✅ COMPLETE

**The cancel order flow is now smooth, intuitive, and user-friendly.**

