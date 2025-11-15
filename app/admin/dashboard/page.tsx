'use client';

/**
 * ADMIN DASHBOARD - Main Control Panel
 * 
 * URL: http://localhost:3000/admin/dashboard
 * 
 * Features:
 * - Menu Management (Add/Edit/Delete dishes)
 * - Order Management
 * - Analytics
 * - Settings
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  ChefHat,
} from 'lucide-react';
import MenuManagement from '@/components/admin/MenuManagement';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'orders' | 'analytics' | 'settings'>('menu');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if admin is logged in with valid token
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Verify token is still valid by checking with API
    fetch('/api/admin/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', name: 'Menu Management', icon: UtensilsCrossed },
    { id: 'orders', name: 'Orders', icon: ShoppingBag },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <ChefHat size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">
                  GharSe
                </h1>
                <p className="text-xs text-gray-500 font-semibold">
                  Admin Dashboard (Operated by Sailaja)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <a
                href="/"
                target="_blank"
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-500 transition-colors"
              >
                View Website →
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Dashboard Overview
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Today's Orders</p>
                    <p className="text-3xl font-black text-gray-900">3</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Revenue</p>
                    <p className="text-3xl font-black text-green-600">₹175</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Menu Items</p>
                    <p className="text-3xl font-black text-gray-900">25</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <UtensilsCrossed className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Pending</p>
                    <p className="text-3xl font-black text-yellow-600">1</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-primary-500 to-red-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Quick Start Guide</h3>
              <p className="mb-4 opacity-90">
                Click on "Menu Management" tab above to add, edit, or delete dishes with images!
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-6 py-3 bg-white text-primary-600 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Go to Menu Management →
                </button>
                <a
                  href="/admin/menu-manager"
                  className="px-6 py-3 bg-white/20 text-white border-2 border-white rounded-xl font-bold hover:bg-white hover:text-primary-600 transition-all"
                >
                  Full Menu Manager Dashboard →
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="max-w-7xl mx-auto">
            <MenuManagement />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Order Management
            </h2>
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <ShoppingBag size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                Order management coming soon! For now, check the main admin page.
              </p>
              <a
                href="/admin"
                className="inline-block mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600"
              >
                View Orders
              </a>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Analytics & Reports
            </h2>
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <BarChart3 size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                Analytics dashboard coming soon!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Settings
            </h2>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Restaurant Information
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Update your restaurant details, contact info, and operating hours.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Admin Credentials
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Current Email: admin@bantuskitchen.com
                  </p>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

