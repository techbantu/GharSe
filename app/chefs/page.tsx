/**
 * CHEF DISCOVERY PAGE - Customer-Facing
 * 
 * Purpose: Browse and discover home chefs in the area
 * 
 * Features:
 * - Chef listing with filters
 * - Cuisine type filter
 * - Rating filter
 * - Search by name/area
 * - View chef profiles and menus
 * - Direct order from chef
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showChefDiscovery } from '@/lib/feature-flags';

interface Chef {
  id: string;
  businessName: string;
  name: string;
  slug: string;
  bio: string | null;
  cuisineTypes: string[];
  logo: string | null;
  coverImage: string | null;
  isAcceptingOrders: boolean;
  minOrderAmount: number;
  serviceRadius: number;
  stats: {
    totalOrders: number;
    totalMenuItems: number;
  };
}

export default function ChefDiscovery() {
  const router = useRouter();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);

  useEffect(() => {
    if (!showChefDiscovery()) {
      router.push('/');
      return;
    }

    loadChefs();
  }, []);

  const loadChefs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chefs?status=ACTIVE&verified=true');
      
      if (res.ok) {
        const data = await res.json();
        setChefs(data.data || []);

        // Extract unique cuisines
        const cuisines = new Set<string>();
        data.data.forEach((chef: Chef) => {
          chef.cuisineTypes?.forEach((cuisine: string) => cuisines.add(cuisine));
        });
        setAvailableCuisines(Array.from(cuisines).sort());
      }
    } catch (error) {
      console.error('Failed to load chefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChefs = chefs.filter((chef) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !chef.businessName.toLowerCase().includes(query) &&
        !chef.name.toLowerCase().includes(query) &&
        !chef.bio?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Cuisine filter
    if (selectedCuisine !== 'all') {
      if (!chef.cuisineTypes?.includes(selectedCuisine)) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chefs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Local Home Chefs 👨‍🍳
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Fresh, homemade food from talented chefs in your neighborhood
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, cuisine, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Cuisine</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCuisine === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Cuisines
            </button>
            {availableCuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCuisine === cuisine
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredChefs.length} {filteredChefs.length === 1 ? 'chef' : 'chefs'} found
          </p>
        </div>

        {/* Chef Grid */}
        {filteredChefs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No chefs found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChefs.map((chef) => (
              <div
                key={chef.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => router.push(`/chefs/${chef.slug}`)}
              >
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-orange-400 to-red-400 relative">
                  {chef.coverImage ? (
                    <img
                      src={chef.coverImage}
                      alt={chef.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      🍳
                    </div>
                  )}

                  {/* Logo/Avatar */}
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl border-4 border-white">
                      {chef.logo ? (
                        <img
                          src={chef.logo}
                          alt={chef.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>👨‍🍳</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {chef.isAcceptingOrders && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      🟢 Open Now
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 pt-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{chef.businessName}</h3>
                  <p className="text-sm text-gray-500 mb-3">by {chef.name}</p>

                  {/* Cuisines */}
                  {chef.cuisineTypes && chef.cuisineTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {chef.cuisineTypes.slice(0, 3).map((cuisine) => (
                        <span
                          key={cuisine}
                          className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bio */}
                  {chef.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{chef.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span>📦 {chef.stats.totalOrders} orders</span>
                      <span>🍽️ {chef.stats.totalMenuItems} items</span>
                    </div>
                  </div>

                  {/* Min Order */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500">
                      Min. order: <span className="font-semibold text-gray-900">₹{chef.minOrderAmount}</span>
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chefs/${chef.slug}`);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

