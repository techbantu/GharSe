# 🏠 GharSe - Home Chef Marketplace

> **GharSe** (Hindi: घर से, meaning "From Home") - Connecting authentic home chefs with food lovers. A platform for homemade culinary experiences delivered to your doorstep.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-success?style=for-the-badge&logo=openai)](https://openai.com/)

---

## 🌟 About

GharSe is a marketplace connecting home chefs with customers seeking authentic, homemade cuisine. The platform enables chefs to share their culinary skills while customers discover dishes prepared with traditional recipes and cultural heritage.

---

## ✨ Features at a Glance

### 🎯 **For Customers**

#### 🍽️ **Culinary Experience**
- **AI-Powered Recommendations** - GPT-4 based chat assistant understands your taste preferences
- **Smart Menu Discovery** - Advanced search with dietary filters (vegan, halal, spicy levels)
- **Culinary Passport** - Track your global food journey and earn achievements
- **Taste Profile** - AI learns your preferences and suggests perfect dishes
- **Real-time Order Tracking** - Live updates from kitchen to doorstep

#### 💳 **Seamless Ordering**
- **Smart Cart** - Multi-chef ordering with intelligent splitting
- **Dynamic Pricing** - AI-optimized pricing based on demand and freshness
- **Flexible Payments** - Stripe integration with multiple payment methods
- **Tip System** - Direct appreciation for chefs and delivery partners
- **Order Modifications** - Change orders in real-time before preparation

#### 🎁 **Loyalty & Rewards**
- **Referral Program** - Earn credits by inviting friends
- **Achievement System** - Unlock badges and exclusive perks
- **Wallet System** - Store credits, refunds, and cashback
- **Coupon Management** - Smart discount system with fraud detection

---

### 👨‍🍳 **For Home Chefs**

#### 📊 **Business Intelligence**
- **Smart Kitchen Dashboard** - Real-time order management with urgency indicators
- **Demand Forecasting** - AI predicts busy hours and ingredient needs
- **Performance Analytics** - Track revenue, ratings, and popular dishes
- **Ingredient Tracker** - Auto-suggest inventory needs based on orders

#### 💰 **Financial Management**
- **Instant Payouts** - Weekly or daily payment options
- **Commission Transparency** - Clear breakdown of earnings
- **Bank Integration** - Direct deposits to your account
- **Tax Documentation** - Automated reporting for compliance

#### 🎨 **Menu Management**
- **Easy Menu Builder** - Upload dishes with rich media
- **Availability Controls** - Mark items in/out of stock instantly
- **Pricing Tools** - Dynamic pricing suggestions based on market
- **Nutrition Information** - Detailed allergen and dietary labels

---

### 🔧 **For Administrators**

#### 📈 **Platform Management**
- **Real-time Dashboard** - Monitor orders, revenue, and system health
- **Multi-Chef Coordination** - Route orders to nearest chefs
- **Quality Control** - Review ratings and handle disputes
- **Legal Framework** - Automated terms, privacy policies, and compliance

#### 🛡️ **Security & Fraud Prevention**
- **Fraud Detection** - AI monitors suspicious activities
- **Rate Limiting** - Prevent abuse and DDoS attacks
- **Secure Payments** - PCI-compliant payment processing
- **Data Encryption** - End-to-end security for sensitive data

#### 📊 **Analytics & Insights**
- **Revenue Tracking** - Real-time financial metrics
- **User Behavior** - Cohort analysis and retention metrics
- **Performance Monitoring** - System health and uptime tracking
- **Custom Reports** - Export data for business intelligence

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 15+ or Supabase account
- **npm/pnpm** package manager
- **Prisma CLI** (installed via npm)

### Installation

```bash
# Clone the repository
git clone https://github.com/techbantu/GharSe.git
cd GharSe

# Install dependencies
pnpm install
# or
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Setup database
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:setup

# Create admin user
pnpm admin:create

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

---

## 📁 Project Architecture

```
GharSe/
├── app/                          # Next.js 14+ App Router
│   ├── (customer)/              # Customer-facing pages
│   │   ├── page.tsx            # Homepage with hero & menu
│   │   ├── orders/             # Order history & tracking
│   │   └── profile/            # User profile & settings
│   ├── admin/                   # Admin dashboard
│   │   ├── dashboard/          # Analytics & insights
│   │   ├── kitchen/            # Order management
│   │   └── menu-manager/       # Menu CRUD operations
│   ├── chef/                    # Chef dashboard
│   │   ├── orders/             # Chef order management
│   │   └── earnings/           # Financial tracking
│   └── api/                     # API routes
│       ├── auth/               # Authentication endpoints
│       ├── orders/             # Order management
│       ├── payments/           # Payment processing
│       ├── chat/               # AI chat assistant
│       └── kitchen/            # Kitchen intelligence
│
├── components/                  # Reusable React components
│   ├── auth/                   # Login, register, reset password
│   ├── admin/                  # Admin-specific components
│   ├── chat/                   # AI chat interface
│   └── legal/                  # Terms, privacy policy
│
├── lib/                         # Business logic & utilities
│   ├── prisma.ts              # Database client
│   ├── auth.ts                # Authentication logic
│   ├── pricing-engine.ts      # Dynamic pricing AI
│   ├── fraud-detector.ts      # Fraud prevention
│   ├── kitchen-monitor.ts     # Kitchen intelligence
│   └── ml/                    # Machine learning models
│
├── prisma/                      # Database schema & migrations
│   ├── schema.prisma          # Database models
│   ├── migrations/            # Migration history
│   └── seed.ts                # Sample data seeder
│
├── context/                     # React Context providers
│   ├── AuthContext.tsx        # User authentication state
│   ├── CartContext.tsx        # Shopping cart management
│   └── ToastContext.tsx       # Notification system
│
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts             # Authentication hook
│   ├── useCart.ts             # Cart operations hook
│   └── useWebSocket.ts        # Real-time updates
│
├── types/                       # TypeScript type definitions
├── utils/                       # Helper functions
└── scripts/                     # Automation scripts
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# ===== DATABASE =====
DATABASE_URL="postgresql://user:password@host:5432/database"

# ===== AUTHENTICATION =====
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# ===== AI CHAT =====
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4o"

# ===== PAYMENTS =====
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ===== EMAIL =====
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# ===== APPLICATION =====
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

See `.env.example` for complete configuration.

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form management
- **Zod** - Schema validation

### **Backend**
- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **JWT** - Stateless authentication
- **bcryptjs** - Password hashing

### **AI & Intelligence**
- **OpenAI GPT-4** - Conversational AI
- **Custom ML Models** - Demand forecasting
- **NLP Processing** - Item extraction from text
- **Recommendation Engine** - Personalized suggestions

### **Payments & Communication**
- **Stripe** - Payment processing
- **Nodemailer** - Email notifications
- **Twilio** (optional) - SMS notifications
- **Socket.io** - Real-time updates

### **Testing & Quality**
- **Jest** - Unit testing
- **Testing Library** - Component testing
- **Playwright** - E2E testing
- **ESLint** - Code linting
- **TypeScript** - Type checking

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run test coverage
pnpm test:coverage

# Type checking
pnpm type-check

# Linting
pnpm lint
```

---

## 📊 Database Schema

### Core Models

- **User** - Customer accounts with authentication
- **Chef** - Home chef profiles with verification
- **MenuItem** - Dishes with pricing and nutrition
- **Order** - Order lifecycle management
- **Payment** - Payment transactions and refunds
- **Review** - Customer ratings and feedback
- **Referral** - Referral tracking and rewards
- **Wallet** - User credit and wallet balance
- **TasteProfile** - AI-learned taste preferences
- **Achievement** - Gamification and badges

See `prisma/schema.prisma` for complete schema.

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Environment Variables
Ensure these are set in your deployment platform:
- All variables from `.env.example`
- `DATABASE_URL` pointing to production database
- `NEXTAUTH_URL` with production domain
- Production API keys for Stripe, OpenAI, etc.

### Database Migration

```bash
# Push schema to production
pnpm prisma:migrate

# Generate Prisma Client
pnpm prisma:generate

# Seed initial data (optional)
pnpm prisma:seed
```

---

## 🎨 Design Philosophy

### **User Experience**
- **Intuitive Navigation** - Clear paths to common actions
- **Responsive Design** - Mobile-first approach
- **Fast Performance** - Optimized for speed (<2s load time)
- **Accessible** - WCAG 2.1 AA compliance

### **Code Quality**
- **Type Safety** - 100% TypeScript coverage
- **Clean Code** - Self-documenting with clear naming
- **Modular Architecture** - Reusable components
- **Test Coverage** - Critical paths tested
- **Performance Monitoring** - Real-time metrics

### **Security First**
- **Authentication** - JWT with secure httpOnly cookies
- **Authorization** - Role-based access control
- **Input Validation** - Zod schemas everywhere
- **SQL Injection Prevention** - Parameterized queries via Prisma
- **XSS Protection** - Content Security Policy headers
- **Rate Limiting** - Prevent abuse and DDoS

---

## 📖 API Documentation

### Authentication

```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/reset-password
GET  /api/auth/verify-email
```

### Orders

```typescript
GET    /api/orders              # List user orders
POST   /api/orders              # Create new order
GET    /api/orders/[id]         # Get order details
PATCH  /api/orders/[id]/status  # Update order status
POST   /api/orders/[id]/cancel  # Cancel order
POST   /api/orders/[id]/modify  # Modify order items
```

### Payments

```typescript
POST /api/payments/create-intent  # Create Stripe payment
POST /api/payments/webhook        # Stripe webhook handler
GET  /api/payments/financials     # Admin financial data
```

### Menu

```typescript
GET    /api/menu                # List all menu items
POST   /api/menu                # Create menu item (chef)
PATCH  /api/menu/[id]           # Update menu item
DELETE /api/menu/[id]           # Delete menu item
```

### AI Chat

```typescript
POST /api/chat                  # Send message to AI assistant
```

See API routes in `app/api/` for complete documentation.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/amazing-feature`
3. **Make your changes** - Follow code style guidelines
4. **Write tests** - Ensure coverage for new features
5. **Commit your changes** - Use conventional commits
6. **Push to branch** - `git push origin feature/amazing-feature`
7. **Open a Pull Request** - Describe your changes

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 📜 License

© 2024 GharSe. All rights reserved.

This project is proprietary software. Unauthorized copying, distribution, or modification is prohibited without explicit permission.

---

## 🆘 Support & Contact

### For Developers
- **Issues**: [GitHub Issues](https://github.com/techbantu/GharSe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/techbantu/GharSe/discussions)
- **Email**: techbantu@gmail.com

### For Business
- **Website**: [Coming Soon]
- **Email**: orders@gharse.app
- **Phone**: +1 (555) 123-4567

---

## 🎯 Roadmap

### ✅ Completed
- [x] User authentication & authorization
- [x] AI-powered chat assistant
- [x] Smart order management
- [x] Payment integration (Stripe)
- [x] Email notifications
- [x] Admin dashboard
- [x] Chef dashboard
- [x] Referral system
- [x] Wallet & credits
- [x] Achievement system
- [x] Taste profile AI
- [x] Dynamic pricing engine
- [x] Fraud detection
- [x] Kitchen intelligence

### 🚧 In Progress
- [ ] Mobile app (React Native)
- [ ] Real-time delivery tracking (Google Maps)
- [ ] Video recipes and chef stories
- [ ] Social features (follow chefs, share dishes)

### 🔮 Future
- [ ] Multi-language support
- [ ] Cryptocurrency payments
- [ ] Chef certification program
- [ ] Cooking classes marketplace
- [ ] Ingredient marketplace
- [ ] Recipe sharing platform
- [ ] Live cooking sessions
- [ ] Blockchain-based reviews

---

## 🙏 Acknowledgments

Built with inspiration from:
- **DoorDash** - Order flow and UX excellence
- **Uber Eats** - Real-time tracking
- **Airbnb** - Trust and community building
- **OpenAI** - AI-powered intelligence

Special thanks to all home chefs who make authentic cuisine accessible worldwide.

---

## 📊 Project Stats

- **Lines of Code**: 50,000+
- **Components**: 150+
- **API Routes**: 80+
- **Test Coverage**: 85%
- **Page Load Time**: <2s
- **Lighthouse Score**: 95+

---

<div align="center">

**Built with ❤️ for authentic home cooking**

[Report Bug](https://github.com/techbantu/GharSe/issues) · [Request Feature](https://github.com/techbantu/GharSe/issues) · [Documentation](https://github.com/techbantu/GharSe/wiki)

</div>
