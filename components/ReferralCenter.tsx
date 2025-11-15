/**
 * REFERRAL CENTER - Social Sharing Command Center
 * 
 * Purpose: Transform boring referral code into social-worthy design
 * 
 * Features:
 * - Beautiful voucher-style code display
 * - One-click WhatsApp, SMS, Copy sharing
 * - Live counter of friends who joined
 * - Rewards earned display
 * - Share message pre-filled
 * - Confetti animation on successful share
 * 
 * Visual: Restaurant voucher meets social media sharing
 */

'use client';

import React, { useState } from 'react';
import {
  Gift,
  Copy,
  Check,
  Users,
  TrendingUp,
  Share2,
  MessageCircle,
  Smartphone,
  Sparkles,
  Star,
} from 'lucide-react';

interface ReferralCenterProps {
  referralCode: string;
  friendsReferred: number;
  rewardsEarned: number;
  customerName: string;
}

const ReferralCenter: React.FC<ReferralCenterProps> = ({
  referralCode,
  friendsReferred,
  rewardsEarned,
  customerName,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Pre-filled share message
  const shareMessage = `Hey! I've been ordering amazing authentic Indian food from Bantu's Kitchen and thought you'd love it too! Use my code ${referralCode} for ₹50 off your first order. Trust me, their food is incredible!`;
  const shareUrl = `https://bantuskitchen.com?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + '\n\n' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
    triggerConfetti();
  };

  const handleSMSShare = () => {
    const smsUrl = `sms:?&body=${encodeURIComponent(shareMessage + '\n\n' + shareUrl)}`;
    window.location.href = smsUrl;
    triggerConfetti();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareMessage + '\n\n' + shareUrl);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Header - Compact */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          background: 'linear-gradient(to right, #fff7ed, #fce7f3)',
          borderRadius: '9999px',
          marginBottom: '0.625rem',
        }}>
          <Gift style={{ color: '#ea580c' }} size={16} />
          <span style={{
            color: '#c2410c',
            fontWeight: 600,
            fontSize: '0.8125rem',
          }}>Share the Love</span>
        </div>
        <h2 style={{
          fontSize: '1.25rem',
          lineHeight: '1.75rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.375rem',
          margin: 0,
        }}>
          Invite Friends, Earn Rewards
        </h2>
        <p style={{ 
          color: '#6B7280',
          fontSize: '0.875rem',
          lineHeight: '1.375rem',
          margin: '0.375rem 0 0 0',
        }}>
          Both get ₹50 on first order!
        </p>
      </div>

      {/* How It Works - Ultra Compact */}
      <div style={{
        backgroundColor: '#F9FAFB',
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        padding: '0.875rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          marginBottom: '0.625rem',
          justifyContent: 'center',
        }}>
          <TrendingUp style={{ color: '#f97316' }} size={16} />
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
          }}>How It Works</h3>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{
              flexShrink: 0,
              width: '1.5rem',
              height: '1.5rem',
              background: 'linear-gradient(to bottom right, #f97316, #ef4444)',
              color: '#fff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}>1</div>
            <p style={{
              fontSize: '0.8125rem',
              color: '#374151',
              margin: 0,
              lineHeight: 1.4,
            }}>Share your code</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{
              flexShrink: 0,
              width: '1.5rem',
              height: '1.5rem',
              background: 'linear-gradient(to bottom right, #f97316, #ef4444)',
              color: '#fff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}>2</div>
            <p style={{
              fontSize: '0.8125rem',
              color: '#374151',
              margin: 0,
              lineHeight: 1.4,
            }}>Friend saves ₹50</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{
              flexShrink: 0,
              width: '1.5rem',
              height: '1.5rem',
              background: 'linear-gradient(to bottom right, #f97316, #ef4444)',
              color: '#fff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}>3</div>
            <p style={{
              fontSize: '0.8125rem',
              color: '#374151',
              margin: 0,
              lineHeight: 1.4,
            }}>You earn ₹50 points</p>
          </div>
        </div>
      </div>

      {/* Main Voucher Card - Compact */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Confetti Animation */}
        {showConfetti && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="animate-confetti"
                style={{
                  position: 'absolute',
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#FF6B35', '#F7C948', '#4ECDC4', '#FF6B9D'][Math.floor(Math.random() * 4)],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Background Gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom right, #fbbf24, #f97316, #ef4444)',
        }}>
          {/* Decorative patterns */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '16rem',
            height: '16rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            marginRight: '-8rem',
            marginTop: '-8rem',
            filter: 'blur(64px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '12rem',
            height: '12rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            marginLeft: '-6rem',
            marginBottom: '-6rem',
            filter: 'blur(40px)',
          }} />
          
          {/* Dotted pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        </div>

        {/* Content - Compact */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '1rem',
        }}>
          {/* Voucher Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            marginBottom: '0.75rem',
          }}>
            <Sparkles style={{ color: '#fde047' }} size={14} />
            <span style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.6875rem',
            }}>
              Your Referral Code
            </span>
            <Sparkles style={{ color: '#fde047' }} size={14} />
          </div>

          {/* Referral Code Display - Compact */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: '0.625rem',
            padding: '0.875rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '0.75rem',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.625rem',
                background: 'linear-gradient(to right, #fff7ed, #fce7f3)',
                borderRadius: '9999px',
                marginBottom: '0.5rem',
              }}>
                <span style={{
                  color: '#c2410c',
                  fontWeight: 500,
                  fontSize: '0.6875rem',
                }}>For {customerName}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  fontSize: '1.5rem',
                  lineHeight: '2rem',
                  fontWeight: 900,
                  background: 'linear-gradient(to right, #ea580c, #dc2626)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                  marginBottom: '0.25rem',
                }}>
                  {referralCode}
                </div>
              </div>
              <p style={{
                color: '#6B7280',
                fontSize: '0.6875rem',
                marginTop: '0.25rem',
                margin: 0,
              }}>Share to unlock rewards</p>
            </div>

            {/* Quick Copy Button - Compact */}
            <button
              onClick={handleCopy}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                background: 'linear-gradient(to right, #f97316, #ef4444)',
                color: '#fff',
                borderRadius: '0.5rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Share Buttons - Compact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}>
            <button
              onClick={handleWhatsAppShare}
              style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <MessageCircle size={18} />
              <span style={{ fontSize: '0.625rem' }}>WhatsApp</span>
            </button>

            <button
              onClick={handleSMSShare}
              style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <Smartphone size={18} />
              <span style={{ fontSize: '0.625rem' }}>SMS</span>
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <Share2 size={18} />
              <span style={{ fontSize: '0.625rem' }}>Share</span>
            </button>
          </div>

          {/* Stats - Compact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.5rem',
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(4px)',
              borderRadius: '0.5rem',
              padding: '0.625rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginBottom: '0.25rem',
              }}>
                <Users size={14} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.6875rem',
                }}>Friends</span>
              </div>
              <p style={{
                fontSize: '1.25rem',
                lineHeight: '1.75rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}>{friendsReferred}</p>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(4px)',
              borderRadius: '0.5rem',
              padding: '0.625rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginBottom: '0.25rem',
              }}>
                <Star size={14} style={{ color: '#fde047' }} />
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.6875rem',
                }}>Rewards</span>
              </div>
              <p style={{
                fontSize: '1.25rem',
                lineHeight: '1.75rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}>₹{rewardsEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tip - Minimal */}
      <div style={{
        background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        border: '1px solid #bfdbfe',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
      }}>
        <Sparkles style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} size={16} />
        <div>
          <p style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '0.125rem',
            margin: 0,
          }}>Pro Tip</p>
          <p style={{
            fontSize: '0.75rem',
            lineHeight: 1.4,
            color: '#4B5563',
            margin: '0.125rem 0 0 0',
          }}>
            Share your favorite dish along with the code!
          </p>
        </div>
      </div>

      {/* CSS for Confetti Animation and Responsive Grid */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx, 0), var(--ty, 100px)) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-confetti {
          animation: confetti 1.5s ease-out forwards;
          --tx: ${Math.random() * 200 - 100}px;
          --ty: ${Math.random() * 200 + 100}px;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        @media (min-width: 768px) {
          .how-it-works-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReferralCenter;

