/**
 * NEW PAGE: Admin User Deletion Request Review Dashboard
 * Purpose: Review and manage user data deletion requests with 30-day grace period
 * Compliance: DPDPA 2023 § 12 (Right to Erasure), GDPR Art. 17
 * 
 * Features:
 * - Pending deletion requests with countdown
 * - Legal hold flags (prevent deletion during litigation)
 * - Active orders check (cannot delete with pending orders)
 * - Manual approve/reject workflow
 * - Grace period cancellation tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { Trash2, Clock, AlertTriangle, CheckCircle, XCircle, Lock, ShoppingCart } from 'lucide-react';

interface DeletionRequest {
  id: string;
  userId: string;
  reason: string | null;
  requestedAt: Date;
  gracePeriodEnds: Date;
  cancelledAt: Date | null;
  executedAt: Date | null;
  hasLegalHold: boolean;
  hasActiveOrders: boolean;
  legalHoldReason: string | null;
  user: {
    name: string;
    email: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
  };
}

export default function DeletionRequestsDashboard() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    // Refresh every minute for countdown updates
    const interval = setInterval(fetchRequests, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      const response = await fetch('/api/admin/compliance/deletion-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch deletion requests:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTimeRemaining(gracePeriodEnds: Date): {
    days: number;
    hours: number;
    expired: boolean;
    critical: boolean;
  } {
    const deadline = new Date(gracePeriodEnds).getTime();
    const now = Date.now();
    const remaining = deadline - now;

    if (remaining <= 0) {
      return { days: 0, hours: 0, expired: true, critical: true };
    }

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const critical = days < 3; // Less than 3 days remaining

    return { days, hours, expired: false, critical };
  }

  async function toggleLegalHold(requestId: string, currentHold: boolean) {
    const reason = currentHold 
      ? null 
      : prompt('Enter reason for legal hold (e.g., pending litigation, tax audit):');
    
    if (!currentHold && !reason) return;

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/compliance/deletion-requests/legal-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, hold: !currentHold, reason }),
      });

      if (response.ok) {
        await fetchRequests();
        alert(currentHold ? 'Legal hold removed' : 'Legal hold applied');
      } else {
        alert('Failed to update legal hold');
      }
    } catch (error) {
      console.error('Legal hold error:', error);
      alert('Error updating legal hold');
    } finally {
      setProcessing(null);
    }
  }

  async function executeNow(requestId: string) {
    if (!confirm('Are you sure you want to execute this deletion NOW? This action is irreversible!')) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/compliance/deletion-requests/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        await fetchRequests();
        alert('User data deleted successfully');
      } else {
        const data = await response.json();
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert('Error executing deletion');
    } finally {
      setProcessing(null);
    }
  }

  async function rejectRequest(requestId: string) {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;

    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/compliance/deletion-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason }),
      });

      if (response.ok) {
        await fetchRequests();
        alert('Request rejected');
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Error rejecting request');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deletion requests...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => !r.executedAt && !r.cancelledAt);
  const executedRequests = requests.filter(r => r.executedAt);
  const cancelledRequests = requests.filter(r => r.cancelledAt);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Trash2 className="w-10 h-10 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Deletion Requests</h1>
              <p className="text-gray-600 mt-1">30-Day Grace Period | Right to Erasure (DPDPA § 12)</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingRequests.length}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Legal Holds</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {pendingRequests.filter(r => r.hasLegalHold).length}
                </p>
              </div>
              <Lock className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Executed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{executedRequests.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{cancelledRequests.length}</p>
              </div>
              <XCircle className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" />
              Pending Deletion Requests
            </h2>
            <div className="space-y-4">
              {pendingRequests.map(request => {
                const timeRemaining = calculateTimeRemaining(request.gracePeriodEnds);
                const isProcessing = processing === request.id;

                return (
                  <div
                    key={request.id}
                    className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                      request.hasLegalHold ? 'border-red-500' :
                      request.hasActiveOrders ? 'border-yellow-500' :
                      timeRemaining.critical ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-6">
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{request.user.name}</h3>
                          {request.hasLegalHold && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              <Lock className="w-4 h-4" />
                              Legal Hold
                            </span>
                          )}
                          {request.hasActiveOrders && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                              <ShoppingCart className="w-4 h-4" />
                              Active Orders
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <p><strong>Email:</strong> {request.user.email}</p>
                            <p><strong>Phone:</strong> {request.user.phone}</p>
                          </div>
                          <div>
                            <p><strong>Total Orders:</strong> {request.user.totalOrders}</p>
                            <p><strong>Total Spent:</strong> ₹{request.user.totalSpent.toLocaleString()}</p>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700"><strong>Reason:</strong> {request.reason}</p>
                          </div>
                        )}

                        {request.hasLegalHold && request.legalHoldReason && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-3">
                            <p className="text-sm text-red-800"><strong>Legal Hold Reason:</strong> {request.legalHoldReason}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Requested: {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions & Countdown */}
                      <div className="text-right space-y-3">
                        {/* Countdown */}
                        {timeRemaining.expired ? (
                          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
                            <p className="text-red-800 font-bold">⚠️ READY</p>
                            <p className="text-red-600 text-sm mt-1">Grace period ended</p>
                          </div>
                        ) : (
                          <div className={`border-2 rounded-lg p-4 ${
                            timeRemaining.critical ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-300'
                          }`}>
                            <p className={`font-bold text-2xl ${timeRemaining.critical ? 'text-orange-600' : 'text-blue-600'}`}>
                              {timeRemaining.days}d {timeRemaining.hours}h
                            </p>
                            <p className={`text-sm mt-1 ${timeRemaining.critical ? 'text-orange-600' : 'text-blue-600'}`}>
                              remaining
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <button
                            onClick={() => toggleLegalHold(request.id, request.hasLegalHold)}
                            disabled={isProcessing}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              request.hasLegalHold
                                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {request.hasLegalHold ? 'Remove Hold' : 'Apply Legal Hold'}
                          </button>

                          {!request.hasLegalHold && !request.hasActiveOrders && (
                            <button
                              onClick={() => executeNow(request.id)}
                              disabled={isProcessing}
                              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm font-semibold"
                            >
                              Execute Now
                            </button>
                          )}

                          <button
                            onClick={() => rejectRequest(request.id)}
                            disabled={isProcessing}
                            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm font-semibold"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pendingRequests.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">No Pending Deletion Requests</p>
            <p className="text-gray-600 mt-2">All requests have been processed ✅</p>
          </div>
        )}
      </div>
    </div>
  );
}
