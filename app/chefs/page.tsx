/**
 * CHEF DISCOVERY PAGE - Multi-Chef Marketplace
 * 
 * Purpose: Browse all active home chefs and their specialties
 * Features: Search, filter, precise sizing with px/rem
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, ChefHat, ArrowRight, Award } from 'lucide-react';
import { isMultiChefMode } from '@/lib/feature-flags';

interface Chef {
  id: string;
  businessName: string;
  name: string;
  slug: string;
  bio?: string;
  cuisineTypes?: string;
  logo?: string;
  coverImage?: string;
  status: string;
  isVerified: boolean;
  serviceRadius: number;
  minOrderAmount: number;
  createdAt?: string; // Added for sorting by newest
  _count?: {
    orders: number;
    menuItems: number;
  };
}

export default function ChefDiscoveryPage() {
  const router = useRouter();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  useEffect(() => {
    if (!isMultiChefMode()) {
      router.push('/');
      return;
    }
    fetchChefs();
  }, []);

  async function fetchChefs() {
    try {
      const response = await fetch('/api/chefs');
      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        setChefs(result.data || result.chefs || []);
      } else {
        console.error('API error:', response.status);
        setChefs([]);
      }
    } catch (error) {
      console.error('Failed to fetch chefs:', error);
      setChefs([]);
    } finally {
      setLoading(false);
    }
  }

  function getCuisines(chef: Chef): string[] {
    try {
      if (typeof chef.cuisineTypes === 'string') {
        return JSON.parse(chef.cuisineTypes);
      }
      return Array.isArray(chef.cuisineTypes) ? chef.cuisineTypes : [];
    } catch {
      return [];
    }
  }

  const allCuisines = Array.from(
    new Set(chefs.flatMap(chef => getCuisines(chef)))
  ).sort();

  const filteredChefs = chefs
    .filter(chef => {
      const matchesSearch = 
        chef.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chef.bio?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCuisine = selectedCuisine === 'all' || 
        getCuisines(chef).some(c => c.toLowerCase() === selectedCuisine.toLowerCase());

      return matchesSearch && matchesCuisine;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b._count?.orders || 0) - (a._count?.orders || 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'min-order':
          return a.minOrderAmount - b.minOrderAmount;
        default:
          return 0;
      }
    });

  if (!isMultiChefMode()) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5f0 0%, #fff 30%, #fff9f5 100%)' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        padding: '48px 16px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
              <ChefHat style={{ width: '48px', height: '48px' }} />
              <h1 style={{ fontSize: '3rem', fontWeight: '700', margin: 0 }}>Discover Home Chefs</h1>
            </div>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.9)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              Authentic home-cooked meals from passionate chefs in your neighborhood
            </p>
            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award style={{ width: '20px', height: '20px' }} />
                <span>{chefs.length} Verified Chefs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star style={{ width: '20px', height: '20px', fill: '#fbbf24' }} />
                <span>Top Rated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', transform: 'translateY(-32px)', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '20px', height: '20px' }} />
              <input
                type="text"
                placeholder="Search chefs, cuisines, or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Cuisine Filter */}
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Cuisines</option>
                {allCuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="min-order">Min Order Amount</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 64px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              display: 'inline-block',
              width: '48px',
              height: '48px',
              border: '4px solid #fee2e2',
              borderTopColor: '#f97316',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '1.125rem' }}>Loading chefs...</p>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : filteredChefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <ChefHat style={{ width: '80px', height: '80px', color: '#d1d5db', margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: '1.875rem', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>No chefs found</h3>
            <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '24px' }}>
              {searchQuery || selectedCuisine !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to join our marketplace!'}
            </p>
            <button
              onClick={() => router.push('/chef/register')}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1.0625rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Become a Chef Partner
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '1rem' }}>
              Found <span style={{ fontWeight: '600', color: '#f97316' }}>{filteredChefs.length}</span> chef{filteredChefs.length !== 1 ? 's' : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '32px'
            }}>
              {filteredChefs.map((chef) => (
                <ChefCard key={chef.id} chef={chef} router={router} getCuisines={getCuisines} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChefCard({ chef, router, getCuisines }: { chef: Chef; router: any; getCuisines: (chef: Chef) => string[] }) {
  const cuisines = getCuisines(chef);

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'all 0.3s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    }}>
      {/* Cover Image */}
      <div style={{ position: 'relative', height: '192px', background: 'linear-gradient(135deg, #fecaca 0%, #fde68a 100%)' }}>
        {chef.coverImage ? (
          <img
            src={chef.coverImage}
            alt={chef.businessName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChefHat style={{ width: '80px', height: '80px', color: '#fb923c' }} />
          </div>
        )}
        
        {chef.isVerified && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#3b82f6',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <Award style={{ width: '14px', height: '14px' }} />
            Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{chef.businessName}</h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>by {chef.name}</p>

        {/* Cuisines */}
        {cuisines.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {cuisines.slice(0, 3).map((cuisine, idx) => (
              <span
                key={idx}
                style={{
                  padding: '4px 12px',
                  background: '#fff7ed',
                  color: '#ea580c',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  fontWeight: '500'
                }}
              >
                {cuisine}
              </span>
            ))}
            {cuisines.length > 3 && (
              <span style={{
                padding: '4px 12px',
                background: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '16px',
                fontSize: '0.8125rem',
                fontWeight: '500'
              }}>
                +{cuisines.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {chef.bio && (
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {chef.bio}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <MapPin style={{ width: '16px', height: '16px' }} />
            <span>{chef.serviceRadius} km</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <span style={{ fontSize: '1rem' }}>₹</span>
            <span>Min ₹{chef.minOrderAmount}</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push(`/?chef=${chef.slug}`)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: 'white',
            fontWeight: '600',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            transition: 'all 0.2s',
            fontSize: '0.9375rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
          }}
        >
          View Menu & Order
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </div>
  );
}
