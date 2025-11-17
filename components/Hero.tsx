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

import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Clock, TruckIcon } from 'lucide-react';
import { restaurantInfo } from '@/data/menuData';
import { useAuth } from '@/context/AuthContext';
import { getFirstOrderDiscountStatus } from '@/lib/first-order-discount-client';
import { useRouter } from 'next/navigation';

interface HeroProps {
  onOrderNowClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOrderNowClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [showFirstOrderBanner, setShowFirstOrderBanner] = useState(true);
  
  // Check first-order eligibility
  useEffect(() => {
    if (!user?.id) {
      // Show banner for logged-out users (encourages signup)
      setShowFirstOrderBanner(true);
      return;
    }
    
    const checkEligibility = async () => {
      try {
        const status = await getFirstOrderDiscountStatus(user.id);
        setShowFirstOrderBanner(status.available);
      } catch (error) {
        console.error('[Hero] Failed to check first-order eligibility:', error);
        setShowFirstOrderBanner(false);
      }
    };
    
    checkEligibility();
  }, [user]);
  
  // Handle category card clicks - Navigate to menu with category filter
  const handleCategoryClick = (category: string) => {
    // Scroll to menu section with category filter
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      // Update URL with category param
      router.push(`/#menu?category=${encodeURIComponent(category)}`);
      // Scroll smoothly
      setTimeout(() => {
        menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1920px) {
          .hero-section {
            min-height: auto !important;
          }
          .hero-container {
            padding-top: 1.5rem !important;
            padding-bottom: 1.5rem !important;
          }
          .hero-content {
            gap: 1rem !important;
          }
          .hero-content > * {
            margin-bottom: 0.75rem !important;
          }
          .hero-headline {
            margin-bottom: 0.5rem !important;
          }
          .hero-headline h1 {
            margin-bottom: 0.25rem !important;
          }
          .hero-headline h1 span {
            margin-bottom: 0.25rem !important;
          }
          .hero-description {
            margin-top: 0.25rem !important;
          }
          .hero-buttons {
            padding-top: 1rem !important;
          }
          .hero-pills {
            padding-top: 0.75rem !important;
          }
        }
        
        /* Shine animation for discount badge */
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
      `}} />
    <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50 hero-section" suppressHydrationWarning>
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
      
      <div className="container-custom mx-auto px-12 sm:px-16 lg:px-20 pt-40 pb-32 md:pt-48 md:pb-40 lg:pt-56 lg:pb-48 relative z-10 hero-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left space-y-8 animate-slide-up hero-content" style={{ paddingTop: '1rem' }}>
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
            
            {/* Main Headline - Jobs-Level Typography */}
            <div className="space-y-8 hero-headline">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-[-0.04em]">
                <span className="text-[#1d1d1f] block mb-2" style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: '1.05'
                }}>Authentic</span>
                <span className="relative inline-block mb-2">
                  <span className="text-gradient-orange block" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: '1.05',
                    backgroundSize: '200% 200%',
                    animation: 'gradientShift 8s ease infinite'
                  }}>
                    Indian Cuisine
                  </span>
                  <svg className="absolute -bottom-3 left-0 w-full opacity-80" height="14" viewBox="0 0 300 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 107, 53, 0.2))' }}>
                    <defs>
                      <linearGradient id="underlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: '#F77F00', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#EA580C', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                        <path d="M2 12C50 4 250 4 298 12" stroke="url(#underlineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="text-[#1d1d1f] block" style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: '1.05'
                }}>Delivered Fresh</span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-[#4B5563] leading-[1.7] max-w-2xl mx-auto lg:mx-0 mt-6 hero-description" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.011em',
                lineHeight: '1.75'
              }}>
                Authentic home-cooked meals prepared with love, traditional family recipes, and the finest spices. Experience India's flavors at your doorstep.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '12px', 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingTop: '48px',
              flexWrap: 'wrap'
            }} className="lg:justify-start hero-buttons">
              <button
                onClick={onOrderNowClick}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F77F00 50%, #EA580C 100%)',
                  color: 'white',
                  height: '44px',
                  padding: '0 24px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '-0.01em',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  flex: '1 1 auto',
                  minWidth: '140px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className="group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                }}
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
                  height: '44px',
                  padding: '0 24px',
                  background: 'white',
                  border: '2px solid rgba(209, 213, 219, 0.5)',
                  color: '#374151',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '-0.01em',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  flex: '1 1 auto',
                  minWidth: '140px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  WebkitFontSmoothing: 'antialiased'
                }}
                className="group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.5)';
                  e.currentTarget.style.color = '#EA580C';
                  e.currentTarget.style.background = 'rgba(255, 107, 53, 0.06)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 107, 53, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(209, 213, 219, 0.5)';
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>View Menu</span>
              </a>
            </div>
            
            {/* Feature Pills */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row',
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '8px', 
              paddingTop: '24px' 
            }} className="lg:justify-start hero-pills">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #D1FAE5', 
                gap: '8px', 
                padding: '8px 12px',
                transition: 'box-shadow 0.3s',
                flex: '1 1 auto',
                minWidth: '140px'
              }} className="hover:shadow-lg">
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(to bottom right, #4ADE80, #16A34A)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  flexShrink: 0
                }}>
                  <Clock style={{ color: 'white' }} size={18} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                  <p style={{ fontSize: '9px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Ready in</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#111827', whiteSpace: 'nowrap' }}>30-45 mins</p>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #DBEAFE', 
                gap: '8px', 
                padding: '8px 12px',
                transition: 'box-shadow 0.3s',
                flex: '1 1 auto',
                minWidth: '140px'
              }} className="hover:shadow-lg">
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(to bottom right, #60A5FA, #2563EB)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  flexShrink: 0
                }}>
                  <TruckIcon style={{ color: 'white' }} size={18} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                  <p style={{ fontSize: '9px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Free Delivery</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#111827', whiteSpace: 'nowrap' }}>Over ₹{restaurantInfo.settings.freeDeliveryOver}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Stunning Food Grid */}
          <div className="relative animate-slide-left" style={{ paddingBottom: '80px' }}>
            {/* Food Grid - 2x2 Beautiful Layout */}
            <div className="grid grid-cols-2 gap-4 p-4">
                      {/* Biryani - Top Left */}
                      <div 
                        className="relative group cursor-pointer" 
                        onClick={() => handleCategoryClick('Biryani & Rice')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCategoryClick('Biryani & Rice');
                          }
                        }}
                      >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=800&fit=crop&q=80"
                            alt="Authentic Hyderabadi Biryani - Traditional Indian rice dish with spices and meat, delivered fresh in Hayathnagar, Hyderabad"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad1)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍛 Biryani%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white" style={{ zIndex: 10 }}>
                                  <p className="text-xs font-semibold opacity-90" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 800 }}>Popular</p>
                                  <p className="text-lg font-black" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)', fontWeight: 900 }}>Biryani</p>
                                  <p className="text-sm font-bold text-yellow-400" style={{ color: '#FBBF24', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 900 }}>From ₹299</p>
                                </div>
                        </div>
                      </div>
                      
                      {/* Butter Chicken - Top Right */}
                      <div 
                        className="relative group mt-8 cursor-pointer"
                        onClick={() => handleCategoryClick('Curries')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCategoryClick('Curries');
                          }
                        }}
                      >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=800&fit=crop&q=80"
                            alt="Indian Curry Dishes - Creamy butter chicken, dal makhani, and paneer curry from Bantu's Kitchen in Hyderabad"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad2)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍛 Curries%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white" style={{ zIndex: 10 }}>
                                  <p className="text-xs font-semibold opacity-90" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 800 }}>Signature</p>
                                  <p className="text-lg font-black" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)', fontWeight: 900 }}>Curries</p>
                                  <p className="text-sm font-bold text-yellow-400" style={{ color: '#FBBF24', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 900 }}>From ₹249</p>
                                </div>
                        </div>
                      </div>
                      
                      {/* Paneer Tikka - Bottom Left */}
                      <div 
                        className="relative group -mt-4 cursor-pointer"
                        onClick={() => handleCategoryClick('Appetizers')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCategoryClick('Appetizers');
                          }
                        }}
                      >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=800&fit=crop&q=80"
                            alt="Indian Appetizers - Paneer tikka, samosa, and chicken 65 starters from Bantu's Kitchen in Hayathnagar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFB800;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FF6B35;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad3)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍢 Starters%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white" style={{ zIndex: 10 }}>
                                  <p className="text-xs font-semibold opacity-90" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 800 }}>Best Seller</p>
                                  <p className="text-lg font-black" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)', fontWeight: 900 }}>Starters</p>
                                  <p className="text-sm font-bold text-yellow-400" style={{ color: '#FBBF24', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 900 }}>From ₹49</p>
                                </div>
                        </div>
                      </div>
                      
                      {/* Desserts - Bottom Right */}
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => handleCategoryClick('Desserts')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCategoryClick('Desserts');
                          }
                        }}
                      >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500 aspect-square">
                          <img
                            src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&h=800&fit=crop&q=80"
                            alt="Indian Desserts - Gulab jamun, rasmalai, and kheer traditional sweets from Bantu's Kitchen Hyderabad"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='grad4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23F77F00;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFB800;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad4)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='system-ui' font-weight='700'%3E🍮 Desserts%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white" style={{ zIndex: 10 }}>
                                  <p className="text-xs font-semibold opacity-90" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 800 }}>Sweet</p>
                                  <p className="text-lg font-black" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)', fontWeight: 900 }}>Desserts</p>
                                  <p className="text-sm font-bold text-yellow-400" style={{ color: '#FBBF24', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)', fontWeight: 900 }}>From ₹79</p>
                                </div>
                        </div>
                      </div>
            </div>
            
            {/* Floating Discount Badge - Modern Promotional Style */}
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '0',
              right: '0',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0 16px'
            }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
                {/* Main Badge - Pill Shape (Not Circular) */}
                <div style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #DC2626 100%)',
                  color: 'white',
                  borderRadius: '50px', // Pill shape instead of perfect circle
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '3px solid white',
                  padding: '12px 20px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }} 
                className="hover:scale-105 hover:shadow-xl"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.5), 0 6px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)';
                }}>
                  {/* Shine Effect */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                    animation: 'shine 3s infinite',
                    pointerEvents: 'none'
                  }}></div>
                  
                  {/* Content */}
                  <div style={{ 
                    textAlign: 'center', 
                    lineHeight: '1.2',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <p style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 900, 
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.02em',
                      margin: 0,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>20% OFF</p>
                    <p style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em', 
                      whiteSpace: 'nowrap', 
                      marginTop: '2px',
                      opacity: 0.95,
                      margin: 0
                    }}>First Order</p>
                  </div>
                </div>
                
                {/* Subtle Glow Effect */}
                <div style={{
                  position: 'absolute',
                  inset: '-4px',
                  background: 'linear-gradient(135deg, #F97316, #DC2626)',
                  borderRadius: '54px',
                  filter: 'blur(12px)',
                  opacity: 0.4,
                  zIndex: -1,
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
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
    </>
  );
};

export default Hero;

