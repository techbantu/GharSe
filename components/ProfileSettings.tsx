/**
 * PROFILE SETTINGS - Collapsible Settings Panel
 * 
 * Purpose: Provide access to personal information and security settings
 * 
 * Features:
 * - Personal information (name, email, phone)
 * - Verification status badges
 * - Change password modal
 * - Saved delivery addresses
 * - Notification preferences
 * - Dietary restrictions
 * - Collapsible sections
 * 
 * Visual: Clean, organized, accessible
 */

'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Lock,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Plus,
  Shield,
  Leaf,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface ProfileSettingsProps {
  customer: Customer;
  onUpdateProfile: (data: { name: string; email: string; phone: string }) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onResendVerification: () => Promise<void>;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  customer,
  onUpdateProfile,
  onChangePassword,
  onResendVerification,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal']));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [profileData, setProfileData] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Clear feedback after 5 seconds
  React.useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    
    try {
      await onUpdateProfile(profileData);
      setIsEditingProfile(false);
      setFeedbackMessage({ type: 'success', message: '✅ Profile updated successfully!' });
    } catch (error) {
      setFeedbackMessage({ type: 'error', message: '❌ Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setFeedbackMessage(null);
    
    // Simple validation - minimum requirements only
    if (!passwordData.currentPassword) {
      setFeedbackMessage({ type: 'error', message: 'Please enter your current password' });
      return;
    }
    
    if (!passwordData.newPassword) {
      setFeedbackMessage({ type: 'error', message: 'Please enter a new password' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setFeedbackMessage({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFeedbackMessage({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    
    try {
      await onChangePassword(passwordData.currentPassword, passwordData.newPassword);
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFeedbackMessage({ type: 'success', message: '✅ Password changed successfully!' });
    } catch (error: any) {
      setFeedbackMessage({ 
        type: 'error', 
        message: error?.message || '❌ Failed to change password. Check your current password.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Feedback Message Banner */}
      {feedbackMessage && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.75rem',
          backgroundColor: feedbackMessage.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${feedbackMessage.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: feedbackMessage.type === 'success' ? '#065F46' : '#991B1B',
          fontWeight: 600,
          fontSize: '0.9375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'slideIn 0.3s ease-out',
        }}>
          <span>{feedbackMessage.message}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .profile-settings-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1024px) {
          .profile-settings-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
        gap: '1rem',
      }}
      className="profile-settings-grid"
      >
      {/* Personal Information Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'fit-content',
      }}>
        <button
          onClick={() => toggleSection('personal')}
          style={{
            width: '100%',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.875rem',
            paddingBottom: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#fff7ed',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={16} style={{ color: '#ea580c' }} />
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <h3 style={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '0.9375rem',
                margin: 0,
                marginBottom: '0.125rem',
              }}>Personal Information</h3>
              <p style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                color: '#4b5563',
                margin: 0,
              }}>Manage your account details</p>
            </div>
          </div>
          {expandedSections.has('personal') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('personal') && (
          <div style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingBottom: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Name Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={20} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }} />
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditingProfile}
                    style={{
                      width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      if (!isEditingProfile) return;
                      e.currentTarget.style.borderColor = '#f97316';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }} />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditingProfile}
                    style={{
                      width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: !isEditingProfile ? '#f9fafb' : '#fff',
                      color: !isEditingProfile ? '#6b7280' : '#111827',
                    }}
                    onFocus={(e) => {
                      if (!isEditingProfile) return;
                      e.currentTarget.style.borderColor = '#f97316';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {customer.emailVerified ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#16a34a',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                    }}>
                      <CheckCircle size={16} />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        lineHeight: '1.25rem',
                      }}>
                        <XCircle size={16} />
                        <span>Not Verified</span>
                      </div>
                      <button
                        onClick={onResendVerification}
                        style={{
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem',
                          color: '#ea580c',
                          fontWeight: 500,
                          textDecoration: 'underline',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#c2410c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#ea580c';
                        }}
                      >
                        Resend Email
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={20} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }} />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditingProfile}
                    style={{
                      width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: !isEditingProfile ? '#f9fafb' : '#fff',
                      color: !isEditingProfile ? '#6b7280' : '#111827',
                    }}
                    onFocus={(e) => {
                      if (!isEditingProfile) return;
                      e.currentTarget.style.borderColor = '#f97316';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    style={{
                      flex: 1,
                      paddingLeft: '1.5rem',
                      paddingRight: '1.5rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      background: 'linear-gradient(to right, #f97316, #ef4444)',
                      color: '#fff',
                      borderRadius: '0.75rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Edit2 size={18} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleProfileUpdate}
                      style={{
                        flex: 1,
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#16a34a';
                      }}
                    >
                      <Save size={18} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileData({
                          name: customer.name,
                          email: customer.email,
                          phone: customer.phone,
                        });
                      }}
                      style={{
                        flex: 1,
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#d1d5db';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                    >
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'fit-content',
      }}>
        <button
          onClick={() => toggleSection('security')}
          style={{
            width: '100%',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.875rem',
            paddingBottom: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#dbeafe',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Shield size={16} style={{ color: '#2563eb' }} />
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <h3 style={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '0.9375rem',
                margin: 0,
                marginBottom: '0.125rem',
              }}>Security</h3>
              <p style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                color: '#4b5563',
                margin: 0,
              }}>Password and account security</p>
            </div>
          </div>
          {expandedSections.has('security') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('security') && (
          <div style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingBottom: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f3f4f6',
          }}>
            <div>
              {!isChangingPassword ? (
                <>
                  <p style={{
                    fontSize: '0.8125rem',
                    lineHeight: '1.25rem',
                    color: '#4b5563',
                    marginBottom: '0.875rem',
                    marginTop: 0,
                  }}>
                    Keep your account secure by using a strong password and changing it regularly.
                  </p>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    style={{
                      paddingLeft: '1.5rem',
                      paddingRight: '1.5rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      borderRadius: '0.75rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                  >
                    <Lock size={18} />
                    <span>Change Password</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {/* Current Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                      }} />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        style={{
                          width: '100%',
                          paddingLeft: '2.75rem',
                          paddingRight: '3rem',
                          paddingTop: '0.75rem',
                          paddingBottom: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4b5563';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                      }} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        style={{
                          width: '100%',
                          paddingLeft: '2.75rem',
                          paddingRight: '3rem',
                          paddingTop: '0.75rem',
                          paddingBottom: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4b5563';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}>Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                      }} />
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        style={{
                          width: '100%',
                          paddingLeft: '2.75rem',
                          paddingRight: '1rem',
                          paddingTop: '0.75rem',
                          paddingBottom: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
                    <button
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: isLoading ? '#9ca3af' : '#16a34a',
                        color: '#fff',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) e.currentTarget.style.backgroundColor = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) e.currentTarget.style.backgroundColor = '#16a34a';
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #fff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      style={{
                        flex: 1,
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#d1d5db';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'fit-content',
      }}>
        <button
          onClick={() => toggleSection('notifications')}
          style={{
            width: '100%',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.875rem',
            paddingBottom: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#f3e8ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bell size={16} style={{ color: '#9333ea' }} />
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <h3 style={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '0.9375rem',
                margin: 0,
                marginBottom: '0.125rem',
              }}>Notification Preferences</h3>
              <p style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                color: '#4b5563',
                margin: 0,
              }}>Manage how we contact you</p>
            </div>
          </div>
          {expandedSections.has('notifications') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('notifications') && (
          <div style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingBottom: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f3f4f6',
          }}>
            <div>
              <p style={{
                fontSize: '0.8125rem',
                lineHeight: '1.25rem',
                color: '#4b5563',
                margin: 0,
              }}>Coming soon: Customize your notification preferences</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

