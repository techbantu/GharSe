/**
 * UPDATED FILE: Root Layout - Application Shell with AI Chat
 * 
 * Purpose: Provides global HTML structure, metadata, and font loading.
 * Wraps all pages with essential providers and styling.
 * Includes ChatProvider for AI-powered customer support across the entire app.
 * 
 * SEO Optimization: Comprehensive metadata, structured data, and local SEO
 * targeting Hyderabad, India market for maximum search visibility.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { restaurantInfo } from "@/data/menuData";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Comprehensive SEO metadata targeting Hyderabad, India market
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bantuskitchen.com'),
  title: {
    default: "Bantu's Kitchen - Best Indian Restaurant in Hayatnagar, Hyderabad | Order Online",
    template: "%s | Bantu's Kitchen - Authentic Indian Food Delivery"
  },
  description: "Order authentic Indian home cooking from Bantu's Kitchen in Hayatnagar, Hyderabad. Fresh biryani, curry, tandoori dishes delivered to your door. Free delivery over ₹499. Open 10 AM - 10 PM. Call +91 90104 60964",
  keywords: [
    // Primary keywords
    "Indian restaurant Hyderabad",
    "best Indian food Hayatnagar",
    "Indian food delivery Hyderabad",
    "authentic Indian cuisine Hyderabad",
    "home cooked Indian food Hyderabad",
    // Location-specific
    "restaurant near me Hayatnagar",
    "Indian food Padhmalayanagar",
    "food delivery Hyderabad 501505",
    "restaurant in Hayatnagar Hyderabad",
    // Cuisine-specific
    "biryani delivery Hyderabad",
    "curry delivery Hyderabad",
    "tandoori chicken Hyderabad",
    "butter chicken Hyderabad",
    "dal makhani Hyderabad",
    "paneer tikka Hyderabad",
    "samosa Hyderabad",
    "naan bread Hyderabad",
    // Service keywords
    "online food ordering Hyderabad",
    "food delivery near me",
    "restaurant delivery Hyderabad",
    "order food online Hyderabad",
    "Indian takeout Hyderabad",
    // Long-tail keywords
    "authentic Indian home cooking Hyderabad",
    "traditional Indian recipes Hyderabad",
    "fresh Indian food delivery",
    "homemade Indian food Hyderabad",
    "family recipes Indian food",
  ],
  authors: [{ name: "Bantu's Kitchen", url: "https://bantuskitchen.com" }],
  creator: "Bantu's Kitchen",
  publisher: "Bantu's Kitchen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bantuskitchen.com",
    siteName: "Bantu's Kitchen",
    title: "Bantu's Kitchen - Best Indian Restaurant in Hayatnagar, Hyderabad",
    description: "Order authentic Indian home cooking delivered fresh to your door in Hyderabad. Biryani, curry, tandoori dishes and more. Free delivery over ₹499.",
    images: [
      {
        url: "/images/hero-food.jpg",
        width: 1200,
        height: 630,
        alt: "Authentic Indian food from Bantu's Kitchen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bantu's Kitchen - Authentic Indian Food Delivery in Hyderabad",
    description: "Order fresh Indian home cooking delivered to Hayatnagar, Hyderabad. Free delivery over ₹499.",
    images: ["/images/hero-food.jpg"],
    creator: "@bantuskitchen",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://bantuskitchen.com",
  },
  verification: {
    // Add Google Search Console verification when available
    // google: "your-google-verification-code",
  },
  category: "Restaurant",
  classification: "Food & Dining",
  other: {
    "geo.region": "IN-TG",
    "geo.placename": "Hyderabad",
    "geo.position": "17.3850;78.4867",
    "ICBM": "17.3850, 78.4867",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bantu's Kitchen" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ChatProvider>
        {children}
        </ChatProvider>
      </body>
    </html>
  );
}
