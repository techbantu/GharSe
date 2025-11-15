/**
 * RESET PASSWORD PAGE
 * 
 * Purpose: Allow users to set a new password using the reset token from email
 * 
 * Features:
 * - Token validation
 * - New password form
 * - Password strength indicator
 * - Success/error handling
 * - Redirect to login after success
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token');
      return;
    }
    setTokenValid(true);
  }, [token]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;

    const levels = [
      { strength: 0, label: 'Very Weak', color: '#dc2626' },
      { strength: 1, label: 'Weak', color: '#f97316' },
      { strength: 2, label: 'Fair', color: '#fb923c' },
      { strength: 3, label: 'Good', color: '#84cc16' },
      { strength: 4, label: 'Strong', color: '#22c55e' },
      { strength: 5, label: 'Very Strong', color: '#10b981' },
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success(
          'Password Changed Successfully! 🎉',
          'You can now login with your new password.'
        );
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password. The link may have expired.');
        toast.error('Reset Failed', data.error || 'Please request a new reset link.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred. Please try again.');
      toast.error('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}>
          <XCircle size={64} style={{ color: '#dc2626', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1f2937', marginBottom: '16px' }}>
            Invalid Reset Link
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', lineHeight: 1.6 }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #f97316, #dc2626)',
              color: 'white',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}>
          <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1f2937', marginBottom: '16px' }}>
            Password Changed! 🎉
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', lineHeight: 1.6 }}>
            Your password has been successfully updated. You can now login with your new password.
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
            Redirecting to homepage in 3 seconds...
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #f97316, #dc2626)',
              color: 'white',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            Go to Homepage Now
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
      padding: '16px',
    }}>
      <style>{`
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

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #f97316, #dc2626)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Lock size={32} style={{ color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>
            Reset Your Password
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px',
            }}>
              New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '48px',
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
                placeholder="Enter new password (min 8 characters)"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  color: '#9ca3af',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ 
                  height: '4px', 
                  background: '#e5e7eb', 
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    background: passwordStrength.color,
                    transition: 'all 0.3s',
                  }} />
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  color: passwordStrength.color,
                  fontWeight: 600,
                }}>
                  Strength: {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px',
            }}>
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }} size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '48px',
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
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  color: '#9ca3af',
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <AlertCircle style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} size={20} />
              <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #f97316, #dc2626)',
              color: 'white',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              marginBottom: '16px',
            }}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          {/* Back to Home */}
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#6b7280',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
            }}
          >
            Back to Homepage
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

