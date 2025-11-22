'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Upload, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  spicyLevel: number;
  preparationTime: number;
}

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onSave: (updatedItem: MenuItem) => Promise<void>;
}

export default function EditMenuItemModal({ isOpen, onClose, item, onSave }: EditMenuItemModalProps) {
  const [formData, setFormData] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({ ...item });
      } else {
        // Initialize for new item
        setFormData({
          id: '',
          name: '',
          description: '',
          price: 0,
          category: 'Main Course',
          isAvailable: true,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          isDairyFree: false,
          spicyLevel: 0,
          preparationTime: 30,
          image: ''
        });
      }
    }
  }, [isOpen, item]);

  if (!isOpen || !formData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '720px',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
          }}>
            {item ? 'Edit Dish' : 'Add New Dish'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
        }}>
          <form onSubmit={handleSubmit} style={{
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
          }}>
            
            {/* LEFT COLUMN - Image & Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Image Preview & Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                }}>
                  Food Photography
                </label>
                
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  backgroundColor: '#f9fafb',
                  borderRadius: '1rem',
                  border: '2px dashed #e5e7eb',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fed7aa'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                  {formData.image ? (
                    <img 
                      src={formData.image} 
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                    }}>
                      <Upload size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        Paste image URL below
                      </span>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Dish Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.375rem',
                }}>
                  Dish Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Butter Chicken"
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Price & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}>
                    Price (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                    }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                      min="0"
                      style={{
                        width: '100%',
                        paddingLeft: '2rem',
                        paddingRight: '1rem',
                        paddingTop: '0.625rem',
                        paddingBottom: '0.625rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#111827',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#ea580c';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}>
                    Category
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        appearance: 'none',
                        outline: 'none',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#ea580c';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="Appetizers">Appetizers</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Breads">Breads</option>
                      <option value="Rice & Biryani">Rice & Biryani</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                    <div style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#6b7280',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.375rem',
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the flavors and ingredients..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    resize: 'none',
                    height: '96px',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - Preferences & Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Availability Toggle */}
              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: formData.isAvailable ? '1px solid #bbf7d0' : '1px solid #fecaca',
                backgroundColor: formData.isAvailable ? '#f0fdf4' : '#fef2f2',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: formData.isAvailable ? '#166534' : '#991b1b',
                      margin: 0,
                    }}>
                      {formData.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </h4>
                    <p style={{
                      fontSize: '0.75rem',
                      marginTop: '0.125rem',
                      color: formData.isAvailable ? '#16a34a' : '#dc2626',
                      margin: 0,
                    }}>
                      {formData.isAvailable 
                        ? 'Available for orders' 
                        : 'Temporarily unavailable'}
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}>
                    <input 
                      type="checkbox"
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: 0,
                        height: 0,
                      }}
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    <div style={{
                      width: '44px',
                      height: '24px',
                      backgroundColor: formData.isAvailable ? '#16a34a' : '#d1d5db',
                      borderRadius: '9999px',
                      position: 'relative',
                      transition: 'background-color 0.2s',
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: formData.isAvailable ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      }} />
                    </div>
                  </label>
                </div>
              </div>

              {/* Dietary Tags */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem',
                }}>
                  Dietary Tags
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}>
                  {[
                    { key: 'isVegetarian', label: 'Vegetarian', icon: '🥬' },
                    { key: 'isVegan', label: 'Vegan', icon: '🌱' },
                    { key: 'isGlutenFree', label: 'Gluten-Free', icon: '🌾' },
                    { key: 'isDairyFree', label: 'Dairy-Free', icon: '🥛' },
                  ].map(({ key, label, icon }) => (
                    <label 
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: (formData as any)[key] ? '1px solid #fed7aa' : '1px solid #e5e7eb',
                        backgroundColor: (formData as any)[key] ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: (formData as any)[key] ? '0 0 0 1px #fed7aa' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!(formData as any)[key]) {
                          e.currentTarget.style.borderColor = '#fed7aa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(formData as any)[key]) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(formData as any)[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#ea580c',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#374151',
                      }}>
                        <span style={{ marginRight: '0.5rem' }}>{icon}</span>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Spicy Level */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                  }}>
                    Spiciness
                  </label>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#ea580c',
                    backgroundColor: '#fff7ed',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                  }}>
                    {formData.spicyLevel === 0 ? 'None' : ['Mild', 'Medium', 'Hot'][formData.spicyLevel - 1]}
                    {formData.spicyLevel > 0 && (
                      <span style={{
                        marginLeft: '0.25rem',
                        fontSize: '0.75rem',
                      }}>
                        {'🌶️'.repeat(formData.spicyLevel)}
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={formData.spicyLevel}
                  onChange={(e) => setFormData({ ...formData, spicyLevel: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '0.5rem',
                    appearance: 'none',
                    cursor: 'pointer',
                    accentColor: '#ea580c',
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginTop: '0.5rem',
                  fontWeight: 500,
                }}>
                  <span>None</span>
                  <span>Mild</span>
                  <span>Medium</span>
                  <span>Hot</span>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#f9fafb',
          display: 'flex',
          gap: '0.75rem',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: isSaving ? '#9ca3af' : '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = '#c2410c';
            }}
            onMouseLeave={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = '#ea580c';
            }}
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
