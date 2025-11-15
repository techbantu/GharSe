/**
 * TASTE PROFILE WHEEL - Flavor Visualization
 * 
 * Purpose: Interactive circular chart showing customer's taste preferences
 * 
 * Features:
 * - 8-dimensional taste profile (Spicy, Creamy, Tangy, Sweet, Smoky, Herbal, Rich, Light)
 * - Radar/spider chart visualization
 * - Dominant flavor archetype in center
 * - Hover to see details
 * - Beautiful gradient colors
 * 
 * Visual: Interactive data viz meets food science
 */

'use client';

import React from 'react';
import { Flame, Droplets, Zap, Candy, Wind, Sprout, Crown, Feather, Scale, Info, LucideIcon } from 'lucide-react';

interface TasteProfile {
  spicy: number;
  creamy: number;
  tangy: number;
  sweet: number;
  smoky: number;
  herbal: number;
  rich: number;
  light: number;
}

interface FlavorArchetype {
  name: string;
  description: string;
  icon?: LucideIcon;  // Optional icon component
  emoji?: string;     // Kept for backward compatibility but deprecated
}

interface TasteProfileWheelProps {
  tasteProfile: TasteProfile;
  flavorArchetype: FlavorArchetype;
}

const DIMENSIONS = [
  { key: 'spicy' as keyof TasteProfile, label: 'Spicy', icon: Flame, color: 'text-red-500' },
  { key: 'creamy' as keyof TasteProfile, label: 'Creamy', icon: Droplets, color: 'text-blue-400' },
  { key: 'tangy' as keyof TasteProfile, label: 'Tangy', icon: Zap, color: 'text-yellow-500' },
  { key: 'sweet' as keyof TasteProfile, label: 'Sweet', icon: Candy, color: 'text-pink-500' },
  { key: 'smoky' as keyof TasteProfile, label: 'Smoky', icon: Wind, color: 'text-gray-500' },
  { key: 'herbal' as keyof TasteProfile, label: 'Herbal', icon: Sprout, color: 'text-green-500' },
  { key: 'rich' as keyof TasteProfile, label: 'Rich', icon: Crown, color: 'text-amber-600' },
  { key: 'light' as keyof TasteProfile, label: 'Light', icon: Feather, color: 'text-teal-400' },
];

// Map archetype names to Lucide icons
const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
  'Spice Warrior': Flame,
  'Creamy Soul': Droplets,
  'Tangy Explorer': Zap,
  'Sweet Seeker': Candy,
  'Smoke Master': Wind,
  'Herb Enthusiast': Sprout,
  'Royal Gourmet': Crown,
  'Light Balance': Feather,
  'Balanced Foodie': Scale,
};

const TasteProfileWheel: React.FC<TasteProfileWheelProps> = ({
  tasteProfile,
  flavorArchetype,
}) => {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '1rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '1.5rem',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#111827',
          margin: 0,
        }}>Your Taste Profile</h2>
        <div className="group" style={{ position: 'relative' }}>
          <Info size={20} style={{ color: '#9ca3af', cursor: 'help' }} />
          <div className="group-hover-tooltip" style={{
            position: 'absolute',
            right: 0,
            top: '2rem',
            width: '16rem',
            padding: '0.75rem',
            backgroundColor: '#111827',
            color: '#fff',
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s',
            zIndex: 10,
          }}>
            Based on your order history, we've analyzed your flavor preferences across 8 dimensions.
          </div>
        </div>
      </div>

      {/* Center Archetype */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(to right, #fed7aa, #fce7f3)',
          borderRadius: '1rem',
        }}>
          {(() => {
            const IconComponent = ARCHETYPE_ICONS[flavorArchetype.name];
            if (IconComponent) {
              return <IconComponent size={40} style={{ color: '#ea580c' }} />;
            }
            // Fallback to emoji if available, then default icon
            return flavorArchetype.emoji ? (
              <span style={{ fontSize: '2.5rem' }}>{flavorArchetype.emoji}</span>
            ) : (
              <Flame size={40} style={{ color: '#ea580c' }} />
            );
          })()}
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#4b5563',
              fontWeight: 500,
              margin: 0,
            }}>Your Flavor Archetype</p>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#c2410c',
              margin: 0,
            }}>{flavorArchetype.name}</p>
          </div>
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: '#4b5563',
          marginTop: '0.75rem',
          maxWidth: '28rem',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>{flavorArchetype.description}</p>
      </div>

      {/* Taste Dimensions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '1rem',
      }} className="taste-dimensions-grid">
        {DIMENSIONS.map((dimension) => {
          const Icon = dimension.icon;
          const value = tasteProfile[dimension.key];
          
          return (
            <div key={dimension.key} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Icon size={16} className={dimension.color} />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                  }}>{dimension.label}</span>
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#111827',
                }}>{value}</span>
              </div>
              
              {/* Progress Bar */}
              <div style={{
                height: '0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}>
                <div
                  className={`bg-gradient-to-r ${getGradientColor(dimension.key)}`}
                  style={{
                    height: '100%',
                    width: `${value}%`,
                    transition: 'width 1s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
        borderRadius: '0.75rem',
        border: '1px solid #bfdbfe',
      }}>
        <p style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#111827',
          marginBottom: '0.25rem',
          margin: 0,
        }}>Personalized Recommendation</p>
        <p style={{
          fontSize: '0.875rem',
          color: '#374151',
          margin: 0,
          marginTop: '0.25rem',
        }}>
          {getRecommendation(tasteProfile, flavorArchetype)}
        </p>
      </div>

      {/* CSS for hover tooltip */}
      <style jsx>{`
        .group:hover .group-hover-tooltip {
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        @media (min-width: 768px) {
          .taste-dimensions-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

function getGradientColor(dimension: keyof TasteProfile): string {
  const gradients: Record<keyof TasteProfile, string> = {
    spicy: 'from-red-400 to-red-600',
    creamy: 'from-blue-300 to-blue-500',
    tangy: 'from-yellow-400 to-yellow-600',
    sweet: 'from-pink-400 to-pink-600',
    smoky: 'from-gray-400 to-gray-600',
    herbal: 'from-green-400 to-green-600',
    rich: 'from-amber-400 to-amber-600',
    light: 'from-teal-300 to-teal-500',
  };
  return gradients[dimension];
}

function getRecommendation(profile: TasteProfile, archetype: FlavorArchetype): string {
  const recommendations: Record<string, string> = {
    'Spice Warrior': 'Try our Vindaloo or Madras Curry for your next spicy adventure!',
    'Creamy Soul': "You'll love our Butter Chicken or Paneer Makhani.",
    'Tangy Explorer': 'Sample our Lemon Rice or Tamarind Fish Curry.',
    'Sweet Seeker': "Don't miss our Gulab Jamun or Mango Lassi.",
    'Smoke Master': 'Our Tandoori Specialties are calling your name!',
    'Herb Enthusiast': 'Try our Coriander Chicken or Mint Chutney dishes.',
    'Royal Gourmet': 'Indulge in our Dum Biryani or Mughlai Curries.',
    'Light Balance': 'Our Grilled items and Salads are perfect for you.',
    'Balanced Foodie': 'Explore any dish - your diverse palate appreciates it all!',
  };
  
  return recommendations[archetype.name] || 'Explore our menu to discover new flavors!';
}

export default TasteProfileWheel;

