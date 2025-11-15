/**
 * ORDER FILTER BAR COMPONENT
 * 
 * Sticky filter bar with:
 * - Search box (order #, name, phone)
 * - Status filter pills
 * - Date range picker
 * - View mode toggle (grid/list)
 * 
 * Glass morphism design with backdrop blur
 */

'use client';

import { useState } from 'react';
import { OrderStatus } from '@/types';
import { Search, X, Grid3x3, List, Calendar, Filter } from 'lucide-react';

interface OrderFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: OrderStatus[];
  onStatusFilterChange: (statuses: OrderStatus[]) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onClearFilters?: () => void;
  className?: string;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string; emoji: string }[] = [
  { value: 'pending', label: 'Pending', color: '#ef4444', emoji: '🔴' },
  { value: 'preparing', label: 'Preparing', color: '#f59e0b', emoji: '🟡' },
  { value: 'ready', label: 'Ready', color: '#10b981', emoji: '🟢' },
  { value: 'delivered', label: 'Delivered', color: '#3b82f6', emoji: '✅' },
  { value: 'cancelled', label: 'Cancelled', color: '#6b7280', emoji: '❌' },
];

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
];

export default function OrderFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  className = '',
}: OrderFilterBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const toggleStatus = (status: OrderStatus) => {
    const newFilter = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];
    onStatusFilterChange(newFilter);
  };

  const handleDatePreset = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    
    onDateRangeChange({ start, end });
    setShowDatePicker(false);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter.length > 0;

  return (
    <div className={`filter-bar-sticky ${className}`}>
      <div className="filter-bar-content">
        {/* Search Box */}
        <div className="filter-section search-section">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order #, name, phone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="search-clear"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="filter-section actions-section">
          {/* Status Filter */}
          <div className="filter-dropdown">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className={`filter-button ${statusFilter.length > 0 ? 'active' : ''}`}
            >
              <Filter size={18} />
              <span>Status</span>
              {statusFilter.length > 0 && (
                <span className="filter-badge">{statusFilter.length}</span>
              )}
            </button>
            
            {showStatusFilter && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowStatusFilter(false)} />
                <div className="dropdown-menu">
                  {STATUS_OPTIONS.map(option => (
                    <label key={option.value} className="status-option">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(option.value)}
                        onChange={() => toggleStatus(option.value)}
                      />
                      <span className="status-label">
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date Picker */}
          <div className="filter-dropdown">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="filter-button"
            >
              <Calendar size={18} />
              <span>Date</span>
            </button>
            
            {showDatePicker && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowDatePicker(false)} />
                <div className="dropdown-menu date-menu">
                  {DATE_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => handleDatePreset(preset.days)}
                      className="date-preset"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
              aria-label="Grid view"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && onClearFilters && (
            <button onClick={onClearFilters} className="clear-filters">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .filter-bar-sticky {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 0;
          margin-bottom: 2rem;
        }

        .filter-bar-content {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-section {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .search-section {
          flex: 1;
          min-width: 280px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 2.75rem 0.75rem 3rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9375rem;
          color: #1e293b;
          background: white;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .search-clear {
          position: absolute;
          right: 0.75rem;
          padding: 0.25rem;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .search-clear:hover {
          background: #f1f5f9;
          color: #64748b;
        }

        .actions-section {
          flex-shrink: 0;
        }

        .filter-dropdown {
          position: relative;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          color: #64748b;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-button:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .filter-button.active {
          border-color: #f97316;
          background: #fff7ed;
          color: #f97316;
        }

        .filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #f97316;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          z-index: 60;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .status-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .status-option:hover {
          background: #f8fafc;
        }

        .status-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .status-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          color: #1e293b;
        }

        .date-menu {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .date-preset {
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #1e293b;
          font-size: 0.9375rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .date-preset:hover {
          background: #f8fafc;
        }

        .view-toggle {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: #f1f5f9;
          border-radius: 12px;
        }

        .view-button {
          padding: 0.625rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-button:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .view-button.active {
          background: white;
          color: #f97316;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .clear-filters {
          padding: 0.75rem 1rem;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fef2f2;
          color: #ef4444;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-filters:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .filter-bar-sticky {
            padding: 0.75rem 0;
          }

          .filter-bar-content {
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
          }

          .search-section {
            min-width: 100%;
          }

          .actions-section {
            width: 100%;
            justify-content: space-between;
          }

          .filter-button span:not(.filter-badge) {
            display: none;
          }

          .dropdown-menu {
            right: auto;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}

