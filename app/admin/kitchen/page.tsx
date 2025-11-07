/**
 * NEW FILE: Kitchen View Page - KOT Display
 * 
 * Purpose: Dedicated page for kitchen staff to view all active orders in KOT format.
 * This page displays orders in beautiful, printable cards with all necessary information.
 */

'use client';

import React from 'react';
import KitchenOrders from '@/components/admin/KitchenOrders';

export default function KitchenPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)',
      padding: '24px'
    }}>
      <KitchenOrders autoRefresh={true} refreshInterval={30000} />
    </div>
  );
}

