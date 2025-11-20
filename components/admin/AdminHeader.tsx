'use client';

import React from 'react';
import { Bell, Menu, Search, User } from 'lucide-react';

import Logo from '@/components/Logo';

interface AdminHeaderProps {
  onMenuClick: () => void;
  user?: { name: string; email: string; role?: string } | null;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, user }) => {
  return (
    <header style={{
      height: '4rem',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      padding: '0 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}
    className="lg:px-8">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="flex items-center gap-3 lg:hidden">
          <button 
            onClick={onMenuClick}
            style={{
              padding: '0.5rem',
              marginLeft: '-0.5rem',
              color: '#4b5563',
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Menu size={24} />
          </button>
          <Logo variant="small" style={{ height: '32px', width: 'auto' }} />
        </div>
        
        {/* Search Bar - Hidden on small mobile */}
        <div style={{ 
          display: 'none',
          alignItems: 'center',
          position: 'relative',
          maxWidth: '28rem',
          width: '100%'
        }}
        className="md:flex">
          <Search style={{ 
            position: 'absolute', 
            left: '0.75rem', 
            color: '#9ca3af' 
          }} size={18} />
          <input 
            type="text" 
            placeholder="Search orders, menu items..." 
            style={{
              paddingLeft: '2.5rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              width: '16rem',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.width = '20rem';
              e.currentTarget.style.borderColor = '#ea580c';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(234, 88, 12, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.width = '16rem';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem' 
      }}
      className="md:gap-6">
        {/* Notifications */}
        <button style={{
          position: 'relative',
          padding: '0.5rem',
          color: '#6b7280',
          borderRadius: '9999px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '0.375rem',
            right: '0.375rem',
            width: '0.625rem',
            height: '0.625rem',
            backgroundColor: '#ef4444',
            borderRadius: '9999px',
            border: '2px solid #ffffff'
          }}></span>
        </button>

        {/* User Profile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          paddingLeft: '0.75rem',
          borderLeft: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'none', textAlign: 'right' }} className="md:block">
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
              {user?.name || 'Admin User'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {user?.role || 'Administrator'}
            </p>
          </div>
          <div style={{
            height: '2.25rem',
            width: '2.25rem',
            borderRadius: '9999px',
            backgroundColor: '#fff7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ea580c',
            border: '1px solid #fed7aa'
          }}>
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
