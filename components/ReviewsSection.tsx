/**
 * NEW FILE: Reviews and Ratings Component
 * 
 * Purpose: Displays customer reviews and allows rating submissions
 * 
 * Features:
 * - Star ratings (1-5 stars)
 * - Review comments with images
 * - Item-specific ratings
 * - Review filtering and sorting
 * - Review submission form
 */

'use client';

import React, { useState } from 'react';
import { Star, StarHalf, MessageSquare, Image as ImageIcon, User } from 'lucide-react';
import { Review } from '@/types';
import { format } from 'date-fns';

interface ReviewsSectionProps {
  menuItemId?: string;
  orderId?: string;
  showSubmitForm?: boolean;
}

// Mock reviews data (replace with API call in production)
const mockReviews: Review[] = [
  {
    id: 'rev-001',
    customer: {
      name: 'Priya Sharma',
      isVerified: true,
    },
    order: {
      id: 'order-001',
      orderNumber: 'BK-001234',
    },
    rating: 5,
    comment: 'Absolutely delicious! The butter chicken was perfectly spiced and the naan was fresh and warm. Will definitely order again!',
    images: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'rev-002',
    customer: {
      name: 'Raj Patel',
      isVerified: true,
    },
    order: {
      id: 'order-002',
      orderNumber: 'BK-001235',
    },
    rating: 4,
    comment: 'Great food, authentic flavors. The biryani was amazing. Only issue was delivery took a bit longer than expected.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'rev-003',
    customer: {
      name: 'Sarah Johnson',
      isVerified: false,
    },
    order: {
      id: 'order-003',
      orderNumber: 'BK-001236',
    },
    rating: 5,
    comment: 'Best Indian food I\'ve had in a while! Everything was fresh and flavorful. The service was excellent too.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ 
  menuItemId, 
  orderId,
  showSubmitForm = false 
}) => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [showForm, setShowForm] = useState(showSubmitForm);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  
  // Filter reviews by menu item if specified
  const filteredReviews = menuItemId
    ? reviews.filter(r => r.itemsReviewed?.some(ir => ir.menuItemId === menuItemId))
    : reviews;
  
  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });
  
  // Calculate average rating
  const averageRating = filteredReviews.length > 0
    ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
    : 0;
  
  // Render star rating
  const renderStars = (rating: number, size: number = 16) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={size} className="text-yellow-400 fill-yellow-400" />
        ))}
        {hasHalfStar && (
          <StarHalf size={size} className="text-yellow-400 fill-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={size} className="text-gray-300" />
        ))}
      </div>
    );
  };
  
  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(averageRating, 20)}
                <span className="text-xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-600">
                  ({filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            
            {showSubmitForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                Write Review
              </button>
            )}
          </div>
        </div>
        
        {/* Review Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className="p-2 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={32}
                        className="text-yellow-400 fill-yellow-400 cursor-pointer"
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Share your experience..."
                />
              </div>
              
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Reviews List */}
        <div className="space-y-6">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {review.customer.name}
                        </h4>
                        {review.customer.isVerified && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(review.createdAt, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {renderStars(review.rating)}
                </div>
                
                {review.comment && (
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                )}
                
                {review.itemsReviewed && review.itemsReviewed.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Item Ratings:
                    </p>
                    <div className="space-y-2">
                      {review.itemsReviewed.map((itemReview, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Item:</span>
                          {renderStars(itemReview.rating, 14)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {review.response && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4 border-l-4 border-primary-500">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Restaurant Response:
                    </p>
                    <p className="text-sm text-gray-600">{review.response.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(review.response.respondedAt, 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

