import React from 'react';

/**
 * AdminPageWrapper - Responsive wrapper for admin pages
 * Handles mobile-friendly layouts, headers, and actions
 */
const AdminPageWrapper = ({ 
  title, 
  description,
  icon: Icon,
  actions,
  children,
  className = '' 
}) => {
  return (
    <div className={`admin-container min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
      {/* Header Section - Responsive */}
      <div className="admin-header bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30 border-b border-gray-200">
        <div className="container-responsive py-3 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-2 md:gap-4">
              {Icon && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 md:p-3 rounded-lg md:rounded-xl text-white">
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900 mobile-heading">
                  {title}
                </h1>
                {description && (
                  <p className="text-xs md:text-base text-gray-600 mt-1 mobile-text">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Section */}
            {actions && (
              <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive py-4 md:py-8">
        {children}
      </div>
    </div>
  );
};

/**
 * AdminCard - Responsive card component for admin pages
 */
export const AdminCard = ({ 
  title, 
  icon: Icon,
  headerColor = 'from-blue-600 to-indigo-600',
  children, 
  className = '',
  actions
}) => {
  return (
    <div className={`admin-card bg-white/90 backdrop-blur-sm shadow-lg rounded-lg md:rounded-2xl overflow-hidden border border-gray-200 ${className}`}>
      {title && (
        <div className={`bg-gradient-to-r ${headerColor} text-white p-3 md:p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              {Icon && <Icon className="w-4 h-4 md:w-6 md:h-6" />}
              <h2 className="text-base md:text-2xl font-bold">{title}</h2>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-3 md:p-8">
        {children}
      </div>
    </div>
  );
};

/**
 * AdminGrid - Responsive grid container
 */
export const AdminGrid = ({ 
  children, 
  cols = 3,
  className = '' 
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[cols] || colClasses[3]} gap-3 md:gap-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * AdminStats - Responsive stats display
 */
export const AdminStats = ({ stats = [] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="stat-compact bg-white/90 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-center mb-2">
            {stat.icon && (
              <div className={`${stat.color || 'bg-blue-100 text-blue-600'} p-2 md:p-3 rounded-lg`}>
                <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
              </div>
            )}
          </div>
          <div className="stat-value text-xl md:text-3xl font-bold text-gray-900">
            {stat.value}
          </div>
          <div className="stat-label text-xs md:text-sm text-gray-600 mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * AdminTable - Responsive table wrapper
 */
export const AdminTable = ({ children, className = '' }) => {
  return (
    <div className="table-responsive overflow-x-auto -mx-3 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className={`min-w-full divide-y divide-gray-300 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * AdminSearchBar - Responsive search and filter bar
 */
export const AdminSearchBar = ({ 
  searchValue, 
  onSearchChange, 
  placeholder = 'Search...',
  filters,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 md:mb-6 ${className}`}>
      {/* Search Input */}
      <div className="flex-1">
        <input
          type="text"
          value={searchValue}
          onChange={onSearchChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Filters */}
      {filters && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {filters}
        </div>
      )}
    </div>
  );
};

/**
 * AdminEmptyState - Responsive empty state display
 */
export const AdminEmptyState = ({ 
  icon: Icon,
  title,
  description,
  action
}) => {
  return (
    <div className="text-center py-8 md:py-16">
      {Icon && (
        <div className="mx-auto w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default AdminPageWrapper;
