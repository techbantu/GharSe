/**
 * NEW FILE: Menu Management Component - Admin Interface
 * 
 * Purpose: Complete CRUD interface for managing menu items
 * Features: Add, Edit, Delete dishes with image upload
 */

'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { MenuItem } from '@/types';
import ImagePositioner, { ImagePosition } from './ImagePositioner';

interface MenuManagementProps {
  initialItems?: MenuItem[];
}

const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Biryani & Rice',
  'Breads',
  'Desserts',
  'Beverages',
];

const MenuManagement: React.FC<MenuManagementProps> = ({ initialItems = [] }) => {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
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
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter items by category
  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  // Handle form input changes
  const handleInputChange = (field: keyof MenuItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload - AUTOMATIC!
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Maximum size is 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server with item ID
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
        // Store the uploaded image URL
        handleInputChange('image', data.url);
        console.log('✅ Image uploaded:', data.url);
      } else {
        alert('Failed to upload image: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    }
  };

  // Save item (create or update)
  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingItem) {
      // Update existing item
      // In production: await fetch(`/api/menu/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      setItems(prev => prev.map(item => 
        item.id === editingItem.id ? { ...item, ...formData } as MenuItem : item
      ));
    } else {
      // Create new item
      const newItem: MenuItem = {
        ...formData as MenuItem,
        id: `item-${Date.now()}`,
        image: imagePreview || '/images/placeholder.jpg',
      };
      // In production: await fetch('/api/menu', { method: 'POST', body: JSON.stringify(newItem) });
      setItems(prev => [...prev, newItem]);
    }

    // Reset form
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
  };

  // Delete item
  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    // In production: await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Start editing
  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setImagePreview(item.image || '');
    setIsAddingNew(true);
  };

  // Cancel editing
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-600 mt-1">Add, edit, or remove dishes from your menu</p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Add New Dish
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full font-semibold transition-all ${
            selectedCategory === 'All'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({items.length})
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${
              selectedCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category} ({items.filter(i => i.category === category).length})
          </button>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {editingItem ? 'Edit Dish' : 'Add New Dish'}
                </h3>
                <button
                  onClick={cancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Image Upload with Live Preview */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Dish Image *
                    </label>
                    <div className="relative">
                      {imagePreview ? (
                        <div className="space-y-3">
                          {/* Apple-Level Image Positioner */}
                          <ImagePositioner
                            imageUrl={imagePreview}
                            onPositionChange={(pos) => handleInputChange('imagePosition', pos)}
                            initialPosition={formData.imagePosition || { x: 0, y: -20, scale: 1.2 }}
                          />
                          
                          {/* Change Image Button */}
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300">
                                <Upload size={16} />
                                <span className="text-sm font-semibold">Change Image</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setImagePreview('')}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors border border-red-300 flex items-center gap-2"
                            >
                              <X size={16} />
                              <span className="text-sm font-semibold">Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 transition-colors bg-gray-50 hover:bg-gray-100">
                          <Upload size={48} className="text-gray-400 mb-2" />
                          <span className="text-sm font-semibold text-gray-700 mb-1">Click to upload image</span>
                          <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Butter Chicken"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the dish, ingredients, and taste..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      placeholder="299"
                      min="0"
                      step="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    />
                  </div>

                  {/* Original Price (for discounts) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Original Price (₹) - Optional
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice || ''}
                      onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || undefined)}
                      placeholder="399"
                      min="0"
                      step="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    />
                  </div>

                  {/* Preparation Time */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Preparation Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value))}
                      min="5"
                      step="5"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    />
                  </div>

                  {/* Spicy Level */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Spicy Level (0-3)
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(level => (
                        <button
                          key={level}
                          onClick={() => handleInputChange('spicyLevel', level)}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                            formData.spicyLevel === level
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {level === 0 ? 'None' : '🌶️'.repeat(level)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Options */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">
                      Dietary Options
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isVegetarian}
                        onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-200"
                      />
                      <span className="flex items-center gap-2">
                        <Leaf size={16} className="text-green-600" />
                        Vegetarian
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isVegan}
                        onChange={(e) => handleInputChange('isVegan', e.target.checked)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-200"
                      />
                      <span>Vegan</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isGlutenFree}
                        onChange={(e) => handleInputChange('isGlutenFree', e.target.checked)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-200"
                      />
                      <span>Gluten-Free</span>
                    </label>
                  </div>

                  {/* Status Toggles */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-200"
                      />
                      <span className="font-semibold">Available for Order</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-200"
                      />
                      <span className="font-semibold">Mark as Popular</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  <Save size={20} />
                  {editingItem ? 'Update Dish' : 'Add Dish'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Image */}
            <div className="relative h-48 bg-gray-100">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 30%'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-300" />
                </div>
              )}
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                    Unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                  {item.name}
                </h3>
                <div className="flex gap-1">
                  {item.isVegetarian && (
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Leaf size={14} className="text-green-600" />
                    </span>
                  )}
                  {item.spicyLevel > 0 && (
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <Flame size={14} className="text-red-600" />
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <IndianRupee size={14} />₹{item.price}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />{item.preparationTime}m
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(item)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No dishes in this category yet</p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="mt-4 text-primary-500 font-semibold hover:underline"
          >
            Add your first dish
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;

