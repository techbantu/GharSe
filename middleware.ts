/**
 * TENANT MIDDLEWARE - White-Label Multi-Tenancy Isolation
 * 
 * Purpose: Detect and isolate tenant context for white-label SaaS
 * 
 * Features:
 * - Subdomain detection (delhi.gharse.app)
 * - Path-based tenant routing (/t/delhi-home-chefs)
 * - Custom domain support (delhihomechefs.com)
 * - Tenant context injection
 * - Data isolation enforcement
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Tenant configuration type
interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
}

/**
 * LRU Cache for tenant configs with max size bounds
 * Prevents memory leaks in edge runtime
 */
class TenantLRUCache {
  private cache = new Map<string, TenantConfig>();
  private maxSize = 1000; // Max 1000 tenants cached

  get(key: string): TenantConfig | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: TenantConfig): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Evict oldest if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Cache tenant configs in memory with LRU eviction (in production, use Redis)
const tenantCache = new TenantLRUCache();

// Reserved subdomains that should NOT be treated as tenants
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'dashboard',
  'docs',
  'help',
  'support',
  'status',
  'mail',
  'blog',
  'cdn',
  'static',
  'assets',
];

// Paths that should bypass tenant middleware
const BYPASS_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  '/icons/',
  '/images/',
];

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Skip middleware for static files and API routes that don't need tenant context
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Extract tenant identifier
  let tenantSlug: string | null = null;
  let tenantSource: 'subdomain' | 'path' | 'domain' | null = null;

  // 1. Check for custom domain (e.g., delhihomechefs.com)
  const customDomainTenant = await getTenantByCustomDomain(hostname);
  if (customDomainTenant) {
    tenantSlug = customDomainTenant.slug;
    tenantSource = 'domain';
  }

  // 2. Check for subdomain (e.g., delhi.gharse.app)
  if (!tenantSlug) {
    const subdomain = extractSubdomain(hostname);
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      tenantSlug = subdomain;
      tenantSource = 'subdomain';
    }
  }

  // 3. Check for path-based tenant (e.g., /t/delhi-home-chefs)
  if (!tenantSlug) {
    const pathTenant = extractPathTenant(pathname);
    if (pathTenant) {
      tenantSlug = pathTenant;
      tenantSource = 'path';
    }
  }

  // If no tenant detected, continue without tenant context (main platform)
  if (!tenantSlug) {
    return NextResponse.next();
  }

  // Validate tenant exists
  const tenant = await getTenantConfig(tenantSlug);
  if (!tenant) {
    // Tenant not found - redirect to main site or show 404
    console.warn(`[Tenant Middleware] Unknown tenant: ${tenantSlug}`);
    return NextResponse.next();
  }

  // Create response with tenant context headers
  const response = NextResponse.next();

  // Inject tenant context into headers (accessible by API routes and pages)
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-slug', tenant.slug);
  response.headers.set('x-tenant-name', tenant.name);
  response.headers.set('x-tenant-source', tenantSource || 'unknown');

  // Set tenant cookie for server-side access (httpOnly for security)
  // SECURITY FIX: Using httpOnly to prevent XSS from stealing tenant context
  response.cookies.set('tenant-id', tenant.id, {
    httpOnly: true, // SECURITY: Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // SECURITY: Stricter CSRF protection
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  response.cookies.set('tenant-slug', tenant.slug, {
    httpOnly: true, // SECURITY: Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // SECURITY: Stricter CSRF protection
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  console.log(`[Tenant Middleware] Tenant detected: ${tenant.name} (${tenant.slug}) via ${tenantSource}`);

  return response;
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Handle localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  // Split hostname into parts
  const parts = host.split('.');

  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }

  // First part is the subdomain
  return parts[0];
}

/**
 * Extract tenant from path (e.g., /t/delhi-home-chefs/menu)
 */
function extractPathTenant(pathname: string): string | null {
  const match = pathname.match(/^\/t\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Get tenant by custom domain
 */
async function getTenantByCustomDomain(hostname: string): Promise<TenantConfig | null> {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Skip known platform domains
  const platformDomains = [
    'localhost',
    '127.0.0.1',
    'gharse.app',
    'gharse.com',
    'bantuskitchen.com',
    'vercel.app',
  ];

  if (platformDomains.some(d => host.includes(d))) {
    return null;
  }

  // Check cache first
  const cacheKey = `domain:${host}`;
  const cachedDomainTenant = tenantCache.get(cacheKey);
  if (cachedDomainTenant) {
    return cachedDomainTenant;
  }

  // In production, query database for custom domain
  // For now, return null (implement database lookup)
  return null;
}

/**
 * Get tenant configuration by slug
 */
async function getTenantConfig(slug: string): Promise<TenantConfig | null> {
  // Check cache first
  const cachedSlugTenant = tenantCache.get(slug);
  if (cachedSlugTenant) {
    return cachedSlugTenant;
  }

  // In production, query database
  // For demo purposes, return mock data for known tenants
  const mockTenants: Record<string, TenantConfig> = {
    'delhi-home-chefs': {
      id: 'tenant_delhi_001',
      slug: 'delhi-home-chefs',
      name: 'Delhi Home Chefs',
      primaryColor: '#FF6B35',
      secondaryColor: '#FFA500',
    },
    'mumbai-kitchen': {
      id: 'tenant_mumbai_001',
      slug: 'mumbai-kitchen',
      name: 'Mumbai Kitchen',
      primaryColor: '#E91E63',
      secondaryColor: '#9C27B0',
    },
    'bangalore-eats': {
      id: 'tenant_blr_001',
      slug: 'bangalore-eats',
      name: 'Bangalore Eats',
      primaryColor: '#4CAF50',
      secondaryColor: '#8BC34A',
    },
  };

  const tenant = mockTenants[slug];
  if (tenant) {
    tenantCache.set(slug, tenant);
    return tenant;
  }

  return null;
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

