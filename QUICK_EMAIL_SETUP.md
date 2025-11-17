# 📧 Quick Email Setup Guide

## Current Status
✅ **Notification system is working correctly!**
❌ **Email needs configuration**
⚠️ **SMS is optional** (currently skipped)

---

## Option 1: Gmail (Easiest for Testing)

### Step 1: Get Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Click "Create" and name it "Bantus Kitchen"
4. Copy the 16-character password

### Step 2: Add to `.env`

```env
# Email Configuration (Gmail)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=techbantu@gmail.com
SMTP_PASSWORD=your-16-char-app-password-here
FROM_EMAIL=techbantu@gmail.com
FROM_NAME=Bantu's Kitchen
```

---

## Option 2: Resend (Best for Production)

### Step 1: Sign Up

1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day)
3. Get your API key (starts with `re_`)

### Step 2: Add to `.env`

```env
# Email Configuration (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Bantu's Kitchen
```

---

## Option 3: SendGrid (Alternative)

### Step 1: Sign Up

1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Get your API key

### Step 2: Add to `.env`

```env
# Email Configuration (SendGrid)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Bantu's Kitchen
```

---

## Test Again

After adding credentials:

```bash
# Restart your dev server
npm run dev

# Run the test script
npx tsx scripts/test-notifications.ts
```

You should see:
```
Email: ✅ Success
SMS: ⚠️ SMS Skipped (Not configured)  ← This is OK!
Overall: ✅ At least one succeeded
```

---

## What Customers Will See

### When Email Works:
```
┌─────────────────────────────────────┐
│ ✉️ ✅ Email Confirmation Sent!      │
│    techbantu@gmail.com              │
│                                     │
│ 📱 ⚠️ SMS Skipped (Not configured)  │
│    SMS service not configured       │
└─────────────────────────────────────┘
```

### Email Content:
- Subject: "Order Confirmed - BK-283583 | GharSe"
- Full receipt with itemized list
- Subtotal, tax, delivery fee
- Total amount
- Delivery address
- Estimated time
- Professional HTML design

---

## SMS Setup (Optional)

If you also want SMS:

1. Sign up at https://twilio.com
2. Get credentials
3. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Troubleshooting

### "Email failed" after adding credentials:
1. Check your `.env` file has the correct values
2. Restart your dev server
3. For Gmail: Make sure 2FA is enabled and you're using an app password (not your regular password)
4. For Resend: Verify your domain or use their test domain

### "SMS Skipped" message:
- This is normal! SMS is optional
- System works fine with just email
- Add Twilio credentials only if you want SMS

---

## Recommendation

**For Development**: Use Gmail (easiest setup)
**For Production**: Use Resend (better deliverability, analytics)

---

**Next:** Add your email credentials to `.env`, restart the dev server, and test!

