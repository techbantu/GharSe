/**
 * NEW FILE: About Section - Brand Story and Values
 * 
 * Purpose: Communicates the restaurant's story, values, and unique selling
 * propositions. Builds trust and emotional connection with customers.
 * 
 * Content: Highlights home cooking authenticity, family recipes, quality
 * ingredients, and personal delivery service.
 */

'use client';

import React from 'react';
import { Heart, Users, Award, Truck } from 'lucide-react';

const AboutSection: React.FC = () => {
  const features = [
    {
      icon: Heart,
      title: 'Made with Love',
      description: 'Cooked like family, served with care.',
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      icon: Users,
      title: 'Family Recipes',
      description: 'Generations of authentic flavor.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Award,
      title: 'Quality Ingredients',
      description: 'Fresh daily, premium always.',
      color: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      icon: Truck,
      title: 'Personal Delivery',
      description: 'Fresh to your door, with a smile.',
      color: 'text-primary-500',
      bgColor: 'bg-orange-100',
    },
  ];
  
  return (
    <>
      <style>{`
        /* Mobile: 2 columns for features - compact cards */
        [data-about-features] {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 0.5rem !important;
        }

        /* Mobile: compact card styling */
        .about-feature-card {
          padding: 0.75rem 0.5rem !important;
          min-height: 110px !important;
          border-radius: 0.75rem !important;
        }
        .about-feature-icon {
          width: 2.25rem !important;
          height: 2.25rem !important;
          margin-bottom: 0.375rem !important;
        }
        .about-feature-icon svg {
          width: 16px !important;
          height: 16px !important;
        }
        .about-feature-title {
          font-size: 0.75rem !important;
          margin-bottom: 0.1875rem !important;
        }
        .about-feature-desc {
          font-size: 0.625rem !important;
          line-height: 1.3 !important;
        }

        /* Tablet: 2 columns, slightly larger */
        @media (min-width: 768px) {
          [data-about-features] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
          }
          .about-feature-card {
            padding: 1.25rem 1rem !important;
            min-height: 140px !important;
            border-radius: 1rem !important;
          }
          .about-feature-icon {
            width: 3rem !important;
            height: 3rem !important;
            margin-bottom: 0.75rem !important;
          }
          .about-feature-icon svg {
            width: 20px !important;
            height: 20px !important;
          }
          .about-feature-title {
            font-size: 0.9375rem !important;
            margin-bottom: 0.375rem !important;
          }
          .about-feature-desc {
            font-size: 0.8125rem !important;
            line-height: 1.5 !important;
          }
        }

        /* Desktop: 4 columns, full size */
        @media (min-width: 1024px) {
          [data-about-main] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [data-about-features] {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 1.5rem !important;
          }
          .about-feature-card {
            padding: 1.5rem 1rem !important;
            min-height: auto !important;
            border-radius: 1.25rem !important;
          }
          .about-feature-icon {
            width: 3.5rem !important;
            height: 3.5rem !important;
            margin-bottom: 1rem !important;
          }
          .about-feature-icon svg {
            width: 24px !important;
            height: 24px !important;
          }
          .about-feature-title {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .about-feature-desc {
            font-size: 0.8125rem !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
      <section id="about" className="section bg-gradient-to-br from-orange-50 via-white to-amber-50" style={{ paddingTop: '80px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px' }}>
        <div className="container-custom mx-auto" style={{ maxWidth: '1280px', paddingLeft: '32px', paddingRight: '32px' }}>
          {/* Title - Full width */}
          <div className="animate-slide-up w-full mb-8 md:mb-12">
            <h2 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 800,
              marginBottom: '0',
              lineHeight: '1.1',
              letterSpacing: '-0.04em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
              textAlign: 'center',
              color: '#1d1d1f'
            }}
            className="md:text-left">
              About <span className="text-gradient-orange" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite' }}>GharSe</span>
            </h2>
          </div>

        <div 
          data-about-main
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            alignItems: 'center',
            marginBottom: '48px'
          }}
          className="md:grid md:grid-cols-2 md:gap-16 md:items-center md:mb-20"
        >

          {/* Image - Smaller, positioned after title on mobile */}
          <div className="relative animate-slide-right w-full md:hidden" style={{ marginBottom: '32px' }}>
            <div style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <img
                src="https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=1200&h=1000&fit=crop&q=80"
                alt="Authentic Indian home cooking at GharSe in Hayathnagar, Hyderabad - Traditional family recipes prepared with fresh ingredients"
                style={{
                  width: '100%',
                  height: '280px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.style.background = 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)';
                    parent.style.height = '280px';
                  }
                }}
              />
            </div>
          </div>

          {/* Content - Single paragraph on mobile, full text on desktop */}
          <div className="animate-slide-up md:text-left" style={{ paddingRight: '0' }}>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              color: '#374151',
              lineHeight: '1.75'
            }}>
              {/* Mobile: Single concise paragraph */}
              <p className="md:hidden" style={{
                fontSize: '1.125rem',
                fontWeight: 400,
                color: '#4B5563',
                lineHeight: '1.75',
                letterSpacing: '-0.011em',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
              }}>
                GharSe is where real home kitchens become your favorite restaurant. 
                We connect you with trusted home chefs who cook authentic, regional Indian meals fresh from their homes straight to your door. 
                Every dish is cooked to order in small batches—fresh rotis, slow-simmered curries, comfort food you rarely find in regular takeout.
              </p>

              {/* Desktop: Full text */}
              <div className="hidden md:block">
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: '#1d1d1f',
                  lineHeight: '1.75',
                  letterSpacing: '-0.011em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  marginBottom: '1.25rem'
                }}>
                  GharSe is where real home kitchens become your favorite restaurant.
                  We connect you with trusted home chefs who cook the kind of Indian food they serve their own families.
                </p>
                <p style={{
                  fontSize: '1.0625rem',
                  fontWeight: 400,
                  color: '#4B5563',
                  lineHeight: '1.75',
                  letterSpacing: '-0.011em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  marginBottom: '1.25rem'
                }}>
                  Every meal is cooked to order in small batches, then packed and delivered from their home to yours. 
                  Fresh rotis, slow-simmered curries, biryanis, tiffins, snacks, and soulful comfort dishes—authentic regional flavors 
                  you rarely find in regular takeout.
                </p>
                <p style={{
                  fontSize: '1.0625rem',
                  fontWeight: 400,
                  color: '#4B5563',
                  lineHeight: '1.75',
                  letterSpacing: '-0.011em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  marginBottom: '1.25rem'
                }}>
                  Whether you're craving homestyle North Indian, bold South Indian, or nostalgic dishes that taste like 
                  "back home," GharSe makes it easy to order home-cooked Indian food online with the convenience of delivery 
                  and the heart of a family kitchen.
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#f97316',
                  lineHeight: '1.75',
                  letterSpacing: '-0.011em',
                  marginTop: '12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                }}>
                  From real homes to your hungry heart.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image (Desktop only) */}
          <div className="hidden md:block relative animate-slide-right" style={{ marginTop: '0' }}>
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <img
                src="https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=1200&h=1000&fit=crop&q=80"
                alt="Traditional Indian cuisine preparation at GharSe - Authentic home cooking in Hyderabad with family recipes and fresh spices"
                style={{
                  width: '100%',
                  height: '480px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.style.background = 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)';
                    parent.style.height = '480px';
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Features Grid - Premium Cards with Refined Design */}
        <div 
          data-about-features
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginTop: '2.5rem'
          }}
          className="sm:gap-5 lg:gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            // Premium gradient backgrounds for each feature
            const gradients: Record<string, string> = {
              'text-red-500': 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              'text-blue-500': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              'text-green-500': 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              'text-primary-500': 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
            };
            const iconGradient = gradients[feature.color] || gradients['text-primary-500'];
            
            return (
              <div
                key={index}
                className="group animate-slide-up about-feature-card"
                style={{
                  animationDelay: `${index * 80}ms`,
                  background: 'white',
                  borderRadius: '0.875rem',
                  padding: '0.875rem 0.625rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.04)';
                }}
              >
                {/* Compact Icon Container */}
                <div
                  className="about-feature-icon"
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: iconGradient,
                    borderRadius: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    flexShrink: 0
                  }}
                >
                  <Icon className={feature.color} size={18} strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="about-feature-title" style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#1d1d1f',
                  marginBottom: '0.25rem',
                  textAlign: 'center',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="about-feature-desc" style={{
                  fontSize: '0.6875rem',
                  color: '#6B7280',
                  lineHeight: '1.35',
                  textAlign: 'center',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em',
                  fontWeight: 400,
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
};

export default AboutSection;

