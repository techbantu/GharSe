# 🔐 Security & Authentication Setup Guide

## Overview

This document explains the new secure authentication system implemented for Bantu's Kitchen admin panel.

## ✅ What's Been Implemented

### 1. **Database-Backed Authentication**
- Admin users stored in database with hashed passwords
- Email verification system
- Password reset functionality
- Role-based access control (OWNER, MANAGER, STAFF)

### 2. **JWT Token-Based Sessions**
- Secure token generation and validation
- Token expiration (default: 7 days)
- Automatic token verification on API requests

### 3. **API Endpoints Created**
- `POST /api/auth/login` - Authenticate and get token
- `POST /api/auth/register` - Create new admin (OWNER only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/reset-password` - Request/reset password

### 4. **Security Features**
- Password hashing with bcrypt (12 rounds)
- Email verification tokens (24-hour expiry)
- Password reset tokens (1-hour expiry)
- Role-based permissions
- Protected API routes

## 🚀 Setup Instructions

### Step 1: Update Environment Variables

Add these to your `.env` file:

```env
# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin Default Credentials (for initial setup)
ADMIN_DEFAULT_EMAIL=admin@bantuskitchen.com
ADMIN_DEFAULT_PASSWORD=Sailaja@2025
ADMIN_DEFAULT_NAME=Sailaja Admin

# Email Configuration (for verification emails)
# Add your email service credentials here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 2: Run Database Migration

```bash
# Generate Prisma client with new schema
npm run prisma:generate

# Create migration for new Admin fields
npm run prisma:migrate dev --name add_email_verification

# Or push schema changes directly (development only)
npm run db:push
```

### Step 3: Seed Initial Admin User

```bash
# This creates the first admin user (OWNER role)
npm run prisma:seed
```

**Default Credentials:**
- Email: `admin@bantuskitchen.com`
- Password: `Sailaja@2025` (or whatever you set in ADMIN_DEFAULT_PASSWORD)

### Step 4: Login

1. Navigate to `/admin/login`
2. Enter your admin email and password
3. You'll receive a JWT token stored in localStorage
4. Token is automatically sent with all API requests

## 👥 User Management

### Creating New Admin Users

Only OWNER role can create new admin accounts:

```bash
# Via API (requires OWNER token)
POST /api/auth/register
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "email": "manager@bantuskitchen.com",
  "name": "Manager Name",
  "password": "SecurePassword123!",
  "role": "MANAGER"
}
```

### Roles & Permissions

**OWNER:**
- Full access to everything
- Can create/manage other admin users
- Can manage all settings

**MANAGER:**
- Can manage menu and orders
- Can view analytics
- Cannot manage users or settings

**STAFF:**
- Can view and update orders only
- Cannot manage menu or users

## 🔒 Securing API Routes

To protect an API route, use the authentication middleware:

```typescript
import { requireAuth, requireRole, AdminRole } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  // Or require specific role
  const roleError = await requireRole(request, AdminRole.MANAGER);
  if (roleError) return roleError;

  // Your route logic here
}
```

## 📧 Email Verification

When a new admin is created:
1. Verification token is generated
2. Email is sent (TODO: implement email service)
3. Admin clicks verification link
4. Email is verified

**To verify email manually:**
```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "<verification-token>"
}
```

## 🔑 Password Reset

**Request Reset:**
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "admin@bantuskitchen.com"
}
```

**Reset Password:**
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "<reset-token>",
  "newPassword": "NewSecurePassword123!"
}
```

## 🛡️ Security Best Practices

1. **Change JWT_SECRET** - Use a strong, random secret in production
2. **Use HTTPS** - Always use HTTPS in production
3. **Set Strong Passwords** - Minimum 8 characters, mix of letters, numbers, symbols
4. **Verify Emails** - Require email verification for all new accounts
5. **Regular Updates** - Keep dependencies updated
6. **Monitor Logs** - Watch for suspicious login attempts

## 🐛 Troubleshooting

### "Invalid or expired token"
- Token may have expired (default: 7 days)
- Log out and log back in

### "Email not verified"
- Check email for verification link
- Or manually verify via API

### "Insufficient permissions"
- Your role doesn't have access to this resource
- Contact OWNER to upgrade your role

### Database errors
- Run `npm run prisma:generate` to regenerate Prisma client
- Run `npm run db:push` to sync schema

## 📝 Next Steps

1. **Implement Email Service** - Set up SMTP/Nodemailer for verification emails
2. **Add Rate Limiting** - Prevent brute force attacks
3. **Add 2FA** - Two-factor authentication for extra security
4. **Audit Logging** - Log all admin actions
5. **Session Management** - Add ability to revoke tokens

## 🔗 Related Files

- `lib/auth.ts` - Authentication utilities
- `lib/auth-middleware.ts` - Route protection middleware
- `app/api/auth/*` - Authentication API routes
- `app/admin/login/page.tsx` - Login page
- `prisma/schema.prisma` - Admin model schema

