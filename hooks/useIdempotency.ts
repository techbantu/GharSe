/**
 * CLIENT-SIDE IDEMPOTENCY HOOK
 * 
 * Purpose: React hook for managing idempotency keys in client components
 * 
 * Usage:
 * ```typescript
 * 'use client';
 * 
 * import { useIdempotency } from '@/hooks/useIdempotency';
 * 
 * function OrderForm() {
 *   const { currentKey, generateKey, resetKey } = useIdempotency();
 *   
 *   const handleSubmit = async () => {
 *     const key = generateKey();
 *     await fetch('/api/orders', {
 *       method: 'POST',
 *       headers: { 'Idempotency-Key': key },
 *       body: JSON.stringify(orderData),
 *     });
 *   };
 *   
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import { generateIdempotencyKey } from '@/lib/idempotency';

export function useIdempotency() {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  
  const generateKey = useCallback(() => {
    const key = generateIdempotencyKey();
    setCurrentKey(key);
    return key;
  }, []);
  
  const resetKey = useCallback(() => {
    setCurrentKey(null);
  }, []);
  
  return {
    currentKey,
    generateKey,
    resetKey,
  };
}

