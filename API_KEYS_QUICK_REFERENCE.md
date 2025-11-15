# 🔑 API Keys Quick Reference

## Quick Status Check
```bash
# Start server
npm run dev

# Check setup (visual)
open http://localhost:3000/admin/setup

# Check setup (API)
curl http://localhost:3000/api/setup/validate
```

---

## 📋 All Required Environment Variables

### 🔴 CRITICAL (App won't work)
```env
DATABASE_URL="file:./dev.db"  # or PostgreSQL URL
ADMIN_DEFAULT_EMAIL="admin@bantuskitchen.com"
ADMIN_DEFAULT_PASSWORD="SecurePassword123!"
```

### 🟡 HIGHLY RECOMMENDED (Core features)
```env
# Email (choose one)
EMAIL_PROVIDER="smtp"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
# OR
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="SG.xxxxxxxxxx"
# OR
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxx"

# Payments (at least one)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxx"
# OR
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxx"
STRIPE_PUBLIC_KEY="pk_test_xxxxxxxxxx"
# OR
COD_ENABLED="true"
```

### 🟢 OPTIONAL (Enhanced features)
```env
# SMS
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxx"
TWILIO_PHONE_NUMBER="+15551234567"

# Images
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="xxxxxxxxxx"

# AI Chat
OPENAI_API_KEY="sk-xxxxxxxxxx"

# Performance
REDIS_URL="redis://localhost:6379"
```

---

## 🔗 Where to Get Each API Key

| Service | Signup | Get Keys From | Free Tier |
|---------|--------|---------------|-----------|
| **Database** | [supabase.com](https://supabase.com) | Settings > Database > Connection String | ✅ 500MB |
| **Email (Gmail)** | [google.com](https://myaccount.google.com/apppasswords) | App Passwords (requires 2FA) | ✅ Unlimited |
| **Email (SendGrid)** | [sendgrid.com](https://sendgrid.com) | Settings > API Keys | ✅ 100/day |
| **Email (Resend)** | [resend.com](https://resend.com) | API Keys | ✅ 100/day |
| **Razorpay** | [razorpay.com](https://razorpay.com) | Dashboard > Settings > API Keys | ✅ Test mode |
| **Stripe** | [stripe.com](https://stripe.com) | Developers > API keys | ✅ Test mode |
| **Twilio** | [twilio.com](https://twilio.com) | Console > Account Info | ✅ ₹500 credit |
| **Cloudinary** | [cloudinary.com](https://cloudinary.com) | Dashboard > Settings > Access Keys | ✅ 25GB |
| **OpenAI** | [platform.openai.com](https://platform.openai.com) | API Keys | ❌ Pay per use |
| **Redis** | [upstash.com](https://upstash.com) | Database > Connection | ✅ 10K commands/day |

---

## 🎯 Minimum Setup (Get Started in 5 Minutes)

```env
# 1. Database
DATABASE_URL="file:./dev.db"

# 2. Admin
ADMIN_DEFAULT_EMAIL="admin@bantuskitchen.com"
ADMIN_DEFAULT_PASSWORD="YourPassword123!"

# 3. Payment (COD only)
COD_ENABLED="true"

# 4. Disable optional features
EMAIL_NOTIFICATIONS_ENABLED="false"
SMS_NOTIFICATIONS_ENABLED="false"
AI_CHAT_ENABLED="false"
```

This gives you a working app for testing immediately!

---

## 🏆 Recommended Production Setup

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:password@host:5432/db"

# Admin
ADMIN_DEFAULT_EMAIL="admin@bantuskitchen.com"
ADMIN_DEFAULT_PASSWORD="StrongPassword123!"

# Email (Gmail)
EMAIL_PROVIDER="smtp"
SMTP_USER="orders@bantuskitchen.com"
SMTP_PASSWORD="your-app-password"

# Payments (Razorpay for India)
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxx"

# Images (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="xxxxxxxxxx"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxx"
TWILIO_PHONE_NUMBER="+919876543210"

# Performance (Redis)
REDIS_URL="redis://default:password@host:port"

# AI Chat (OpenAI)
OPENAI_API_KEY="sk-xxxxxxxxxx"
```

---

## 📱 Service-Specific Error Messages

### Email Not Configured
```
❌ EMAIL NOT CONFIGURED: Missing SMTP credentials.
Required: SMTP_USER, SMTP_PASSWORD
Setup: https://myaccount.google.com/apppasswords
```

### SMS Not Configured
```
❌ SMS NOT CONFIGURED: Missing Twilio credentials.
Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
Setup: https://www.twilio.com
```

### Razorpay Not Configured
```
❌ RAZORPAY NOT CONFIGURED: Missing API keys.
Required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
Setup: https://razorpay.com > Dashboard > Settings > API Keys
Alternative: Enable COD_ENABLED=true
```

### Stripe Not Configured
```
❌ STRIPE NOT CONFIGURED: Missing API keys.
Required: STRIPE_SECRET_KEY, STRIPE_PUBLIC_KEY
Setup: https://stripe.com > Developers > API keys
```

### Cloudinary Not Configured
```
⚠️ Cloudinary not configured - falling back to local storage.
Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
Setup: https://cloudinary.com > Dashboard > Settings > Access Keys
```

### OpenAI Not Configured
```
❌ AI CHAT NOT CONFIGURED: Missing OpenAI API key.
Required: OPENAI_API_KEY
Setup: https://platform.openai.com > API Keys
```

### Redis Not Configured
```
⚠️ Redis not configured - App will be slower without caching.
Required: REDIS_URL
Setup: docker run -d -p 6379:6379 redis (local)
Or use: https://upstash.com (cloud)
```

---

## 🧪 Testing Each Service

### Database
```bash
curl http://localhost:3000/api/setup/validate?service=database
```

### Email
```bash
curl http://localhost:3000/api/setup/validate?service=email
```

### Redis
```bash
curl http://localhost:3000/api/setup/validate?service=redis
```

### Create Test Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":{"name":"Test","email":"test@example.com","phone":"+919876543210"},"paymentMethod":"cash-on-delivery","items":[...]}'
```

---

## 📊 Setup Score Meaning

- **100%** - All services configured (production perfection)
- **75-99%** - Production ready (missing optional features)
- **50-74%** - Functional (missing recommended features)
- **25-49%** - Limited functionality (configure more services)
- **0-24%** - Critical issues (app won't work properly)

---

## 🎯 Your Current Status

Visit to check: http://localhost:3000/admin/setup

Based on your `.env`:
- ✅ Database (configured)
- ✅ Admin (configured)
- ✅ Email (configured)
- ✅ Stripe (configured)
- ✅ Cloudinary (configured)
- ✅ OpenAI (configured)
- ⚠️ Razorpay (not configured)
- ⚠️ Twilio (not configured)
- ⚠️ Redis (not configured)

**Score: 67%** (Production ready for basic operations)

---

## 🆘 Troubleshooting

### "Can't find API key"
- Check `.env` file exists in project root
- Restart dev server after changing `.env`
- No spaces around `=` sign
- No quotes needed for values

### "Invalid credentials"
- Double-check you copied the full key
- Gmail: Use App Password, not regular password
- Razorpay: Use test keys for development
- Stripe: Match public/secret key pairs

### "Service not working"
- Visit: http://localhost:3000/admin/setup
- Check which service is red ❌
- Click to expand setup instructions
- Follow step-by-step guide

---

## 💡 Pro Tips

1. **Start Simple:** Use COD + local storage for testing
2. **Add Services Gradually:** Email → Payments → SMS → AI
3. **Test Each Service:** After adding keys, test it works
4. **Check Dashboard:** Visual confirmation at `/admin/setup`
5. **Read Error Messages:** They tell you exactly what's missing!

---

## 🚀 Quick Setup Commands

```bash
# 1. Clone .env.example
cp .env.example .env

# 2. Edit .env with your keys
nano .env  # or use your editor

# 3. Initialize database
npm run prisma:generate
npm run prisma:migrate

# 4. Start server
npm run dev

# 5. Check setup
open http://localhost:3000/admin/setup
```

---

## 📞 Need Help?

1. **Setup Dashboard:** http://localhost:3000/admin/setup
2. **Full Guide:** Read `SETUP_GUIDE.md`
3. **Test Results:** Read `TEST_RESULTS.md`
4. **Error Messages:** All APIs show clear instructions

Every error message now tells you:
- ❌ What's missing
- 📋 Which environment variables are needed
- 🔗 Where to sign up
- 📝 How to get the keys
- 💡 Alternatives (if any)

**No more guessing!** 🎉


