/**
 * SETUP CHECKER PAGE
 * 
 * Visual dashboard showing all configuration status
 * Shows exactly what API keys are missing
 */

'use client';

import React, { useState, useEffect } from 'react';

interface ValidationResult {
  category: string;
  service: string;
  status: 'configured' | 'missing' | 'error';
  required: boolean;
  message: string;
  envVars?: string[];
  setupInstructions?: string;
}

interface SetupStatus {
  overallStatus: 'complete' | 'partial' | 'missing-critical';
  score: number;
  totalChecks: number;
  passedChecks: number;
  results: ValidationResult[];
  criticalIssues: string[];
  recommendations: string[];
}

export default function SetupChecker() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    loadSetupStatus();
  }, []);

  const loadSetupStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/setup/validate');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testService = async (serviceName: string) => {
    try {
      const res = await fetch(`/api/setup/validate?service=${serviceName}`);
      const data = await res.json();
      alert(data.success ? `✅ ${data.message}` : `❌ ${data.message}`);
    } catch (error) {
      alert('❌ Test failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking setup...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Failed to load setup status</p>
          <button
            onClick={loadSetupStatus}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Group results by category
  const groupedResults = status.results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, ValidationResult[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 bg-green-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      case 'missing-critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getResultStatusBadge = (result: ValidationResult) => {
    if (result.status === 'configured') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ Configured</span>;
    }
    if (result.required) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">❌ Required</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">⚠️ Optional</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Setup Configuration</h1>
              <p className="text-sm text-gray-500 mt-1">
                Complete setup status and API key checker
              </p>
            </div>
            <button
              onClick={loadSetupStatus}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status Card */}
        <div className={`rounded-lg p-6 mb-8 ${getStatusColor(status.overallStatus)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {status.overallStatus === 'complete' && '🎉 Setup Complete!'}
                {status.overallStatus === 'partial' && '⚠️ Partial Setup'}
                {status.overallStatus === 'missing-critical' && '❌ Critical Issues'}
              </h2>
              <p className="text-lg">
                {status.passedChecks} of {status.totalChecks} checks passed
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{status.score}%</div>
              <div className="text-sm opacity-75">Setup Score</div>
            </div>
          </div>
        </div>

        {/* Critical Issues */}
        {status.criticalIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">🚨</span>
              Critical Issues ({status.criticalIssues.length})
            </h3>
            <ul className="space-y-2">
              {status.criticalIssues.map((issue, idx) => (
                <li key={idx} className="text-red-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {status.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Recommendations ({status.recommendations.length})
            </h3>
            <ul className="space-y-2">
              {status.recommendations.map((rec, idx) => (
                <li key={idx} className="text-blue-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Results by Category */}
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([category, results]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">{category}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {results.map((result, idx) => (
                  <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {result.service}
                          </h4>
                          {getResultStatusBadge(result)}
                        </div>
                        <p className="text-gray-600 mb-3">{result.message}</p>

                        {/* Environment Variables */}
                        {result.envVars && result.envVars.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Environment Variables:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {result.envVars.map((envVar) => (
                                <code
                                  key={envVar}
                                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono"
                                >
                                  {envVar}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Setup Instructions */}
                        {result.setupInstructions && (
                          <div className="mt-3">
                            <button
                              onClick={() =>
                                setExpandedService(
                                  expandedService === result.service ? null : result.service
                                )
                              }
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center"
                            >
                              {expandedService === result.service ? '▼' : '▶'} Setup Instructions
                            </button>
                            {expandedService === result.service && (
                              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                  {result.setupInstructions}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Test Button for testable services */}
                      {['database', 'redis', 'email'].includes(result.service.toLowerCase().split(' ')[0]) && (
                        <button
                          onClick={() => testService(result.service.toLowerCase().split(' ')[0])}
                          className="ml-4 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                        >
                          Test
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Setup Guide */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📚 Quick Setup Guide
          </h3>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>1. Create .env file</strong> in project root (copy from .env.example)
            </p>
            <p>
              <strong>2. Set DATABASE_URL</strong> - Required for app to work
            </p>
            <p>
              <strong>3. Configure Email</strong> - For order confirmations (Gmail, SendGrid, or Resend)
            </p>
            <p>
              <strong>4. Configure Payments</strong> - Razorpay (India) or Stripe (International)
            </p>
            <p>
              <strong>5. Optional:</strong> Twilio (SMS), Cloudinary (Images), Redis (Caching), OpenAI (AI Chat)
            </p>
            <p className="mt-4 text-sm text-gray-600">
              💡 Tip: All missing API keys are listed above with signup links and setup instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


