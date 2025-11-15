/**
 * ACHIEVEMENT GALLERY - Gamification Badges
 * 
 * Purpose: Display unlocked achievements and progress toward locked ones
 * 
 * Features:
 * - Unlocked badges with colorful design
 * - Locked badges in grayscale with progress
 * - Grouped by category
 * - Hover animations
 * - Rarity system (Common, Rare, Epic, Legendary)
 * 
 * Visual: Xbox Achievements meets collectible cards
 */

'use client';

import React from 'react';
import { Trophy, Lock, TrendingUp, LucideIcon } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon | string;  // Can be Lucide icon component or string (for backward compatibility)
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  category: string;
  unlocked: boolean;
  progress: number;
  currentValue: number;
  targetValue: number;
  reward?: string;
}

interface AchievementGalleryProps {
  achievements: Achievement[];
  totalUnlocked: number;
  completionPercentage: number;
}

const RARITY_COLORS = {
  Common: 'from-gray-400 to-gray-600',
  Rare: 'from-blue-400 to-blue-600',
  Epic: 'from-purple-400 to-purple-600',
  Legendary: 'from-yellow-400 to-orange-600',
};

const AchievementGallery: React.FC<AchievementGalleryProps> = ({
  achievements,
  totalUnlocked,
  completionPercentage,
}) => {
  return (
    <div style={{ gap: '1.5rem' }} className="space-y-6">
      {/* Header with Stats */}
      <div style={{
        background: 'linear-gradient(to right, #a855f7, #ec4899, #ef4444)',
        borderRadius: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '1.5rem',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <Trophy size={24} />
              <h2 style={{
                fontSize: '1.5rem',
                lineHeight: '2rem',
                fontWeight: '700'
              }}>Your Achievements</h2>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              lineHeight: '1.25rem'
            }}>
              {totalUnlocked} of {achievements.length} unlocked ({completionPercentage}%)
            </p>
          </div>
          <div style={{
            textAlign: 'right',
            paddingLeft: '1rem'
          }}>
            <div style={{
              fontSize: '2.25rem',
              lineHeight: '2.5rem',
              fontWeight: '700',
              marginBottom: '0.25rem'
            }}>{completionPercentage}%</div>
            <div style={{
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginTop: '1rem'
        }}>
          <div
            style={{
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '9999px',
              transition: 'width 1s ease-out',
              width: `${completionPercentage}%`
            }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const rarityGradient = RARITY_COLORS[achievement.rarity];
  
  if (achievement.unlocked) {
    return (
      <div className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
        {/* Rarity Border */}
        <div style={{
          height: '4px',
          background: `linear-gradient(to right, ${rarityGradient.includes('gray') ? '#9ca3af, #6b7280' :
            rarityGradient.includes('blue') ? '#60a5fa, #3b82f6' :
            rarityGradient.includes('purple') ? '#a855f7, #9333ea' :
            '#fbbf24, #f97316'})`
        }} />

        {/* Content */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3rem',
              height: '3rem',
              marginTop: '0.125rem'
            }}>
              {typeof achievement.icon === 'string' ? (
                <span style={{ fontSize: '2.5rem', lineHeight: '1' }}>{achievement.icon}</span>
              ) : (
                <achievement.icon size={32} style={{
                  color: rarityGradient.includes('gray') ? '#6b7280' :
                         rarityGradient.includes('blue') ? '#3b82f6' :
                         rarityGradient.includes('purple') ? '#9333ea' :
                         '#f97316'
                }} />
              )}
            </div>
            <div style={{
              flex: '1 1 auto',
              minWidth: 0
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.375rem'
              }}>
                <h3 style={{
                  fontWeight: '700',
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem'
                }}>{achievement.name}</h3>
              </div>
              <p style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                fontWeight: '500',
                background: `linear-gradient(to right, ${rarityGradient.includes('gray') ? '#9ca3af, #6b7280' :
                  rarityGradient.includes('blue') ? '#60a5fa, #3b82f6' :
                  rarityGradient.includes('purple') ? '#a855f7, #9333ea' :
                  '#fbbf24, #f97316'})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {achievement.rarity}
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            color: '#4b5563',
            marginBottom: '1rem'
          }}>{achievement.description}</p>

          {achievement.reward && (
            <div style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem'
            }}>
              <p style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                color: '#166534',
                fontWeight: '500'
              }}>✓ {achievement.reward}</p>
            </div>
          )}
        </div>

        {/* Unlocked Badge */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <Trophy size={16} className="text-white" />
        </div>
      </div>
    );
  }

  // Locked achievement
  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#f9fafb',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      border: '2px solid #e5e7eb'
    }}>
      {/* Rarity Border (muted) */}
      <div style={{ height: '4px', backgroundColor: '#d1d5db' }} />

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            filter: 'grayscale(100%)',
            opacity: '0.5',
            marginTop: '0.125rem'
          }}>
            {typeof achievement.icon === 'string' ? (
              <span style={{ fontSize: '2.5rem', lineHeight: '1' }}>{achievement.icon}</span>
            ) : (
              <achievement.icon size={32} style={{ color: '#9ca3af' }} />
            )}
          </div>
          <div style={{
            flex: '1 1 auto',
            minWidth: 0
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem'
            }}>
              <h3 style={{
                fontWeight: '700',
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem',
                lineHeight: '1.25rem'
              }}>{achievement.name}</h3>
            </div>
            <p style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              fontWeight: '500',
              color: '#9ca3af'
            }}>{achievement.rarity}</p>
          </div>
        </div>

        <p style={{
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          color: '#6b7280',
          marginBottom: '1.25rem'
        }}>{achievement.description}</p>

        {/* Progress */}
        <div style={{ gap: '0.5rem' }} className="space-y-2">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            lineHeight: '1.25rem'
          }}>
            <span style={{
              color: '#4b5563',
              fontWeight: '500'
            }}>Progress</span>
            <span style={{
              color: '#111827',
              fontWeight: '700'
            }}>
              {achievement.currentValue} / {achievement.targetValue}
            </span>
          </div>
          <div style={{
            height: '0.5rem',
            backgroundColor: '#e5e7eb',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #fb923c, #ef4444)',
                transition: 'width 0.5s ease-out',
                width: `${achievement.progress}%`
              }}
            />
          </div>
          <p style={{
            fontSize: '0.75rem',
            lineHeight: '1rem',
            color: '#6b7280'
          }}>
            {achievement.targetValue - achievement.currentValue} more to unlock
          </p>
        </div>
      </div>

      {/* Locked Badge */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
        <Lock size={16} className="text-white" />
      </div>
    </div>
  );
};

export default AchievementGallery;

