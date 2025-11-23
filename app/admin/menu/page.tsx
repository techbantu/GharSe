'use client';

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, Search, Image as ImageIcon, MapPin, Palmtree, Store, Wheat, Waves, Castle, Leaf, Flame, WheatOff, MilkOff, Sprout, Milk, ChefHat, Ban } from 'lucide-react';
import EditMenuItemModal from '@/components/admin/menu/EditMenuItemModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

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

// Regional cuisine configuration
const REGIONAL_CUISINES = [
  { id: 'north-indian', name: 'North Indian', icon: MapPin, color: '#DC2626' },
  { id: 'south-indian', name: 'South Indian', icon: Palmtree, color: '#EA580C' },
  { id: 'street-food', name: 'Street Food', icon: Store, color: '#F97316' },
  { id: 'gujarati', name: 'Gujarati', icon: Wheat, color: '#F59E0B' },
  { id: 'bengali', name: 'Bengali', icon: Waves, color: '#10B981' },
  { id: 'rajasthani', name: 'Rajasthani', icon: Castle, color: '#8B5CF6' },
];

// Synonyms for smart search
const SEARCH_SYNONYMS: Record<string, string[]> = {
  'sweets': ['desserts', 'mithai', 'gulab jamun', 'rasgulla'],
  'dessert': ['sweets', 'mithai'],
  'veg': ['vegetarian', 'paneer', 'dal'],
  'nonveg': ['chicken', 'mutton', 'fish', 'egg'],
  'starter': ['appetizers', 'tikka', 'kebab'],
  'drink': ['beverages', 'lassi', 'soda'],
  'rice': ['biryani', 'pulao'],
  'bread': ['naan', 'roti', 'paratha', 'kulcha'],
};

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: '',
    itemName: '',
    orderCount: 0,
    stage: 'initial' as 'initial' | 'options' | 'final-confirm' | 'success',
  });

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMenuItems(data.items);
        }
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async (itemData: MenuItem) => {
    try {
      const isNew = !itemData.id;
      const url = isNew ? '/api/menu' : `/api/menu/${itemData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      console.log('Saving menu item:', { url, method, itemData });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();
      console.log('Save response:', { status: response.status, data });

      if (response.ok) {
        if (data.success) {
          fetchMenu(); // Refresh list
          setIsModalOpen(false);
        } else {
          alert(data.error || 'Failed to save item');
        }
      } else {
        alert(data.error || `Failed to save item (${response.status})`);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('An error occurred while saving. Please check console for details.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    // STEP 1: Show modal immediately (don't make API call yet!)
    // We'll check order history when user confirms
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: name,
      orderCount: 0, // We don't know yet, will check on confirm
      stage: 'initial',
    });
  };

  const handleDeleteConfirm = async (action: 'mark-unavailable' | 'force-delete' | 'simple-delete') => {
    const { itemId, itemName, orderCount } = deleteModal;
    
    try {
      if (action === 'simple-delete') {
        // User confirmed deletion from initial modal
        // Now check if item has orders by attempting to delete
        const response = await fetch(`/api/menu/${itemId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Successfully deleted (no orders)
          setMenuItems(prev => prev.filter(item => item.id !== itemId));
          
          // Show success modal
          setDeleteModal({
            ...deleteModal,
            stage: 'success',
          });
        } else if (response.status === 409 && data.hasOrders) {
          // Item has order history - show options modal instead
          setDeleteModal({
            ...deleteModal,
            orderCount: data.orderCount || 0,
            stage: 'options',
          });
        } else {
          // Other errors
          setDeleteModal({
            ...deleteModal,
            isOpen: false,
          });
          alert(`❌ DELETION FAILED\n\n${data.error}\n\nPlease try again.`);
        }
      } else if (action === 'mark-unavailable') {
        // Mark item as unavailable
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
          await handleSave({
            ...item,
            isAvailable: false,
          });
          
          // Close modal and show success message
          setDeleteModal({
            ...deleteModal,
            isOpen: false,
          });
          
          alert(`✅ SUCCESS!\n\n"${itemName}" is now marked as "Not Available"\n\n✓ Hidden from customer menu\n✓ You can re-enable it anytime`);
        }
      } else if (action === 'force-delete') {
        // Check if we need final confirmation
        const isHighSelling = orderCount >= 10;
        
        if (deleteModal.stage === 'options') {
          // Show final confirmation
          setDeleteModal({
            ...deleteModal,
            stage: 'final-confirm',
          });
        } else {
          // Perform the force deletion
          const forceResponse = await fetch(`/api/menu/${itemId}?force=true`, {
            method: 'DELETE',
          });

          const forceData = await forceResponse.json();

          if (forceResponse.ok && forceData.success) {
            // Remove from list
            setMenuItems(prev => prev.filter(item => item.id !== itemId));
            
            // Show success modal
            setDeleteModal({
              ...deleteModal,
              stage: 'success',
            });
          } else {
            setDeleteModal({
              ...deleteModal,
              isOpen: false,
            });
            alert(`❌ DELETION FAILED\n\n${forceData.error}\n\nPlease try again.`);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setDeleteModal({
        ...deleteModal,
        isOpen: false,
      });
      alert('❌ CONNECTION ERROR\n\nUnable to delete item. Please try again.');
    }
  };

  // Helper to determine region
  const getItemRegion = (item: MenuItem): string | null => {
    const name = item.name.toLowerCase();
    const desc = item.description.toLowerCase();
    const category = item.category.toLowerCase();
    
    if (name.includes('butter') || name.includes('paneer') || name.includes('dal') || 
        name.includes('naan') || name.includes('roti') || name.includes('tikka') ||
        desc.includes('punjabi') || desc.includes('delhi') || category.includes('tandoori')) {
      return 'north-indian';
    }
    if (name.includes('dosa') || name.includes('idli') || name.includes('sambar') ||
        name.includes('biryani') || name.includes('vada') || name.includes('uttapam') ||
        desc.includes('south') || desc.includes('coastal') || desc.includes('coconut')) {
      return 'south-indian';
    }
    if (name.includes('pani puri') || name.includes('vada pav') || name.includes('chole bhature') ||
        name.includes('chaat') || name.includes('pav bhaji') || name.includes('samosa') ||
        desc.includes('street')) {
      return 'street-food';
    }
    if (name.includes('dhokla') || name.includes('thepla') || name.includes('undhiyu') ||
        name.includes('khandvi') || name.includes('fafda') ||
        desc.includes('gujarati')) {
      return 'gujarati';
    }
    if (name.includes('ilish') || name.includes('mishti') || name.includes('rasgulla') ||
        name.includes('sandesh') || name.includes('macher') ||
        desc.includes('bengali')) {
      return 'bengali';
    }
    if (name.includes('dal baati') || name.includes('laal maas') || name.includes('ghewar') ||
        name.includes('ker sangri') || desc.includes('rajasthani')) {
      return 'rajasthani';
    }
    return null;
  };

  const getCategoryColor = (category: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'All': { bg: isActive ? '#ea580c' : '#fff7ed', text: isActive ? '#ffffff' : '#ea580c' },
      'Appetizers': { bg: isActive ? '#d97706' : '#fef3c7', text: isActive ? '#ffffff' : '#d97706' },
      'Main Course': { bg: isActive ? '#7c3aed' : '#ede9fe', text: isActive ? '#ffffff' : '#7c3aed' },
      'Breads': { bg: isActive ? '#d97706' : '#fef9c3', text: isActive ? '#ffffff' : '#d97706' },
      'Desserts': { bg: isActive ? '#db2777' : '#fce7f3', text: isActive ? '#ffffff' : '#db2777' },
      'Beverages': { bg: isActive ? '#0891b2' : '#cffafe', text: isActive ? '#ffffff' : '#0891b2' },
      'Rice & Biryani': { bg: isActive ? '#ea580c' : '#fff7ed', text: isActive ? '#ffffff' : '#ea580c' },
    };
    return colors[category] || { bg: isActive ? '#ea580c' : '#f3f4f6', text: isActive ? '#ffffff' : '#374151' };
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    // 1. Region Filter
    if (selectedRegion !== 'all') {
      const region = getItemRegion(item);
      if (region !== selectedRegion) return false;
    }

    // 2. Search Filter (Smart Search)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      // Check direct match
      let matches = item.name.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query);
      
      // Check synonyms
      if (!matches) {
        for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
          if (query.includes(key)) {
            if (synonyms.some(syn => 
              item.name.toLowerCase().includes(syn) || 
              item.category.toLowerCase().includes(syn)
            )) {
              matches = true;
              break;
            }
          }
        }
      }
      if (!matches) return false;
    } else {
      // 3. Category Filter (only if no search)
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Menu Management</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Manage your menu items and pricing
          </p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            padding: '0.625rem 1rem',
            backgroundColor: '#ea580c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c2410c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: '24rem' }}>
        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
        <input
          type="text"
          placeholder="Search menu items (e.g., 'sweets', 'spicy')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '2.5rem',
            paddingRight: '1rem',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#ea580c'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
        {categories.map(category => {
          const style = getCategoryColor(category, selectedCategory === category);
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: style.bg,
                color: style.text,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {category}
              {category !== 'All' && (
                <span style={{ marginLeft: '0.5rem', opacity: 0.8, fontSize: '0.75rem' }}>
                  {menuItems.filter(i => i.category === category).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Regional Filters */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSelectedRegion('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: selectedRegion === 'all' ? '#ea580c' : '#ffffff',
            color: selectedRegion === 'all' ? '#ffffff' : '#374151',
            border: selectedRegion === 'all' ? 'none' : '1px solid #e5e7eb',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <UtensilsCrossed size={16} />
          All Cuisines
        </button>
        {REGIONAL_CUISINES.map(region => (
          <button
            key={region.id}
            onClick={() => setSelectedRegion(region.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: selectedRegion === region.id ? '#fff7ed' : '#ffffff',
              color: selectedRegion === region.id ? '#ea580c' : '#374151',
              border: selectedRegion === region.id ? '1px solid #ea580c' : '1px solid #e5e7eb',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <region.icon size={16} color={region.color} />
            {region.name}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '4rem 2rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <UtensilsCrossed size={64} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>No menu items found</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {searchTerm ? 'Try a different search term' : 'Add your first menu item to get started'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}
            >
              {/* Image Section */}
              <div style={{
                height: '200px',
                width: '100%',
                backgroundColor: '#f3f4f6',
                position: 'relative',
                flexShrink: 0,
              }}>
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.parentElement!.querySelector('.placeholder') as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="placeholder"
                  style={{ 
                    display: item.image ? 'none' : 'flex',
                    width: '100%', 
                    height: '100%',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#9ca3af'
                  }}
                >
                  <ImageIcon size={32} />
                </div>
                
                {/* Stock Badge - Top Left */}
                <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.375rem 0.625rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: item.isAvailable ? 'rgba(255, 255, 255, 0.9)' : '#fef2f2',
                    color: item.isAvailable ? '#15803d' : '#dc2626',
                    border: item.isAvailable ? '1px solid #bbf7d0' : '1px solid #fecaca',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                
                {/* Dietary Grid - Top Right (flexible) */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                  maxWidth: '120px',
                  justifyContent: 'flex-end'
                }}>
                   {item.isVegetarian && (
                     <div style={{
                       width: '28px',
                       height: '28px',
                       backgroundColor: 'rgba(255, 255, 255, 0.9)',
                       backdropFilter: 'blur(4px)',
                       borderRadius: '0.375rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                     }} title="Vegetarian">
                       <Leaf size={16} style={{ color: '#16a34a' }} />
                     </div>
                   )}
                   {item.isVegan && (
                     <div style={{
                       width: '28px',
                       height: '28px',
                       backgroundColor: 'rgba(255, 255, 255, 0.9)',
                       backdropFilter: 'blur(4px)',
                       borderRadius: '0.375rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                     }} title="Vegan">
                       <Sprout size={16} style={{ color: '#059669' }} />
                     </div>
                   )}
                   {item.isGlutenFree && (
                     <div style={{
                       width: '28px',
                       height: '28px',
                       backgroundColor: 'rgba(255, 255, 255, 0.9)',
                       backdropFilter: 'blur(4px)',
                       borderRadius: '0.375rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                     }} title="Gluten Free">
                       <WheatOff size={16} style={{ color: '#d97706' }} />
                     </div>
                   )}
                   {item.isDairyFree && (
                     <div style={{
                       width: '28px',
                       height: '28px',
                       backgroundColor: 'rgba(255, 255, 255, 0.9)',
                       backdropFilter: 'blur(4px)',
                       borderRadius: '0.375rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                     }} title="Dairy Free">
                       <MilkOff size={16} style={{ color: '#3b82f6' }} />
                     </div>
                   )}
                   {item.spicyLevel > 0 && (
                     <div style={{
                       minWidth: '28px',
                       height: '28px',
                       padding: '0 6px',
                       backgroundColor: 'rgba(255, 255, 255, 0.9)',
                       backdropFilter: 'blur(4px)',
                       borderRadius: '0.375rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       gap: '1px',
                       boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                     }} title={`Spicy Level: ${item.spicyLevel}`}>
                       <span style={{ fontSize: '12px', lineHeight: 1 }}>
                         {'🌶️'.repeat(Math.min(item.spicyLevel, 3))}
                       </span>
                     </div>
                   )}
                </div>
              </div>

              <div style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}>
                <div style={{ marginBottom: 'auto' }}>
                  <div style={{ width: '100%' }}>
                    <h3 style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                      marginBottom: '0.25rem'
                    }} title={item.name}>
                      {item.name}
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.category}
                  </p>

                  <p style={{
                    fontSize: '0.8125rem',
                    color: '#4b5563',
                    marginTop: '0.5rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                    height: '2.2rem',
                  }}>
                    {item.description}
                  </p>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#ea580c',
                    marginTop: '0.5rem'
                  }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{
                      flex: 1,
                      height: '36px',
                      backgroundColor: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fed7aa',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      transition: 'background-color 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffedd5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                  >
                    <Edit size={14} style={{ flexShrink: 0 }} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    style={{
                      height: '36px',
                      width: '36px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  >
                    <Trash2 size={14} style={{ flexShrink: 0 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditMenuItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        itemName={deleteModal.itemName}
        orderCount={deleteModal.orderCount}
        stage={deleteModal.stage}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
