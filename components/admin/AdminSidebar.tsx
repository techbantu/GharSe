'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut, 
  X,
  ChefHat
} from 'lucide-react';
import Logo from '@/components/Logo';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard size={20} />,
      exact: true
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: <ShoppingBag size={20} />
    },
    {
      name: 'Menu',
      href: '/admin/menu',
      icon: <UtensilsCrossed size={20} />
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: <Users size={20} />
    },
    {
      name: 'Finance',
      href: '/admin/finance',
      icon: <DollarSign size={20} />
    },
    {
      name: 'Kitchen',
      href: '/admin/kitchen',
      icon: <ChefHat size={20} />
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings size={20} />
    }
  ];

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s'
        }}
        className="lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          height: '100%',
          width: '16rem',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        className={`
          ${isOpen ? '' : '-translate-x-full'} 
          lg:translate-x-0 lg:shadow-none
          transition-transform duration-300
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div style={{ 
            height: '4rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 1rem',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <Logo variant="small" style={{ maxWidth: '120px' }} />
            <button 
              onClick={onClose}
              className="lg:hidden"
              style={{
                padding: '0.5rem',
                color: '#6b7280',
                borderRadius: '9999px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>


          {/* Navigation */}
          <nav style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  backgroundColor: isActive(item.href, item.exact) ? '#fff7ed' : 'transparent',
                  color: isActive(item.href, item.exact) ? '#ea580c' : '#4b5563',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href, item.exact)) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.color = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href, item.exact)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#4b5563';
                  }
                }}
              >
                <span style={{ 
                  color: isActive(item.href, item.exact) ? '#ea580c' : '#9ca3af',
                  transition: 'color 0.2s'
                }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </nav>


          {/* Footer */}
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid #f3f4f6'
          }}>
            <button 
              onClick={() => {
                // Handle logout logic here
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/admin/login';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                width: '100%',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#dc2626',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
