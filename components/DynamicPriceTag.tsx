/**
 * SMART KITCHEN INTELLIGENCE - Dynamic Price Tag Component
 * 
 * Purpose: Display real-time dynamic prices with discount badges
 * Features:
 * - Real-time price updates (every 15 minutes)
 * - Animated price changes (smooth transitions)
 * - Discount badge with countdown timer
 * - "Regular Price" strikethrough
 * - Reason tooltip ("Kitchen has capacity!")
 * - Price history graph (optional)
 * 
 * This component makes dynamic pricing transparent and appealing to customers.
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock, TrendingDown, TrendingUp, Info } from 'lucide-react';

interface DynamicPriceData {
  basePrice: number;
  currentPrice: number;
  discount: number; // Percentage
  reason: string;
  urgency: string;
  savingsAmount: number;
  priceValidUntil: string;
  confidence: number;
}

interface DynamicPriceTagProps {
  menuItemId: string;
  className?: string;
  showHistory?: boolean; // Show price history graph
  autoRefresh?: boolean; // Auto-refresh every 15 minutes
}

/**
 * DynamicPriceTag Component
 * 
 * Shows dynamic price with discount/surge indicator
 */
export function DynamicPriceTag({
  menuItemId,
  className = '',
  showHistory = false,
  autoRefresh = true,
}: DynamicPriceTagProps) {
  const [priceData, setPriceData] = useState<DynamicPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(900); // 15 minutes in seconds

  // Fetch dynamic price
  const fetchPrice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pricing/dynamic/${menuItemId}`);
      const data = await response.json();

      if (response.ok) {
        setPriceData(data);
        setTimeUntilRefresh(900); // Reset timer
      }
    } catch (error) {
      console.error('Failed to fetch dynamic price:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPrice();
  }, [menuItemId]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setTimeUntilRefresh(prev => {
        if (prev <= 0) {
          fetchPrice();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, menuItemId]);

  if (loading || !priceData) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const isDiscount = priceData.discount > 0;
  const isSurge = priceData.discount < 0;
  const priceChanged = priceData.currentPrice !== priceData.basePrice;

  return (
    <div className={`relative ${className}`}>
      {/* Price Display */}
      <div className="flex items-center gap-2">
        {/* Current Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            ₹{priceData.currentPrice}
          </span>

          {/* Original Price (if changed) */}
          {priceChanged && (
            <span className="text-lg text-gray-400 line-through">
              ₹{priceData.basePrice}
            </span>
          )}
        </div>

        {/* Discount/Surge Badge */}
        {isDiscount && priceData.discount >= 5 && (
          <div className="relative">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-pulse">
              <TrendingDown className="w-4 h-4" />
              {priceData.discount}% OFF
            </div>
          </div>
        )}

        {isSurge && Math.abs(priceData.discount) >= 5 && (
          <div className="relative">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              High Demand
            </div>
          </div>
        )}

        {/* Info Icon */}
        <button
          className="relative p-1 hover:bg-gray-100 rounded-full transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Savings Amount */}
      {isDiscount && priceData.savingsAmount > 0 && (
        <div className="mt-1 text-sm text-green-600 font-medium">
          You save ₹{priceData.savingsAmount}
        </div>
      )}

      {/* Urgency Message */}
      {priceData.urgency && (
        <div className="mt-2 flex items-center gap-2 text-sm text-orange-600 font-medium">
          <Clock className="w-4 h-4" />
          {priceData.urgency}
        </div>
      )}

      {/* Tooltip - Explanation */}
      {showTooltip && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4">
          <div className="font-bold mb-2">Why this price?</div>
          <p className="text-gray-300 mb-3">{priceData.reason}</p>
          
          <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
            Price updates every 15 minutes based on kitchen capacity,
            ingredient freshness, and predicted demand.
          </div>

          {/* Tooltip arrow */}
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900"></div>
        </div>
      )}

      {/* Countdown Timer (small, subtle) */}
      {autoRefresh && (
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Price updates in {Math.floor(timeUntilRefresh / 60)}:
          {(timeUntilRefresh % 60).toString().padStart(2, '0')}
        </div>
      )}

      {/* Price History (optional) */}
      {showHistory && (
        <div className="mt-4">
          <PriceHistoryMiniChart menuItemId={menuItemId} />
        </div>
      )}
    </div>
  );
}

/**
 * Mini Price History Chart Component
 * Shows last 6 hours of price changes
 */
function PriceHistoryMiniChart({ menuItemId }: { menuItemId: string }) {
  const [history, setHistory] = useState<{ time: string; price: number }[]>([]);

  useEffect(() => {
    // TODO: Fetch price history from API
    // For now, show placeholder
    const placeholder = [
      { time: '9:00', price: 299 },
      { time: '11:00', price: 289 },
      { time: '13:00', price: 239 },
      { time: '15:00', price: 259 },
      { time: '17:00', price: 349 },
      { time: '19:00', price: 329 },
    ];
    setHistory(placeholder);
  }, [menuItemId]);

  if (history.length === 0) return null;

  const maxPrice = Math.max(...history.map(h => h.price));
  const minPrice = Math.min(...history.map(h => h.price));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs font-medium text-gray-600 mb-2">
        Price History (Last 6 hours)
      </div>

      {/* Simple bar chart */}
      <div className="flex items-end justify-between gap-1 h-16">
        {history.map((point, index) => {
          const heightPercent = ((point.price - minPrice) / priceRange) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              {/* Bar */}
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${heightPercent}%` }}
                title={`₹${point.price} at ${point.time}`}
              ></div>

              {/* Time label */}
              <div className="text-xs text-gray-500 mt-1">{point.time}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>₹{minPrice}</span>
        <span>₹{maxPrice}</span>
      </div>
    </div>
  );
}

/**
 * Compact variant for menu grids
 */
export function DynamicPriceBadge({
  menuItemId,
  className = '',
}: {
  menuItemId: string;
  className?: string;
}) {
  const [priceData, setPriceData] = useState<DynamicPriceData | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`/api/pricing/dynamic/${menuItemId}`);
        const data = await response.json();
        if (response.ok) setPriceData(data);
      } catch (error) {
        console.error('Failed to fetch price:', error);
      }
    };

    fetchPrice();
  }, [menuItemId]);

  if (!priceData) {
    return <span className={className}>₹--</span>;
  }

  const isDiscount = priceData.discount > 5;

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="text-2xl font-bold text-gray-900">
        ₹{priceData.currentPrice}
      </span>

      {isDiscount && (
        <>
          <span className="text-sm text-gray-400 line-through">
            ₹{priceData.basePrice}
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
            {priceData.discount}% OFF
          </span>
        </>
      )}
    </div>
  );
}

export default DynamicPriceTag;

