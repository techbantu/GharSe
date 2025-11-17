/**
 * Recommended Items Component
 *
 * Displays personalized recommendations powered by advanced algorithms
 * - Thompson Sampling for exploration/exploitation
 * - Collaborative filtering for "users like you"
 * - Contextual bandits for time/weather awareness
 * - Trending velocity for rising stars
 * - Affinity mining for "complete the meal"
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, ShoppingBag, Clock, Star, ChevronRight } from 'lucide-react';
import { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';

interface RecommendedItemsProps {
  customerId?: string;
  sessionId?: string;
  category?: string;
  limit?: number;
  showTrending?: boolean;
  showCartSuggestions?: boolean;
}

interface RecommendationResult {
  itemId: string;
  score: number;
  rank: number;
  reasons: string[];
  confidence: number;
  item: MenuItem & {
    chef?: {
      businessName: string;
      rating: number;
    };
  };
  algorithmScores?: {
    thompsonSampling?: number;
    collaborative?: number;
    contextual?: number;
    trending?: number;
    affinity?: number;
    finalScore: number;
  };
}

interface TrendingResult {
  itemId: string;
  velocity: number;
  percentChange: number;
  momentum: 'rising' | 'stable' | 'falling';
  currentOrders: number;
  trendingScore: number;
  rank: number;
  item: MenuItem;
}

export const RecommendedItems: React.FC<RecommendedItemsProps> = ({
  customerId,
  sessionId,
  category,
  limit = 6,
  showTrending = false,
  showCartSuggestions = false,
}) => {
  const { cart, addItem } = useCart();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [trending, setTrending] = useState<TrendingResult[]>([]);
  const [cartSuggestions, setCartSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommended' | 'trending' | 'cart'>('recommended');

  // Generate session ID if not provided
  const sessionIdValue = sessionId || `session-${Date.now()}`;

  // Fetch recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [customerId, category, cart.items.length]);

  // Fetch trending items
  useEffect(() => {
    if (showTrending) {
      fetchTrending();
    }
  }, [category, showTrending]);

  // Fetch cart suggestions
  useEffect(() => {
    if (showCartSuggestions && cart.items.length > 0) {
      fetchCartSuggestions();
    }
  }, [cart.items.length, showCartSuggestions]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        sessionId: sessionIdValue,
        limit: limit.toString(),
      });

      if (customerId) {
        params.append('customerId', customerId);
      }

      if (category && category !== 'All') {
        params.append('category', category);
      }

      if (cart.items.length > 0) {
        const cartItemIds = cart.items.map(item => item.menuItem.id);
        params.append('cartItems', cartItemIds.join(','));
      }

      const response = await fetch(`/api/recommendations?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        window: '6', // Last 6 hours
        minPercentChange: '10',
      });

      if (category && category !== 'All') {
        params.append('category', category);
      }

      const response = await fetch(`/api/trending?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trending items');
      }

      const data = await response.json();

      if (data.success) {
        setTrending(data.trending);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchCartSuggestions = async () => {
    try {
      const cartItemIds = cart.items.map(item => item.menuItem.id);

      if (cartItemIds.length === 0) return;

      const params = new URLSearchParams({
        cartItems: cartItemIds.join(','),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/complete-meal?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch cart suggestions');
      }

      const data = await response.json();

      if (data.success) {
        setCartSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching cart suggestions:', error);
    }
  };

  const handleAddToCart = async (item: MenuItem) => {
    addItem(item);

    // Record feedback for learning
    try {
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          action: 'add_to_cart',
          sessionId: sessionIdValue,
          customerId,
        }),
      });
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  const renderRecommendationCard = (rec: RecommendationResult) => {
    const item = rec.item;

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
      >
        {/* Image */}
        <div className="relative h-36 overflow-hidden bg-gray-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingBag size={48} />
            </div>
          )}

          {/* Confidence badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={10} />
            {Math.round(rec.confidence * 100)}% match
          </div>

          {/* Trending indicator */}
          {rec.algorithmScores?.trending && rec.algorithmScores.trending > 0.7 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={10} />
              Trending
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
            {item.name}
          </h3>

          {/* Reasons */}
          {rec.reasons.length > 0 && (
            <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
              <Sparkles size={10} />
              {rec.reasons[0]}
            </p>
          )}

          {/* Rating & Time */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            {item.rating && (
              <div className="flex items-center gap-1">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                <span>{item.rating.toFixed(1)}</span>
              </div>
            )}
            {item.preparationTime && (
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <span>{item.preparationTime}m</span>
              </div>
            )}
          </div>

          {/* Price & Add Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">
              ₹{item.price}
            </div>
            <button
              onClick={() => handleAddToCart(item)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors duration-200"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendingCard = (trend: TrendingResult) => {
    const item = trend.item;

    return (
      <div
        key={item.id}
        className="bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
      >
        {/* Image with trending badge */}
        <div className="relative h-36 overflow-hidden bg-gray-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingBag size={48} />
            </div>
          )}

          {/* Trending badge with momentum */}
          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
            <TrendingUp size={12} />
            +{Math.round(trend.percentChange)}%
          </div>

          {/* Rank badge */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            #{trend.rank}
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
            {item.name}
          </h3>

          <p className="text-xs text-orange-600 mb-2">
            {trend.currentOrders} orders in last 6h
          </p>

          {/* Price & Add Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">
              ₹{item.price}
            </div>
            <button
              onClick={() => handleAddToCart(item)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors duration-200"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && recommendations.length === 0 && trending.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
      </div>
    );
  }

  const hasData =
    (activeTab === 'recommended' && recommendations.length > 0) ||
    (activeTab === 'trending' && trending.length > 0) ||
    (activeTab === 'cart' && cartSuggestions.length > 0);

  if (!hasData) {
    return null;
  }

  return (
    <div className="mb-12">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('recommended')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'recommended'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-orange-600'
          }`}
        >
          <Sparkles size={18} />
          Recommended for You
        </button>

        {showTrending && trending.length > 0 && (
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'trending'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-orange-600'
            }`}
          >
            <TrendingUp size={18} />
            Trending Now
          </button>
        )}

        {showCartSuggestions && cartSuggestions.length > 0 && (
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'cart'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-600 border-transparent hover:text-orange-600'
            }`}
          >
            <ShoppingBag size={18} />
            Complete Your Meal
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {activeTab === 'recommended' && recommendations.map(renderRecommendationCard)}
        {activeTab === 'trending' && trending.map(renderTrendingCard)}
        {activeTab === 'cart' &&
          cartSuggestions.map(suggestion => (
            <div key={suggestion.item.id} className="col-span-1">
              {renderRecommendationCard({
                ...suggestion,
                itemId: suggestion.item.id,
                rank: 0,
                reasons: [suggestion.reason],
                confidence: suggestion.confidence,
                algorithmScores: { finalScore: suggestion.score },
              })}
            </div>
          ))}
      </div>
    </div>
  );
};

export default RecommendedItems;
