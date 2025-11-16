/**
 * SMART INSIGHTS - Data Visualization Cards
 * 
 * Purpose: Display intelligent insights about ordering behavior
 * 
 * Features:
 * - Favorite dishes with reorder buttons
 * - Spending trends chart
 * - Category exploration grid
 * - Order patterns analysis
 * - Discovery score
 * - Next order prediction
 * 
 * Visual: Clean data viz with actionable insights
 */

'use client';

import React from 'react';
import { 
  Heart, 
  TrendingUp, 
  Compass, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  LucideIcon, 
  UtensilsCrossed,
  // Category Icons
  Cookie,
  Soup,
  Wheat,
  Cake,
  CupSoda,
  Popcorn,
  Star,
  Beef
} from 'lucide-react';

// Icon mapping function
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    'cookie': Cookie,
    'soup': Soup,
    'beef': Beef,
    'wheat': Wheat,
    'cake': Cake,
    'cup-soda': CupSoda,
    'popcorn': Popcorn,
    'star': Star,
    'utensils-crossed': UtensilsCrossed
  };
  
  return iconMap[iconName] || UtensilsCrossed;
};

interface FavoriteDish {
  dishId: string;
  dishName: string;
  category: string;
  orderCount: number;
  image?: string;
}

interface MonthlySpending {
  month: string;
  amount: number;
}

interface CategoryExploration {
  category: string;
  orderCount: number;
  percentageOfTotal: number;
  icon?: LucideIcon;  // Icon component
  iconName?: string;  // Icon name for mapping
  iconEmoji?: string; // Deprecated, kept for backward compatibility
}

interface SmartInsightsProps {
  favoriteDishes: FavoriteDish[];
  monthlySpending: MonthlySpending[];
  totalSpent: number;
  averageOrderValue: number;
  categoryExploration: CategoryExploration[];
  favoriteDay: string;
  favoriteTime: string;
  orderFrequency: string;
  nextOrderPrediction: string;
  onReorder: (dishId: string) => void;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({
  favoriteDishes,
  monthlySpending,
  totalSpent,
  averageOrderValue,
  categoryExploration,
  favoriteDay,
  favoriteTime,
  nextOrderPrediction,
  onReorder,
}) => {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <Sparkles className="text-purple-500" size={28} />
        <h2 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: '#111827',
          margin: 0 
        }}>Smart Insights</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
        gap: '1.5rem'
      }} className="insights-grid">
        <style jsx>{`
          @media (min-width: 768px) {
            .insights-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
          @media (min-width: 1024px) {
            .insights-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
        `}</style>

        {/* Your Favorites Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1.25rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1.25rem',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#FEF2F2',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
          }}>
              <Heart className="text-red-500" size={16} />
            </div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: '#111827',
              margin: 0 
            }}>Your Favorites</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {favoriteDishes.slice(0, 2).map((dish, idx) => (
              <div key={dish.dishId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.transform = 'translateX(0)';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #FB923C, #EF4444)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ 
                      fontWeight: '600', 
                      color: '#111827', 
                      fontSize: '0.875rem',
                      marginBottom: '0.125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{dish.dishName}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {dish.orderCount}x ordered
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onReorder(dish.dishId)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#F97316',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    marginLeft: '0.5rem'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
                >
                  Reorder
                </button>
              </div>
            ))}
          </div>

          {favoriteDishes.length > 2 && (
            <p style={{ 
              fontSize: '0.75rem',
              color: '#6B7280', 
              marginTop: '0.75rem', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              +{favoriteDishes.length - 2} more favorites
            </p>
          )}
        </div>

        {/* Spending Overview Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1.25rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1.25rem',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#F0FDF4',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
          }}>
              <TrendingUp className="text-green-500" size={16} />
            </div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: '#111827',
              margin: 0 
            }}>Spending Overview</h3>
          </div>
          
          {/* Metrics Row */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              flex: 1,
              textAlign: 'center', 
              padding: '0.75rem',
              backgroundColor: '#F0FDF4',
              borderRadius: '0.5rem',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#6B7280', 
                marginBottom: '0.25rem'
              }}>Total Spent</p>
              <p style={{ 
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#16A34A'
              }}>₹{totalSpent.toFixed(0)}</p>
            </div>
            <div style={{ 
              flex: 1,
              textAlign: 'center', 
              padding: '0.75rem',
              backgroundColor: '#EFF6FF', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#6B7280', 
                marginBottom: '0.25rem'
              }}>Avg. Order</p>
              <p style={{ 
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#2563EB'
              }}>₹{averageOrderValue.toFixed(0)}</p>
            </div>
          </div>

          {/* Compact Chart */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.25rem',
            height: '3rem',
            padding: '0.5rem',
            backgroundColor: '#F9FAFB',
            borderRadius: '0.5rem'
          }}>
            {monthlySpending.slice(-6).map((month, idx) => {
              const maxAmount = Math.max(...monthlySpending.map(m => m.amount));
              const height = maxAmount > 0 ? Math.max((month.amount / maxAmount) * 100, 8) : 8; // Minimum 8% height
              
              return (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem'
                }}>
                  <div style={{
                    width: '100%',
                    background: 'linear-gradient(to top, #16A34A, #4ADE80)',
                    borderRadius: '0.125rem',
                    transition: 'all 0.3s ease',
                    height: `${height}%`,
                    minHeight: '0.25rem'
                  }} />
                  <span style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: '500' }}>
                    {month.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Explorer Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1.25rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1.25rem',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#FAF5FF',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
          }}>
              <Compass className="text-purple-500" size={16} />
            </div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: '#111827',
              margin: 0 
            }}>Category Explorer</h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '0.5rem'
          }}>
            {categoryExploration.slice(0, 3).map((category) => (
              <div key={category.category} style={{
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '0.375rem' 
                }}>
                  {(() => {
                    // Priority: icon > iconName > iconEmoji > default
                    if (category.icon) {
                      const IconComponent = category.icon;
                      return <IconComponent size={24} className="text-orange-600" />;
                    } else if (category.iconName) {
                      const IconComponent = getIconComponent(category.iconName);
                      return <IconComponent size={24} className="text-orange-600" />;
                    } else if (category.iconEmoji) {
                      return <span style={{ fontSize: '1.25rem' }}>{category.iconEmoji}</span>;
                    } else {
                      return <UtensilsCrossed size={24} className="text-orange-600" />;
                    }
                  })()}
                </div>
                <p style={{ 
                  fontSize: '0.75rem',
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: '0.125rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2'
                }}>{category.category}</p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  fontWeight: '500'
                }}>
                  {category.percentageOfTotal}%
                </p>
              </div>
            ))}
          </div>
          
          {categoryExploration.length > 3 && (
            <p style={{ 
              fontSize: '0.75rem',
              color: '#6B7280', 
              marginTop: '0.75rem', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              +{categoryExploration.length - 3} more categories
            </p>
          )}
        </div>

        {/* Order Patterns Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1.25rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1.25rem',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#EFF6FF',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
          }}>
              <Calendar className="text-blue-500" size={16} />
            </div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: '#111827',
              margin: 0 
            }}>Order Patterns</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: '#EFF6FF', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#6B7280', 
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>Favorite Day</p>
              <p style={{ 
                fontSize: '1rem',
                fontWeight: '700',
                color: '#1E40AF'
              }}>{favoriteDay}</p>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: '#F5F3FF', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EDE9FE'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F3FF'}>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#6B7280', 
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>Favorite Time</p>
              <p style={{ 
                fontSize: '1rem',
                fontWeight: '700',
                color: '#6B21A3'
              }}>{favoriteTime}</p>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: '#FFF7ED', 
              borderRadius: '0.5rem',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF7ED'}>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#6B7280', 
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>Next Order Likely</p>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: '1.4',
                fontWeight: '500'
              }}>{nextOrderPrediction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartInsights;

