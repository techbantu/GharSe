/**
 * KITCHEN INTELLIGENCE TAB - For Kitchen Staff
 * 
 * Purpose: Embedded component for kitchen admin interface
 * Shows ONLY operational data (no revenue/money details)
 * 
 * Features:
 * - Real-time kitchen capacity
 * - Ingredient expiry alerts with actions
 * - Waste prevention metrics (quantities, not money)
 * - Operational recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingDown,
  Users,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Flame,
  Leaf,
  ChefHat,
} from 'lucide-react';

interface KitchenCapacity {
  currentOrders: number;
  maxCapacity: number;
  utilizationPercent: number;
  estimatedWaitMinutes: number;
  staffOnDuty: number;
  status: string;
  recommendation: string;
  timestamp: string;
}

interface IngredientAlert {
  ingredientId: string;
  ingredientName: string;
  hoursUntilExpiry: number;
  currentStock: number;
  unit: string;
  affectedMenuItems: string[];
  recommendedAction: string;
  urgencyLevel: string;
}

interface AlertsData {
  criticalAlerts: IngredientAlert[];
  highPriorityAlerts: IngredientAlert[];
  mediumPriorityAlerts: IngredientAlert[];
  lowStockAlerts: any[];
  summary: {
    totalAlertsCount: number;
    criticalCount: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
  };
}

export default function KitchenIntelligenceTab() {
  const [capacity, setCapacity] = useState<KitchenCapacity | null>(null);
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [capacityRes, alertsRes] = await Promise.all([
        fetch('/api/kitchen/capacity'),
        fetch('/api/ingredients/expiry-alerts'),
      ]);

      if (capacityRes.ok) {
        setCapacity(await capacityRes.json());
      }

      if (alertsRes.ok) {
        setAlerts(await alertsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch kitchen intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <RefreshCw size={32} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <p>Loading kitchen intelligence...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return '#10B981';
      case 'IDLE':
        return '#3B82F6';
      case 'OVERWHELMED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={28} />
              Kitchen Intelligence
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
              Real-time capacity and ingredient monitoring
            </p>
          </div>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 16px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Kitchen Status */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Kitchen Status</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0', color: getStatusColor(capacity?.status || '') }}>
                {capacity?.status}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {capacity?.currentOrders}/{capacity?.maxCapacity} orders
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: getStatusColor(capacity?.status || '') + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ChefHat size={24} color={getStatusColor(capacity?.status || '')} />
            </div>
          </div>
        </div>

        {/* Utilization */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Capacity</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}>
                {capacity?.utilizationPercent}%
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {capacity?.staffOnDuty} staff on duty
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#3B82F620',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={24} color="#3B82F6" />
            </div>
          </div>
        </div>

        {/* Wait Time */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Est. Wait Time</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}>
                {capacity?.estimatedWaitMinutes} min
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                Current orders
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#F59E0B20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={24} color="#F59E0B" />
            </div>
          </div>
        </div>

        {/* Ingredient Alerts */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Expiry Alerts</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0', color: alerts?.summary.criticalCount ? '#EF4444' : '#10B981' }}>
                {alerts?.summary.totalAlertsCount || 0}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                {alerts?.summary.criticalCount || 0} critical
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: alerts?.summary.criticalCount ? '#EF444420' : '#10B98120',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={24} color={alerts?.summary.criticalCount ? '#EF4444' : '#10B981'} />
            </div>
          </div>
        </div>
      </div>

      {/* Ingredient Expiry Alerts */}
      {alerts && (alerts.criticalAlerts.length > 0 || alerts.highPriorityAlerts.length > 0 || alerts.mediumPriorityAlerts.length > 0) && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} />
            Ingredient Expiry Alerts
          </h3>

          {/* Critical Alerts */}
          {alerts.criticalAlerts.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#EF4444', marginBottom: '8px' }}>
                🔴 CRITICAL (Action Required)
              </h4>
              {alerts.criticalAlerts.map((alert) => (
                <div
                  key={alert.ingredientId}
                  style={{
                    background: '#FEE2E2',
                    border: '2px solid #EF4444',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#7F1D1D' }}>
                        {alert.ingredientName}
                      </h5>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#991B1B' }}>
                        ⏰ <strong>{alert.hoursUntilExpiry.toFixed(1)} hours</strong> until expiry
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#991B1B' }}>
                        📦 Stock: {alert.currentStock} {alert.unit}
                      </p>
                      {alert.affectedMenuItems.length > 0 && (
                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#991B1B' }}>
                          🍽️ Used in: <strong>{alert.affectedMenuItems.length} items</strong>
                        </p>
                      )}
                    </div>
                    <div>
                      <span style={{
                        background: '#7F1D1D',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}>
                        USE NOW
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #FECACA' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', fontWeight: '500' }}>
                      💡 Recommendation: Prioritize orders with {alert.ingredientName} - Accept discounted orders to use stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* High Priority Alerts */}
          {alerts.highPriorityAlerts.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#F59E0B', marginBottom: '8px' }}>
                🟠 HIGH PRIORITY
              </h4>
              {alerts.highPriorityAlerts.map((alert) => (
                <div
                  key={alert.ingredientId}
                  style={{
                    background: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#78350F' }}>
                        {alert.ingredientName}
                      </h5>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#92400E' }}>
                        ⏰ {alert.hoursUntilExpiry.toFixed(1)} hours | 📦 {alert.currentStock} {alert.unit}
                      </p>
                    </div>
                    <span style={{
                      background: '#F59E0B',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      USE SOON
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medium Priority Alerts */}
          {alerts.mediumPriorityAlerts.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#3B82F6', marginBottom: '8px' }}>
                🟡 MEDIUM PRIORITY
              </h4>
              {alerts.mediumPriorityAlerts.map((alert) => (
                <div
                  key={alert.ingredientId}
                  style={{
                    background: '#DBEAFE',
                    border: '1px solid #3B82F6',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#1E3A8A' }}>{alert.ingredientName}</span>
                    <span style={{ marginLeft: '12px', color: '#1E40AF', fontSize: '14px' }}>
                      {alert.hoursUntilExpiry.toFixed(1)}h remaining • {alert.currentStock} {alert.unit}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#1E40AF' }}>Monitor</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Low Stock Alerts */}
      {alerts?.lowStockAlerts && alerts.lowStockAlerts.length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} />
            Low Stock Alerts
          </h3>
          {alerts.lowStockAlerts.map((alert) => (
            <div
              key={alert.ingredientId}
              style={{
                background: '#F3F4F6',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontWeight: 'bold' }}>{alert.ingredientName}</span>
                <span style={{ marginLeft: '12px', color: '#6B7280', fontSize: '14px' }}>
                  {alert.currentStock} {alert.unit} (minimum: {alert.minimumStock} {alert.unit})
                </span>
              </div>
              <span style={{
                background: '#EF4444',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                REORDER
              </span>
            </div>
          ))}
        </div>
      )}

      {/* No Alerts */}
      {alerts && alerts.criticalAlerts.length === 0 && alerts.highPriorityAlerts.length === 0 && alerts.mediumPriorityAlerts.length === 0 && (
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#10B981' }}>
            All Good! 🎉
          </h3>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            No ingredient expiry alerts. Kitchen is running smoothly.
          </p>
        </div>
      )}
    </div>
  );
}

