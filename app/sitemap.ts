/**
 * NEW FILE: Sitemap Generator for SEO
 * 
 * Purpose: Generates XML sitemap for search engines to crawl all pages.
 * Helps Google, Bing, and other search engines discover and index content.
 * 
 * SEO Impact: Critical for search engine visibility and ranking.
 */

import { MetadataRoute } from 'next';
import { restaurantInfo } from '@/data/menuData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantuskitchen.com';
  const currentDate = new Date().toISOString();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/#menu`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#about`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Admin pages (lower priority, can be excluded if needed)
    {
      url: `${baseUrl}/admin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/admin/dashboard`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}

