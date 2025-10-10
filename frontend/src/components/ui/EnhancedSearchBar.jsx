import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, SlidersHorizontal, Calendar, DollarSign, MapPin, Building, Tag, TrendingUp } from 'lucide-react';

/**
 * Enhanced Search Bar for Admin Pages
 * Features:
 * - Debounced search (prevents excessive API calls)
 * - Search suggestions/history
 * - Advanced filters
 * - Real-time results count
 * - Mobile responsive
 */
const EnhancedSearchBar = ({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  filters = [],
  onFilterChange,
  suggestions = [],
  resultsCount = 0,
  showAdvancedFilters = false,
  onToggleAdvancedFilters,
  debounceTime = 500,
  className = ''
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Only call if value actually changed
      if (localSearchValue !== searchValue) {
        onSearchChange(localSearchValue);
        
        // Save to search history if not empty
        if (localSearchValue.trim()) {
          const newHistory = [
            localSearchValue,
            ...searchHistory.filter(item => item !== localSearchValue)
          ].slice(0, 10); // Keep last 10 searches
          
          setSearchHistory(newHistory);
          localStorage.setItem('search_history', JSON.stringify(newHistory));
        }
      }
    }, debounceTime);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localSearchValue, debounceTime]); // Removed searchValue and searchHistory from dependencies

  // Update local value when prop changes (only if different and input is not focused)
  useEffect(() => {
    if (searchValue !== localSearchValue && document.activeElement !== searchInputRef.current) {
      setLocalSearchValue(searchValue);
    }
  }, [searchValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    setLocalSearchValue('');
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalSearchValue(suggestion);
    onSearchChange(suggestion);
    setShowSuggestions(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  const combinedSuggestions = [
    ...suggestions,
    ...searchHistory.filter(item => 
      item.toLowerCase().includes(localSearchValue.toLowerCase()) &&
      !suggestions.includes(item)
    )
  ].slice(0, 8);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
          <Search className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={localSearchValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 md:pl-12 pr-24 md:pr-32 py-2.5 md:py-3 text-sm md:text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300"
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 md:gap-2">
          {/* Results Count */}
          {resultsCount > 0 && (
            <span className="hidden sm:inline-block px-2 md:px-3 py-1 bg-blue-500/20 text-blue-300 text-xs md:text-sm font-semibold rounded-lg">
              {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
            </span>
          )}
          
          {/* Clear Button */}
          {localSearchValue && (
            <button
              onClick={handleClear}
              className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Clear search"
            >
              <X className="h-3 w-3 md:h-4 md:w-4 text-gray-400 hover:text-white" />
            </button>
          )}
          
          {/* Advanced Filters Toggle */}
          {onToggleAdvancedFilters && (
            <button
              onClick={onToggleAdvancedFilters}
              className={`p-1.5 md:p-2 rounded-lg transition-all ${
                showAdvancedFilters 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
              title="Advanced filters"
            >
              <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (localSearchValue || combinedSuggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          {combinedSuggestions.length > 0 ? (
            <>
              <div className="max-h-64 overflow-y-auto scrollbar-hide">
                {combinedSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-3 w-3 text-gray-500" />
                    <span className="flex-1">{suggestion}</span>
                    {searchHistory.includes(suggestion) && (
                      <span className="text-xs text-gray-500">Recent</span>
                    )}
                  </button>
                ))}
              </div>
              
              {searchHistory.length > 0 && (
                <div className="border-t border-white/10 px-4 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Search History</span>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Clear history
                  </button>
                </div>
              )}
            </>
          ) : localSearchValue && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No suggestions found
            </div>
          )}
        </div>
      )}

      {/* Quick Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.map((filter, index) => (
            <button
              key={index}
              onClick={() => onFilterChange && onFilterChange(filter)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-lg transition-all ${
                filter.active
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {filter.icon && <filter.icon className="inline-block w-3 h-3 md:w-4 md:h-4 mr-1" />}
              {filter.label}
              {filter.count !== undefined && (
                <span className={`ml-1.5 ${filter.active ? 'text-blue-100' : 'text-gray-500'}`}>
                  ({filter.count})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Advanced Filters Panel
 * Provides detailed filtering options
 */
export const AdvancedFiltersPanel = ({
  filters = [],
  onApply,
  onReset,
  className = ''
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (filterKey, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleApply = () => {
    onApply && onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {});
    setLocalFilters(resetFilters);
    onReset && onReset();
  };

  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
          <Filter className="w-4 h-4 md:w-5 md:h-5" />
          Advanced Filters
        </h3>
        <button
          onClick={handleReset}
          className="text-xs md:text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {Object.entries(localFilters).map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 capitalize">
              {key.replace(/_/g, ' ')}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500"
              placeholder={`Filter by ${key.replace(/_/g, ' ')}`}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-white/10"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default EnhancedSearchBar;
