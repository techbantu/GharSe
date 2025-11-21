'use client';

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, Search, Image as ImageIcon, MapPin, Palmtree, Store, Wheat, Waves, Castle, Leaf, Flame, WheatOff, MilkOff, Sprout, Milk, ChefHat, Ban } from 'lucide-react';
import EditMenuItemModal from '@/components/admin/menu/EditMenuItemModal';

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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchMenu(); // Refresh list
          setIsModalOpen(false);
        } else {
          alert(data.error || 'Failed to save item');
        }
      } else {
        alert('Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('An error occurred while saving');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMenuItems(prev => prev.filter(item => item.id !== id));
        } else {
          alert(data.error || 'Failed to delete item');
        }
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('An error occurred while deleting');
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
            >
              {/* Image Section */}
              <div className="h-32 md:h-48 w-full bg-gray-100 relative shrink-0">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.querySelector('.placeholder')!.removeAttribute('hidden');
                    }}
                  />
                ) : null}
                <div 
                  className="placeholder" 
                  hidden={!!item.image}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#9ca3af'
                  }}
                >
                  <ImageIcon size={24} />
                </div>
                
                {/* Stock Badge - Top Left */}
                <div className="absolute top-2 left-2">
                  <span className={`
                    px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold shadow-sm backdrop-blur-sm
                    ${item.isAvailable 
                      ? 'bg-white/90 text-green-700 border border-green-100' 
                      : 'bg-red-50 text-red-700 border border-red-100'}
                  `}>
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                
                {/* Dietary Grid - Top Right (Tidy 2x2 Grid) */}
                <div className="absolute top-2 right-2 grid grid-cols-2 gap-1">
                   {/* 2x2 Grid container for dietary icons */}
                   {item.isVegetarian && (
                     <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm" title="Vegetarian">
                       <Leaf size={14} className="text-green-600" />
                     </div>
                   )}
                   {item.isVegan && (
                     <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm" title="Vegan">
                       <Sprout size={14} className="text-emerald-600" />
                     </div>
                   )}
                   {item.isGlutenFree && (
                     <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm" title="Gluten Free">
                       <WheatOff size={14} className="text-amber-600" />
                     </div>
                   )}
                   {item.isDairyFree && (
                     <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm" title="Dairy Free">
                       <MilkOff size={14} className="text-blue-500" />
                     </div>
                   )}
                   {/* Spicy Level - If simple level, maybe just one chili? Or text? User said "Indian customers read chili count instinctively" so I'll use text 🌶️ inside the box */}
                   {item.spicyLevel > 0 && (
                     <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm col-span-2 md:col-span-1" title={`Spicy Level: ${item.spicyLevel}`}>
                       <span className="text-[10px] md:text-xs flex gap-px items-center justify-center">
                         {'🌶️'.repeat(Math.min(item.spicyLevel, 3))}
                       </span>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-3 md:p-4 flex flex-col flex-1">
                <div className="mb-auto">
                  <div className="w-full">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 truncate leading-tight" title={item.name}>
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.category}</p>

                  <p className="hidden md:block text-xs text-gray-600 mt-2 line-clamp-2 h-8">
                    {item.description}
                  </p>
                  <p className="text-sm md:text-lg font-bold text-orange-600 mt-2">
                    ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 h-8 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Edit size={14} className="shrink-0" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="h-8 w-8 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center shrink-0"
                  >
                    <Trash2 size={14} className="shrink-0" />
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
    </div>
  );
}
