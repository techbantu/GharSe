/**
 * TOAST NOTIFICATION SYSTEM
 * 
 * Purpose: Beautiful, non-blocking notifications for user actions
 * Replaces ugly browser alerts with elegant on-screen messages
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast('error', title, message);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={24} />,
    error: <XCircle size={24} />,
    warning: <AlertCircle size={24} />,
    info: <Info size={24} />,
  };

  const colors = {
    success: {
      bg: '#d1fae5',
      border: '#10b981',
      icon: '#059669',
      text: '#065f46',
    },
    error: {
      bg: '#fee2e2',
      border: '#ef4444',
      icon: '#dc2626',
      text: '#991b1b',
    },
    warning: {
      bg: '#fef3c7',
      border: '#f59e0b',
      icon: '#d97706',
      text: '#92400e',
    },
    info: {
      bg: '#dbeafe',
      border: '#3b82f6',
      icon: '#2563eb',
      text: '#1e40af',
    },
  };

  const color = colors[toast.type];

  return (
    <div
      style={{
        background: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '12px',
        alignItems: 'start',
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div style={{ color: color.icon, flexShrink: 0 }}>
        {icons[toast.type]}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 600,
          fontSize: '16px',
          color: color.text,
          marginBottom: toast.message ? '4px' : '0',
        }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{
            fontSize: '14px',
            color: color.text,
            opacity: 0.8,
          }}>
            {toast.message}
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color.text,
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        <X size={18} />
      </button>
    </div>
  );
}

// Add animation keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

