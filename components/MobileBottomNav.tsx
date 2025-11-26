/**
 * MOBILE BOTTOM NAVIGATION - App-like Navigation
 * 
 * Purpose: Provide mobile-first bottom navigation bar
 * 
 * Features:
 * - Fixed bottom navigation
 * - Active state indicators
 * - Cart badge with count
 * - Smooth transitions
 * - Safe area support
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, ShoppingBag, User, Menu } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const navItems: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/chefs', icon: Search, label: 'Chefs' },
    { href: '/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  // Don't show on admin pages or delivery app
  if (pathname.startsWith('/admin') || pathname.startsWith('/delivery')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all ${
                isActive 
                  ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.href === '/orders' && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

