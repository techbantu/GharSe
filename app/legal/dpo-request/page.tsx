'use client';

/**
 * NEW FILE: Public DPO Request Form
 * Purpose: Allow users to submit data protection requests
 * Compliance: DPDPA 2023 § 12(2), GDPR Article 15
 * 
 * Request Types:
 * - Data Access: See what data we have about you
 * - Data Deletion: Delete your personal data
 * - Data Correction: Correct inaccurate data
 * - Consent Withdrawal: Withdraw consent for processing
 */

import { useState } from 'react';
import { Shield, Mail, Phone, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DPORequestPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    requestType: 'DATA_ACCESS',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    referenceNumber?: string;
    dueDate?: string;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/legal/dpo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          referenceNumber: data.referenceNumber,
          dueDate: data.dueDate,
        });

        // Reset form
        setFormData({
          email: '',
          phone: '',
          requestType: 'DATA_ACCESS',
          description: '',
        });
      } else {
        setSubmitResult({
          success: false,
          error: data.error || 'Failed to submit request',
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        error: 'Network error. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Data Protection Officer</h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Bantu's Kitchen (GharSe)</p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6' }}>
            Submit a request to access, correct, or delete your personal data.
            We will respond within <strong>30 days</strong> as required by law.
          </p>
        </div>

        {/* Success Message */}
        {submitResult?.success && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '2px solid #10B981',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <CheckCircle size={32} style={{ color: '#10B981', flexShrink: 0 }} />
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#065F46' }}>
                  Request Submitted Successfully!
                </h2>
                <p style={{ margin: '0 0 16px 0', color: '#047857' }}>
                  Your request has been received and logged. We will respond within 30 days.
                </p>
                <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#065F46' }}>
                    <strong>Reference Number:</strong> #{submitResult.referenceNumber}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                    Save this reference number to track your request status.
                  </p>
                </div>
                <p style={{ marginTop: '16px', fontSize: '14px', color: '#047857' }}>
                  Check your email for an acknowledgment within 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitResult?.error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '2px solid #EF4444',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <AlertCircle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#991B1B' }}>{submitResult.error}</p>
          </div>
        )}

        {/* Request Form */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111827' }}>
            Submit a Request
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151',
              }}>
                <Mail size={18} style={{ color: '#3B82F6' }} />
                Email Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
                We'll send confirmation and updates to this email
              </p>
            </div>

            {/* Phone (Optional) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151',
              }}>
                <Phone size={18} style={{ color: '#3B82F6' }} />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Request Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151',
              }}>
                <FileText size={18} style={{ color: '#3B82F6' }} />
                Request Type <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                required
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                }}
              >
                <option value="DATA_ACCESS">Data Access - See what data we have about you</option>
                <option value="DATA_DELETION">Data Deletion - Delete your personal data</option>
                <option value="DATA_CORRECTION">Data Correction - Correct inaccurate data</option>
                <option value="CONSENT_WITHDRAWAL">Consent Withdrawal - Withdraw consent for processing</option>
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#374151',
              }}>
                Description <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe your request in detail (minimum 20 characters)"
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
                {formData.description.length} / 20 minimum characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || formData.description.length < 20}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(to right, #3B82F6, #1D4ED8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: isSubmitting || formData.description.length < 20 ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || formData.description.length < 20 ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Information Box */}
        <div style={{
          marginTop: '32px',
          backgroundColor: '#F0F9FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1E40AF' }}>
            Your Rights Under DPDPA 2023
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1E3A8A', lineHeight: '1.8' }}>
            <li><strong>Right to Access:</strong> View what personal data we have about you</li>
            <li><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Right to Withdraw Consent:</strong> Stop data processing you previously consented to</li>
          </ul>
          <p style={{ margin: '16px 0 0 0', fontSize: '14px', color: '#1E40AF' }}>
            <strong>Response Time:</strong> We will respond within 30 days as required by the Digital Personal Data Protection Act 2023.
          </p>
        </div>

        {/* Contact Box */}
        <div style={{
          marginTop: '24px',
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>
            Contact Data Protection Officer
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={20} style={{ color: '#3B82F6' }} />
              <a href="mailto:dpo@gharse.app" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                dpo@gharse.app
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={20} style={{ color: '#3B82F6' }} />
              <a href="tel:+919010460964" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                +91 90104 60964
              </a>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              color: '#3B82F6',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

