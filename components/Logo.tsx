/**
 * Logo Component - Reusable GharSe Logo
 * 
 * This component displays the GharSe logo with the house/fork icon and brand name.
 * Supports different sizes and variants for use across the application.
 * 
 * HYDRATION-SAFE: Uses consistent rendering between SSR and CSR
 */

import React from 'react';

interface LogoProps {
  /** Size variant: 'small' (header), 'medium' (footer), 'large' (hero) */
  variant?: 'small' | 'medium' | 'large' | 'icon-only';
  /** Custom className for styling */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Show tagline below logo */
  showTagline?: boolean;
  /** Use image file instead of SVG. Defaults to true */
  useImage?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'medium', 
  className = '', 
  style = {},
  showTagline = false,
  useImage = true
}) => {
  // Size configurations - deterministic values for SSR/CSR consistency
  const sizes = {
    small: { width: 180, height: 72, iconSize: 24, maxWidth: '180px' },
    medium: { width: 240, height: 96, iconSize: 32, maxWidth: '240px' },
    large: { width: 300, height: 120, iconSize: 40, maxWidth: '300px' },
    'icon-only': { width: 48, height: 48, iconSize: 24, maxWidth: '48px' }
  } as const;

  const config = sizes[variant];

  // Image-based logo - HYDRATION-SAFE: No dynamic values
  if (useImage) {
    // Compute maxWidth deterministically (no conditional based on style prop)
    const computedMaxWidth = config.maxWidth;
    
    return (
      <img
        src="/images/GharSe.png"
        alt="GharSe Logo"
        width={config.width}
        height={config.height}
        className={className}
        style={{ 
          maxWidth: style?.maxWidth || computedMaxWidth,
          height: 'auto',
          objectFit: 'contain' as const,
          display: 'block',
          ...style
        }}
        loading="eager"
      />
    );
  }

  // SVG Logo Implementation
  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} style={style}>
        <svg 
          width={config.width} 
          height={config.height} 
          viewBox="0 0 48 48" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* House Icon with Fork */}
          <rect x="10" y="20" width="20" height="16" rx="2" fill="#F97316"/>
          <path d="M 10 20 L 20 8 L 30 20 Z" fill="#F97316"/>
          <g transform="translate(12, 14) rotate(-15)">
            <rect x="6" y="12" width="2" height="12" rx="1" fill="#000000"/>
            <rect x="4" y="4" width="1.5" height="8" rx="0.75" fill="#000000"/>
            <rect x="6.5" y="4" width="1.5" height="8" rx="0.75" fill="#000000"/>
            <rect x="9" y="4" width="1.5" height="8" rx="0.75" fill="#000000"/>
            <rect x="11.5" y="4" width="1.5" height="8" rx="0.75" fill="#000000"/>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`} style={style}>
      <div className="flex items-center gap-3">
        {/* House Icon with Fork */}
        <div className="flex-shrink-0">
          <svg 
            width={config.iconSize} 
            height={config.iconSize} 
            viewBox="0 0 48 48" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <rect x="10" y="20" width="20" height="16" rx="2" fill="#F97316"/>
            <path d="M 10 20 L 20 8 L 30 20 Z" fill="#F97316"/>
            <g transform="translate(20, 18) rotate(-20)">
              <rect x="7" y="14" width="2.5" height="14" rx="1.25" fill="#000000"/>
              <rect x="5.5" y="4" width="1.8" height="12" rx="0.9" fill="#000000"/>
              <rect x="8" y="4" width="1.8" height="12" rx="0.9" fill="#000000"/>
              <rect x="10.5" y="4" width="1.8" height="12" rx="0.9" fill="#000000"/>
              <rect x="13" y="4" width="1.8" height="12" rx="0.9" fill="#000000"/>
            </g>
          </svg>
        </div>
        
        {/* GharSe Text */}
        <div>
          <h1 
            className="font-black text-orange-500"
            style={{
              fontSize: variant === 'small' ? '20px' : variant === 'large' ? '32px' : '24px',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
            }}
          >
            GharSe
          </h1>
          {showTagline && (
            <p 
              className="text-white text-xs font-medium mt-0.5"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '0.02em'
              }}
            >
              From Real Homes To Your Hungry Heart
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logo;

