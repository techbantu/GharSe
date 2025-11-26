/**
 * OFFLINE PAGE - PWA Fallback
 * 
 * Purpose: Show when user is offline and page isn't cached
 */

'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-12 h-12 text-gray-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          You&apos;re Offline
        </h1>
        
        <p className="text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection. 
          Please check your connection and try again.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800/50 rounded-xl">
          <h3 className="text-white font-medium mb-2">What you can do offline:</h3>
          <ul className="text-sm text-gray-400 text-left space-y-1">
            <li>• View previously loaded pages</li>
            <li>• Check your order history (if cached)</li>
            <li>• Browse the menu (if cached)</li>
          </ul>
        </div>
        
        <p className="text-gray-500 text-sm mt-6">
          GharSe works best with an internet connection
        </p>
      </div>
    </div>
  );
}

