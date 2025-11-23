'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFF5F0 0%, #FFF0E6 50%, #FFE8D6 100%)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '2rem',
        padding: '3rem',
        maxWidth: '28rem',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo size={60} />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #DC2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Forgot Password
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#6B7280',
            lineHeight: 1.6
          }}>
            {success 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        {success ? (
          // Success State
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle size={40} style={{ color: '#ffffff' }} />
            </div>
            
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Email Sent!
            </h3>
            
            <p style={{
              fontSize: '0.9375rem',
              color: '#6B7280',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>
              If an admin account exists with <strong>{email}</strong>, you will receive a password reset link within a few minutes.
            </p>

            <div style={{
              background: '#FEF3C7',
              borderLeft: '4px solid #F59E0B',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400E',
                margin: 0
              }}>
                <strong>⏰ Link expires in 1 hour</strong><br />
                Check your spam folder if you don't see it in a few minutes.
              </p>
            </div>

            <button
              onClick={() => router.push('/admin/login')}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.25)';
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          // Form State
          <>
            {error && (
              <div style={{
                background: '#FEE2E2',
                borderLeft: '4px solid #EF4444',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#991B1B',
                  margin: 0
                }}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Admin Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    zIndex: 1
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gharse.app"
                    required
                    style={{
                      width: '100%',
                      paddingLeft: '3.25rem',
                      paddingRight: '1rem',
                      paddingTop: '1rem',
                      paddingBottom: '1rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '1rem',
                      fontSize: '0.9375rem',
                      color: '#111827',
                      backgroundColor: '#FAFAFA',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F97316';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading
                    ? 'linear-gradient(135deg, #FCA5A5, #F87171)'
                    : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                  marginBottom: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.25)';
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid #ffffff40',
                      borderTop: '3px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Sending Email...
                  </span>
                ) : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/admin/login')}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'transparent',
                  color: '#6B7280',
                  border: '2px solid #E5E7EB',
                  borderRadius: '1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ArrowLeft size={20} />
                Back to Login
              </button>
            </form>
          </>
        )}
      </div>

      {/* Spinning animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
