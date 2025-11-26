/**
 * UPDATED FILE: Footer Component - Elegant, Balanced Design
 * 
 * Purpose: Provides essential business information with clear hierarchy,
 * generous spacing, and visual breathing room. Creates a calm, structured
 * experience that feels like "the calm after a good meal."
 * 
 * Design Philosophy:
 * - Large, warm brand presence (Bantu's Kitchen) at center-left
 * - 3-column grid with 50px spacing and internal padding
 * - Rating/Reviews as elegant badge cluster near brand
 * - Generous vertical spacing (60px between sections)
 * - Subtle top gradient for depth
 * - Consistent typography scale
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Heart, CreditCard, IndianRupee, Smartphone, Leaf, ChefHat, Truck, Star } from 'lucide-react';
import { restaurantInfo } from '@/data/menuData';
import { getBusinessStatusMessage, BUSINESS_HOURS } from '@/utils/business-hours';
import Logo from './Logo';

const Footer: React.FC = () => {
  const router = useRouter();
  // HYDRATION-SAFE: Use 2025 as fallback, update on client mount
  const [currentYear, setCurrentYear] = useState(2025);
  const [businessStatus, setBusinessStatus] = useState({ message: 'Loading...', color: 'yellow' });
  
  // Handle navigation - scroll to section on homepage, or navigate to homepage then scroll
  const handleNavigation = (section: string) => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      // On homepage, scroll to section
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // On other pages, navigate to homepage with hash
      router.push(`/#${section}`);
    }
  };
  
  // Initialize values on client mount to prevent hydration mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setBusinessStatus(getBusinessStatusMessage());
    
    // Update status every minute
    const interval = setInterval(() => {
      setBusinessStatus(getBusinessStatusMessage());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Subtle Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="#FF6B35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>
      
      {/* Decorative Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-500 to-red-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-yellow-500 to-orange-500 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      {/* Main Content Container */}
      <div className="container-custom mx-auto py-20 relative z-10 max-w-7xl">
        {/* Top Border Accent */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-16"></div>

        {/* Main Grid: Brand + 3 Columns */}
        <div className="grid lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          {/* Brand Column - Large, Warm Presence */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo and Brand Name */}
            <div className="space-y-4">
              <Logo variant="medium" showTagline={true} />
              
              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed">
                GharSe is where real home kitchens become your favorite restaurant. We connect you with trusted home chefs who cook authentic, regional Indian meals fresh from their homes straight to your door.
              </p>
            </div>

            {/* Elegant Rating Badge Cluster */}
            <div className="flex gap-4 pt-2">
              <div className="flex-1 pad-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <p className="text-yellow-400 text-lg font-bold">5.0</p>
                </div>
                <p className="text-xs text-gray-400 font-medium">Rating</p>
              </div>
              <div className="flex-1 pad-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                <p className="text-green-400 text-lg font-bold mb-1">500+</p>
                <p className="text-xs text-gray-400 font-medium">Reviews</p>
              </div>
            </div>
          </div>
          
          {/* Contact Column - Clean, Spacious */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h4 className="text-lg font-bold mb-6 pb-2 border-b border-white/10">
                Contact Us
              </h4>
              <div className="space-y-4">
                <a
                  href={`tel:${restaurantInfo.contact.phone}`}
                  className="group flex items-start gap-4 text-gray-300 hover:text-white transition-all duration-300 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Call Us</p>
                    <p className="font-semibold text-sm break-words">{restaurantInfo.contact.phone}</p>
                  </div>
                </a>
                
                <a
                  href={`mailto:${restaurantInfo.contact.email}`}
                  className="group flex items-start gap-4 text-gray-300 hover:text-white transition-all duration-300 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">
                    <Mail size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Email Us</p>
                    <p className="font-semibold text-sm break-words">{restaurantInfo.contact.email}</p>
                  </div>
                </a>
                
                <div className="group flex items-start gap-4 text-gray-300 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Location</p>
                    <p className="text-sm leading-relaxed">
                      {restaurantInfo.address.street}<br />
                      {restaurantInfo.address.city}, {restaurantInfo.address.state} {restaurantInfo.address.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Hours Column - Structured, Clear */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h4 className="text-lg font-bold mb-6 pb-2 border-b border-white/10 flex items-center gap-2">
                <Clock size={18} />
                Hours
              </h4>
              <div className="space-y-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-center text-gray-300 py-2">
                  <span className="font-medium text-sm">Every Day</span>
                  <span className="font-semibold text-green-400 text-sm">
                    {BUSINESS_HOURS.displayOpen} - {BUSINESS_HOURS.displayClose}
                  </span>
                </div>
                <div className="text-center pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-3">Indian Standard Time (IST)</p>
                </div>
                
                {/* Dynamic Open/Closed Status - Inside Same Box */}
                <div className={`p-3 rounded-xl ${
                  businessStatus.color === 'green'
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                    : businessStatus.color === 'yellow'
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                    : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      businessStatus.color === 'green'
                        ? 'bg-green-400 animate-pulse'
                        : businessStatus.color === 'yellow'
                        ? 'bg-yellow-400 animate-pulse'
                        : 'bg-red-400'
                    }`}></div>
                    <span className={`text-sm font-semibold ${
                      businessStatus.color === 'green'
                        ? 'text-green-400'
                        : businessStatus.color === 'yellow'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {businessStatus.message}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Links Column - Organized, Symmetrical Grid */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h4 className="text-lg font-bold mb-6 pb-2 border-b border-white/10">
                Quick Links
              </h4>
              {/* Two Column Grid for Balanced Layout */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {/* Navigation Links - Left Column */}
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigate</h5>
                  <button
                    onClick={() => handleNavigation('home')}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm w-full text-left"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Home</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('menu')}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm w-full text-left"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Menu</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('about')}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm w-full text-left"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">About</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('contact')}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm w-full text-left"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Contact</span>
                  </button>
                </div>
                
                {/* Legal Links - Right Column */}
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legal</h5>
                  <a
                    href="/legal"
                    className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-orange-500/30 text-sm font-semibold"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span>All Legal Docs</span>
                  </a>
                  <a
                    href="/legal/privacy-policy"
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Privacy</span>
                  </a>
                  <a
                    href="/legal/terms-of-service"
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Terms</span>
                  </a>
                  <a
                    href="/legal/refund-policy"
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Refunds</span>
                  </a>
                  <a
                    href="/legal/referral-terms"
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Referrals</span>
                  </a>
                  <a
                    href="/legal/food-safety"
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">Food Safety</span>
                  </a>
                  <a
                    href="/legal/ip-protection"
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-sm"
                  >
                    <div className="w-1 h-1 bg-orange-500 rounded-full group-hover:scale-150 transition-transform flex-shrink-0"></div>
                    <span className="font-medium">IP Rights</span>
                  </a>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-4 uppercase tracking-wider">We Accept</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex flex-col items-center gap-2 justify-center text-center hover:border-white/20 transition-colors">
                    <CreditCard size={16} className="text-gray-300" />
                    <span className="text-xs font-medium text-gray-300">Cards</span>
                  </div>
                  <div className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex flex-col items-center gap-2 justify-center text-center hover:border-white/20 transition-colors">
                    <IndianRupee size={16} className="text-gray-300" />
                    <span className="text-xs font-medium text-gray-300">Cash</span>
                  </div>
                  <div className="p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex flex-col items-center gap-2 justify-center text-center hover:border-white/20 transition-colors">
                    <Smartphone size={16} className="text-gray-300" />
                    <span className="text-xs font-medium text-gray-300">UPI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent mb-12"></div>
        
        {/* Social Media Section - Centered */}
        <div className="flex flex-col items-center space-y-6">
          {/* Social Media Links */}
          <div className="flex flex-col items-center">
            <p className="text-center text-gray-400 text-sm font-semibold mb-4">Connect With Us</p>
            <div className="flex justify-center gap-4">
              {restaurantInfo.socialMedia?.facebook && (
                <a
                  href={`https://facebook.com/${restaurantInfo.socialMedia.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 hover:from-blue-600 hover:to-blue-700 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/50"
                  aria-label="Facebook"
                >
                  <Facebook size={20} className="text-white" />
                </a>
              )}
              {restaurantInfo.socialMedia?.instagram && (
                <a
                  href={`https://instagram.com/${restaurantInfo.socialMedia.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 hover:from-pink-600 hover:to-orange-600 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-pink-500/50"
                  aria-label="Instagram"
                >
                  <Instagram size={20} className="text-white" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Centered and Symmetrical */}
      <div className="relative bg-gray-800/90 border-t border-gray-700/50">
        <div className="container-custom mx-auto px-6 py-6" style={{ maxWidth: '1400px' }}>
          <div className="flex flex-col items-center gap-6">
            {/* Centered Content Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 flex-wrap">
              {/* Copyright & Operator Structure */}
              <div className="text-center">
                <p className="text-gray-400 text-sm font-medium mb-2">
                  © {currentYear} <span className="text-white font-semibold">GharSe</span>. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mb-1">
                  Operated by <span className="text-gray-300 font-medium">Bantu'S kitchen</span> (Proprietor: Sailaja)
                </p>
                <p className="text-gray-500 text-xs mb-1">
                  FSSAI Reg. No.: <span className="text-gray-300 font-medium">23625028002731</span> (Valid until: 23 June 2027)
                </p>
                <p className="text-gray-400 text-xs mt-2 border-t border-gray-700 pt-2">
                  {restaurantInfo.address.street}
                  {restaurantInfo.address.district && <><br />{restaurantInfo.address.district}</>}
                  <br />
                  {restaurantInfo.address.city}, {restaurantInfo.address.state} - {restaurantInfo.address.zipCode}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Technology by <span className="text-gray-300 font-medium">TechBantu IT Solutions LLC</span>
                </p>
              </div>

              {/* Divider - Hidden on mobile */}
              <div className="hidden sm:block w-px h-6 bg-gray-700"></div>

              {/* Made with Love */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span>Made with</span>
                <Heart size={16} className="text-red-500 fill-red-500" />
                <span>for authentic Indian cuisine lovers</span>
              </div>

              {/* Divider - Hidden on mobile */}
              <div className="hidden sm:block w-px h-6 bg-gray-700"></div>

              {/* Payment Methods - Compact */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">We Accept:</span>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">UPI</div>
                  <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">Cards</div>
                  <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">Cash</div>
                </div>
              </div>
            </div>

            {/* Features Row - Centered */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Leaf size={14} className="text-green-400" />
                <span>Fresh Ingredients</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ChefHat size={14} className="text-orange-400" />
                <span>Traditional Recipes</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Truck size={14} className="text-orange-400" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
