/**
 * REGISTER MODAL
 * 
 * Purpose: Allow users to create a new account
 * 
 * Features:
 * - Name, email, phone, password fields
 * - Optional referral code
 * - Real-time validation
 * - Password strength indicator
 * - Error handling
 * - Switch to login
 */

'use client';

import React, { useState } from 'react';
import { X, User, Mail, Phone, Lock, Tag, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referredBy: '',
  });
  const [termsAccepted, setTermsAccepted] = useState({
    termsOfService: false,
    privacyPolicy: false,
    refundPolicy: false,
    foodSafety: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] || 'Too Short';
  const passwordStrengthColor = ['red', 'orange', 'yellow', 'green'][passwordStrength - 1] || 'gray';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password strength
    if (passwordStrength < 4) {
      setError('Password must contain at least 8 characters, including uppercase, lowercase, and numbers');
      return;
    }

    // Validate terms acceptance
    const allTermsAccepted = Object.values(termsAccepted).every(accepted => accepted);
    if (!allTermsAccepted) {
      setError('Please accept all terms and conditions to create your account');
      return;
    }

    setIsLoading(true);

    const registrationData = {
      ...formData,
      termsAccepted: Object.values(termsAccepted).every(accepted => accepted),
    };

    const result = await register(registrationData);

    if (result.success) {
      onClose();
      
      // Show beautiful success toast
      toast.success(
        'Account Created Successfully! 🎉',
        'A verification email has been sent to your inbox. Please check your email and click the verification link to activate your account.'
      );
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        referredBy: '',
      });
      setTermsAccepted({
        termsOfService: false,
        privacyPolicy: false,
        refundPolicy: false,
        foodSafety: false,
      });
    } else {
      setError(result.error || 'Registration failed. Please try again.');
      toast.error('Registration Failed', result.error || 'Please check your information and try again.');
    }

    setIsLoading(false);
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
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      >
        <div 
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '448px',
            width: '100%',
            marginTop: '32px',
            marginBottom: '32px',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #f97316, #dc2626)',
            padding: '24px',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: 0,
              }}>Create Account</h2>
              <button
                onClick={onClose}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              marginTop: '4px',
              marginBottom: 0,
            }}>
              Join us and get exclusive deals!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }} size={20} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
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
                  placeholder="Ravi Kumar"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
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
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}>
                Phone Number *
              </label>
              <div style={{ display: 'flex' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  background: '#f3f4f6',
                  border: '2px solid #e5e7eb',
                  borderRight: 'none',
                  borderRadius: '12px 0 0 12px',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '15px',
                }}>
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').substring(0, 10);
                    setFormData({ ...formData, phone: digits });
                  }}
                  style={{
                    flex: 1,
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '2px solid #e5e7eb',
                    borderLeft: 'none',
                    borderRadius: '0 12px 12px 0',
                    fontSize: '15px',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#f97316';
                    const prev = e.currentTarget.previousElementSibling as HTMLElement;
                    if (prev) prev.style.borderColor = '#f97316';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    const prev = e.currentTarget.previousElementSibling as HTMLElement;
                    if (prev) prev.style.borderColor = '#e5e7eb';
                  }}
                  placeholder="98765 43210"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}>
                Password *
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  placeholder="Min 8 characters"
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
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        style={{
                          height: '4px',
                          flex: 1,
                          borderRadius: '9999px',
                          transition: 'background-color 0.2s',
                          backgroundColor: level <= passwordStrength
                            ? passwordStrengthColor === 'red' ? '#EF4444'
                            : passwordStrengthColor === 'orange' ? '#F97316'
                            : passwordStrengthColor === 'yellow' ? '#EAB308'
                            : '#10B981'
                            : '#E5E7EB'
                        }}
                      />
                    ))}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    marginTop: '4px',
                    marginBottom: 0,
                    color: passwordStrengthColor === 'red' ? '#EF4444'
                      : passwordStrengthColor === 'orange' ? '#F97316'
                      : passwordStrengthColor === 'yellow' ? '#EAB308'
                      : '#10B981'
                  }}>
                    Strength: {passwordStrengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Referral Code (Optional) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}>
                Referral Code (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Tag style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }} size={20} />
                <input
                  type="text"
                  value={formData.referredBy}
                  onChange={(e) => setFormData({ ...formData, referredBy: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
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
                  placeholder="Enter friend's code"
                />
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
                marginBottom: 0,
              }}>
                Have a referral code? Get ₹50 off your first order!
              </p>
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
                padding: '12px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                marginBottom: '16px',
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)')}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Terms and Conditions */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '12px',
                marginTop: 0,
            }}>
                Terms and Conditions Acceptance
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Terms of Service */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151',
                }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted.termsOfService}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, termsOfService: e.target.checked }))}
                    style={{
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      accentColor: '#f97316',
                    }}
                  />
                  <span>
                    I agree to the{' '}
                    <a
                      href="/legal/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                color: '#f97316',
                textDecoration: 'none',
                        fontWeight: 500,
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                Terms of Service
              </a>
                  </span>
                </label>

                {/* Privacy Policy */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151',
                }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted.privacyPolicy}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, privacyPolicy: e.target.checked }))}
                    style={{
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      accentColor: '#f97316',
                    }}
                  />
                  <span>
                    I agree to the{' '}
                    <a
                      href="/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                color: '#f97316',
                textDecoration: 'none',
                        fontWeight: 500,
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                Privacy Policy
              </a>
                  </span>
                </label>

                {/* Refund Policy */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151',
                }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted.refundPolicy}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, refundPolicy: e.target.checked }))}
                    style={{
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      accentColor: '#f97316',
                    }}
                  />
                  <span>
                    I acknowledge the{' '}
                    <a
                      href="/legal/refund-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#f97316',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Refund and Returns Policy
                    </a>
                  </span>
                </label>

                {/* Food Safety */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151',
                }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted.foodSafety}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, foodSafety: e.target.checked }))}
                    style={{
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      accentColor: '#f97316',
                    }}
                  />
                  <span>
                    I understand the{' '}
                    <a
                      href="/legal/food-safety"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#f97316',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Food Safety Guidelines
                    </a>
                  </span>
                </label>
              </div>

              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '12px',
                marginBottom: 0,
                textAlign: 'center',
              }}>
                All fields are required to create your account
              </p>
            </div>

            {/* Login Link */}
            <div style={{
              textAlign: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
            }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  style={{
                    color: '#f97316',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ea580c'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#f97316'}
                >
                  Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
