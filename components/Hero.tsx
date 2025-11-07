/**
 * NEW FILE: Hero Section - Landing Page Hero with Call-to-Action
 * 
 * Purpose: Creates an impactful first impression with compelling imagery,
 * value proposition, and immediate ordering CTA.
 * 
 * Design: Full-screen hero with gradient overlay, animated elements, and
 * strategic placement of key messaging.
 */

'use client';

import React from 'react';
import { ArrowRight, Star, Clock, TruckIcon } from 'lucide-react';
import { restaurantInfo } from '@/data/menuData';

interface HeroProps {
  onOrderNowClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOrderNowClick }) => {
  return (
    <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="#FF6B35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>
      
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-20 blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-yellow-400 to-orange-400 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full opacity-10 blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container-custom mx-auto px-12 sm:px-16 lg:px-20 pt-40 pb-32 md:pt-48 md:pb-40 lg:pt-56 lg:pb-48 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left space-y-8 animate-slide-up" style={{ paddingTop: '1rem' }}>
            {/* Badge - Trust Indicator with Icon */}
            <div className="inline-flex items-center" style={{ gap: '8px' }}>
              <div className="flex items-center" style={{ gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className="fill-yellow-400 text-yellow-400 drop-shadow-sm"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-800">
                5.0 • 500+ Reviews
              </span>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.15] tracking-tight">
                <span className="text-gray-900">Authentic</span>
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text text-transparent">
                    Indian Cuisine
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10C50 2 250 2 298 10" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                <br />
                <span className="text-gray-900">Delivered Fresh</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 mt-4">
                Authentic home-cooked meals prepared with love, traditional family recipes, and the finest spices. Experience India's flavors at your doorstep.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingTop: '48px'
            }} className="sm:flex-row lg:justify-start">
              <button
                onClick={onOrderNowClick}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(to right, #ea580c, #f97316, #ef4444)',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s',
                  transform: 'scale(1)',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  width: 'auto'
                }}
                className="group hover:scale-105 hover:-translate-y-1 hover:shadow-orange-500/50"
              >
                <span style={{ 
                  position: 'relative', 
                  zIndex: 10, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '10px' 
                }}>
                  <span>Order Now</span>
                  <ArrowRight style={{ transition: 'transform 0.3s' }} className="group-hover:translate-x-2" size={18} />
                </span>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, #c2410c, #dc2626, #c2410c)',
                  opacity: 0,
                  transition: 'opacity 0.3s'
                }} className="group-hover:opacity-100"></div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.2)',
                  filter: 'blur(48px)',
                  opacity: 0,
                  transition: 'opacity 0.3s'
                }} className="group-hover:opacity-100"></div>
              </button>
              <a
                href="#menu"
                style={{
                  padding: '14px 28px',
                  background: 'white',
                  border: '2px solid #D1D5DB',
                  color: '#374151',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  transition: 'all 0.3s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 12px rgba(0, 0, 0, 0.08)',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  width: 'auto'
                }}
                className="group hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 hover:shadow-xl"
              >
                <span>View Menu</span>
              </a>
            </div>
            
            {/* Feature Pills */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '12px', 
              paddingTop: '24px' 
            }} className="lg:justify-start">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #D1FAE5', 
                gap: '12px', 
                padding: '12px 16px',
                transition: 'box-shadow 0.3s'
              }} className="hover:shadow-lg">
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(to bottom right, #4ADE80, #16A34A)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  flexShrink: 0
                }}>
                  <Clock style={{ color: 'white' }} size={20} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                  <p style={{ fontSize: '10px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready in</p>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#111827', whiteSpace: 'nowrap' }}>30-45 mins</p>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #DBEAFE', 
                gap: '12px', 
                padding: '12px 16px',
                transition: 'box-shadow 0.3s'
              }} className="hover:shadow-lg">
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(to bottom right, #60A5FA, #2563EB)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  flexShrink: 0
                }}>
                  <TruckIcon style={{ color: 'white' }} size={20} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                  <p style={{ fontSize: '10px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Free Delivery</p>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color: '#111827', whiteSpace: 'nowrap' }}>Over ₹{restaurantInfo.settings.freeDeliveryOver}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Stunning Food Grid */}
          <div className="relative animate-slide-left">
            {/* Food Grid - 2x2 Beautiful Layout */}
            <div className="grid grid-cols-2 gap-4 p-4">
                      {/* Biryani - Top Left */}
                      <div className="relative group">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=800&fit=crop&q=80"
                            alt="Biryani"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad1)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍛 Biryani%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 text-white">
                            <p className="text-xs font-semibold opacity-80">Popular</p>
                            <p className="text-lg font-black">Biryani</p>
                            <p className="text-sm font-bold text-yellow-400">From ₹299</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Butter Chicken - Top Right */}
                      <div className="relative group mt-8">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=800&fit=crop&q=80"
                            alt="Curries"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad2)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍛 Curries%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 text-white">
                            <p className="text-xs font-semibold opacity-80">Signature</p>
                            <p className="text-lg font-black">Curries</p>
                            <p className="text-sm font-bold text-yellow-400">From ₹249</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Paneer Tikka - Bottom Left */}
                      <div className="relative group -mt-4">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=800&fit=crop&q=80"
                            alt="Starters"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFB800;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad3)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍢 Starters%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 text-white">
                            <p className="text-xs font-semibold opacity-80">Best Seller</p>
                            <p className="text-lg font-black">Starters</p>
                            <p className="text-sm font-bold text-yellow-400">From ₹49</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desserts - Bottom Right */}
                      <div className="relative group">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&h=800&fit=crop&q=80"
                            alt="Desserts"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFB800;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad4)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍮 Desserts%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 text-white">
                            <p className="text-xs font-semibold opacity-80">Sweet</p>
                            <p className="text-lg font-black">Desserts</p>
                            <p className="text-sm font-bold text-yellow-400">From ₹79</p>
                          </div>
                        </div>
                      </div>
            </div>
            
            {/* Floating Discount Badge */}
            <div style={{ 
              position: 'absolute', 
              bottom: '-32px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 10 
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  background: 'linear-gradient(to bottom right, #f97316, #ef4444, #ec4899)',
                  color: 'white',
                  borderRadius: '9999px',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                  border: '4px solid white',
                  padding: '10px 20px'
                }} className="animate-bounce-subtle">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', lineHeight: '1.1' }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 900, whiteSpace: 'nowrap' }}>20% OFF</p>
                      <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginTop: '2px' }}>First Order</p>
                    </div>
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom right, #fb923c, #f87171)',
                  borderRadius: '9999px',
                  filter: 'blur(48px)',
                  opacity: 0.6,
                  zIndex: -10
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;

