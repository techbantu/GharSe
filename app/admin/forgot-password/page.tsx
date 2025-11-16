'use client';

/**
 * ADMIN FORGOT PASSWORD PAGE
 * 
 * Features:
 * - Email-based password reset
 * - Sends reset link to admin email
 * - Secure token generation
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
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

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '3rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={40} style={{ color: 'white' }} />
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#111827',
            marginBottom: '1rem',
          }}>
            Check Your Email! 📧
          </h1>

          <p style={{
            fontSize: '1rem',
            color: '#6B7280',
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}>
            We've sent a password reset link to:
            <br />
            <strong style={{ color: '#111827' }}>{email}</strong>
          </p>

          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#92400E',
              margin: 0,
              lineHeight: 1.5,
            }}>
              💡 <strong>Tip:</strong> The link expires in 1 hour. 
              Check your spam folder if you don't see it.
            </p>
          </div>

          <button
            onClick={() => router.push('/admin/login')}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'linear-gradient(to right, #F97316, #EA580C)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block' }}>
            <Logo />
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 800,
            color: '#111827',
            marginBottom: '0.5rem',
          }}>
            Reset Password 🔑
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#6B7280',
            lineHeight: 1.5,
          }}>
            Enter your admin email and we'll send you a reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }} size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bantuskitchen.com"
                required
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '0.875rem',
                  paddingBottom: '0.875rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem',
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
              <p style={{
                fontSize: '0.875rem',
                color: '#DC2626',
                margin: 0,
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading
                ? '#D1D5DB'
                : 'linear-gradient(to right, #F97316, #EA580C)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              marginBottom: '1rem',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to Login */}
          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'transparent',
              color: '#6B7280',
              border: '2px solid #E5E7EB',
              borderRadius: '0.75rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </form>

        {/* Help Note */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#F3F4F6',
          borderRadius: '0.75rem',
        }}>
          <p style={{
            fontSize: '0.8125rem',
            color: '#6B7280',
            margin: 0,
            lineHeight: 1.5,
          }}>
            💡 <strong>First time admin?</strong> Contact the restaurant owner 
            to get your credentials set up.
          </p>
        </div>
      </div>
    </div>
  );
}

