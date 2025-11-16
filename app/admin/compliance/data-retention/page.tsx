'use client';

/**
 * NEW FILE: Admin Data Retention Dashboard
 * Purpose: Manage 7-year data retention for tax compliance
 * 
 * Features:
 * - View orders approaching 7 years
 * - View archived orders
 * - Manual archive/restore controls
 * - Tax year breakdown
 * - Search archived orders
 * - Export to CSV
 */

import { useState, useEffect } from 'react';
import { Database, Archive, RotateCcw, Download, Search, Calendar, AlertTriangle } from 'lucide-react';

export default function DataRetentionDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaxYear, setSelectedTaxYear] = useState('all');

  useEffect(() => {
    fetchRetentionData();
  }, []);

  const fetchRetentionData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/compliance/retention', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch retention data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualArchive = async (orderId: string) => {
    if (!confirm('Archive this order? This will move it to long-term storage for tax compliance.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/compliance/retention/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        alert('Order archived successfully');
        await fetchRetentionData();
      } else {
        alert('Failed to archive order');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        taxYear: selectedTaxYear !== 'all' ? selectedTaxYear : '',
      });

      const response = await fetch(`/api/admin/compliance/retention?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archived-orders-${selectedTaxYear}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Export failed');
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
            borderTop: '6px solid #8B5CF6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6B7280', fontSize: '18px' }}>Loading retention data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ color: '#6B7280' }}>Failed to load data</p>
      </div>
    );
  }

  const filteredOrders = data.approachingOrders?.filter((order: any) => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          color: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Database size={40} />
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Data Retention Dashboard</h1>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>7-year tax compliance • Income Tax Act 1961</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Archive size={32} style={{ color: '#8B5CF6' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Archived Orders</h3>
            </div>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>
              {data.archivedCount || 0}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
              Retained for tax compliance
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: data.approachingCount > 0 ? '2px solid #F59E0B' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <AlertTriangle size={32} style={{ color: '#F59E0B' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Approaching 7 Years</h3>
            </div>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>
              {data.approachingCount || 0}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
              Orders due for archival
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Calendar size={32} style={{ color: '#3B82F6' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Current Tax Year</h3>
            </div>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>
              FY2024-25
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
              Active retention period
            </p>
          </div>
        </div>

        {/* Tax Year Breakdown */}
        {data.byTaxYear && data.byTaxYear.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              Archived Orders by Tax Year
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {data.byTaxYear.map((item: any) => (
                <div key={item.taxYear} style={{
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                    {item.taxYear}
                  </p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6' }}>
                    {item._count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Approaching 7 Years */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '24px', borderBottom: '2px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>
                Orders Approaching 7-Year Mark ({data.approachingCount})
              </h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      paddingLeft: '40px',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      width: '250px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', color: '#6B7280' }}>
                {searchTerm ? 'No orders found matching your search' : 'No orders approaching 7-year mark'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Order Number
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Customer
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Order Date
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Age (Years)
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Tax Year
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any, index: number) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>
                        {order.orderNumber}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                        {order.customerEmail}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: order.ageYears >= 6.8 ? '#FEF3C7' : '#E0E7FF',
                          color: order.ageYears >= 6.8 ? '#92400E' : '#3730A3',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {order.ageYears.toFixed(1)} years
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                        {order.taxYear || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleManualArchive(order.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#8B5CF6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Archive size={16} />
                          Archive Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

