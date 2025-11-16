'use client';

/**
 * COOKIE CONSENT BANNER
 * Purpose: GDPR/DPDPA compliant cookie consent with granular preferences
 * Features: Essential, Analytics, Marketing tracking; Database storage; DNT respect
 * Compliance: GDPR Article 7, DPDPA 2023, ePrivacy Directive
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Shield, X } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true (required)
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    checkCookieConsent();
    checkDoNotTrack();
  }, []);

  const checkCookieConsent = () => {
    // Check if user has already set preferences
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  };

  const checkDoNotTrack = () => {
    // Respect Do Not Track browser setting
    const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      // Auto-reject non-essential cookies if DNT is enabled
      setPreferences({
        essential: true,
        analytics: false,
        marketing: false,
      });
    }
  };

  const handleAcceptAll = async () => {
    const allPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    await savePreferences(allPreferences);
  };

  const handleRejectAll = async () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    await savePreferences(essentialOnly);
  };

  const handleSavePreferences = async () => {
    await savePreferences(preferences);
  };

  const savePreferences = async (prefs: CookiePreferences) => {
    try {
      // Generate session ID if not exists
      let sessionId = localStorage.getItem('legal-session-id');
      if (!sessionId) {
        sessionId = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('legal-session-id', sessionId);
      }

      // Save to local storage
      localStorage.setItem('cookie-consent', JSON.stringify(prefs));

      // Save to database
      const response = await fetch('/api/legal/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          preferences: prefs,
        }),
      });

      if (response.ok) {
        setIsVisible(false);
        
        // Apply preferences to analytics/marketing scripts
        if (prefs.analytics) {
          enableAnalytics();
        }
        if (prefs.marketing) {
          enableMarketing();
        }
      } else {
        console.error('Failed to save cookie preferences');
      }
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
    }
  };

  const enableAnalytics = () => {
    // Enable Google Analytics or other analytics
    console.log('[COOKIE CONSENT] Analytics enabled');
    // TODO: Initialize analytics scripts
  };

  const enableMarketing = () => {
    // Enable marketing cookies (Facebook Pixel, Google Ads, etc.)
    console.log('[COOKIE CONSENT] Marketing enabled');
    // TODO: Initialize marketing scripts
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9998,
      backgroundColor: 'white',
      boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)',
      borderTop: '2px solid #E5E7EB',
      animation: 'slide-up 0.3s ease-out'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px'
      }}>
        {!showDetails ? (
          // Simple Banner View
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '16px',
            justifyContent: 'space-between'
          }}>
            <div style={{ flex: 1, width: '100%' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Cookie size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
                We Value Your Privacy
              </h3>
              <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.5' }}>
                We use cookies to improve your experience, analyze traffic, and personalize content. 
                You can customize your preferences or accept all cookies.{' '}
                <Link href="/legal/cookie-preferences" style={{
                  color: '#DC2626',
                  textDecoration: 'underline'
                }}>
                  Learn more
                </Link>
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              width: '100%',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleRejectAll}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
              >
                Reject All
              </button>
              <button
                onClick={() => setShowDetails(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Customize
              </button>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: '8px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  background: 'linear-gradient(to right, #DC2626, #EA580C)',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.2)'}
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed Preferences View
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Shield size={20} style={{ color: '#DC2626' }} />
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  color: '#6B7280',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Essential Cookies */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.essential}
                  disabled
                  style={{
                    marginTop: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'not-allowed'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Essential Cookies</span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: '#E5E7EB',
                      color: '#374151',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>Required</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#4B5563', marginTop: '4px', lineHeight: '1.5' }}>
                    Necessary for the website to function. These cookies enable basic features like 
                    authentication, security, and session management. Cannot be disabled.
                  </p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  style={{
                    marginTop: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>Analytics Cookies</div>
                  <p style={{ fontSize: '14px', color: '#4B5563', marginTop: '4px', lineHeight: '1.5' }}>
                    Help us understand how visitors interact with our website by collecting and 
                    reporting information anonymously. Used to improve website performance.
                  </p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  style={{
                    marginTop: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>Marketing Cookies</div>
                  <p style={{ fontSize: '14px', color: '#4B5563', marginTop: '4px', lineHeight: '1.5' }}>
                    Track your activity across websites to deliver personalized ads. We share this 
                    information with third-party advertising partners.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #E5E7EB',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <Link 
                href="/legal/privacy-policy" 
                target="_blank"
                style={{
                  fontSize: '14px',
                  color: '#DC2626',
                  textDecoration: 'underline'
                }}
              >
                View Privacy Policy
              </Link>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleRejectAll}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  style={{
                    padding: '8px 24px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'white',
                    background: 'linear-gradient(to right, #DC2626, #EA580C)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
                    transition: 'box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.2)'}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

