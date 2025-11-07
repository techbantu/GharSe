/**
 * MENU ITEM IMAGE UPLOAD PAGE - Complete Menu Item Creation
 * 
 * Features:
 * - Upload images for menu items
 * - Create new menu items with full details
 * - Update existing menu items with images
 * - Save everything to database
 * - Automatically updates main website menu
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Check, X, Image as ImageIcon, Sparkles, ArrowLeft, FileImage, ChefHat, Save, IndianRupee } from 'lucide-react';

const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Biryani & Rice',
  'Breads',
  'Desserts',
  'Beverages',
];

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  // Menu item form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    preparationTime: 30,
    isAvailable: true,
    isPopular: false,
  });
  
  // Existing menu items for selection
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(true);

  // Fetch existing menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        // Initialize database first
        await fetch('/api/database/init');
        
        const response = await fetch('/api/menu');
        const data = await response.json();
        if (data.success) {
          setMenuItems(data.data || []);
        } else {
          setError('Failed to load menu items: ' + (data.error || 'Unknown error'));
        }
      } catch (err: any) {
        console.error('Failed to fetch menu items:', err);
        setError('Failed to connect to database. Please check your DATABASE_URL in .env');
      }
    };
    fetchMenuItems();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSelectMenuItem = (itemId: string) => {
    setSelectedMenuItemId(itemId);
    setIsCreatingNew(false);
    const item = menuItems.find(m => m.id === itemId);
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isGlutenFree: item.isGlutenFree,
        spicyLevel: item.spicyLevel,
        preparationTime: item.preparationTime,
        isAvailable: item.isAvailable,
        isPopular: item.isPopular,
      });
      if (item.image) {
        setPreview(item.image);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const itemId = isCreatingNew ? `new-item-${Date.now()}` : selectedMenuItemId;
      uploadFormData.append('itemId', itemId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          ...data,
          filename: data.url.split('/').pop(),
          itemId: data.itemId,
          size: file.size,
          imageUrl: data.url,
        });
        console.log('✅ Image uploaded successfully:', data);
        return data.url; // Return image URL for database save
      } else {
        setError(data.error || 'Upload failed');
        return null;
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload. Check console for details.');
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  const handleSaveToDatabase = async () => {
    // Validate form
    if (!formData.name || !formData.description || !formData.price) {
      setError('Please fill in name, description, and price');
      return;
    }
    
    if (!file && !preview) {
      setError('Please upload an image');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      let imageUrl = preview;
      
      // Upload image if file is selected
      if (file) {
        imageUrl = await handleUpload();
        if (!imageUrl) {
          setSaving(false);
          return;
        }
      }
      
      // Prepare menu item data
      const menuItemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: imageUrl,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isGlutenFree: formData.isGlutenFree,
        spicyLevel: formData.spicyLevel,
        preparationTime: formData.preparationTime,
        isAvailable: formData.isAvailable,
        isPopular: formData.isPopular,
      };
      
      let response;
      if (isCreatingNew) {
        // Create new menu item
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });
      } else {
        // Update existing menu item
        response = await fetch(`/api/menu/${selectedMenuItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        setResult({
          ...data.data,
          message: isCreatingNew ? 'Menu item created successfully!' : 'Menu item updated successfully!',
          savedToDatabase: true,
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          category: 'Main Course',
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          spicyLevel: 0,
          preparationTime: 30,
          isAvailable: true,
          isPopular: false,
        });
        setFile(null);
        setPreview('');
        setSelectedMenuItemId('');
        setIsCreatingNew(true);
        
        // Refresh menu items list
        const menuResponse = await fetch('/api/menu');
        const menuData = await menuResponse.json();
        if (menuData.success) {
          setMenuItems(menuData.data || []);
        }
        
        console.log('✅ Menu item saved to database:', data.data);
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to save menu item';
        setError(errorMsg);
        console.error('Save failed:', errorMsg);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save menu item. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .upload-container {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
          }
          .upload-card-header {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
            font-size: 1rem !important;
          }
          .upload-card-body {
            padding: 1rem !important;
            gap: 1rem !important;
          }
          .upload-header-card {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .upload-title {
            font-size: 1.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          .upload-subtitle {
            font-size: 0.75rem !important;
          }
          .upload-icon {
            width: 2.5rem !important;
            height: 2.5rem !important;
          }
          .upload-icon svg {
            width: 1.25rem !important;
            height: 1.25rem !important;
          }
          .upload-header-icon {
            width: 2rem !important;
            height: 2rem !important;
          }
          .upload-header-icon svg {
            width: 1rem !important;
            height: 1rem !important;
          }
          .upload-step-icon {
            width: 2rem !important;
            height: 2rem !important;
            font-size: 0.875rem !important;
          }
          .upload-step-text {
            font-size: 0.875rem !important;
            padding-top: 0.5rem !important;
          }
          .upload-brand-header {
            padding: 0.75rem 1rem !important;
          }
          .upload-brand-logo {
            width: 2rem !important;
            height: 2rem !important;
          }
          .upload-brand-logo svg {
            width: 1rem !important;
            height: 1rem !important;
          }
          .upload-brand-title {
            font-size: 0.875rem !important;
          }
          .upload-brand-subtitle {
            font-size: 0.625rem !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .upload-container {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
        }
      `}} />
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #FFF5F0, #FFFFFF, #FFFBEB)',
      paddingTop: '0.75rem',
      paddingBottom: '0.75rem',
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem'
    }}>
      {/* Background Pattern */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.05, pointerEvents: 'none' }}>
        <svg style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="#FF6B35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="upload-container" style={{ maxWidth: '896px', margin: '0 auto', position: 'relative' }}>
        {/* Bantu's Kitchen Brand Header */}
        <div className="upload-brand-header" style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          border: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div className="upload-brand-logo" style={{
            width: '2.5rem',
            height: '2.5rem',
            background: 'linear-gradient(to bottom right, #F97316, #EF4444)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ChefHat className="text-white" size={20} />
          </div>
          <div>
            <h1 className="upload-brand-title" style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: '#111827',
              lineHeight: '1.2',
              margin: 0
            }}>
              Bantu's Kitchen
            </h1>
            <p className="upload-brand-subtitle" style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              fontWeight: 600,
              margin: 0,
              lineHeight: '1.2'
            }}>
              Image Upload Test
            </p>
          </div>
        </div>
        {/* Header Card */}
        <div className="upload-header-card" style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '1.5rem',
          marginBottom: '1rem',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="upload-icon" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(to bottom right, #10B981, #059669)',
              borderRadius: '50%',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="upload-title" style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              📸 Menu Item Image Upload
            </h1>
            <p className="upload-subtitle" style={{
              fontSize: '0.875rem',
              color: '#4B5563',
              fontWeight: 500
            }}>
              Upload images and create/update menu items in the database
            </p>
          </div>
        </div>

        {/* Main Upload Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          border: '1px solid #f3f4f6',
          marginBottom: '2rem'
        }}>
          {/* Card Header */}
          <div className="upload-card-header" style={{
            background: 'linear-gradient(to right, #F97316, #EF4444)',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingTop: '1rem',
            paddingBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0
            }}>
              <Upload size={18} style={{ flexShrink: 0 }} />
              <span>Create/Update Menu Item</span>
            </h2>
          </div>

          {/* Card Body */}
          <div className="upload-card-body" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Select Existing Menu Item or Create New */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Select Existing Menu Item (or create new)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectMenuItem(e.target.value);
                    } else {
                      setIsCreatingNew(true);
                      setSelectedMenuItemId('');
                    }
                  }}
                  style={{
                    flex: 1,
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    border: '2px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <option value="">Create New Menu Item</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Menu Item Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Dish Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Butter Chicken"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  padding: '0.5rem',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  backgroundColor: '#F9FAFB'
                }}
              />
            </div>
            
            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the dish, ingredients, and taste..."
                rows={3}
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  padding: '0.5rem',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  backgroundColor: '#F9FAFB',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Price and Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="299"
                  min="0"
                  step="1"
                  style={{
                    width: '100%',
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    border: '2px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    backgroundColor: '#F9FAFB'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    border: '2px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* File Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Dish Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{
                  display: 'block',
                  width: '100%',
                  fontSize: '0.875rem',
                  color: '#111827',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  backgroundColor: '#F9FAFB',
                  padding: '0.5rem'
                }}
              />
            </div>

            {/* Preview Card */}
            {preview && (
              <div style={{
                background: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '2px solid #E5E7EB'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  Preview
                </label>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxWidth: '42rem',
                      margin: '0 auto',
                      display: 'block',
                      borderRadius: '0.375rem',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <FileImage size={16} style={{ color: '#6B7280', flexShrink: 0 }} />
                  <p style={{ color: '#374151', fontWeight: 600, wordBreak: 'break-all' }}>
                    {file?.name}
                  </p>
                  <span style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
                    ({(file!.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              </div>
            )}

            {/* Save to Database Button */}
            <button
              onClick={handleSaveToDatabase}
              disabled={saving || uploading || !formData.name || !formData.description || !formData.price || (!file && !preview)}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #10B981, #059669)',
                color: '#ffffff',
                paddingTop: '0.875rem',
                paddingBottom: '0.875rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: 'none',
                cursor: (saving || uploading || !formData.name || !formData.description || !formData.price || (!file && !preview)) ? 'not-allowed' : 'pointer',
                opacity: (saving || uploading || !formData.name || !formData.description || !formData.price || (!file && !preview)) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                if (!saving && !uploading && formData.name && formData.description && formData.price && (file || preview)) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              {saving || uploading ? (
                <>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>{uploading ? 'Uploading Image...' : 'Saving to Database...'}</span>
                </>
              ) : (
                <>
                  <Save size={16} style={{ flexShrink: 0 }} />
                  <span>{isCreatingNew ? 'Create Menu Item' : 'Update Menu Item'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Result Card */}
        {result && (
          <div style={{
            background: 'linear-gradient(to bottom right, #ECFDF5, #D1FAE5)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            border: '2px solid #A7F3D0',
            marginBottom: '1rem'
          }}>
            {/* Success Header */}
            <div style={{
              background: 'linear-gradient(to right, #10B981, #059669)',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="upload-header-icon" style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check className="text-white" size={16} />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0
                }}>
                  {result?.savedToDatabase ? 'Menu Item Saved Successfully!' : 'Upload Successful!'}
                </h3>
              </div>
            </div>

            {/* Success Body */}
            <div style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Menu Item Details */}
              {result?.savedToDatabase && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #D1FAE5',
                  marginBottom: '1rem'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#047857',
                    marginBottom: '0.5rem'
                  }}>
                    ✅ {result.message || 'Menu item saved to database!'}
                  </p>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <p><strong>Name:</strong> {result.name}</p>
                    <p><strong>Category:</strong> {result.category}</p>
                    <p><strong>Price:</strong> ₹{result.price}</p>
                    <p><strong>ID:</strong> {result.id}</p>
                  </div>
                </div>
              )}
              
              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #D1FAE5'
                }}>
                  <p style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#6B7280',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Image URL</p>
                  <code style={{
                    fontSize: '0.75rem',
                    color: '#047857',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    display: 'block',
                    lineHeight: '1.5'
                  }}>
                    {result?.image || result?.url}
                  </code>
                </div>

                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #D1FAE5'
                }}>
                  <p style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#6B7280',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Filename</p>
                  <code style={{
                    fontSize: '0.75rem',
                    color: '#047857',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    display: 'block',
                    lineHeight: '1.5'
                  }}>
                    {result.filename}
                  </code>
                </div>

                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #D1FAE5'
                }}>
                  <p style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#6B7280',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Menu Item ID</p>
                  <code style={{
                    fontSize: '0.75rem',
                    color: '#047857',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    display: 'block',
                    lineHeight: '1.5'
                  }}>
                    {result?.id || result?.itemId}
                  </code>
                </div>

                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #D1FAE5'
                }}>
                  <p style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#6B7280',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Size</p>
                  <code style={{
                    fontSize: '0.75rem',
                    color: '#047857',
                    fontFamily: 'monospace',
                    display: 'block',
                    lineHeight: '1.5'
                  }}>
                    {(result.size / 1024).toFixed(2)} KB
                  </code>
                </div>
              </div>

              {/* Uploaded Image Display */}
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <ImageIcon size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>Uploaded Image:</span>
                </p>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #D1FAE5'
                }}>
                  <img
                    src={result?.image || result?.url}
                    alt={result?.name || 'Uploaded'}
                    style={{
                      width: '100%',
                      maxWidth: '42rem',
                      margin: '0 auto',
                      display: 'block',
                      borderRadius: '0.5rem',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Result Card */}
        {error && (
          <div style={{
            background: 'linear-gradient(to bottom right, #FEF2F2, #FCE7F3)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            border: '2px solid #FECDD3',
            marginBottom: '1rem'
          }}>
            <div style={{
              background: 'linear-gradient(to right, #EF4444, #DB2777)',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="upload-header-icon" style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <X className="text-white" size={16} />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0
                }}>
                  Upload Failed
                </h3>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              <p style={{
                color: '#B91C1C',
                fontWeight: 600,
                fontSize: '0.875rem',
                wordBreak: 'break-word',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* How It Works Card */}
        <div style={{
          background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          border: '2px solid #BFDBFE',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(to right, #3B82F6, #4F46E5)',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0
            }}>
              <ImageIcon size={16} style={{ flexShrink: 0 }} />
              <span>How It Works</span>
            </h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <ol style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {[
                { text: 'Fill in menu item details (name, description, price, category)', icon: '📝' },
                { text: 'Select and upload dish image (JPG, PNG, WebP, GIF)', icon: '📁' },
                { text: 'Image is validated and uploaded to public/uploads/', icon: '✅' },
                { text: 'Menu item is saved to database with image URL', icon: '💾' },
                { text: 'Automatically appears on main website menu', icon: '🌐' },
              ].map((step, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <div className="upload-step-icon" style={{
                    flexShrink: 0,
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(to bottom right, #3B82F6, #4F46E5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    {step.icon}
                  </div>
                  <div className="upload-step-text" style={{ flex: 1, paddingTop: '0.5rem' }}>
                    <p style={{
                      color: '#1E3A8A',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem' }}>
          <a
            href="/admin/menu-manager"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              background: 'linear-gradient(to right, #3B82F6, #2563EB)',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
          >
            <ChefHat size={16} style={{ flexShrink: 0 }} />
            <span>Menu Manager Dashboard</span>
          </a>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              border: '2px solid #E5E7EB'
            }}
          >
            <ArrowLeft size={16} style={{ flexShrink: 0 }} />
            <span>Back to Home</span>
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
