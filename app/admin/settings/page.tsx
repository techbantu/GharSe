'use client';

import React, { useState } from 'react';
import { User, Bell, Lock, CreditCard } from 'lucide-react';
import EditNotificationsModal from '@/components/admin/settings/EditNotificationsModal';
import EditProfileModal from '@/components/admin/settings/EditProfileModal';
import EditSecurityModal from '@/components/admin/settings/EditSecurityModal';
import EditPaymentModal from '@/components/admin/settings/EditPaymentModal';

export default function SettingsPage() {
  // State for settings data
  const [profile, setProfile] = useState({
    name: 'Bantu',
    email: 'admin@bantuskitchen.com',
    role: 'Owner',
    phone: '+91 98765 43210'
  });

  const [security, setSecurity] = useState({
    twoFactor: 'Not Configured',
    sessionTimeout: '4 hours',
    lastLogin: 'Just now'
  });

  const [payment, setPayment] = useState({
    bankName: 'HDFC Bank',
    accountNumber: '•••• •••• 1234',
    ifsc: 'HDFC0001234',
    upiId: 'business@upi',
    settlementPeriod: 'T+1 days',
    autoPayout: 'Enabled'
  });

  // Modal visibility state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Handlers
  const handleUpdateProfile = async (data: { name: string; email: string; phone: string }) => {
    // TODO: API Call
    console.log('Updating profile:', data);
    setProfile(prev => ({ ...prev, ...data }));
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleUpdateSecurity = async (data: { currentPass: string; newPass: string }) => {
    // TODO: API Call
    console.log('Updating security:', data);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Password updated successfully');
  };

  const handleUpdatePayment = async (data: { bankName: string; accountNumber: string; ifsc: string; upiId: string }) => {
    // TODO: API Call
    console.log('Updating payment:', data);
    setPayment(prev => ({
      ...prev,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifsc: data.ifsc,
      upiId: data.upiId
    }));
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleUpdateNotifications = async (data: any) => {
    console.log('Updating notifications:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const settingsSections = [
    {
      title: 'Profile Settings',
      icon: <User size={20} />,
      description: 'Manage your profile information',
      onEdit: () => setIsProfileModalOpen(true),
      items: [
        { label: 'Full Name', value: profile.name },
        { label: 'Email', value: profile.email },
        { label: 'Phone', value: profile.phone },
        { label: 'Role', value: profile.role }
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell size={20} />,
      description: 'Configure notification preferences',
      onEdit: () => setIsNotificationsModalOpen(true),
      items: [
        { label: 'Email Notifications', value: 'Enabled' },
        { label: 'Push Notifications', value: 'Enabled' },
        { label: 'SMS Alerts', value: 'Disabled' }
      ]
    },
    {
      title: 'Security',
      icon: <Lock size={20} />,
      description: 'Manage security settings',
      onEdit: () => setIsSecurityModalOpen(true),
      items: [
        { label: 'Two-Factor Auth', value: security.twoFactor },
        { label: 'Session Timeout', value: security.sessionTimeout },
        { label: 'Last Login', value: security.lastLogin }
      ]
    },
    {
      title: 'Payment',
      icon: <CreditCard size={20} />,
      description: 'Payment and billing settings',
      onEdit: () => setIsPaymentModalOpen(true),
      items: [
        { label: 'Bank Account', value: `${payment.bankName} - ${payment.accountNumber.slice(-4)}` },
        { label: 'UPI ID', value: payment.upiId },
        { label: 'Settlement', value: payment.settlementPeriod },
        { label: 'Auto-payout', value: payment.autoPayout }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Settings
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Manage your account settings and preferences.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {settingsSections.map((section, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                padding: '0.625rem',
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                borderRadius: '0.5rem'
              }}>
                {section.icon}
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  color: '#111827'
                }}>
                  {section.title}
                </h3>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280',
                  marginTop: '0.125rem'
                }}>
                  {section.description}
                </p>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem'
            }}>
              {section.items.map((item, i) => (
                <div 
                  key={i}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#4b5563',
                    fontWeight: 500
                  }}>
                    {item.label}
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#111827',
                    fontWeight: 600
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={section.onEdit}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c2410c';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ea580c';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Edit {section.title}
            </button>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: '#fef2f2',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #fee2e2'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: 600, 
          color: '#991b1b',
          marginBottom: '0.5rem'
        }}>
          Danger Zone
        </h3>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#7f1d1d',
          marginBottom: '1rem'
        }}>
          Irreversible actions that require confirmation.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
              alert('Account deletion initiated. This feature is coming soon.');
            }
          }}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            color: '#dc2626',
            border: '2px solid #dc2626',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Delete Account
        </button>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={profile}
        onSave={handleUpdateProfile}
      />
      <EditSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSave={handleUpdateSecurity}
      />
      <EditPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleUpdatePayment}
      />
      <EditNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onSave={handleUpdateNotifications}
      />
    </div>
  );
}
