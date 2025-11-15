/**
 * CULINARY PASSPORT - Hero Dashboard Component
 * 
 * Purpose: Display customer's culinary journey in a beautiful passport-style card
 * 
 * Features:
 * - Explorer rank badge (Novice → Legend)
 * - Journey statistics (orders, dishes discovered, regions explored)
 * - Passport stamp collection
 * - Animated progress rings
 * - Gradient background with floating elements
 * 
 * Visual: Think passport meets gaming achievement card
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  TrendingUp,
  Compass,
  Star,
  MapPin,
  Sparkles,
  Target,
  ChefHat,
  Crown,
  X,
} from 'lucide-react';

interface CulinaryPassportProps {
  customerName: string;
  explorerRank: string;
  totalOrders: number;
  dishesDiscovered: number;
  totalDishes: number;
  explorationPercentage: number;
  categoriesExplored: number;
  totalCategories: number;
}

// Explorer rank configurations
const RANK_CONFIG: Record<string, { color: string; bgColor: string; Icon: React.ComponentType<{ size?: number; className?: string }>; nextRank?: string }> = {
  'Novice': {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    Icon: MapPin,
    nextRank: 'Enthusiast',
  },
  'Enthusiast': {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    Icon: Target,
    nextRank: 'Connoisseur',
  },
  'Connoisseur': {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    Icon: Star,
    nextRank: 'Master',
  },
  'Master': {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    Icon: ChefHat,
    nextRank: 'Legend',
  },
  'Legend': {
    color: 'text-yellow-700',
    bgColor: 'bg-gradient-to-r from-yellow-100 to-orange-100',
    Icon: Crown,
  },
};

// Sample regions data - in a real app this would come from your database
const SAMPLE_REGIONS = [
  {
    id: 'north-indian',
    name: 'North Indian',
    description: 'Rich flavors of Punjab, Delhi, and Rajasthan',
    dishes: ['Butter Chicken', 'Paneer Tikka', 'Dal Makhani'],
    color: '#DC2626',
    icon: '🕉️',
    discovered: true,
  },
  {
    id: 'south-indian',
    name: 'South Indian',
    description: 'Spicy coastal cuisine with coconut and rice',
    dishes: ['Masala Dosa', 'Idli Sambar', 'Hyderabadi Biryani'],
    color: '#EA580C',
    icon: '🌴',
    discovered: true,
  },
  {
    id: 'street-food',
    name: 'Street Food',
    description: 'Authentic street-side delicacies',
    dishes: ['Pani Puri', 'Vada Pav', 'Chole Bhature'],
    color: '#F97316',
    icon: '🏪',
    discovered: true,
  },
  {
    id: 'gujarati',
    name: 'Gujarati',
    description: 'Sweet and savory vegetarian cuisine',
    dishes: ['Dhokla', 'Thepla', 'Undhiyu'],
    color: '#F59E0B',
    icon: '🥥',
    discovered: true,
  },
  {
    id: 'bengali',
    name: 'Bengali',
    description: 'Fish and rice based coastal flavors',
    dishes: ['Shorshe Ilish', 'Mishti Doi', 'Ras Malai'],
    color: '#10B981',
    icon: '🐟',
    discovered: true,
  },
  {
    id: 'rajasthani',
    name: 'Rajasthani',
    description: 'Spicy desert cuisine with royal heritage',
    dishes: ['Dal Baati Churma', 'Laal Maas', 'Ghewar'],
    color: '#8B5CF6',
    icon: '🏰',
    discovered: false,
  },
];

const CulinaryPassport: React.FC<CulinaryPassportProps> = ({
  customerName,
  explorerRank,
  totalOrders,
  dishesDiscovered,
  totalDishes,
  explorationPercentage,
  categoriesExplored,
  totalCategories,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showRegionsModal, setShowRegionsModal] = useState(false);
  const rankConfig = RANK_CONFIG[explorerRank] || RANK_CONFIG['Novice'];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 1,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background Image Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        borderRadius: '1rem',
        overflow: 'hidden',
      }}>
        {/* Stunning Food Background - High quality images */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&q=80), url(/images/thali.jpg), url(/images/butter-chicken.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.0) contrast(1.2) saturate(1.5)',
        }} />
        
        {/* Subtle brand-colored overlay for depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.25) 0%, rgba(247, 127, 0, 0.3) 50%, rgba(232, 90, 43, 0.35) 100%)',
        }} />
      </div>

      {/* Premium Glassmorphism Overlay - Frosted Glass Magic */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        backdropFilter: 'blur(16px) saturate(200%)',
        WebkitBackdropFilter: 'blur(16px) saturate(200%)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.12)',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '1.5rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }} className="passport-content">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          flex: 1,
        }} className="passport-grid">
          {/* Compact Header Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {/* Left: Name & Rank */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                display: 'inline-block',
                padding: '0.375rem 0.875rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  margin: 0,
                }}>Culinary Explorer</p>
              </div>
              
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}>
                {customerName}
              </h2>
            </div>

            {/* Right: Compact Rank Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}>
              {(() => {
                const IconComponent = rankConfig.Icon;
                return <IconComponent size={20} className={rankConfig.color} />;
              })()}
              <div>
                <p style={{
                  fontSize: '0.625rem',
                  color: '#6b7280',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}>
                  RANK
                </p>
                <p className={rankConfig.color} style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                }}>
                  {explorerRank}
                </p>
              </div>
              {rankConfig.nextRank && (
                <div style={{
                  marginLeft: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.625rem',
                  color: '#6b7280',
                }}>
                  <TrendingUp size={10} />
                  <span>→{rankConfig.nextRank}</span>
                </div>
              )}
            </div>
          </div>

            {/* Quick Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1rem',
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Compass size={14} style={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                <div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.625rem',
                    margin: 0,
                  }}>Orders</p>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                  }}>{totalOrders}</p>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Star size={14} style={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                <div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.625rem',
                    margin: 0,
                  }}>Dishes</p>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                  }}>{dishesDiscovered}</p>
                </div>
              </div>

              <div
                onClick={() => setShowRegionsModal(true)}
                style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <MapPin size={14} style={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                <div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.625rem',
                    margin: 0,
                  }}>Regions</p>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                  }}>{categoriesExplored}</p>
                </div>
              </div>
            </div>

            {/* Compact Stamps & Progress */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              {/* Stamps Preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <div style={{
                  display: 'flex',
                }}>
                  {[...Array(Math.min(totalOrders, 5))].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        border: '1.5px solid #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        marginLeft: i === 0 ? '0' : '-0.375rem',
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                {totalOrders > 5 && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    +{totalOrders - 5} more stamps
                  </p>
                )}
              </div>

              {/* Compact Progress Bar */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <Sparkles size={16} style={{ color: '#fcd34d' }} />
                <div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.625rem',
                    margin: 0,
                  }}>Flavor Passport</p>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                  }}>{explorationPercentage}% Explored</p>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.625rem',
                    margin: 0,
                  }}>{dishesDiscovered} of {totalDishes} dishes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regions Modal */}
      {showRegionsModal && (
        <div 
          onClick={() => setShowRegionsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="regions-modal"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            {/* Modal Header */}
            <div className="regions-modal-header" style={{
              padding: '1.5rem 1.5rem 1rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0,
                }}>Culinary Regions Explored</h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  margin: '0.25rem 0 0 0',
                }}>
                  {categoriesExplored} of {totalCategories} regions discovered
                </p>
              </div>
              <button
                onClick={() => setShowRegionsModal(false)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="regions-modal-content" style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gap: '1rem',
              }}>
                {SAMPLE_REGIONS.slice(0, categoriesExplored).map((region, index) => (
                  <div
                    key={region.id}
                    className="region-card"
                    onClick={() => {
                      router.push(`/?region=${region.id}#menu`);
                      setShowRegionsModal(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: region.discovered ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      borderRadius: '1rem',
                      border: `2px solid ${region.discovered ? region.color : '#D1D5DB'}`,
                      animation: mounted ? `fadeInScale 0.3s ease-out ${index * 0.1}s backwards` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${region.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Region Icon */}
                    <div className="region-icon" style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: region.discovered ? region.color : '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}>
                      {region.icon}
                    </div>

                    {/* Region Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="region-title" style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: '0 0 0.25rem 0',
                      }}>
                        {region.name}
                      </h4>
                      <p className="region-description" style={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.4',
                      }}>
                        {region.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}>
                        {region.dishes.slice(0, 3).map((dish) => (
                          <span
                            key={dish}
                            className="region-dish-tag"
                            style={{
                              fontSize: '0.75rem',
                              color: region.discovered ? region.color : '#6B7280',
                              backgroundColor: region.discovered ? `${region.color}20` : '#F3F4F6',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.5rem',
                              fontWeight: 500,
                            }}
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      alignItems: 'flex-end',
                    }}>
                      {region.discovered && (
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: region.color,
                          color: 'white',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                        }}>
                          Explored
                        </div>
                      )}
                      <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: region.color,
                        color: 'white',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        View Menu →
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show undiscovered regions if any */}
                {SAMPLE_REGIONS.slice(categoriesExplored).map((region, index) => (
                  <div
                    key={region.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(243, 244, 246, 0.5)',
                      borderRadius: '1rem',
                      border: '2px solid #E5E7EB',
                      opacity: 0.6,
                      animation: mounted ? `fadeInScale 0.3s ease-out ${(categoriesExplored + index) * 0.1}s backwards` : 'none',
                    }}
                  >
                    {/* Region Icon */}
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}>
                      ❓
                    </div>

                    {/* Region Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#9CA3AF',
                        margin: '0 0 0.25rem 0',
                      }}>
                        {region.name}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#9CA3AF',
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.4',
                      }}>
                        {region.description}
                      </p>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#9CA3AF',
                        backgroundColor: '#F9FAFB',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                      }}>
                        Not yet explored
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* Mobile First - Compact Design */
        @media (max-width: 767px) {
          .passport-content {
            padding: 0.875rem !important;
          }
          .passport-grid {
            gap: 0.75rem !important;
          }
          .passport-name {
            font-size: 1.125rem !important;
            line-height: 1.2 !important;
          }
          .stat-value {
            font-size: 1.25rem !important;
          }
          .stat-label {
            font-size: 0.625rem !important;
          }
        }
        
        /* Responsive Design - Desktop */
        @media (min-width: 768px) {
          .passport-content {
            padding: 1rem !important;
          }
          .passport-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
          .passport-name {
            font-size: 1.25rem !important;
          }
        }
        
        @media (min-width: 1024px) {
          .passport-content {
            padding: 1rem !important;
          }
          .passport-name {
            font-size: 1.25rem !important;
          }
        }

        /* Modal Responsive Design */
        @media (max-width: 640px) {
          .regions-modal {
            margin: 0.5rem !important;
            max-height: 90vh !important;
          }

          .regions-modal-header {
            padding: 1rem !important;
          }

          .regions-modal-content {
            padding: 1rem !important;
          }

          .region-card {
            padding: 0.75rem !important;
            gap: 0.75rem !important;
          }

          .region-icon {
            width: 2.5rem !important;
            height: 2.5rem !important;
            font-size: 1rem !important;
          }

          .region-title {
            font-size: 0.9rem !important;
          }

          .region-description {
            font-size: 0.8rem !important;
          }

          .region-dish-tag {
            font-size: 0.7rem !important;
            padding: 0.2rem 0.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Generate next milestone message
 */
function getNextMilestone(
  dishesDiscovered: number,
  totalDishes: number,
  categoriesExplored: number,
  totalCategories: number
): string {
  // Check categories first
  if (categoriesExplored < totalCategories) {
    return `Try ${totalCategories - categoriesExplored} more ${totalCategories - categoriesExplored === 1 ? 'category' : 'categories'} to become a Category Master!`;
  }

  // Then check dish exploration
  const remainingDishes = totalDishes - dishesDiscovered;
  if (remainingDishes > 0) {
    if (remainingDishes <= 5) {
      return `Just ${remainingDishes} more ${remainingDishes === 1 ? 'dish' : 'dishes'} to complete your passport!`;
    }
    return `Discover ${remainingDishes} more dishes to complete your culinary journey!`;
  }

  return "You've explored everything! You're a true Legend!";
}

export default CulinaryPassport;

