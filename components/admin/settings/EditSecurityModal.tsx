import React, { useState } from 'react';
import { X, Save, Lock, Shield, Key } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPass !== formData.confirmPass) {
      alert("New passwords don't match!");
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update security settings:', error);
      alert('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Security Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={formData.currentPass}
                onChange={(e) => setFormData({ ...formData, currentPass: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={formData.newPass}
                onChange={(e) => setFormData({ ...formData, newPass: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirm New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={formData.confirmPass}
                onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
