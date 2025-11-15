#!/bin/bash

# 🚀 Cart Urgency System - Quick Setup Script
# Run this after implementing the cart awareness system

echo "🧬 CART URGENCY SYSTEM - Setup Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🗄️  Step 2: Updating database schema..."
echo "This will add CartReservation and ItemDemandHistory models"
npx prisma generate
npx prisma db push

echo ""
echo "🧪 Step 3: Running tests..."
npm test -- cart-urgency-system --passWithNoTests

echo ""
echo "✅ Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 WHAT'S NEW:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ AI can now SEE your cart!"
echo "✨ Real-time urgency messages: 'Only X left!'"
echo "✨ Social proof: '3 people have this in cart'"
echo "✨ Smart upsells: 'Customers also ordered...'"
echo "✨ Pre-checkout validation: 'Out of stock warning'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Add items to your cart"
echo ""
echo "3. Open the AI chat and ask:"
echo "   • 'How many items are in my cart?'"
echo "   • 'Is Butter Chicken available?'"
echo "   • 'What else goes well with my order?'"
echo ""
echo "4. Watch the magic happen! The AI will:"
echo "   ✓ See your cart contents"
echo "   ✓ Check real-time demand across all users"
echo "   ✓ Create urgency if items are popular"
echo "   ✓ Suggest complementary items"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 MONITORING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "• Check browser console for '[Cart Sync]' messages"
echo "• Check server logs for '[Cart Tracker]' activity"
echo "• API endpoint: GET /api/cart/track?itemIds=item1,item2"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 DOCUMENTATION:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Read CART_URGENCY_SYSTEM_COMPLETE.md for:"
echo "  • Full technical documentation"
echo "  • Architecture diagrams"
echo "  • Real-world examples"
echo "  • Performance metrics"
echo "  • Scaling guide"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 You're all set! Time to drive those conversions!"
echo ""

