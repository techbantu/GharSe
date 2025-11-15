/**
 * ADMIN CHEF MANAGEMENT - Multi-Chef Platform Administration
 * 
 * Purpose: Admin interface to manage chef applications and operations
 * 
 * Features:
 * - Approve/reject chef registrations
 * - Verify chef credentials (FSSAI, GST)
 * - Suspend/activate chefs
 * - Process payouts
 * - View chef analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { isMultiChefMode } from '@/lib/feature-flags';

interface Chef {
  id: string;
  businessName: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  status: string;
  isVerified: boolean;
  fssaiNumber: string | null;
  gstNumber: string | null;
  commissionRate: number;
  subscriptionTier: string;
  createdAt: string;
  _count?: {
    orders: number;
    menuItems: number;
  };
}

export default function AdminChefManagement() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    if (!isMultiChefMode()) {
      return; // Hide if multi-chef mode not enabled
    }

    loadChefs();
  }, [filterStatus]);

  const loadChefs = async () => {
    try {
      setLoading(true);
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/chefs${statusParam}`);
      
      if (res.ok) {
        const data = await res.json();
        setChefs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load chefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChefStatus = async (chefId: string, newStatus: string) => {
    try {
      const chef = chefs.find(c => c.id === chefId);
      if (!chef) return;

      const res = await fetch(`/api/chefs/${chef.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadChefs(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to update chef status:', error);
    }
  };

  const verifyChef = async (chefId: string) => {
    try {
      const chef = chefs.find(c => c.id === chefId);
      if (!chef) return;

      const res = await fetch(`/api/chefs/${chef.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true }),
      });

      if (res.ok) {
        loadChefs();
      }
    } catch (error) {
      console.error('Failed to verify chef:', error);
    }
  };

  const generatePayouts = async () => {
    try {
      const period = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, generateAll: true }),
      });

      if (res.ok) {
        alert('Payouts generated successfully!');
        setShowPayoutModal(false);
      }
    } catch (error) {
      console.error('Failed to generate payouts:', error);
      alert('Failed to generate payouts');
    }
  };

  if (!isMultiChefMode()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Multi-chef mode is not enabled</p>
          <p className="text-gray-400 text-sm mt-2">
            Enable MULTI_CHEF_ENABLED in environment variables
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chefs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chef Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage chef applications, verification, and payouts
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                💵 Generate Payouts
              </button>
              <button
                onClick={loadChefs}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex space-x-2">
            {['all', 'PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Chefs' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Chefs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chef
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chefs.map((chef) => (
                <tr key={chef.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{chef.businessName}</div>
                      <div className="text-sm text-gray-500">{chef.name}</div>
                      <div className="text-xs text-gray-400">@{chef.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{chef.email}</div>
                    <div className="text-sm text-gray-500">{chef.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        {chef.isVerified ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <span className="text-red-600">✗ Not Verified</span>
                        )}
                      </div>
                      {chef.fssaiNumber && (
                        <div className="text-xs text-gray-500">FSSAI: {chef.fssaiNumber}</div>
                      )}
                      {chef.gstNumber && (
                        <div className="text-xs text-gray-500">GST: {chef.gstNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{chef._count?.orders || 0} orders</div>
                    <div>{chef._count?.menuItems || 0} items</div>
                    <div className="text-xs text-orange-600">
                      {chef.commissionRate * 100}% commission
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        chef.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : chef.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : chef.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {chef.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {chef.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateChefStatus(chef.id, 'ACTIVE')}
                          className="text-green-600 hover:text-green-900"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => updateChefStatus(chef.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {chef.status === 'ACTIVE' && !chef.isVerified && (
                      <button
                        onClick={() => verifyChef(chef.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ✓ Verify
                      </button>
                    )}
                    {chef.status === 'ACTIVE' && (
                      <button
                        onClick={() => updateChefStatus(chef.id, 'SUSPENDED')}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        ⏸ Suspend
                      </button>
                    )}
                    {chef.status === 'SUSPENDED' && (
                      <button
                        onClick={() => updateChefStatus(chef.id, 'ACTIVE')}
                        className="text-green-600 hover:text-green-900"
                      >
                        ▶ Activate
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedChef(chef)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      👁 View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chefs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No chefs found</p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Payouts</h2>
            <p className="text-gray-600 mb-6">
              This will generate payouts for all active chefs for the current month.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={generatePayouts}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chef Details Modal */}
      {selectedChef && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedChef.businessName}</h2>
              <button
                onClick={() => setSelectedChef(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div><strong>Owner:</strong> {selectedChef.name}</div>
              <div><strong>Email:</strong> {selectedChef.email}</div>
              <div><strong>Phone:</strong> {selectedChef.phone}</div>
              <div><strong>Status:</strong> {selectedChef.status}</div>
              <div><strong>Verified:</strong> {selectedChef.isVerified ? 'Yes' : 'No'}</div>
              <div><strong>Commission:</strong> {selectedChef.commissionRate * 100}%</div>
              <div><strong>Subscription:</strong> {selectedChef.subscriptionTier}</div>
              <div><strong>Joined:</strong> {new Date(selectedChef.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

