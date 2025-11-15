/**
 * RESEND VERIFICATION EMAIL PAGE
 * 
 * Allows users to request a new verification email
 * Requires authentication
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include', // Send cookies
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Resend Verification Email
          </h1>
          <p className="text-gray-600">
            Didn't receive the verification email? We can send it again.
          </p>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Success!</p>
              <p className="text-sm text-green-700 mt-1">{message}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{message}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Check your spam/junk folder if you don't see the email in your inbox. 
            The verification link expires in 24 hours.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={isSubmitting || status === 'success'}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Home
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Already verified? <a href="/" className="text-orange-600 hover:text-orange-700 font-medium">Go to Home</a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Bantu's Kitchen © 2025
          </p>
        </div>
      </div>
    </div>
  );
}

