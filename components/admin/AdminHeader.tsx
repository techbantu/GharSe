'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, User, LogOut, Settings, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

interface AdminHeaderProps {
  onMenuClick: () => void;
  user?: { name: string; email: string; role?: string } | null;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, user }) => {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Order #1234', message: 'Fresh order received from Table 5', time: '2 min ago', type: 'order', read: false },
    { id: 2, title: 'Low Stock Alert', message: 'Chicken breast is running low', time: '1 hour ago', type: 'alert', read: false },
    { id: 3, title: 'System Update', message: 'Menu sync completed successfully', time: '3 hours ago', type: 'system', read: true },
  ]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Simulate logout process
    try {
      // In a real app, you'd call an API to invalidate the session
      // await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear local storage if used
      localStorage.removeItem('adminToken'); 
      
      // Redirect to login
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

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
        <div style={{ position: 'relative' }} ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              padding: '0.5rem',
              color: showNotifications ? '#ea580c' : '#6b7280',
              borderRadius: '9999px',
              backgroundColor: showNotifications ? '#fff7ed' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !showNotifications && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => !showNotifications && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
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
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '120%',
              right: '-4rem',
              width: '20rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              zIndex: 50,
              overflow: 'hidden'
            }} className="md:right-0">
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ fontSize: '0.75rem', color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: notification.read ? 'white' : '#fff7ed',
                      display: 'flex',
                      gap: '0.75rem',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-gray-50 transition-colors"
                    >
                      <div style={{
                        marginTop: '0.25rem',
                        color: notification.type === 'alert' ? '#ef4444' : notification.type === 'order' ? '#ea580c' : '#3b82f6'
                      }}>
                        {notification.type === 'alert' ? <AlertCircle size={16} /> : 
                         notification.type === 'order' ? <Bell size={16} /> : <CheckCircle size={16} />}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937', marginBottom: '0.125rem' }}>
                          {notification.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          {notification.message}
                        </p>
                        <p style={{ fontSize: '0.7px', color: '#9ca3af' }}>
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{
                padding: '0.75rem',
                textAlign: 'center',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <button style={{ fontSize: '0.75rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid #e5e7eb',
              background: 'none',
              border: 'none',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              cursor: 'pointer',
              outline: 'none'
            }}
            className="group"
          >
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
              backgroundColor: showProfileMenu ? '#ea580c' : '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showProfileMenu ? 'white' : '#ea580c',
              border: '1px solid #fed7aa',
              transition: 'all 0.2s'
            }}>
              <User size={18} />
            </div>
            <ChevronDown size={14} style={{ color: '#9ca3af', transition: 'transform 0.2s', transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} className="hidden md:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '14rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              zIndex: 50,
              overflow: 'hidden',
              padding: '0.5rem'
            }}>
              <div style={{
                padding: '0.75rem',
                borderBottom: '1px solid #f3f4f6',
                marginBottom: '0.5rem',
                display: 'md:none'
              }} className="md:hidden">
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{user?.name || 'Admin User'}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.role || 'Administrator'}</p>
              </div>

              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/admin/settings');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  background: 'none',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User size={16} />
                My Profile
              </button>
              
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/admin/settings');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  background: 'none',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings size={16} />
                Settings
              </button>

              <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0.5rem 0' }}></div>

              <button 
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;