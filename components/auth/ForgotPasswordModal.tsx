/**
 * FORGOT PASSWORD MODAL
 * 
 * Purpose: Allow users to request a password reset link
 * 
 * Features:
 * - Email input
 * - Send reset link
 * - Toast notifications
 * - Beautiful UI
 */

'use client';

import React, { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);

        // Check if we're in development mode with a direct reset URL
        if (data.development?.resetUrl) {
          setResetUrl(data.development.resetUrl);
          setIsDevelopment(true);
          toast.success(
            'Development Mode - Reset Link Ready! 🔗',
            'Click the link below to reset your password. This only works in development.'
          );
        } else {
        toast.success(
          'Reset Link Sent! 📧',
          'Check your email for a link to reset your password. The link will expire in 1 hour.'
        );
        }
      } else {
        // Email sending failed - still provide development link if available
        if (data.development?.resetUrl) {
          setEmailSent(true);
          setResetUrl(data.development.resetUrl);
          setIsDevelopment(true);
          toast.warning(
            'Email Failed - Development Link Available 🔗',
            'Email sending failed, but you can use the development link below to reset your password.'
          );
        } else {
          setError(data.message || 'Failed to send reset link. Please try again.');
          toast.error('Failed to Send', data.message || 'Please check your email and try again.');
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setEmailSent(false);
    setResetUrl(null);
    setIsDevelopment(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out',
          padding: '16px',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '450px',
            width: '100%',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #dc2626)',
            padding: '24px',
            position: 'relative',
          }}>
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <X size={20} color="white" />
            </button>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'white',
              marginBottom: '8px',
            }}>
              Reset Password
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              {emailSent 
                ? "Check your email for reset instructions"
                : "Enter your email to receive a password reset link"
              }
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>
            {emailSent ? (
              <div>
                <div style={{
                  background: isDevelopment ? '#dbeafe' : '#d1fae5',
                  border: `2px solid ${isDevelopment ? '#3b82f6' : '#10b981'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px',
                }}>
                  <Mail size={24} color={isDevelopment ? '#1d4ed8' : '#059669'} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: isDevelopment ? '#1e40af' : '#065f46', marginBottom: '4px' }}>
                      {isDevelopment ? 'Development Mode - Reset Link Ready!' : 'Email Sent Successfully!'}
                    </div>
                    <div style={{ fontSize: '14px', color: isDevelopment ? '#1e40af' : '#065f46' }}>
                      {isDevelopment ? (
                        <>
                          Your password reset link is ready. Click below to reset your password:
                          <br />
                          <a
                            href={resetUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              marginTop: '8px',
                              padding: '8px 16px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                          >
                            🔗 Reset Password Now
                          </a>
                        </>
                      ) : (
                        <>We've sent a password reset link to <strong>{email}</strong></>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDevelopment ? '#e0f2fe' : '#fef3c7',
                  border: `1px solid ${isDevelopment ? '#0284c7' : '#f59e0b'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: isDevelopment ? '#0c4a6e' : '#92400e',
                }}>
                  {isDevelopment ? (
                    <>
                      <strong>Development Mode:</strong> The reset link above opens directly in your browser. In production, this link would be sent via email.
                    </>
                  ) : (
                    <>
                  <strong>Note:</strong> The reset link will expire in 1 hour. If you don't see the email, check your spam folder.
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleClose();
                    onBackToLogin();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #f97316, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(249, 115, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Email Field */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '8px',
                  }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                    }} size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '44px',
                        paddingRight: '16px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div style={{
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'start',
                  }}>
                    <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '14px', color: '#991b1b' }}>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #f97316, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    marginBottom: '16px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(249, 115, 22, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onBackToLogin();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'white',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f97316';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

