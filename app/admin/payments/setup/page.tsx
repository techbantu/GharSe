/**
 * PAYMENT SETUP WIZARD
 * 
 * Purpose: One-click payment gateway setup with automated configuration
 * Features:
 * - Visual setup wizard
 * - Automated webhook URL generation
 * - Test mode support
 * - Real-time verification
 * - Faster than Swiggy/Zomato setup
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Building2,
  Zap,
  Shield,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

type PaymentGateway = 'razorpay' | 'stripe' | null;
type SetupStep = 'select' | 'configure' | 'test' | 'complete';

export default function PaymentSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('select');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(null);
  const [apiKeys, setApiKeys] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  // Generate webhook URL automatically (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const baseUrl = window.location.origin;
    setWebhookUrl(`${baseUrl}/api/payments/webhook`);
  }, []);

  const handleGatewaySelect = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setStep('configure');
  };

  const handleSaveKeys = async () => {
    try {
      // Save to backend (you'll need to create this API)
      const response = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGateway,
          ...apiKeys,
        }),
      });

      if (response.ok) {
        setStep('test');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving keys:', error);
      alert('Error saving configuration');
    }
  };

  const handleTestPayment = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test payment with ₹1
      const response = await fetch('/api/payments/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGateway,
          amount: 1,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Payment gateway is working perfectly! ✅',
        });
        setTimeout(() => setStep('complete'), 2000);
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Test payment failed',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.4) 0%, rgba(255, 255, 255, 1) 50%, rgba(220, 252, 231, 0.4) 100%)',
      padding: '2rem 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: '#111827',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #F97316 0%, #10B981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ⚡ Instant Payment Setup
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#6B7280',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}>
            Get paid faster than Swiggy. Setup in 2 minutes.
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '3rem',
          gap: '0.5rem',
        }}>
          {['Select', 'Configure', 'Test', 'Complete'].map((label, idx) => {
            const stepIdx = ['select', 'configure', 'test', 'complete'].indexOf(step);
            const isActive = idx <= stepIdx;
            const isCurrent = idx === stepIdx;
            return (
              <React.Fragment key={label}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: isActive ? '#10B981' : '#E5E7EB',
                      color: isActive ? '#FFFFFF' : '#9CA3AF',
                      boxShadow: isCurrent 
                        ? '0 0 0 4px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.3)'
                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {isActive ? <CheckCircle size={24} /> : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    marginTop: '0.75rem',
                    color: isActive ? '#111827' : '#6B7280',
                    fontWeight: isCurrent ? 600 : 500,
                    transition: 'all 0.3s ease',
                  }}>{label}</span>
                </div>
                {idx < 3 && (
                  <div
                    style={{
                      width: '120px',
                      height: '3px',
                      margin: '0 0.5rem',
                      borderRadius: '2px',
                      backgroundColor: idx < stepIdx ? '#10B981' : '#E5E7EB',
                      transition: 'all 0.3s ease',
                      boxShadow: idx < stepIdx ? '0 1px 3px rgba(16, 185, 129, 0.3)' : 'none',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Select Gateway */}
        {step === 'select' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
            padding: '3rem',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '2.5rem',
              textAlign: 'center',
              color: '#111827',
              letterSpacing: '-0.01em',
            }}>
              Choose Your Payment Gateway
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem',
            }}>
              {/* Razorpay Option */}
              <div
                onClick={() => handleGatewaySelect('razorpay')}
                style={{
                  border: '2px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: '#FFFFFF',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(16, 185, 129, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Recommended Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                  <Zap style={{ color: '#F59E0B', width: '16px', height: '16px' }} />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#10B981',
                    letterSpacing: '0.05em',
                  }}>
                    RECOMMENDED
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    backgroundColor: '#DBEAFE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  }}>
                    <Building2 style={{ color: '#2563EB', width: '36px', height: '36px' }} />
                  </div>
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#111827',
                  letterSpacing: '-0.01em',
                }}>
                  Razorpay
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#6B7280',
                  marginBottom: '1.5rem',
                  fontWeight: 500,
                }}>
                  Best for India 🇮🇳
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  {[
                    'UPI payments FREE (0% fees)',
                    'Fastest payouts (T+1 day)',
                    'Lower fees (2% vs 2.9%)',
                    'Better Indian bank support',
                  ].map((feature) => (
                    <li key={feature} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.9375rem',
                      color: '#374151',
                    }}>
                      <CheckCircle style={{ color: '#10B981', width: '20px', height: '20px', flexShrink: 0 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button style={{
                  width: '100%',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1D4ED8';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  Setup Razorpay →
                </button>
              </div>

              {/* Stripe Option */}
              <div
                onClick={() => handleGatewaySelect('stripe')}
                style={{
                  border: '2px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: '#FFFFFF',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9333EA';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(147, 51, 234, 0.15), 0 4px 12px rgba(147, 51, 234, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    backgroundColor: '#F3E8FF',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(147, 51, 234, 0.2)',
                  }}>
                    <CreditCard style={{ color: '#9333EA', width: '36px', height: '36px' }} />
                  </div>
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#111827',
                  letterSpacing: '-0.01em',
                }}>
                  Stripe
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#6B7280',
                  marginBottom: '1.5rem',
                  fontWeight: 500,
                }}>
                  Global payment platform
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  {[
                    { text: 'Works worldwide', icon: CheckCircle, color: '#10B981' },
                    { text: 'Supports all cards', icon: CheckCircle, color: '#10B981' },
                    { text: 'Advanced features', icon: CheckCircle, color: '#10B981' },
                    { text: 'Payouts: 2-7 days', icon: AlertCircle, color: '#F59E0B' },
                  ].map(({ text, icon: Icon, color }) => (
                    <li key={text} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.9375rem',
                      color: '#374151',
                    }}>
                      <Icon style={{ color, width: '20px', height: '20px', flexShrink: 0 }} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <button style={{
                  width: '100%',
                  backgroundColor: '#9333EA',
                  color: '#FFFFFF',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7E22CE';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(147, 51, 234, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#9333EA';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  Setup Stripe →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure API Keys */}
        {step === 'configure' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
            padding: '3rem',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '2.5rem',
              color: '#111827',
              letterSpacing: '-0.01em',
            }}>
              Configure {selectedGateway === 'razorpay' ? 'Razorpay' : 'Stripe'}
            </h2>

            {/* Quick Links */}
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '2rem',
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#1E40AF',
                marginBottom: '0.75rem',
                fontWeight: 600,
              }}>
                <strong>Quick Links:</strong>
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'center',
              }}>
                {selectedGateway === 'razorpay' ? (
                  <>
                    <a
                      href="https://dashboard.razorpay.com/app/keys"
                      target="_blank"
                      style={{
                        color: '#2563EB',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Get API Keys →
                    </a>
                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>|</span>
                    <a
                      href="https://dashboard.razorpay.com/app/webhooks"
                      target="_blank"
                      style={{
                        color: '#2563EB',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Setup Webhooks →
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      style={{
                        color: '#2563EB',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Get API Keys →
                    </a>
                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>|</span>
                    <a
                      href="https://dashboard.stripe.com/webhooks"
                      target="_blank"
                      style={{
                        color: '#2563EB',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Setup Webhooks →
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* API Key Fields */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  {selectedGateway === 'razorpay' ? 'Key ID' : 'Publishable Key'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={apiKeys.keyId}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, keyId: e.target.value })
                    }
                    placeholder={
                      selectedGateway === 'razorpay'
                        ? 'rzp_test_... or rzp_live_...'
                        : 'pk_test_... or pk_live_...'
                    }
                    style={{
                      flex: 1,
                      padding: '0.875rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '12px',
                      fontSize: '0.9375rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  {selectedGateway === 'razorpay' ? 'Key Secret' : 'Secret Key'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    value={apiKeys.keySecret}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, keySecret: e.target.value })
                    }
                    placeholder="Enter your secret key"
                    style={{
                      flex: 1,
                      padding: '0.875rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '12px',
                      fontSize: '0.9375rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Webhook URL (Auto-generated) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Webhook URL (Auto-generated)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={mounted ? webhookUrl : 'Loading...'}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.875rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '12px',
                      fontSize: '0.9375rem',
                      backgroundColor: '#F9FAFB',
                      color: '#6B7280',
                    }}
                  />
                  <button
                    onClick={() => mounted && webhookUrl && copyToClipboard(webhookUrl, 'webhook')}
                    disabled={!mounted || !webhookUrl}
                    style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: '#F3F4F6',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                  >
                    {copied === 'webhook' ? (
                      <Check size={20} style={{ color: '#10B981' }} />
                    ) : (
                      <Copy size={20} style={{ color: '#6B7280' }} />
                    )}
                  </button>
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  marginTop: '0.5rem',
                }}>
                  Copy this URL and paste it in your {selectedGateway === 'razorpay' ? 'Razorpay' : 'Stripe'}{' '}
                  webhook settings
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  Webhook Secret (Optional)
                </label>
                <input
                  type="password"
                  value={apiKeys.webhookSecret}
                  onChange={(e) =>
                    setApiKeys({ ...apiKeys, webhookSecret: e.target.value })
                  }
                  placeholder="Enter webhook secret for security"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '12px',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2.5rem',
            }}>
              <button
                onClick={() => setStep('select')}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              >
                Back
              </button>
              <button
                onClick={handleSaveKeys}
                disabled={!apiKeys.keyId || !apiKeys.keySecret}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  backgroundColor: (!apiKeys.keyId || !apiKeys.keySecret) ? '#D1D5DB' : '#10B981',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: (!apiKeys.keyId || !apiKeys.keySecret) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: (!apiKeys.keyId || !apiKeys.keySecret) ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (apiKeys.keyId && apiKeys.keySecret) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (apiKeys.keyId && apiKeys.keySecret) {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Save & Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Test Payment */}
        {step === 'test' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
            padding: '3rem',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '2rem',
              color: '#111827',
              letterSpacing: '-0.01em',
            }}>
              Test Payment
            </h2>
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '2rem',
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400E',
                fontWeight: 500,
                lineHeight: '1.5',
              }}>
                <strong>Test Mode:</strong> We'll process a ₹1 test payment to verify
                everything works. This won't charge you anything.
              </p>
            </div>

            {testResult && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  backgroundColor: testResult.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testResult.success ? '#BBF7D0' : '#FECACA'}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  {testResult.success ? (
                    <CheckCircle style={{ color: '#10B981', width: '24px', height: '24px', flexShrink: 0 }} />
                  ) : (
                    <XCircle style={{ color: '#EF4444', width: '24px', height: '24px', flexShrink: 0 }} />
                  )}
                  <p style={{
                    color: testResult.success ? '#166534' : '#991B1B',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                  }}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
            }}>
              <button
                onClick={() => setStep('configure')}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              >
                Back
              </button>
              <button
                onClick={handleTestPayment}
                disabled={testing}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  backgroundColor: testing ? '#D1D5DB' : '#10B981',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: 'none',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: testing ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!testing) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!testing) {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {testing ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Test Payment (₹1)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
            padding: '3rem',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '96px',
              height: '96px',
              backgroundColor: '#D1FAE5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            }}>
              <CheckCircle style={{ color: '#10B981', width: '56px', height: '56px' }} />
            </div>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '1rem',
              color: '#111827',
              letterSpacing: '-0.02em',
            }}>
              Setup Complete! 🎉
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#6B7280',
              marginBottom: '2.5rem',
              fontWeight: 500,
            }}>
              Your payment gateway is configured and ready to accept payments.
            </p>
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2.5rem',
              textAlign: 'left',
            }}>
              <h3 style={{
                fontWeight: 600,
                color: '#166534',
                marginBottom: '1rem',
                fontSize: '1rem',
              }}>
                What happens next?
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                {[
                  'Payments will be processed instantly',
                  'Money transfers to your bank automatically',
                  'You\'ll see real-time payment status in dashboard',
                  'Faster than Swiggy - payments confirmed in seconds',
                ].map((item) => (
                  <li key={item} style={{
                    fontSize: '0.875rem',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>✅</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => router.push('/admin')}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

