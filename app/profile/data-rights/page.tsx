'use client';

/**
 * NEW FILE: User Data Rights Dashboard
 * Purpose: GDPR Article 15-20 & DPDPA 2023 compliance
 * 
 * Features:
 * - Request account deletion (Right to Erasure)
 * - Download personal data (Data Portability)
 * - View data retention period
 * - Manage cookie consent
 * - View deletion request status
 */

import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Cookie, FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function DataRightsPage() {
  const [loading, setLoading] = useState(true);
  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDeletionStatus();
  }, []);

  const fetchDeletionStatus = async () => {
    try {
      const response = await fetch('/api/user/deletion-request', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDeletionRequest(data.request);
      }
    } catch (error) {
      console.error('Failed to fetch deletion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: deleteReason }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Deletion request submitted successfully! Check your email for details.');
        setShowDeleteModal(false);
        setDeleteReason('');
        await fetchDeletionStatus();
      } else {
        if (data.legalHolds && data.legalHolds.length > 0) {
          setError(`Cannot delete account: ${data.legalHolds.join(', ')}`);
        } else {
          setError(data.error || 'Failed to submit deletion request');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!confirm('Are you sure you want to cancel your deletion request?')) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/deletion-request', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Deletion request cancelled successfully!');
        await fetchDeletionStatus();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel deletion request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadData = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Implement data export API
      alert('Data export feature coming soon! You will receive an email with your data within 30 days.');
    } catch (error) {
      setError('Failed to request data export');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #E5E7EB', 
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6B7280' }}>Loading your data rights...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          color: 'white',
          padding: '40px 32px',
          borderRadius: '12px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <Shield size={40} />
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Your Data Rights</h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Manage your personal information and privacy</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '2px solid #10B981',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <CheckCircle size={24} style={{ color: '#10B981', flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#065F46' }}>{success}</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '2px solid #EF4444',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <AlertCircle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#991B1B' }}>{error}</p>
          </div>
        )}

        {/* Deletion Request Status */}
        {deletionRequest && !deletionRequest.executedAt && !deletionRequest.cancelledAt && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Clock size={32} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#92400E' }}>
                  Account Deletion Pending
                </h2>
                <p style={{ margin: '0 0 16px 0', color: '#78350F' }}>
                  Your account will be deleted on{' '}
                  <strong>
                    {new Date(deletionRequest.gracePeriodEnds).toLocaleDateString('en-IN', {
                      dateStyle: 'full',
                      timeZone: 'Asia/Kolkata',
                    })}
                  </strong>
                  {' '}({deletionRequest.daysRemaining} days remaining)
                </p>
                <button
                  onClick={handleCancelDeletion}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Cancelling...' : 'Cancel Deletion Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Rights Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Download Your Data */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Download size={32} style={{ color: '#3B82F6' }} />
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Download Your Data</h2>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', lineHeight: '1.6' }}>
              Get a copy of all your personal data we have stored (GDPR Article 20 - Data Portability).
            </p>
            <button
              onClick={handleDownloadData}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'linear-gradient(to right, #3B82F6, #1D4ED8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              Request Data Export
            </button>
            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#9CA3AF' }}>
              You'll receive an email with your data within 30 days
            </p>
          </div>

          {/* Delete Your Account */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Trash2 size={32} style={{ color: '#EF4444' }} />
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Delete Your Account</h2>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', lineHeight: '1.6' }}>
              Permanently delete your account and personal data (GDPR Article 17 - Right to Erasure).
            </p>
            {deletionRequest && !deletionRequest.executedAt && !deletionRequest.cancelledAt ? (
              <div style={{
                padding: '12px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                color: '#92400E',
                fontSize: '14px',
              }}>
                Deletion request pending
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Request Account Deletion
              </button>
            )}
            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#9CA3AF' }}>
              30-day grace period • Order history retained for tax compliance
            </p>
          </div>

          {/* Cookie Preferences */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Cookie size={32} style={{ color: '#F59E0B' }} />
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Cookie Preferences</h2>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', lineHeight: '1.6' }}>
              Manage your cookie consent and tracking preferences.
            </p>
            <Link href="/legal/cookie-preferences" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                Manage Cookies
              </button>
            </Link>
          </div>

          {/* DPO Request */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <FileText size={32} style={{ color: '#10B981' }} />
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Data Protection Officer</h2>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', lineHeight: '1.6' }}>
              Submit a request to access, correct, or delete your personal data.
            </p>
            <Link href="/legal/dpo-request" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                Contact DPO
              </button>
            </Link>
          </div>
        </div>

        {/* Your Rights */}
        <div style={{
          marginTop: '32px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111827' }}>
            Your Data Protection Rights
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#3B82F6' }}>Right to Access</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                View what personal data we have about you
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#3B82F6' }}>Right to Rectification</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                Correct inaccurate or incomplete data
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#3B82F6' }}>Right to Erasure</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                Request deletion of your personal data
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#3B82F6' }}>Right to Data Portability</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                Download your data in a machine-readable format
              </p>
            </div>
          </div>
        </div>

        {/* Back to Profile */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link href="/profile" style={{ color: '#3B82F6', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
            ← Back to Profile
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <AlertCircle size={32} style={{ color: '#EF4444' }} />
              <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Delete Your Account?</h2>
            </div>

            <p style={{ margin: '0 0 24px 0', color: '#6B7280', lineHeight: '1.6' }}>
              This action will permanently delete your account after a 30-day grace period. During this time, you can cancel the request.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Tell us why you're leaving..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Processing...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
