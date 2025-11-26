/**
 * SIMPLIFIED FOOTER - Clean, Balanced Design System Implementation
 * 
 * Purpose: Provides essential business information with proper spacing,
 * clean layout, and consistent design system usage.
 * 
 * Layout: 4-column responsive grid with equal spacing
 * - Brand & description (with ratings)
 * - Contact information  
 * - Business hours
 * - Quick links & payment methods
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Heart, CreditCard, Smartphone, IndianRupee } from 'lucide-react';
import { restaurantInfo } from '@/data/menuData';
import { getBusinessStatusMessage, BUSINESS_HOURS } from '@/utils/business-hours';
import Logo from './Logo';

const FooterSimple: React.FC = () => {
  // HYDRATION-SAFE: Use 2025 as fallback, update on client mount
  const [currentYear, setCurrentYear] = useState(2025);
  const [businessStatus, setBusinessStatus] = useState({ message: 'Loading...', color: 'yellow' });
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize values on client mount to prevent hydration mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setBusinessStatus(getBusinessStatusMessage());
    setIsMounted(true);
    
    // Update status every minute
    const interval = setInterval(() => {
      setBusinessStatus(getBusinessStatusMessage());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <footer style={{ position: 'relative', background: '#111827', color: 'white', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
      {/* Single Horizontal Row Footer */}
        <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '1.5rem 2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
          gap: '2rem' 
      }}>
          
        {/* Brand Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <Logo variant="small" showTagline={true} />
        </div>
            
        {/* Tagline */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          color: '#D1D5DB',
          fontSize: '0.875rem',
          maxWidth: '320px',
          flexShrink: 0
        }}>
                Home-cooked meals from real home kitchens, bringing authentic regional Indian flavors straight to your door.
            </div>
            
        {/* Rating & Reviews */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
              }}>
            <span style={{ fontSize: '1rem' }}>⭐</span>
            <span style={{ color: '#FACC15', fontWeight: 700, fontSize: '0.875rem' }}>5.0 Rating</span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px',
            padding: '0.5rem 1rem'
              }}>
            <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: '0.875rem' }}>500+ Reviews</span>
            </div>
          </div>
          
        {/* Contact Info - Status on Top, Phone Below */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
          gap: '0.75rem',
                  flexShrink: 0,
          fontSize: '0.875rem'
        }}>
          {/* Open/Closed Status - On Top */}
          <div style={{
                borderRadius: '8px',
            padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
            gap: '0.5rem',
                background: businessStatus.color === 'green'
              ? 'rgba(34, 197, 94, 0.2)'
                  : businessStatus.color === 'yellow'
              ? 'rgba(234, 179, 8, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
                border: businessStatus.color === 'green'
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : businessStatus.color === 'yellow'
                  ? '1px solid rgba(234, 179, 8, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: businessStatus.color === 'green'
                    ? '#4ADE80'
                    : businessStatus.color === 'yellow'
                    ? '#FACC15'
                    : '#F87171',
              animation: businessStatus.color === 'green' || businessStatus.color === 'yellow' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                }}></div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: businessStatus.color === 'green'
                    ? '#4ADE80'
                    : businessStatus.color === 'yellow'
                    ? '#FACC15'
                    : '#F87171'
                }}>
                  {businessStatus.message}
                </span>
            </div>

          {/* Call Us - Below Status */}
          <a 
            href={`tel:${restaurantInfo.contact.phone}`}
            style={{ 
                  display: 'flex',
                  alignItems: 'center',
              gap: '0.5rem',
              color: '#D1D5DB',
              textDecoration: 'none',
              transition: 'color 0.3s'
            }}
            className="hover:text-orange-400"
          >
            <Phone size={16} />
            <span style={{ fontWeight: 500 }}>Call Us: {restaurantInfo.contact.phone}</span>
          </a>

          {/* Business Hours */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#D1D5DB'
          }}>
            <Clock size={16} />
            <span style={{ fontWeight: 500 }}>Mon-Sun: 10:00 AM - 10:00 PM</span>
          </div>
          </div>
          
        {/* Social Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {restaurantInfo.socialMedia?.facebook && (
              <a
                href={`https://facebook.com/${restaurantInfo.socialMedia.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                width: '36px',
                height: '36px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.3s'
                }}
              className="hover:bg-blue-600"
                aria-label="Facebook"
              >
              <Facebook size={16} />
              </a>
            )}
            {restaurantInfo.socialMedia?.instagram && (
              <a
                href={`https://instagram.com/${restaurantInfo.socialMedia.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                width: '36px',
                height: '36px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.3s'
                }}
              className="hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600"
                aria-label="Instagram"
              >
              <Instagram size={16} />
              </a>
            )}
          </div>
          
      </div>

      {/* Bottom Copyright Bar */}
      <div style={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '1rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.75rem',
          color: '#9CA3AF'
        }}>
          <div style={{ margin: 0 }}>
            <p style={{ margin: 0, marginBottom: '0.25rem' }}>
              © {currentYear} <span style={{ fontWeight: 600 }}>GharSe</span>. All rights reserved.
            </p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#6B7280' }}>
              Operated by Sailaja | Powered by TechBantu IT Solutions LLC
            </p>
          </div>
          
          {/* Legal Links */}
          <p style={{ 
            margin: 0,
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <a href="/legal" style={{ color: '#FF6B35', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem' }}>Legal</a>
            <a href="/legal/privacy-policy" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.75rem' }} className="hover:text-orange-400">Privacy</a>
            <a href="/legal/terms-of-service" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.75rem' }} className="hover:text-orange-400">Terms</a>
            <a href="/legal/refund-policy" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.75rem' }} className="hover:text-orange-400">Refunds</a>
            <a href="/legal/referral-terms" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.75rem' }} className="hover:text-orange-400">Referrals</a>
          </p>
          
          <p style={{ 
            margin: 0,
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem'
          }}>
            Made with 
              <Heart 
              size={12} 
                style={{
                  color: '#EF4444',
                  fill: '#EF4444',
                animation: 'heartBeat 1.2s ease-in-out infinite'
                }}
              />
            for authentic Indian cuisine lovers
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Smartphone size={12} /> UPI
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CreditCard size={12} /> Cards
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <IndianRupee size={12} /> Cash
            </span>
          </div>
        </div>
      </div>
          
          <style jsx>{`
            @keyframes heartBeat {
          0%, 20%, 40%, 100% {
                transform: scale(1);
              }
              10% {
                transform: scale(1.15);
              }
              30% {
                transform: scale(1.3);
              }
            }
          `}</style>
    </footer>
  );
};

export default FooterSimple;
