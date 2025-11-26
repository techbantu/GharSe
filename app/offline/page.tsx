/**
 * OFFLINE PAGE - PWA Fallback
 * 
 * Purpose: Show when user is offline and page isn't cached
 * 
 * LOGIC:
 * 1. If user is ONLINE but landed here → redirect to homepage
 * 2. If user is OFFLINE and clicks "Try Again" → check connection, show status
 * 3. When connection is restored → auto-redirect to homepage
 * 
 * NOTE: Uses INLINE STYLES because Tailwind CSS may not be cached offline
 */

'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Home, Wifi, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [showMessage, setShowMessage] = useState('');

  // Check if user is actually online when page loads
  useEffect(() => {
    // If user is online, they shouldn't be on this page - redirect them
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      // Small delay to show the page briefly before redirecting
      const timer = setTimeout(() => {
        router.push('/');
      }, 500);
      return () => clearTimeout(timer);
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setConnectionStatus('online');
      setShowMessage('Connection restored! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      setShowMessage('Still offline. Please check your connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  // Try Again button handler
  const handleTryAgain = async () => {
    setIsChecking(true);
    setShowMessage('');

    try {
      // Actually test the connection by making a real request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionStatus('online');
        setShowMessage('Connection restored! Redirecting to homepage...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      // Check navigator.onLine as fallback
      if (navigator.onLine) {
        // Browser thinks we're online, try simple reload
        setShowMessage('Reconnecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        setConnectionStatus('offline');
        setShowMessage('Still offline. Please check your WiFi or mobile data.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Go to homepage (will show offline page again if still offline)
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Offline Icon */}
        <div style={{
          width: '96px',
          height: '96px',
          backgroundColor: connectionStatus === 'online' 
            ? 'rgba(16, 185, 129, 0.2)' 
            : 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          transition: 'all 0.3s ease'
        }}>
          {connectionStatus === 'online' ? (
            <Wifi style={{ width: '48px', height: '48px', color: '#10B981' }} />
          ) : (
            <WifiOff style={{ width: '48px', height: '48px', color: '#9CA3AF' }} />
          )}
        </div>
        
        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: connectionStatus === 'online' ? '#10B981' : '#F97316',
          marginBottom: '16px',
          letterSpacing: '-0.5px',
          transition: 'color 0.3s ease'
        }}>
          {connectionStatus === 'online' ? 'Back Online!' : "You're Offline"}
        </h1>
        
        {/* Description */}
        <p style={{
          color: '#9CA3AF',
          marginBottom: '24px',
          fontSize: '15px',
          lineHeight: '1.6'
        }}>
          {connectionStatus === 'online' 
            ? 'Your connection has been restored. Taking you back...'
            : "It looks like you've lost your internet connection. Please check your connection and try again."
          }
        </p>
        
        {/* Status Message */}
        {showMessage && (
          <div style={{
            marginBottom: '24px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: connectionStatus === 'online' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${connectionStatus === 'online' ? '#10B981' : '#EF4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {connectionStatus === 'online' ? (
              <CheckCircle style={{ width: '18px', height: '18px', color: '#10B981' }} />
            ) : (
              <XCircle style={{ width: '18px', height: '18px', color: '#EF4444' }} />
            )}
            <span style={{ 
              color: connectionStatus === 'online' ? '#10B981' : '#EF4444',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {showMessage}
            </span>
          </div>
        )}
        
        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleTryAgain}
            disabled={isChecking || connectionStatus === 'online'}
            style={{
              width: '100%',
              background: isChecking 
                ? 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
                : 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
              color: 'white',
              fontWeight: 600,
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              boxShadow: isChecking 
                ? 'none' 
                : '0 4px 14px rgba(249, 115, 22, 0.4)',
              opacity: connectionStatus === 'online' ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw style={{ 
              width: '20px', 
              height: '20px',
              animation: isChecking ? 'spin 1s linear infinite' : 'none'
            }} />
            {isChecking ? 'Checking Connection...' : 'Try Again'}
          </button>
          
          <button
            onClick={handleGoHome}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontWeight: 600,
              padding: '14px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              transition: 'background-color 0.2s'
            }}
          >
            <Home style={{ width: '20px', height: '20px' }} />
            Go to Homepage
          </button>
        </div>
        
        {/* Offline Tips */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: 'white',
            fontWeight: 600,
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            What you can do offline:
          </h3>
          <ul style={{
            fontSize: '13px',
            color: '#9CA3AF',
            textAlign: 'left',
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#F97316' }}>•</span> View previously loaded pages
            </li>
            <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#F97316' }}>•</span> Check your order history (if cached)
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#F97316' }}>•</span> Browse the menu (if cached)
            </li>
          </ul>
        </div>
        
        {/* Footer */}
        <p style={{
          color: '#6B7280',
          fontSize: '13px',
          marginTop: '24px'
        }}>
          GharSe works best with an internet connection
        </p>

        {/* CSS for spin animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
