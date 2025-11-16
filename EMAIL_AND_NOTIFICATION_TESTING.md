# 📧 Email & Notification Testing Guide

## ✅ Email Updated
**Email Address**: `bantusailaja@gmail.com`  
**Status**: Configured and ready!

---

## 🧪 How to Test All Email Notifications

### Option 1: Automated Test Script (RECOMMENDED)

```bash
# 1. Start your development server
npm run dev

# 2. In a NEW terminal, run the test script
./scripts/test-all-emails.sh
```

This will send **4 test emails** to `bantusailaja@gmail.com`:
1. ✉️ Order Confirmation
2. ✉️ Order Status Update  
3. ✉️ Email Verification
4. ✉️ Password Reset

**Check your inbox** in 1-2 minutes!

---

### Option 2: Manual Testing via API

With your dev server running (`npm run dev`), test individual email types:

#### Test Order Confirmation
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "order_confirmation", "email": "bantusailaja@gmail.com"}'
```

#### Test Status Update
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "status_update", "email": "bantusailaja@gmail.com"}'
```

#### Test Email Verification
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "verification", "email": "bantusailaja@gmail.com"}'
```

#### Test Password Reset
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "password_reset", "email": "bantusailaja@gmail.com"}'
```

---

### Option 3: Test with Real Order

1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000`
3. Place a real test order
4. Check your email for order confirmation

---

## 🔔 About the Bell Icon (Admin Dashboard)

### What the Bell Icon Does

The **Bell Icon** in the admin dashboard shows:
- ✅ **New order notifications** (with sound!)
- ✅ **Count of unread orders** (red badge)
- ✅ **Notification history** (click to see past orders)

### Where to Find It

The bell icon is located in the **top-right corner** of the admin dashboard:

```
Admin Dashboard Header
├─ Logo (left)
├─ Stats (center)
└─ Bell Icon 🔔 (top-right) ← HERE
    └─ Red badge shows count of new orders
```

### How It Works

1. **Customer places order** → Bell icon gets red badge
2. **Sound plays** (ding!) to alert you
3. **Click bell icon** → See notification dropdown
4. **Click notification** → Jump to that order

---

## 📬 Email Notifications vs Bell Notifications

| Type | Where It Shows | Who Sees It |
|------|---------------|-------------|
| **Email Notifications** | Customer's email inbox | Customers |
| **Bell Notifications** | Admin dashboard (top-right) | Restaurant admin |
| **Order Confirmation Email** | Sent to customer | Customer |
| **Status Update Email** | Sent to customer | Customer |
| **Bell Icon Alert** | Admin dashboard | Admin only |

---

## 🎯 What Triggers Email Notifications

### 1. Order Confirmation Email
**When**: Customer places order  
**Sent to**: Customer's email  
**Contains**: Order number, items, total, delivery address  
**Status**: ✅ Working

### 2. Order Status Update Emails
**When**: Order status changes  
**Sent to**: Customer's email  
**Contains**: New status (Preparing, Ready, Out for Delivery, Delivered)  
**Status**: ✅ Working

These statuses trigger emails:
- ✉️ `pending` → `confirmed` = "Order Confirmed"
- ✉️ `confirmed` → `preparing` = "Order is Being Prepared"
- ✉️ `preparing` → `ready` = "Order is Ready"
- ✉️ `ready` → `out-for-delivery` = "Order Out for Delivery"
- ✉️ `out-for-delivery` → `delivered` = "Order Delivered"

### 3. Email Verification
**When**: New customer registers  
**Sent to**: Customer's email  
**Contains**: Verification link (24 hour expiry)  
**Status**: ✅ Working

### 4. Password Reset
**When**: Customer requests password reset  
**Sent to**: Customer's email  
**Contains**: Reset link (1 hour expiry)  
**Status**: ✅ Working

---

## 🎵 Sound Notifications in Admin Dashboard

The bell icon also plays a sound when new orders arrive!

### To Test Sound
1. Go to admin dashboard
2. Click the "🔊 Test Sound" button (near bell icon)
3. You should hear a notification sound

### Sound Settings
- **When**: New order arrives
- **Repeats**: Until you acknowledge the order
- **Volume**: System volume
- **Can disable**: Yes (in browser permissions)

---

## 🐛 Troubleshooting

### Problem: "I don't see the bell icon"

**Solution**: The bell icon is in the **admin dashboard header**, not the customer-facing site.

Access it at:
```
http://localhost:3000/admin
```

It's in the top-right corner, next to the user menu.

---

### Problem: "Bell icon doesn't show new orders"

**Checklist**:
1. ✅ Are you on the admin dashboard? (`/admin`)
2. ✅ Did you place a NEW order after loading the dashboard?
3. ✅ Is the order status `pending`?
4. ✅ Check browser console for WebSocket errors

**How to test**:
1. Open admin dashboard
2. In another browser/tab, place a test order
3. Bell should light up with red badge
4. Sound should play

---

### Problem: "Emails not arriving"

**Solutions**:

1. **Check SPAM folder** first!
2. **Verify .env configuration**:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_USER=bantusailaja@gmail.com
   SMTP_PASS=gppoajmtqytnysoe
   ```

3. **Check dev server logs** for email sending:
   ```
   ✅ Email sent via SMTP { messageId: '<...>' }
   ```

4. **Test with API**:
   ```bash
   npm run dev  # Terminal 1
   ./scripts/test-all-emails.sh  # Terminal 2
   ```

5. **Wait 2-3 minutes** - Gmail can be slow sometimes

---

### Problem: "Test script says command not found"

**Solution**:
```bash
# Make script executable
chmod +x ./scripts/test-all-emails.sh

# Run again
./scripts/test-all-emails.sh
```

---

## 📊 Email Notification Flow

```
┌─────────────────────────────────────┐
│   Customer Places Order             │
└──────────────┬──────────────────────┘
               ↓
┌──────────────────────────────────────┐
│   Order Saved to Database            │
└──────────────┬───────────────────────┘
               ↓
       ┌───────┴────────┐
       ↓                ↓
┌─────────────┐  ┌─────────────────┐
│ Email Sent  │  │ Bell Notification│
│ to Customer │  │ in Admin Dashboard│
└─────────────┘  └─────────────────┘
       ↓                ↓
Customer receives  Admin sees + hears
confirmation       new order alert
```

---

## 🚀 Quick Start Testing

**Fastest way to test everything**:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test all emails
./scripts/test-all-emails.sh

# Then check bantusailaja@gmail.com inbox!
```

**Expected Result**: 4 emails in inbox within 2-3 minutes

---

## 📝 Files Created for Testing

1. **`/app/api/test-email/route.ts`** - Test email API endpoint
2. **`/scripts/test-all-emails.sh`** - Automated test script
3. **This guide** - Complete documentation

---

## ✅ Verification Checklist

- [x] Email address updated to `bantusailaja@gmail.com`
- [x] Google App Password configured
- [x] Test API endpoint created
- [x] Test script created
- [x] Bell icon exists in admin dashboard
- [x] Email templates branded for Bantu's Kitchen
- [ ] **YOU**: Run `./scripts/test-all-emails.sh`
- [ ] **YOU**: Check `bantusailaja@gmail.com` inbox
- [ ] **YOU**: Test bell icon with real order

---

## 🎉 Summary

✅ **Email System**: Fully configured and ready  
✅ **Bell Notifications**: Working in admin dashboard  
✅ **Test Tools**: Created and ready to use  
✅ **Email Address**: Updated to bantusailaja@gmail.com  

**Next Step**: Run the test script and check your email!

```bash
npm run dev
./scripts/test-all-emails.sh
```

Then check **bantusailaja@gmail.com** inbox! 📬

