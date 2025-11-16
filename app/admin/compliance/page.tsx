'use client';

/**
 * NEW FILE: Central Compliance Dashboard (Admin)
 * Purpose: Real-time overview of ALL compliance systems
 * 
 * Features:
 * - Legal acceptance metrics
 * - DPO request tracking
 * - Deletion request monitoring
 * - Security breach alerts
 * - Data retention status
 * - Cookie consent analytics
 * - Real-time compliance alerts
 */

import { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Trash2,
  AlertTriangle,
  Database,
  Cookie,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function ComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/compliance/stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setError('');
      } else {
        setError('Failed to load compliance stats');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            border: '6px solid #E5E7EB', 
            borderTop: '6px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6B7280', fontSize: '18px' }}>Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <AlertTriangle size={64} style={{ color: '#EF4444', margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827' }}>Failed to Load Dashboard</h2>
          <p style={{ margin: '0 0 24px 0', color: '#6B7280' }}>{error || 'Unknown error'}</p>
          <button
            onClick={fetchStats}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, recentActivity } = stats;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          color: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Shield size={48} />
              <div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>Compliance Dashboard</h1>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Real-time monitoring • Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <button
              onClick={fetchStats}
              style={{
                padding: '12px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Critical Alerts */}
        {overview.alerts.critical > 0 && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '2px solid #EF4444',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <AlertTriangle size={32} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#991B1B' }}>
                {overview.alerts.critical} Critical Alert{overview.alerts.critical !== 1 ? 's' : ''}
              </h2>
              <p style={{ margin: 0, color: '#7F1D1D' }}>
                Immediate action required • Security breaches, overdue requests, or expired licenses
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          {/* Legal Acceptance */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <FileText size={32} style={{ color: '#3B82F6' }} />
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 600,
              }}>
                {overview.legalAcceptance.rate}%
              </span>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
              Legal Acceptance
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {overview.legalAcceptance.total.toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#6B7280' }}>
              <div>
                <TrendingUp size={16} style={{ display: 'inline', marginRight: '4px' }} />
                {overview.legalAcceptance.today} today
              </div>
            </div>
          </div>

          {/* DPO Requests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: overview.dpoRequests.overdue > 0 ? '2px solid #EF4444' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Users size={32} style={{ color: overview.dpoRequests.overdue > 0 ? '#EF4444' : '#10B981' }} />
              {overview.dpoRequests.overdue > 0 && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {overview.dpoRequests.overdue} OVERDUE
                </span>
              )}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
              DPO Requests
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {overview.dpoRequests.pending}
            </p>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              <div>✅ Completed: {overview.dpoRequests.completed}</div>
              <div>⏱️ Avg response: {overview.dpoRequests.averageResponseTime} days</div>
            </div>
          </div>

          {/* Deletion Requests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Trash2 size={32} style={{ color: '#F59E0B' }} />
              {overview.deletionRequests.withLegalHolds > 0 && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {overview.deletionRequests.withLegalHolds} HOLDS
                </span>
              )}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
              Deletion Requests
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {overview.deletionRequests.pending}
            </p>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              <div>✅ Executed: {overview.deletionRequests.executed}</div>
              <div>❌ Cancelled: {overview.deletionRequests.cancelled}</div>
            </div>
          </div>

          {/* Security Breaches */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: overview.securityBreaches.active > 0 ? '2px solid #EF4444' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <AlertTriangle size={32} style={{ color: overview.securityBreaches.active > 0 ? '#EF4444' : '#10B981' }} />
              {overview.securityBreaches.active > 0 && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {overview.securityBreaches.active} ACTIVE
                </span>
              )}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
              Security Breaches
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {overview.securityBreaches.total}
            </p>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              <div>📊 This month: {overview.securityBreaches.thisMonth}</div>
              <div>
                {overview.securityBreaches.unresolved === 0 
                  ? '✅ All resolved' 
                  : `⚠️ ${overview.securityBreaches.unresolved} unresolved`}
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Database size={32} style={{ color: '#8B5CF6' }} />
              {overview.dataRetention.approaching7Years > 0 && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#F3E8FF',
                  color: '#6B21A8',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {overview.dataRetention.approaching7Years} DUE
                </span>
              )}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
              Data Retention
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {overview.dataRetention.totalArchived}
            </p>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              <div>📦 Orders archived</div>
              <div>⏰ {overview.dataRetention.approaching7Years} approaching 7 years</div>
            </div>
          </div>

          {/* Cookie Consent */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Cookie size={32} style={{ color: '#F59E0B' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
              Cookie Consent
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {overview.cookieConsent.total}
            </p>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              <div>📊 Analytics: {overview.cookieConsent.analyticsOptIn}</div>
              <div>📢 Marketing: {overview.cookieConsent.marketingOptIn}</div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        {recentActivity.alerts.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            marginBottom: '32px',
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#111827', fontWeight: 600 }}>
              Recent Alerts ({recentActivity.alerts.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '16px',
                    backgroundColor: alert.severity === 'CRITICAL' ? '#FEE2E2' : '#FEF3C7',
                    border: `1px solid ${alert.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <AlertTriangle
                    size={20}
                    style={{ color: alert.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#111827', fontWeight: 600 }}>
                      {alert.title}
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280' }}>
                      {alert.description}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

