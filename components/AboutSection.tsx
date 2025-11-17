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
      description: 'Every dish is prepared with the same care and attention as cooking for our own family.',
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      icon: Users,
      title: 'Family Recipes',
      description: 'Traditional recipes passed down through generations, preserving authentic flavors.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Award,
      title: 'Quality Ingredients',
      description: 'Fresh, premium ingredients sourced daily to ensure the best taste and nutrition.',
      color: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      icon: Truck,
      title: 'Personal Delivery',
      description: 'Family-run delivery service ensuring your food arrives fresh and with a smile.',
      color: 'text-primary-500',
      bgColor: 'bg-orange-100',
    },
  ];
  
  return (
    <>
      <style>{`
        /* Mobile: 2 columns for features */
        [data-about-features] {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        
        /* Tablet: 2 columns */
        @media (min-width: 768px) {
          [data-about-features] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        /* Desktop: 4 columns */
        @media (min-width: 1024px) {
          [data-about-main] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [data-about-features] {
            grid-template-columns: repeat(4, 1fr) !important;
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
        
        {/* Features Grid - Responsive: 2 cols mobile, 2 cols tablet, 4 cols desktop */}
        <div 
          data-about-features
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginTop: '32px'
          }}
          className="sm:gap-3 lg:gap-4"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card text-center group hover:shadow-xl animate-slide-up p-2.5 sm:p-3"
                style={{ animationDelay: `${index * 100}ms`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${feature.bgColor} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`} style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                  <Icon className={feature.color} size={18} style={{ width: '18px', height: '18px', display: 'block' }} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1" style={{ width: '100%', textAlign: 'center' }}>
                  {feature.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-600 leading-tight text-center" style={{ lineHeight: '1.4', width: '100%' }}>
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

