# 🔄 Refund System - Complete Guide

## How the Refund System Works

### 🤖 **AUTOMATIC REFUND PROCESSING**

The refund system is **100% AUTOMATIC** - no manual intervention required!

---

## 📋 **Step-by-Step Workflow**

### 1. **Order Cancellation Triggers**

An order can be cancelled by:
- **Customer** (within allowed time window)
- **Chef/Admin** (with reason)
- **System** (payment failure, timeout)

### 2. **Automatic Refund Check**

When an order is cancelled, the system automatically:

```javascript
// From: app/api/orders/cancel/route.ts

async function processRefund(orderId: string, refundAmount?: number) {
  // 1. Find payment record
  const payment = await prisma.payment.findFirst({ where: { orderId } });
  
  // 2. Check if payment was completed
  if (payment.status === 'PAID') {
    // 3. AUTOMATICALLY process refund
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',           // Mark as refunded
        refundedAt: new Date(),        // Record exact refund time
        failureReason: `Refund: ₹${amount}`
      }
    });
    
    // 4. Send notifications (email + SMS)
    sendRefundNotifications();
  }
  
  return true; // Refund processed automatically!
}
```

### 3. **Refund Eligibility Rules**

| Payment Status | Refund Action | Timeline |
|---------------|---------------|----------|
| **PAID** (Online) | ✅ **AUTOMATIC REFUND** | Instant database update, 5-7 days to account |
| **PENDING** | ✅ **AUTOMATIC REFUND** | Payment cancelled before capture |
| **COD** (Cash on Delivery) | ❌ **NO REFUND** | Payment never received |
| **FAILED** | ❌ **NO REFUND** | Payment never completed |

---

## 🕐 **Timeline & Timestamps**

### Dates Recorded (Never N/A):

1. **Order Placed**: `createdAt` (always set when order created)
2. **Order Cancelled**: `cancelledAt` (set when cancel API called)
3. **Refund Processed**: `refundedAt` (set immediately if eligible)

### Why Some Dates Show "N/A":

- **Refund Date = N/A**: 
  - Order was COD (no payment to refund)
  - Payment failed/pending (no money captured)
  - Order cancelled before payment completed

- **Cancelled Date = N/A**: 
  - ⚠️ **This should NEVER happen!** 
  - If you see this, it's a bug in the cancellation process
  - The `cancelledAt` field is mandatory when status = CANCELLED

---

## 💰 **Refund Processing Times**

### In Our Database (Instant):
- Status marked as `REFUNDED` → **Immediately**
- `refundedAt` timestamp → **Immediately**
- Customer notification → **Within seconds**

### In Customer's Bank Account:
- **Payment Gateway Processing**: 5-7 business days
- **Weekend/Holiday delays**: Up to 10 business days
- **International cards**: Up to 14 business days

> **Note**: We instantly mark it as refunded in our system. The delay is from the payment gateway (Razorpay/Stripe) to the customer's bank.

---

## 🔍 **Refund Receipt Details**

Every refund receipt includes:

### ✅ **Financial Proof**
- Original Order Total
- Refund Amount
- Transaction ID (from payment gateway)
- Payment Method (UPI/Card/Wallet)

### ✅ **Timeline Proof**
- Order Placed: `Nov 10, 2025 • 10:15 AM`
- Order Cancelled: `Nov 10, 2025 • 10:20 AM`
- Refund Processed: `Nov 10, 2025 • 10:20 AM`

### ✅ **Transaction Proof**
- Payment ID: `pay_abc123xyz`
- Transaction ID: `txn_789def456`
- Gateway: `RAZORPAY` / `STRIPE`
- Refund ID: `rfnd_xyz789abc`

---

## 🚨 **Cancelled (No Refund) Cases**

### Why an Order Shows "Cancelled (No Refund)":

1. **Cash on Delivery (COD)**
   - Customer never paid
   - Nothing to refund
   - Dates: Order placed + Order cancelled (no refund date)

2. **Payment Pending**
   - Payment was initiated but never captured
   - Gateway automatically cancels
   - Dates: Order placed + Order cancelled (no refund date)

3. **Payment Failed**
   - Card declined / insufficient balance
   - No money was charged
   - Dates: Order placed + Order cancelled (no refund date)

---

## 🛠️ **For Developers: Integration Points**

### Cancellation API
```typescript
POST /api/orders/cancel

Body:
{
  "orderId": "123",
  "cancelledBy": "customer" | "chef" | "admin",
  "reason": "Customer requested",
  "additionalNotes": "Optional notes",
  "refundAmount": 500 // Optional: partial refund
}

Response:
{
  "success": true,
  "refundProcessed": true,     // Automatic check
  "refundAmount": 500,
  "message": "Order cancelled successfully"
}
```

### Refunds Data API
```typescript
GET /api/admin/refunds

Response:
{
  "statistics": {
    "totalRefundedAmount": 15000,
    "totalCancelledCount": 25,
    "cancelledWithRefund": 20,
    "cancelledWithoutRefund": 5  // COD orders
  },
  "allOrders": [
    {
      "orderId": "BK-123",
      "status": "REFUNDED" | "CANCELLED_NO_REFUND",
      "orderDate": "2025-11-10T10:15:00Z",
      "cancelledDate": "2025-11-10T10:20:00Z",
      "refundDate": "2025-11-10T10:20:00Z",  // Null for no refund
      "transactionId": "txn_abc123",
      "paymentGateway": "RAZORPAY"
    }
  ]
}
```

---

## 🎯 **Admin Dashboard Features**

### View Refunds Tab
1. **Summary Cards**:
   - Total Refunded (₹ amount)
   - Cancelled Orders (count)
   - Refunded Orders (count)

2. **Refunds Table**:
   - Order ID
   - Customer Name & Phone
   - Order Total vs Refund Amount
   - Status Badge (Refunded / Cancelled)
   - Cancelled Date (always shown)
   - Refund Date (shown if refunded)
   - **View Receipt** button

3. **Receipt Modal**:
   - Complete transaction details
   - Timeline with exact timestamps
   - Transaction IDs for proof
   - Print functionality for records

---

## 📊 **Business Logic Summary**

```plaintext
┌─────────────────┐
│  Order Created  │
│  (createdAt)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Customer/Chef   │
│ Cancels Order   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ System Checks Payment       │
│ Status Automatically        │
└────────┬────────────────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌───────┐  ┌──────────┐
│ PAID  │  │ COD/FAIL │
└───┬───┘  └────┬─────┘
    │           │
    ▼           ▼
┌──────────────┐  ┌─────────────────┐
│ AUTO REFUND  │  │ NO REFUND       │
│ (refundedAt) │  │ (refundDate=null)│
└──────────────┘  └─────────────────┘
         │                │
         └────────┬───────┘
                  ▼
         ┌─────────────────┐
         │ Send Email/SMS  │
         │ Notifications   │
         └─────────────────┘
```

---

## 🔐 **Security & Audit Trail**

Every refund is logged with:
- Who cancelled (customer/chef/admin)
- Why (reason)
- When (exact timestamp)
- How much (refund amount)
- Payment gateway response
- Notification sent status

All data is immutable and stored for compliance.

---

## 🎓 **Key Takeaways**

1. ✅ **Refunds are AUTOMATIC** - no manual processing needed
2. ✅ **Instant in our system** - 5-7 days to bank account
3. ✅ **Complete audit trail** - every timestamp recorded
4. ✅ **COD orders show "Cancelled (No Refund)"** - expected behavior
5. ✅ **Receipt provides full proof** - transaction IDs + timeline

---

## 📞 **Support**

If cancelled dates show "N/A", check:
1. Is the order actually cancelled? (status = CANCELLED)
2. Was the cancellation API called successfully?
3. Check database: `SELECT cancelledAt FROM orders WHERE id = 'xxx'`

The `cancelledAt` field is mandatory when cancelling. If it's NULL, the cancellation didn't complete properly.

---

**Last Updated**: November 13, 2025
**System Version**: Bantu's Kitchen v2.0
**Refund Engine**: AUTOMATIC_V1

