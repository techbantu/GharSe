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
import { ShoppingCart, Phone, Mail, Menu, X, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { restaurantInfo } from '@/data/menuData';

interface HeaderProps {
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const { itemCount, cart } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  
  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <div className="flex items-center justify-between">
            {/* Logo and Brand - Premium Design */}
            <button 
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-4 group transition-all hover:opacity-90"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {/* Custom Logo - Indian-Inspired Premium Mark */}
              <div style={{ position: 'relative', width: '56px', height: '56px' }}>
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
                  
                  {/* Logo Mark - Stylized BK with Indian Lotus Inspiration */}
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
                    
                    {/* Bottom: BK Letters with Premium Typography */}
                    <div style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      fontSize: '18px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      marginTop: '1px'
                    }}>
                      BK
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
              <div style={{ textAlign: 'left', lineHeight: 1 }}>
                <h1 style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                  marginBottom: '2px',
                  lineHeight: '1.1'
                }}>
                  Bantu's Kitchen
                </h1>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  marginTop: '2px'
                }} className="hidden sm:block">
                  Authentic Indian Home Cooking
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
            <div className="flex items-center gap-3">
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
              
              {/* Mobile Menu Toggle - Premium */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                style={{
                  padding: '10px',
                  background: isMobileMenuOpen ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                  border: '1.5px solid',
                  borderColor: isMobileMenuOpen ? 'rgba(249, 115, 22, 0.3)' : 'rgba(156, 163, 175, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none'
                }}
                className="lg:hidden hover:bg-gray-100 active:scale-95"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                type="button"
              >
                {isMobileMenuOpen ? (
                  <X size={22} style={{ color: '#f97316' }} strokeWidth={2.5} />
                ) : (
                  <Menu size={22} style={{ color: '#6B7280' }} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown - Jobs-Level Precision */}
          {isMobileMenuOpen && (
            <div 
              data-mobile-menu
              style={{
                display: 'block',
                marginTop: '32px',
                paddingTop: '24px',
                paddingBottom: '32px',
                paddingLeft: '24px',
                paddingRight: '24px',
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
              {/* Navigation Links - Perfect Spacing */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginBottom: '32px'
              }}>
                {[
                  { label: 'Home', section: 'home' },
                  { label: 'Menu', section: 'menu' },
                  { label: 'About', section: 'about' },
                  { label: 'Contact', section: 'contact' }
                ].map((item, index) => (
                  <button
                    key={item.section}
                    onClick={() => scrollToSection(item.section)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.06)';
                      e.currentTarget.style.color = '#f97316';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1F2937';
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '16px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#1F2937',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.2',
                      outline: 'none',
                      animation: `fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              {/* Divider - Subtle Elegance */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.08), transparent)',
                marginBottom: '32px'
              }}></div>
              
              {/* Contact Cards - Premium Design */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Call Us Card */}
                <a
                  href={`tel:${restaurantInfo.contact.phone}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 20px',
                    background: 'rgba(249, 115, 22, 0.04)',
                    border: '1px solid rgba(249, 115, 22, 0.12)',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    color: '#1F2937',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    cursor: 'pointer'
                  }}
                >
                  {/* Icon Container - 3D Depth */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <Phone size={20} style={{ color: 'white' }} strokeWidth={2.5} />
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: '11px', 
                      color: '#6B7280', 
                      fontWeight: 700, 
                      marginBottom: '4px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      CALL US
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      fontWeight: 700,
                      color: '#1F2937',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.2'
                    }}>
                      {restaurantInfo.contact.phone}
                    </p>
                  </div>
                </a>
                
                {/* Email Us Card */}
                <a
                  href={`mailto:${restaurantInfo.contact.email}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 20px',
                    background: 'rgba(249, 115, 22, 0.04)',
                    border: '1px solid rgba(249, 115, 22, 0.12)',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    color: '#1F2937',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    cursor: 'pointer'
                  }}
                >
                  {/* Icon Container - 3D Depth */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <Mail size={20} style={{ color: 'white' }} strokeWidth={2.5} />
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: '11px', 
                      color: '#6B7280', 
                      fontWeight: 700, 
                      marginBottom: '4px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      EMAIL US
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      fontWeight: 700,
                      color: '#1F2937',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.2',
                      wordBreak: 'break-word'
                    }}>
                      {restaurantInfo.contact.email}
                    </p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
};

export default Header;

