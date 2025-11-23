'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Key, CheckCircle, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 12) strength += 25;
    if (/[a-z]/.test(newPassword)) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/\d/.test(newPassword)) strength += 12.5;
    if (/[@$!%*?&]/.test(newPassword)) strength += 12.5;

    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const getStrengthColor = () => {
    if (passwordStrength < 50) return '#EF4444';
    if (passwordStrength < 75) return '#F59E0B';
    return '#10B981';
  };

  const getStrengthText = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
        }}>
          <AlertCircle size={40} style={{ color: '#ffffff' }} />
        </div>
        
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Invalid Reset Link
        </h3>
        
        <p style={{
          fontSize: '0.9375rem',
          color: '#6B7280',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          This password reset link is invalid or has expired. Please request a new one.
        </p>

        <button
          onClick={() => router.push('/admin/forgot-password')}
          style={{
            padding: '1rem 2rem',
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
        >
          Request New Reset Link
        </button>
      </div>
    );
  }

  return success ? (
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
        Password Reset Successfully!
      </h3>
      
      <p style={{
        fontSize: '0.9375rem',
        color: '#6B7280',
        lineHeight: 1.6,
        marginBottom: '2rem'
      }}>
        Your password has been changed. You can now login with your new password.
      </p>

      <p style={{
        fontSize: '0.875rem',
        color: '#9CA3AF',
        marginBottom: '1.5rem'
      }}>
        Redirecting to login page in 3 seconds...
      </p>

      <button
        onClick={() => router.push('/admin/login')}
        style={{
          padding: '1rem 2rem',
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
        Go to Login Now
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
        {/* New Password */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <Key size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              zIndex: 1
            }} />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 12 characters)"
              required
              minLength={12}
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
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{
                height: '6px',
                backgroundColor: '#E5E7EB',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${passwordStrength}%`,
                  backgroundColor: getStrengthColor(),
                  transition: 'all 0.3s ease'
                }} />
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: getStrengthColor(),
                marginTop: '0.5rem',
                fontWeight: 600
              }}>
                Password strength: {getStrengthText()}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              zIndex: 1
            }} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
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

        {/* Password Requirements */}
        <div style={{
          background: '#F3F4F6',
          padding: '1rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            fontWeight: 600,
            marginBottom: '0.5rem'
          }}>
            Password must contain:
          </p>
          <ul style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            paddingLeft: '1.25rem',
            margin: 0
          }}>
            <li style={{ color: newPassword.length >= 12 ? '#10B981' : '#6B7280' }}>
              At least 12 characters
            </li>
            <li style={{ color: /[a-z]/.test(newPassword) ? '#10B981' : '#6B7280' }}>
              One lowercase letter
            </li>
            <li style={{ color: /[A-Z]/.test(newPassword) ? '#10B981' : '#6B7280' }}>
              One uppercase letter
            </li>
            <li style={{ color: /\d/.test(newPassword) ? '#10B981' : '#6B7280' }}>
              One number
            </li>
            <li style={{ color: /[@$!%*?&]/.test(newPassword) ? '#10B981' : '#6B7280' }}>
              One special character (@$!%*?&)
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading || passwordStrength < 75}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading || passwordStrength < 75
              ? 'linear-gradient(135deg, #D1D5DB, #9CA3AF)'
              : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '1rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: (loading || passwordStrength < 75) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: (loading || passwordStrength < 75) ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
          }}
          onMouseEnter={(e) => {
            if (!loading && passwordStrength >= 75) {
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
              Resetting Password...
            </span>
          ) : 'Reset Password'}
        </button>
      </form>

      {/* Spinning animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default function AdminResetPasswordPage() {
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
            Reset Password
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#6B7280',
            lineHeight: 1.6
          }}>
            Create a new secure password for your admin account
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}

