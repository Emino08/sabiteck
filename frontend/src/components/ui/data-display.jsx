import React, { useState, useEffect } from 'react'
import { LoadingSpinner, ErrorMessage, EmptyState } from './loading'

// Enhanced data fetching hook with better error handling
export const useAsyncData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFunction()
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to fetch data')
      console.error('Data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

// Data renderer component with loading, error, and empty states
export const DataRenderer = ({
  data,
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyMessage = 'No data available',
  className
}) => {
  if (loading) {
    return loadingComponent || (
      <div className={className}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return errorComponent || (
      <div className={className}>
        <ErrorMessage message={error} />
      </div>
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <div className={className}>
        <EmptyState message={emptyMessage} />
      </div>
    )
  }

  return <div className={className}>{children(data)}</div>
}

// Safe data accessor with fallbacks
export const safeGet = (obj, path, fallback = null) => {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? fallback
  } catch {
    return fallback
  }
}

// Format different data types for display
export const formatData = {
  date: (date, options = {}) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
      })
    } catch {
      return 'Invalid date'
    }
  },

  currency: (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A'
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount)
    } catch {
      return `${currency} ${amount}`
    }
  },

  number: (num) => {
    if (num === null || num === undefined) return 'N/A'
    try {
      return new Intl.NumberFormat('en-US').format(num)
    } catch {
      return num.toString()
    }
  },

  truncate: (text, length = 100) => {
    if (!text) return 'N/A'
    return text.length > length ? `${text.substring(0, length)}...` : text
  },

  status: (status) => {
    const statusMap = {
      active: { label: 'Active', color: 'green' },
      inactive: { label: 'Inactive', color: 'gray' },
      pending: { label: 'Pending', color: 'yellow' },
      completed: { label: 'Completed', color: 'blue' },
      error: { label: 'Error', color: 'red' }
    }
    return statusMap[status?.toLowerCase()] || { label: status || 'Unknown', color: 'gray' }
  }
}

// Enhanced table component for data display
export const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  emptyMessage = 'No data to display',
  className,
  rowClassName,
  onRowClick
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full rounded" />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`hover:bg-gray-50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              } ${rowClassName || ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render
                    ? column.render(safeGet(row, column.accessor), row)
                    : safeGet(row, column.accessor, 'N/A')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Grid layout for card-based data display
export const DataGrid = ({
  data = [],
  renderItem,
  loading = false,
  error = null,
  emptyMessage = 'No items to display',
  columns = 3,
  gap = 6,
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const gridGap = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <DataRenderer
      data={data}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      className={className}
    >
      {(items) => (
        <div className={`grid ${gridCols[columns]} ${gridGap[gap]}`}>
          {items.map((item, index) => (
            <div key={index} className="animate-fade-in">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </DataRenderer>
  )
}

// Status badge component
export const StatusBadge = ({ status, variant = 'default' }) => {
  const statusInfo = formatData.status(status)

  const variants = {
    default: 'px-2 py-1 text-xs font-medium rounded-full',
    large: 'px-3 py-1.5 text-sm font-medium rounded-full'
  }

  const colors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`${variants[variant]} ${colors[statusInfo.color]}`}>
      {statusInfo.label}
    </span>
  )
}

// Metric display component
export const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="space-y-4">
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border p-6 hover-lift transition-smooth ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatData.number(value)}</p>
          {trend && (
            <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        )}
      </div>
    </div>
  )
}
