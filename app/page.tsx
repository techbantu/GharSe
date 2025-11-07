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

import React, { useState, useEffect } from 'react';
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
import { CartProvider } from '@/context/CartContext';

/**
 * Home Page Component
 * 
 * State Management:
 * - Cart sidebar visibility
 * - Checkout modal visibility
 * - Scroll animations trigger
 */
const HomePage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Analytics tracking
  useEffect(() => {
    // Track page view
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'home', event: 'page_view' }),
    }).catch(console.error);
  }, []);
  
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
      <LiveChat />
    </div>
  );
};

/**
 * Wrapped Export with Cart Provider
 * 
 * Ensures cart state is available throughout the component tree.
 */
const Home: React.FC = () => {
  return (
    <CartProvider>
      <HomePage />
    </CartProvider>
  );
};

export default Home;
