/**
 * EDIT SECURITY MODAL - Professional Password Management
 * 
 * Features:
 * - Precise rem/pixel sizing (full control)
 * - Icon-only UI (no emojis)
 * - Dark mode support
 * - Loading states
 * - Form validation
 * 
 * @author THE ARCHITECT
 */

import React, { useState } from 'react';
import { X, Save, Lock, Key, Shield, Eye, EyeOff } from 'lucide-react';

interface EditSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { currentPass: string; newPass: string; confirmPass: string }) => Promise<void>;
}

export default function EditSecurityModal({ isOpen, onClose, onSave }: EditSecurityModalProps) {
  const [formData, setFormData] = useState({
    currentPass: '',
    newPass: '',
    confirmPass: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.newPass !== formData.confirmPass) {
      setError("New passwords don't match");
      return;
    }

    if (formData.newPass.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update security settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <h2 
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Security Settings
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Error Message */}
            {error && (
              <div 
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <X style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 500 }}>
                  {error}
                </span>
              </div>
            )}

            {/* Current Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label 
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPass}
                  onChange={(e) => setFormData({ ...formData, currentPass: e.target.value })}
                  placeholder="Enter current password"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPasswords.current ? (
                    <EyeOff style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  ) : (
                    <Eye style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label 
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPass}
                  onChange={(e) => setFormData({ ...formData, newPass: e.target.value })}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPasswords.new ? (
                    <EyeOff style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  ) : (
                    <Eye style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  )}
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Minimum 8 characters required
              </span>
            </div>

            {/* Confirm New Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label 
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPass}
                  onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
                  placeholder="Confirm new password"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPasswords.confirm ? (
                    <EyeOff style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  ) : (
                    <Eye style={{ width: '18px', height: '18px', color: '#9ca3af' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: loading ? '#9ca3af' : '#ea580c',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ea580c')}
              >
                {loading ? (
                  <>
                    <div 
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }}
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '16px', height: '16px' }} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
