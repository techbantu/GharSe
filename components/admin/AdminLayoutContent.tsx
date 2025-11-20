'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutContentProps {
  children: React.ReactNode;
}

const AdminLayoutContent: React.FC<AdminLayoutContentProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({
    name: 'Admin',
    email: '',
    role: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Skip check on login page (though layout shouldn't be used there usually)
      if (pathname === '/admin/login') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      if (!token) {
        console.log('🔒 No admin token found, redirecting to login...');
        router.push('/admin/login');
        return;
      }

      // Optimistically set user from storage to avoid flash
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.name || 'Admin',
            email: parsedUser.email || '',
            role: parsedUser.role || 'Admin'
          });
        } catch (e) {
          console.error('Failed to parse stored user', e);
        }
      }

      try {
        // Validate token with backend
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.admin) {
            setIsAuthenticated(true);
            setUser({
              name: data.admin.name,
              email: data.admin.email,
              role: data.admin.role
            });
            // Update stored user
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
          } else {
            throw new Error('Invalid session');
          }
        } else {
          throw new Error('Session expired');
        }
      } catch (error) {
        console.error('❌ Admin session validation failed:', error);
        // Clear invalid session
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Don't render admin UI if not authenticated (will redirect)
  if (!isAuthenticated && pathname !== '/admin/login') {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      display: 'flex' 
    }}>
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Wrapper */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'all 0.3s'
        }}
        className="lg:pl-64"
      >
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user}
        />

        <main style={{ 
          flex: 1, 
          padding: '1rem', 
          overflowX: 'hidden' 
        }}
        className="lg:p-8">
          <div style={{ 
            maxWidth: '80rem', 
            margin: '0 auto' 
          }}
          className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutContent;
