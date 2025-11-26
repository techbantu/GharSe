'use client';

/**
 * MANDATORY LEGAL ACCEPTANCE MODAL
 * Purpose: Blocks site access until user accepts all legal documents
 * Features: Cannot close, tracks IP/user-agent, version detection, full audit trail
 * Shows: Terms, Privacy Policy, Refund Policy, Food Safety Policy
 * Compliance: DPDPA 2023, GDPR, FSSAI, Indian e-commerce laws
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LEGAL_VERSIONS } from '@/lib/legal-compliance';
import { FileText, Shield, RefreshCw, Utensils, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LegalAcceptanceModal() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [acceptedDocs, setAcceptedDocs] = useState({
    terms: false,
    privacy: false,
    refund: false,
    foodSafety: false,
  });

  // Check if current page is admin dashboard
  useEffect(() => {
    const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (isAdminPage) {
      // Don't show legal modal on admin pages
      setIsVisible(false);
      setIsLoading(false);
      return;
    }
    
    checkAcceptanceStatus();
  }, [user?.id]);

  const checkAcceptanceStatus = async () => {
    try {
      // Generate or retrieve session ID
      let sid = localStorage.getItem('legal-session-id');
      if (!sid) {
        sid = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('legal-session-id', sid);
      }
      setSessionId(sid);

      // FALLBACK: First check localStorage for cached acceptance
      const cachedAcceptance = localStorage.getItem('legal-acceptance');
      if (cachedAcceptance) {
        try {
          const cached = JSON.parse(cachedAcceptance);
          // Check if cached acceptance has current versions
          const hasCurrentVersions = 
            cached.versions?.TERMS === LEGAL_VERSIONS.TERMS &&
            cached.versions?.PRIVACY === LEGAL_VERSIONS.PRIVACY &&
            cached.versions?.REFUND === LEGAL_VERSIONS.REFUND &&
            cached.versions?.FOOD_SAFETY === LEGAL_VERSIONS.FOOD_SAFETY;
          
          if (hasCurrentVersions) {
            // Already accepted current versions
            setIsVisible(false);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cached data, continue to API check
          localStorage.removeItem('legal-acceptance');
        }
      }

      // CRITICAL FIX: Always send sessionId to match what was stored in DB
      // Build query params to include both userId (if logged in) AND sessionId
      const params = new URLSearchParams();
      if (user?.id) {
        params.append('userId', user.id);
      }
      params.append('sessionId', sid); // Always include sessionId

      // Check if user has already accepted latest versions
      const response = await fetch(`/api/legal/accept?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasAccepted) {
          setIsVisible(false);
        } else if (data._fallback) {
          // API returned fallback, check localStorage was already done above
          // If we got here, localStorage didn't have valid acceptance
          setIsVisible(true);
        } else {
          setIsVisible(true);
        }
      } else {
        // If error, check if we have localStorage fallback
        // Already checked above, so show modal
        setIsVisible(true);
      }
    } catch (error) {
      console.error('[LEGAL COMPLIANCE] Error checking acceptance status:', error);
      // Show modal if check fails (fail-safe)
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const allDocsAccepted = acceptedDocs.terms && 
                          acceptedDocs.privacy && 
                          acceptedDocs.refund && 
                          acceptedDocs.foodSafety;

  const handleAcceptAll = async () => {
    if (!allDocsAccepted) return;

    setIsAccepting(true);
    try {
      const response = await fetch('/api/legal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          sessionId,
          acceptAll: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // FALLBACK: Store acceptance in localStorage for offline/database-unavailable scenarios
        const legalAcceptance = {
          acceptedAt: new Date().toISOString(),
          versions: LEGAL_VERSIONS,
          sessionId,
          userId: user?.id || null,
          _fallback: data._fallback || false,
        };
        localStorage.setItem('legal-acceptance', JSON.stringify(legalAcceptance));
        
        setIsVisible(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to record acceptance'}`);
      }
    } catch (error) {
      console.error('[LEGAL COMPLIANCE] Error recording acceptance:', error);
      
      // FALLBACK: Store acceptance in localStorage even if API fails
      const legalAcceptance = {
        acceptedAt: new Date().toISOString(),
        versions: LEGAL_VERSIONS,
        sessionId,
        userId: user?.id || null,
        _fallback: true,
      };
      localStorage.setItem('legal-acceptance', JSON.stringify(legalAcceptance));
      
      // Still allow user to proceed
      setIsVisible(false);
    } finally {
      setIsAccepting(false);
    }
  };

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Don't render if already accepted
  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '672px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        margin: '16px',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(to right, #DC2626, #EA580C)',
          color: 'white',
          padding: '24px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'white',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <Image
                src="/images/GharSe.png"
                alt="GharSe Logo"
                width={64}
                height={64}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Business Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Utensils size={28} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Welcome to Bantu&apos;s Kitchen!</h2>
            </div>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, fontStyle: 'italic' }}>
              Doing business as GharSe
            </p>
          </div>

          <p style={{ fontSize: '14px', marginTop: '12px', opacity: 0.9, margin: 0, textAlign: 'center' }}>
            Before you continue, please review and accept our legal policies
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Version Information */}
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '14px', color: '#1E40AF', margin: 0, lineHeight: '1.5' }}>
              <strong>Current Policy Versions:</strong> Terms {LEGAL_VERSIONS.TERMS}, 
              Privacy {LEGAL_VERSIONS.PRIVACY}, Refund {LEGAL_VERSIONS.REFUND}, 
              Food Safety {LEGAL_VERSIONS.FOOD_SAFETY}
            </p>
          </div>

          {/* Important Notice */}
          <div style={{
            backgroundColor: '#FFFBEB',
            borderLeft: '4px solid #F59E0B',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '14px', color: '#92400E', margin: 0 }}>
                <strong>Important:</strong> You must read and accept all policies before accessing our website. 
                This is required by law for data protection and food safety compliance.
              </p>
            </div>
          </div>

          {/* Policy Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {/* Terms of Service */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <input
                type="checkbox"
                checked={acceptedDocs.terms}
                onChange={(e) => setAcceptedDocs(prev => ({ ...prev, terms: e.target.checked }))}
                style={{
                  marginTop: '4px',
                  width: '20px',
                  height: '20px',
                  accentColor: '#DC2626',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FileText size={18} color="#DC2626" />
                  <span style={{ fontWeight: 600, color: '#111827' }}>Terms of Service (v{LEGAL_VERSIONS.TERMS})</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px', marginBottom: '8px' }}>
                  Our terms govern your use of this platform, including order placement, 
                  cancellation policies, and liability limitations.
                </p>
                <Link 
                  href="/legal/terms-of-service" 
                  target="_blank"
                  style={{
                    fontSize: '14px',
                    color: '#DC2626',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Read Terms of Service →
                </Link>
              </div>
            </label>

            {/* Privacy Policy */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <input
                type="checkbox"
                checked={acceptedDocs.privacy}
                onChange={(e) => setAcceptedDocs(prev => ({ ...prev, privacy: e.target.checked }))}
                style={{
                  marginTop: '4px',
                  width: '20px',
                  height: '20px',
                  accentColor: '#DC2626',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Shield size={18} color="#3B82F6" />
                  <span style={{ fontWeight: 600, color: '#111827' }}>Privacy Policy (v{LEGAL_VERSIONS.PRIVACY})</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px', marginBottom: '8px' }}>
                  Learn how we collect, use, and protect your personal data in compliance 
                  with DPDPA 2023 and GDPR.
                </p>
                <Link 
                  href="/legal/privacy-policy" 
                  target="_blank"
                  style={{
                    fontSize: '14px',
                    color: '#DC2626',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Read Privacy Policy →
                </Link>
              </div>
            </label>

            {/* Refund Policy */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <input
                type="checkbox"
                checked={acceptedDocs.refund}
                onChange={(e) => setAcceptedDocs(prev => ({ ...prev, refund: e.target.checked }))}
                style={{
                  marginTop: '4px',
                  width: '20px',
                  height: '20px',
                  accentColor: '#DC2626',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <RefreshCw size={18} color="#10B981" />
                  <span style={{ fontWeight: 600, color: '#111827' }}>Refund & Cancellation Policy (v{LEGAL_VERSIONS.REFUND})</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px', marginBottom: '8px' }}>
                  Understand your rights regarding order cancellations, refunds, and 
                  our grace period modification window.
                </p>
                <Link 
                  href="/legal/refund-policy" 
                  target="_blank"
                  style={{
                    fontSize: '14px',
                    color: '#DC2626',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Read Refund Policy →
                </Link>
              </div>
            </label>

            {/* Food Safety */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <input
                type="checkbox"
                checked={acceptedDocs.foodSafety}
                onChange={(e) => setAcceptedDocs(prev => ({ ...prev, foodSafety: e.target.checked }))}
                style={{
                  marginTop: '4px',
                  width: '20px',
                  height: '20px',
                  accentColor: '#DC2626',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Utensils size={18} color="#8B5CF6" />
                  <span style={{ fontWeight: 600, color: '#111827' }}>Food Safety & Allergen Policy (v{LEGAL_VERSIONS.FOOD_SAFETY})</span>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px', marginBottom: '8px' }}>
                  Critical information about food safety standards, allergen warnings, 
                  and liability for dietary restrictions.
                </p>
                <Link 
                  href="/legal/food-safety" 
                  target="_blank"
                  style={{
                    fontSize: '14px',
                    color: '#DC2626',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Read Food Safety Policy →
                </Link>
              </div>
            </label>
          </div>

          {/* Legal Notice */}
          <div style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '12px',
            color: '#6B7280',
          }}>
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', margin: 0 }}>Legal Notice:</p>
            <ul style={{ marginTop: '4px', paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '4px' }}>Your acceptance will be recorded with timestamp, IP address, and device information</li>
              <li style={{ marginBottom: '4px' }}>This information is stored for legal compliance and audit purposes</li>
              <li style={{ marginBottom: '4px' }}>You will be notified if any policy is updated and may need to re-accept</li>
              <li>By accepting, you acknowledge you have read and understood all policies</li>
            </ul>
          </div>
        </div>

        {/* Footer with Accept Button */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          padding: '24px',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
        }}>
          <button
            onClick={handleAcceptAll}
            disabled={!allDocsAccepted || isAccepting}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '18px',
              transition: 'all 0.2s',
              cursor: allDocsAccepted && !isAccepting ? 'pointer' : 'not-allowed',
              background: allDocsAccepted && !isAccepting
                ? 'linear-gradient(to right, #DC2626, #EA580C)'
                : '#D1D5DB',
              color: allDocsAccepted && !isAccepting ? 'white' : '#9CA3AF',
              border: 'none',
              boxShadow: allDocsAccepted && !isAccepting ? '0 10px 15px -3px rgba(220, 38, 38, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (allDocsAccepted && !isAccepting) {
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(220, 38, 38, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (allDocsAccepted && !isAccepting) {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.3)';
              }
            }}
          >
            {isAccepting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px' }} viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Recording Acceptance...
              </span>
            ) : allDocsAccepted ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} />
                I Accept All Policies - Continue to Website
              </span>
            ) : (
              'Please Accept All Policies to Continue'
            )}
          </button>
          
          {!allDocsAccepted && (
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', marginTop: '12px', margin: '12px 0 0 0' }}>
              You must check all boxes to proceed
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

