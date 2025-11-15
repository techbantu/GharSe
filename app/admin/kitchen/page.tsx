'use client';

/**
 * UPDATED FILE: Kitchen View Page - With Intelligence Tab
 * 
 * Purpose: Unified kitchen interface with tabs:
 * - Orders Tab: KOT display for active orders
 * - Intelligence Tab: Real-time capacity and ingredient alerts
 * 
 * This keeps everything kitchen staff needs in one place.
 */

import React, { useState } from 'react';
import KitchenOrders from '@/components/admin/KitchenOrders';
import KitchenIntelligenceTab from '@/components/admin/KitchenIntelligenceTab';
import { Package, Activity } from 'lucide-react';

export default function KitchenPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'intelligence'>('orders');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)',
      padding: '24px'
    }}>
      {/* Tab Navigation */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '24px',
        display: 'flex',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: activeTab === 'orders' ? '#3B82F6' : 'transparent',
            color: activeTab === 'orders' ? 'white' : '#6B7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Package size={20} />
          Orders (KOT)
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: activeTab === 'intelligence' ? '#3B82F6' : 'transparent',
            color: activeTab === 'intelligence' ? 'white' : '#6B7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Activity size={20} />
          Kitchen Intelligence
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' ? (
        <KitchenOrders autoRefresh={true} refreshInterval={30000} />
      ) : (
        <KitchenIntelligenceTab />
      )}
    </div>
  );
}

