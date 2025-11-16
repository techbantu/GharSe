/**
 * UPDATED FILE: Next.js Configuration
 * 
 * Purpose: Configures Next.js with PWA support, analytics, SEO optimizations,
 * and performance enhancements for maximum search engine visibility.
 * 
 * SEO Features:
 * - Image optimization (WebP, AVIF)
 * - Security headers
 * - Performance optimizations
 * - Canonical URL support
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for better SEO and performance
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // SEO: Add image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  // Empty config to silence the warning about webpack config
  turbopack: {},
  
  // Compression for better performance (SEO factor)
  compress: true,
  
  // PoweredBy header removal for security
  poweredByHeader: false,
  
  // Security and SEO headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      // HTML pages: short cache with revalidation (prevents stale UI)
      {
        source: '/((?!api|_next/static|_next/image|images|uploads).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate, max-age=0',
          },
        ],
      },
      // Static assets: long cache
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO (if needed)
  async redirects() {
    return [
      // Add redirects here if needed
      // Example: { source: '/old-page', destination: '/new-page', permanent: true }
    ];
  },
};

export default nextConfig;

