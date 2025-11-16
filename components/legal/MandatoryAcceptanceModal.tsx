/**
 * NEW FILE: Mandatory Legal Acceptance Modal
 * Purpose: Blocks site access until user accepts all mandatory legal documents
 * Compliance: DPDPA 2023 § 7 (Consent), GDPR Art. 7 (Consent)
 * 
 * Features:
 * - Cannot be closed without accepting
 * - Tracks IP, user agent, timestamp for audit trail
 * - Detects version changes and requires re-acceptance
 * - Shows preview of each document
 * - Links to full legal pages
 * 
 * This modal creates a "grenade-proof" legal fortress where no user can proceed
 * without explicitly accepting the latest versions of all legal documents.
 */

'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Shield, RefreshCw, Utensils, CheckCircle } from 'lucide-react';
import {
  MANDATORY_DOCUMENTS,
  getLegalDocumentTitle,
  getLegalDocumentUrl,
  type LegalDocumentType,
} from '@/lib/legal-compliance';

interface LegalAcceptanceModalProps {
  userId?: string | null;
  onAccepted?: () => void;
}

export default function LegalAcceptanceModal({ userId, onAccepted }: LegalAcceptanceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [acceptedDocs, setAcceptedDocs] = useState<Set<LegalDocumentType>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has accepted all documents
  useEffect(() => {
    async function checkAcceptance() {
      try {
        const response = await fetch(`/api/legal/accept?userId=${userId || ''}`);
        const data = await response.json();

        if (!data.hasAccepted) {
          setIsOpen(true); // Show modal if not accepted
        }
      } catch (error) {
        console.error('[Legal Acceptance] Error checking status:', error);
        setIsOpen(true); // Fail-safe: show modal if check fails
      } finally {
        setIsChecking(false);
      }
    }

    checkAcceptance();
  }, [userId]);

  const allAccepted = MANDATORY_DOCUMENTS.every((doc) => acceptedDocs.has(doc));

  const handleToggleDocument = (docType: LegalDocumentType) => {
    const newAccepted = new Set(acceptedDocs);
    if (newAccepted.has(docType)) {
      newAccepted.delete(docType);
    } else {
      newAccepted.add(docType);
    }
    setAcceptedDocs(newAccepted);
  };

  const handleAcceptAll = async () => {
    if (!allAccepted) {
      setError('Please accept all required documents to continue');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/legal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          documentTypes: Array.from(acceptedDocs),
          acceptMethod: 'MODAL',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record acceptance');
      }

      setIsOpen(false);
      onAccepted?.();
    } catch (error) {
      console.error('[Legal Acceptance] Error:', error);
      setError('Failed to record your acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything while checking or if modal should be closed
  if (isChecking || !isOpen) {
    return null;
  }

  const iconMap: Record<LegalDocumentType, React.ReactNode> = {
    TERMS: <FileText size={20} className="text-orange-500" />,
    PRIVACY: <Shield size={20} className="text-blue-500" />,
    REFUND: <RefreshCw size={20} className="text-green-500" />,
    FOOD_SAFETY: <Utensils size={20} className="text-purple-500" />,
    IP_PROTECTION: <Shield size={20} className="text-red-500" />,
    REFERRAL_TERMS: <FileText size={20} className="text-yellow-500" />,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            padding: '1.5rem',
            color: 'white',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Legal Documents Acceptance Required
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.95 }}>
            Before you continue, please review and accept our legal documents. This ensures transparency
            and protects your rights.
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '1.5rem',
            maxHeight: 'calc(90vh - 250px)',
            overflowY: 'auto',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
            We're required by law (DPDPA 2023) to obtain your explicit consent before processing
            your data. Please review each document and check the boxes to proceed.
          </p>

          {/* Document List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MANDATORY_DOCUMENTS.map((docType) => {
              const isAccepted = acceptedDocs.has(docType);
              const title = getLegalDocumentTitle(docType);
              const url = getLegalDocumentUrl(docType);

              return (
                <div
                  key={docType}
                  style={{
                    border: `2px solid ${isAccepted ? '#F97316' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isAccepted ? '#FFF7ED' : 'white',
                  }}
                  onClick={() => handleToggleDocument(docType)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    {/* Checkbox */}
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${isAccepted ? '#F97316' : '#D1D5DB'}`,
                        backgroundColor: isAccepted ? '#F97316' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isAccepted && <CheckCircle size={16} color="white" />}
                    </div>

                    {/* Icon */}
                    <div style={{ flexShrink: 0 }}>{iconMap[docType]}</div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.875rem',
                          color: '#F97316',
                          textDecoration: 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read full document →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#FEE2E2',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Info Box */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#6B7280',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>What we track:</p>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              <li>Your acceptance timestamp</li>
              <li>IP address (for fraud prevention)</li>
              <li>Browser/device info (for security)</li>
            </ul>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
              Your data is protected per DPDPA 2023 and GDPR. You can withdraw consent anytime
              from your profile.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {acceptedDocs.size} of {MANDATORY_DOCUMENTS.length} documents accepted
          </p>

          <button
            onClick={handleAcceptAll}
            disabled={!allAccepted || isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: allAccepted && !isSubmitting ? '#F97316' : '#D1D5DB',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
              border: 'none',
              cursor: allAccepted && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Processing...' : 'Accept & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

