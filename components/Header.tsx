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
import { useActiveOrder } from '@/context/ActiveOrderContext';
import { restaurantInfo } from '@/data/menuData';
import { LoginModal } from './auth/LoginModal';
import { RegisterModal } from './auth/RegisterModal';
import { ForgotPasswordModal } from './auth/ForgotPasswordModal';
import Logo from './Logo';

interface HeaderProps {
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const { itemCount: cartItemCount, cart } = useCart();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { isInGracePeriod, activeOrder } = useActiveOrder();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // GENIUS FIX: Show active order item count when in grace period
  const itemCount = isInGracePeriod && activeOrder 
    ? activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)
    : cartItemCount;
  
  // Track client-side hydration to prevent SSR/CSR mismatch
  const [isMounted, setIsMounted] = useState(false);
  // Track if we're on desktop (>= 1024px) - initialize to true to prevent flash
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Mark as mounted after hydration (prevents hydration errors)
  useEffect(() => {
    // Check desktop BEFORE setting mounted to prevent flash of hamburger
    const isLargeScreen = window.innerWidth >= 1024;
    console.log('[Header] Window width:', window.innerWidth, 'isLargeScreen:', isLargeScreen);
    setIsDesktop(isLargeScreen);
    setIsMounted(true);
    
    // Listen for resize events
    const checkDesktop = () => {
      const newIsDesktop = window.innerWidth >= 1024;
      console.log('[Header] Resize - Window width:', window.innerWidth, 'isDesktop:', newIsDesktop);
      setIsDesktop(newIsDesktop);
    };
    
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
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
      {/* Grace Period Banner - Shows when user can modify active order */}
      {isMounted && isInGracePeriod && activeOrder && activeOrder.status !== 'cancelled' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'linear-gradient(135deg, #f97316, #fb923c)',
            color: 'white',
            padding: '0.75rem 1rem',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock className="animate-pulse" size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                Items will be added to Order #{activeOrder.orderNumber}
              </span>
            </div>
            <button
              onClick={onCartClick}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              View Order →
            </button>
          </div>
        </div>
      )}
      
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
        <nav className="container-custom mx-auto" style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
          <div className="flex items-center justify-between" style={{ gap: '0.5rem', minWidth: 0 }}>
            {/* Logo and Brand - Premium Design */}
            <button 
              onClick={() => scrollToSection('home')}
              className="flex items-center group transition-all hover:opacity-90"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: 0, 
                minWidth: '120px',
                maxWidth: '120px',
                flex: '0 0 auto',
                position: 'relative',
                zIndex: 20
              }}
            >
              <img 
                src="/images/GharSe.png" 
                alt="GharSe - From Real Homes To Your Hungry Heart"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
                className="group-hover:opacity-90"
              />
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
            <div className="flex items-center gap-2" style={{ flexShrink: 0, marginLeft: 'auto' }}>
              {/* Auth Buttons - Visible on ALL screens (Hydration-safe rendering) */}
              {/* Always render container to prevent hydration mismatch */}
              <div className="flex items-center" style={{ gap: '6px' }}>
                {/* Only render auth buttons after client-side hydration */}
                {isMounted && !isLoading && (
                  <>
                    {!isAuthenticated ? (
                      <>
                        <button
                          onClick={() => setShowLoginModal(true)}
                          style={{
                            height: '44px',
                            padding: '0 14px',
                            background: 'white',
                            border: '2px solid #f97316',
                            color: '#f97316',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          className="hover:bg-orange-50 hidden sm:flex"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => setShowRegisterModal(true)}
                          style={{
                            height: '44px',
                            padding: '0 14px',
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          className="hover:shadow-lg hidden sm:flex"
                        >
                          Register
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Desktop: Full profile button */}
                        <button
                          onClick={() => router.push('/profile')}
                          style={{
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0 12px',
                            background: 'rgba(249, 115, 22, 0.1)',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1f2937',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            whiteSpace: 'nowrap',
                          }}
                          className="hover:bg-orange-100 hidden sm:flex"
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
                          <User size={18} style={{ color: '#f97316' }} />
                          <span className="hidden md:inline" style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                            {user?.name?.split(' ')[0] || 'User'}
                          </span>
                        </button>
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          style={{
                            height: '44px',
                            padding: '0 12px',
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
                          className="hover:border-red-300 hover:text-red-600 hidden sm:flex"
                        >
                          <LogOut size={16} />
                          <span className="hidden md:inline">Logout</span>
                        </button>
                      </>
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
                  padding: 0,
                  height: '44px',
                  flexShrink: 0,
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
                  borderRadius: '12px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  gap: '6px',
                  padding: '0 14px',
                  height: '44px',
                  transform: 'translateY(0)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                }} className="group-hover:shadow-lg group-hover:-translate-y-0.5 active:translate-y-0">
                  
                  <ShoppingCart 
                    size={20} 
                    style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} 
                    strokeWidth={2.5}
                  />
                  <span style={{
                    fontWeight: 700,
                    display: 'none',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    position: 'relative',
                    zIndex: 1,
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
              
              {/* Mobile/Tablet Menu Toggle Button - Only rendered on client after hydration, hidden on desktop */}
              {isMounted && !isDesktop && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  data-mobile-menu-toggle="true"
                  className="flex items-center justify-center"
                  style={{
                    height: '44px',
                    width: '44px',
                    minWidth: '44px',
                    background: isMobileMenuOpen ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    color: isMobileMenuOpen ? '#f97316' : '#374151',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobileMenuOpen) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  {isMobileMenuOpen ? (
                    <X size={22} strokeWidth={2.5} />
                  ) : (
                    <Menu size={22} strokeWidth={2.5} />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Dropdown - Compact & Clean - Shows on screens smaller than lg (1024px) */}
          {isMobileMenuOpen && (
            <div 
              data-mobile-menu
              className="lg:hidden"
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

