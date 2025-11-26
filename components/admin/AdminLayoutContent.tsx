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
      // Skip auth check on public admin pages (login, forgot-password, reset-password)
      const publicPages = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
      const isPublicPage = publicPages.some(page => pathname?.startsWith(page));
      
      if (isPublicPage) {
        setIsLoading(false);
        return;
      }

      // SECURITY FIX: No longer check localStorage for token
      // Token is now stored in httpOnly cookie only (sent automatically with requests)
      // Optimistically load user from sessionStorage (non-sensitive display data only)
      const storedUser = sessionStorage.getItem('adminUser');
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
        // Validate session with backend using httpOnly cookie (sent automatically)
        // SECURITY FIX: No more Authorization header with localStorage token
        const response = await fetch('/api/admin/me', {
          credentials: 'include', // Include httpOnly cookies
          cache: 'no-store',
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
            // Store user display data in sessionStorage (not the token!)
            // SECURITY: Only non-sensitive display data, cleared on browser close
            sessionStorage.setItem('adminUser', JSON.stringify({
              name: data.admin.name,
              email: data.admin.email,
              role: data.admin.role
            }));
          } else {
            throw new Error('Invalid session');
          }
        } else {
          throw new Error('Session expired');
        }
      } catch (error) {
        console.error('❌ Admin session validation failed:', error);
        // Clear display data (token is in httpOnly cookie, can't be cleared from JS)
        sessionStorage.removeItem('adminUser');
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
  // Allow rendering for public pages (login, forgot-password, reset-password)
  const publicPages = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page));
  
  if (!isAuthenticated && !isPublicPage) {
    return null;
  }

  // For public pages (login, forgot-password, reset-password), render children without admin UI
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Render full admin UI for authenticated pages

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
          transition: 'all 0.3s',
          marginLeft: '0' // Default for mobile
        }}
        className="admin-main-content"
      >
        <style jsx global>{`
          @media (min-width: 1024px) {
            .admin-main-content {
              margin-left: 16rem !important;
            }
          }
        `}</style>
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

// Force rebuild - Turbopack fix
export default AdminLayoutContent;
