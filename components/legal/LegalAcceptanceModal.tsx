/**
 * NEW FILE: Legal Acceptance Modal Component
 * Purpose: Mandatory acceptance of all legal documents on first login
 * Design: Premium, readable UI with scrollable document previews
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// CSS styles for hover effects
const modalStyles = `
  .doc-link {
    font-size: 14px;
    color: #FF6B35;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .doc-link:hover {
    text-decoration: underline;
  }

  .accept-button {
    padding: 12px 32px;
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    background-color: #FF6B35;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .accept-button:hover:not(:disabled) {
    background-color: #E85A2B;
  }

  .accept-button:disabled {
    background-color: #D1D5DB;
    cursor: not-allowed;
  }
`;

interface LegalDocument {
  type: string;
  title: string;
  url: string;
  version: string;
}

const LEGAL_DOCUMENTS: LegalDocument[] = [
  { type: 'privacy', title: 'Privacy Policy', url: '/legal/privacy-policy', version: '1.0' },
  { type: 'terms', title: 'Terms of Service', url: '/legal/terms-of-service', version: '1.0' },
  { type: 'refund', title: 'Refund Policy', url: '/legal/refund-policy', version: '1.0' },
  { type: 'referral', title: 'Referral Terms', url: '/legal/referral-terms', version: '1.0' },
  { type: 'food_safety', title: 'Food Safety', url: '/legal/food-safety', version: '1.0' },
  { type: 'ip_protection', title: 'IP Protection', url: '/legal/ip-protection', version: '1.0' },
];

export default function LegalAcceptanceModal() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [allAccepted, setAllAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has accepted all current legal documents
    if (user) {
      checkLegalAcceptance();
    }
  }, [user]);

  useEffect(() => {
    // Check if all documents are accepted
    const allChecked = LEGAL_DOCUMENTS.every(doc => accepted[doc.type]);
    setAllAccepted(allChecked);
  }, [accepted]);

  const checkLegalAcceptance = async () => {
    try {
      const response = await fetch('/api/legal/check-acceptance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.allAccepted) {
          setShow(true);
        }
      }
    } catch (error) {
      console.error('Failed to check legal acceptance:', error);
    }
  };

  const handleAccept = async () => {
    if (!allAccepted) return;

    setLoading(true);

    try {
      const response = await fetch('/api/legal/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          documents: LEGAL_DOCUMENTS.map(doc => ({
            type: doc.type,
            version: doc.version,
          })),
        }),
      });

      if (response.ok) {
        setShow(false);
      } else {
        alert('Failed to record acceptance. Please try again.');
      }
    } catch (error) {
      console.error('Failed to accept legal documents:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px',
    }}>
      <style dangerouslySetInnerHTML={{ __html: modalStyles }} />
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '12px',
          }}>
            Legal Documents Acceptance Required
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6B7280',
            lineHeight: '24px',
          }}>
            Before using Bantu's Kitchen, please review and accept the following legal documents. These protect both you and us.
          </p>
        </div>

        {/* Document List */}
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          flex: 1,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {LEGAL_DOCUMENTS.map(doc => (
              <div key={doc.type} style={{
                padding: '20px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    id={`legal-${doc.type}`}
                    checked={accepted[doc.type] || false}
                    onChange={(e) => setAccepted(prev => ({
                      ...prev,
                      [doc.type]: e.target.checked,
                    }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginTop: '2px',
                      cursor: 'pointer',
                      accentColor: '#FF6B35',
                    }}
                  />

                  {/* Document Info */}
                  <div style={{ flex: 1 }}>
                    <label htmlFor={`legal-${doc.type}`} style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#111827',
                      cursor: 'pointer',
                      display: 'block',
                      marginBottom: '8px',
                    }}>
                      {doc.title} (v{doc.version})
                    </label>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-link"
                    >
                      Read Full Document →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Box */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: '8px',
          }}>
            <p style={{
              fontSize: '14px',
              color: '#9A3412',
              lineHeight: '22px',
              margin: 0,
            }}>
              <strong>Important:</strong> By checking these boxes, you confirm that you have read, understood, and agree to be bound by all these legal documents. You must be 18 years or older to use this platform.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '32px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}>
          <button
            onClick={handleAccept}
            disabled={!allAccepted || loading}
            className="accept-button"
            style={{
              opacity: loading ? 0.7 : 1,
              backgroundColor: allAccepted ? '#FF6B35' : '#D1D5DB',
              cursor: allAccepted && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Processing...' : 'I Accept All Terms'}
          </button>
        </div>
      </div>
    </div>
  );
}

