# 📱 GharSe Mobile App

React Native mobile application for GharSe - Home-Cooked Indian Food Delivery Platform.

## 🚀 Features

- ✅ **User Authentication** - Login & Registration
- ✅ **Browse Menu** - View all available dishes
- ✅ **Shopping Cart** - Add/remove items, manage quantities
- ✅ **Order Placement** - Seamless checkout process
- ✅ **Order Tracking** - Real-time order status updates
- ✅ **Live Delivery Tracking** - GPS tracking with Google Maps
- ✅ **Push Notifications** - Order updates and promotions
- ✅ **User Profile** - Manage account and preferences
- ✅ **Payment Integration** - Multiple payment options
- ✅ **Referral System** - Earn rewards by inviting friends

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn or pnpm
- **For iOS:**
  - macOS with Xcode 14+
  - CocoaPods installed
- **For Android:**
  - Android Studio with Android SDK
  - Java JDK 11+

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Environment

Create a `.env` file in the `mobile/` directory:

```env
API_URL=https://gharse.app
# or for local development:
# API_URL=http://localhost:3000

GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Run the App

**Development Mode (Expo):**

```bash
npm start
# Then press 'i' for iOS or 'a' for Android
```

**iOS (React Native CLI):**

```bash
npm run ios
```

**Android (React Native CLI):**

```bash
npm run android
```

## 📱 Platform-Specific Setup

### iOS

1. Open `mobile/ios/GharSe.xcworkspace` in Xcode
2. Select your development team in Signing & Capabilities
3. Update bundle identifier if needed
4. Run on simulator or device

### Android

1. Open `mobile/android` in Android Studio
2. Wait for Gradle sync to complete
3. Create or connect Android Virtual Device (AVD)
4. Run the app

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/            # All app screens
│   │   ├── auth/           # Login, Register
│   │   ├── home/           # Home screen
│   │   ├── menu/           # Menu browsing
│   │   ├── cart/           # Shopping cart
│   │   ├── orders/         # Order history & tracking
│   │   └── profile/        # User profile
│   ├── components/         # Reusable components
│   ├── context/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── services/          # API services
│   │   └── api.ts
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
├── assets/               # Images, fonts, etc.
├── App.tsx              # Root component
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

## 🔗 Backend Integration

The mobile app connects to the GharSe backend API. Ensure the backend is running before testing the app.

### API Endpoints Used:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/menu` - Fetch menu items
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - User orders
- `GET /api/orders/:id` - Order details
- `POST /api/orders/cancel` - Cancel order

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests (if configured)
npm run test:e2e
```

## 📦 Building for Production

### iOS (via Xcode)

1. Open project in Xcode
2. Product → Archive
3. Distribute App → App Store Connect

### Android (APK/AAB)

```bash
cd android
./gradlew assembleRelease
# APK will be in: android/app/build/outputs/apk/release/
```

### Using EAS Build (Expo)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🔐 Security

- All API calls use JWT authentication
- Sensitive data stored securely using AsyncStorage
- SSL/TLS for all network requests
- No hardcoded secrets in source code

## 🎨 Styling

- Built with React Native StyleSheet
- Consistent color scheme:
  - Primary: `#DC2626` (Red)
  - Secondary: `#10B981` (Green)
  - Gray scale: Tailwind CSS gray palette
- Responsive design for all screen sizes

## 🐛 Known Issues

- Google Maps may not work on simulator without API key
- Push notifications require additional setup for production
- Deep linking needs configuration for custom URL schemes

## 📝 TODO

- [ ] Add more screen implementations (complete stubs)
- [ ] Integrate payment gateways (Stripe/Razorpay)
- [ ] Add offline mode support
- [ ] Implement push notifications
- [ ] Add biometric authentication
- [ ] Performance optimization
- [ ] Accessibility improvements

## 🤝 Contributing

This mobile app is part of the GharSe project. See main repository for contribution guidelines.

## 📄 License

© 2024 GharSe. All rights reserved.

## 🆘 Support

For issues or questions:
- Email: techbantu@gmail.com
- GitHub Issues: [GharSe Repository](https://github.com/techbantu/GharSe/issues)

---

**Built with ❤️ for authentic home cooking**
