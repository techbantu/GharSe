/**
 * NEW FILE: Advanced Search Component
 * 
 * Purpose: Intelligent search with filters, recommendations, and AI suggestions
 * 
 * Features:
 * - Real-time search with debouncing
 * - Advanced filters (dietary, price, spice level)
 * - Search recommendations
 * - Popular items display
 * - Recent searches
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { MenuItem } from '@/types';
import { menuItems } from '@/data/menuData';
import { useRouter } from 'next/navigation';

interface AdvancedSearchProps {
  onItemSelect?: (item: MenuItem) => void;
  showFilters?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  onItemSelect,
  showFilters = true 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MenuItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: 'All',
    vegetarian: false,
    vegan: false,
    maxSpiceLevel: 3,
    minPrice: 0,
    maxPrice: 100,
  });
  
  // Recent searches (from localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('bantus-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);
  
  // Save recent searches
  const saveRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('bantus-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);
  
  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    try {
      // Build query params
      const params = new URLSearchParams({
        q: searchQuery,
        ...(filters.category !== 'All' && { category: filters.category }),
        ...(filters.vegetarian && { vegetarian: 'true' }),
        ...(filters.vegan && { vegan: 'true' }),
        maxSpiceLevel: filters.maxSpiceLevel.toString(),
        minPrice: filters.minPrice.toString(),
        maxPrice: filters.maxPrice.toString(),
      });
      
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search
      const filtered = menuItems.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filters.category === 'All' || item.category === filters.category;
        const matchesVegetarian = !filters.vegetarian || item.isVegetarian;
        const matchesVegan = !filters.vegan || item.isVegan;
        const matchesSpice = (item.spicyLevel || 0) <= filters.maxSpiceLevel;
        const matchesPrice = item.price >= filters.minPrice && item.price <= filters.maxPrice;
        
        return matchesQuery && matchesCategory && matchesVegetarian && matchesVegan && 
          matchesSpice && matchesPrice && item.isAvailable;
      });
      
      setResults(filtered);
    }
  }, [filters]);
  
  // Debounced search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    setDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [query, filters, performSearch]);
  
  // Popular items
  const popularItems = menuItems
    .filter(item => item.isPopular && item.isAvailable)
    .slice(0, 6);
  
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    saveRecentSearch(searchQuery);
    setIsOpen(true);
  };
  
  const handleItemClick = (item: MenuItem) => {
    onItemSelect?.(item);
    setIsOpen(false);
    setQuery('');
  };
  
  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for dishes, ingredients, or cuisine..."
          className="w-full pl-12 pr-24 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        )}
        {showFilters && (
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              showFiltersPanel
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} className="inline mr-2" />
            Filters
          </button>
        )}
      </div>
      
      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-50">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="All">All Categories</option>
                {Array.from(new Set(menuItems.map(item => item.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Spice Level
              </label>
              <input
                type="range"
                min="0"
                max="3"
                value={filters.maxSpiceLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, maxSpiceLevel: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mild</span>
                <span>Medium</span>
                <span>Hot</span>
                <span>Very Hot</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 100 }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.vegetarian}
                  onChange={(e) => setFilters(prev => ({ ...prev, vegetarian: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-medium">Vegetarian Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.vegan}
                  onChange={(e) => setFilters(prev => ({ ...prev, vegan: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-medium">Vegan Only</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={() => {
              setFilters({
                category: 'All',
                vegetarian: false,
                vegan: false,
                maxSpiceLevel: 3,
                minPrice: 0,
                maxPrice: 100,
              });
            }}
            className="mt-4 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}
      
      {/* Search Results Dropdown */}
      {isOpen && (query || results.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {query && results.length > 0 ? (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary-500" />
                <h3 className="font-semibold text-gray-900">
                  Search Results ({results.length})
                </h3>
              </div>
              <div className="space-y-2">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23FF6B35'/%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                      <p className="text-sm font-bold text-primary-500 mt-1">
                        ₹{item.price}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : query && results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">Try different keywords or check filters</p>
            </div>
          ) : !query && (
            <div className="p-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={18} className="text-gray-400" />
                    <h3 className="font-semibold text-gray-700">Recent Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Popular Items */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={18} className="text-primary-500" />
                  <h3 className="font-semibold text-gray-900">Popular Dishes</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {popularItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='200' height='150' fill='%23FF6B35'/%3E%3C/svg%3E`;
                        }}
                      />
                      <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-primary-500">
                        ₹{item.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;

