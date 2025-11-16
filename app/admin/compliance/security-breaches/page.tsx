/**
 * NEW PAGE: Admin Security Breach Management Dashboard
 * Purpose: Monitor and manage security breaches with 72-hour SLA enforcement
 * Compliance: DPDPA 2023 § 6 (Security breach notification within 72 hours)
 * 
 * Features:
 * - Real-time breach list with severity badges
 * - 72-hour countdown timer (visual urgency)
 * - Bulk notification actions
 * - Mitigation tracking
 * - Affected user management
 */

'use client';

import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Clock, Users, CheckCircle, XCircle, Send } from 'lucide-react';

interface SecurityBreach {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  breachType: string;
  affectedRecords: number;
  affectedUsers: string[];
  detectedAt: Date;
  notifiedAt: Date | null;
  resolvedAt: Date | null;
  dpbReportedAt: Date | null;
  description: string;
  rootCause: string | null;
  mitigationSteps: any;
}

export default function SecurityBreachesDashboard() {
  const [breaches, setBreaches] = useState<SecurityBreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBreaches, setSelectedBreaches] = useState<Set<string>>(new Set());
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    fetchBreaches();
    // Refresh every 30 seconds for real-time countdowns
    const interval = setInterval(fetchBreaches, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchBreaches() {
    try {
      const response = await fetch('/api/admin/security/breaches');
      if (response.ok) {
        const data = await response.json();
        setBreaches(data.breaches || []);
      }
    } catch (error) {
      console.error('Failed to fetch breaches:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTimeRemaining(detectedAt: Date, notifiedAt: Date | null): {
    hours: number;
    minutes: number;
    expired: boolean;
    critical: boolean;
  } {
    if (notifiedAt) {
      return { hours: 0, minutes: 0, expired: false, critical: false };
    }

    const detected = new Date(detectedAt).getTime();
    const deadline = detected + (72 * 60 * 60 * 1000); // 72 hours
    const now = Date.now();
    const remaining = deadline - now;

    if (remaining <= 0) {
      return { hours: 0, minutes: 0, expired: true, critical: true };
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const critical = hours < 24; // Less than 24 hours remaining

    return { hours, minutes, expired: false, critical };
  }

  async function notifyUsers(breachId: string) {
    setNotifying(true);
    try {
      const response = await fetch('/api/admin/security/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breachId }),
      });

      if (response.ok) {
        await fetchBreaches();
        alert('Notifications sent successfully!');
      } else {
        alert('Failed to send notifications');
      }
    } catch (error) {
      console.error('Notification error:', error);
      alert('Error sending notifications');
    } finally {
      setNotifying(false);
    }
  }

  async function bulkNotify() {
    if (selectedBreaches.size === 0) {
      alert('Please select breaches to notify');
      return;
    }

    setNotifying(true);
    try {
      const promises = Array.from(selectedBreaches).map(id =>
        fetch('/api/admin/security/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ breachId: id }),
        })
      );

      await Promise.all(promises);
      await fetchBreaches();
      setSelectedBreaches(new Set());
      alert('Bulk notifications sent successfully!');
    } catch (error) {
      console.error('Bulk notification error:', error);
      alert('Error sending bulk notifications');
    } finally {
      setNotifying(false);
    }
  }

  function toggleSelection(breachId: string) {
    const newSelection = new Set(selectedBreaches);
    if (newSelection.has(breachId)) {
      newSelection.delete(breachId);
    } else {
      newSelection.add(breachId);
    }
    setSelectedBreaches(newSelection);
  }

  const severityColors = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading breaches...</p>
        </div>
      </div>
    );
  }

  const activeBreaches = breaches.filter(b => !b.notifiedAt);
  const resolvedBreaches = breaches.filter(b => b.notifiedAt);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-red-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Security Breach Management</h1>
                <p className="text-gray-600 mt-1">72-Hour Notification SLA Enforcement (DPDPA § 6)</p>
              </div>
            </div>
            {selectedBreaches.size > 0 && (
              <button
                onClick={bulkNotify}
                disabled={notifying}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
                Notify Selected ({selectedBreaches.size})
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Breaches</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{activeBreaches.length}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{resolvedBreaches.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Affected Users</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {breaches.reduce((sum, b) => sum + b.affectedUsers.length, 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {breaches.filter(b => b.severity === 'CRITICAL').length}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Active Breaches */}
        {activeBreaches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-red-500" />
              Active Breaches (Notification Pending)
            </h2>
            <div className="space-y-4">
              {activeBreaches.map(breach => {
                const timeRemaining = calculateTimeRemaining(breach.detectedAt, breach.notifiedAt);
                const isSelected = selectedBreaches.has(breach.id);

                return (
                  <div
                    key={breach.id}
                    className={`bg-white rounded-lg shadow-sm border-2 ${
                      timeRemaining.expired ? 'border-red-500' : timeRemaining.critical ? 'border-orange-500' : 'border-gray-200'
                    } p-6`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(breach.id)}
                          className="mt-1 w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${severityColors[breach.severity]}`}>
                              {breach.severity}
                            </span>
                            <span className="text-sm text-gray-500">{breach.breachType}</span>
                          </div>
                          <p className="text-gray-900 font-medium mb-2">{breach.description}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {breach.affectedUsers.length} users affected
                            </span>
                            <span>{breach.affectedRecords} records</span>
                            <span>Detected: {new Date(breach.detectedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Countdown Timer */}
                      <div className="text-right">
                        {timeRemaining.expired ? (
                          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
                            <p className="text-red-800 font-bold text-lg">⚠️ SLA VIOLATED</p>
                            <p className="text-red-600 text-sm mt-1">72 hours exceeded</p>
                          </div>
                        ) : (
                          <div className={`border-2 rounded-lg p-4 ${
                            timeRemaining.critical ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-300'
                          }`}>
                            <p className={`font-bold text-2xl ${timeRemaining.critical ? 'text-orange-600' : 'text-blue-600'}`}>
                              {timeRemaining.hours}h {timeRemaining.minutes}m
                            </p>
                            <p className={`text-sm mt-1 ${timeRemaining.critical ? 'text-orange-600' : 'text-blue-600'}`}>
                              {timeRemaining.critical ? '⚠️ URGENT' : 'remaining'}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => notifyUsers(breach.id)}
                          disabled={notifying}
                          className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm font-semibold"
                        >
                          Notify Users
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Breaches */}
        {resolvedBreaches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Resolved Breaches (Notified)
            </h2>
            <div className="space-y-4">
              {resolvedBreaches.map(breach => (
                <div key={breach.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${severityColors[breach.severity]}`}>
                          {breach.severity}
                        </span>
                        <span className="text-sm text-gray-500">{breach.breachType}</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <p className="text-gray-900 font-medium">{breach.description}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Notified: {new Date(breach.notifiedAt!).toLocaleString()} • {breach.affectedUsers.length} users
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {breaches.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">No Security Breaches Detected</p>
            <p className="text-gray-600 mt-2">All systems are secure ✅</p>
          </div>
        )}
      </div>
    </div>
  );
}
