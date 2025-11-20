import React from 'react';
import AdminLayoutContent from '@/components/admin/AdminLayoutContent';

export const metadata = {
  title: 'Admin Dashboard | GharSe',
  description: 'Manage your restaurant operations',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutContent>
      {children}
    </AdminLayoutContent>
  );
}
