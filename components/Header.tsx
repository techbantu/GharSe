/**
 * NEW FILE: Header Component - Navigation and Cart Access
 * 
 * Purpose: Sticky navigation bar providing site navigation, cart access,
 * and contact information. Implements responsive design for all devices.
 * 
 * UX: Transparent on scroll-top, solid with shadow on scroll for depth perception.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Phone, Mail, Menu, X, Clock, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { restaurantInfo } from '@/data/menuData';
import { LoginModal } from './auth/LoginModal';
import { RegisterModal } from './auth/RegisterModal';
import { ForgotPasswordModal } from './auth/ForgotPasswordModal';

interface HeaderProps {
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const { itemCount, cart } = useCart();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Track client-side hydration to prevent SSR/CSR mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // Mark as mounted after hydration (prevents hydration errors)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      // Close mobile menu on scroll
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);
  
  // Close mobile menu when clicking outside (simplified)
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the mobile menu or the toggle button
      if (target.closest('[data-mobile-menu]') || target.closest('button[aria-label*="menu"]')) {
        return;
      }
      // Close if clicking anywhere else
      setIsMobileMenuOpen(false);
    };
    
    // Add listener after a small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
  
  // Smooth scroll to section - works on homepage, navigates from other pages
  const scrollToSection = (sectionId: string) => {
    // Check if we're on the homepage
    if (window.location.pathname === '/') {
      // On homepage, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setIsMobileMenuOpen(false);
      }
    } else {
      // On other pages, navigate to homepage with hash
      router.push(`/#${sectionId}`);
      setIsMobileMenuOpen(false);
    }
  };
  
  return (
    <>
      {/* Top Info Bar - Contact Information */}
      <div style={{
        background: 'linear-gradient(to right, #f97316, #ea580c)',
        color: 'white',
        padding: '8px 16px',
        fontSize: '0.875rem',
        display: 'none'
      }} className="md:block">
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} />
              <a href={`tel:${restaurantInfo.contact.phone}`} style={{ textDecoration: 'none', color: 'white' }} className="hover:underline">
                {restaurantInfo.contact.phone}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} />
              <a href={`mailto:${restaurantInfo.contact.email}`} style={{ textDecoration: 'none', color: 'white' }} className="hover:underline">
                {restaurantInfo.contact.email}
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} />
            <span>Open: 10:00 AM - 10:00 PM (IST)</span>
          </div>
        </div>
      </div>
      
      {/* Main Navigation - Premium Glass Effect */}
      <header
        style={{
          position: 'sticky',
          top: '0.75rem',
          zIndex: 50,
          background: isScrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: isScrolled 
            ? '1px solid rgba(0, 0, 0, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: isScrolled
            ? '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)'
            : '0 1px 3px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '1rem',
          marginLeft: '0.75rem',
          marginRight: '0.75rem',
          marginTop: '0.75rem'
        }}
      >
        <nav className="container-custom mx-auto" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
          <div className="flex items-center justify-between" style={{ gap: '0.75rem', minWidth: 0 }}>
            {/* Logo and Brand - Premium Design */}
            <button 
              onClick={() => scrollToSection('home')}
              className="flex items-center group transition-all hover:opacity-90"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: 0, 
                minWidth: 0, 
                flex: '0 1 auto',
                overflow: 'hidden',
                gap: '0.75rem'
              }}
            >
              {/* Custom Logo - Indian-Inspired Premium Mark */}
              <div style={{ position: 'relative', width: 'clamp(44px, 10vw, 56px)', height: 'clamp(44px, 10vw, 56px)', flexShrink: 0 }}>
                {/* Outer Glow Ring */}
                <div style={{
                  position: 'absolute',
                  inset: '-4px',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2), rgba(220, 38, 38, 0.2))',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  opacity: 0.6,
                  animation: 'pulse 3s ease-in-out infinite'
                }}></div>
                
                {/* Main Logo Container */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  transform: 'translateZ(0)',
                  transition: 'transform 0.3s ease'
                }} className="group-hover:scale-105">
                  {/* Inner Gradient Overlay for Depth */}
                  <div style={{
                    position: 'absolute',
                    inset: '6px',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 50%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }}></div>
                  
                  {/* Logo Mark - Stylized GS with Indian Lotus Inspiration */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}>
                    {/* Top: Stylized Lotus Petal / Flame */}
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '-2px' }}>
                      <path d="M12 0C12 0 8 4 8 8C8 10 9.79 12 12 12C14.21 12 16 10 16 8C16 4 12 0 12 0Z" fill="white" fillOpacity="0.95"/>
                      <path d="M6 2C6 2 3 5 3 8C3 9.5 4.12 11 6 11C7.88 11 9 9.5 9 8C9 5 6 2 6 2Z" fill="white" fillOpacity="0.7"/>
                      <path d="M18 2C18 2 21 5 21 8C21 9.5 19.88 11 18 11C16.12 11 15 9.5 15 8C15 5 18 2 18 2Z" fill="white" fillOpacity="0.7"/>
                    </svg>
                    
                    {/* Bottom: GS Letters with Premium Typography */}
                    <div style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      fontSize: '18px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      marginTop: '1px'
                    }}>
                      GS
                    </div>
                  </div>
                </div>
                
                {/* Corner Accent - Premium Detail */}
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '14px',
                  height: '14px',
                  background: 'linear-gradient(135deg, #FFB800, #FFA500)',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '8px', lineHeight: '1' }}>✦</span>
                </div>
              </div>
              
              {/* Brand Name with Premium Typography */}
              <div style={{ textAlign: 'left', lineHeight: 1, minWidth: 0, flex: '0 1 auto', overflow: 'hidden' }}>
                <h1 style={{
                  fontSize: 'clamp(18px, 4vw, 26px)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: '#f97316',
                  letterSpacing: '-0.02em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                  marginBottom: '2px',
                  lineHeight: '1.1',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  maxWidth: '100%'
                }}>
                  GharSe
                </h1>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  letterSpacing: '0.02em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  marginTop: '2px',
                  whiteSpace: 'nowrap'
                }} className="hidden sm:block">
                  From Real Homes To Your Hungry Heart
                </p>
              </div>
            </button>
            
            {/* Desktop Navigation - Premium Typography */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => scrollToSection('home')}
                style={{
                  padding: '10px 18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
                className="hover:bg-orange-50 hover:text-orange-600"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('menu')}
                style={{
                  padding: '10px 18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
                className="hover:bg-orange-50 hover:text-orange-600"
              >
                Menu
              </button>
              <button
                onClick={() => scrollToSection('about')}
                style={{
                  padding: '10px 18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
                className="hover:bg-orange-50 hover:text-orange-600"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                style={{
                  padding: '10px 18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
                className="hover:bg-orange-50 hover:text-orange-600"
              >
                Contact
              </button>
            </div>
            
            {/* Cart and Mobile Menu */}
            <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
              {/* Auth Buttons - Desktop (Hydration-safe rendering) */}
              {/* Always render container to prevent hydration mismatch */}
              <div className="hidden md:flex items-center" style={{ gap: '8px' }}>
                {/* Only render auth buttons after client-side hydration */}
                {isMounted && !isLoading && (
                  <>
                    {!isAuthenticated ? (
                      <>
                        <button
                          onClick={() => setShowLoginModal(true)}
                          style={{
                            padding: '10px 20px',
                            background: 'white',
                            border: '2px solid #f97316',
                            color: '#f97316',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                          className="hover:bg-orange-50"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => setShowRegisterModal(true)}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                          }}
                          className="hover:shadow-lg"
                        >
                          Register
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center" style={{ gap: '12px' }}>
                        <button
                          onClick={() => router.push('/profile')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1.5rem',
                            background: 'rgba(249, 115, 22, 0.1)',
                            border: 'none',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <User size={20} style={{ color: '#f97316' }} />
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
                            Hi, {user?.name?.split(' ')[0] || 'User'}
                          </span>
                        </button>
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          style={{
                            padding: '10px 16px',
                            background: 'white',
                            border: '2px solid #e5e7eb',
                            color: '#6b7280',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          className="hover:border-red-300 hover:text-red-600"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Cart Button - Premium 3D Design */}
              <button
                onClick={onCartClick}
                style={{ 
                  position: 'relative', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: 0
                }}
                className="group"
                aria-label="Shopping Cart"
              >
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: 'white',
                  borderRadius: '14px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                  gap: '8px',
                  padding: '11px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  transform: 'translateY(0)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                }} className="group-hover:shadow-lg group-hover:-translate-y-0.5 active:translate-y-0">
                  {/* Inner Glow */}
                  <div style={{
                    position: 'absolute',
                    inset: '1px',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
                    borderRadius: '13px',
                    pointerEvents: 'none'
                  }}></div>
                  
                  <ShoppingCart 
                    size={20} 
                    style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} 
                    strokeWidth={2.5}
                  />
                  <span style={{
                    fontWeight: 700,
                    display: 'none',
                    whiteSpace: 'nowrap',
                    fontSize: '15px',
                    position: 'relative',
                    zIndex: 1,
                    letterSpacing: '-0.01em'
                  }} className="sm:inline">
                    ₹{Math.round(cart.total)}
                  </span>
                  
                  {itemCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'linear-gradient(135deg, #FFB800, #FFA500)',
                      color: '#1F2937',
                      fontSize: '11px',
                      fontWeight: 800,
                      minWidth: '22px',
                      height: '22px',
                      padding: '0 6px',
                      borderRadius: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(255, 184, 0, 0.5), 0 0 0 2px white',
                      border: '1.5px solid white',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.02em'
                    }} className="animate-scale-in">
                      {itemCount}
                    </span>
                  )}
                </div>
              </button>
              
              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  color: '#374151',
                }}
                className="lg:hidden"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                  e.currentTarget.style.color = '#f97316';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                {isMobileMenuOpen ? (
                  <X size={24} strokeWidth={2.5} />
                ) : (
                  <Menu size={24} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown - Compact & Clean */}
          {isMobileMenuOpen && (
            <div 
              data-mobile-menu
              style={{
                display: 'block',
                marginTop: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '16px',
                paddingRight: '16px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 4px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.5) inset',
                zIndex: 100,
                position: 'relative',
                width: '100%',
                animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation Links - Compact Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {[
                  { label: 'Home', section: 'home' },
                  { label: 'Menu', section: 'menu' },
                  { label: 'About', section: 'about' },
                  { label: 'Contact', section: 'contact' }
                ].map((item) => (
                  <button
                    key={item.section}
                    onClick={() => scrollToSection(item.section)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                      e.currentTarget.style.color = '#f97316';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1F2937';
                    }}
                    style={{
                      textAlign: 'center',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1F2937',
                      transition: 'all 0.2s',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              {/* Auth Section - Compact */}
              {isMounted && !isLoading && (
                <div style={{ marginBottom: '16px' }}>
                  {!isAuthenticated ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setShowLoginModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          padding: '10px 16px',
                          background: 'white',
                          border: '1px solid #f97316',
                          color: '#f97316',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setShowRegisterModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, #f97316, #ea580c)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Register
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => {
                          router.push('/profile');
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 12px',
                          background: 'rgba(249, 115, 22, 0.1)',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1f2937',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                        }}
                      >
                        <User size={16} style={{ color: '#f97316' }} />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(true);
                          setIsMobileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 12px',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          color: '#6b7280',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Contact Info - Compact Inline */}
              <div style={{ 
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <a
                  href={`tel:${restaurantInfo.contact.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'rgba(249, 115, 22, 0.08)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#1F2937',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                  }}
                >
                  <Phone size={14} style={{ color: '#f97316' }} />
                  <span>{restaurantInfo.contact.phone}</span>
                </a>
                <a
                  href={`mailto:${restaurantInfo.contact.email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'rgba(249, 115, 22, 0.08)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#1F2937',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                  }}
                >
                  <Mail size={14} style={{ color: '#f97316' }} />
                  <span style={{ fontSize: '11px' }}>{restaurantInfo.contact.email}</span>
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>
      
      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onSwitchToForgotPassword={() => {
          setShowLoginModal(false);
          setShowForgotPasswordModal(true);
        }}
      />
      
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false);
          setShowLoginModal(true);
        }}
      />
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={32} style={{ color: '#ef4444' }} />
              </div>
            </div>
            
            {/* Title */}
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1f2937',
                textAlign: 'center',
                marginBottom: '0.75rem',
              }}
            >
              Confirm Logout
            </h2>
            
            {/* Message */}
            <p
              style={{
                fontSize: '1rem',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '2rem',
                lineHeight: '1.5',
              }}
            >
              Are you sure you want to logout? You'll need to login again to access your account.
            </p>
            
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  color: '#6b7280',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

