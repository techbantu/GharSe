/**
 * PWA INSTALLER COMPONENT - Service Worker Registration & Install Prompt
 * 
 * Purpose: Automatically registers service worker and handles PWA install prompt
 * 
 * Features:
 * - Auto-registers service worker on mount
 * - Shows install banner for eligible devices
 * - Handles beforeinstallprompt event
 * - Tracks installation success
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
          setSwRegistered(true);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, refresh for update
                  console.log('📦 New content available, refresh to update');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Listen for controller change (SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
      });
    }

    // Check if already installed
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // Show banner after 30 seconds of browsing
        setTimeout(() => {
          setShowInstallBanner(true);
        }, 30000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('🎉 PWA was installed');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA install prompt outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't render if already installed or no prompt available
  if (isInstalled || !showInstallBanner || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {/* Mobile: Full width banner at bottom above nav */}
      {/* Tablet+: Fixed width card on bottom-right */}
      <div 
        className="fixed z-50 pwa-install-banner"
        style={{
          // Mobile first (< 640px): full width with margins
          bottom: '5rem', // 80px - above mobile nav
          left: '1rem',
          right: '1rem',
        }}
      >
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-2xl p-3 sm:p-4 text-white max-w-[24rem] mx-auto sm:mx-0 sm:ml-auto">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 bg-white/20 rounded-lg sm:rounded-xl p-1.5 sm:p-2">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Install GharSe App
              </h3>
              <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1 leading-snug">
                Get faster access, offline support & push notifications!
              </p>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-2 sm:mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white text-orange-600 font-semibold text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Install Now
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  Not now
                </button>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/60 hover:text-white p-0.5"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pwa-slide-up {
          from {
            opacity: 0;
            transform: translateY(1.25rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .pwa-install-banner {
          animation: pwa-slide-up 0.3s ease-out forwards;
        }
        
        /* sm: 640px+ */
        @media (min-width: 640px) {
          .pwa-install-banner {
            bottom: 1.5rem; /* 24px */
            left: auto;
            right: 1.5rem; /* 24px */
            width: 24rem; /* 384px */
          }
        }
        
        /* md: 768px+ */
        @media (min-width: 768px) {
          .pwa-install-banner {
            bottom: 2rem; /* 32px */
            right: 2rem; /* 32px */
          }
        }
        
        /* lg: 1024px+ */
        @media (min-width: 1024px) {
          .pwa-install-banner {
            bottom: 2.5rem; /* 40px */
            right: 2.5rem; /* 40px */
          }
        }
      `}</style>
    </>
  );
}

