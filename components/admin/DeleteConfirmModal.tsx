'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, CheckCircle, Info } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  orderCount?: number;
  onConfirm: (action: 'mark-unavailable' | 'force-delete' | 'simple-delete') => void;
  stage: 'initial' | 'options' | 'final-confirm' | 'success';
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  itemName,
  orderCount = 0,
  onConfirm,
  stage,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const hasOrders = orderCount > 0;
  const isHighSelling = orderCount >= 10;

  // Stage 1: Initial confirmation for items with no orders
  if (stage === 'initial' && !hasOrders) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
              flexShrink: 0,
            }}>
              <Trash2 size={24} style={{ color: '#dc2626' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '0.5rem',
              }}>
                Delete Menu Item?
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.5,
              }}>
                Are you sure you want to delete "{itemName}"?
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: 1.5,
            }}>
              This item has never been ordered. It will be removed from your menu permanently.
            </p>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm('simple-delete')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              <Trash2 size={16} />
              Yes, Delete Item
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Stage 2: Options for items with orders
  if (stage === 'options' && hasOrders) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '560px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: isHighSelling ? '#fef3c7' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
              flexShrink: 0,
            }}>
              <AlertTriangle size={24} style={{ color: isHighSelling ? '#f59e0b' : '#dc2626' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '0.5rem',
              }}>
                {isHighSelling ? '🔥 High-Selling Item!' : 'Item Has Order History'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.5,
              }}>
                "{itemName}" has been ordered {orderCount} time{orderCount > 1 ? 's' : ''}
                {isHighSelling ? '. This is one of your popular dishes!' : '.'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#374151',
              marginBottom: '1rem',
              fontWeight: 600,
            }}>
              Choose what to do:
            </p>

            {/* Option 1: Mark Unavailable */}
            <button
              onClick={() => onConfirm('mark-unavailable')}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '0.75rem',
                marginBottom: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dcfce7';
                e.currentTarget.style.borderColor = '#4ade80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.borderColor = '#86efac';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  borderRadius: '50%',
                  textAlign: 'center',
                  lineHeight: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginRight: '0.75rem',
                  flexShrink: 0,
                }}>
                  1
                </span>
                <div>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#166534',
                    marginBottom: '0.25rem',
                  }}>
                    Mark as "Not Available" ⭐ Recommended
                  </h4>
                  <ul style={{
                    fontSize: '0.8125rem',
                    color: '#15803d',
                    lineHeight: 1.5,
                    paddingLeft: '1.25rem',
                    margin: 0,
                  }}>
                    <li>Hides from customer menu</li>
                    <li>You can re-enable it anytime</li>
                    <li>Order history fully preserved</li>
                  </ul>
                </div>
              </div>
            </button>

            {/* Option 2: Force Delete */}
            <button
              onClick={() => onConfirm('force-delete')}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.borderColor = '#fecaca';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  borderRadius: '50%',
                  textAlign: 'center',
                  lineHeight: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginRight: '0.75rem',
                  flexShrink: 0,
                }}>
                  2
                </span>
                <div>
                  <h4 style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#991b1b',
                    marginBottom: '0.25rem',
                  }}>
                    Permanently Delete
                  </h4>
                  <ul style={{
                    fontSize: '0.8125rem',
                    color: '#b91c1c',
                    lineHeight: 1.5,
                    paddingLeft: '1.25rem',
                    margin: 0,
                  }}>
                    <li>Removes from menu forever</li>
                    <li>Order history preserved (past orders safe)</li>
                    <li>Cannot be undone</li>
                  </ul>
                </div>
              </div>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Cancel
          </button>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Stage 3: Final confirmation for force delete
  if (stage === 'final-confirm') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem',
              flexShrink: 0,
            }}>
              <AlertTriangle size={24} style={{ color: '#dc2626' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#dc2626',
                marginBottom: '0.5rem',
              }}>
                {isHighSelling ? '⚠️ Final Warning!' : 'Confirm Deletion'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.5,
              }}>
                You're about to permanently delete "{itemName}"
                {isHighSelling ? ' (a high-selling item with ' + orderCount + ' orders)' : ''}.
              </p>
            </div>
          </div>

          {/* Warning Content */}
          <div style={{
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #dc2626',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#991b1b',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}>
              This action will:
            </p>
            <ul style={{
              fontSize: '0.8125rem',
              color: '#b91c1c',
              lineHeight: 1.7,
              paddingLeft: '1.25rem',
              margin: 0,
            }}>
              <li>Remove "{itemName}" from your menu permanently</li>
              <li>Cannot be reversed or undone</li>
              <li>Past orders will show "(item deleted)"</li>
              {orderCount > 0 && <li>{orderCount} order records will be preserved</li>}
            </ul>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              No, Keep Item
            </button>
            <button
              onClick={() => onConfirm('force-delete')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              <Trash2 size={16} />
              Yes, Delete Forever
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Stage 4: Success message
  if (stage === 'success') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideIn 0.2s ease-out',
          textAlign: 'center',
        }}>
          {/* Success Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={32} style={{ color: '#16a34a' }} />
          </div>

          {/* Success Message */}
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '0.75rem',
          }}>
            Successfully Deleted!
          </h3>

          <p style={{
            fontSize: '0.9375rem',
            color: '#6b7280',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}>
            "{itemName}" has been removed from your menu.
          </p>

          {/* Details */}
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <ul style={{
              fontSize: '0.875rem',
              color: '#15803d',
              lineHeight: 1.7,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Menu item deleted</li>
              {orderCount > 0 && (
                <li style={{ marginBottom: '0.5rem' }}>
                  ✓ {orderCount} order record{orderCount > 1 ? 's' : ''} preserved
                </li>
              )}
              <li>✓ Your menu has been updated</li>
            </ul>
          </div>

          {/* OK Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#16a34a',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          >
            OK
          </button>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
}

