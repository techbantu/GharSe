/**
 * CHEF PAYMENT SETTINGS PAGE
 *
 * Purpose: Allow chefs to configure their UPI payment IDs
 *
 * Features:
 * - PhonePe UPI ID configuration
 * - Paytm UPI ID configuration
 * - Google Pay UPI ID configuration
 * - Auto-generated QR codes for each payment method
 * - Real-time QR code preview
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Smartphone, QrCode, RefreshCw } from 'lucide-react';

interface PaymentSettings {
  phonePeUpiId: string | null;
  paytmUpiId: string | null;
  googlePayUpiId: string | null;
  phonePeQrCode: string | null;
  paytmQrCode: string | null;
  googlePayQrCode: string | null;
}

export default function ChefPaymentSettingsPage() {
  // For now, using a hardcoded chef slug - in production, get from auth context
  const chefSlug = 'bantus-kitchen';

  const [settings, setSettings] = useState<PaymentSettings>({
    phonePeUpiId: null,
    paytmUpiId: null,
    googlePayUpiId: null,
    phonePeQrCode: null,
    paytmQrCode: null,
    googlePayQrCode: null,
  });
  const [formData, setFormData] = useState({
    phonePeUpiId: '',
    paytmUpiId: '',
    googlePayUpiId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeQrPreview, setActiveQrPreview] = useState<'phonepe' | 'paytm' | 'gpay' | null>(null);

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/chefs/${chefSlug}/payment-settings`);
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setFormData({
          phonePeUpiId: data.data.phonePeUpiId || '',
          paytmUpiId: data.data.paytmUpiId || '',
          googlePayUpiId: data.data.googlePayUpiId || '',
        });
      } else {
        setError(data.error || 'Failed to load payment settings');
      }
    } catch (err) {
      console.error('Failed to load payment settings:', err);
      setError('Failed to load payment settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/chefs/${chefSlug}/payment-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phonePeUpiId: formData.phonePeUpiId || null,
          paytmUpiId: formData.paytmUpiId || null,
          googlePayUpiId: formData.googlePayUpiId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setSuccess('Payment settings saved successfully! QR codes have been generated.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to save payment settings');
      }
    } catch (err) {
      console.error('Failed to save payment settings:', err);
      setError('Failed to save payment settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const validateUpiId = (upiId: string): boolean => {
    if (!upiId) return true; // Empty is valid (optional field)
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId);
  };

  const getUpiValidationMessage = (upiId: string): string | null => {
    if (!upiId) return null;
    if (!validateUpiId(upiId)) {
      return 'Invalid UPI ID format. Example: yourname@paytm';
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/chef/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure your UPI payment methods for customer payments
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-orange-800 mb-2">How it works</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>1. Enter your UPI ID for each payment method you want to accept</li>
            <li>2. Click Save - QR codes are generated automatically</li>
            <li>3. Customers will see these QR codes at checkout</li>
            <li>4. Update anytime - QR codes regenerate instantly</li>
          </ul>
        </div>

        {/* UPI Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-orange-500" />
              UPI Payment Methods
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your UPI IDs for each payment app. Customers will scan the auto-generated QR code to pay.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* PhonePe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs mr-2">P</span>
                    PhonePe UPI ID
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.phonePeUpiId}
                  onChange={(e) => setFormData({ ...formData, phonePeUpiId: e.target.value })}
                  placeholder="yourname@ybl"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    getUpiValidationMessage(formData.phonePeUpiId)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {getUpiValidationMessage(formData.phonePeUpiId) && (
                  <p className="mt-1 text-sm text-red-500">
                    {getUpiValidationMessage(formData.phonePeUpiId)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center">
                {settings.phonePeQrCode ? (
                  <div className="text-center">
                    <div
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveQrPreview('phonepe')}
                      dangerouslySetInnerHTML={{ __html: settings.phonePeQrCode }}
                    />
                    <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <QrCode className="h-16 w-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">QR will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Paytm */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mr-2">P</span>
                    Paytm UPI ID
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.paytmUpiId}
                  onChange={(e) => setFormData({ ...formData, paytmUpiId: e.target.value })}
                  placeholder="yourname@paytm"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getUpiValidationMessage(formData.paytmUpiId)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {getUpiValidationMessage(formData.paytmUpiId) && (
                  <p className="mt-1 text-sm text-red-500">
                    {getUpiValidationMessage(formData.paytmUpiId)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center">
                {settings.paytmQrCode ? (
                  <div className="text-center">
                    <div
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveQrPreview('paytm')}
                      dangerouslySetInnerHTML={{ __html: settings.paytmQrCode }}
                    />
                    <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <QrCode className="h-16 w-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">QR will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Google Pay */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center">
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs mr-2">G</span>
                    Google Pay UPI ID
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.googlePayUpiId}
                  onChange={(e) => setFormData({ ...formData, googlePayUpiId: e.target.value })}
                  placeholder="yourname@okicici"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    getUpiValidationMessage(formData.googlePayUpiId)
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {getUpiValidationMessage(formData.googlePayUpiId) && (
                  <p className="mt-1 text-sm text-red-500">
                    {getUpiValidationMessage(formData.googlePayUpiId)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center">
                {settings.googlePayQrCode ? (
                  <div className="text-center">
                    <div
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveQrPreview('gpay')}
                      dangerouslySetInnerHTML={{ __html: settings.googlePayQrCode }}
                    />
                    <p className="text-xs text-gray-500 mt-2">Click to enlarge</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <QrCode className="h-16 w-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">QR will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={loadPaymentSettings}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving ||
                !!getUpiValidationMessage(formData.phonePeUpiId) ||
                !!getUpiValidationMessage(formData.paytmUpiId) ||
                !!getUpiValidationMessage(formData.googlePayUpiId)
              }
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save & Generate QR Codes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Card */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Need help finding your UPI ID?</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <strong className="text-purple-600">PhonePe:</strong> Open PhonePe → Profile → Check under your name
            </div>
            <div>
              <strong className="text-blue-500">Paytm:</strong> Open Paytm → Profile → UPI ID & QR Code
            </div>
            <div>
              <strong className="text-green-500">Google Pay:</strong> Open GPay → Profile photo → Bank accounts → UPI ID
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Preview Modal */}
      {activeQrPreview && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveQrPreview(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {activeQrPreview === 'phonepe' && 'PhonePe QR Code'}
              {activeQrPreview === 'paytm' && 'Paytm QR Code'}
              {activeQrPreview === 'gpay' && 'Google Pay QR Code'}
            </h3>
            <div
              className="mx-auto"
              style={{ width: '250px' }}
              dangerouslySetInnerHTML={{
                __html:
                  activeQrPreview === 'phonepe'
                    ? settings.phonePeQrCode || ''
                    : activeQrPreview === 'paytm'
                    ? settings.paytmQrCode || ''
                    : settings.googlePayQrCode || '',
              }}
            />
            <p className="text-sm text-gray-500 mt-4">
              Customers will scan this QR code to pay
            </p>
            <button
              onClick={() => setActiveQrPreview(null)}
              className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
