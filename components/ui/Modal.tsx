/**
 * SHARED MODAL COMPONENT
 *
 * Single source of truth for all modals. Pure Tailwind classes only.
 * Requires tailwind.config.ts to use theme.extend (not replace).
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalBodyProps {
  children: React.ReactNode;
}

interface ModalSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}

interface ModalFieldProps {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

interface ModalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  style?: React.CSSProperties;
}

interface ModalFooterProps {
  children: React.ReactNode;
}

interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface ModalSuccessProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

// =============================================================================
// SIZE CONFIG - Explicit values for reliability
// =============================================================================

const sizeConfig: Record<string, { maxWidth: string }> = {
  sm: { maxWidth: '24rem' },   // 384px
  md: { maxWidth: '28rem' },   // 448px
  lg: { maxWidth: '32rem' },   // 512px
  xl: { maxWidth: '36rem' },   // 576px
};

// =============================================================================
// MAIN MODAL
// =============================================================================

function Modal({ isOpen, onClose, title, subtitle, children, size = 'lg' }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const { maxWidth } = sizeConfig[size] || sizeConfig.lg;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
            {subtitle && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              margin: '-0.5rem',
              color: '#9ca3af',
              background: 'none',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MODAL.BODY
// =============================================================================

function ModalBody({ children }: ModalBodyProps) {
  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      overflowY: 'auto',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      {children}
    </div>
  );
}

// =============================================================================
// MODAL.SECTION
// =============================================================================

function ModalSection({ title, icon, badge, description, children }: ModalSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0,
        }}>
          {icon}
          {title}
        </h3>
        {badge}
      </div>
      {description && (
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem', marginBottom: 0 }}>{description}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MODAL.FIELD
// =============================================================================

function ModalField({ label, error, children }: ModalFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

// =============================================================================
// MODAL.INPUT
// =============================================================================

function ModalInput({ hasError, className = '', style, ...props }: ModalInputProps) {
  return (
    <input
      style={{
        width: '100%',
        padding: '0.625rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: '#111827',
        backgroundColor: '#ffffff',
        border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#FF6B35';
        e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = hasError ? '#ef4444' : '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

// =============================================================================
// MODAL.GRID
// =============================================================================

function ModalGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
      {children}
    </div>
  );
}

// =============================================================================
// MODAL.DIVIDER
// =============================================================================

function ModalDivider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />;
}

// =============================================================================
// MODAL.INFOBOX
// =============================================================================

function ModalInfoBox({
  title,
  children,
  variant = 'info'
}: {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success'
}) {
  const variantStyles = {
    info: { backgroundColor: '#FFF5F0', color: '#B33817' },
    warning: { backgroundColor: '#fffbeb', color: '#92400e' },
    success: { backgroundColor: '#ecfdf5', color: '#065f46' },
  };

  return (
    <div style={{
      borderRadius: '0.5rem',
      padding: '1rem',
      ...variantStyles[variant],
    }}>
      {title && (
        <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{title}</p>
      )}
      <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MODAL.SUCCESS
// =============================================================================

function ModalSuccess({ title, message, icon }: ModalSuccessProps) {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
      <div style={{
        width: '4rem',
        height: '4rem',
        backgroundColor: '#dcfce7',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
      }}>
        {icon || (
          <svg style={{ width: '2rem', height: '2rem', color: '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{message}</p>
    </div>
  );
}

// =============================================================================
// MODAL.FOOTER
// =============================================================================

function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.75rem',
      flexShrink: 0,
      backgroundColor: '#f9fafb',
    }}>
      {children}
    </div>
  );
}

// =============================================================================
// MODAL.BUTTON
// =============================================================================

function ModalButton({
  children,
  loading,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}: ModalButtonProps) {
  const variantStyles = {
    primary: {
      backgroundColor: '#FF6B35',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#4b5563',
    },
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background-color 0.15s, opacity 0.15s',
        ...variantStyles[variant],
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = '#E85A2B';
          else if (variant === 'secondary') e.currentTarget.style.backgroundColor = '#e5e7eb';
          else if (variant === 'ghost') e.currentTarget.style.backgroundColor = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.backgroundColor = '#FF6B35';
        else if (variant === 'secondary') e.currentTarget.style.backgroundColor = '#f3f4f6';
        else if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {loading && (
        <svg style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// =============================================================================
// MODAL.CANCELBUTTON
// =============================================================================

function ModalCancelButton({ onClick, children = 'Cancel' }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <ModalButton variant="ghost" onClick={onClick}>
      {children}
    </ModalButton>
  );
}

// =============================================================================
// MODAL.SUBMITBUTTON
// =============================================================================

function ModalSubmitButton({
  children = 'Save',
  loading,
  disabled,
  icon,
  ...props
}: ModalButtonProps & { icon?: React.ReactNode }) {
  return (
    <ModalButton type="submit" variant="primary" loading={loading} disabled={disabled} {...props}>
      {!loading && icon}
      {children}
    </ModalButton>
  );
}

// =============================================================================
// UPI BADGE - For payment labels
// =============================================================================

interface UpiBadgeProps {
  type: 'phonepe' | 'paytm' | 'gpay';
  children: React.ReactNode;
}

function UpiBadge({ type, children }: UpiBadgeProps) {
  const config = {
    phonepe: { bg: '#7c3aed', letter: 'P' },  // violet-600
    paytm: { bg: '#3b82f6', letter: 'P' },    // blue-500
    gpay: { bg: '#2563eb', letter: 'G' },     // blue-600
  };

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{
        width: '1.25rem',
        height: '1.25rem',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: config[type].bg,
      }}>
        {config[type].letter}
      </span>
      {children}
    </span>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

Modal.Body = ModalBody;
Modal.Section = ModalSection;
Modal.Field = ModalField;
Modal.Input = ModalInput;
Modal.Grid = ModalGrid;
Modal.Divider = ModalDivider;
Modal.InfoBox = ModalInfoBox;
Modal.Success = ModalSuccess;
Modal.Footer = ModalFooter;
Modal.Button = ModalButton;
Modal.CancelButton = ModalCancelButton;
Modal.SubmitButton = ModalSubmitButton;
Modal.UpiBadge = UpiBadge;

export default Modal;
