'use client';

/**
 * Admin DPO Request Dashboard
 * Purpose: Manage DPO requests with 30-day SLA tracking
 * 
 * Features:
 * - SLA countdown (RED if <7 days, YELLOW if <14 days)
 * - Response templates for quick replies
 * - Filter by request type and status
 * - Search by email/reference
 * - Overdue requests highlighted
 */

import { useState, useEffect } from 'react';
import { Users, Clock, Mail, Search, AlertTriangle, CheckCircle, Send } from 'lucide-react';

const RESPONSE_TEMPLATES = {
  DATA_ACCESS: `Thank you for your data access request.

Please find attached a complete export of your personal data stored in our systems, including:

• Account information (name, email, phone)
• Order history and transaction records  
• Saved addresses and payment methods
• Communication preferences

This data is provided in JSON format for portability as required by GDPR Article 20.

If you have any questions, please contact our Data Protection Officer.`,

  DATA_DELETION: `Thank you for your data deletion request.

We are processing your request in accordance with GDPR Article 17 (Right to Erasure). Your account will enter a 30-day grace period during which you can cancel the deletion.

After the grace period:
• Your account will be anonymized
• Personal data will be removed
• Order history will be retained for 7 years (tax compliance)

You will receive a final confirmation email once the deletion is complete.`,

  DATA_CORRECTION: `Thank you for your data correction request.

We have reviewed your request and updated the following information in our systems:

[Please specify what was corrected]

The changes are now live and will be reflected in all future communications and orders.

If you notice any remaining inaccuracies, please let us know.`,

  CONSENT_WITHDRAWAL: `Thank you for your consent withdrawal request.

We have successfully processed your request to withdraw consent for:

[Please specify which consent was withdrawn]

You will no longer receive:
• Marketing communications (if marketing consent withdrawn)
• Analytics tracking (if analytics consent withdrawn)

Essential service communications will continue as required for order fulfillment.`,
};

export default function DPORequestDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [filters]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({
        admin: 'true',
        status: filters.status !== 'all' ? filters.status : '',
        type: filters.type !== 'all' ? filters.type : '',
      });

      const response = await fetch(`/api/legal/dpo-request?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch DPO requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = (request: any) => {
    setSelectedRequest(request);
    setResponse('');
  };

  const handleUseTemplate = (type: string) => {
    setResponse(RESPONSE_TEMPLATES[type as keyof typeof RESPONSE_TEMPLATES] || '');
  };

  const handleSendResponse = async () => {
    if (!selectedRequest || !response.trim()) {
      alert('Please enter a response');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/legal/dpo-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: 'respond',
          response: response.trim(),
        }),
      });

      if (res.ok) {
        alert('Response sent successfully!');
        setSelectedRequest(null);
        setResponse('');
        await fetchRequests();
      } else {
        alert('Failed to send response');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsSending(false);
    }
  };

  const getSLAColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return { bg: '#FEE2E2', text: '#991B1B', badge: '#EF4444' };
    if (daysRemaining < 7) return { bg: '#FEF3C7', text: '#92400E', badge: '#F59E0B' };
    if (daysRemaining < 14) return { bg: '#FEF3C7', text: '#92400E', badge: '#F59E0B' };
    return { bg: '#ECFDF5', text: '#065F46', badge: '#10B981' };
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = filters.search === '' || 
      req.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      req.id.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => {
    // Overdue requests first
    if (a.daysRemaining < 0 && b.daysRemaining >= 0) return -1;
    if (a.daysRemaining >= 0 && b.daysRemaining < 0) return 1;
    // Then by days remaining (ascending)
    return a.daysRemaining - b.daysRemaining;
  });

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6B7280' }}>Loading DPO requests...</p>
    </div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: 'white',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Users size={40} />
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>DPO Request Dashboard</h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>30-day SLA tracking • DPDPA 2023 § 12(2)</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280' }}>Pending</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#F59E0B' }}>{stats.pending}</p>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', border: stats.overdue > 0 ? '2px solid #EF4444' : 'none' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280' }}>Overdue</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#EF4444' }}>{stats.overdue}</p>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280' }}>Completed</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>{stats.completed}</p>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6B7280' }}>Avg Response</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#3B82F6' }}>{stats.averageResponseTime}d</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search email or reference..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ width: '100%', paddingLeft: '40px', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' }}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' }}
            >
              <option value="all">All Types</option>
              <option value="DATA_ACCESS">Data Access</option>
              <option value="DATA_DELETION">Data Deletion</option>
              <option value="DATA_CORRECTION">Data Correction</option>
              <option value="CONSENT_WITHDRAWAL">Consent Withdrawal</option>
            </select>
          </div>
        </div>

        {/* Requests Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Requests List */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '2px solid #E5E7EB' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
                Requests ({filteredRequests.length})
              </h2>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {filteredRequests.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
                  No requests found
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const colors = getSLAColor(req.daysRemaining);
                  return (
                    <div
                      key={req.id}
                      onClick={() => handleSelectRequest(req)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #E5E7EB',
                        cursor: 'pointer',
                        backgroundColor: selectedRequest?.id === req.id ? '#F3F4F6' : 'white',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={16} style={{ color: '#6B7280' }} />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            {req.email}
                          </span>
                        </div>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {req.daysRemaining < 0
                            ? `${Math.abs(req.daysRemaining)}d OVERDUE`
                            : `${req.daysRemaining}d left`
                          }
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                        <span>{req.requestType.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>#{req.referenceNumber}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Response Panel */}
          {selectedRequest && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '2px solid #E5E7EB' }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#111827' }}>
                  Respond to Request
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                  {selectedRequest.email} • {selectedRequest.requestType.replace('_', ' ')}
                </p>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Response Templates */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                    Quick Templates
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.keys(RESPONSE_TEMPLATES).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleUseTemplate(type)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Text */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                    Response
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    rows={12}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendResponse}
                    disabled={isSending || !response.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: isSending || !response.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSending || !response.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Send size={16} />
                    {isSending ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

