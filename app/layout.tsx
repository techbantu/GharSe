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
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import CacheBuster from "@/components/CacheBuster";
import LegalAcceptanceModal from "@/components/legal/LegalAcceptanceModal";
import { restaurantInfo } from "@/data/menuData";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Comprehensive SEO metadata targeting Hyderabad, India market
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.com'),
  title: {
    default: "GharSe - Home-Cooked Indian Food Delivery in Hayatnagar, Hyderabad | Order Online",
    template: "%s | GharSe - From Real Homes To Your Hungry Heart"
  },
  description: "GharSe connects you with trusted home chefs in Hayatnagar, Hyderabad. Fresh, authentic Indian home-cooked meals delivered from real home kitchens to your door. Free delivery over ₹499. Open 10 AM - 10 PM. Call +91 90104 60964",
  keywords: [
    // Primary keywords
    "home-cooked Indian food Hyderabad",
    "home chef Hayatnagar",
    "authentic home kitchen food delivery",
    "homemade Indian food Hyderabad",
    "home-cooked meals near me",
    // Location-specific
    "home food delivery Hayatnagar",
    "home kitchen Padhmalayanagar",
    "tiffin service Hyderabad 501505",
    "home chef in Hayatnagar Hyderabad",
    // Cuisine-specific
    "home-cooked biryani Hyderabad",
    "home-style curry delivery",
    "fresh roti delivery Hyderabad",
    "homemade dal makhani",
    "home kitchen paneer",
    "fresh tiffin Hyderabad",
    "regional Indian food",
    "comfort food delivery",
    // Service keywords
    "order home-cooked food online",
    "home chef near me",
    "home kitchen delivery Hyderabad",
    "fresh homemade meals delivery",
    "home food tiffin service",
    // Long-tail keywords
    "authentic home-cooked Indian food Hyderabad",
    "real home kitchen meals",
    "fresh home-cooked food delivery",
    "home chef Indian food Hyderabad",
    "family-style home cooking",
    "gharse home food",
  ],
  authors: [{ name: "GharSe", url: "https://gharse.com" }],
  creator: "GharSe - Operated by Sailaja",
  publisher: "GharSe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gharse.com",
    siteName: "GharSe",
    title: "GharSe - Best Indian Restaurant in Hayatnagar, Hyderabad",
    description: "Order authentic Indian home cooking delivered fresh to your door in Hyderabad. Biryani, curry, tandoori dishes and more. Free delivery over ₹499.",
    images: [
      {
        url: "/images/hero-food.jpg",
        width: 1200,
        height: 630,
        alt: "Authentic Indian food from GharSe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GharSe - Authentic Indian Food Delivery in Hyderabad",
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
    canonical: "https://gharse.com",
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

// Generate structured data (JSON-LD) for SEO
function generateStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gharse.com';
  
  // Restaurant/LocalBusiness schema
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurantInfo.name,
    "description": restaurantInfo.description,
    "url": baseUrl,
    "telephone": restaurantInfo.contact.phone,
    "email": restaurantInfo.contact.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": restaurantInfo.address.street,
      "addressLocality": restaurantInfo.address.city,
      "addressRegion": restaurantInfo.address.state,
      "postalCode": restaurantInfo.address.zipCode,
      "addressCountry": restaurantInfo.address.country,
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "17.3850",
      "longitude": "78.4867",
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "10:00",
        "closes": "22:00",
      },
    ],
    "servesCuisine": "Indian",
    "priceRange": "₹",
    "acceptsReservations": "False",
    "hasMenu": `${baseUrl}/#menu`,
    "image": `${baseUrl}/images/hero-food.jpg`,
    "logo": `${baseUrl}/logo.png`,
    "sameAs": [
      `https://www.instagram.com/${restaurantInfo.socialMedia?.instagram?.replace('@', '')}`,
      `https://www.facebook.com/${restaurantInfo.socialMedia?.facebook}`,
    ],
    "areaServed": {
      "@type": "City",
      "name": "Hyderabad",
    },
    "deliveryArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "17.3850",
        "longitude": "78.4867",
      },
      "geoRadius": {
        "@type": "Distance",
        "value": restaurantInfo.settings.deliveryRadius,
        "unitCode": "KMT",
      },
    },
  };

  // FoodEstablishment schema
  const foodEstablishmentSchema = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": restaurantInfo.name,
    "image": `${baseUrl}/images/hero-food.jpg`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": restaurantInfo.address.street,
      "addressLocality": restaurantInfo.address.city,
      "addressRegion": restaurantInfo.address.state,
      "postalCode": restaurantInfo.address.zipCode,
      "addressCountry": restaurantInfo.address.country,
    },
    "telephone": restaurantInfo.contact.phone,
    "priceRange": "₹",
    "servesCuisine": "Indian",
  };

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": restaurantInfo.name,
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": restaurantInfo.contact.phone,
      "contactType": "Customer Service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi", "te"],
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": restaurantInfo.address.street,
      "addressLocality": restaurantInfo.address.city,
      "addressRegion": restaurantInfo.address.state,
      "postalCode": restaurantInfo.address.zipCode,
      "addressCountry": restaurantInfo.address.country,
    },
  };

  return {
    restaurant: restaurantSchema,
    foodEstablishment: foodEstablishmentSchema,
    organization: organizationSchema,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = generateStructuredData();
  
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GharSe" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.restaurant),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.foodEstablishment),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.organization),
          }}
        />
        
        {/* Additional SEO meta tags */}
        <meta name="geo.region" content="IN-TG" />
        <meta name="geo.placename" content="Hyderabad" />
        <meta name="geo.position" content="17.3850;78.4867" />
        <meta name="ICBM" content="17.3850, 78.4867" />
        <meta name="language" content="English, Hindi, Telugu" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <CacheBuster />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
            <ChatProvider>
              <LegalAcceptanceModal />
              {children}
            </ChatProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
