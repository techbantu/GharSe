'use client';

import React from 'react';
import KitchenOrders from '@/components/admin/KitchenOrders';

export default function KitchenPage() {
  return <KitchenOrders autoRefresh={true} refreshInterval={30000} />;
}
