'use client';

/**
 * NEW FILE: Admin Audit Log Viewer
 * Purpose: Search, filter, and export compliance audit logs
 * 
 * Features:
 * - Search by user, entity, action
 * - Filter by date range, action type
 * - Export to CSV
 * - Pagination
 * - Real-time updates
 */

import { useState, useEffect } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export logs');
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('FAILED') || action.includes('BREACH') || action.includes('DELETED')) {
      return '#EF4444';
    }
    if (action.includes('SUCCESS') || action.includes('COMPLETED') || action.includes('ACCEPTED')) {
      return '#10B981';
    }
    if (action.includes('REQUESTED') || action.includes('PENDING')) {
      return '#F59E0B';
    }
    return '#3B82F6';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6B7280, #4B5563)',
          color: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <FileText size={40} />
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Audit Log Viewer</h1>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Complete compliance action history</p>
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

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Filter size={20} style={{ color: '#6B7280' }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Filters</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="User ID, entity ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Action Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                }}
              >
                <option value="">All Actions</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="LEGAL_ACCEPTED">Legal Accepted</option>
                <option value="DPO_REQUEST_CREATED">DPO Request</option>
                <option value="DELETION_REQUESTED">Deletion Request</option>
                <option value="BREACH_DETECTED">Breach Detected</option>
                <option value="DATA_ARCHIVED">Data Archived</option>
              </select>
            </div>

            {/* Entity Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Entity Type
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                }}
              >
                <option value="">All Types</option>
                <option value="user">User</option>
                <option value="order">Order</option>
                <option value="payment">Payment</option>
                <option value="security_breach">Security Breach</option>
                <option value="dpo_request">DPO Request</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <button
            onClick={() => setFilters({ search: '', action: '', entityType: '', startDate: '', endDate: '' })}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Logs Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6B7280' }}>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#6B7280' }}>
              No logs found
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Timestamp
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Action
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Entity
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        User
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        IP Address
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB' }}>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: `${getActionColor(log.action)}20`,
                            color: getActionColor(log.action),
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                          {log.entityType}
                          {log.entityId && (
                            <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF' }}>
                              {log.entityId.substring(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                          {log.userId ? `${log.userId.substring(0, 8)}...` : log.sessionId ? 'Guest' : '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280', fontFamily: 'monospace' }}>
                          {log.ipAddress || '-'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.details ? JSON.stringify(log.details).substring(0, 50) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{
                padding: '20px 24px',
                borderTop: '2px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                  Page {page} of {totalPages}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: page === 1 ? '#F3F4F6' : '#3B82F6',
                      color: page === 1 ? '#9CA3AF' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: page === totalPages ? '#F3F4F6' : '#3B82F6',
                      color: page === totalPages ? '#9CA3AF' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

