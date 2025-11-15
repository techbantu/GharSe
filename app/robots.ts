/**
 * NEW FILE: Robots.txt Generator for SEO
 * 
 * Purpose: Tells search engines which pages to crawl and which to ignore.
 * Prevents indexing of admin pages and test pages.
 * 
 * SEO Impact: Guides search engine crawlers efficiently.
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantuskitchen.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/test-upload/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/test-upload/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

