/**
 * ClientOnly Component - Renders children only on the client side
 * 
 * Purpose: Completely bypasses SSR to prevent hydration mismatches
 * for components that depend on client-side state like cart, auth, etc.
 * 
 * Usage:
 * <ClientOnly fallback={<span>Loading...</span>}>
 *   <CartBadge count={itemCount} />
 * </ClientOnly>
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ClientOnly;

