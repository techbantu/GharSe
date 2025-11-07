/**
 * COMPREHENSIVE MENU MANAGEMENT DASHBOARD
 * 
 * Genius-level menu management system with:
 * - Real-time database sync
 * - Smart category matching
 * - Popularity tracking
 * - Full CRUD operations
 * - Live count updates
 * - Beautiful UI with Steve Jobs-level design
 * 
 * URL: /admin/menu-manager
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Leaf,
  Flame,
  Clock,
  IndianRupee,
  Search,
  Filter,
  TrendingUp,
  ChefHat,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Biryani & Rice',
  'Breads',
  'Desserts',
  'Beverages',
];

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  preparationTime: number;
  isAvailable: boolean;
  isPopular: boolean;
  // INVENTORY MANAGEMENT (NEW!)
  inventoryEnabled?: boolean;
  inventory?: number | null;
  outOfStockMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function MenuManagerDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'Main Course',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spicyLevel: 0,
    preparationTime: 30,
    isAvailable: true,
    isPopular: false,
    // NEW: Inventory fields
    inventoryEnabled: false,
    inventory: null,
    outOfStockMessage: null,
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch menu items from database
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize database first (ensures tables exist)
      await fetch('/api/database/init');
      
      const response = await fetch('/api/menu'); // Get ALL items, not filtered
      const data = await response.json();
      
      if (data.success) {
        setMenuItems(data.data || []);
      } else {
        setError('Failed to load menu items: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError('Failed to connect to database. Please check your DATABASE_URL in .env');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMenuItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (field: keyof MenuItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Maximum size is 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('itemId', editingItem?.id || `new-${Date.now()}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        handleInputChange('image', data.url);
        console.log('✅ Image uploaded:', data.url);
      } else {
        setError('Failed to upload image: ' + data.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const priceValue = typeof formData.price === 'string' ? formData.price : String(formData.price || '');
    
    if (!formData.name || !formData.description || !priceValue || priceValue === '' || isNaN(Number(priceValue))) {
      setError('Please fill in name, description, and a valid price');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const price = typeof formData.price === 'string' ? parseFloat(formData.price) : (formData.price || 0);
      
      if (!price || isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        setSaving(false);
        return;
      }

      const menuItemData = {
        name: formData.name,
        description: formData.description,
        price: price,
        category: formData.category,
        image: formData.image || null,
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        spicyLevel: formData.spicyLevel || 0,
        preparationTime: formData.preparationTime || 30,
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        isPopular: formData.isPopular || false,
        // NEW: Inventory fields
        inventoryEnabled: formData.inventoryEnabled || false,
        inventory: formData.inventoryEnabled ? (formData.inventory ?? null) : null,
        outOfStockMessage: formData.inventoryEnabled ? (formData.outOfStockMessage || null) : null,
      };

      let response;
      if (editingItem) {
        response = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });
      } else {
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(menuItemData),
        });
      }

      const data = await response.json();

      if (data.success) {
        await fetchMenuItems(); // Refresh list
        cancelEdit();
        setError('');
      } else {
        setError(data.error || 'Failed to save menu item');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save menu item. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchMenuItems(); // Refresh list
        setError(''); // Clear any errors
      } else {
        // Check if this is because the item has order history
        if (data.hasOrders) {
          const userChoice = confirm(
            `⚠️ ${data.error}\n\n💡 ${data.suggestion}\n\nWould you like to mark this item as "Not Available" instead? (Click OK to mark unavailable, Cancel to keep as is)`
          );
          
          if (userChoice) {
            // Mark item as unavailable instead of deleting
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
              const updateResponse = await fetch(`/api/menu/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...item,
                  isAvailable: false,
                }),
              });
              
              const updateData = await updateResponse.json();
              if (updateData.success) {
                await fetchMenuItems(); // Refresh list
                setError(''); // Clear errors
              } else {
                setError('Failed to update menu item availability');
              }
            }
          }
        } else {
          setError(data.error || 'Failed to delete menu item');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete menu item');
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      price: item.price || 0, // Ensure price is always a number
    });
    setImagePreview(item.image || '');
    setIsAddingNew(true);
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Main Course',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      spicyLevel: 0,
      preparationTime: 30,
      isAvailable: true,
      isPopular: false,
    });
    setImagePreview('');
    setError('');
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const availableCount = menuItems.filter(item => item.isAvailable).length;
  const popularCount = menuItems.filter(item => item.isPopular).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .menu-manager-container {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
          }
          .menu-manager-card {
            padding: 1rem !important;
          }
          .menu-manager-header {
            padding: 0.75rem 1rem !important;
          }
        }
      `}} />
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)',
      paddingTop: '0.75rem',
      paddingBottom: '0.75rem',
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem'
    }}>
      <div className="menu-manager-container" style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        position: 'relative' 
      }}>
        {/* Header */}
        <div className="menu-manager-header" style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          border: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
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
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#111827',
                margin: 0,
                lineHeight: '1.2'
              }}>
                Menu Manager
              </h1>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                margin: 0,
                lineHeight: '1.2'
              }}>
                Bantu's Kitchen - Complete Menu Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              background: 'linear-gradient(to right, #10B981, #059669)',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Plus size={16} />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.5rem' }}>
              Available Dishes
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
              {availableCount}
            </p>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.5rem' }}>
              Popular Items
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#F97316', margin: 0 }}>
              {popularCount}
            </p>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.5rem' }}>
              Total Items
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
              {menuItems.length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="menu-manager-card" style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #f3f4f6',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }} />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  paddingLeft: '0.75rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '2px solid #FECDD3',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
            <p style={{ color: '#B91C1C', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '3px solid #F3F4F6',
              borderTopColor: '#F97316',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        )}

        {/* Menu Items Grid */}
        {!loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #f3f4f6',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '180px', backgroundColor: '#F3F4F6' }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ImageIcon size={48} style={{ color: '#D1D5DB' }} />
                    </div>
                  )}
                  {item.isPopular && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: '#F97316',
                      color: '#ffffff',
                      paddingLeft: '0.5rem',
                      paddingRight: '0.5rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      🔥 Hot Seller
                    </div>
                  )}
                  {!item.isAvailable && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      backgroundColor: '#EF4444',
                      color: '#ffffff',
                      paddingLeft: '0.5rem',
                      paddingRight: '0.5rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Not on Menu
                    </div>
                  )}
                  {/* Inventory Status Badge */}
                  {item.isAvailable && item.inventoryEnabled && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: item.isPopular ? '3.5rem' : '0.5rem',
                      backgroundColor: item.inventory === 0 ? '#EF4444' : item.inventory && item.inventory <= 3 ? '#F59E0B' : '#10B981',
                      color: '#ffffff',
                      paddingLeft: '0.5rem',
                      paddingRight: '0.5rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {item.inventory === 0 
                        ? (item.outOfStockMessage || 'Out of Stock') 
                        : item.inventory === null || item.inventory === undefined
                        ? 'Unlimited'
                        : `${item.inventory} left`}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                      flex: 1
                    }}>
                      {item.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                      {item.isVegetarian && (
                        <Leaf size={16} style={{ color: '#10B981' }} />
                      )}
                      {item.spicyLevel > 0 && (
                        <Flame size={16} style={{ color: '#EF4444' }} />
                      )}
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    marginBottom: '0.75rem',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IndianRupee size={16} style={{ color: '#10B981' }} />
                      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                        ₹{item.price}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
                      <Clock size={14} />
                      <span>{item.preparationTime}m</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => startEdit(item)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        backgroundColor: '#3B82F6',
                        color: '#ffffff',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '0.75rem',
                        paddingRight: '0.75rem',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        backgroundColor: '#EF4444',
                        color: '#ffffff',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <ImageIcon size={64} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
            <p style={{ color: '#6B7280', fontSize: '1rem', margin: 0 }}>
              {searchQuery || selectedCategory !== 'All' 
                ? 'No items match your search' 
                : 'No menu items yet. Add your first dish!'}
            </p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isAddingNew && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Image Upload */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Dish Image *
                    </label>
                    {imagePreview ? (
                      <>
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: '100%',
                              maxHeight: '200px',
                              objectFit: 'cover',
                              borderRadius: '0.5rem'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            display: 'flex',
                            gap: '0.5rem'
                          }}>
                            <label style={{
                              padding: '0.5rem',
                              backgroundColor: '#3B82F6',
                              color: '#ffffff',
                              borderRadius: '0.5rem',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Change Image"
                            >
                              <Upload size={14} />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              onClick={() => {
                                setImagePreview('');
                                handleInputChange('image', '');
                              }}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#EF4444',
                                color: '#ffffff',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                              }}
                              title="Remove Image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem',
                            paddingTop: '0.5rem',
                            paddingBottom: '0.5rem',
                            backgroundColor: '#F3F4F6',
                            border: '2px solid #D1D5DB',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#374151'
                          }}>
                            <Upload size={16} />
                            <span>Change Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        border: '2px dashed #D1D5DB',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        backgroundColor: '#F9FAFB'
                      }}>
                        <Upload size={32} style={{ color: '#9CA3AF', marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Click to upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.5rem'
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
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
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
                      marginBottom: '0.5rem'
                    }}>
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the dish..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Price and Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('price', value === '' ? '' : parseFloat(value));
                        }}
                        min="0"
                        step="1"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isVegetarian}
                        onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                      />
                      <Leaf size={16} style={{ color: '#10B981' }} />
                      <span style={{ fontSize: '0.875rem' }}>Vegetarian</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                      />
                      <TrendingUp size={16} style={{ color: '#F97316' }} />
                      <span style={{ fontSize: '0.875rem' }}>Popular</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                      />
                      <CheckCircle size={16} style={{ color: '#10B981' }} />
                      <span style={{ fontSize: '0.875rem' }}>Available</span>
                    </label>
                  </div>

                  {/* Save Button */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving || uploadingImage}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        background: 'linear-gradient(to right, #10B981, #059669)',
                        color: '#ffffff',
                        borderRadius: '0.5rem',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        border: 'none',
                        cursor: (saving || uploadingImage) ? 'not-allowed' : 'pointer',
                        opacity: (saving || uploadingImage) ? 0.5 : 1
                      }}
                    >
                      {saving ? (
                        <>
                          <div style={{
                            width: '1rem',
                            height: '1rem',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>{editingItem ? 'Update' : 'Create'} Menu Item</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

