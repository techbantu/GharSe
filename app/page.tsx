/**
 * NEW FILE: Main Page - Complete Landing and Ordering Experience
 * 
 * Purpose: Orchestrates all components to create a seamless customer journey
 * from landing to order placement. Manages cart and checkout modals.
 * 
 * Architecture: Client-side rendered with state management for modals and
 * smooth user interactions.
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MenuSection from '@/components/MenuSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import FooterSimple from '@/components/FooterSimple';
import CartSidebar from '@/components/CartSidebar';
import CheckoutModal from '@/components/CheckoutModal';
import LiveChat from '@/components/LiveChat';
import AdvancedSearch from '@/components/AdvancedSearch';
// CartProvider is now in root layout

/**
 * Home Page Component
 * 
 * State Management:
 * - Cart sidebar visibility
 * - Checkout modal visibility
 * - Scroll animations trigger
 */
const HomePageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  // Check if we should open cart from URL parameter (from reorder)
  useEffect(() => {
    const openCart = searchParams.get('openCart');
    if (openCart === 'true') {
      setIsCartOpen(true);
      setIsChatMinimized(true);
    }
  }, [searchParams]);
  
  // Analytics tracking
  useEffect(() => {
    // Track page view
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'home', event: 'page_view' }),
    }).catch(console.error);
    
    // Listen for custom event from chat to open cart
    const handleOpenCart = () => {
      setIsCartOpen(true);
      setIsChatMinimized(true); // GENIUS: Auto-minimize chat when cart opens
    };
    
    window.addEventListener('openCart', handleOpenCart);
    
    return () => {
      window.removeEventListener('openCart', handleOpenCart);
    };
  }, []);
  
  // Handle hash navigation (e.g., from footer links on other pages)
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        // Wait for page to fully render
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };
    
    // Handle initial hash if present
    handleHashNavigation();
    
    // Handle hash changes
    window.addEventListener('hashchange', handleHashNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);
  
  // Listen for cart close to restore chat
  useEffect(() => {
    if (!isCartOpen && isChatMinimized) {
      // Slight delay to avoid jarring transition
      setTimeout(() => {
        setIsChatMinimized(false);
      }, 300);
    }
  }, [isCartOpen, isChatMinimized]);
  
  const handleOrderNowClick = () => {
    // Track CTA click
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'cta_click', data: { cta: 'order_now' } }),
    }).catch(console.error);
    
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handleCheckoutClick = () => {
    // Track checkout initiation
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'checkout_initiated' }),
    }).catch(console.error);
    
    setIsCheckoutOpen(true);
  };
  
  const handleItemSelect = (item: any) => {
    // Track item selection
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'item_selected', data: { itemId: item.id, itemName: item.name } }),
    }).catch(console.error);
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <Header 
        onCartClick={() => setIsCartOpen(true)}
      />
      
      {/* Advanced Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-3xl mx-4 bg-white rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowSearch(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              ×
            </button>
            <AdvancedSearch 
              onItemSelect={handleItemSelect}
              showFilters={true}
            />
          </div>
        </div>
      )}
      
      {/* Main Content Sections */}
      <main>
        <Hero onOrderNowClick={handleOrderNowClick} />
        <MenuSection />
        <AboutSection />
        <ContactSection />
      </main>
      
      {/* Footer */}
      <FooterSimple />
      
      {/* Overlays and Modals */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckoutClick}
      />
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
      
      {/* Live Chat Support */}
      <LiveChat 
        minimized={isChatMinimized}
        onMinimize={() => setIsChatMinimized(true)}
        onRestore={() => setIsChatMinimized(false)}
      />
    </div>
  );
};

/**
 * Wrapped Export with Cart Provider
 * 
 * Ensures cart state is available throughout the component tree.
 */
// Export HomePage directly (CartProvider is now in root layout)
// Wrap in Suspense for useSearchParams (Next.js 16 requirement)
const HomePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
};

export default HomePage;
