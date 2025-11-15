'use client';

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

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut,
  User,
  Shield,
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
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showLoginInfo, setShowLoginInfo] = useState(false);
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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Helper function to normalize image URLs
  const normalizeImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // If it's already a full URL (http/https), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it starts with /, it's a relative path - ensure it's correct
    if (url.startsWith('/')) {
      return url;
    }
    
    // If it doesn't start with /, add it
    return `/${url}`;
  };

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

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setIsAuthenticated(true);
          setAdminUser(data.admin);
          // Fetch menu items after authentication
          fetchMenuItems();
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      }
    };

    checkAuth();
    
    // Auto-refresh menu items every 30 seconds
    const interval = setInterval(() => {
      if (isAuthenticated) {
        fetchMenuItems();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [router, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  // Close login info dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLoginInfo && !target.closest('[data-login-info]')) {
        setShowLoginInfo(false);
      }
    };

    if (showLoginInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoginInfo]);

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
        .menu-items-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 1rem !important;
          width: 100% !important;
        }
        @media (min-width: 768px) {
          .menu-items-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        @media (min-width: 1024px) {
          .menu-items-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        @media (min-width: 1280px) {
          .menu-items-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        .menu-items-grid > * {
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .stats-cards-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 0.5rem !important;
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
          .menu-items-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
            width: 100% !important;
          }
          @media (min-width: 768px) {
            .menu-items-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          @media (min-width: 1024px) {
            .menu-items-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
          .menu-items-grid > * {
            min-width: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .stats-cards-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.375rem !important;
          }
        }
        @media (max-width: 480px) {
          .menu-items-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
      `}} />
    
    {/* Show loading screen while checking authentication */}
    {!isAuthenticated ? (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #F3F4F6',
            borderTopColor: '#F97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Verifying authentication...</p>
        </div>
      </div>
    ) : (
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
                GharSe - Complete Menu Management (Operated by Sailaja)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* User Info & Login Credentials */}
            <div style={{ position: 'relative' }} data-login-info>
              <button
                onClick={() => setShowLoginInfo(!showLoginInfo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingLeft: '0.75rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                <User size={14} />
                <span>{adminUser?.name || 'Admin'}</span>
                <Shield size={12} style={{ color: '#F97316' }} />
              </button>
              
              {/* Login Info Dropdown */}
              {showLoginInfo && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #E5E7EB',
                  padding: '1rem',
                  minWidth: '280px',
                  zIndex: 1000
                }}>
                  <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, marginBottom: '0.25rem' }}>Logged in as:</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', margin: 0 }}>{adminUser?.name || 'Admin'}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>{adminUser?.email}</p>
                    <p style={{ fontSize: '0.625rem', color: '#F97316', margin: '0.25rem 0 0 0', fontWeight: 600 }}>
                      Role: {adminUser?.role || 'OWNER'}
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                      🔐 Login Credentials:
                    </p>
                    <div style={{ fontSize: '0.75rem', color: '#374151', fontFamily: 'monospace', background: '#F9FAFB', padding: '0.5rem', borderRadius: '0.25rem' }}>
                      <p style={{ margin: '0.25rem 0', color: '#6B7280' }}>Email:</p>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#111827' }}>admin@bantuskitchen.com</p>
                      <p style={{ margin: '0.25rem 0', color: '#6B7280' }}>Password:</p>
                      <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Sailaja@2025</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      backgroundColor: '#EF4444',
                      color: '#ffffff',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#DC2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#EF4444';
                    }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
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
        </div>

        {/* Stats Cards - Compact Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}
        className="stats-cards-grid"
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.625rem 0.75rem',
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
          }}>
            <p style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.25rem', margin: 0, lineHeight: '1.2' }}>
              Available Dishes
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: '1.2' }}>
              {availableCount}
            </p>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.625rem 0.75rem',
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
          }}>
            <p style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.25rem', margin: 0, lineHeight: '1.2' }}>
              Popular Items
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F97316', margin: 0, lineHeight: '1.2' }}>
              {popularCount}
            </p>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.625rem 0.75rem',
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6'
          }}>
            <p style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.25rem', margin: 0, lineHeight: '1.2' }}>
              Total Items
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: '1.2' }}>
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

        {/* Menu Items Grid - 2 columns layout (mobile & desktop) */}
        {!loading && (
          <div 
            className="menu-items-grid"
          >
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #f3f4f6',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
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
                {/* Image - Compact Size (Similar to Homepage Menu) */}
                <div style={{ 
                  position: 'relative', 
                  width: '100%',
                  height: '120px',
                  backgroundColor: '#F3F4F6',
                  overflow: 'hidden'
                }}>
                  {item.image && !imageErrors.has(item.id) ? (
                    <img
                      src={normalizeImageUrl(item.image) || ''}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const imageUrl = normalizeImageUrl(item.image);
                        console.error('❌ Image failed to load:', {
                          original: item.image,
                          normalized: imageUrl,
                          itemId: item.id,
                          itemName: item.name,
                          timestamp: new Date().toISOString()
                        });
                        setImageErrors(prev => new Set(prev).add(item.id));
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        setImageErrors(prev => {
                          const next = new Set(prev);
                          next.delete(item.id);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E5E7EB',
                      gap: '0.5rem'
                    }}>
                      <ImageIcon size={40} style={{ color: '#9CA3AF' }} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        fontWeight: 500,
                        textAlign: 'center',
                        padding: '0 0.5rem'
                      }}>
                        {item.image ? 'Image not found' : 'No image'}
                      </span>
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

                {/* Content - Compact */}
                <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#111827',
                      margin: 0,
                      flex: 1,
                      lineHeight: '1.3'
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
                    fontSize: '0.8125rem',
                    color: '#6B7280',
                    marginBottom: '0.625rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem', marginTop: 'auto' }}>
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

        {/* Add/Edit Modal - Compact Phone-Sized Cards */}
        {isAddingNew && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            zIndex: 1000,
            overflowY: 'auto'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.625rem',
              maxWidth: '380px',
              width: '100%',
              maxHeight: '95vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              margin: 'auto'
            }}>
              <div style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    {editingItem ? 'Edit Menu Item' : 'Add New Dish'}
                  </h2>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {/* Image Upload Card */}
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '0.375rem',
                    padding: '0.375rem',
                    border: '1px solid #E5E7EB'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Dish Image *
                    </label>
                    {imagePreview ? (
                      <>
                        <div style={{ position: 'relative', marginBottom: '0.25rem', borderRadius: '0.25rem', overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: '100%',
                              height: '120px',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              console.error('Preview image failed to load:', imagePreview);
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement;
                              if (fallback) {
                                fallback.innerHTML = `
                                  <div style="width: 100%; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #E5E7EB; gap: 0.5rem;">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                      <circle cx="8.5" cy="8.5" r="1.5"/>
                                      <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                    <span style="font-size: 0.75rem; color: #6B7280; font-weight: 500;">Image not found</span>
                                  </div>
                                `;
                              }
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '0.25rem',
                            right: '0.25rem',
                            display: 'flex',
                            gap: '0.25rem'
                          }}>
                            <label style={{
                              padding: '0.25rem',
                              backgroundColor: '#3B82F6',
                              color: '#ffffff',
                              borderRadius: '0.25rem',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Change Image"
                            >
                              <Upload size={10} />
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
                                padding: '0.25rem',
                                backgroundColor: '#EF4444',
                                color: '#ffffff',
                                borderRadius: '0.25rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                              }}
                              title="Remove Image"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          paddingLeft: '0.5rem',
                          paddingRight: '0.5rem',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: '#374151'
                        }}>
                          <Upload size={12} />
                          <span>Change</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        border: '2px dashed #D1D5DB',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff'
                      }}>
                        <Upload size={20} style={{ color: '#9CA3AF', marginBottom: '0.25rem' }} />
                        <span style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Tap to upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Name Card */}
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '0.375rem',
                    padding: '0.375rem',
                    border: '1px solid #E5E7EB'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.1875rem'
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
                        padding: '0.3125rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Description Card */}
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '0.375rem',
                    padding: '0.375rem',
                    border: '1px solid #E5E7EB'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.1875rem'
                    }}>
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the dish..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.3125rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        resize: 'vertical',
                        backgroundColor: '#ffffff',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Price and Category Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                    <div style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: '0.375rem',
                      padding: '0.375rem',
                      border: '1px solid #E5E7EB'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.1875rem'
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
                          padding: '0.3125rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: '0.375rem',
                      padding: '0.375rem',
                      border: '1px solid #E5E7EB'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.1875rem'
                      }}>
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.3125rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Options Card */}
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '0.375rem',
                    padding: '0.375rem',
                    border: '1px solid #E5E7EB'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Options
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isVegetarian}
                          onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                          style={{ width: '12px', height: '12px' }}
                        />
                        <Leaf size={10} style={{ color: '#10B981' }} />
                        <span style={{ fontSize: '0.6875rem' }}>Vegetarian</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isPopular}
                          onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                          style={{ width: '12px', height: '12px' }}
                        />
                        <TrendingUp size={10} style={{ color: '#F97316' }} />
                        <span style={{ fontSize: '0.6875rem' }}>Popular</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isAvailable}
                          onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                          style={{ width: '12px', height: '12px' }}
                        />
                        <CheckCircle size={10} style={{ color: '#10B981' }} />
                        <span style={{ fontSize: '0.6875rem' }}>Available</span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.125rem' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving || uploadingImage}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.1875rem',
                        paddingTop: '0.4375rem',
                        paddingBottom: '0.4375rem',
                        background: 'linear-gradient(to right, #10B981, #059669)',
                        color: '#ffffff',
                        borderRadius: '0.25rem',
                        fontWeight: 700,
                        fontSize: '0.6875rem',
                        border: 'none',
                        cursor: (saving || uploadingImage) ? 'not-allowed' : 'pointer',
                        opacity: (saving || uploadingImage) ? 0.5 : 1
                      }}
                    >
                      {saving ? (
                        <>
                          <div style={{
                            width: '0.625rem',
                            height: '0.625rem',
                            border: '2px solid #ffffff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save size={10} />
                          <span>{editingItem ? 'Update' : 'Create'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        paddingLeft: '0.625rem',
                        paddingRight: '0.625rem',
                        paddingTop: '0.4375rem',
                        paddingBottom: '0.4375rem',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        borderRadius: '0.25rem',
                        fontWeight: 600,
                        fontSize: '0.6875rem',
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
    )}
    </>
  );
}

