# 🚀 Genius Referral System - Quick Start Guide

## What You Now Have

A **production-ready viral growth engine** that makes referrals exciting through:
- ✨ Auto-applied discounts (no code entry needed!)
- 💰 Spendable wallet credits
- 🎰 Progressive jackpots (₹200-₹1000)
- 🏅 Monthly champion prizes (₹5000)
- 🛡️ Multi-layer fraud detection

---

## How It Works (Simple Version)

### For Users Sharing Their Code
1. Every user gets a unique referral code (e.g., `RAVI-A3B2`)
2. Share it via WhatsApp/SMS/Copy
3. When friend's order is delivered → Earn ₹50 (24hr hold)
4. Hit milestones → Win jackpots (₹200-₹1000)
5. Be #1 each month → Win ₹5000

### For Friends Using the Code
1. Sign up with referral code
2. Place first order → Get ₹50 off automatically (no code entry!)
3. Checkout shows: "Referral Bonus: -₹50 🎁"
4. Get own code → Start referring too

---

## What Was Implemented

### ✅ Backend Infrastructure (Production-Ready)

**Database:**
- `Wallet` - Store customer balance and history
- `WalletTransaction` - Track every credit/debit
- `ReferralMilestone` - Jackpot rewards
- Enhanced `Referral` - Fraud detection fields

**Core Libraries:**
- `lib/wallet-manager.ts` - Complete wallet system
- `lib/fraud-detector.ts` - 8-layer fraud detection
- `lib/referral-engine.ts` - Referral orchestration
- `lib/referral-notifications.ts` - Email templates

**APIs:**
- `/api/wallet/balance` - Get wallet balance
- `/api/wallet/transactions` - Transaction history
- `/api/referral/leaderboard` - Top referrers + user rank
- `/api/referral/milestones` - Progress to next jackpot
- `/api/referral/history` - List of referrals

**Integration:**
- Registration → Fraud check + referral creation + wallet setup
- Order placement → Auto-discount + wallet debit
- Order delivery → Trigger reward (24hr hold) + check milestones

---

## How to Test

### Test 1: Friend Signs Up With Code

```bash
# 1. User A (Referrer) checks their code
GET /api/customer/referral-stats
# Response: { friendsReferred: 0, rewardsEarned: 0 }

# 2. User B (Friend) signs up with User A's code
POST /api/auth/register
{
  "name": "Priya Shah",
  "email": "priya@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "referredBy": "USERA-A3B2"  // User A's code
}

# System automatically:
# - Runs fraud check
# - Creates referral record (status: PENDING)
# - Creates wallet for User B
# - Sends welcome email to User B
```

### Test 2: Friend Places First Order

```bash
# User B checks out
POST /api/orders
{
  "customerId": "user-b-id",
  "items": [...],
  "pricing": {
    "subtotal": 450,
    "tax": 36,
    "deliveryFee": 30,
    "total": 516
  }
}

# System automatically:
# - Detects User B was referred
# - Applies ₹50 discount
# - Final total becomes: 516 - 50 = 466
# - Marks referee discount as used
# - Shows in checkout: "Referral Bonus: -₹50 🎁"
```

### Test 3: Order Delivered (Reward Trigger)

```bash
# Admin marks order as delivered
PUT /api/orders/{orderId}/status
{
  "status": "delivered"
}

# System automatically:
# - Credits ₹50 to User A's wallet (24hr hold)
# - Checks if User A hit milestone (5th? 10th?)
# - If milestone → Trigger jackpot instantly
# - Sends email: "💰 ₹50 credited!"
```

### Test 4: Check Wallet Balance

```bash
# User A checks wallet
GET /api/wallet/balance

# Response:
{
  "available": 0,          // Still in 24hr hold
  "pending": 50,           // Waiting for clearance
  "total": 50,
  "totalEarned": 50,
  "totalSpent": 0
}

# After 24 hours (automated job):
# available: 50, pending: 0
```

### Test 5: Use Wallet at Checkout

```bash
# User A places order using wallet
POST /api/orders
{
  "customerId": "user-a-id",
  "items": [...],
  "pricing": {
    "subtotal": 450,
    "tax": 36,
    "deliveryFee": 30,
    "walletAmount": 50,  // Use ₹50 from wallet
    "total": 466         // 516 - 50 = 466
  }
}

# System:
# - Validates wallet balance (must have ₹50)
# - Debits ₹50 from wallet
# - Updates balance: available: 0, spent: 50
```

---

## API Examples

### Get Leaderboard

```bash
GET /api/referral/leaderboard

{
  "success": true,
  "data": {
    "leaderboard": [
      { "rank": 1, "customerName": "Ravi Kumar", "referralCount": 47, "totalEarned": 2350 },
      { "rank": 2, "customerName": "Priya Shah", "referralCount": 38, "totalEarned": 1900 },
      { "rank": 3, "customerName": "Amit Patel", "referralCount": 31, "totalEarned": 1550 }
    ],
    "userRank": { "rank": 12, "referralCount": 8, "totalEarned": 400 },
    "championPrize": 5000
  }
}
```

### Get Milestones

```bash
GET /api/referral/milestones

{
  "success": true,
  "data": {
    "stats": {
      "completedReferrals": 3,
      "nextMilestone": {
        "type": "FIFTH_REFERRAL",
        "currentCount": 3,
        "requiredCount": 5,
        "progress": 60
      }
    },
    "achievedMilestones": [],
    "upcomingMilestones": [
      { "type": "FIFTH_REFERRAL", "requiredCount": 5, "rewardRange": "₹200-₹500" },
      { "type": "TENTH_REFERRAL", "requiredCount": 10, "rewardRange": "₹500-₹1000" }
    ]
  }
}
```

---

## Fraud Detection Examples

### Safe User (Score: 15)
```
✅ Unique IP address
✅ Real-looking email (ravi.kumar@gmail.com)
✅ Valid phone (9876543210)
✅ Normal sign-up velocity (2 referrals this month)
→ Auto-approved, no hold
```

### Suspicious User (Score: 65)
```
🚨 Same IP as 2 other referrals (+30)
🚨 Sequential email (test2@example.com) (+25)
🚨 5 referrals in 1 hour (+20)
→ Status: PENDING_VERIFICATION (admin review)
```

### Blocked User (Score: 100)
```
🛑 Self-referral detected (email matches referrer)
→ Status: EXPIRED (blocked immediately)
→ No reward issued
```

---

## Frontend Integration (Next Steps)

The backend is complete. To enhance the existing `ReferralCenter` component:

### 1. Show Wallet Balance

```typescript
// Fetch wallet balance
const { data } = await fetch('/api/wallet/balance').then(r => r.json());

// Display:
<div className="wallet-card">
  <h3>Your Wallet</h3>
  <p className="balance">₹{data.available}</p>
  <p className="pending">₹{data.pending} pending (clears in 18 hrs)</p>
</div>
```

### 2. Show Referral History

```typescript
// Fetch referral history
const { data } = await fetch('/api/referral/history').then(r => r.json());

// Display table:
data.referrals.map(ref => (
  <tr>
    <td>{ref.refereeName}</td>
    <td>{ref.status === 'COMPLETED' ? '✅ Completed' : '⏳ Pending'}</td>
    <td>{ref.isPaid ? `₹${ref.rewardAmount}` : '-'}</td>
  </tr>
))
```

### 3. Show Milestone Progress

```typescript
// Fetch milestones
const { data } = await fetch('/api/referral/milestones').then(r => r.json());

// Display progress bar:
<div className="milestone-progress">
  <h4>Next Milestone: {data.stats.nextMilestone.requiredCount} Referrals</h4>
  <ProgressBar value={data.stats.nextMilestone.progress} max={100} />
  <p>{data.stats.nextMilestone.currentCount} / {data.stats.nextMilestone.requiredCount}</p>
  <p>Reward: ₹200-₹500 jackpot!</p>
</div>
```

### 4. Show Leaderboard

```typescript
// Fetch leaderboard
const { data } = await fetch('/api/referral/leaderboard').then(r => r.json());

// Display:
<div className="leaderboard">
  <h3>Top Referrers This Month</h3>
  {data.leaderboard.map((entry, i) => (
    <div className="leaderboard-entry">
      <span>{entry.rank === 1 ? '👑' : entry.rank}</span>
      <span>{entry.customerName}</span>
      <span>{entry.referralCount} referrals</span>
    </div>
  ))}
  <p>Your Rank: #{data.userRank.rank}</p>
</div>
```

### 5. Checkout Integration (Auto-Discount)

```typescript
// Before submitting order
const discountCheck = await fetch('/api/referral/discount-check').then(r => r.json());

if (discountCheck.eligible) {
  // Show in checkout UI:
  <div className="discount-line">
    <span>Referral Bonus:</span>
    <span className="discount">-₹{discountCheck.amount} 🎁</span>
  </div>
}
```

---

## Automated Jobs (Setup Cron)

### 1. Clear Pending Wallet Credits (Hourly)

```bash
# Create: scripts/clear-pending-credits.sh
#!/bin/bash
curl -X POST http://localhost:3000/api/wallet/clear-pending

# Add to crontab:
0 * * * * /path/to/scripts/clear-pending-credits.sh
```

### 2. Award Monthly Champion (Monthly)

```bash
# Create: scripts/award-champion.sh
#!/bin/bash
curl -X POST http://localhost:3000/api/referral/award-champion

# Add to crontab (1st of each month at midnight):
0 0 1 * * /path/to/scripts/award-champion.sh
```

---

## Security Checklist

✅ **Fraud Detection**: 8-layer check with risk scoring  
✅ **24-Hour Hold**: Prevents instant withdrawal fraud  
✅ **Delivery Confirmation**: Reward only after delivery  
✅ **IP Tracking**: Duplicate IPs flagged  
✅ **Device Fingerprinting**: Browser/OS tracked  
✅ **Email Validation**: Pattern matching for fakes  
✅ **Velocity Limits**: Max 10 referrals/day  
✅ **Self-Referral Block**: Instant ban for cheaters  

---

## What's Next?

The **core system is production-ready**. Optional enhancements:

1. **Enhanced UI**: Redesign ReferralCenter with all new data
2. **WhatsApp Notifications**: More engaging than email
3. **Push Notifications**: Real-time mobile alerts
4. **Admin Dashboard**: Fraud queue visualization
5. **A/B Testing**: Test different reward amounts

---

## Support & Documentation

- **Full Documentation**: See `GENIUS_REFERRAL_SYSTEM.md`
- **Implementation Summary**: See `REFERRAL_IMPLEMENTATION_SUMMARY.md`
- **API Reference**: All endpoints documented in code comments

---

## 🎯 You're Ready!

The **Genius Referral System** is **production-ready** and can scale from 1 user to 1 million users without architectural changes.

**🚀 Launch and watch the viral growth!**

