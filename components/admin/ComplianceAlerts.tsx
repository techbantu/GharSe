'use client';

/**
 * NEW FILE: Real-Time Compliance Alerts Component
 * Purpose: Toast notifications for CRITICAL alerts
 * 
 * Features:
 * - Auto-appears when CRITICAL alerts exist
 * - Color-coded by severity (RED/YELLOW/BLUE)
 * - Dismissible
 * - Links to relevant dashboards
 * - Badge count indicator
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Info, Clock } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  alertType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  createdAt: string;
}

export default function ComplianceAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/compliance/alerts', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: '#FEE2E2',
          border: '#EF4444',
          text: '#991B1B',
          icon: '#EF4444',
        };
      case 'HIGH':
        return {
          bg: '#FEF3C7',
          border: '#F59E0B',
          text: '#92400E',
          icon: '#F59E0B',
        };
      case 'MEDIUM':
        return {
          bg: '#DBEAFE',
          border: '#3B82F6',
          text: '#1E40AF',
          icon: '#3B82F6',
        };
      default:
        return {
          bg: '#F3F4F6',
          border: '#6B7280',
          text: '#374151',
          icon: '#6B7280',
        };
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return AlertTriangle;
      case 'MEDIUM':
        return Clock;
      default:
        return Info;
    }
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));
  const criticalCount = visibleAlerts.filter((a) => a.severity === 'CRITICAL').length;

  if (loading || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      zIndex: 9000,
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Alert Count Badge */}
      {criticalCount > 0 && (
        <div style={{
          backgroundColor: '#EF4444',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '999px',
          fontSize: '14px',
          fontWeight: 600,
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
        }}>
          {criticalCount} Critical Alert{criticalCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Alert Cards */}
      {visibleAlerts.slice(0, 5).map((alert) => {
        const colors = getAlertColor(alert.severity);
        const Icon = getAlertIcon(alert.severity);

        return (
          <div
            key={alert.id}
            style={{
              backgroundColor: colors.bg,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              animation: 'slide-in-right 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Icon size={24} style={{ color: colors.icon, flexShrink: 0, marginTop: '2px' }} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.text }}>
                    {alert.title}
                  </h3>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      marginLeft: '8px',
                      flexShrink: 0,
                    }}
                    aria-label="Dismiss alert"
                  >
                    <X size={20} style={{ color: colors.text }} />
                  </button>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: colors.text, lineHeight: '1.5' }}>
                  {alert.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>

                  {/* Link to relevant dashboard */}
                  {alert.alertType.includes('DPO') && (
                    <Link href="/admin/compliance/dpo-requests" style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: colors.border,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        View DPO Requests
                      </button>
                    </Link>
                  )}

                  {alert.alertType.includes('BREACH') && (
                    <Link href="/admin/compliance/security-breaches" style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: colors.border,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        View Breaches
                      </button>
                    </Link>
                  )}

                  {alert.alertType.includes('DELETION') && (
                    <Link href="/admin/compliance/deletion-requests" style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: colors.border,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        Review Deletions
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* "View All" link if more than 5 */}
      {visibleAlerts.length > 5 && (
        <Link href="/admin/compliance" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            color: '#3B82F6',
          }}>
            View All {visibleAlerts.length} Alerts →
          </div>
        </Link>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

