'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, User, LogOut, Settings, ChevronDown, AlertCircle, CheckCircle, ShoppingBag, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { playNotificationSound } from '@/utils/notification-sound';
import { formatDistanceToNow } from 'date-fns';

interface AdminHeaderProps {
  onMenuClick: () => void;
  user?: { name: string; email: string; role?: string } | null;
}

interface Notification {
  id: string;
  type: 'order' | 'status' | 'system';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  orderId?: string;
  orderNumber?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, user }) => {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevOrderCountRef = useRef<number>(0);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch real orders and generate notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch('/api/orders?status=pending,pending-confirmation,confirmed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orders) {
          const orders = data.orders;
          
          // Check if we have new orders
          if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
            console.log('🔔 NEW ORDER! Playing sound...');
            playNotificationSound();
            
            // Add new order notification
            const newOrder = orders[0]; // Most recent order
            const newNotification: Notification = {
              id: `order-${newOrder.id}-${Date.now()}`,
              type: 'order',
              title: `New Order ${newOrder.orderNumber}`,
              message: `${newOrder.customer?.name || 'Customer'} placed ${newOrder.orderType === 'delivery' ? 'delivery' : 'pickup'} order${newOrder.scheduledDeliveryAt ? ' (scheduled)' : ' (ASAP)'}`,
              time: new Date(newOrder.createdAt),
              read: false,
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber
            };
            
            setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
          }
          
          prevOrderCountRef.current = orders.length;
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Poll for new orders every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

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
    try {
      localStorage.removeItem('adminToken'); 
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Navigate to orders page if it's an order notification
    if (notification.type === 'order' && notification.orderId) {
      setShowNotifications(false);
      router.push('/admin/orders');
    }
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
                    <Bell size={32} style={{ margin: '0 auto 0.5rem', color: '#d1d5db' }} />
                    <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>No notifications yet</p>
                    <p style={{ fontSize: '0.75rem' }}>You'll be notified when new orders arrive</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: notification.read ? 'white' : '#fff7ed',
                        display: 'flex',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (notification.read) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#fff7ed';
                      }}
                    >
                      <div style={{
                        marginTop: '0.25rem',
                        color: notification.type === 'order' ? '#ea580c' : notification.type === 'status' ? '#10b981' : '#3b82f6',
                        flexShrink: 0
                      }}>
                        {notification.type === 'order' ? <ShoppingBag size={18} /> : 
                         notification.type === 'status' ? <CheckCircle size={18} /> : 
                         <AlertCircle size={18} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                          {notification.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                          {notification.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={12} style={{ color: '#9ca3af' }} />
                          <p style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>
                            {formatDistanceToNow(notification.time, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ea580c',
                          marginTop: '0.5rem',
                          flexShrink: 0
                        }} />
                      )}
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