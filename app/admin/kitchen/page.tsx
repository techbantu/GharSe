'use client';

import React from 'react';
import KitchenDisplay from '@/components/admin/KitchenDisplay';

export default function KitchenPage() {
  return <KitchenDisplay autoRefresh={true} refreshInterval={30000} />;
}
