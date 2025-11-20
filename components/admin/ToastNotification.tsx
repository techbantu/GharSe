import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error';

interface ToastNotificationProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in-right ${bgColor} ${borderColor}`}
      style={{ minWidth: '300px', maxWidth: '90vw' }}
    >
      <Icon size={24} className={iconColor} />
      <p className={`flex-1 font-medium ${textColor}`}>{message}</p>
      <button 
        onClick={onClose}
        className={`p-1 rounded-full hover:bg-black/5 transition-colors ${textColor}`}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ToastNotification;
