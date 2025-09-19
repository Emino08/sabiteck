import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Wifi, AlertCircle } from 'lucide-react'

// Enhanced loading spinner with different variants
export const LoadingSpinner = ({
  size = 'md',
  color = 'blue',
  className,
  ...props
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
    gray: 'text-gray-500'
  }

  return (
    <Loader2
      className={cn(
        sizes[size],
        colors[color],
        'animate-spin',
        className
      )}
      {...props}
    />
  )
}

// Full page loading overlay
export const LoadingOverlay = ({ message = 'Loading...', visible = true }) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-elegant p-8 flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Inline loading state for content areas
export const InlineLoader = ({
  height = 'h-32',
  message = 'Loading...',
  showMessage = true,
  className
}) => (
  <div className={cn('flex flex-col items-center justify-center space-y-4', height, className)}>
    <LoadingSpinner size="lg" />
    {showMessage && (
      <p className="text-gray-500 text-sm">{message}</p>
    )}
  </div>
)

// Skeleton loaders for different content types
export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'skeleton h-4 rounded',
          i === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className }) => (
  <div className={cn('border rounded-lg p-6 bg-white', className)}>
    <div className="space-y-4">
      <div className="skeleton h-6 w-1/2 rounded" />
      <SkeletonText lines={3} />
      <div className="skeleton h-10 w-24 rounded" />
    </div>
  </div>
)

export const SkeletonGrid = ({ items = 6, columns = 3, className }) => (
  <div className={cn(
    'grid gap-6',
    {
      'grid-cols-1': columns === 1,
      'grid-cols-1 md:grid-cols-2': columns === 2,
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': columns === 4,
    },
    className
  )}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

// Error states
export const ErrorMessage = ({
  title = 'Something went wrong',
  message = 'Please try again later',
  onRetry,
  className
}) => (
  <div className={cn('text-center py-12', className)}>
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="btn-primary"
      >
        Try Again
      </button>
    )}
  </div>
)

// Empty state component
export const EmptyState = ({
  title = 'No data found',
  message = 'There are no items to display',
  icon: Icon = Wifi,
  action,
  className
}) => (
  <div className={cn('text-center py-12', className)}>
    <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{message}</p>
    {action}
  </div>
)

// Progress bar component
export const ProgressBar = ({
  value = 0,
  max = 100,
  className,
  showPercentage = true,
  color = 'blue'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Loading button state
export const LoadingButton = ({
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => (
  <button
    className={cn(
      'btn-primary flex items-center justify-center space-x-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    disabled={loading || disabled}
    {...props}
  >
    {loading && <LoadingSpinner size="sm" color="white" />}
    <span>{children}</span>
  </button>
)
