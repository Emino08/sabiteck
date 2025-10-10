import React, { useState, useEffect } from 'react';
import {
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  Briefcase,
  GraduationCap,
  Clock,
  Star,
  TrendingUp,
  Building,
  Users,
  Search
} from 'lucide-react';

/**
 * FilterBasedSearch - Advanced filter-based search component
 * Provides comprehensive filtering with visual feedback and mobile support
 */
const FilterBasedSearch = ({
  onFilterChange,
  filters = {},
  availableFilters = [],
  activeFiltersCount = 0,
  onReset,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...localFilters,
      [filterKey]: value
    };
    setLocalFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {});
    setLocalFilters(resetFilters);
    onReset && onReset();
  };

  const getFilterIcon = (type) => {
    const icons = {
      date: Calendar,
      amount: DollarSign,
      salary: DollarSign,
      location: MapPin,
      category: Tag,
      status: TrendingUp,
      type: Briefcase,
      level: GraduationCap,
      experience: Users,
      deadline: Clock,
      featured: Star,
      company: Building,
      text: Search
    };
    return icons[type] || Filter;
  };

  const renderFilter = (filter) => {
    const Icon = getFilterIcon(filter.type);

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center text-xs md:text-sm font-medium text-gray-300">
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-400" />
              {filter.label}
            </label>
            <select
              value={localFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all"
            >
              <option value="">All {filter.label}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'range':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center text-xs md:text-sm font-medium text-gray-300">
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-400" />
              {filter.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={`Min ${filter.unit || ''}`}
                value={localFilters[`${filter.key}_min`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500"
              />
              <input
                type="number"
                placeholder={`Max ${filter.unit || ''}`}
                value={localFilters[`${filter.key}_max`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500"
              />
            </div>
          </div>
        );

      case 'dateRange':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center text-xs md:text-sm font-medium text-gray-300">
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-400" />
              {filter.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={localFilters[`${filter.key}_from`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
              />
              <input
                type="date"
                value={localFilters[`${filter.key}_to`] || ''}
                onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center text-xs md:text-sm font-medium text-gray-300">
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-400" />
              {filter.label}
            </label>
            <input
              type="text"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
              value={localFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500"
            />
          </div>
        );

      case 'multiSelect':
        return (
          <div key={filter.key} className="space-y-2">
            <label className="flex items-center text-xs md:text-sm font-medium text-gray-300">
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-400" />
              {filter.label}
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-hide">
              {filter.options?.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={(localFilters[filter.key] || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = localFilters[filter.key] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      handleFilterChange(filter.key, newValues);
                    }}
                    className="w-4 h-4 text-blue-600 bg-black/50 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs md:text-sm text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div key={filter.key} className="flex items-center justify-between">
            <label className="flex items-center text-xs md:text-sm font-medium text-gray-300">
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-400" />
              {filter.label}
            </label>
            <button
              onClick={() => handleFilterChange(filter.key, !localFilters[filter.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localFilters[filter.key] ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localFilters[filter.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const groupedFilters = availableFilters.reduce((acc, filter) => {
    const group = filter.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(filter);
    return acc;
  }, {});

  return (
    <div className={`${className}`}>
      {/* Filter Toggle Button (Mobile) */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="ml-2 inline-flex items-center justify-center px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 font-semibold rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              Filter-Based Search
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs md:text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Filter Groups */}
          <div className="space-y-4 md:space-y-6">
            {Object.entries(groupedFilters).map(([groupName, filters]) => (
              <div key={groupName}>
                <button
                  onClick={() => toggleSection(groupName)}
                  className="w-full flex items-center justify-between mb-3 text-sm md:text-base font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  <span>{groupName}</span>
                  {expandedSections[groupName] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {(expandedSections[groupName] !== false) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {filters.map(renderFilter)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-gray-400">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            
            const filter = availableFilters.find(f => 
              f.key === key || 
              key.startsWith(f.key + '_')
            );
            
            if (!filter) return null;

            return (
              <div
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs md:text-sm rounded-lg"
              >
                <span className="font-medium">{filter.label}:</span>
                <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                <button
                  onClick={() => handleFilterChange(key, Array.isArray(value) ? [] : '')}
                  className="ml-1 hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Predefined filter configurations
 */
export const scholarshipFilters = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    group: 'Basic Filters',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'draft', label: 'Draft' },
      { value: 'expired', label: 'Expired' },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    group: 'Basic Filters',
    options: [] // Will be populated dynamically
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'range',
    unit: '$',
    group: 'Financial'
  },
  {
    key: 'deadline',
    label: 'Deadline',
    type: 'dateRange',
    group: 'Dates'
  },
  {
    key: 'location',
    label: 'Location',
    type: 'text',
    placeholder: 'Enter location (e.g., USA, UK)',
    group: 'Location'
  },
  {
    key: 'level',
    label: 'Education Level',
    type: 'select',
    group: 'Academic',
    options: [
      { value: 'undergraduate', label: 'Undergraduate' },
      { value: 'graduate', label: 'Graduate' },
      { value: 'postgraduate', label: 'Postgraduate' },
      { value: 'doctoral', label: 'Doctoral' }
    ]
  },
  {
    key: 'featured',
    label: 'Featured Only',
    type: 'toggle',
    group: 'Special'
  }
];

export const jobFilters = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    group: 'Basic Filters',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'draft', label: 'Draft' },
      { value: 'closed', label: 'Closed' },
      { value: 'archived', label: 'Archived' }
    ]
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    group: 'Basic Filters',
    options: [] // Will be populated dynamically
  },
  {
    key: 'salary',
    label: 'Salary',
    type: 'range',
    unit: '$',
    group: 'Compensation'
  },
  {
    key: 'location',
    label: 'Location',
    type: 'text',
    placeholder: 'Enter location or "Remote"',
    group: 'Location'
  },
  {
    key: 'job_type',
    label: 'Job Type',
    type: 'multiSelect',
    group: 'Employment',
    options: [
      { value: 'full-time', label: 'Full-time' },
      { value: 'part-time', label: 'Part-time' },
      { value: 'contract', label: 'Contract' },
      { value: 'internship', label: 'Internship' },
      { value: 'freelance', label: 'Freelance' }
    ]
  },
  {
    key: 'experience_level',
    label: 'Experience Level',
    type: 'select',
    group: 'Requirements',
    options: [
      { value: 'entry', label: 'Entry Level' },
      { value: 'mid', label: 'Mid Level' },
      { value: 'senior', label: 'Senior Level' },
      { value: 'executive', label: 'Executive' }
    ]
  },
  {
    key: 'posted',
    label: 'Posted Date',
    type: 'dateRange',
    group: 'Dates'
  },
  {
    key: 'remote',
    label: 'Remote Only',
    type: 'toggle',
    group: 'Special'
  },
  {
    key: 'featured',
    label: 'Featured Only',
    type: 'toggle',
    group: 'Special'
  }
];

export default FilterBasedSearch;
