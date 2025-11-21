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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-[420px] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {item ? 'Edit Dish' : 'Add New Dish'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Image Preview & Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Food Photography</label>
              
              <div className="relative w-full aspect-4/3 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group transition-all hover:border-orange-300">
                {formData.image ? (
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Upload size={32} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">Paste image URL below</span>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dish Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="e.g. Butter Chicken"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    >
                      <option value="Appetizers">Appetizers</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Breads">Breads</option>
                      <option value="Rice & Biryani">Rice & Biryani</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none h-24"
                  placeholder="Describe the flavors and ingredients..."
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 my-4"></div>

            {/* Availability Toggle */}
            <div className={`p-4 rounded-xl border transition-colors ${
              formData.isAvailable 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-bold ${
                    formData.isAvailable ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {formData.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </h4>
                  <p className={`text-xs mt-0.5 ${
                    formData.isAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formData.isAvailable 
                      ? 'Available for orders' 
                      : 'Temporarily unavailable'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Dietary Tags</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'isVegetarian', label: 'Vegetarian', icon: '🥬' },
                  { key: 'isVegan', label: 'Vegan', icon: '🌱' },
                  { key: 'isGlutenFree', label: 'Gluten-Free', icon: '🌾' },
                  { key: 'isDairyFree', label: 'Dairy-Free', icon: '🥛' },
                ].map(({ key, label, icon }) => (
                  <label 
                    key={key}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${(formData as any)[key] 
                        ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200' 
                        : 'bg-white border-gray-200 hover:border-orange-200'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={(formData as any)[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 accent-orange-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      <span className="mr-2">{icon}</span>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Spicy Level */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Spiciness</label>
                <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  {['Mild', 'Medium', 'Hot', 'Extra Hot'][formData.spicyLevel] || 'No Spice'}
                  <span className="ml-1 text-xs">
                    {'🌶️'.repeat(formData.spicyLevel)}
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={formData.spicyLevel}
                onChange={(e) => setFormData({ ...formData, spicyLevel: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                <span>None</span>
                <span>Mild</span>
                <span>Medium</span>
                <span>Hot</span>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
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
