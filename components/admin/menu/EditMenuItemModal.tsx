'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 10
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              color: '#6b7280',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem'
                  }}
                  required
                  min="0"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="Appetizers">Appetizers</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Breads">Breads</option>
                  <option value="Rice & Biryani">Rice & Biryani</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Image URL</label>
            <input
              type="text"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem'
              }}
            />
            {formData.image && (
              <div style={{ marginTop: '0.5rem', height: '150px', borderRadius: '0.375rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Dietary & Preferences */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>Dietary & Preferences</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  style={{ width: '1rem', height: '1rem', accentColor: '#ea580c' }}
                />
                Vegetarian
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isVegan}
                  onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                  style={{ width: '1rem', height: '1rem', accentColor: '#ea580c' }}
                />
                Vegan
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isGlutenFree}
                  onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.checked })}
                  style={{ width: '1rem', height: '1rem', accentColor: '#ea580c' }}
                />
                Gluten Free
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  style={{ width: '1rem', height: '1rem', accentColor: '#ea580c' }}
                />
                Available
              </label>
            </div>
          </div>

          {/* Spicy Level */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
              Spicy Level (0-3)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={formData.spicyLevel || 0}
                onChange={(e) => setFormData({ ...formData, spicyLevel: parseInt(e.target.value) })}
                style={{ flex: 1, accentColor: '#ea580c' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ea580c', minWidth: '4rem' }}>
                {['None', 'Mild', 'Medium', 'Hot'][formData.spicyLevel || 0]}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
